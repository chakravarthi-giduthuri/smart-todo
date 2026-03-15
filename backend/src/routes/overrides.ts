import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { patchOverrideSchema } from '../schemas/overrideSchemas';
import { updateTaskField } from '../db/taskQueries';
import { insertOverride } from '../db/overrideQueries';

const router = Router();
router.use(requireAuth);

router.patch('/:id/override', validate(patchOverrideSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { field_changed, ai_value, user_value, reason, task_keywords } = req.body as {
      field_changed: string;
      ai_value: string;
      user_value: string;
      reason: string;
      task_keywords: string[];
    };

    const task = await updateTaskField(id, field_changed, user_value);
    await insertOverride({ user_id: req.userId, task_id: id, field_changed, ai_value, user_value, reason, task_keywords });

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

export default router;
