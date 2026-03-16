export type Category = 'Work' | 'Study' | 'Personal' | 'Health' | 'Errand';
export type Priority = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  user_id: string;
  raw_input: string;
  title: string;
  category: Category;
  priority: Priority;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  ai_reasoning: string;
  reminder_minutes_before: number;
  timezone_offset_minutes: number;
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
}

export interface EnergyCheckin {
  id: string;
  date: string;
  level: EnergyLevel;
  created_at: string;
}

export interface TaskShare {
  id: string;
  task_id: string;
  token: string;
  recipient_email: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_id: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export interface InsertSubtaskInput {
  task_id: string;
  title: string;
  position?: number;
}

export interface OverrideLog {
  id: string;
  user_id: string;
  task_id: string;
  field_changed: string;
  ai_value: string;
  user_value: string;
  reason: string;
  task_keywords: string[];
  created_at: string;
}

export interface InsertTaskInput {
  user_id: string;
  raw_input: string;
  title: string;
  category: Category;
  priority: Priority;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  ai_reasoning: string;
  reminder_minutes_before: number;
  timezone_offset_minutes: number;
  recurrence?: string | null;
  recurrence_parent_id?: string | null;
  context_tags?: string[];
  note?: string | null;
}

export interface InsertOverrideInput {
  user_id: string;
  task_id: string;
  field_changed: string;
  ai_value: string;
  user_value: string;
  reason: string;
  task_keywords: string[];
}

export interface TaskFilters {
  category?: Category;
  is_completed?: boolean;
}
