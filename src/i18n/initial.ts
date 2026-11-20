import { getLocales } from 'expo-localization'
import { readPref } from '../storage/prefs'
import { LANG_STORAGE_KEY, detectLanguage, type Language } from './translate'

/** The saved language, then the phone's preferred languages, then English. */
export async function initialLanguage(): Promise<Language> {
  const saved = await readPref(LANG_STORAGE_KEY)
  let preferred: string[] = []
  try {
    preferred = getLocales().map((locale) => locale.languageTag)
  } catch {
    // no locale information; detectLanguage falls back to English
  }
  return detectLanguage(saved, preferred)
}
