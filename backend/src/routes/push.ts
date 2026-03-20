import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  setActiveSubscription, getActiveSubscription, clearSubscription, runReminderJob,
  setExpoToken, getExpoToken, clearExpoToken, sendExpoPush,
  loadExpoTokenFromDb, loadSubscriptionFromDb,
} from '../services/reminders';
import { supabase } from '../db/supabase';
import webPush from 'web-push';

const router = Router();

router.post('/subscribe', (req, res) => {
  const subscription = req.body as webPush.PushSubscription;
  if (!subscription?.endpoint) {
    res.status(400).json({ error: 'Invalid push subscription' });
    return;
  }
  setActiveSubscription(subscription);
  res.status(201).json({ ok: true });
});

router.delete('/subscribe', async (req, res) => {
  try {
    await clearSubscription();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Expo push token (mobile app) ──────────────────────────────────────────────

router.post('/register-expo', async (req, res) => {
  const { expo_token } = req.body as { expo_token?: string };
  if (!expo_token || !expo_token.startsWith('ExponentPushToken[')) {
    res.status(400).json({ error: `Invalid expo_token format. Got: ${String(expo_token).slice(0, 30)}` });
    return;
  }
  try {
    // Set in-memory immediately
    await setExpoToken(expo_token);

    // Also attempt DB write directly and report the outcome
    const { error: dbError } = await supabase
      .from('expo_push_tokens')
      .upsert({ id: 1, token: expo_token, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    console.log('[push] expo token registered:', expo_token.slice(0, 30) + '...',
      dbError ? `DB ERROR: ${dbError.message}` : 'DB write OK');

    res.status(201).json({
      ok: true,
      dbPersisted: !dbError,
      dbError: dbError ? `${dbError.code}: ${dbError.message}` : null,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/register-expo', async (req, res) => {
  try {
    await clearExpoToken();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Diagnostic endpoint — shows current server-side push state + DB health
router.get('/status', async (req, res) => {
  // Try DB read directly
  const { data: dbRow, error: dbError } = await supabase
    .from('expo_push_tokens')
    .select('token, updated_at')
    .eq('id', 1)
    .single();

  // Also reload into memory
  if (!getExpoToken()) await loadExpoTokenFromDb();
  if (!getActiveSubscription()) await loadSubscriptionFromDb();

  res.json({
    hasExpoToken: !!getExpoToken(),
    expoTokenPreview: getExpoToken()?.slice(0, 40) ?? null,
    hasWebSubscription: !!getActiveSubscription(),
    db: {
      tokenInDb: dbRow?.token ? dbRow.token.slice(0, 40) + '…' : null,
      updatedAt: dbRow?.updated_at ?? null,
      error: dbError ? `${dbError.code}: ${dbError.message}` : null,
    },
  });
});

// Test endpoint — sends an immediate push to verify the whole chain works
router.post('/test', async (req, res) => {
  // Reload from DB in case the server restarted since the token was registered
  if (!getExpoToken()) await loadExpoTokenFromDb();
  if (!getActiveSubscription()) await loadSubscriptionFromDb();

  const expoToken = getExpoToken();
  const webSub = getActiveSubscription();

  if (!expoToken && !webSub) {
    res.status(400).json({ error: 'No push subscription registered. Enable notifications in Settings first.' });
    return;
  }

  try {
    if (expoToken) {
      await sendExpoPush(expoToken, 'Test notification', 'Push notifications are working! 🎉', {});
    }
    if (webSub) {
      await webPush.sendNotification(webSub, JSON.stringify({
        title: 'Test notification',
        body: 'Push notifications are working!',
        data: { url: '/' },
      }));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Manually trigger the reminder job (for debugging — auth required)
router.post('/trigger', requireAuth, async (req, res) => {
  await runReminderJob();
  res.json({ ok: true });
});

export default router;
