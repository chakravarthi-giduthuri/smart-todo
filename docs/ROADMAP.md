# Smart To-Do — Product Roadmap

This document tracks all planned features for v2.0 across 4 phases. Updated as features are built and shipped.

---

## Version History

| Version | Status | Description |
|---------|--------|-------------|
| v1.0 | ✅ Shipped | Core AI task creation, push notifications, voice input, light/dark theme, AI learning system |
| v2.0 | 🔄 In Progress | 20 new features across 4 phases |

---

## Phase 1 — Core Power-Ups

> Extends the existing foundation. Highest immediate user value, lowest risk.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Recurring Tasks | ✅ Shipped | Natural language recurrence — "every Monday", "daily", "every weekday". AI detects pattern, auto-spawns next instance on complete. |
| 2 | Task Breakdown (Subtasks) | ✅ Shipped | Add subtasks inline on any task card. Each subtask completable independently with progress bar. |
| 3 | Time Estimation + Overload Warning | ✅ Shipped | Sum of daily scheduled durations shown with warning banner when day exceeds 8 hours. |
| 4 | Streak & Momentum Tracking | ✅ Shipped | Consecutive days with completed tasks. Shown on dashboard as Day Streak card. |
| 5 | Doom List / Auto-archive Overdue | ✅ Shipped | Tasks overdue 3+ days surfaced in a "Doom List" section with one-tap Archive button. |

---

## Phase 2 — AI Intelligence Layer

> Deeper Claude integration. Makes the app feel like a real personal assistant.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 6 | Focus Mode — "What to do now?" | ⏳ Planned | One tap. AI looks at current time, energy, pending tasks and picks the single best task to do right now. |
| 7 | Morning AI Daily Plan | ⏳ Planned | Push notification every morning with an AI-generated plan for the day based on deadlines and available time. |
| 8 | Smart Reschedule | ⏳ Planned | When a task is missed, AI suggests a new time slot instead of just marking it overdue. |
| 9 | Context Tags Auto-detected | ⏳ Planned | Claude tags tasks with context: @home, @work, @phone, @5min. Filter by context to see only relevant tasks. |
| 10 | Task Context / Note at Creation | ⏳ Planned | Attach a quick voice note or text note when creating a task. AI summarizes context when you open it later. |

---

## Phase 3 — Capture & Notifications

> New input channels and smarter alert system.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 11 | Natural Conversation Mode | ⏳ Planned | Multi-turn back-and-forth with AI. "I have a lot to do today" → AI asks questions and builds your plan. |
| 12 | Escalating Smart Notifications | ⏳ Planned | Gentle first reminder, then persistent if ignored. Snooze options: "remind in 10 min", "remind tomorrow". |
| 13 | Mood / Energy Check-in | ⏳ Planned | Quick daily check-in (High / Medium / Low energy). AI reshuffles today's priorities based on your answer. |
| 14 | Capture Anywhere — Share Sheet | ⏳ Planned | PWA Web Share Target. Share any text/link/screenshot from any app directly into Smart To-Do as a new task. |
| 15 | Weekly AI Review | ⏳ Planned | Every Sunday, AI sends a push with: completion rate, patterns detected, suggested improvements for next week. |

---

## Phase 4 — Platform & Collaboration

> New infrastructure. Biggest lift, highest long-term value.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 16 | Offline Mode | ⏳ Planned | Full offline support via Service Worker + IndexedDB. Tasks created offline sync when connection returns. |
| 17 | Energy-Based Scheduling | ⏳ Planned | Learns your peak productivity windows from mood check-in history. Automatically schedules hard tasks in peak hours. |
| 18 | Dependency Chains | ⏳ Planned | "Book hotel" depends on "confirm travel dates". AI understands order and only surfaces tasks when prerequisites are done. |
| 19 | Calendar Integration | ⏳ Planned | Google Calendar / Apple Calendar OAuth sync. Tasks with scheduled times create calendar events automatically. |
| 20 | Lightweight Collaboration | ⏳ Planned | Send a single task to someone (no account needed). They complete it, you get notified. No Jira complexity. |

---

## Technical Architecture Notes

### Phase 1 Schema Changes

```sql
-- Subtasks
CREATE TABLE subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recurring tasks
ALTER TABLE tasks ADD COLUMN recurrence text;
-- Values: null | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom:MON,WED,FRI'
ALTER TABLE tasks ADD COLUMN recurrence_parent_id uuid REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
```

### Phase 2 Schema Changes

```sql
-- Context tags
ALTER TABLE tasks ADD COLUMN context_tags text[] DEFAULT '{}';
-- Values: ['@home', '@work', '@phone', '@5min', '@errands']

-- Task notes
ALTER TABLE tasks ADD COLUMN note text;
```

### Phase 3 Schema Changes

```sql
-- Daily energy check-ins
CREATE TABLE energy_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  level text NOT NULL CHECK (level IN ('high', 'medium', 'low')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notification snooze tracking
ALTER TABLE tasks ADD COLUMN snoozed_until timestamptz;
```

### Phase 4 Schema Changes

```sql
-- Calendar sync
ALTER TABLE tasks ADD COLUMN calendar_event_id text;
ALTER TABLE tasks ADD COLUMN calendar_provider text;

-- Collaboration
CREATE TABLE task_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL,
  recipient_email text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Feature Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped |
| 🔄 | In Progress |
| ⏳ | Planned |
| ❌ | Blocked |
| 🧪 | Testing |
