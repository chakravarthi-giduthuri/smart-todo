import { Router } from 'express';
import { listTasks } from '../db/taskQueries';
import { buildFocusPrompt, callClaude } from '../services/claude';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const currentDate = (req.query.current_date as string | undefined) ?? new Date().toISOString();
    const tasks = await listTasks({ is_completed: false });

    if (tasks.length === 0) {
      return res.json({ task_id: null, reason: 'No incomplete tasks found.' });
    }

    const prompt = buildFocusPrompt(tasks, currentDate);
    const rawText = await callClaude(prompt);
    const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
    const parsed = JSON.parse(cleaned) as { task_id: string; reason: string };

    res.json({ task_id: parsed.task_id, reason: parsed.reason });
  } catch (err) {
    next(err);
  }
});

export default router;
