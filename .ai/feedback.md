# Lessons

## 2026-11-20, leaf 1.1

- Expo SDK 58 keeps routes in `src/app/`; read the versioned docs before using an Expo API (AGENTS.md).
- `jest-expo` 58 needs `@react-native/jest-preset` installed separately, and ESLint 9 (ESLint 10 breaks `eslint-plugin-react` inside `eslint-config-expo`).
- `renderRouter` (expo-router/testing-library) turns on fake timers. RNTL's async `findBy`/`waitFor` then overlap ("overlapping act() calls") and later tests render nothing. Wrap presses in `act`, flush with `jest.runOnlyPendingTimersAsync()` (see `settle()` in `tests/screens/app-test.tsx`), and let React Query notify synchronously (`jest.setup.ts`).
- Expo Router needs the root layout to render a navigator on the first render. Keep the Stack mounted, hold the native splash screen, and apply saved preferences when they arrive.
- Inside jest-expo the global `fetch` is Expo's runtime one; live tests use `tests/helpers/nodeFetch.ts`.
- Bash heredocs in this environment can collapse `\\` in regex strings; write regex-heavy files with the Edit tool.
