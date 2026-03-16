import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { insertSubtask, listSubtasks, completeSubtask, deleteSubtask } from '../db/subtaskQueries';
import type { Request, Response } from 'express';

type Params = { taskId: string; subtaskId?: string };
const router = Router({ mergeParams: true });
router.use(requireAuth);

async function verifyTaskOwnership(taskId: string, req: Request, res: Response): Promise<boolean> {
  const { data, error } = await req.userSupabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', req.userId)
    .single();
  if (error || !data) {
    res.status(404).json({ error: 'Task not found' });
    return false;
  }
  return true;
}

router.get('/', async (req, res, next) => {
  try {
    const { taskId } = req.params as unknown as Params;
    if (!await verifyTaskOwnership(taskId, req, res)) return;
    const subtasks = await listSubtasks(taskId, req.userSupabase);
    res.json({ subtasks });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { taskId } = req.params as unknown as Params;
    if (!await verifyTaskOwnership(taskId, req, res)) return;
    const { title, position } = req.body as { title: string; position?: number };
    if (!title?.trim()) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const subtask = await insertSubtask({ task_id: taskId, title: title.trim(), position }, req.userSupabase);
    res.status(201).json({ subtask });
  } catch (err) {
    next(err);
  }
});

router.patch('/:subtaskId/complete', async (req, res, next) => {
  try {
    const { taskId, subtaskId } = req.params as unknown as Params;
    if (!await verifyTaskOwnership(taskId, req, res)) return;
    const subtask = await completeSubtask(subtaskId!, req.userSupabase);
    res.json({ subtask });
  } catch (err) {
    next(err);
  }
});

router.delete('/:subtaskId', async (req, res, next) => {
  try {
    const { taskId, subtaskId } = req.params as unknown as Params;
    if (!await verifyTaskOwnership(taskId, req, res)) return;
    await deleteSubtask(subtaskId!, req.userSupabase);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
