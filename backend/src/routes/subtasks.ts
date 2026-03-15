import { Router } from 'express';
import { insertSubtask, listSubtasks, completeSubtask, deleteSubtask } from '../db/subtaskQueries';

type Params = { taskId: string; subtaskId?: string };
const router = Router({ mergeParams: true });

router.get('/', async (req, res, next) => {
  try {
    const { taskId } = req.params as unknown as Params;
    const subtasks = await listSubtasks(taskId);
    res.json({ subtasks });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { taskId } = req.params as unknown as Params;
    const { title, position } = req.body as { title: string; position?: number };
    if (!title?.trim()) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const subtask = await insertSubtask({ task_id: taskId, title: title.trim(), position });
    res.status(201).json({ subtask });
  } catch (err) {
    next(err);
  }
});

router.patch('/:subtaskId/complete', async (req, res, next) => {
  try {
    const { subtaskId } = req.params as unknown as Params;
    const subtask = await completeSubtask(subtaskId!);
    res.json({ subtask });
  } catch (err) {
    next(err);
  }
});

router.delete('/:subtaskId', async (req, res, next) => {
  try {
    const { subtaskId } = req.params as unknown as Params;
    await deleteSubtask(subtaskId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
