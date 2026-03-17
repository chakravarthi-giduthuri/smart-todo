import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createTaskSchema } from '../schemas/taskSchemas';
import { buildLearningContext } from '../services/preferences';
import { buildPrompt, callClaude, parseClaudeResponse, buildReschedulePrompt } from '../services/claude';
import { insertTask, listTasks, markComplete, deleteTask, archiveTask, spawnNextRecurrence, updateTaskField, snoozeTask } from '../db/taskQueries';
import type { Category } from '../types/task';
import { requireAuth } from '../middleware/auth';
import { invalidateDashboardCache } from '../cache/dashboardCache';

const router = Router();
router.use(requireAuth);

/** Parse timezone offset in minutes from a date string like "2026-03-14T07:17:30+05:30" */
function parseOffsetMinutes(currentDate: string): number {
  const match = currentDate.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === '+' ? 1 : -1;
  return sign * (parseInt(match[2]) * 60 + parseInt(match[3]));
}

router.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const { raw_input, current_date, timezone, energy_level } = req.body as {
      raw_input: string;
      current_date: string;
      timezone?: string;
      energy_level?: string;
    };
    const context = await buildLearningContext(req.userId);
    const prompt = buildPrompt(raw_input, context, current_date, timezone, energy_level);
    const rawText = await callClaude(prompt);
    const parsed = parseClaudeResponse(rawText);

    const task = await insertTask({
      user_id: req.userId,
      raw_input,
      title: parsed.title,
      category: parsed.category as import('../types/task').Category,
      priority: parsed.priority as import('../types/task').Priority,
      scheduled_date: parsed.scheduled_date,
      scheduled_time: parsed.scheduled_time,
      duration_minutes: parsed.duration_minutes,
      ai_reasoning: parsed.reasoning,
      reminder_minutes_before: parsed.reminder_minutes_before,
      timezone_offset_minutes: parseOffsetMinutes(current_date),
      recurrence: parsed.recurrence,
      context_tags: parsed.context_tags,
      note: parsed.note,
    }, req.userSupabase);
    invalidateDashboardCache(req.userId);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category as Category | undefined,
      is_completed: req.query.completed !== undefined ? req.query.completed === 'true' : undefined,
    };
    const tasks = await listTasks(filters, req.userId, req.userSupabase);
    const etag = `"${tasks.length}-${tasks[0]?.id ?? 'empty'}"`;
    res.set('ETag', etag);
    if (req.headers['if-none-match'] === etag) return res.status(304).send();
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await markComplete(req.params.id, req.userSupabase);
    if (task.recurrence) {
      spawnNextRecurrence(task).catch((err) => console.error('[Recurrence] spawn failed:', err));
    }
    invalidateDashboardCache(req.userId);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    const task = await archiveTask(req.params.id, req.userSupabase);
    invalidateDashboardCache(req.userId);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteTask(req.params.id, req.userSupabase);
    invalidateDashboardCache(req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reschedule', async (req, res, next) => {
  try {
    const { current_date } = req.body as { current_date: string };
    const { data: taskRow, error } = await req.userSupabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (error || !taskRow) return res.status(404).json({ error: 'Task not found' });

    const prompt = buildReschedulePrompt(taskRow as import('../types/task').Task, current_date ?? new Date().toISOString());
    const rawText = await callClaude(prompt);

    // Robust JSON extraction — handles any leading/trailing text Claude may add
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Claude response');
    const parsed = JSON.parse(jsonMatch[0]) as { scheduled_date: string; scheduled_time: string; reason?: string };

    if (!parsed.scheduled_date || !parsed.scheduled_time) {
      throw new Error(`Claude returned incomplete schedule: ${JSON.stringify(parsed)}`);
    }

    // BUG-013: Deadline protection — warn if AI is moving a far-future date to an earlier one
    let deadline_warning: string | undefined;
    if (taskRow.scheduled_date) {
      const originalMs  = new Date(taskRow.scheduled_date).getTime();
      const currentMs   = new Date(current_date ?? new Date().toISOString()).getTime();
      const proposedMs  = new Date(parsed.scheduled_date).getTime();
      const hoursAhead  = (originalMs - currentMs) / (1000 * 60 * 60);
      if (hoursAhead > 48 && proposedMs < originalMs) {
        deadline_warning = `AI moved this from ${taskRow.scheduled_date} to ${parsed.scheduled_date}. Confirm to keep the change.`;
      }
    }

    // Single atomic update — also resets reminder_sent so the new time triggers a reminder
    const { data: task, error: updateError } = await req.userSupabase
      .from('tasks')
      .update({
        scheduled_date: parsed.scheduled_date,
        scheduled_time: parsed.scheduled_time,
        reminder_sent: false,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update task: ${updateError.message}`);
    const reason = parsed.reason ?? null;
    res.json({ task, reason, ...(deadline_warning ? { deadline_warning } : {}) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/snooze', async (req, res, next) => {
  try {
    const { minutes } = req.body as { minutes: number };
    if (typeof minutes !== 'number' || minutes < 1) {
      return res.status(400).json({ error: 'minutes must be a positive number' });
    }
    const snoozedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
    const task = await snoozeTask(req.params.id, snoozedUntil, req.userSupabase);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/note', async (req, res, next) => {
  try {
    const { note } = req.body as { note: string };
    if (typeof note !== 'string') {
      return res.status(400).json({ error: 'note must be a string' });
    }
    const task = await updateTaskField(req.params.id, 'note', note, req.userSupabase);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/schedule', async (req, res, next) => {
  try {
    const { scheduled_date, scheduled_time } = req.body as { scheduled_date: string; scheduled_time: string };
    if (!scheduled_date || !scheduled_time) {
      return res.status(400).json({ error: 'scheduled_date and scheduled_time are required' });
    }
    const updatedDate = await updateTaskField(req.params.id, 'scheduled_date', scheduled_date, req.userSupabase);
    void updatedDate;
    const task = await updateTaskField(req.params.id, 'scheduled_time', scheduled_time, req.userSupabase);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/nag', async (req, res, next) => {
  try {
    const { interval_minutes } = req.body as { interval_minutes: number | null };
    if (interval_minutes !== null && (typeof interval_minutes !== 'number' || interval_minutes < 1)) {
      return res.status(400).json({ error: 'interval_minutes must be a positive number or null' });
    }
    const { data: task, error } = await req.userSupabase
      .from('tasks')
      .update({ nag_interval_minutes: interval_minutes, nag_count: 0, nag_last_sent_at: null })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();
    if (error || !task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

export default router;
