# Store Submission Checklist

## Before First Build

### Apple
- [ ] Apple Developer account enrolled ($99/year) at developer.apple.com
- [ ] App ID created in App Store Connect
- [ ] Replace `your@apple.id` in eas.json with your Apple ID
- [ ] Replace `YOUR_APP_STORE_CONNECT_APP_ID` with your app's numeric ID
- [ ] Replace `YOUR_TEAM_ID` with your Apple team ID

### Google
- [ ] Google Play Developer account ($25 one-time) at play.google.com/console
- [ ] App created in Play Console
- [ ] Service account JSON downloaded → save as `mobile/google-service-account.json`

## Assets Required (mobile/assets/)
- [ ] `icon.png` — 1024×1024px, orange background, white checkmark
- [ ] `splash.png` — 1284×2778px, dark background (#080810)
- [ ] `adaptive-icon.png` — 1024×1024px, foreground only (transparent bg)

## EAS Project Setup
```bash
cd mobile
npx eas-cli login
npx eas-cli project:init
# Update the projectId in app.json extra.eas.projectId
```

## Build Commands
```bash
# iOS build (TestFlight)
npx eas-cli build --platform ios --profile production

# Android build (Play Store)
npx eas-cli build --platform android --profile production

# Submit
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

## Screenshots Required
### iOS
- 6.7" iPhone (1290×2796): Home, Calendar, Stats, Daily Plan, Settings
- 12.9" iPad Pro (2048×2732): optional

### Android
- Phone (1080×1920 min): Home, Calendar, Stats, Daily Plan, Settings
- 7" tablet (1200×1920): optional

## Backend Updates for Production
1. Add Expo push endpoint: `POST /api/push/register-expo` (stores expo_token in user profile)
2. Update reminder cron to use Expo Push API instead of web-push
3. Set `EXPO_PUBLIC_API_URL` in EAS environment variables (not in .env)
