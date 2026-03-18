import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPreferences, getInsights, resetPreferences } from '../api/preferences';

export function useAiPrefs() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['preferences'],
    queryFn: getPreferences,
    staleTime: 60_000,
  });

  const resetMutation = useMutation({
    mutationFn: resetPreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preferences'] });
      qc.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });

  return { rules: query.data?.rules ?? [], isLoading: query.isLoading, reset: resetMutation.mutate };
}

export function useAiInsights() {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: getInsights,
    staleTime: 30_000,
  });
}
