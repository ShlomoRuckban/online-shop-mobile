/** Plural forms, picked with Intl.PluralRules. `other` is required; the rest depend on the language. */
export interface Plural {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

type Leaf = string | Plural

/** The same tree as the English catalogue, with any wording. */
export type Shape<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends { other: string } ? Plural : Shape<T[K]>
}

/** Dotted paths to every message, e.g. "cart.title". */
export type Paths<T> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : `${K}.${Paths<T[K]>}`
}[keyof T & string]

export type Vars = Record<string, string | number>

export const LANGUAGES = {
  en: { label: 'English', locale: 'en-US', dir: 'ltr' },
  he: { label: 'עברית', locale: 'he-IL', dir: 'rtl' },
  es: { label: 'Español', locale: 'es-ES', dir: 'ltr' },
} as const

export type Language = keyof typeof LANGUAGES
export const LANGUAGE_CODES = Object.keys(LANGUAGES) as Language[]
export const LANG_STORAGE_KEY = 'online-shop:lang'

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && value in LANGUAGES
}

/** Saved choice first, then the phone's preferred languages, then English. */
export function detectLanguage(saved: string | null, preferred: readonly string[]): Language {
  if (isLanguage(saved)) return saved
  for (const tag of preferred) {
    // "he-IL" -> "he"; old systems report Hebrew as "iw"
    const base = (tag.toLowerCase().split('-')[0] ?? '').replace(/^iw$/, 'he')
    if (isLanguage(base)) return base
  }
  return 'en'
}

function lookup(messages: object, key: string): Leaf | undefined {
  let node: unknown = messages
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' || (typeof node === 'object' && node !== null && 'other' in node)
    ? (node as Leaf)
    : undefined
}

/**
 * Looks a message up and fills in {placeholders}. A plural message picks its form
 * from `vars.count`. Missing keys fall back to `fallback` (English), then the key itself.
 */
export function translate(messages: object, fallback: object, locale: string, key: string, vars: Vars = {}): string {
  const leaf = lookup(messages, key) ?? lookup(fallback, key)
  if (leaf === undefined) return key
  let text: string
  if (typeof leaf === 'string') text = leaf
  else {
    const form = new Intl.PluralRules(locale).select(Number(vars.count ?? 0)) as keyof Plural
    text = leaf[form] ?? leaf.other
  }
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}

/** True when the catalogue has this message (used for optional texts such as API error codes). */
export function hasMessage(messages: object, key: string): boolean {
  return lookup(messages, key) !== undefined
}
