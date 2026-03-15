import { z } from 'zod';

export const patchOverrideSchema = z.object({
  field_changed: z.enum(['priority', 'category', 'scheduled_date', 'scheduled_time', 'duration_minutes', 'title']),
  ai_value: z.string(),
  user_value: z.string(),
  reason: z.string().max(80).optional().default(''),
  task_keywords: z.array(z.string()).optional().default([]),
});
