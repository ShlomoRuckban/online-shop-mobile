import webEn from './messages/web.en.json'
import webEs from './messages/web.es.json'
import webHe from './messages/web.he.json'
import { mobileEn } from './messages/mobile.en'
import { mobileEs } from './messages/mobile.es'
import { mobileHe } from './messages/mobile.he'
import type { Language } from './translate'

type Tree = { [key: string]: unknown }

function isTree(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Copies `extra` over `base`, key by key; app texts win over the web shop's (e.g. "Match phone"). */
export function deepMerge<A extends object, B extends object>(base: A, extra: B): A & B {
  const out: Tree = { ...(base as Tree) }
  for (const [key, value] of Object.entries(extra)) {
    const current = out[key]
    out[key] = isTree(current) && isTree(value) ? deepMerge(current, value) : value
  }
  return out as A & B
}

/** The English catalogue: every key the app may use. */
export const en = deepMerge(webEn, mobileEn)
export type Messages = typeof en

/** All three languages ship with the app (they are small); none loads later. */
export const catalogues: Record<Language, object> = {
  en,
  he: deepMerge(webHe, mobileHe),
  es: deepMerge(webEs, mobileEs),
}
