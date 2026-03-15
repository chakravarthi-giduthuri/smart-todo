import { Router } from 'express';
import { setActiveSubscription } from '../services/reminders';
import type webPush from 'web-push';

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

export default router;
