import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ClaudeParseError } from '../types/claude';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof ClaudeParseError) {
    res.status(422).json({ error: 'AI analysis failed. Please try again or set task details manually.', details: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.issues });
    return;
  }

  res.status(500).json({ error: 'Internal server error', detail: err.message });
}
