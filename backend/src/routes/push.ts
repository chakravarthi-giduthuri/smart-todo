import { Router } from 'express';
import { setActiveSubscription, getActiveSubscription, clearSubscription, runReminderJob } from '../services/reminders';
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

// Test endpoint — sends an immediate push to verify the whole chain works
router.post('/test', async (req, res) => {
  const sub = getActiveSubscription();
  if (!sub) {
    res.status(400).json({ error: 'No push subscription registered. Enable notifications in Settings first.' });
    return;
  }
  try {
    await webPush.sendNotification(sub, JSON.stringify({
      title: 'Test notification',
      body: 'Push notifications are working!',
      data: { url: '/' },
    }));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Manually trigger the reminder job (for debugging)
router.post('/trigger', async (req, res) => {
  await runReminderJob();
  res.json({ ok: true });
});

export default router;
