import { createContext, useContext } from 'react'
import type { Messages } from './catalogues'
import type { Language, Paths, Vars } from './translate'

export type MessageKey = Paths<Messages>

/** Item text the shop can show in several languages. */
export interface Translatable {
  name: string
  description?: string
  translations?: Partial<Record<Exclude<Language, 'en'>, { name: string; description: string }>>
}

export interface I18n {
  lang: Language
  setLang: (lang: Language) => void
  dir: 'ltr' | 'rtl'
  /** BCP 47 locale for Intl, e.g. "he-IL". */
  locale: string
  t: (key: MessageKey, vars?: Vars) => string
  formatPrice: (cents: number) => string
  formatDate: (iso: string, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (n: number) => string
  /** Name and description in the current language, falling back to English. */
  itemText: (item: Translatable) => { name: string; description: string }
  /** User-facing text for a failed request; `fallback` covers server errors and unknown failures. */
  errorText: (err: unknown, fallback?: MessageKey) => string | null
}

export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const i18n = useContext(I18nContext)
  if (!i18n) throw new Error('useI18n must be used inside I18nProvider')
  return i18n
}
