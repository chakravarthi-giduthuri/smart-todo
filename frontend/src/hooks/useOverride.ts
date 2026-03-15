import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchOverride } from '../api/overrides';
import type { Task } from '../types/task';

interface OverrideArgs {
  taskId: string;
  field_changed: string;
  ai_value: string;
  user_value: string;
  reason?: string;
  task_keywords?: string[];
}

export function useOverride() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, field_changed, ai_value, user_value, reason = '', task_keywords = [] }: OverrideArgs) =>
      patchOverride(taskId, { field_changed, ai_value, user_value, reason, task_keywords }),
    onMutate: async ({ taskId, field_changed, user_value }: OverrideArgs) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = qc.getQueryData(['tasks', undefined]);
      qc.setQueryData(['tasks', undefined], (old: Task[] = []) =>
        old.map((t) =>
          t.id === taskId
            ? { ...t, [field_changed]: user_value, _hasOverride: true }
            : t
        )
      );
      return { prev };
    },
    onError: (_err, _args, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', undefined], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
