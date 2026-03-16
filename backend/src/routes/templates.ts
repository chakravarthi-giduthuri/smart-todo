import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../db/templateQueries';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const templates = await listTemplates(req.userId, req.userSupabase);
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, category, priority = 3, scheduled_time, duration_minutes, context_tags, recurrence = 'daily', note } = req.body;
    const tmpl = await createTemplate(
      { user_id: req.userId, title, category, priority, scheduled_time, duration_minutes, context_tags: context_tags ?? [], recurrence, note },
      req.userSupabase
    );
    res.status(201).json(tmpl);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'category', 'priority', 'scheduled_time', 'duration_minutes', 'context_tags', 'recurrence', 'note', 'is_active'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    const tmpl = await updateTemplate(req.params.id, updates, req.userSupabase);
    res.json(tmpl);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteTemplate(req.params.id, req.userSupabase);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
