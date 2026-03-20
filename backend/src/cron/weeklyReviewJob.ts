import cron from 'node-cron';
import { aggregateStats } from '../services/dashboard';
import { buildWeeklyReviewPrompt, callClaude } from '../services/claude';
import { getActiveSubscription, loadSubscriptionFromDb, getExpoToken, loadExpoTokenFromDb, sendExpoPush } from '../services/reminders';
import { supabase } from '../db/supabase';
import webPush from 'web-push';

interface WeeklyReviewParsed {
  summary: string;
  wins: string[];
  improvement_areas: string[];
  next_week_suggestions: string[];
  score: number;
  push_message: string;
}

async function runWeeklyReviewJob(): Promise<void> {
  try {
    console.log('[WeeklyReview] Running weekly review job');

    if (!getActiveSubscription()) await loadSubscriptionFromDb();
    if (!getExpoToken()) await loadExpoTokenFromDb();
    const subscription = getActiveSubscription();
    const expoToken = getExpoToken();

    const stats = await aggregateStats();
    const currentDate = new Date().toISOString();
    const prompt = buildWeeklyReviewPrompt(stats as unknown as Record<string, unknown>, currentDate);

    const rawText = await callClaude(prompt);
    const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
    let parsed: WeeklyReviewParsed;
    try {
      parsed = JSON.parse(cleaned) as WeeklyReviewParsed;
    } catch {
      console.error('[WeeklyReview] Failed to parse Claude response as JSON');
      return;
    }

    console.log('[WeeklyReview] Structured review:', JSON.stringify(parsed, null, 2));

    // Compute week_start (Monday of current week)
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // Attempt to save review — user_id from push_subscriptions metadata if available
    try {
      const { data: subRow } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .eq('id', 1)
        .single();

      const userId = (subRow as { user_id?: string } | null)?.user_id ?? null;

      if (userId) {
        const { error: insertError } = await supabase.from('weekly_reviews').insert({
          user_id: userId,
          week_start: weekStartStr,
          score: parsed.score,
          summary: parsed.summary,
          wins: parsed.wins,
          improvement_areas: parsed.improvement_areas,
          next_week_suggestions: parsed.next_week_suggestions,
        });
        if (insertError) console.error('[WeeklyReview] Failed to save review:', insertError.message);
        else console.log('[WeeklyReview] Review saved to DB');
      } else {
        console.log('[WeeklyReview] No user_id available — skipping DB save');
      }
    } catch (saveErr) {
      console.error('[WeeklyReview] DB save error:', saveErr);
    }

    if (!subscription && !expoToken) {
      console.log('[WeeklyReview] No push subscription — skipping notification');
      return;
    }

    if (expoToken) {
      try {
        await sendExpoPush(expoToken, 'Your weekly review is ready', parsed.push_message, { url: '/dashboard' });
        console.log('[WeeklyReview] Weekly review sent via Expo push');
      } catch (err) {
        console.error('[WeeklyReview] Expo push failed:', err);
      }
    }

    if (subscription) {
      const payload = JSON.stringify({
        title: 'Your weekly review is ready',
        body: parsed.push_message,
        data: { url: '/dashboard' },
      });
      await webPush.sendNotification(subscription, payload);
      console.log('[WeeklyReview] Weekly review sent via web push');
    }
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
