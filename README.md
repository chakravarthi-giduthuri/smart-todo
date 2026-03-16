# Smart To-Do

An AI-powered task manager. Type tasks in plain English — Claude AI organizes them automatically.

![Smart To-Do](https://img.shields.io/badge/Status-Live-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![Claude](https://img.shields.io/badge/Claude-Haiku-orange)

---

## What it does

Type anything like *"dentist appointment Friday at 2pm"* or *"finish the report ASAP"* — the app calls Claude AI and automatically fills in:

- **Category** — Work, Study, Personal, Health, Errand
- **Priority** — 1 (Critical) to 5 (Minimal)
- **Date & Time** — smart defaults based on task type
- **Duration** — realistic estimates
- **Reminder** — push notification before the task
- **Context tags** — `@home`, `@work`, `@phone`, `@5min`, `@errands`
- **Recurrence** — daily, weekdays, weekly, monthly
- **Note** — a helpful one-line reminder

The more you use it, the smarter it gets — manual overrides are tracked and fed back into future AI prompts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Data Fetching | TanStack React Query |
| Backend | Node.js + Express + TypeScript |
| AI | Claude API (`claude-haiku-4-5-20251001`) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |
| Notifications | Web Push API + Service Worker |

---

## Features

- **Chat-first input** — one text box, no forms
- **AI task structuring** — category, priority, date, time, duration, tags, recurrence
- **Smart Suggestions** — ranks tasks by priority, urgency, and your current energy level
- **Energy tracking** — set High / Medium / Low energy; suggestions adapt accordingly
- **AI Reschedule** — Claude picks the next best time slot for any task
- **Inline notes** — add/edit/delete notes per task
- **Calendar view** — monthly with colored category dots (mobile) or task pills (desktop)
- **Analytics** — weekly trends with bar/line chart toggle, streak tracking
- **Push notifications** — remind you 15 min before scheduled tasks
- **Override learning** — manually correct AI, it learns your preferences
- **Real-time sync** — Supabase Realtime keeps all tabs in sync
- **Dark / Light mode**
- **PWA-ready** — works on iPhone Safari

---

## Project Structure

```
/
├── frontend/                  # React + Vite app (deployed on Vercel)
│   └── src/
│       ├── api/               # API client + fetch functions
│       ├── components/        # TaskCard, ChatBar, Calendar, SmartSuggestions
│       ├── screens/           # Home, Calendar, Dashboard, Settings
│       ├── hooks/             # React Query hooks
│       ├── contexts/          # Auth, Theme
│       └── lib/               # Supabase client
│
└── backend/                   # Express API (deployed on Railway)
    └── src/
        ├── db/                # Supabase query functions
        ├── middleware/        # Auth (JWT), validation, error handler
        ├── routes/            # tasks, subtasks, dashboard, energy, overrides
        ├── services/          # Claude prompts, preference learning, dashboard stats
        └── cron/              # Reminder, morning plan, weekly review jobs
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Supabase project
- Anthropic API key

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev            # starts on http://localhost:3001
```

**Required env vars:**
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_CONTACT_EMAIL=
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in your keys
npm run dev            # starts on http://localhost:5173
```

**Required env vars:**
```
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
```

---

## Deployment

### Backend → Railway
1. Connect your GitHub repo to Railway
2. Set the environment variables listed above in Railway → Variables
3. Railway auto-deploys on every push to `main`

### Frontend → Vercel
1. Connect your GitHub repo to Vercel
2. Set `VITE_API_URL` to your Railway backend URL
3. Set the other `VITE_*` environment variables
4. Vercel auto-deploys on every push to `main`

---

## How the AI Works

```
User types task
       ↓
Backend fetches last 20 overrides → builds preference rules
       ↓
Builds Claude prompt (task + preferences + current date/time/energy)
       ↓
Claude returns JSON: { title, category, priority, date, time, duration, ... }
       ↓
Task saved to Supabase → returned to frontend
```

### Override Learning

Every time you manually change a field (e.g., change category from "Work" to "Personal"), it's logged with the reason. After 5+ overrides, the backend detects patterns and injects them as rules into the next Claude prompt:

> "User always changes meeting tasks from Work → Personal"
> "User prefers Health tasks at 06:00, not 09:00"

---

## Database Schema

**`tasks`**
`id`, `user_id`, `raw_input`, `title`, `category`, `priority`, `scheduled_date`, `scheduled_time`, `duration_minutes`, `ai_reasoning`, `is_completed`, `is_archived`, `reminder_sent`, `recurrence`, `context_tags`, `note`, `timezone_offset_minutes`

**`override_log`**
`id`, `user_id`, `task_id`, `field_changed`, `ai_value`, `user_value`, `reason`, `task_keywords`

**`energy_checkins`**
`id`, `user_id`, `date`, `level`

**`subtasks`**
`id`, `task_id`, `title`, `is_completed`, `position`

---

## Documentation

Full project journey, architecture decisions, and troubleshooting log:
[`docs/PROJECT_JOURNEY.md`](docs/PROJECT_JOURNEY.md)
