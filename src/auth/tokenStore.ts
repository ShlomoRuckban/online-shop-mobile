import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { setTokenGetter } from '../api/client'

const TOKEN_KEY = 'online-shop.session'

// Kept in memory so every request can read it synchronously; the phone's secure store keeps it
// across launches. Web (the dev preview) has no secure store, so a session there lasts one visit.
let current: string | null = null
setTokenGetter(() => current)

const persistent = Platform.OS !== 'web'

/** Loads the saved token at startup. */
export async function loadToken(): Promise<string | null> {
  if (!persistent) return current
  try {
    current = await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    current = null
  }
  return current
}

export async function saveToken(token: string): Promise<void> {
  current = token
  if (persistent) await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  current = null
  if (persistent) {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
    } catch {
      // already gone
    }
  }
}

export function currentToken(): string | null {
  return current
}
