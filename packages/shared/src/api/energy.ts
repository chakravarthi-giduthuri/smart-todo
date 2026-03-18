import { apiFetch } from './client';
import type { EnergyLevel } from '../types/task';
import type { EnergyResponse } from '../types/api';

export async function getTodayEnergy(): Promise<EnergyResponse> {
  return apiFetch<EnergyResponse>('/api/energy/today');
}

export async function submitEnergy(level: EnergyLevel): Promise<void> {
  await apiFetch<void>('/api/energy', {
    method: 'POST',
    body: JSON.stringify({ level }),
  });
}
