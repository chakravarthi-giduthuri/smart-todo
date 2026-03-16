import { getActiveTemplatesForSpawning, updateTemplate } from '../db/templateQueries';
import { supabase } from '../db/supabase';

export async function spawnTasksFromTemplates(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  const templates = await getActiveTemplatesForSpawning();

  for (const tmpl of templates) {
    // Check recurrence
    if (tmpl.recurrence === 'weekdays' && !isWeekday) continue;
    if (tmpl.recurrence === 'weekly' && dayOfWeek !== 1) continue; // Monday
    if (tmpl.recurrence === 'monthly' && new Date().getDate() !== 1) continue;

    // Spawn task using global supabase (cron runs without user JWT)
    const { error } = await supabase.from('tasks').insert({
      user_id: tmpl.user_id,
      raw_input: `[Template] ${tmpl.title}`,
      title: tmpl.title,
      category: tmpl.category,
      priority: tmpl.priority,
      scheduled_date: today,
      scheduled_time: tmpl.scheduled_time,
      duration_minutes: tmpl.duration_minutes,
      context_tags: tmpl.context_tags ?? [],
      note: tmpl.note,
      recurrence: null,
      is_completed: false,
      reminder_sent: false,
      is_archived: false,
      ai_reasoning: 'Spawned from recurring template',
      reminder_minutes_before: 15,
      timezone_offset_minutes: 0,
    });

    if (error) {
      console.error(`[TemplateSpawner] Failed to spawn task from template ${tmpl.id}:`, error.message);
      continue;
    }

    // Update last_spawned_date
    await updateTemplate(tmpl.id, { last_spawned_date: today });
    console.log(`[TemplateSpawner] Spawned task from template: ${tmpl.title}`);
  }
}
