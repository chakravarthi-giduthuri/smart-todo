import type { Category, Task, EnergyLevel } from './task';

export interface CreateTaskRequest {
  raw_input: string;
  current_date: string;
  timezone?: string;
  energy_level?: string;
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
  streak_days: number;
  week_chart: Array<{ date: string; total: number; completed: number }>;
}

export interface FocusResponse {
  task: Task | null;
  reason: string;
}

export interface EnergyResponse {
  level: EnergyLevel | null;
  date: string | null;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ConversationResult =
  | { type: 'question'; content: string }
  | { type: 'task'; task: Task };

export interface ShareToken {
  id: string;
  task_id: string;
  token: string;
  recipient_email: string | null;
  created_at: string;
}
