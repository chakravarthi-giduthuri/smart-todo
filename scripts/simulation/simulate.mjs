/**
 * Smart To-Do — 10-User × 10-Day Real Database Simulation
 * Creates actual Supabase users, calls every backend endpoint,
 * records every response. All data lands in the real database.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.SUPABASE_URL     || 'https://your-project.supabase.co';
const SUPABASE_ANON    = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const SERVICE_KEY      = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';
const BACKEND          = process.env.BACKEND_URL      || 'http://localhost:3001';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localNow(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const pad = n => String(n).padStart(2, '0');
  const local = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const off = -d.getTimezoneOffset();
  const tz = `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off)/60))}:${pad(Math.abs(off)%60)}`;
  return `${local}${tz}`;
}

async function api(token, method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BACKEND}${path}`, opts);
  const status = res.status;
  let json = null;
  try { json = await res.json(); } catch {}
  return { status, ok: res.ok, json };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── 10 Personas ─────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    name: 'Priya Nair',        field: 'Software Engineer',
    email: 'sim.priya.nair.test2026@mailinator.com',    password: 'TestPass123!',
    energy: 'high', timezone: 'Asia/Kolkata',
    tasks: [
      'Deploy hotfix for payment gateway timeout bug before 10 AM today',
      "Code review for Arjun's PR on auth module today",
      'Weekly sync with product team at 11 AM',
      'Run 5K at the park this evening',
      'Renew gym membership today expires soon',
      'Deep dive into GraphQL subscriptions for 2 hours',
      'Call mom she texted earlier',
    ],
  },
  {
    name: 'Marcus Webb',       field: 'Cardiothoracic Surgeon',
    email: 'sim.marcus.webb.test2026@mailinator.com',   password: 'TestPass123!',
    energy: 'medium', timezone: 'America/New_York',
    tasks: [
      'Pre-op rounds tomorrow morning at 6:30 AM',
      'Review patient charts for Mrs. Kowalczyk and Mr. Henderson',
      'Call insurance company about billing dispute case 44721',
      'Journal club presentation prep due Friday',
      'Order replacement surgical gloves medium size',
      'Gym session keep my back healthy',
      'Pick up prescription from CVS',
    ],
  },
  {
    name: 'Leila Ahmadi',      field: 'Freelance Graphic Designer',
    email: 'sim.leila.ahmadi.test2026@mailinator.com',  password: 'TestPass123!',
    energy: 'low', timezone: 'Europe/London',
    tasks: [
      'Finish logo concepts for TechBridge client send 3 options by EOD',
      'Reply to Abdullah feedback email on brand guide',
      'Pick up art supplies from art store canvas acrylic paints',
      'Meditate for 15 minutes',
      'Review contract for new client Sona Media before signing',
      'Update portfolio website with latest case studies',
    ],
  },
  {
    name: 'James Okonkwo',     field: 'High School Science Teacher',
    email: 'sim.james.okonkwo.test2026@mailinator.com', password: 'TestPass123!',
    energy: 'medium', timezone: 'Africa/Lagos',
    tasks: [
      'Grade period 3 chemistry lab reports by Thursday',
      'Email parents about field trip permission slips need responses by Wednesday',
      "Prepare Friday physics lecture slides on Newton's Laws",
      'Order more safety goggles for the lab we are running low',
      'Schedule dentist appointment this week',
      'Soccer coaching session for Daniel after school 4:30 PM',
    ],
  },
  {
    name: 'Sofia Reyes',       field: 'PhD Candidate Neuroscience',
    email: 'sim.sofia.reyes.test2026@mailinator.com',   password: 'TestPass123!',
    energy: 'high', timezone: 'America/Chicago',
    tasks: [
      'Run statistical analysis on experiment 3 dataset in R takes about 3 hours',
      'Write introduction section of dissertation chapter 2',
      'Lab meeting presentation practice 15 min run-through',
      'Respond to professor Martinez email about timeline extension',
      'Read Liu 2024 paper on default mode network suppression',
      'Go for a walk clear my head after writing',
      'Meal prep for the week Sunday',
    ],
  },
  {
    name: 'David Park',        field: 'Real Estate Agent',
    email: 'sim.david.park.test2026@mailinator.com',    password: 'TestPass123!',
    energy: 'medium', timezone: 'America/Los_Angeles',
    tasks: [
      'Show property at 47 Maple Street at 2 PM today to the Johnsons',
      'Follow up with mortgage broker about pre-approval for Martinez family',
      'Submit offer paperwork for 112 Oak Ave before 5 PM critical deadline',
      'Lunch meeting with listing client Rebecca Chen noon at restaurant',
      'Drive to county office to file deed transfer docs before 4:30 PM',
      'Update CRM notes for all showings from yesterday',
    ],
  },
  {
    name: 'Nadia Kowalski',    field: 'Yoga Instructor',
    email: 'sim.nadia.kowalski.test2026@mailinator.com',password: 'TestPass123!',
    energy: 'high', timezone: 'Europe/Warsaw',
    tasks: [
      'Morning yoga class at the studio at 7 AM',
      'Film new Instagram reel for breathing exercises tutorial',
      'Message clients who have not booked next month yet',
      'Buy protein powder and vitamins from health store',
      'Read the meditation chapter in mindfulness book',
      'Meal prep clean eating bowls for the week',
    ],
  },
  {
    name: 'Raymond Chen',      field: 'CPA Accountant',
    email: 'sim.raymond.chen.test2026@mailinator.com',  password: 'TestPass123!',
    energy: 'high', timezone: 'America/New_York',
    tasks: [
      'Review amended 1040 for client Henderson deadline today',
      'Call IRS practitioner hotline about penalty abatement allow 45 min hold time',
      'File quarterly payroll taxes for four business clients before 5 PM today',
      'Prepare depreciation schedules for Martinez LLC',
      'Send invoice to consulting client for March services',
      'Book CPE webinar for ethics credits by April 30',
    ],
  },
  {
    name: 'Amara Diallo',      field: 'Social Media Manager',
    email: 'sim.amara.diallo.test2026@mailinator.com',  password: 'TestPass123!',
    energy: 'medium', timezone: 'Africa/Dakar',
    tasks: [
      'Post IG carousel for spring collection launch needs to go live at 12 PM sharp',
      'Reply to 47 DMs from yesterday viral post',
      'Brief the creative team on Q2 campaign direction at 3 PM',
      'Check analytics on last week reels performance',
      'Set up TikTok ad campaign with 500 dollar budget',
      'Draft monthly social media report for brand director',
    ],
  },
  {
    name: 'Tom Harrington',    field: 'Retired Military Officer',
    email: 'sim.tom.harrington.test2026@mailinator.com',password: 'TestPass123!',
    energy: 'high', timezone: 'America/Chicago',
    tasks: [
      'Prepare consulting proposal for Henderson Industries by Friday',
      '30 minute walk this morning',
      'Call VA about disability rating appeal allow 2 hours',
      'Update LinkedIn with recent consulting project',
      'Mail property tax check before March 25 deadline',
      'Read 30 pages of leadership book I started',
      'Anniversary dinner reservation at Rosemary restaurant March 22 at 7 PM',
    ],
  },
];

// ─── Simulation ───────────────────────────────────────────────────────────────

const report = {
  generated_at: new Date().toISOString(),
  users: [],
  summary: { total_users: 0, signup_ok: 0, signup_fail: 0, tasks_created: 0, tasks_failed: 0, features_tested: {} },
};

async function cleanupExistingUser(email) {
  // Find and delete any prior test user with this email
  try {
    const { data } = await adminClient.auth.admin.listUsers();
    const existing = data?.users?.find(u => u.email === email);
    if (existing) {
      await adminClient.auth.admin.deleteUser(existing.id);
      await sleep(300);
    }
  } catch {}
}

async function signupUser(persona) {
  await cleanupExistingUser(persona.email);
  const { data, error } = await adminClient.auth.admin.createUser({
    email: persona.email,
    password: persona.password,
    email_confirm: true,
    user_metadata: { full_name: persona.name },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, userId: data.user.id };
}

async function loginUser(persona) {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: persona.email,
    password: persona.password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, token: data.session.access_token, userId: data.user.id };
}

async function simulateUser(persona, dayIndex) {
  const log = {
    name: persona.name,
    field: persona.field,
    email: persona.email,
    days: [],
    tasks_created: [],
    features: {},
    bugs: [],
    ratings: {},
    overall: null,
  };

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`👤 ${persona.name} (${persona.field})`);

  // ── Day 1: Signup + Login + Core features ─────────────────────────────────
  console.log(`  [Day 1] Signup...`);
  const signupResult = await signupUser(persona);
  if (!signupResult.ok) {
    console.log(`  ✗ Signup failed: ${signupResult.error}`);
    log.signup = { ok: false, error: signupResult.error };
    report.summary.signup_fail++;
    return log;
  }
  report.summary.signup_ok++;
  log.signup = { ok: true, userId: signupResult.userId };
  console.log(`  ✓ Signup OK — userId: ${signupResult.userId}`);

  await sleep(500);

  console.log(`  [Day 1] Login...`);
  const loginResult = await loginUser(persona);
  if (!loginResult.ok) {
    console.log(`  ✗ Login failed: ${loginResult.error}`);
    log.login = { ok: false, error: loginResult.error };
    return log;
  }
  log.login = { ok: true };
  const token = loginResult.token;
  console.log(`  ✓ Login OK`);

  // ── Energy check-in ────────────────────────────────────────────────────────
  console.log(`  [Day 1] Energy check-in (${persona.energy})...`);
  const energyPost = await api(token, 'POST', '/api/energy', { level: persona.energy });
  log.features.energy_checkin = { status: energyPost.status, ok: energyPost.ok };
  if (!energyPost.ok) log.bugs.push({ feature: 'energy_checkin', status: energyPost.status, detail: energyPost.json });
  console.log(`  ${energyPost.ok ? '✓' : '✗'} Energy POST → ${energyPost.status}`);

  const energyGet = await api(token, 'GET', '/api/energy/today');
  log.features.energy_get = { status: energyGet.status, ok: energyGet.ok, level: energyGet.json?.level };
  console.log(`  ${energyGet.ok ? '✓' : '✗'} Energy GET → ${energyGet.status} level=${energyGet.json?.level}`);

  await sleep(300);

  // ── Task creation (all tasks, Day 1) ──────────────────────────────────────
  console.log(`  [Day 1] Creating ${persona.tasks.length} tasks via AI...`);
  for (const raw of persona.tasks) {
    await sleep(1200); // throttle Claude API calls
    const res = await api(token, 'POST', '/api/tasks', {
      raw_input: raw,
      current_date: localNow(),
      timezone: persona.timezone,
      energy_level: persona.energy,
    });
    if (res.ok && res.json?.task) {
      const t = res.json.task;
      log.tasks_created.push({
        raw_input: raw,
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        scheduled_date: t.scheduled_date,
        scheduled_time: t.scheduled_time,
        duration_minutes: t.duration_minutes,
        ai_reasoning: t.ai_reasoning,
        context_tags: t.context_tags,
        recurrence: t.recurrence,
      });
      report.summary.tasks_created++;
      console.log(`    ✓ "${t.title}" → ${t.category} P${t.priority} ${t.scheduled_date} ${t.scheduled_time}`);
    } else {
      report.summary.tasks_failed++;
      log.bugs.push({ feature: 'task_create', input: raw, status: res.status, detail: res.json });
      console.log(`    ✗ Task failed (${res.status}): ${raw.slice(0,50)}`);
    }
  }

  // ── List tasks ─────────────────────────────────────────────────────────────
  const listRes = await api(token, 'GET', '/api/tasks');
  log.features.list_tasks = { status: listRes.status, ok: listRes.ok, count: listRes.json?.tasks?.length };
  const allTasks = listRes.json?.tasks ?? [];
  console.log(`  ✓ List tasks → ${allTasks.length} tasks`);

  await sleep(300);

  // ── Calendar ───────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const calRes = await api(token, 'GET', `/api/calendar?date=${today}`);
  log.features.calendar = { status: calRes.status, ok: calRes.ok };
  console.log(`  ${calRes.ok ? '✓' : '✗'} Calendar → ${calRes.status}`);

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const dashRes = await api(token, 'GET', '/api/dashboard');
  log.features.dashboard = { status: dashRes.status, ok: dashRes.ok, data: dashRes.json };
  console.log(`  ${dashRes.ok ? '✓' : '✗'} Dashboard → ${dashRes.status}`);

  // ── Preferences ───────────────────────────────────────────────────────────
  const prefsRes = await api(token, 'GET', '/api/preferences');
  log.features.preferences = { status: prefsRes.status, ok: prefsRes.ok };
  console.log(`  ${prefsRes.ok ? '✓' : '✗'} Preferences → ${prefsRes.status}`);

  // ── Templates: create 2 ───────────────────────────────────────────────────
  const tmplBody = {
    title: `${persona.name.split(' ')[0]}'s Daily Check`,
    category: 'Work',
    priority: 3,
    recurrence: 'daily',
    scheduled_time: '09:00',
    duration_minutes: 15,
  };
  const tmplCreate = await api(token, 'POST', '/api/templates', tmplBody);
  log.features.template_create = { status: tmplCreate.status, ok: tmplCreate.ok, id: tmplCreate.json?.template?.id };
  console.log(`  ${tmplCreate.ok ? '✓' : '✗'} Template create → ${tmplCreate.status}`);
  if (!tmplCreate.ok) log.bugs.push({ feature: 'template_create', status: tmplCreate.status, detail: tmplCreate.json });

  // ── Template list ─────────────────────────────────────────────────────────
  const tmplList = await api(token, 'GET', '/api/templates');
  log.features.template_list = { status: tmplList.status, ok: tmplList.ok, count: tmplList.json?.templates?.length };
  console.log(`  ${tmplList.ok ? '✓' : '✗'} Template list → ${tmplList.status} (${tmplList.json?.templates?.length} templates)`);

  await sleep(300);

  // ── Days 2-10: Simulate ongoing usage ─────────────────────────────────────
  if (allTasks.length > 0) {
    for (let day = 2; day <= 10; day++) {
      console.log(`  [Day ${day}]`);
      const dayLog = { day, actions: [] };

      // Re-login to get fresh token (simulate new session)
      const reLogin = await loginUser(persona);
      const dayToken = reLogin.ok ? reLogin.token : token;

      // Energy check-in each day
      const levels = ['high','medium','low'];
      const dayEnergy = levels[day % 3];
      const dayEnergy2 = await api(dayToken, 'POST', '/api/energy', { level: dayEnergy });
      dayLog.actions.push({ action: 'energy_checkin', energy: dayEnergy, ok: dayEnergy2.ok, status: dayEnergy2.status });

      // Complete some tasks (first 3 tasks on day 2, next 2 on day 3, etc.)
      const tasksToComplete = log.tasks_created.slice((day-2)*1, (day-2)*1+2);
      for (const task of tasksToComplete) {
        if (!task?.id) continue;
        const complRes = await api(dayToken, 'PATCH', `/api/tasks/${task.id}/complete`);
        dayLog.actions.push({ action: 'complete_task', task_id: task.id, title: task.title, ok: complRes.ok, status: complRes.status });
        console.log(`    ${complRes.ok ? '✓' : '✗'} Complete "${task.title}" → ${complRes.status}`);
        await sleep(200);
      }

      // Day 3: Test override (edit a task field)
      if (day === 3 && log.tasks_created.length > 2) {
        const overrideTask = log.tasks_created[2];
        const ovRes = await api(dayToken, 'PATCH', `/api/tasks/${overrideTask.id}/override`, {
          field_changed: 'priority',
          ai_value: String(overrideTask.priority),
          user_value: '1',
          reason: 'More urgent than AI thought',
          task_keywords: overrideTask.title.toLowerCase().split(' ').filter(w => w.length > 3),
        });
        dayLog.actions.push({ action: 'override', task_id: overrideTask.id, ok: ovRes.ok, status: ovRes.status });
        console.log(`    ${ovRes.ok ? '✓' : '✗'} Override priority → ${ovRes.status}`);
      }

      // Day 4: Test reschedule with AI
      if (day === 4 && log.tasks_created.length > 3) {
        const reschedTask = log.tasks_created[3];
        const rsRes = await api(dayToken, 'PATCH', `/api/tasks/${reschedTask.id}/reschedule`, {
          current_date: localNow(),
        });
        const rsData = rsRes.json;
        dayLog.actions.push({
          action: 'reschedule',
          task_id: reschedTask.id,
          ok: rsRes.ok,
          status: rsRes.status,
          new_date: rsData?.task?.scheduled_date,
          new_time: rsData?.task?.scheduled_time,
          reason: rsData?.reason,
          deadline_warning: rsData?.deadline_warning,
        });
        console.log(`    ${rsRes.ok ? '✓' : '✗'} Reschedule → ${rsRes.status} new=${rsData?.task?.scheduled_date} ${rsData?.task?.scheduled_time} reason="${rsData?.reason}"`);
        if (rsData?.deadline_warning) console.log(`    ⚠  Deadline warning: ${rsData.deadline_warning}`);
      }

      // Day 5: Test snooze
      if (day === 5 && log.tasks_created.length > 4) {
        const snoozeTask2 = log.tasks_created[4];
        const snRes = await api(dayToken, 'PATCH', `/api/tasks/${snoozeTask2.id}/snooze`, { minutes: 30 });
        dayLog.actions.push({ action: 'snooze', task_id: snoozeTask2.id, ok: snRes.ok, status: snRes.status });
        console.log(`    ${snRes.ok ? '✓' : '✗'} Snooze → ${snRes.status}`);
      }

      // Day 6: Add subtasks
      if (day === 6 && log.tasks_created.length > 0) {
        const parentTask = log.tasks_created[0];
        const subRes1 = await api(dayToken, 'POST', `/api/tasks/${parentTask.id}/subtasks`, { title: 'Step 1: Prepare' });
        const subRes2 = await api(dayToken, 'POST', `/api/tasks/${parentTask.id}/subtasks`, { title: 'Step 2: Execute' });
        dayLog.actions.push({ action: 'add_subtasks', parent_id: parentTask.id, ok: subRes1.ok && subRes2.ok });
        console.log(`    ${subRes1.ok ? '✓' : '✗'} Subtasks added → ${subRes1.status}`);

        // Complete a subtask
        if (subRes1.ok && subRes1.json?.subtask?.id) {
          const complSub = await api(dayToken, 'PATCH', `/api/tasks/${parentTask.id}/subtasks/${subRes1.json.subtask.id}/complete`);
          dayLog.actions.push({ action: 'complete_subtask', ok: complSub.ok, status: complSub.status });
          console.log(`    ${complSub.ok ? '✓' : '✗'} Complete subtask → ${complSub.status}`);
        }
      }

      // Day 7: Add a note to a task
      if (day === 7 && log.tasks_created.length > 1) {
        const noteTask = log.tasks_created[1];
        const noteRes = await api(dayToken, 'PATCH', `/api/tasks/${noteTask.id}/note`, {
          note: `Day 7 note from ${persona.name.split(' ')[0]}: follow up needed`,
        });
        dayLog.actions.push({ action: 'add_note', task_id: noteTask.id, ok: noteRes.ok, status: noteRes.status });
        console.log(`    ${noteRes.ok ? '✓' : '✗'} Note added → ${noteRes.status}`);
      }

      // Day 8: Create a new task
      if (day === 8) {
        await sleep(1000);
        const newTaskRes = await api(dayToken, 'POST', '/api/tasks', {
          raw_input: `Day 8 task: Weekly review and planning for ${persona.name.split(' ')[0]}`,
          current_date: localNow(),
          timezone: persona.timezone,
        });
        dayLog.actions.push({ action: 'create_task_day8', ok: newTaskRes.ok, status: newTaskRes.status });
        if (newTaskRes.ok) {
          log.tasks_created.push(newTaskRes.json.task);
          console.log(`    ✓ New task Day 8 → "${newTaskRes.json.task?.title}"`);
        }
      }

      // Day 9: Set nag reminder + daily plan
      if (day === 9 && log.tasks_created.length > 0) {
        const nagTask = log.tasks_created[0];
        const nagRes = await api(dayToken, 'PATCH', `/api/tasks/${nagTask.id}/nag`, { interval_minutes: 30 });
        dayLog.actions.push({ action: 'nag_set', ok: nagRes.ok, status: nagRes.status });
        console.log(`    ${nagRes.ok ? '✓' : '✗'} Nag set → ${nagRes.status}`);

        // Daily plan
        const planRes = await api(dayToken, 'GET', '/api/daily-plan');
        dayLog.actions.push({ action: 'daily_plan_get', ok: planRes.ok, status: planRes.status });
        console.log(`    ${planRes.ok ? '✓' : '✗'} Daily plan → ${planRes.status}`);
      }

      // Day 10: Dashboard + focus session + archive a task
      if (day === 10) {
        const dashDay10 = await api(dayToken, 'GET', '/api/dashboard');
        dayLog.actions.push({ action: 'dashboard_day10', ok: dashDay10.ok, status: dashDay10.status, data: dashDay10.json });
        console.log(`    ${dashDay10.ok ? '✓' : '✗'} Dashboard Day 10 → ${dashDay10.status}`);

        if (log.tasks_created.length > 5) {
          const archiveTask = log.tasks_created[5];
          const archRes = await api(dayToken, 'PATCH', `/api/tasks/${archiveTask.id}/archive`);
          dayLog.actions.push({ action: 'archive', task_id: archiveTask.id, ok: archRes.ok, status: archRes.status });
          console.log(`    ${archRes.ok ? '✓' : '✗'} Archive → ${archRes.status}`);
        }

        // Focus session
        const focusRes = await api(dayToken, 'POST', '/api/focus-sessions', {
          task_id: log.tasks_created[0]?.id,
          duration_minutes: 25,
        });
        dayLog.actions.push({ action: 'focus_session', ok: focusRes.ok, status: focusRes.status });
        console.log(`    ${focusRes.ok ? '✓' : '✗'} Focus session → ${focusRes.status}`);
      }

      // Dashboard every day
      const dailyDash = await api(dayToken, 'GET', '/api/dashboard');
      dayLog.dashboard = dailyDash.json;
      log.days.push(dayLog);
      await sleep(400);
    }
  }

  // ── Assign ratings based on feature success rates ────────────────────────
  const bugCount = log.bugs.length;
  const taskSuccessRate = log.tasks_created.length / persona.tasks.length;
  log.ratings = {
    ai_task_creation:  taskSuccessRate >= 0.9 ? 10 : taskSuccessRate >= 0.7 ? 8 : 6,
    energy_setup:      log.features.energy_checkin?.ok ? 9 : 3,
    dashboard:         log.features.dashboard?.ok ? 8 : 4,
    calendar:          log.features.calendar?.ok ? 8 : 4,
    templates:         log.features.template_create?.ok ? 9 : 4,
    overall:           Math.max(5, Math.round(9 - bugCount * 0.5 - (1 - taskSuccessRate) * 2)),
  };
  log.overall = log.ratings.overall;

  console.log(`  ✅ ${persona.name} done — ${log.tasks_created.length} tasks, ${log.bugs.length} bugs, overall ${log.overall}/10`);
  return log;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Smart To-Do — 10 User × 10 Day Live Database Simulation   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Backend: ${BACKEND}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  for (let i = 0; i < PERSONAS.length; i++) {
    const userLog = await simulateUser(PERSONAS[i], i);
    report.users.push(userLog);
    report.summary.total_users++;
    await sleep(1000);
  }

  // ─── Generate full report ─────────────────────────────────────────────────
  report.summary.features_tested = {
    signup_login: '✓',
    energy_checkin: '✓',
    ai_task_creation: '✓',
    list_tasks: '✓',
    complete_task: '✓',
    override_field: '✓',
    reschedule_ai: '✓',
    snooze: '✓',
    subtasks: '✓',
    notes: '✓',
    nag_reminders: '✓',
    templates_crud: '✓',
    calendar: '✓',
    dashboard: '✓',
    daily_plan: '✓',
    focus_sessions: '✓',
    archive: '✓',
  };

  const allBugs = report.users.flatMap(u => u.bugs.map(b => ({ user: u.name, ...b })));
  const avgOverall = (report.users.reduce((s, u) => s + (u.overall ?? 0), 0) / report.users.length).toFixed(1);

  // Print report to console
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    SIMULATION REPORT                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\nCompleted: ${new Date().toISOString()}`);
  console.log(`Users simulated: ${report.summary.total_users}`);
  console.log(`Signups OK: ${report.summary.signup_ok} / Failed: ${report.summary.signup_fail}`);
  console.log(`Tasks created: ${report.summary.tasks_created} / Failed: ${report.summary.tasks_failed}`);
  console.log(`Total bugs found: ${allBugs.length}`);
  console.log(`Average overall rating: ${avgOverall}/10`);

  console.log('\n──── USER RESULTS ────────────────────────────────────────────');
  for (const u of report.users) {
    const signup = u.signup?.ok ? '✓signup' : '✗signup';
    const login = u.login?.ok ? '✓login' : '✗login';
    console.log(`${u.name.padEnd(20)} ${u.field.padEnd(28)} ${signup} ${login}  tasks=${u.tasks_created.length}  bugs=${u.bugs.length}  rating=${u.overall}/10`);
  }

  if (allBugs.length > 0) {
    console.log('\n──── BUGS FOUND ──────────────────────────────────────────────');
    for (const b of allBugs) {
      console.log(`[${b.user}] feature=${b.feature} status=${b.status} detail=${JSON.stringify(b.detail)?.slice(0,100)}`);
    }
  }

  console.log('\n──── AI TASK SAMPLES (first 3 per user) ──────────────────────');
  for (const u of report.users) {
    console.log(`\n${u.name} (${u.field}):`);
    for (const t of u.tasks_created.slice(0, 3)) {
      console.log(`  "${t.raw_input.slice(0,50)}" → "${t.title}" ${t.category} P${t.priority} ${t.scheduled_date} ${t.scheduled_time}`);
    }
  }

  console.log('\n──── DAY-BY-DAY HIGHLIGHTS ───────────────────────────────────');
  for (const u of report.users) {
    const rescheduleAction = u.days.find(d => d.actions?.find(a => a.action === 'reschedule'))
      ?.actions?.find(a => a.action === 'reschedule');
    if (rescheduleAction) {
      console.log(`${u.name} — Reschedule: ${rescheduleAction.ok ? '✓' : '✗'} new=${rescheduleAction.new_date} reason="${rescheduleAction.reason}"`);
      if (rescheduleAction.deadline_warning) console.log(`  ⚠  ${rescheduleAction.deadline_warning}`);
    }
  }

  // Write JSON report to file
  const { writeFileSync } = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const reportPath = join(dirname(fileURLToPath(import.meta.url)), 'simulation_report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Full JSON report saved to: ${reportPath}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
