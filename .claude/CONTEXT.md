# The Money Ladder — Session Context

## Project Overview
Personal finance iOS app (Expo/React Native) that guides users through a 9-step wealth-building framework. All data stored locally on device. Revenue via RevenueCat subscriptions (monthly, yearly, lifetime).

## Repository
- **GitHub**: https://github.com/cfhssulaj-glitch/TheMoneyLadder (public)
- **GitHub Pages**: https://cfhssulaj-glitch.github.io/TheMoneyLadder/
- **App Store Connect**: https://appstoreconnect.apple.com/apps/6756895565
- **EAS Project**: https://expo.dev/accounts/jsula3/projects/the-money-ladder
- **Bundle ID**: `com.vibecode.themoneyladder` (kept from Vibecode to avoid re-creating ASC entry)

## Tech Stack
- Expo SDK 53, React Native 0.79, React 19
- NativeWind (Tailwind CSS), Zustand (state), expo-router (navigation)
- RevenueCat for in-app purchases
- No backend — all data is local (AsyncStorage via Zustand persist)

## Key Files
- `mobile/src/lib/finance-store.ts` — Zustand store with all financial data, step calculation logic
- `mobile/src/lib/revenuecatClient.ts` — RevenueCat SDK wrapper
- `mobile/src/app/(tabs)/` — Main tab screens (Plan, Spending, Profile)
- `mobile/src/app/paywall.tsx` — Subscription paywall with ToS/Privacy links
- `mobile/eas.json` — Build profiles (dev, preview, production)
- `docs/` — GitHub Pages (privacy policy, terms of service, landing page)

## What Was Done (Feb 24, 2026)
1. Removed beta login system entirely (credentials, screen, store state, profile UI)
2. Renamed all `EXPO_PUBLIC_VIBECODE_*` env vars to `EXPO_PUBLIC_REVENUECAT_*`
3. Removed 5 unused AI API keys from .env and eas.json
4. Changed package name from `template-app-53` to `the-money-ladder`
5. Changed URL scheme from `vibecode` to `themoneyladder`
6. Deleted placeholder `two.tsx` tab and unused `backend/` directory
7. Added Terms of Service and Privacy Policy links to paywall footer
8. Added explicit "Billed at [price]/year" language for annual subscriptions
9. Created privacy policy, terms of service, and landing page (GitHub Pages)
10. Added comprehensive .gitignore
11. Fixed build: updated lucide-react-native to 0.575.0 (React 19 support)
12. Updated @react-navigation/native to ^7.1.28
13. Added .npmrc with `legacy-peer-deps=true` (required for EAS builds)
14. Added app icon (1024x1024) from App Store Connect
15. Linked EAS project, configured auto-submit
16. **Build 31 (v1.0.0) submitted to App Store Connect**

## Build Notes
- `.npmrc` with `legacy-peer-deps=true` is required — the Vibecode template has cascading peer dep conflicts
- Build number is currently 31 — increment for each new submission
- `ITSAppUsesNonExemptEncryption` needs to be set to NO in ASC (not set in app.json)
- RevenueCat keys in eas.json are public client-side keys (safe to commit)
- `.env` is gitignored — only needed for local dev, EAS uses eas.json env block

## Git Log
```
cc163c4 Add app icon (1024x1024)
28d8c25 Fix build: update lucide-react-native for React 19, add .npmrc for peer deps
a6d6465 Temporarily remove icon reference to unblock build
6942080 Update paywall legal URLs to GitHub Pages
577e382 Production-ready cleanup: remove beta login, rebrand from Vibecode, add App Store compliance
```
