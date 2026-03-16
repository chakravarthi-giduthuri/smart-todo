import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createShare, getShare, completeShare } from '../db/sharesQueries';

const router = Router();

// POST /api/shares — create a share link (requires auth)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { task_id, recipient_email } = req.body as { task_id: string; recipient_email?: string };

    if (!task_id || typeof task_id !== 'string') {
      return res.status(400).json({ error: 'task_id is required' });
    }

    const share = await createShare(task_id, recipient_email);
    res.status(201).json({ share });
  } catch (err) {
    next(err);
  }
});

// GET /api/shares/:token — public (no auth needed for recipients)
router.get('/:token', async (req, res, next) => {
  try {
    const result = await getShare(req.params.token);
    if (!result) return res.status(404).json({ error: 'Share not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/shares/:token/complete — public (recipient marks task done)
router.patch('/:token/complete', async (req, res, next) => {
  try {
    const share = await completeShare(req.params.token);
    res.json({ share });
  } catch (err) {
    next(err);
  }
});

export default router;
