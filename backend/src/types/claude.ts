export interface ClaudeResponse {
  title: string;
  category: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  priority: number;
  reminder_minutes_before: number;
  reasoning: string;
  recurrence: string | null;
}

export class ClaudeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeParseError';
  }
}
