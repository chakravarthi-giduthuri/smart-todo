import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { addDependency, listDependencies, removeDependency } from '../db/dependencyQueries';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const { taskId } = req.params as unknown as { taskId: string };
    const { depends_on_id } = req.body as { depends_on_id: string };

    if (!depends_on_id || typeof depends_on_id !== 'string') {
      return res.status(400).json({ error: 'depends_on_id is required' });
    }

    const dependency = await addDependency(taskId, depends_on_id);
    res.status(201).json({ dependency });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { taskId } = req.params as unknown as { taskId: string };
    const dependencies = await listDependencies(taskId);
    res.json({ dependencies });
  } catch (err) {
    next(err);
  }
});

router.delete('/:depId', async (req, res, next) => {
  try {
    const { taskId } = req.params as unknown as { taskId: string };
    const { depId } = req.params;
    await removeDependency(taskId, depId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
