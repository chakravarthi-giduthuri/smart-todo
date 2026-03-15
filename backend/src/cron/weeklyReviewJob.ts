import cron from 'node-cron';
import { aggregateStats } from '../services/dashboard';
import { buildWeeklyReviewPrompt, callClaude } from '../services/claude';
import { getActiveSubscription, loadSubscriptionFromDb } from '../services/reminders';
import webPush from 'web-push';

async function runWeeklyReviewJob(): Promise<void> {
  try {
    console.log('[WeeklyReview] Running weekly review job');

    if (!getActiveSubscription()) await loadSubscriptionFromDb();
    const subscription = getActiveSubscription();

    const stats = await aggregateStats();
    const currentDate = new Date().toISOString();
    const prompt = buildWeeklyReviewPrompt(stats as unknown as Record<string, unknown>, currentDate);

    const rawText = await callClaude(prompt);
    const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
    const parsed = JSON.parse(cleaned) as { review: string };

    if (!subscription) {
      console.log('[WeeklyReview] No push subscription — skipping notification');
      console.log('[WeeklyReview] Review:', parsed.review);
      return;
    }

    const payload = JSON.stringify({
      title: 'Your weekly review is ready',
      body: parsed.review,
      data: { url: '/dashboard' },
    });

    await webPush.sendNotification(subscription, payload);
    console.log('[WeeklyReview] Weekly review sent');
  } catch (err) {
    console.error('[WeeklyReview] Job failed:', err);
  }
}

export function startWeeklyReviewCron() {
  // Run every Sunday at 9:00 AM
  cron.schedule('0 9 * * 0', () => {
    runWeeklyReviewJob().catch((err) => console.error('[Cron] Weekly review error:', err));
  });
  console.log('[Cron] Weekly review job scheduled every Sunday at 9:00 AM');
}
