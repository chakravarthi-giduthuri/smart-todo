# Mobile Architecture — Smart To-Do (iOS & Android)

## Overview

Expo (React Native) app sharing all business logic with the existing web app via a monorepo structure. Only the UI layer is rewritten for native. Backend unchanged.

---

## Repo Structure

```
smart-todo/
│
├── backend/                         ← unchanged, serves both web and mobile
│
├── packages/
│   └── shared/                      ← shared business logic (no UI)
│       ├── src/
│       │   ├── api/                 ← moved from frontend/src/api/
│       │   │   ├── client.ts
│       │   │   ├── tasks.ts
│       │   │   ├── shares.ts
│       │   │   ├── conversation.ts
│       │   │   └── ...
│       │   ├── hooks/               ← moved from frontend/src/hooks/
│       │   │   ├── useTasks.ts
│       │   │   ├── useDashboard.ts
│       │   │   ├── useEnergy.ts
│       │   │   ├── useTemplates.ts
│       │   │   └── ...
│       │   ├── types/               ← moved from frontend/src/types/
│       │   │   ├── task.ts
│       │   │   └── api.ts
│       │   └── constants/
│       │       └── categories.ts
│       └── package.json             ← name: "@smart-todo/shared"
│
├── frontend/                        ← web app (imports from @smart-todo/shared)
│   └── src/
│       ├── screens/                 ← web-only UI
│       └── components/             ← web-only UI
│
└── mobile/                          ← Expo app
    ├── app/                         ← expo-router (file = route)
    │   ├── _layout.tsx              ← root providers + auth guard
    │   ├── (auth)/
    │   │   └── login.tsx
    │   ├── (tabs)/
    │   │   ├── _layout.tsx          ← bottom tab bar config
    │   │   ├── index.tsx            ← Home
    │   │   ├── calendar.tsx
    │   │   ├── dashboard.tsx
    │   │   ├── plan.tsx
    │   │   ├── templates.tsx
    │   │   └── timeline.tsx
    │   ├── settings.tsx
    │   └── share/[token].tsx        ← public share page (no auth)
    ├── components/
    │   ├── tasks/
    │   │   ├── TaskCard.tsx         ← native Pressable + Animated
    │   │   ├── TaskList.tsx         ← FlatList (virtualized)
    │   │   ├── SwipeableTask.tsx    ← swipe-to-complete / delete
    │   │   └── FocusTimer.tsx       ← native countdown
    │   ├── chat/
    │   │   └── ChatBar.tsx          ← TextInput + KeyboardAvoidingView
    │   ├── home/
    │   │   ├── EnergyBanner.tsx
    │   │   ├── SmartSuggestions.tsx
    │   │   ├── CapacityBar.tsx
    │   │   └── DailyPlanBanner.tsx
    │   ├── layout/
    │   │   └── SafeAreaWrapper.tsx
    │   └── ui/                      ← base primitives
    │       ├── Card.tsx
    │       ├── Badge.tsx
    │       ├── Button.tsx
    │       └── Skeleton.tsx
    ├── contexts/
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    ├── lib/
    │   └── supabase.ts              ← AsyncStorage session (mobile only)
    ├── hooks/
    │   └── useNotifications.ts      ← expo-notifications
    ├── app.json
    ├── eas.json
    └── package.json
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Expo SDK 52 | Managed workflow |
| Navigation | expo-router v3 | File-based, same as Next.js |
| Styling | NativeWind v4 | Tailwind className syntax in RN |
| Data fetching | @tanstack/react-query | Identical to web — zero changes |
| Auth | @supabase/supabase-js | Same SDK, AsyncStorage for session |
| Push notifications | expo-notifications | Replaces web-push entirely |
| Animations | react-native-reanimated | 60fps native animations |
| Gestures | react-native-gesture-handler | Swipe gestures on TaskCards |
| Storage | @react-native-async-storage | Session persistence |
| Icons | @expo/vector-icons | Same icon names as lucide |
| Calendar | react-native-calendars | Replaces MonthGrid.tsx |
| Charts | react-native-gifted-charts | Replaces SVG charts |
| Build | EAS Build (cloud) | No Mac needed for Android |
| OTA Updates | expo-updates | Push JS fixes without resubmitting |

---

## What Gets Shared (Zero Rewrite)

Everything in `packages/shared/` is imported by both web and mobile with no changes:

```
✅ All API fetch functions       (api/tasks.ts, api/shares.ts, etc.)
✅ All React Query hooks         (useTasks, useDashboard, useEnergy, etc.)
✅ All TypeScript types          (Task, Category, Priority, etc.)
✅ All constants                 (CATEGORY_COLORS, etc.)
✅ Claude AI integration         (backend unchanged)
✅ Supabase DB queries           (backend unchanged)
✅ All backend routes            (backend unchanged)
```

## What Gets Rewritten (UI Only)

```
🔄 Screen layouts        → ScrollView / FlatList / SafeAreaView
🔄 TaskCard              → Pressable + Animated + Swipeable
🔄 ChatBar               → TextInput + KeyboardAvoidingView
🔄 CalendarScreen        → react-native-calendars
🔄 Charts                → react-native-gifted-charts
🔄 Tailwind CSS          → NativeWind (same className syntax)
🔄 Push notifications    → expo-notifications (simpler than web-push)
```

---

## Shared Package Setup

### packages/shared/package.json
```json
{
  "name": "@smart-todo/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "peerDependencies": {
    "@tanstack/react-query": "^5.0.0",
    "react": "^18.0.0"
  }
}
```

### packages/shared/src/api/client.ts
```ts
// Works identically in React (browser fetch) and React Native (RN fetch)
export function createApiClient(baseUrl: string, getToken: () => Promise<string | null>) {
  return async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error ?? 'Request failed');
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  };
}
```

### Root package.json (npm workspaces)
```json
{
  "name": "smart-todo",
  "private": true,
  "workspaces": [
    "packages/shared",
    "frontend",
    "mobile"
  ]
}
```

---

## Supabase Auth — One Mobile Difference

```ts
// mobile/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,         // ← only difference from web
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,     // no URL in native apps
  },
});
```

---

## Navigation Flow

```
App Launch
    │
    ├── No session ──→ (auth)/login.tsx
    │
    └── Has session ──→ (tabs)/_layout.tsx
                            │
              ┌─────────────┼──────────────┬────────────┐
            Home        Calendar       Dashboard     Plan
          index.tsx    calendar.tsx  dashboard.tsx  plan.tsx
                                                       │
                                               Settings (modal)
```

**Bottom tab bar — 5 tabs matching web sidebar:**
```
🏠 Home   📅 Calendar   📊 Stats   📋 Plan   ⚙️ Settings
```

---

## Key Component Patterns

### TaskCard — swipe gestures
```tsx
import Swipeable from 'react-native-gesture-handler/Swipeable';

<Swipeable
  renderRightActions={() => <DeleteAction />}
  renderLeftActions={() => <CompleteAction />}
  onSwipeableRightOpen={() => onDelete(task.id)}
  onSwipeableLeftOpen={() => onComplete(task.id)}
>
  <Pressable onPress={onPress} style={styles.card}>
    <Text style={styles.title}>{task.title}</Text>
  </Pressable>
</Swipeable>
```

### TaskList — FlatList (critical for performance)
```tsx
// FlatList virtualizes — only renders visible cards in memory
<FlatList
  data={tasks}
  renderItem={({ item, index }) => (
    <TaskCard task={item} delay={index * 30} />
  )}
  keyExtractor={t => t.id}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### ChatBar — keyboard aware
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
>
  <TextInput
    value={input}
    onChangeText={setInput}
    placeholder="What do you need to do?"
    onSubmitEditing={handleSubmit}
    returnKeyType="send"
    blurOnSubmit={false}
  />
</KeyboardAvoidingView>
```

### Push Notifications — Expo (replaces web-push)
```ts
// mobile/hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  // Send expo token to backend
  await apiFetch('/push/register-expo', {
    method: 'POST',
    body: JSON.stringify({ expo_token: token.data }),
  });
}
```

**Backend sends via Expo Push API (handles both APNS + FCM for free):**
```ts
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: expoToken,
    title: task.title,
    body: 'Reminder — due soon',
    badge: highPriorityCount,
    data: { taskId: task.id },
  }),
});
```

---

## EAS Build Configuration

### mobile/eas.json
```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.id",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
```

---

## Build & Release Commands

```bash
# Development (Expo Go)
npx expo start --ios
npx expo start --android

# Development build (custom native modules)
eas build --platform ios --profile development
eas build --platform android --profile development

# Preview build (internal testing)
eas build --platform all --profile preview

# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android

# OTA update (JS-only fix, no store resubmission)
eas update --branch production --message "fix: task card crash"
```

---

## Implementation Sprints

### Sprint 1 — Foundation (Week 1–2)
- [ ] Set up npm workspaces (monorepo root `package.json`)
- [ ] Move `api/`, `hooks/`, `types/`, `constants/` → `packages/shared/`
- [ ] Verify web app still works importing from `@smart-todo/shared`
- [ ] Scaffold Expo app: `npx create-expo-app mobile --template tabs`
- [ ] Install NativeWind, react-query, supabase, gesture-handler
- [ ] Auth flow working (login → session → home tab)
- [ ] Task list rendering with FlatList

### Sprint 2 — Core Features (Week 3)
- [ ] TaskCard with swipe-to-complete and swipe-to-delete
- [ ] ChatBar with keyboard handling
- [ ] Create task end-to-end (Claude AI → card appears)
- [ ] Complete / delete / reschedule tasks
- [ ] HomeScreen fully functional (stats, energy, suggestions)

### Sprint 3 — Remaining Screens (Week 4)
- [ ] CalendarScreen (react-native-calendars)
- [ ] DashboardScreen with charts (react-native-gifted-charts)
- [ ] SettingsScreen (profile, theme, delete account)
- [ ] DailyPlanScreen (task ordering)
- [ ] TemplatesScreen

### Sprint 4 — Native Polish (Week 5)
- [ ] expo-notifications (register + receive + handle tap)
- [ ] Replace web-push backend logic with Expo Push API
- [ ] Haptic feedback on task complete (`expo-haptics`)
- [ ] Animated splash screen (`expo-splash-screen`)
- [ ] App icon all sizes
- [ ] Dark / light mode with system preference detection
- [ ] Safe area handling (notch, Dynamic Island, home indicator)
- [ ] iPad layout (optional)

### Sprint 5 — Store Submission (Week 6)
- [ ] EAS Build setup + first production build
- [ ] iPhone screenshots (6.5" and 5.5" required)
- [ ] Android screenshots (phone + 7" tablet)
- [ ] App Store listing (description, keywords, category)
- [ ] Google Play listing
- [ ] Privacy policy URL (required by both stores)
- [ ] Submit iOS → App Store Connect
- [ ] Submit Android → Google Play Console

---

## Environment Variables

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

Note: All `EXPO_PUBLIC_` prefixed vars are bundled into the app (equivalent to `VITE_` on web). Never put secrets here — backend handles all sensitive keys.

---

## Store Requirements Checklist

### Apple App Store
- [ ] Apple Developer account ($99/year)
- [ ] App icon 1024x1024 PNG (no alpha)
- [ ] Screenshots for 6.7" iPhone (required)
- [ ] Screenshots for 12.9" iPad (if iPad supported)
- [ ] Privacy policy URL
- [ ] App description + keywords
- [ ] Age rating questionnaire
- [ ] Export compliance (uses encryption via HTTPS → answer yes)

### Google Play Store
- [ ] Google Play Developer account ($25 one-time)
- [ ] App icon 512x512 PNG
- [ ] Feature graphic 1024x500
- [ ] Screenshots (min 2, phone required)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target API level 34+ (Android 14)

---

## Decision Log

| Decision | Choice | Reason |
|---|---|---|
| Framework | Expo managed workflow | Simpler builds, EAS handles certificates |
| Navigation | expo-router | File-based, familiar, deep linking built-in |
| Styling | NativeWind | Keep Tailwind syntax, reduce learning curve |
| State | React Query (shared) | Zero extra code, same caching as web |
| Push | Expo Push API | Free, handles both APNS + FCM, simpler backend |
| Build | EAS Build | Cloud builds — no local Xcode/Android Studio required |
| Code sharing | npm workspaces | Simple, no extra tooling like Turborepo needed |
