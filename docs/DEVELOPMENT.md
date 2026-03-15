# Development Setup Guide

Local development guide for the Smart To-Do app — React frontend + Node.js backend + Supabase database + Claude AI.

---

## Prerequisites

Make sure you have these installed:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node)
- A **Supabase** account — [supabase.com](https://supabase.com)
- An **Anthropic** API key — [console.anthropic.com](https://console.anthropic.com)

---

## 1. Clone the Repository

```bash
git clone https://github.com/chakravarthi-giduthuri/smart-todo.git
cd smart-todo
```

---

## 2. Supabase Setup

### Create a Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, set a database password, pick a region close to you
3. Wait for the project to finish provisioning (~1 min)

### Create the Database Tables

Go to **SQL Editor** in the Supabase dashboard and run each block:

```sql
-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_input text NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Work','Study','Personal','Health','Errand')),
  priority integer NOT NULL CHECK (priority BETWEEN 1 AND 5),
  scheduled_date date,
  scheduled_time time,
  duration_minutes integer,
  ai_reasoning text,
  reminder_minutes_before integer NOT NULL DEFAULT 15,
  is_completed boolean NOT NULL DEFAULT false,
  reminder_sent boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

```sql
-- Task overrides table (AI learning system)
CREATE TABLE task_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  ai_value text NOT NULL,
  user_value text NOT NULL,
  reason text NOT NULL,
  task_keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

```sql
-- Push subscriptions (for persistent Web Push notifications)
CREATE TABLE push_subscriptions (
  id integer PRIMARY KEY DEFAULT 1,
  endpoint text NOT NULL,
  keys jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Get Your API Keys

In the Supabase dashboard go to **Project Settings → API**:

- Copy **Project URL** → this is your `SUPABASE_URL`
- Copy **anon / public** key → this is your `SUPABASE_ANON_KEY`

---

## 3. Generate VAPID Keys (Web Push)

VAPID keys are required for push notifications. Run this once:

```bash
npx web-push generate-vapid-keys
```

Save both keys — you'll need them in the env files below.

---

## 4. Backend Setup

```bash
cd backend
npm install
```

Create the `.env` file:

```bash
cp .env.example .env
```

Open `backend/.env` and fill in all values:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-...
VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_CONTACT_EMAIL=you@example.com
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

Start the backend in development mode (auto-restarts on file changes):

```bash
npm run dev
```

The backend runs at **http://localhost:3001**. Verify it's healthy:

```bash
curl http://localhost:3001/health
# → {"ok":true}
```

---

## 5. Frontend Setup

Open a new terminal tab:

```bash
cd frontend
npm install
```

Create the `.env` file:

```bash
cp .env.example .env
```

Open `frontend/.env` and fill in:

```env
VITE_API_URL=http://localhost:3001
VITE_VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> `VITE_VAPID_PUBLIC_KEY` must be the same public key you put in `backend/.env`.

Start the frontend dev server:

```bash
npm run dev
```

The app runs at **http://localhost:5173**.

> The Vite dev server proxies all `/api/*` requests to `http://localhost:3001` automatically — no CORS issues in development.

---

## 6. Running Both Together

You need two terminals running simultaneously:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `backend/` | `npm run dev` |
| 2 | `frontend/` | `npm run dev` |

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
smart-todo/
├── backend/
│   ├── src/
│   │   ├── cron/          # Reminder scheduler (runs every 5 min)
│   │   ├── db/            # Supabase query functions
│   │   ├── middleware/     # CORS, error handling, Zod validation
│   │   ├── routes/         # Express route handlers
│   │   ├── schemas/        # Zod input schemas
│   │   ├── services/       # Claude AI, push notifications, AI learning
│   │   ├── types/          # TypeScript interfaces
│   │   └── index.ts        # Server entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # API client functions
│   │   ├── components/     # React components (organized by feature)
│   │   ├── contexts/       # ThemeContext
│   │   ├── hooks/          # Custom React hooks
│   │   ├── screens/        # Full-page screen components
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Date helpers, priority labels
│   ├── public/
│   │   ├── sw.js           # Service worker (handles push notifications)
│   │   └── manifest.json   # PWA manifest
│   ├── .env.example
│   └── package.json
│
└── docs/
    ├── DEVELOPMENT.md      # This file
    └── DEPLOYMENT.md       # Production deployment guide
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tasks` | Create task via Claude AI |
| `GET` | `/api/tasks` | List tasks (filter by `category`, `completed`) |
| `PATCH` | `/api/tasks/:id/complete` | Mark task complete |
| `PATCH` | `/api/tasks/:id/field` | Edit a task field (title, date, time) |
| `POST` | `/api/tasks/:id/overrides` | Record an AI override for learning |
| `GET` | `/api/preferences/insights` | Get AI learning journal data |
| `DELETE` | `/api/preferences/reset` | Reset all learned preferences |
| `POST` | `/api/push/subscribe` | Register push subscription |
| `GET` | `/api/dashboard` | Dashboard stats |
| `GET` | `/health` | Health check |

---

## Available Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (ts-node + nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled JS (production) |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at port 5173 |
| `npm run build` | Type-check + build to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Push Notifications in Development

Web Push requires **HTTPS** in production, but works on `localhost` in development.

To test notifications locally:
1. Open the app at `http://localhost:5173`
2. Go to **Settings** → tap **Enable Notifications** → allow the browser prompt
3. Create a task and say something like `"remind me in 2 minutes to test"`
4. The backend cron runs every 5 minutes — you should receive the notification within that window

> Push notifications require the backend to be running. The subscription is stored in Supabase so it persists across backend restarts.

---

## Voice Input

Voice input uses the browser's **Web Speech API**:

- Works in **Chrome** and **Edge** on desktop and Android
- Works in **Safari** only when the app is installed as a PWA over HTTPS
- Does not work in Firefox (no Web Speech API support)

---

## Common Issues

**`Missing SUPABASE_URL or SUPABASE_ANON_KEY`**
The backend `.env` file is missing or the values are empty. Double-check `backend/.env`.

**`Vapid public key should be 65 bytes long`**
The VAPID keys are wrong or mismatched between frontend and backend. Re-generate with `npx web-push generate-vapid-keys` and update both `.env` files.

**`CORS blocked: http://...`**
The `FRONTEND_URL` in `backend/.env` doesn't match where the frontend is running. Set it to `http://localhost:5173` for local dev.

**Tasks show wrong date/time**
The frontend sends the local timezone to the backend with every task creation. Make sure you're accessing the app from a browser that reports `Intl.DateTimeFormat().resolvedOptions().timeZone` correctly — all modern browsers do.

**Mic button not working**
Chrome requires HTTPS for microphone access on non-localhost origins. Locally it works on `http://localhost:5173`. On mobile, install the app as a PWA over HTTPS.
