# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart To-Do** is an AI-powered, chat-first task management app for a single user (Chakri). Users type tasks in plain English; Claude AI auto-assigns category, priority (1–5), date/time, and duration. The app learns from manual overrides to improve future suggestions.

Targets iPhone Safari (web) and iOS/Android (mobile via Expo). No auth required for web; mobile has Supabase Auth.

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | React + Vite, React Router v6, TanStack Query v5 |
| Mobile | Expo (React Native), Expo Router file-based routing |
| Shared | `packages/shared` — types, API client, hooks used by both frontend and mobile |
| Styling | Tailwind CSS (web), NativeWind (mobile) |
| Backend | Node.js + Express + TypeScript, Zod validation |
| AI | Claude API (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk` |
| Database | Supabase (PostgreSQL + RLS) |
| Frontend hosting | Vercel |
| Backend hosting | Railway.com |
| Notifications | Web Push API + Service Worker |

## Monorepo Structure

```
/
├── packages/shared/        # Shared types, API functions, hooks (@smart-todo/shared)
│   └── src/
│       ├── api/            # apiFetch client + per-resource API functions
│       ├── hooks/          # useTasks, useDashboard, useEnergy, useFocus, etc.
│       ├── types/          # task.ts, api.ts
│       └── constants/      # categories
├── frontend/               # React + Vite web app
│   └── src/
│       ├── screens/        # HomeScreen, CalendarScreen, DashboardScreen, DailyPlanScreen,
│       │                   #   TimeBlockScreen, TemplatesScreen, ShareScreen, SettingsScreen
│       ├── components/     # auth/, calendar/, chat/, dashboard/, home/, layout/, settings/, tasks/
│       ├── hooks/          # Web-only hooks (useNotifications, useRealtimeSync, useTheme, etc.)
│       ├── api/            # Web-specific API wrappers
│       └── lib/            # apiSetup.ts — configures shared API client base URL
├── mobile/                 # Expo React Native app
│   └── app/
│       ├── (tabs)/         # index, dashboard, timeline, calendar, plan, settings, templates
│       ├── (auth)/         # login screen
│       └── share/          # share extension entry
│   └── src/
│       ├── components/     # AnimatedSplash, EnergyBanner, SmartSuggestions, TimelineTaskBlock
│       ├── contexts/       # AuthContext, TabScrollContext, ThemeContext
│       └── lib/            # apiSetup.ts, supabase.ts
└── backend/                # Express API
    └── src/
        ├── routes/         # 16 route files (tasks, overrides, subtasks, dependencies,
        │                   #   push, dashboard, preferences, focus, focusSessions,
        │                   #   conversation, energy, calendar, shares, user,
        │                   #   dailyPlan, templates, transcribe)
        ├── services/       # claude.ts, preferences.ts, reminders.ts, templateSpawner.ts, dashboard.ts
        ├── cron/           # reminderJob.ts, morningPlanJob.ts, weeklyReviewJob.ts
        ├── middleware/     # auth.ts, cors.ts, errorHandler.ts, validate.ts
        ├── schemas/        # taskSchemas.ts, overrideSchemas.ts (Zod)
        └── db/             # supabase.ts
```

## Build & Dev Commands

```bash
# Install all workspaces from root
npm install

# Frontend (run from /frontend)
npm run dev          # Vite dev server
npm run build        # tsc + vite build
npm run lint
npm run test         # vitest run (all)
npx vitest run src/__tests__/taskCard.test.tsx   # single test

# Backend (run from /backend)
npm run dev          # nodemon + ts-node
npm run build        # tsc
npm run test

# Mobile (run from /mobile)
npx expo start
npx expo run:ios

# Shared package (run from /packages/shared)
npm run build        # tsc
```

## API Routes (backend)

All routes are prefixed `/api/`:

| Route | Purpose |
|-------|---------|
| `POST /tasks` | Submit raw input → Claude analyzes → insert task |
| `PATCH /tasks/:id` | Update task fields |
| `PATCH /tasks/:id/override` | Record manual override + update task |
| `GET/POST /tasks/:taskId/subtasks` | Subtask management |
| `GET/POST /tasks/:taskId/dependencies` | Task dependency graph |
| `GET /dashboard` | Aggregated stats |
| `POST /conversation` | Multi-turn AI conversation about tasks |
| `GET/POST /energy` | Energy level tracking |
| `GET/POST /focus` | Focus mode sessions |
| `GET /focus-sessions` | Session history |
| `GET /calendar` | Calendar view data |
| `GET /daily-plan` | AI-generated daily schedule |
| `GET/POST /templates` | Task templates |
| `POST /push` | Push subscription management |
| `GET/POST /preferences` | AI preference rules |
| `GET /shares` | Shareable task views |
| `GET /user` | User profile |
| `POST /transcribe` | Voice-to-text |

## Database Schema

**`tasks`** — `id`, `raw_input`, `title`, `category` (Work|Study|Personal|Health|Errand), `priority` 1–5, `scheduled_date`, `scheduled_time`, `duration_minutes`, `ai_reasoning`, `is_completed`, `completed_at`, `reminder_sent`, `created_at`

**`override_log`** — `id`, `task_id` FK, `field_changed`, `ai_value`, `user_value`, `reason` (≤80 chars), `task_keywords TEXT[]`, `created_at`

## AI System Design

### Task Submission Flow
1. `POST /api/tasks` receives `{ raw_input, current_date }`
2. Backend fetches last 20 `override_log` rows → pattern detection → up to 10 preference rules
3. Claude prompt = system instructions + learned preferences + raw input
4. Claude returns JSON: `{ title, category, scheduled_date, scheduled_time, duration_minutes, priority, reasoning }`
5. Inserted into `tasks`, returned to frontend

### Claude Prompt Contract
Returns **only** a JSON object. On malformed JSON, return error and let user set fields manually.

### Override Learning (frequency counting, no ML)
- Inject learned preferences after 5+ overrides exist
- Pattern triggered when same field overridden same direction 3+ times for similar task types
- Max 10 rules per prompt; rules >60 days old are de-weighted

## Cron Jobs (Render.com)

- **reminderJob** — every 5 min: find tasks 15–20 min away with `reminder_sent = false`, send push
- **morningPlanJob** — daily morning: generate AI daily plan
- **weeklyReviewJob** — weekly: generate review summary

## Key UX Rules

- Override flow ≤ 2 taps — inline pickers only
- Optimistic UI updates on override
- Override indicator: ✎ icon on cards with ≥1 manual change
- Min tap target 44px, min font 16px

## Category Colors

| Category | Hex |
|----------|-----|
| Work | `#3B82F6` |
| Study | `#8B5CF6` |
| Personal | `#10B981` |
| Health | `#F59E0B` |
| Errand | `#EC4899` |

## Phase Scope

- **Phase 1 MVP:** chat input, AI analyzer, task list, calendar, reminders, dashboard ✓
- **Phase 1.5:** manual override, AI learning, re-prioritize, category filter, history ✓
- **Phase 2 (in progress):** Expo mobile app (iOS/Android), voice input (`/transcribe`), energy tracking, focus mode, daily planning, task templates, subtasks, dependencies, sharing
- **Future:** PWA offline, recurring tasks, Google Calendar sync
