import { z } from 'zod';

export const createTaskSchema = z.object({
  raw_input: z.string().min(1).max(500),
  current_date: z.string().regex(/^\d{4}-\d{2}-\d{2}T/),
  timezone: z.string().optional(),
});

export const completeTaskSchema = z.object({
  id: z.string().uuid(),
});
