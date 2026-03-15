import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodayEnergy, submitEnergy } from '../api/energy';
import type { EnergyLevel } from '../types/task';

export function useTodayEnergy() {
  return useQuery({
    queryKey: ['energy', 'today'],
    queryFn: getTodayEnergy,
    staleTime: 60_000 * 10,
  });
}

export function useSubmitEnergy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (level: EnergyLevel) => submitEnergy(level),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['energy'] }),
  });
}
