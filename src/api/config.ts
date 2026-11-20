import { Platform } from 'react-native'

/**
 * The API address, ending in /api. Set EXPO_PUBLIC_API_URL in .env (see .env.example).
 * Without it: the Android emulator reaches the PC as 10.0.2.2; iOS simulator and web use localhost.
 * A real phone always needs EXPO_PUBLIC_API_URL with the PC's LAN address (server HOST=0.0.0.0).
 */
export function apiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api'
}
