import type { Category, Task } from './task';

export interface CreateTaskRequest {
  raw_input: string;
  current_date: string;
  timezone?: string;
}

export interface PatchOverrideRequest {
  field_changed: string;
  ai_value: string;
  user_value: string;
  reason: string;
  task_keywords: string[];
}

export interface DashboardStats {
  total_tasks: number;
  completed_today: number;
  completion_rate: number;
  top_category: Category | null;
  tasks_this_week: number;
  overdue_count: number;
  week_chart: Array<{ date: string; total: number; completed: number }>;
}
