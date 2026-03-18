export type Category = 'Work' | 'Study' | 'Personal' | 'Health' | 'Errand';
export type Priority = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  raw_input: string;
  title: string;
  category: Category;
  priority: Priority;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  ai_reasoning: string;
  reminder_minutes_before: number;
  is_completed: boolean;
  completed_at: string | null;
  reminder_sent: boolean;
  is_archived: boolean;
  recurrence: string | null;
  recurrence_parent_id: string | null;
  context_tags: string[];
  note: string | null;
  snoozed_until: string | null;
  nag_interval_minutes?: number | null;
  nag_last_sent_at?: string | null;
  nag_count?: number;
  created_at: string;
  _hasOverride?: boolean;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_id: string;
  depends_on_title?: string;
  created_at: string;
}

export type EnergyLevel = 'high' | 'medium' | 'low';

export interface EnergyCheckin {
  id: string;
  date: string;
  level: EnergyLevel;
  created_at: string;
}

export interface OverrideLog {
  id: string;
  task_id: string;
  field_changed: string;
  ai_value: string;
  user_value: string;
  reason: string;
  task_keywords: string[];
  created_at: string;
}
