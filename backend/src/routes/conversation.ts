import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { buildConversationPrompt, callClaude } from '../services/claude';
import type { ConversationMessage } from '../services/claude';
import { insertTask } from '../db/taskQueries';
import type { Category, Priority } from '../types/task';

const router = Router();
router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const { messages, current_date, timezone } = req.body as {
      messages: ConversationMessage[];
      current_date: string;
      timezone?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const prompt = buildConversationPrompt(messages, current_date ?? new Date().toISOString(), timezone);
    const rawText = await callClaude(prompt);
    const cleaned = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    if (parsed.type === 'question') {
      return res.json({ type: 'question', content: String(parsed.content) });
    }

    if (parsed.type === 'task') {
      const validTags = ['@home', '@work', '@phone', '@5min', '@errands'];
      const rawTags = Array.isArray(parsed.context_tags) ? parsed.context_tags : [];
      const context_tags = (rawTags as unknown[]).filter(
        (t): t is string => typeof t === 'string' && validTags.includes(t),
      );

      const task = await insertTask({
        user_id: req.userId,
        raw_input: messages[messages.length - 1]?.content ?? '',
        title: String(parsed.title ?? '').slice(0, 60),
        category: (parsed.category as Category) ?? 'Personal',
        priority: (Number(parsed.priority) as Priority) ?? 3,
        scheduled_date: parsed.scheduled_date ? String(parsed.scheduled_date) : null,
        scheduled_time: parsed.scheduled_time ? String(parsed.scheduled_time) : null,
        duration_minutes: parsed.duration_minutes ? Number(parsed.duration_minutes) : null,
        ai_reasoning: String(parsed.reasoning ?? ''),
        reminder_minutes_before: parsed.reminder_minutes_before ? Number(parsed.reminder_minutes_before) : 15,
        timezone_offset_minutes: 0,
        recurrence: (parsed.recurrence as string | null) ?? null,
        context_tags,
        note: parsed.note ? String(parsed.note) : null,
      }, req.userSupabase);

      return res.status(201).json({ type: 'task', task });
    }

    res.status(422).json({ error: 'Unexpected Claude response type' });
  } catch (err) {
    next(err);
  }
});

export default router;
