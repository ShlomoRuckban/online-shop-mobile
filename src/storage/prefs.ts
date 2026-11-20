import AsyncStorage from '@react-native-async-storage/async-storage'

/** Reads a saved preference; null when missing or when storage fails. */
export async function readPref(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key)
  } catch {
    return null
  }
}

/** Saves a preference; a failure only means the choice is not remembered next time. */
export async function writePref(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value)
  } catch {
    // not saved; the choice still applies until the app closes
  }
}
