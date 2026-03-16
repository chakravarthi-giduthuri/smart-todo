import cron from 'node-cron';
import { supabase } from '../db/supabase';
import { buildMorningPlanPrompt, callClaude } from '../services/claude';
import { getActiveSubscription, loadSubscriptionFromDb } from '../services/reminders';
import { spawnTasksFromTemplates } from '../services/templateSpawner';
import webPush from 'web-push';
import type { Task } from '../types/task';

async function getTodayTasks(): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('scheduled_date', today)
    .eq('is_completed', false)
    .eq('is_archived', false)
    .order('scheduled_time', { ascending: true });

  if (error) throw new Error(`getTodayTasks failed: ${error.message}`);
  return (data ?? []) as Task[];
}

async function runMorningPlanJob(): Promise<void> {
  try {
    console.log('[MorningPlan] Running morning briefing job');

    // Spawn tasks from active recurring templates
    await spawnTasksFromTemplates().catch((err) =>
      console.error('[MorningPlan] Template spawner error:', err)
    );

    if (!getActiveSubscription()) await loadSubscriptionFromDb();
    const subscription = getActiveSubscription();

    const tasks = await getTodayTasks();
    const currentDate = new Date().toISOString();
    const prompt = buildMorningPlanPrompt(tasks, currentDate);

    const rawText = await callClaude(prompt);
    const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
    const parsed = JSON.parse(cleaned) as { briefing: string };

    if (!subscription) {
      console.log('[MorningPlan] No push subscription registered — skipping notification');
      console.log('[MorningPlan] Briefing:', parsed.briefing);
      return;
    }

    const payload = JSON.stringify({
      title: 'Good morning! Here is your day plan',
      body: parsed.briefing,
      data: { url: '/' },
    });

    await webPush.sendNotification(subscription, payload);
    console.log('[MorningPlan] Morning briefing sent');
  } catch (err) {
    console.error('[MorningPlan] Job failed:', err);
  }
}

export function startMorningPlanCron() {
  // Run at 8:00 AM every day
  cron.schedule('0 8 * * *', () => {
    runMorningPlanJob().catch((err) => console.error('[Cron] Morning plan error:', err));
  });
  console.log('[Cron] Morning plan job scheduled at 8:00 AM daily');
}
