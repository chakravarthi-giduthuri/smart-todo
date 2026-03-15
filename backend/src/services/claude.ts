import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeResponse } from '../types/claude';
import { ClaudeParseError } from '../types/claude';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function buildPrompt(rawInput: string, rules: string[], currentDate: string, timezone?: string): string {
  const prefsBlock = rules.length > 0
    ? `\n--- Learned User Preferences ---\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n--- End Preferences ---\n`
    : '';

  return `You are a world-class personal assistant with 20+ years of experience managing tasks, schedules, and priorities for busy professionals. You have an exceptional instinct for what truly matters, when things should happen, and how long they take.

Current date and time: ${currentDate}${timezone ? ` (${timezone})` : ''}
${prefsBlock}
Analyze the user's input and return ONLY a valid JSON object with exactly these fields:
{
  "title": "concise action-oriented task title (max 60 chars)",
  "category": "Work" | "Study" | "Personal" | "Health" | "Errand",
  "scheduled_date": "YYYY-MM-DD or null",
  "scheduled_time": "HH:MM (24h) or null",
  "duration_minutes": integer or null,
  "priority": 1 | 2 | 3 | 4 | 5,
  "reminder_minutes_before": integer,
  "recurrence": "daily" | "weekdays" | "weekly" | "monthly" | null,
  "reasoning": "1-2 sentence explanation"
}

═══ RECURRENCE — detect repeating patterns ═══
- "every day" / "daily" → "daily"
- "every weekday" / "Mon-Fri" / "weekdays" → "weekdays"
- "every week" / "weekly" / "every Monday" → "weekly"
- "every month" / "monthly" → "monthly"
- No recurrence keyword → null
- Set recurrence only when the user clearly intends a repeating task.

═══ PRIORITY — assign ruthlessly honestly ═══
1 = Critical  : Deadlines today, emergencies, "ASAP", health crises, time-sensitive financials.
2 = High      : Due within 1-2 days, important meetings, anything with real consequences if missed.
3 = Medium    : This week, regular work, scheduled routine tasks.
4 = Low       : Nice-to-have, no real deadline, can slip without consequences.
5 = Minimal   : Someday/maybe, wishlist, zero urgency.
→ Be decisive. Most tasks land at 2 or 3. Reserve 1 for genuinely urgent items.

═══ TIME — when NO time is mentioned, assign a smart time ═══
Analyze the task type and current time, then pick the most realistic slot:
- Health / Exercise / Meditation    → 06:00–07:30 (morning energy)
- Deep Work / Study / Writing       → 09:00–11:30 (peak focus window)
- Meetings / Calls / Collaboration  → 10:00–12:00 or 14:00–16:00
- Admin / Email / Errands           → 11:00–12:00 or 17:00–18:00
- Personal Chores / Shopping        → 18:00–19:30 (after work)
- Casual / Social / Entertainment   → 19:00–21:00
- Never schedule in the past. If current time is past a natural slot, pick the next available one today or tomorrow.
- If the task is clearly "today" (urgent phrasing, no date mention), set scheduled_date = today.
- If vague with no urgency, set scheduled_date = tomorrow and pick the natural slot.

═══ DURATION — estimate realistically ═══
- Quick calls / check-ins: 15–30 min
- Focused work blocks: 60–120 min
- Workouts: 45–60 min
- Errands / shopping: 30–60 min
- If truly unknown: null

═══ REMINDER RULES ═══
- Default: reminder_minutes_before = 15.
- "remind me in X min/hours" (no other time context) → scheduled_time = now + X, reminder_minutes_before = 0.
- "remind X min before [time]" → reminder_minutes_before = X.
- "notify at start" / "remind when it starts" → reminder_minutes_before = 0.
- Always an integer >= 0. Never omit.

Do not include markdown, code fences, or any text outside the JSON object.

User task: ${rawInput}`;
}

export async function callClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new ClaudeParseError('Unexpected non-text response from Claude');
  return content.text;
}

export function parseClaudeResponse(text: string): ClaudeResponse {
  const cleaned = text.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ClaudeParseError(`Failed to parse Claude JSON: ${cleaned.slice(0, 200)}`);
  }

  const obj = parsed as Record<string, unknown>;
  const required = ['title', 'category', 'priority', 'reasoning'];
  for (const field of required) {
    if (!(field in obj)) throw new ClaudeParseError(`Missing field: ${field}`);
  }

  const categories = ['Work', 'Study', 'Personal', 'Health', 'Errand'];
  if (!categories.includes(obj.category as string)) {
    throw new ClaudeParseError(`Invalid category: ${obj.category}`);
  }

  const priority = Number(obj.priority);
  if (priority < 1 || priority > 5) throw new ClaudeParseError(`Invalid priority: ${obj.priority}`);

  const reminderMinutes = obj.reminder_minutes_before !== undefined
    ? Math.max(0, Math.round(Number(obj.reminder_minutes_before)))
    : 15;

  const validRecurrences = ['daily', 'weekdays', 'weekly', 'monthly'];
  const recurrence = validRecurrences.includes(obj.recurrence as string)
    ? (obj.recurrence as string)
    : null;

  return {
    title: String(obj.title).slice(0, 60),
    category: obj.category as ClaudeResponse['category'],
    scheduled_date: obj.scheduled_date ? String(obj.scheduled_date) : null,
    scheduled_time: obj.scheduled_time ? String(obj.scheduled_time) : null,
    duration_minutes: obj.duration_minutes ? Number(obj.duration_minutes) : null,
    priority,
    reminder_minutes_before: isNaN(reminderMinutes) ? 15 : reminderMinutes,
    reasoning: String(obj.reasoning),
    recurrence,
  };
}
