# online-shop-mobile

The phone app (Android and iOS) for the online shop, a work-in-progress portfolio project. It is a shoppers' app that uses the API of [online-shop-server](https://github.com/ShlomoRuckban/online-shop-server); the web shop is [online-shop](https://github.com/ShlomoRuckban/online-shop). Admin and staff work stays on the web shop.

Everything runs locally. The app makes no calls to outside services: no EAS cloud builds, no over-the-air updates, no push service.

## Tech stack

- Expo SDK 58, React Native 0.88, React 19, TypeScript (strict)
- Expo Router (screens in `src/app/`), TanStack Query for API calls
- React Native Paper (Material 3) with the web shop's colors; light, dark and match-phone themes
- English, Hebrew (right to left) and Spanish; shared texts are copied from the web shop
- Session: a bearer token kept in the phone's secure store (`expo-secure-store`); no cookies
- Tests: Jest (`jest-expo`) and React Native Testing Library; live API checks against the server in test mode

## Setup

1. Node 24 and yarn 1.
2. `yarn install` (also turns on the pre-push hook).
3. Start the API: in `../online-shop-server`, `yarn dev` (see its README).
4. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`:
   - Android emulator: leave it empty (the app uses `http://10.0.2.2:4000/api`)
   - A phone on the same Wi-Fi: `http://<your PC's LAN address>:4000/api`, and set `HOST=0.0.0.0` in the server `.env` so the API listens on the network
5. `yarn start`, then open the app:
   - on a phone: install **Expo Go** and scan the QR code
   - in the browser: press `w` (layout and texts only: the API allows no cross-origin requests, so the server status page shows the server as unreachable there)
   - on an Android emulator: press `a` (needs Android Studio)

## Scripts

- `yarn start`: the Expo dev server (`yarn android`, `yarn ios`, `yarn web` open a platform directly)
- `yarn test`: unit and screen tests
- `yarn verify`: dependency audit, lint, typecheck, message check, tests and a production bundle for Android, iOS and web; prints `MOBILE VERIFY OK`
- `yarn audit:check`: dependency audit that fails only on high or critical advisories; skipped with a warning when offline
- `node scripts/check-health.mjs`: starts the API in test mode (port 4101, in-memory MongoDB) and runs the app's API client against it; prints `HEALTH OK`
- `node scripts/check-i18n.mjs`: English, Hebrew and Spanish have the same keys and no empty texts
- `node scripts/check-layout.mjs`: repo layout, ignore rules and no outside-service configuration
- `node scripts/import-messages.mjs <sections...>`: copies sections of the web shop's message catalogues into `src/i18n/messages/web.<lang>.json`

A pre-push hook (`.githooks/pre-push`) runs `yarn verify` before every push; skip once with `git push --no-verify`.

## Layout

- `src/app/`: screens (Expo Router). `(tabs)/` holds Home, Shop, Cart and Account; `health.tsx` is the server status page
- `src/api/`: the API client (`client.ts`: base URL, `X-Client: mobile`, bearer token, error codes, timeouts, unreachable server) and one module per API area
- `src/auth/`: the session token store
- `src/i18n/`: languages, texts, formatting and the right-to-left switch
- `src/theme/`: themes and the saved theme choice
- `tests/`: screen tests (`screens/`), live API tests (`live/`) and helpers

## Languages and direction

Texts shared with the web shop live in `src/i18n/messages/web.<lang>.json` (copied, not edited by hand); texts only the app has live in `mobile.<lang>.ts`. Switching to or from Hebrew changes the native layout direction, which React Native applies after a reload: in development the app reloads itself; a release build asks the shopper to reopen it. Expo Go cannot switch the direction for a running app; reopen it.

## Status

Leaf 1.1 (foundation) of the plan: tabs, preferences, server status, API client. Catalog, sign-in, cart, checkout and the rest follow; see `.ai/progress.md`.
