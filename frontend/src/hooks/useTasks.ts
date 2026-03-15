import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTasks, createTask, completeTask, deleteTask, archiveTask, getSubtasks, addSubtask, completeSubtask, deleteSubtask } from '../api/tasks';
import type { Task, Subtask } from '../types/task';

export function useTasks(filters?: { category?: string }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => listTasks(filters),
    staleTime: 30_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rawInput: string) => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const off = -now.getTimezoneOffset();
      const tz = `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off)/60))}:${pad(Math.abs(off)%60)}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return createTask({ raw_input: rawInput, current_date: `${local}${tz}`, timezone });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      console.error('[createTask error]', err);
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(['tasks', undefined]);
      qc.setQueryData(['tasks', undefined], (old: Task[] = []) => old.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', undefined], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useArchiveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveTask,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(['tasks', undefined]);
      qc.setQueryData(['tasks', undefined], (old: Task[] = []) => old.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', undefined], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => getSubtasks(taskId),
    staleTime: 30_000,
  });
}

export function useAddSubtask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => addSubtask(taskId, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subtasks', taskId] }),
  });
}

export function useCompleteSubtask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: string) => completeSubtask(taskId, subtaskId),
    onMutate: async (subtaskId: string) => {
      await qc.cancelQueries({ queryKey: ['subtasks', taskId] });
      const prev = qc.getQueryData<Subtask[]>(['subtasks', taskId]);
      qc.setQueryData(['subtasks', taskId], (old: Subtask[] = []) =>
        old.map((s) => (s.id === subtaskId ? { ...s, is_completed: true } : s))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['subtasks', taskId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['subtasks', taskId] }),
  });
}

export function useDeleteSubtask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: string) => deleteSubtask(taskId, subtaskId),
    onMutate: async (subtaskId: string) => {
      await qc.cancelQueries({ queryKey: ['subtasks', taskId] });
      const prev = qc.getQueryData<Subtask[]>(['subtasks', taskId]);
      qc.setQueryData(['subtasks', taskId], (old: Subtask[] = []) => old.filter((s) => s.id !== subtaskId));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['subtasks', taskId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['subtasks', taskId] }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeTask,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData<Task[]>(['tasks', undefined]);
      qc.setQueryData(['tasks', undefined], (old: Task[] = []) =>
        old.map((t) => (t.id === id ? { ...t, is_completed: true } : t))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', undefined], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
