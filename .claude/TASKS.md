# The Money Ladder — Remaining Tasks

## Before App Store Review Submission
- [ ] Set `ITSAppUsesNonExemptEncryption` to NO in App Store Connect (or add to `app.json` infoPlist for future builds)
- [ ] Fill out App Store metadata in ASC: description, keywords, categories
- [ ] Take App Store screenshots (6.7" iPhone 15 Pro Max, 6.5" iPhone 11 Pro Max, 5.5" iPhone 8 Plus)
- [ ] Set privacy labels in ASC: Financial Info → "Data Not Linked to You" → "App Functionality", Purchases → "Data Linked to You"
- [ ] Add Privacy Policy URL in ASC: `https://cfhssulaj-glitch.github.io/TheMoneyLadder/privacy.html`
- [ ] Submit for App Review

## Testing (Pre-Review)
- [ ] Install build 31 from TestFlight and test full flow
- [ ] Test RevenueCat sandbox purchase flow (monthly, yearly, lifetime)
- [ ] Verify premium features unlock after sandbox purchase
- [ ] Verify paywall ToS/Privacy links open correctly
- [ ] Confirm beta login screen is completely gone
- [ ] Test data persistence (enter data, kill app, reopen)
- [ ] Test "Reset All Data" flow

## Nice-to-Have Improvements
- [ ] Add splash screen config in app.json (solid #0f172a background with icon centered)
- [ ] Set up custom domain `themoneyladder.app` pointing to GitHub Pages (then update URLs in paywall.tsx)
- [ ] Add `ITSAppUsesNonExemptEncryption: false` to `app.json` infoPlist to avoid manual ASC step
- [ ] Consider adding `cli.appVersionSource: "remote"` to eas.json for auto build number management
- [ ] Remove unused dependencies from package.json (expo-auth-session, gifted-chat, calendars, etc. — leftover Vibecode template bloat)
- [ ] Set up RevenueCat promotional entitlements for beta testers (replaces old login system)
