# Smart To-Do — Project Journey

A complete record of how the app was built, every problem encountered, and how each was solved.

---

## 1. What We Built

**Smart To-Do** is an AI-powered task manager for a single user (Chakri). You type a task in plain English — "remind me to call the doctor tomorrow at 3pm" — and Claude AI automatically assigns the category, priority, scheduled date/time, duration, and a helpful reminder note. The app learns from your manual corrections over time and gets smarter.

### Live URLs
- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Express)
- **Database**: Supabase (PostgreSQL)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (mobile-first) |
| State / Data | TanStack React Query |
| Backend | Node.js + Express + TypeScript |
| AI | Claude API (`claude-haiku-4-5-20251001`) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |
| Notifications | Web Push API + Service Worker |

---

## 3. Features Built

### Core
- **Chat-first task input** — plain English → AI-structured task
- **AI task analysis** — category, priority (1–5), date, time, duration, reminder, context tags, recurrence, note
- **Override learning** — manual corrections are tracked; after 5+ overrides Claude adapts to your preferences
- **Real-time sync** — Supabase Realtime invalidates React Query cache on any DB change

### Home Screen
- Greeting with energy-aware subtitle
- Stats tiles (Energy / Tasks / Streak) — compact on mobile, full cards on desktop
- Energy picker (High / Medium / Low) — affects AI Suggestions ranking
- **Smart Suggestions** — priority + urgency scoring algorithm, paginated 3 at a time
- **Today's Tasks** — only tasks scheduled for today or overdue (never undated/future)
- Today's Progress bar
- Upcoming in Next Hour panel
- Future Tasks (tomorrow onwards)
- Completed tasks section at bottom

### Task Cards
- Complete / Archive / Delete
- AI Reschedule — Claude picks a new optimal time slot for any incomplete task
- Inline Note editor — create/edit/delete note with Cmd+Enter shortcut
- Override with reason tracking
- Snooze

### Calendar
- Month grid with desktop task pills
- Mobile: colored dots per date instead of full pills (3 max, grey overflow dot)

### Analytics (Dashboard)
- KPI cards: completion rate, streak, top category, overdue count
- Progressive Trend section with **bar / line chart toggle**
  - Bar: actual data bars, today highlighted
  - Line: SVG area chart with cubic bezier curve, gradient fill, dot markers
- Mini KPI footer: Peak Day / Avg per Day / Best Run

### Settings
- Profile update, password change
- Theme toggle (dark/light)
- Delete account

### Auth
- Supabase email/password + Google OAuth
- JWT validated on every backend request
- Protected routes redirect to login if no session

---

## 4. UI/UX Decisions

- **No "New Task" button in sidebar** — the chat bar at the bottom handles all task creation
- **Mobile calendar dots** — full task pills were too cramped; colored dots keep it clean
- **Today's Tasks excludes undated tasks** — undated tasks were appearing as "Tomorrow" which was confusing
- **AI Reschedule on all incomplete tasks** — not just overdue ones; any task can be rescheduled
- **Note button always visible** — amber when note exists, grey/dim when empty, with "add note" label

---

## 5. Problems Faced & How We Solved Them

---

### Problem 1 — Tomorrow's tasks showing in "Today's Tasks"

**Symptom**: The Today's Tasks section was showing tasks that had no scheduled date, and TaskCard was displaying them as "Tomorrow".

**Root cause**:
```ts
// Old filter — included undated tasks
t.scheduled_date && t.scheduled_date <= today  // ❌ !t.scheduled_date was also true
```

**Fix**:
```ts
// New filter — only tasks with an explicit date that is today or past
t.scheduled_date && t.scheduled_date <= today  // ✅
```

---

### Problem 2 — AI Suggestions not ranking correctly

**Symptom**: Suggestions weren't reflecting urgency or energy level.

**Root cause**: The original suggestion logic was too simple — no scoring algorithm.

**Fix**: Rewrote `SmartSuggestions.tsx` with a proper `scoreTask()` function:

```ts
score += (6 - task.priority) * 12;  // priority 1 = 60pts
if (overdue)    score += 40;
if (dueToday)   score += 25;
if (tomorrow)   score += 10;
if (energyMatch) score += 15;       // category matches energy level
if (task.scheduled_time) score += 5;
if (@5min tag)  score += 8;
```

Energy affinity:
- High energy → Work, Study
- Medium energy → Work, Personal, Errand
- Low energy → Personal, Health, Errand

---

### Problem 3 — AI Reschedule only worked on overdue tasks

**Symptom**: The "AI Reschedule" button wasn't visible on future tasks.

**Root cause**: A condition restricted it to `task.scheduled_date < today`.

**Fix**: Removed the condition — any incomplete task can be rescheduled.

Also improved `buildReschedulePrompt()` to include priority labels, category-based time-of-day rules, and a strict "never pick past time" instruction.

---

### Problem 4 — Note functionality was missing

**Symptom**: The note button existed but did nothing.

**Fix**:
- Added `PATCH /api/tasks/:id/note` backend endpoint
- Added `updateTaskField(id, 'note', note)` to taskQueries
- Added `useUpdateNote()` React Query mutation hook
- Built inline note editor in `TaskCard.tsx`:
  - Amber-styled textarea
  - Save (Cmd+Enter), Cancel (Escape), Remove link
  - Optimistic UI on save

---

### Problem 5 — App not pulling data from Supabase (Production)

This was the most complex issue and went through multiple stages.

#### Stage 1 — Diagnosis
- Backend health check: ✅ working
- Direct Supabase query from backend: ✅ returned data
- Frontend showing 0 tasks, 0/0 stats

**Browser console error**:
```
POST https://smart-todo-production-24df.up.railway.app/api/tasks 500
insertTask failed: new row violates row-level security policy for table "tasks"
```

**Root cause**: The Railway deployment was missing `SUPABASE_SERVICE_ROLE_KEY`. Without it, the backend Supabase client used the anon key, which is subject to RLS policies. Since the backend uses a shared server-side client (not the user's JWT), `auth.uid()` was NULL — so all inserts were blocked and all selects returned 0 rows.

#### Stage 2 — First attempt (env var)
Told user to add `SUPABASE_SERVICE_ROLE_KEY` to Railway Variables.

**Still failed** — the key format (`sb_secret_...`) was Supabase's new smart key format. The Supabase JS SDK v2.39 on the backend may not have handled this format correctly in the service role context.

#### Stage 3 — Second attempt (client options)
Added `auth: { autoRefreshToken: false, persistSession: false }` to the Supabase client creation — the recommended options for server-side service role clients.

**Still failed** — Railway build now errored:
```
ERROR: failed to build: failed to solve: secret SUPABASE_SERVICE_ROLE_KEY: not found
```
Railway's Railpack was scanning the code and treating `SUPABASE_SERVICE_ROLE_KEY` as a required build secret.

#### Stage 4 — Final fix (per-request JWT clients)

**Real fix**: Eliminated the dependency on the service role key entirely. Instead of a global admin Supabase client, every authenticated request now creates a **per-request Supabase client** using the user's own JWT:

```ts
// supabase.ts
export function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

```ts
// auth.ts middleware
req.userSupabase = createUserClient(token);
```

Every route handler and DB query function was updated to use `req.userSupabase`. This means `auth.uid()` in Supabase RLS policies always returns the correct user ID — inserts and selects work correctly without needing to bypass RLS at all.

**Why this is better**: It's the architecturally correct approach. RLS policies work as designed. No secret key needed. Each user can only access their own data.

---

### Problem 6 — Railway build failing after code changes

**Error**: `failed to build: failed to solve: secret SUPABASE_SERVICE_ROLE_KEY: not found`

**Root cause**: `user.ts` (delete account route) still had a hard `process.env.SUPABASE_SERVICE_ROLE_KEY!` reference. Railpack scanned it and required the secret at build time.

**Fix**: Rewrote `user.ts` to use `req.userSupabase` for all data deletion. The service role key is now only used optionally (to delete the Supabase auth user) and is loaded lazily — Railpack no longer picks it up as a required secret.

---

### Problem 7 — Security issues found in code review

After fixing the data loading issue, a full code review revealed:

| Issue | Fix |
|---|---|
| `subtasks.ts` had no `requireAuth` | Added `requireAuth` + `verifyTaskOwnership()` to all endpoints |
| Subtask queries used global anon client | Updated to accept `req.userSupabase` |
| `errorHandler` leaked raw DB errors in production | `err.message` now hidden when `NODE_ENV=production` |
| Frontend env var mismatch (`VITE_API_BASE_URL` vs `VITE_API_URL`) | Fixed in `.env`; update Vercel env var too |

---

## 6. Architecture Decisions

### Why per-request Supabase clients?

The standard backend pattern with a service role key works well — but requires careful key management and breaks when the key isn't available. The per-request JWT approach is simpler:

- No secret key required on the server
- RLS policies enforce data isolation automatically
- Each user literally cannot access another user's data at the DB level
- Works with Supabase's free tier (no service role key needed)

### Why React Query over Redux/Zustand?

Tasks are server state, not client state. React Query gives us caching, background refetch, optimistic updates, and automatic stale/revalidation without boilerplate. The `staleTime: 30_000` means the UI feels instant while staying fresh.

### Why Claude Haiku?

Task analysis doesn't require deep reasoning — it needs fast, consistent JSON output. Haiku is 3–5x cheaper and faster than Sonnet for this use case, with `max_tokens: 500` keeping responses tight.

---

## 7. File Structure (Key Files)

```
/
├── frontend/src/
│   ├── api/
│   │   ├── client.ts          # apiFetch + auth header injection
│   │   └── tasks.ts           # API call functions
│   ├── hooks/
│   │   ├── useTasks.ts        # React Query hooks for all task operations
│   │   ├── useDashboard.ts    # Stats query
│   │   └── useRealtimeSync.ts # Supabase Realtime → cache invalidation
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Main dashboard
│   │   ├── CalendarScreen.tsx # Month/week calendar
│   │   └── DashboardScreen.tsx # Analytics + Progressive Trend
│   └── components/
│       ├── tasks/TaskCard.tsx      # Card with note editor + reschedule
│       ├── home/SmartSuggestions.tsx # Scored suggestions
│       ├── calendar/MonthGrid.tsx  # Dots on mobile, pills on desktop
│       └── layout/SideNav.tsx     # Desktop sidebar
│
└── backend/src/
    ├── db/
    │   ├── supabase.ts        # createUserClient() factory
    │   ├── taskQueries.ts     # All task DB operations (accept user client)
    │   ├── subtaskQueries.ts  # Subtask DB operations (accept user client)
    │   └── overrideQueries.ts # Override log DB operations
    ├── middleware/
    │   ├── auth.ts            # JWT validation + req.userSupabase injection
    │   └── errorHandler.ts    # Hides internal errors in production
    ├── routes/
    │   ├── tasks.ts           # CRUD + reschedule + note + snooze
    │   ├── subtasks.ts        # Subtask CRUD with ownership checks
    │   ├── dashboard.ts       # Stats aggregation
    │   └── user.ts            # Delete account
    └── services/
        ├── claude.ts          # Prompt builders + Claude API caller
        ├── preferences.ts     # Override pattern learning
        └── dashboard.ts       # Stats aggregation logic
```

---

## 8. Final Result

The app is fully deployed and working:

- Users sign in and immediately see their tasks loaded from Supabase
- Type any task in plain English → Claude analyzes it and creates a structured task in under 2 seconds
- Smart Suggestions surface the most important tasks based on priority, urgency, and energy level
- Calendar shows tasks with colored category dots on mobile, full pills on desktop
- Analytics shows weekly trends in bar or line chart format
- All data is isolated per user via Supabase RLS + per-request JWT authentication
- Push notifications remind users 15 minutes before scheduled tasks
- The app works on iPhone Safari (PWA-ready) and desktop browsers
