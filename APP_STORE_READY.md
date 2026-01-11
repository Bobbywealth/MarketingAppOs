# App Store / Play Store readiness (Marketing Team App)

This repo is a web app + API. To ship it on **iOS** and **Android** app stores, we wrap the existing web UI in a native shell using **Capacitor**.

## What’s been added to the repo

- **Capacitor config**: `capacitor.config.ts` (uses `dist/public` as `webDir`)
- **Build scripts** in `package.json`:
  - `npm run build:client`
  - `npm run cap:add:ios` / `npm run cap:add:android`
  - `npm run cap:sync`
  - `npm run cap:assets` (generates icons + splash once native projects exist)
- **Native runtime hardening**
  - API calls now support a base URL via `VITE_API_BASE_URL` (needed inside native WebView)
  - Web Push + Service Worker behavior is disabled inside native app (Capacitor)

## One-time setup checklist (accounts + identifiers)

- **Apple Developer Program** account
- **Google Play Console** account
- **Bundle ID / Application ID**
  - Update `appId` in `capacitor.config.ts` (example currently: `app.marketingteam.mta`)
  - Decide the final store display name (example currently: `Marketing Team`)

## Backend / API requirement (critical)

The native app does **not** bundle the backend. You must have the API running on a reachable HTTPS domain.

- Set `VITE_API_BASE_URL` to your production API origin (e.g. `https://www.marketingteam.app`).
  - See `env.example.txt`
  - This is required because native WebViews run on `capacitor://localhost`, so `/api/*` is not “your server” anymore.

## Build + run (local)

1. Install dependencies

```bash
npm install
```

2. Build the web UI (outputs to `dist/public`)

```bash
npm run build:client
```

3. Create native projects (once per machine / repo clone)

```bash
npm run cap:add:ios
npm run cap:add:android
```

4. Sync web assets into native projects (run after every UI change)

```bash
npm run cap:sync
```

5. Generate app icons + splash screens (requires native projects to exist)

```bash
npm run cap:assets
```

6. Open native IDEs

```bash
npm run cap:open:ios
npm run cap:open:android
```

## Store compliance notes (things you must fill in)

- **Privacy Policy & Terms**
  - You already have in-app pages: `/privacy` and `/terms`
  - In App Store Connect / Play Console you’ll still need to provide the public URLs
- **Permissions copy**
  - If you keep voice recording in the native app, you must set:
    - iOS `NSMicrophoneUsageDescription`
    - Android microphone permission + rationale
  - If you access photos/camera for uploads, you may need:
    - iOS `NSPhotoLibraryUsageDescription` / `NSCameraUsageDescription` (depending on actual usage)
- **Push Notifications**
  - Current implementation is **Web Push** (PWA/browser). This is **disabled in the native wrapper**.
  - If you want native push for stores, plan to add APNS/FCM via Capacitor plugins and update backend.
- **“Sign in with Apple”**
  - If you offer third‑party login providers in iOS (e.g. Microsoft/Google login), Apple may require adding “Sign in with Apple” as well.

## Release build checklist (high level)

- Update app metadata (name, bundle ID, version)
- Generate icons/splash via `npm run cap:assets`
- iOS: create an Archive in Xcode → upload to App Store Connect
- Android: build an AAB in Android Studio → upload to Play Console
- Complete store questionnaires:
  - iOS App Privacy
  - Android Data Safety
  - Content rating

