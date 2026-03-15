import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Subscribes to Supabase Realtime for the `tasks` table.
 * Any INSERT / UPDATE / DELETE automatically invalidates the
 * TanStack Query cache — no page refresh needed.
 *
 * Mount once at the app level (App.tsx).
 */
export function useRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          qc.invalidateQueries({ queryKey: ['tasks'] });
          qc.invalidateQueries({ queryKey: ['dashboard'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subtasks' },
        (payload) => {
          // Only invalidate the specific task's subtasks
          const taskId = (payload.new as { task_id?: string })?.task_id
            ?? (payload.old as { task_id?: string })?.task_id;
          if (taskId) qc.invalidateQueries({ queryKey: ['subtasks', taskId] });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [qc]);
}
