import { useMemo, useState, type ReactNode } from 'react'
import { Alert, View } from 'react-native'
import { ApiError, isUnreachable } from '../api/client'
import { writePref } from '../storage/prefs'
import { catalogues, en } from './catalogues'
import { I18nContext, type I18n, type MessageKey } from './context'
import { applyDirection } from './direction'
import { LANGUAGES, LANG_STORAGE_KEY, hasMessage, translate, type Language } from './translate'

/**
 * Texts, formatting and direction for the chosen language. `initialLang` is read while the splash
 * screen is up (saved choice, then the phone's languages), so the app never shows the wrong language.
 */
export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang: Language }) {
  const [lang, setLangState] = useState<Language>(initialLang)
  // the saved language arrives after the first render (the splash screen covers it); take it once it does
  const [seenInitial, setSeenInitial] = useState(initialLang)
  if (initialLang !== seenInitial) {
    setSeenInitial(initialLang)
    setLangState(initialLang)
  }
  const { locale, dir } = LANGUAGES[lang]

  const i18n = useMemo<I18n>(() => {
    const active = catalogues[lang]
    const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(active, en, locale, key, vars)
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })
    const number = new Intl.NumberFormat(locale)
    return {
      lang,
      dir,
      locale,
      setLang: (next: Language) => {
        if (next === lang) return
        setLangState(next)
        // save first: a direction change reloads the app in development, and the reloaded app must
        // start in the new language
        void writePref(LANG_STORAGE_KEY, next).then(() => {
          if (applyDirection(LANGUAGES[next].dir) !== 'restart') return
          const texts = catalogues[next]
          Alert.alert(
            translate(texts, en, LANGUAGES[next].locale, 'prefs.restartTitle'),
            translate(texts, en, LANGUAGES[next].locale, 'prefs.restartText'),
            [{ text: translate(texts, en, LANGUAGES[next].locale, 'prefs.ok') }],
          )
        })
      },
      t,
      formatPrice: (cents) => money.format(cents / 100),
      formatDate: (iso, options = { dateStyle: 'medium' }) => new Intl.DateTimeFormat(locale, options).format(new Date(iso)),
      formatNumber: (n) => number.format(n),
      itemText: (item) => {
        const translated = lang === 'en' ? undefined : item.translations?.[lang]
        return { name: translated?.name ?? item.name, description: translated?.description ?? item.description ?? '' }
      },
      errorText: (err, fallback = 'common.genericError') => {
        if (!err) return null
        if (isUnreachable(err)) return t('common.unreachable')
        if (err instanceof ApiError && err.code === 'ACCOUNT_BLOCKED') {
          const until = err.details?.until as string | null | undefined
          return [
            t('blocked.message'),
            err.details?.reason ? t('blocked.reason', { reason: String(err.details.reason) }) : '',
            until ? t('blocked.until', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(until)) }) : '',
          ]
            .filter(Boolean)
            .join(' ')
        }
        if (err instanceof ApiError && err.status < 500) {
          // English shows the server's own wording, which can name the exact item or field
          if (lang === 'en') return err.message
          const key = `apiErrors.${err.code}`
          return hasMessage(active, key) ? t(key as MessageKey) : err.message
        }
        return t(fallback)
      },
    }
  }, [lang, dir, locale])

  return (
    <I18nContext value={i18n}>
      {/* web has no native direction switch; `dir` on the root view flips the layout there */}
      <View style={{ flex: 1 }} {...({ dir } as object)}>
        {children}
      </View>
    </I18nContext>
  )
}
