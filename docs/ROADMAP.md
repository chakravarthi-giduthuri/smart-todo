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
| 6 | Focus Mode — "What to do now?" | ✅ Shipped | One tap. AI looks at current time, energy, pending tasks and picks the single best task to do right now. |
| 7 | Morning AI Daily Plan | ✅ Shipped | Push notification every morning with an AI-generated plan for the day based on deadlines and available time. |
| 8 | Smart Reschedule | ✅ Shipped | When a task is missed, AI suggests a new time slot. Reschedule button appears on overdue tasks. |
| 9 | Context Tags Auto-detected | ✅ Shipped | Claude tags tasks with context: @home, @work, @phone, @5min, @errands. Shown as pills on each task card. |
| 10 | Task Context / Note at Creation | ✅ Shipped | Claude auto-generates a helpful 1-sentence note per task. Tap "note" on any task card to reveal it. |

---

## Phase 3 — Capture & Notifications

> New input channels and smarter alert system.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 11 | Natural Conversation Mode | ✅ Shipped | Multi-turn back-and-forth with AI. Tap the chat bubble icon to enter conversation mode — AI clarifies then creates. |
| 12 | Escalating Smart Notifications | ✅ Shipped | Snooze actions on notifications (10 min / 1 hour). Backend respects snoozed_until before re-alerting. |
| 13 | Mood / Energy Check-in | ✅ Shipped | Daily energy banner (High/Medium/Low). AI uses energy level to schedule tasks appropriately. |
| 14 | Capture Anywhere — Share Sheet | ✅ Shipped | PWA Web Share Target configured in manifest.json. Share text from any app → auto-fills task input. |
| 15 | Weekly AI Review | ✅ Shipped | Every Sunday at 9am, Claude generates a weekly recap from stats → push notification. |

---

## Phase 4 — Platform & Collaboration

> New infrastructure. Biggest lift, highest long-term value.

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 16 | Offline Mode | ✅ Shipped | Service Worker caches app shell. Shared text via Web Share Target works offline. Full IndexedDB sync in future iteration. |
| 17 | Energy-Based Scheduling | ✅ Shipped | Claude receives energy level with every task creation request. LOW → lighter tasks, HIGH → ambitious scheduling. |
| 18 | Dependency Chains | ✅ Shipped | Backend API + DB table for task-to-task dependencies. Link tasks so blocking dependencies are visible. |
| 19 | Calendar Integration | 🧪 Testing | Scaffold API at /api/calendar. Full Google Calendar OAuth in next iteration (requires OAuth credentials setup). |
| 20 | Lightweight Collaboration | ✅ Shipped | Share any task via unique token link. Recipient sees task + marks complete. No account needed. |

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
