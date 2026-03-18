# Installing Smart To-Do on iPhone (No Developer Account)

## Prerequisites

- Mac with Xcode installed
- iPhone connected via USB cable
- A free Apple ID (your regular App Store account works)
- iPhone on iOS 16+

---

## Step 1 — Install Xcode

Open **App Store** on your Mac → search **Xcode** → Install (~15GB).

Once installed, accept the license:

```bash
sudo xcode-select --switch /Applications/Xcode.app
sudo xcodebuild -license accept
```

---

## Step 2 — Enable Developer Mode on iPhone

> **Note:** Developer Mode is hidden in Settings until you connect to Xcode at least once. Follow this order exactly.

1. Connect iPhone to Mac via USB
2. Open **Xcode** on Mac (just open it — no need to do anything else)
3. Xcode will detect your iPhone — when your iPhone shows **"Trust This Computer?"**, tap **Trust** and enter your passcode
4. Now on iPhone go to **Settings → Privacy & Security** — **Developer Mode** will now be visible
5. Tap **Developer Mode → turn ON**
6. iPhone will restart — tap **Turn On** when prompted after restart

---

## Step 3 — Add your Apple ID to Xcode

1. Open **Xcode → Settings (⌘,) → Accounts tab**
2. Click **+** → **Apple ID** → sign in with your Apple ID
3. A **Personal Team** entry will appear — this is your free signing identity

---

## Step 4 — Set the backend URL

Create a `.env` file in the mobile directory if it doesn't exist:

```bash
echo 'EXPO_PUBLIC_API_URL=https://smart-todo-production-24df.up.railway.app' > "/Users/chakravarthigiduthuri/Desktop/Project C/Project TODO/mobile/.env"
```

---

## Step 5 — Build and install on iPhone

```bash
cd "/Users/chakravarthigiduthuri/Desktop/Project C/Project TODO/mobile"

# Install native dependencies (only needed once)
npx expo install @react-native-community/datetimepicker

# Build and install on connected iPhone
npx expo run:ios --device
```

First build takes **3–5 minutes**. The app will install and launch on your iPhone automatically.

### If Xcode shows a signing error

1. In the Xcode window that opens, select your device from the top bar
2. Go to **Signing & Capabilities** tab
3. Set **Team** to your personal team (your name)
4. Click **Try Again** on the error

---

## Step 6 — Trust the app on iPhone (if prompted)

If iPhone shows "Untrusted Developer":

**Settings → General → VPN & Device Management → tap your Apple ID email → Trust**

---

## Renewing After 7 Days

With a free Apple ID, the app expires in **7 days**. To renew, just run the same command from your Mac — no full rebuild needed:

```bash
cd "/Users/chakravarthigiduthuri/Desktop/Project C/Project TODO/mobile"
npx expo run:ios --device
```

Reinstalls in ~1 minute.

---

## Notes

- This app uses `@react-native-community/datetimepicker` (a native module), so **Expo Go will not work** — the development build via Xcode is required
- The app runs against the live Railway backend — internet connection required
- Push notifications require iOS 16.4+
