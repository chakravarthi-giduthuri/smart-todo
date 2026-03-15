import type { Priority } from '../types/task';

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
  5: 'Minimal',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-gray-500',
};

export function priorityToLabel(p: Priority): string {
  return PRIORITY_LABELS[p];
}
