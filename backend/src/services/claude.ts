import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeResponse } from '../types/claude';
import { ClaudeParseError } from '../types/claude';
import type { Task } from '../types/task';
import type { LearningContext } from './preferences';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPreferencesBlock(context: LearningContext | string[]): string {
  // Flat string[] — legacy format
  if (Array.isArray(context)) {
    if (context.length === 0) return '';
    return `\n═══ LEARNED USER PREFERENCES ═══\n${context.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n═══ END PREFERENCES ═══\n`;
  }

  const ctx = context as LearningContext;
  const hasAny = [
    ctx.priorityRules, ctx.categoryRules, ctx.timeRules,
    ctx.durationRules, ctx.behaviorProfile, ctx.reasonInsights,
  ].some(arr => arr.length > 0);

  if (!hasAny) return '';

  const lines: string[] = ['\n═══ LEARNED USER PREFERENCES (apply these FIRST before defaults) ═══'];

  if (ctx.categoryRules.length > 0) {
    lines.push('\n[Category Corrections — high confidence, follow strictly]');
    ctx.categoryRules.forEach(r => lines.push(`  • ${r}`));
  }
  if (ctx.priorityRules.length > 0) {
    lines.push('\n[Priority Adjustments — override default priority logic with these]');
    ctx.priorityRules.forEach(r => lines.push(`  • ${r}`));
  }
  if (ctx.timeRules.length > 0) {
    lines.push('\n[Scheduling Preferences — use these times instead of defaults]');
    ctx.timeRules.forEach(r => lines.push(`  • ${r}`));
  }
  if (ctx.durationRules.length > 0) {
    lines.push('\n[Duration Preferences — adjust durations to match user habits]');
    ctx.durationRules.forEach(r => lines.push(`  • ${r}`));
  }
  if (ctx.reasonInsights.length > 0) {
    lines.push('\n[User-Stated Preferences — explicit feedback from the user]');
    ctx.reasonInsights.forEach(r => lines.push(`  • ${r}`));
  }
  if (ctx.behaviorProfile.length > 0) {
    lines.push('\n[Behavior Profile — use to inform scheduling and priority]');
    ctx.behaviorProfile.forEach(r => lines.push(`  • ${r}`));
  }

  lines.push('═══ END PREFERENCES ═══');
  return lines.join('\n') + '\n';
}

export function buildPrompt(
  rawInput: string,
  context: LearningContext | string[],
  currentDate: string,
  timezone?: string,
  energyLevel?: string,
): string {
  const prefsBlock = buildPreferencesBlock(context);

  const energyBlock = energyLevel
    ? `\nUser's current energy level: ${energyLevel.toUpperCase()}.\n  LOW energy → prefer admin, email, errands (avoid deep work).\n  MEDIUM energy → routine tasks, meetings, planning.\n  HIGH energy → deep work, complex problems, creative tasks.\n`
    : '';

  return `You are a world-class personal assistant with 20+ years of experience managing tasks, schedules, and priorities for busy professionals. You have an exceptional instinct for what truly matters, when things should happen, and how long they take.

Current date and time: ${currentDate}${timezone ? ` (${timezone})` : ''}
${prefsBlock}${energyBlock}
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
  "context_tags": ["@home","@work","@phone","@5min","@errands"] (subset, may be empty),
  "note": "1-sentence helpful reminder or null",
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

═══ CONTEXT TAGS ═══
Choose any subset of: ["@home","@work","@phone","@5min","@errands"]
- @home: task done at home
- @work: task done at work/office
- @phone: requires a phone call
- @5min: can be done in 5 minutes or less
- @errands: requires going out/running errands
- Return an empty array [] if none apply.

═══ NOTE ═══
- Provide a brief, helpful 1-sentence reminder note (e.g., "Remember to bring your ID" or "Check the traffic before leaving").
- Return null if no useful reminder note applies.

Do not include markdown, code fences, or any text outside the JSON object.

User task: ${rawInput}`;
}

export async function callClaude(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
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

  const validTags = ['@home', '@work', '@phone', '@5min', '@errands'];
  const rawTags = Array.isArray(obj.context_tags) ? obj.context_tags : [];
  const context_tags = (rawTags as unknown[])
    .filter((t): t is string => typeof t === 'string' && validTags.includes(t));

  const note = obj.note && typeof obj.note === 'string' ? obj.note : null;

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
    context_tags,
    note,
  };
}

export function buildReschedulePrompt(task: Task, currentDate: string): string {
  const priorityLabel = ['', 'Critical', 'High', 'Medium', 'Low', 'Minimal'][task.priority] ?? 'Unknown';
  return `You are an expert scheduling assistant. Reschedule the following task to the best upcoming time slot.

Current date and time: ${currentDate}

Task to reschedule:
- Title: ${task.title}
- Category: ${task.category}
- Priority: ${task.priority} (${priorityLabel})
- Original schedule: ${task.scheduled_date ?? 'none'} at ${task.scheduled_time ?? 'none'}
- Duration: ${task.duration_minutes != null ? `${task.duration_minutes} minutes` : 'unknown'}
- Context tags: ${task.context_tags?.join(', ') || 'none'}

Return ONLY a valid JSON object with exactly these two fields:
{
  "scheduled_date": "YYYY-MM-DD",
  "scheduled_time": "HH:MM"
}

Scheduling rules:
- NEVER pick a date/time that is in the past relative to the current date and time above.
- Priority 1 (Critical): schedule today within the next 2 hours if possible, otherwise first thing tomorrow.
- Priority 2 (High): schedule today or tomorrow at the most suitable time.
- Priority 3 (Medium): schedule within the next 2-3 days.
- Priority 4-5 (Low/Minimal): schedule within the next week.
- Time-of-day guidelines by category:
  · Health / Exercise / Meditation → 06:00–08:00
  · Deep Work / Study / Writing → 09:00–11:30
  · Work meetings / Calls → 10:00–12:00 or 14:00–16:00
  · Admin / Email / Errands → 11:00–12:00 or 17:00–18:00
  · Personal chores / Shopping → 18:00–19:30
- If the task has @5min tag, it can go in any small gap (e.g., 12:00 or 17:00).
- Pick a clean time (on the hour or half-hour) unless a specific time makes more sense.

Do not include markdown, code fences, or any text outside the JSON object.`;
}

export function buildFocusPrompt(tasks: Task[], currentDate: string): string {
  const taskList = tasks
    .slice(0, 20)
    .map((t, i) => `${i + 1}. [${t.id}] ${t.title} (priority=${t.priority}, category=${t.category}, scheduled=${t.scheduled_date ?? 'none'} ${t.scheduled_time ?? ''}, duration=${t.duration_minutes ?? '?'}min)`)
    .join('\n');

  return `You are a focus coach. Given the user's current tasks, pick the single best task to work on RIGHT NOW.

Current date and time: ${currentDate}

Incomplete tasks:
${taskList}

Return ONLY a valid JSON object:
{
  "task_id": "the UUID of the best task to focus on",
  "reason": "1-2 sentence explanation of why this task is the best choice right now"
}

Selection criteria:
- Prioritize overdue tasks or tasks due today/soon.
- Prefer higher priority (lower number = higher priority).
- Consider task duration — if little time is available, prefer shorter tasks.
- Avoid tasks with future scheduled dates unless everything else is fine.

Do not include markdown, code fences, or any text outside the JSON object.`;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function buildConversationPrompt(
  messages: ConversationMessage[],
  currentDate: string,
  timezone?: string,
): string {
  const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

  return `You are a conversational task creation assistant. Your goal is to understand the user's task and create it — but ask clarifying questions if essential details are missing.

Current date and time: ${currentDate}${timezone ? ` (${timezone})` : ''}

Conversation so far:
${history}

Decide: do you have enough information to create the task, or do you need one more clarification?

If you need clarification, return ONLY:
{
  "type": "question",
  "content": "Your clarifying question here (1 sentence)"
}

If you have enough information, return ONLY:
{
  "type": "task",
  "title": "concise action-oriented task title (max 60 chars)",
  "category": "Work" | "Study" | "Personal" | "Health" | "Errand",
  "scheduled_date": "YYYY-MM-DD or null",
  "scheduled_time": "HH:MM (24h) or null",
  "duration_minutes": integer or null,
  "priority": 1 | 2 | 3 | 4 | 5,
  "reminder_minutes_before": integer,
  "recurrence": "daily" | "weekdays" | "weekly" | "monthly" | null,
  "context_tags": ["@home","@work","@phone","@5min","@errands"] subset,
  "note": "1-sentence helpful note or null",
  "reasoning": "1-2 sentence explanation"
}

Do not include markdown, code fences, or any text outside the JSON object.`;
}

export function buildMorningPlanPrompt(tasks: Task[], currentDate: string): string {
  const taskList = tasks
    .slice(0, 15)
    .map(t => `- ${t.title} (${t.category}, priority=${t.priority}, time=${t.scheduled_time ?? 'flexible'}, duration=${t.duration_minutes ?? '?'}min)`)
    .join('\n');

  return `You are a morning briefing assistant. Generate a brief, motivating morning briefing for the user.

Date: ${currentDate}

Today's tasks:
${taskList || '(no tasks scheduled for today)'}

Return ONLY a valid JSON object:
{
  "briefing": "A friendly 2-3 sentence morning briefing covering highlights, priorities, and a motivating note. Keep it under 200 characters for a push notification."
}

Do not include markdown, code fences, or any text outside the JSON object.`;
}

export function buildWeeklyReviewPrompt(stats: Record<string, unknown>, currentDate: string): string {
  return `You are a weekly productivity coach. Analyze the user's week and generate a structured review with actionable insights.

Date: ${currentDate}

Weekly stats:
${JSON.stringify(stats, null, 2)}

Return ONLY a valid JSON object:
{
  "summary": "2-sentence summary of the week's productivity",
  "wins": ["win 1", "win 2", "win 3"],
  "improvement_areas": ["area 1", "area 2"],
  "next_week_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "score": <integer 1-10 overall productivity score>,
  "push_message": "Short motivating push notification message under 150 chars"
}

Base wins on completion rate, streak, and tasks completed. Be specific and encouraging.
Do not include markdown, code fences, or any text outside the JSON object.`;
}
