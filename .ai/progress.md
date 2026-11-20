# Progress and how to continue

Read this first in a new session. The full plan (contract, inventory, tree, dispatch table) is in `.unlazy/mobile/PLAN.md`; each leaf's acceptance checks are in `.unlazy/mobile/gates/` (written when its node starts). `.unlazy/` is git-ignored, so it exists only on this machine.

## Repos

- Mobile: this folder (Expo SDK 58 + React Native + TS). Commands: `yarn start`, `yarn verify` (prints `MOBILE VERIFY OK`), `node scripts/check-health.mjs` (live API, prints `HEALTH OK`).
- Server: `../online-shop-server` (API; see its README). Web client: `../online-shop` (reference for texts and behaviour).

## Status (2026-11-20)

The user approved the four key decisions in PLAN.md (Expo, bearer token, shoppers only, no push).

| Leaf | What | Status |
|---|---|---|
| 1.1 | Foundation: app, tabs, preferences, server status, API client, tests, verify | committed (fresh-agent verify passed, user reviewed) |
| 2.1 | Server: mobile session token, `mobile` error source | in progress |

## Next

1. Leaf 2.1 (server repo) is in progress; see below.
2. Leaf 2.1 (server repo): `X-Client: mobile` token in the sign-in answers, `Authorization: Bearer` in `authenticate`, `mobile` error source. Sign-in in the app waits for it.

## Notes

- No Android SDK or Java on this PC: on-device checks use Expo Go on a phone (or the web preview) until Android Studio is installed. The E2E plan (Maestro) needs an emulator.
- The live API checks use port 4101 (`scripts/test-server.mjs`) so they never clash with the web client's E2E server on 4100.
