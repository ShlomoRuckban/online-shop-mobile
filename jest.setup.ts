import { notifyManager } from '@tanstack/react-query'

// renderRouter (expo-router/testing-library) turns on fake timers; React Query batches its updates
// on a timer, so in tests it notifies right away instead
notifyManager.setScheduler((callback) => callback())

// Device storage stand-ins for tests: AsyncStorage's own mock, and an in-memory secure store.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use import
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'))

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>()
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
    __store: store,
  }
})

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'en-US', languageCode: 'en', textDirection: 'ltr' }]),
}))
