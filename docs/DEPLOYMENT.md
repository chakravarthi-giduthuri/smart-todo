# Deployment Guide

Guide for deploying Smart To-Do to production:

- **Frontend** → Vercel (free)
- **Backend** → Railway (free tier)
- **Database** → Supabase (already running)

---

## Architecture Overview

```
User's browser
      │
      ▼
  Vercel (Frontend)          ←── static React/Vite build
      │  /api/* requests
      ▼
  Railway (Backend)          ←── Node.js + Express
      │
      ├──▶ Supabase (PostgreSQL)
      └──▶ Anthropic Claude API
```

---

## Before You Start

Make sure the Supabase tables exist. If you haven't run them yet, go to **Supabase → SQL Editor** and run:

```sql
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

CREATE TABLE push_subscriptions (
  id integer PRIMARY KEY DEFAULT 1,
  endpoint text NOT NULL,
  keys jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## Step 1 — Deploy Backend to Railway

### 1.1 Create a Railway Account

Go to [railway.app](https://railway.app) and sign up with GitHub.

### 1.2 Create a New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Authorize Railway to access your GitHub account if prompted
4. Select `smart-todo`

### 1.3 Configure the Service

Railway will detect the repo. You need to point it at the `backend/` subdirectory:

1. Click on the service that was created
2. Go to **Settings** tab
3. Under **Source**, set **Root Directory** to `backend`
4. Under **Deploy**, set **Start Command** to:
   ```
   npm run build && npm start
   ```

### 1.4 Add Environment Variables

Go to the **Variables** tab and add every variable below:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (`sk-ant-...`) |
| `VAPID_PUBLIC_KEY` | Your VAPID public key |
| `VAPID_PRIVATE_KEY` | Your VAPID private key |
| `VAPID_CONTACT_EMAIL` | Your email address |
| `FRONTEND_URL` | Leave blank for now — you'll fill this after deploying the frontend |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |

> If you need to generate new VAPID keys: `npx web-push generate-vapid-keys`

### 1.5 Deploy

Click **Deploy**. Railway will install dependencies, build TypeScript, and start the server. This takes about 2 minutes.

Once deployed, Railway gives you a public URL like:
```
https://smart-todo-production-xxxx.railway.app
```

Copy this URL — you'll need it for the frontend.

### 1.6 Verify Backend

Visit your Railway URL + `/health`:
```
https://smart-todo-production-xxxx.railway.app/health
```

You should see: `{"ok":true}`

---

## Step 2 — Deploy Frontend to Vercel

### 2.1 Create a Vercel Account

Go to [vercel.com](https://vercel.com) and sign up with GitHub.

### 2.2 Import the Project

1. Click **Add New → Project**
2. Find `smart-todo` in your GitHub repos and click **Import**

### 2.3 Configure the Project

On the configuration screen:

- **Framework Preset**: Vite (Vercel auto-detects this)
- **Root Directory**: Click **Edit** and set it to `frontend`
- **Build Command**: `npm run build` (already set)
- **Output Directory**: `dist` (already set)

### 2.4 Add Environment Variables

Still on the configuration screen, expand **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL (e.g. `https://smart-todo-production-xxxx.railway.app`) |
| `VITE_VAPID_PUBLIC_KEY` | Your VAPID public key (same one from backend) |

### 2.5 Deploy

Click **Deploy**. Vercel builds the frontend and gives you a URL like:
```
https://smart-todo-xxxx.vercel.app
```

---

## Step 3 — Connect Frontend URL to Backend

Now that the frontend URL is known, go back to Railway:

1. Open your service → **Variables** tab
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   https://smart-todo-xxxx.vercel.app
   ```
3. Railway redeploys automatically.

This is required for CORS — the backend only accepts requests from the listed origin.

---

## Step 4 — Set Up a Custom Domain (Optional)

### Vercel Custom Domain

1. Go to your Vercel project → **Settings → Domains**
2. Add your domain (e.g. `todo.yourdomain.com`)
3. Follow the DNS instructions Vercel provides

### Update FRONTEND_URL

After adding a custom domain, update `FRONTEND_URL` in Railway to your custom domain:
```
https://todo.yourdomain.com
```

---

## Step 5 — Install as PWA on iPhone

The app is a Progressive Web App. To install it on iPhone:

1. Open the app URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (box with arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

The app opens full-screen without the browser UI. Push notifications and voice input work over HTTPS.

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `VAPID_PUBLIC_KEY` | Yes | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for Web Push |
| `VAPID_CONTACT_EMAIL` | Yes | Contact email for push provider |
| `FRONTEND_URL` | Yes | Vercel frontend URL (for CORS) |
| `PORT` | Yes | Server port (`3001`) |
| `NODE_ENV` | Yes | Set to `production` |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Railway backend URL |
| `VITE_VAPID_PUBLIC_KEY` | Yes | Same VAPID public key as backend |

---

## Updating the App

### Deploy a New Version

Push to the `main` branch — both Vercel and Railway watch for changes and redeploy automatically:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

Vercel rebuilds the frontend in ~1 min. Railway rebuilds the backend in ~2 min.

### Tag a New Release

```bash
git tag -a v1.1.0 -m "Description of changes"
git push origin v1.1.0
```

Then create a release on GitHub:
```bash
gh release create v1.1.0 --title "v1.1.0" --notes "What changed"
```

---

## Monitoring

### Check Backend Logs

In Railway, click your service → **Logs** tab. Useful log lines to look for:

```
[Server] Running on port 3001       ← server started
[Reminders] Loaded subscription     ← push subscription loaded from DB
[Reminders] Sent push for task:...  ← notification sent successfully
[Reminders] Cron tick               ← cron running every 5 min
```

### Check Frontend Deploys

In Vercel, go to your project → **Deployments** tab. Each deploy shows build logs and status.

### Health Check URL

```
https://your-railway-url.railway.app/health
```

Returns `{"ok":true}` when the backend is up.

---

## Common Issues

**Frontend shows blank page after deploy**

- Check Vercel build logs for errors
- Verify `Root Directory` is set to `frontend` in Vercel settings
- Make sure `VITE_API_URL` is set and points to the Railway URL (no trailing slash)

**API requests fail (network error or CORS)**

- Confirm `FRONTEND_URL` in Railway matches your Vercel URL exactly (including `https://`)
- Check Railway logs to see if the server is running
- Visit the `/health` endpoint directly to confirm the backend is up

**Push notifications not arriving**

- VAPID keys must match between frontend and backend — `VITE_VAPID_PUBLIC_KEY` = `VAPID_PUBLIC_KEY`
- The app must be opened over HTTPS (Vercel provides this automatically)
- On iPhone, the app must be installed as a PWA via **Add to Home Screen** for push to work
- Check Railway logs for `[Reminders]` lines — if the cron is running but no push is sent, the subscription may have expired. Re-enable notifications in Settings

**Backend crashes on startup**

- Most likely a missing environment variable. Check Railway logs for the exact error
- Common: `Missing SUPABASE_URL or SUPABASE_ANON_KEY` → add the variable in Railway
- Common: `Vapid public key should be 65 bytes` → re-generate VAPID keys and update both services

**Tasks not saving / Claude errors**

- Check `ANTHROPIC_API_KEY` is set correctly in Railway
- The Claude model used is `claude-haiku-4-5-20251001` — make sure your Anthropic account has access
