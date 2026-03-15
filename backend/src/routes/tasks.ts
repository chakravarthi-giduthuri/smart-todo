import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createTaskSchema } from '../schemas/taskSchemas';
import { buildRules } from '../services/preferences';
import { buildPrompt, callClaude, parseClaudeResponse } from '../services/claude';
import { insertTask, listTasks, markComplete, deleteTask } from '../db/taskQueries';
import type { Category } from '../types/task';

const router = Router();

router.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const { raw_input, current_date, timezone } = req.body as { raw_input: string; current_date: string; timezone?: string };
    const rules = await buildRules();
    const prompt = buildPrompt(raw_input, rules, current_date, timezone);
    const rawText = await callClaude(prompt);
    const parsed = parseClaudeResponse(rawText);

    const task = await insertTask({
      raw_input,
      title: parsed.title,
      category: parsed.category as import('../types/task').Category,
      priority: parsed.priority as import('../types/task').Priority,
      scheduled_date: parsed.scheduled_date,
      scheduled_time: parsed.scheduled_time,
      duration_minutes: parsed.duration_minutes,
      ai_reasoning: parsed.reasoning,
      reminder_minutes_before: parsed.reminder_minutes_before,
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
    const tasks = await listTasks(filters);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await markComplete(req.params.id);
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

export default router;
