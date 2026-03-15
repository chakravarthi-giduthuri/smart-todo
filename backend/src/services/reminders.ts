import webPush from 'web-push';
import { getDueTasks, markReminderSent } from '../db/taskQueries';
import { supabase } from '../db/supabase';
import type { Task } from '../types/task';

// In-memory cache — populated from Supabase on startup
let activeSubscription: webPush.PushSubscription | null = null;

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

export async function sendPushNotification(task: Task): Promise<void> {
  if (!vapidReady || !activeSubscription) return;

  const payload = JSON.stringify({
    title: `Reminder: ${task.title}`,
    body: `Starting in 15 minutes · ${task.category}`,
    data: { taskId: task.id, url: '/' },
  });

  try {
    await webPush.sendNotification(activeSubscription, payload);
  } catch (err) {
    console.error(`[Reminders] Push failed for task ${task.id}:`, err);
    if ((err as { statusCode?: number }).statusCode === 410) {
      // Subscription expired — clear from DB and memory
      activeSubscription = null;
      await supabase.from('push_subscriptions').delete().eq('id', 1);
    }
  }
}

export async function runReminderJob(): Promise<void> {
  try {
    if (!activeSubscription) await loadSubscriptionFromDb();

    const tasks = await getDueTasks();
    if (tasks.length === 0) return;

    console.log(`[Reminders] Sending ${tasks.length} notification(s)`);
    for (const task of tasks) {
      await sendPushNotification(task);
      await markReminderSent(task.id);
    }
  } catch (err) {
    console.error('[Reminders] Job failed:', err);
  }
}
