import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createTaskSchema } from '../schemas/taskSchemas';
import { buildLearningContext } from '../services/preferences';
import { buildPrompt, callClaude, parseClaudeResponse, buildReschedulePrompt } from '../services/claude';
import { insertTask, listTasks, markComplete, deleteTask, archiveTask, spawnNextRecurrence, updateTaskField, snoozeTask } from '../db/taskQueries';
import type { Category } from '../types/task';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';

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
    });
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
    const tasks = await listTasks(filters, req.userId);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await markComplete(req.params.id);
    if (task.recurrence) {
      spawnNextRecurrence(task).catch((err) => console.error('[Recurrence] spawn failed:', err));
    }
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    const task = await archiveTask(req.params.id);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteTask(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/reschedule', async (req, res, next) => {
  try {
    const { current_date } = req.body as { current_date: string };
    const { data: taskRow, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (error || !taskRow) return res.status(404).json({ error: 'Task not found' });

    const prompt = buildReschedulePrompt(taskRow as import('../types/task').Task, current_date ?? new Date().toISOString());
    const rawText = await callClaude(prompt);
    const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
    const parsed = JSON.parse(cleaned) as { scheduled_date: string; scheduled_time: string };

    const updatedDate = await updateTaskField(req.params.id, 'scheduled_date', parsed.scheduled_date);
    const task = await updateTaskField(req.params.id, 'scheduled_time', parsed.scheduled_time);
    void updatedDate;
    res.json({ task });
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
    const task = await snoozeTask(req.params.id, snoozedUntil);
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
    const task = await updateTaskField(req.params.id, 'note', note);
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

export default router;
