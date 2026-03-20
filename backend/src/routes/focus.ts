import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listTasks } from '../db/taskQueries';
import { buildFocusPrompt, callClaude } from '../services/claude';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const currentDate = (req.query.current_date as string | undefined) ?? new Date().toISOString();
    const tasks = await listTasks({ is_completed: false }, req.userId);

    if (tasks.length === 0) {
      return res.json({ task: null, reason: 'No incomplete tasks found.' });
    }

    const prompt = buildFocusPrompt(tasks, currentDate);
    const rawText = await callClaude(prompt);
    const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
    let parsed: { task_id: string; reason: string };
    try {
      parsed = JSON.parse(cleaned) as { task_id: string; reason: string };
    } catch {
      // Fall back to highest-priority task if Claude returns malformed JSON
      const task = tasks[0];
      return res.json({ task, reason: 'Focus on your top priority task.' });
    }

    // Resolve task_id → full Task object to match FocusResponse frontend type
    const task = tasks.find((t) => t.id === parsed.task_id) ?? tasks[0];
    res.json({ task, reason: parsed.reason });
  } catch (err) {
    next(err);
  }
});

export default router;
