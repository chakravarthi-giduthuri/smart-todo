import webPush from 'web-push';
import { getDueTasks, markReminderSent } from '../db/taskQueries';
import { supabase } from '../db/supabase';
import type { Task } from '../types/task';

// In-memory cache — populated from Supabase on startup
let activeSubscription: webPush.PushSubscription | null = null;
let activeExpoToken: string | null = null;

// ── Expo Push helpers ──────────────────────────────────────────────────────────

export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default', priority: 'high' }),
  });
  const result = await response.json() as { data?: { status: string; message?: string } };
  if (result?.data?.status === 'error') {
    console.error('[Expo push] error:', result.data.message);
    // DeviceNotRegistered — token is stale
    if (result.data.message?.includes('DeviceNotRegistered')) {
      activeExpoToken = null;
      await supabase.from('expo_push_tokens').delete().eq('id', 1);
    }
  }
}

export async function setExpoToken(token: string): Promise<void> {
  activeExpoToken = token;
  await supabase
    .from('expo_push_tokens')
    .upsert({ id: 1, token, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .then(({ error }) => {
      if (error) console.warn('[Expo push] Could not persist token:', error.message);
    });
}

export function getExpoToken(): string | null {
  return activeExpoToken;
}

export async function clearExpoToken(): Promise<void> {
  activeExpoToken = null;
  await supabase.from('expo_push_tokens').delete().eq('id', 1);
}

export async function loadExpoTokenFromDb(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('expo_push_tokens')
      .select('token')
      .eq('id', 1)
      .single();
    if (!error && data?.token) {
      activeExpoToken = data.token as string;
      console.log('[Expo push] Token loaded from database');
    }
  } catch {
    // Table may not exist yet — run the SQL migration in Supabase dashboard:
    // CREATE TABLE IF NOT EXISTS expo_push_tokens (
    //   id integer PRIMARY KEY DEFAULT 1,
    //   token text NOT NULL,
    //   updated_at timestamptz DEFAULT now()
    // );
  }
}

function initWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_CONTACT_EMAIL;

  if (!publicKey || !privateKey || !email) {
    console.warn('[Reminders] VAPID keys not configured — push notifications disabled');
    return false;
  }

  webPush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  return true;
}

const vapidReady = initWebPush();

/** Persist subscription to Supabase and cache in memory. */
export async function setActiveSubscription(sub: webPush.PushSubscription) {
  activeSubscription = sub;
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ id: 1, endpoint: sub.endpoint, keys: sub.keys }, { onConflict: 'id' });
  if (error) console.error('[Reminders] Failed to persist subscription:', error.message);
}

/** Load subscription from Supabase into memory (called on server start). */
export async function loadSubscriptionFromDb() {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('id', 1)
      .single();

    if (error || !data) return;
    activeSubscription = { endpoint: data.endpoint, keys: data.keys } as webPush.PushSubscription;
    console.log('[Reminders] Subscription loaded from database');
  } catch {
    // Table might not exist yet — that's fine
  }
}

export function getActiveSubscription() {
  return activeSubscription;
}

export async function clearSubscription(): Promise<void> {
  activeSubscription = null;
  await supabase.from('push_subscriptions').delete().eq('id', 1);
}

async function getHighPriorityIncompleteCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('is_completed', false)
      .lte('priority', 2);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function sendPushNotification(task: Task): Promise<void> {
  const reminderMin = task.reminder_minutes_before ?? 15;
  const title = `Reminder: ${task.title}`;
  const bodyText = reminderMin === 0
    ? `Starting now · ${task.category}`
    : `Starting in ${reminderMin} min · ${task.category}`;

  const badgeCount = await getHighPriorityIncompleteCount();

  // Send to Expo (mobile)
  if (activeExpoToken) {
    try {
      await sendExpoPush(activeExpoToken, title, bodyText, { taskId: task.id });
    } catch (err) {
      console.error(`[Reminders] Expo push failed for task ${task.id}:`, err);
    }
  }

  // Send to web-push (browser)
  if (vapidReady && activeSubscription) {
    const payload = JSON.stringify({
      title,
      body: bodyText,
      data: { taskId: task.id, url: '/' },
      badgeCount,
    });
    try {
      await webPush.sendNotification(activeSubscription, payload);
    } catch (err) {
      console.error(`[Reminders] Web push failed for task ${task.id}:`, err);
      if ((err as { statusCode?: number }).statusCode === 410) {
        activeSubscription = null;
        await supabase.from('push_subscriptions').delete().eq('id', 1);
      }
    }
  }
}

export async function runNagJob(): Promise<void> {
  try {
    if (!activeSubscription) await loadSubscriptionFromDb();
    if (!activeExpoToken) await loadExpoTokenFromDb();
    if (!activeSubscription && !activeExpoToken) return;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const nowTimeStr = now.toISOString().slice(11, 16); // HH:MM

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_completed', false)
      .lte('priority', 2)
      .not('nag_interval_minutes', 'is', null)
      .or(`scheduled_date.lt.${todayStr},and(scheduled_date.eq.${todayStr},scheduled_time.lt.${nowTimeStr})`);

    if (error) {
      console.error('[Nag] Query failed:', error.message);
      return;
    }
    if (!tasks || tasks.length === 0) return;

    for (const task of tasks) {
      const nagCount: number = task.nag_count ?? 0;
      if (nagCount >= 5) continue;

      const intervalMs = (task.nag_interval_minutes as number) * 60_000;
      const lastSent = task.nag_last_sent_at ? new Date(task.nag_last_sent_at as string).getTime() : null;
      const isDue = lastSent === null || (now.getTime() - lastSent) >= intervalMs;
      if (!isDue) continue;

      const nagTitle = `⚠️ Overdue: ${task.title as string}`;
      const nagBody = `${nagCount + 1}x reminder — still pending`;
      let sent = false;

      if (activeExpoToken) {
        try {
          await sendExpoPush(activeExpoToken, nagTitle, nagBody, { taskId: task.id });
          sent = true;
        } catch (err) {
          console.error(`[Nag] Expo push failed for task ${task.id as string}:`, err);
        }
      }

      if (vapidReady && activeSubscription) {
        try {
          await webPush.sendNotification(activeSubscription, JSON.stringify({
            title: nagTitle,
            body: nagBody,
            data: { taskId: task.id, url: '/' },
          }));
          sent = true;
        } catch (err) {
          console.error(`[Nag] Web push failed for task ${task.id as string}:`, err);
          if ((err as { statusCode?: number }).statusCode === 410) {
            activeSubscription = null;
            await supabase.from('push_subscriptions').delete().eq('id', 1);
            break;
          }
        }
      }

      if (sent) {
        await supabase
          .from('tasks')
          .update({ nag_last_sent_at: now.toISOString(), nag_count: nagCount + 1 })
          .eq('id', task.id);
        console.log(`[Nag] Sent nag #${nagCount + 1} for task "${task.title as string}"`);
      }
    }
  } catch (err) {
    console.error('[Nag] Job failed:', err);
  }
}

export async function runReminderJob(): Promise<void> {
  try {
    console.log(`[Reminders] Cron tick — vapidReady=${vapidReady} hasWebSub=${!!activeSubscription} hasExpoToken=${!!activeExpoToken}`);
    if (!activeSubscription) await loadSubscriptionFromDb();
    if (!activeExpoToken) await loadExpoTokenFromDb();

    if (!activeSubscription && !activeExpoToken) {
      console.log('[Reminders] No push subscriptions registered — skipping');
      return;
    }

    const tasks = await getDueTasks();
    console.log(`[Reminders] Due tasks: ${tasks.length}`);
    if (tasks.length === 0) return;

    for (const task of tasks) {
      console.log(`[Reminders] Notifying task "${task.title}" (reminder=${task.reminder_minutes_before}min)`);
      await sendPushNotification(task);
      await markReminderSent(task.id);
    }
  } catch (err) {
    console.error('[Reminders] Job failed:', err);
  }
}
