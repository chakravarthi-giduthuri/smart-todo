import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTasks, createTask, completeTask, deleteTask } from '../api/tasks';
import type { Task } from '../types/task';

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
