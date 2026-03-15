# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart To-Do** is an AI-powered, chat-first task management web app for a single user (Chakri). Users type tasks in plain English; Claude AI analyzes each submission and auto-assigns category, priority (1–5), date/time, and duration. The app learns from manual overrides to improve future suggestions.

Phase 1 MVP targets iPhone Safari (RWD). No auth required — single-user only.

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | React + Vite |
| Styling | Tailwind CSS (mobile-first, 375px+) |
| Backend | Node.js + Express |
| AI | Claude API (Anthropic) — model `claude-haiku-4-5-20251001` for task analysis |
| Database | Supabase (PostgreSQL) |
| Frontend hosting | Vercel |
| Backend hosting | Render.com |
| Notifications | Web Push API + Service Worker |

## Build & Dev Commands

```bash
# Frontend (React + Vite)
npm run dev          # start dev server
npm run build        # production build
npm run preview      # preview production build
npm run lint         # lint frontend code

# Backend (Node.js + Express)
npm run dev          # start with nodemon
npm start            # production start

# Run a single test
npx vitest run src/path/to/test.test.ts
```

## Architecture

```
/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/   # TaskCard, ChatBar, CalendarView, Dashboard
│   │   ├── screens/      # Home, Calendar, Dashboard, Settings
│   │   ├── hooks/        # useTaskManager, useNotifications, useOverrides
│   │   ├── api/          # API client functions
│   │   └── sw.ts         # Service Worker for push notifications
│   └── public/
├── backend/           # Node.js + Express API
│   ├── routes/
│   │   ├── tasks.ts      # POST /api/tasks, PATCH /api/tasks/:id/override
│   │   └── notifications.ts
│   ├── services/
│   │   ├── claude.ts     # Claude API prompt builder + caller
│   │   ├── preferences.ts # Pattern detection from override_log
│   │   └── reminders.ts  # Cron job: query tasks due in 15–20 min, push notification
│   └── db/
│       └── supabase.ts   # Supabase client
```

## Database Schema

**`tasks`** — core task table
- `id` UUID PK, `raw_input` TEXT, `title` TEXT, `category` (Work|Study|Personal|Health|Errand)
- `priority` INT 1–5, `scheduled_date` DATE, `scheduled_time` TIME
- `duration_minutes` INT, `ai_reasoning` TEXT
- `is_completed` BOOL, `completed_at` TIMESTAMP, `reminder_sent` BOOL, `created_at` TIMESTAMP

**`override_log`** — every manual field change
- `id` UUID PK, `task_id` UUID FK, `field_changed` TEXT
- `ai_value` TEXT, `user_value` TEXT, `reason` TEXT (max 80 chars)
- `task_keywords` TEXT[], `created_at` TIMESTAMP

## AI System Design

### Task Submission Flow
1. `POST /api/tasks` receives `{ raw_input, current_date }`
2. Backend fetches last 20 rows from `override_log`, runs pattern detection → generates up to 10 preference rules (English sentences)
3. Claude prompt = system instructions + learned preferences block + raw input
4. Claude returns JSON: `{ title, category, scheduled_date, scheduled_time, duration_minutes, priority, reasoning }`
5. Row inserted into `tasks`, returned to frontend

### Claude Prompt Contract
Claude must return **only** a JSON object. Backend validates schema; on malformed JSON, return error and let user set priority/category manually.

### Override Learning (no ML — frequency counting)
- After 5+ overrides exist, inject learned preferences into every prompt
- Pattern rule triggered when same field overridden in same direction 3+ times for similar task types
- Max 10 rules per prompt; rules older than 60 days are de-weighted
- `PATCH /api/tasks/:id/override` → updates `tasks` table + inserts into `override_log`

## Key UX Rules

- **Override flow must be ≤ 2 taps** — inline pickers only, no navigation modals
- Optimistic UI updates on override (don't wait for API response)
- Override indicator: pencil icon (✎) on any card with ≥1 manual change
- Minimum tap target: 44px (Apple HIG); minimum font size: 16px
- Claude API key lives in backend env only — never sent to frontend

## Notification System

- Service Worker registered on first load; request push permission immediately
- Backend cron (every 5 min on Render.com) queries tasks where `scheduled_time` is 15–20 min from now AND `reminder_sent = false`
- After sending push: set `reminder_sent = true`
- Requires Safari iOS 16.4+

## Category Color System

| Category | Hex |
|----------|-----|
| Work | `#3B82F6` |
| Study | `#8B5CF6` |
| Personal | `#10B981` |
| Health | `#F59E0B` |
| Errand | `#EC4899` |

## Phase Scope

- **Phase 1 MVP (Weeks 1–4):** F-01 to F-07 — chat input, AI analyzer, task list, calendar, reminders, dashboard
- **Phase 1.5 (Weeks 5–6):** F-08 to F-11 — manual override, AI learning, re-prioritize, category filter, history
- **Phase 2+:** PWA offline, recurring tasks, voice input, React Native

**Out of scope for Phase 1:** auth/login, multi-user, Google Calendar sync, email/SMS notifications, custom reminder windows.
