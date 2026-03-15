# Smart To-Do — System Architecture

**Version**: 1.0
**Date**: 2026-03-14
**Scope**: Phase 1 MVP (Weeks 1–4) + Phase 1.5 (Weeks 5–6)

---

## Table of Contents

1. [Directory and File Structure](#1-directory-and-file-structure)
2. [React Component Tree](#2-react-component-tree)
3. [Backend Module Breakdown](#3-backend-module-breakdown)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [State Management Approach](#5-state-management-approach)
6. [Service Worker Architecture](#6-service-worker-architecture)
7. [Environment Variables](#7-environment-variables)
8. [Key Architectural Decisions](#8-key-architectural-decisions)

---

## 1. Directory and File Structure

```
smart-todo/
├── frontend/
│   ├── public/
│   │   ├── sw.js                      # Compiled Service Worker (Vite output)
│   │   ├── manifest.json              # PWA manifest (icons, theme_color)
│   │   └── icons/                     # App icons (192px, 512px)
│   ├── src/
│   │   ├── main.tsx                   # React root, mounts <App />
│   │   ├── App.tsx                    # Route definitions, SW registration call
│   │   ├── index.css                  # Tailwind directives, CSS variables
│   │   │
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx         # Chat bar + priority-sorted task list
│   │   │   ├── CalendarScreen.tsx     # Month/week toggle, task dot overlay
│   │   │   ├── DashboardScreen.tsx    # 6 stat cards + 7-day bar chart
│   │   │   └── SettingsScreen.tsx     # Notification toggle, AI prefs viewer, reset
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── BottomNav.tsx      # 4-tab navigation bar (Home/Cal/Dash/Settings)
│   │   │   │   └── PageShell.tsx      # Shared scroll container + safe-area padding
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── ChatBar.tsx        # Fixed-top text input + submit button
│   │   │   │   └── TypingIndicator.tsx # Animated dots shown while Claude processes
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   ├── TaskList.tsx       # Sorted, filterable list of TaskCard rows
│   │   │   │   ├── TaskCard.tsx       # Single task row: title, meta, override icon
│   │   │   │   ├── TaskCardSkeleton.tsx # Placeholder while task is being created
│   │   │   │   ├── OverrideDrawer.tsx # Bottom sheet for inline field editing
│   │   │   │   ├── PriorityPicker.tsx # 1–5 dot selector (inline, 44px targets)
│   │   │   │   ├── CategoryPicker.tsx # 5 colored chips (inline)
│   │   │   │   ├── DateTimePicker.tsx # Native <input type="date/time"> wrapper
│   │   │   │   └── CompletionToggle.tsx # Checkbox with optimistic strike-through
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarHeader.tsx # Month/week toggle + prev/next arrows
│   │   │   │   ├── MonthGrid.tsx      # 5-row calendar grid with task dot indicators
│   │   │   │   ├── WeekStrip.tsx      # 7-column day strip for week view
│   │   │   │   └── DayTaskList.tsx    # Expanded task list for selected day
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.tsx       # Single metric card (label + value + icon)
│   │   │   │   └── WeekBarChart.tsx   # 7-day completion bar chart (pure SVG, no lib)
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── NotificationToggle.tsx # Push permission request + on/off switch
│   │   │       ├── AiPrefsViewer.tsx  # Read-only list of current learned rules
│   │   │       └── ResetAiButton.tsx  # Calls DELETE /api/preferences/reset
│   │   │
│   │   ├── hooks/
│   │   │   ├── useTasks.ts            # Server state: fetch, create, complete tasks
│   │   │   ├── useOverride.ts         # Optimistic update + PATCH override endpoint
│   │   │   ├── useDashboard.ts        # Fetch /api/dashboard aggregated stats
│   │   │   ├── useCalendar.ts         # Local UI state for selected date/view mode
│   │   │   ├── useNotifications.ts    # SW registration + push subscription lifecycle
│   │   │   └── useAiPrefs.ts          # Fetch /api/preferences (learned rules display)
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts              # Base fetch wrapper (base URL, headers, errors)
│   │   │   ├── tasks.ts               # createTask(), listTasks(), completeTask()
│   │   │   ├── overrides.ts           # patchOverride(taskId, field, value, reason)
│   │   │   ├── push.ts                # subscribePush(subscription)
│   │   │   ├── dashboard.ts           # getDashboard()
│   │   │   └── preferences.ts         # getPreferences(), resetPreferences()
│   │   │
│   │   ├── types/
│   │   │   ├── task.ts                # Task, OverrideLog, Category, Priority types
│   │   │   └── api.ts                 # API request/response shape types
│   │   │
│   │   ├── constants/
│   │   │   └── categories.ts          # CATEGORY_COLORS map, CATEGORY_LIST array
│   │   │
│   │   ├── utils/
│   │   │   ├── dateFormat.ts          # formatDate(), formatTime(), relativeDay()
│   │   │   └── priorityLabel.ts       # priorityToLabel(1-5) → "Critical"…"Low"
│   │   │
│   │   └── sw/
│   │       └── sw.ts                  # Service Worker source (Vite plugin processes this)
│   │
│   ├── index.html
│   ├── vite.config.ts                 # Vite config with vite-plugin-pwa
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── .env                           # VITE_API_BASE_URL (never secrets)
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts                   # Express app entry: middleware, routes, cron start
│   │   │
│   │   ├── routes/
│   │   │   ├── tasks.ts               # POST /api/tasks, GET /api/tasks, PATCH /:id/complete
│   │   │   ├── overrides.ts           # PATCH /api/tasks/:id/override
│   │   │   ├── push.ts                # POST /api/push/subscribe
│   │   │   ├── dashboard.ts           # GET /api/dashboard
│   │   │   └── preferences.ts         # GET /api/preferences, DELETE /api/preferences/reset
│   │   │
│   │   ├── services/
│   │   │   ├── claude.ts              # Claude API wrapper: buildPrompt(), callClaude(), parseResponse()
│   │   │   ├── preferences.ts         # fetchOverrideLogs(), detectPatterns(), buildRules()
│   │   │   ├── reminders.ts           # queryDueTasks(), sendPushNotification(), markSent()
│   │   │   └── dashboard.ts           # aggregateStats() — SQL queries for stat cards
│   │   │
│   │   ├── db/
│   │   │   ├── supabase.ts            # Supabase client singleton
│   │   │   ├── taskQueries.ts         # insert/select/update queries for tasks table
│   │   │   └── overrideQueries.ts     # insert/select queries for override_log table
│   │   │
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts        # Global Express error handler
│   │   │   ├── validate.ts            # Request body validation (zod schemas)
│   │   │   └── cors.ts                # CORS config (Vercel frontend origin only)
│   │   │
│   │   ├── cron/
│   │   │   └── reminderJob.ts         # node-cron schedule("*/5 * * * *") → reminders service
│   │   │
│   │   ├── schemas/
│   │   │   ├── taskSchemas.ts         # Zod schemas for POST /api/tasks body
│   │   │   └── overrideSchemas.ts     # Zod schemas for PATCH override body
│   │   │
│   │   └── types/
│   │       ├── task.ts                # Task, OverrideLog DB row types
│   │       └── claude.ts              # ClaudeResponse type
│   │
│   ├── .env                           # All secrets (never committed)
│   ├── .env.example                   # Template with placeholder values
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## 2. React Component Tree

```
App.tsx
├── BottomNav.tsx                      (always visible)
│
├── [/] HomeScreen.tsx
│   ├── ChatBar.tsx
│   │   └── TypingIndicator.tsx        (conditional, while AI processes)
│   ├── TaskList.tsx
│   │   ├── TaskCardSkeleton.tsx       (optimistic placeholder on submit)
│   │   └── TaskCard.tsx               (one per task)
│   │       ├── CompletionToggle.tsx
│   │       ├── CategoryPicker.tsx     (inline, shown on override tap)
│   │       ├── PriorityPicker.tsx     (inline, shown on override tap)
│   │       └── OverrideDrawer.tsx     (bottom sheet for date/time/duration)
│   │           └── DateTimePicker.tsx
│
├── [/calendar] CalendarScreen.tsx
│   ├── CalendarHeader.tsx
│   ├── MonthGrid.tsx                  (when view=month)
│   │   └── [day cells with task dots]
│   ├── WeekStrip.tsx                  (when view=week)
│   └── DayTaskList.tsx                (expands on day tap)
│       └── TaskCard.tsx               (same component, read-only override in calendar)
│
├── [/dashboard] DashboardScreen.tsx
│   ├── StatCard.tsx × 6
│   └── WeekBarChart.tsx
│
└── [/settings] SettingsScreen.tsx
    ├── NotificationToggle.tsx
    ├── AiPrefsViewer.tsx
    └── ResetAiButton.tsx
```

### Hook-to-Screen Bindings

| Screen | Hooks Used |
|--------|-----------|
| HomeScreen | useTasks, useOverride |
| CalendarScreen | useTasks, useCalendar |
| DashboardScreen | useDashboard |
| SettingsScreen | useNotifications, useAiPrefs |

### Component Responsibilities (concise)

**ChatBar.tsx** — Controlled input, calls `useTasks.createTask(rawInput)` on submit, shows `TypingIndicator` while pending.

**TaskCard.tsx** — Renders title, category chip (colored), priority dots, scheduled time, duration, completion toggle, and pencil icon (if override exists). Tapping any meta field triggers inline picker — no modal navigation.

**OverrideDrawer.tsx** — Bottom sheet anchored to bottom of screen. Contains date/time/duration pickers. Calls `useOverride.patchOverride()` on change; closes on tap-outside. Two-tap max: (1) tap pencil icon, (2) change value.

**MonthGrid.tsx** — Renders 5-row × 7-column grid. Each cell shows date number and colored dots (up to 3) representing tasks that day. Tapping a cell sets `useCalendar.selectedDate`.

**WeekBarChart.tsx** — Pure SVG, no charting library. 7 bars, each bar height proportional to `completed_count / total_tasks_that_day`. Avoids bundle bloat.

**StatCard.tsx** — Accepts `{ label, value, icon, color }` props. 6 instances: Total Tasks, Completed Today, Completion Rate, Most Active Category, Tasks This Week, Overdue Tasks.

---

## 3. Backend Module Breakdown

### routes/tasks.ts
Responsibilities: request validation, orchestration of services, response shaping.

```
POST  /api/tasks
  body: { raw_input: string, current_date: string (ISO) }
  → validate with taskSchemas.createTaskSchema
  → preferences.buildRules()
  → claude.callClaude(raw_input, rules)
  → taskQueries.insertTask(claudeResult)
  → 201 { task }

GET   /api/tasks
  query: ?category=Work&completed=false
  → taskQueries.listTasks(filters)
  → 200 { tasks[] }

PATCH /api/tasks/:id/complete
  → taskQueries.markComplete(id)
  → 200 { task }
```

### routes/overrides.ts
```
PATCH /api/tasks/:id/override
  body: { field, ai_value, user_value, reason, task_keywords }
  → validate with overrideSchemas.patchOverrideSchema
  → taskQueries.updateTaskField(id, field, user_value)
  → overrideQueries.insertOverride(payload)
  → 200 { task }
```

### routes/push.ts
```
POST /api/push/subscribe
  body: { endpoint, keys: { p256dh, auth } }
  → store subscription in memory (single-user: one subscription at a time)
  → 201 { ok: true }
```

### routes/dashboard.ts
```
GET /api/dashboard
  → dashboardService.aggregateStats()
  → 200 { total_tasks, completed_today, completion_rate,
           top_category, tasks_this_week, overdue_count,
           week_chart: [{ date, total, completed }] × 7 }
```

### routes/preferences.ts
```
GET    /api/preferences
  → preferences.buildRules()
  → 200 { rules: string[] }

DELETE /api/preferences/reset
  → overrideQueries.truncateOverrideLogs()
  → 200 { ok: true }
```

---

### services/claude.ts

Three exported functions — kept under 150 lines each:

**`buildPrompt(rawInput, rules, currentDate)`**
Assembles the system prompt with:
- Role: "You are a task scheduling assistant..."
- Learned preferences block (injected only when rules.length > 0)
- Current date/time context
- Output contract: "Return ONLY valid JSON matching this schema: {...}"
- The raw user input

**`callClaude(prompt)`**
Calls `anthropic.messages.create` with `model: "claude-haiku-4-5-20251001"`, `max_tokens: 300`. Returns raw text content.

**`parseClaudeResponse(text)`**
Extracts JSON from the response text (handles markdown code fences). Validates against expected fields. Throws `ClaudeParseError` on invalid JSON — caller returns 422 so frontend can fallback to manual entry.

---

### services/preferences.ts

**`fetchOverrideLogs(limit = 20)`**
Calls `overrideQueries.getRecentOverrides(20)`. Returns `OverrideLog[]`.

**`detectPatterns(logs)`**
Frequency counting — no ML:
1. Group by `field_changed`
2. Within each field group, bucket by direction (e.g., ai_value=3, user_value=5 → "bumped up")
3. Count occurrences per keyword group
4. Rule triggers when count >= 3 for same field + same direction + similar keywords

**`buildRules()`**
Calls `fetchOverrideLogs()` → `detectPatterns()` → converts each pattern to an English sentence. Returns `string[]` (max 10). Returns `[]` when total override count < 5.

De-weighting: records older than 60 days are filtered out before pattern detection.

---

### services/reminders.ts

**`queryDueTasks()`**
SQL: `SELECT * FROM tasks WHERE is_completed = false AND reminder_sent = false AND scheduled_date = CURRENT_DATE AND scheduled_time BETWEEN (NOW() + INTERVAL '15 minutes') AND (NOW() + INTERVAL '20 minutes')`

**`sendPushNotification(task, subscription)`**
Uses `web-push` npm package. Payload: `{ title: task.title, body: "Starting in 15 minutes", data: { taskId: task.id } }`

**`runReminderJob()`**
Called by cron every 5 min:
1. `queryDueTasks()`
2. For each task: `sendPushNotification()` → on success: `taskQueries.markReminderSent(task.id)`

---

### services/dashboard.ts

**`aggregateStats()`**
Executes 4 Supabase queries (can be parallelized with `Promise.all`):
1. COUNT all tasks / COUNT completed today
2. COUNT by category (find max) for `top_category`
3. COUNT tasks in current ISO week
4. COUNT where `scheduled_date < TODAY AND is_completed = false` for `overdue_count`
5. 7-day chart: GROUP BY `scheduled_date` for last 7 days

---

### db/taskQueries.ts

Exports typed functions wrapping Supabase client. No raw SQL strings in routes — all SQL lives here.

```
insertTask(data: InsertTaskInput): Promise<Task>
listTasks(filters: TaskFilters): Promise<Task[]>
markComplete(id: string): Promise<Task>
updateTaskField(id: string, field: string, value: unknown): Promise<Task>
markReminderSent(id: string): Promise<void>
getTasksByDateRange(from: string, to: string): Promise<Task[]>
```

### db/overrideQueries.ts

```
insertOverride(data: InsertOverrideInput): Promise<OverrideLog>
getRecentOverrides(limit: number): Promise<OverrideLog[]>
truncateOverrideLogs(): Promise<void>
```

---

### middleware/validate.ts

Wraps Zod `safeParse`. On failure, returns `400 { error: "Validation failed", details: zodError.issues }`. Used as Express middleware factory: `validate(schema)`.

### middleware/cors.ts

```typescript
// Allowed origins: FRONTEND_URL env var (Vercel URL) + localhost:5173 in dev
```

### middleware/errorHandler.ts

Catches `ClaudeParseError` → 422, `ZodError` → 400, unhandled → 500. Logs to console (no external logging service in Phase 1).

---

### cron/reminderJob.ts

```typescript
import cron from 'node-cron';
import { runReminderJob } from '../services/reminders';

export function startReminderCron() {
  cron.schedule('*/5 * * * *', async () => {
    await runReminderJob();
  });
}
```

Called once in `index.ts` during server startup.

---

## 4. Data Flow Diagrams

### 4.1 Task Submission Flow

```
User types raw input in ChatBar
        |
        | useTasks.createTask(rawInput)
        v
api/tasks.ts → POST /api/tasks
        |
        | [Backend]
        v
routes/tasks.ts
  → validate body (Zod)
  → preferences.buildRules()
        |
        | if override_count >= 5
        | → overrideQueries.getRecentOverrides(20)
        | → detectPatterns() → string[] rules
        |
        v
  → claude.buildPrompt(rawInput, rules, currentDate)
  → claude.callClaude(prompt)
        |
        | [Anthropic API]
        | returns: { title, category, scheduled_date,
        |            scheduled_time, duration_minutes,
        |            priority, reasoning }
        |
        v
  → claude.parseClaudeResponse(text)
  → taskQueries.insertTask(parsedResult)
        |
        v
  ← 201 { task }
        |
        | [Frontend]
        v
useTasks: remove skeleton placeholder, prepend real TaskCard
TaskList re-renders with new task at correct priority position
```

### 4.2 Override Flow

```
User taps field on TaskCard (e.g., priority dots)
        |
        | tap #1
        v
Inline picker renders (PriorityPicker / CategoryPicker / OverrideDrawer)

User selects new value
        |
        | tap #2
        v
useOverride.patchOverride(taskId, field, aiValue, userValue, reason)
        |
        | OPTIMISTIC: update local task state immediately
        | UI shows new value instantly, pencil icon appears
        |
        | api/overrides.ts → PATCH /api/tasks/:id/override
        |
        | [Backend]
        v
routes/overrides.ts
  → validate body
  → taskQueries.updateTaskField(id, field, userValue)
  → overrideQueries.insertOverride({ task_id, field_changed,
      ai_value, user_value, reason, task_keywords })
        |
        v
  ← 200 { task }
        |
        | [Frontend]
        | On success: confirm optimistic state (no-op if values match)
        | On error: revert optimistic state, show toast
        v
Task card reflects final persisted value
```

### 4.3 Notification Flow

```
App first load
        |
        v
App.tsx → useNotifications.register()
  → navigator.serviceWorker.register('/sw.js')
  → Notification.requestPermission()
  → registration.pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })
  → api/push.subscribePush(subscription)
  → POST /api/push/subscribe → stored in memory (single-user)

        ------- (every 5 minutes on server) -------

node-cron fires reminderJob
        |
        v
reminders.queryDueTasks()
  → Supabase: tasks where scheduled_time 15-20 min from now
              AND reminder_sent = false
        |
        v
For each due task:
  web-push.sendNotification(storedSubscription, payload)
        |
        v
  taskQueries.markReminderSent(task.id)

        ------- (on device) -------

Service Worker 'push' event fires
  → self.registration.showNotification(title, {
      body, icon, badge, data: { taskId }
    })

User taps notification
  → 'notificationclick' event
  → clients.openWindow('/') or focus existing tab
```

---

## 5. State Management Approach

No Redux. No Zustand. No external state library.

### Rationale

Single-user, no concurrent sessions, no complex cross-component shared state beyond task list. React Query (TanStack Query) handles server state. `useState` / `useReducer` handle local UI state. This keeps the bundle small and the mental model simple.

### State Location Table

| State | Location | Mechanism |
|-------|----------|-----------|
| Task list (all tasks) | Server cache | TanStack Query `useQuery` key: `['tasks']` |
| New task being created | Local (ChatBar) | `useState` — cleared on submit |
| Selected date in Calendar | Local (CalendarScreen) | `useState` lifted into `useCalendar` hook |
| Calendar view mode (month/week) | Local (CalendarScreen) | `useState` in `useCalendar` hook |
| Override in-progress field | Local (TaskCard) | `useState` — which field is being edited |
| Task field after override | Optimistic + server | TanStack Query `setQueryData` for optimistic, `invalidateQueries` on settle |
| Dashboard stats | Server cache | TanStack Query `useQuery` key: `['dashboard']` |
| Push subscription object | Service Worker / hook | `useNotifications` — stored via `/api/push/subscribe` |
| Learned AI rules (display) | Server cache | TanStack Query `useQuery` key: `['preferences']` |
| Notification permission status | Local (useNotifications) | `useState` — derived from `Notification.permission` |

### TanStack Query Configuration

```
queryClient:
  staleTime: 30_000      // 30 sec — tasks don't need to be hyper-fresh
  gcTime: 5 * 60_000     // 5 min garbage collection
  retry: 1               // Retry once on failure (Render.com cold start)
  refetchOnWindowFocus: true
```

### Optimistic Update Pattern (useOverride.ts)

```
1. snapshot = queryClient.getQueryData(['tasks'])
2. queryClient.setQueryData(['tasks'], (old) => patch task in old array)
3. await api.patchOverride(...)
4. on error: queryClient.setQueryData(['tasks'], snapshot)  // rollback
5. queryClient.invalidateQueries(['tasks'])  // always re-sync after settle
```

---

## 6. Service Worker Architecture

### File: frontend/src/sw/sw.ts

Processed by `vite-plugin-pwa` (or `vite-plugin-service-worker`). Output: `public/sw.js`.

### Lifecycle

```
install event
  → self.skipWaiting()     // activate immediately, no waiting

activate event
  → clients.claim()        // take control of all open tabs immediately

push event
  → event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: data.taskId,          // prevents duplicate notifications
        data: { taskId: data.taskId, url: '/' }
      })
    )

notificationclick event
  → event.notification.close()
  → event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) return clientList[0].focus()
        return clients.openWindow('/')
      })
    )
```

### Registration (App.tsx + useNotifications.ts)

```
1. navigator.serviceWorker.register('/sw.js')
2. await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY)
   })
3. POST /api/push/subscribe with subscription JSON
```

### Push Subscription Storage (Backend — Single User)

Because this is a single-user app with no auth, the push subscription is stored in a module-level variable in `routes/push.ts`. This survives Render.com server restarts only if Render keeps the process alive (it does for paid tiers; on free tier, user must re-subscribe after wake). A future improvement is storing the subscription in Supabase.

```typescript
// routes/push.ts
let activeSubscription: PushSubscription | null = null;

// POST /api/push/subscribe
activeSubscription = req.body;
```

The `reminders.ts` service imports and reads `activeSubscription` when sending notifications.

### VAPID Keys

Generated once with `npx web-push generate-vapid-keys`. Public key stored in `VITE_VAPID_PUBLIC_KEY` (frontend env). Private key stored in `VAPID_PRIVATE_KEY` (backend env, never exposed).

---

## 7. Environment Variables

### Frontend: frontend/.env

```bash
# Base URL for all API calls — no trailing slash
VITE_API_BASE_URL=https://smart-todo-api.onrender.com

# VAPID public key for push subscription (NOT secret — must be public)
VITE_VAPID_PUBLIC_KEY=BExampleVapidPublicKeyHere...
```

Frontend env vars must be prefixed `VITE_` to be exposed via `import.meta.env`. These are safe to be public — they contain no secrets.

### Backend: backend/.env (never committed)

```bash
# Supabase
SUPABASE_URL=https://xyzxyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Web Push (VAPID)
VAPID_PUBLIC_KEY=BExampleVapidPublicKeyHere...
VAPID_PRIVATE_KEY=ExampleVapidPrivateKeyHere...
VAPID_CONTACT_EMAIL=your@email.com

# CORS
FRONTEND_URL=https://smart-todo.vercel.app

# Server
PORT=3001
NODE_ENV=production
```

### backend/.env.example (committed to repo)

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_CONTACT_EMAIL=
FRONTEND_URL=
PORT=3001
NODE_ENV=development
```

---

## 8. Key Architectural Decisions

### 8.1 No Authentication

**Decision**: No login, no auth middleware, no JWT.
**Rationale**: PRD explicitly states single-user (Chakri). Auth adds ~2 weeks of work, a Supabase Auth dependency, and complexity to every API call. The app is accessed from a personal device. Risk is acceptable — no sensitive data is stored beyond personal task text.
**Future escape hatch**: Supabase Auth can be layered on later with minimal schema changes. The absence of `user_id` on the `tasks` table would require a migration, but the API surface would not change.

---

### 8.2 No Redux / No Zustand

**Decision**: TanStack Query for server state + React `useState`/`useReducer` for local UI state.
**Rationale**: All persistent state lives in Supabase. The client is primarily a view layer with optimistic updates. Redux would add boilerplate for actions, reducers, and selectors with no benefit. Zustand would be appropriate if there were complex client-side computed state shared across 5+ components — this app does not have that. TanStack Query's `setQueryData` covers the optimistic update pattern cleanly.

---

### 8.3 No Charting Library for Dashboard

**Decision**: WeekBarChart.tsx uses pure SVG — no Recharts, Chart.js, or similar.
**Rationale**: A 7-bar chart is simple enough to render with SVG `<rect>` elements. Adding Recharts adds ~200KB to the bundle. iPhone Safari is the target; bundle size matters for initial load on cellular. If the dashboard grows to multiple chart types, Recharts can be introduced.

---

### 8.4 No ML for Override Learning

**Decision**: Frequency counting with pattern threshold (3 occurrences, same direction, same field).
**Rationale**: ML models require training data, infrastructure, and introduce latency. Injecting learned rules as English text into the Claude prompt leverages the LLM's own language understanding to apply preferences. This keeps the backend stateless (no model weights), the logic readable, and the behavior explainable to the user in the Settings screen.

---

### 8.5 Single Push Subscription in Memory

**Decision**: Store the Web Push subscription in a module-level variable, not Supabase.
**Rationale**: Single-user app, single device. Database storage would require schema changes and adds latency to the reminder cron. The tradeoff is subscription loss on server restart (Render.com free tier sleeps). Acceptable for Phase 1; the Settings screen can show a "Re-enable notifications" button as a recovery flow.

---

### 8.6 Vite + React (No Next.js)

**Decision**: React + Vite, not Next.js.
**Rationale**: This is a fully client-rendered app deployed to Vercel as a static bundle. There is no SEO requirement, no server-side rendering benefit, and no need for React Server Components. Next.js would introduce an unnecessary Node.js runtime on Vercel, adding cold start latency. Vite produces a smaller, faster static output.

---

### 8.7 Supabase Anon Key on Backend Only

**Decision**: The Supabase client is initialized only in the backend. The frontend never touches Supabase directly.
**Rationale**: Row Level Security (RLS) on Supabase requires authenticated users for fine-grained access control. Since there is no auth, exposing the anon key on the frontend would allow anyone who opens DevTools to query the database directly. Keeping all DB access behind the Express API ensures the backend can validate, sanitize, and audit every operation.

---

### 8.8 Zod for Runtime Validation

**Decision**: Zod schemas validate all incoming request bodies at the Express layer.
**Rationale**: TypeScript types are erased at runtime. The Claude API response and all client-submitted data must be validated before touching the database. Zod provides type-safe parsing with detailed error messages, used both in the `validate` middleware and in `parseClaudeResponse`.

---

### 8.9 File Size Budget

All files are designed to stay under 500 lines per the CLAUDE.md constraint. Separation strategy:
- Routes own only: validation call + service orchestration + response shaping (target: <80 lines)
- Services own: business logic (target: <150 lines each)
- DB modules own: all SQL/Supabase queries (target: <100 lines each)
- Components are split at the point where a sub-component would be reused or independently testable

---

### 8.10 Phase 1.5 Additions (Weeks 5–6)

The following features slot into the existing architecture without structural changes:

| Feature | Where it plugs in |
|---------|------------------|
| F-08 Manual Override | Already designed — `OverrideDrawer`, `useOverride`, `routes/overrides.ts` |
| F-09 AI Learning | Already designed — `services/preferences.ts` |
| F-10 AI Re-prioritize | New button on TaskCard → POST /api/tasks/:id/reprioritize → calls Claude with updated context |
| F-11 Category Filter | `TaskList.tsx` accepts a filter prop; `HomeScreen` adds filter chips above the list |

---

## Appendix: Key Type Definitions

```typescript
// frontend/src/types/task.ts

export type Category = 'Work' | 'Study' | 'Personal' | 'Health' | 'Errand';
export type Priority = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  raw_input: string;
  title: string;
  category: Category;
  priority: Priority;
  scheduled_date: string | null;   // ISO date "YYYY-MM-DD"
  scheduled_time: string | null;   // "HH:MM"
  duration_minutes: number | null;
  ai_reasoning: string;
  is_completed: boolean;
  completed_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  _hasOverride?: boolean;          // client-only flag: true if override_log has rows for this task
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

// frontend/src/types/api.ts

export interface CreateTaskRequest {
  raw_input: string;
  current_date: string;   // ISO datetime, for Claude context
}

export interface PatchOverrideRequest {
  field: keyof Pick<Task, 'category' | 'priority' | 'scheduled_date' | 'scheduled_time' | 'duration_minutes'>;
  ai_value: string;
  user_value: string;
  reason: string;          // max 80 chars
  task_keywords: string[];
}

export interface DashboardStats {
  total_tasks: number;
  completed_today: number;
  completion_rate: number;   // 0–100
  top_category: Category | null;
  tasks_this_week: number;
  overdue_count: number;
  week_chart: Array<{
    date: string;
    total: number;
    completed: number;
  }>;
}
```

---

## Appendix: Claude Prompt Contract

```
SYSTEM:
You are a task scheduling assistant for a personal productivity app.
Analyze the user's task description and return scheduling details as JSON.

Current date and time: {currentDate}

{if rules.length > 0}
--- Learned User Preferences ---
{rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}
--- End Preferences ---
{endif}

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "concise action-oriented task title (max 60 chars)",
  "category": "Work" | "Study" | "Personal" | "Health" | "Errand",
  "scheduled_date": "YYYY-MM-DD or null",
  "scheduled_time": "HH:MM (24h) or null",
  "duration_minutes": integer or null,
  "priority": 1 | 2 | 3 | 4 | 5,
  "reasoning": "1-2 sentence explanation of your choices"
}

Priority scale: 1=Critical, 2=High, 3=Medium, 4=Low, 5=Minimal.
Do not include markdown, code fences, or any text outside the JSON object.

USER:
{raw_input}
```
