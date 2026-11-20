import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, render, screen } from '@testing-library/react-native'
import { getLocales } from 'expo-localization'
import { Alert, DevSettings, I18nManager, Text } from 'react-native'
import { ApiError, UNREACHABLE_MESSAGE } from '../../api/client'
import { catalogues, deepMerge, en } from '../catalogues'
import { useI18n, type I18n } from '../context'
import { applyDirection } from '../direction'
import { I18nProvider } from '../I18nProvider'
import { initialLanguage } from '../initial'
import { LANG_STORAGE_KEY, detectLanguage, translate, type Language } from '../translate'

function keysOf(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    const isLeaf = typeof value === 'string' || (typeof value === 'object' && value !== null && 'other' in value)
    return isLeaf ? [path] : keysOf(value as object, path)
  })
}

describe('catalogues', () => {
  it('have the same keys in every language', () => {
    const english = keysOf(en).sort()
    expect(english.length).toBeGreaterThan(50)
    expect(keysOf(catalogues.he).sort()).toEqual(english)
    expect(keysOf(catalogues.es).sort()).toEqual(english)
  })

  it('let app texts replace the web shop wording', () => {
    expect(translate(catalogues.en, en, 'en-US', 'prefs.system')).toBe('Match phone')
    expect(translate(catalogues.en, en, 'en-US', 'prefs.dark')).toBe('Dark')
  })

  it('merge nested trees without losing keys', () => {
    expect(deepMerge({ a: { b: '1', c: '2' } }, { a: { c: '3' }, d: '4' })).toEqual({ a: { b: '1', c: '3' }, d: '4' })
  })
})

describe('language choice', () => {
  it('prefers the saved choice, then the phone languages, then English', () => {
    expect(detectLanguage('es', ['he-IL'])).toBe('es')
    expect(detectLanguage(null, ['fr-FR', 'iw-IL'])).toBe('he')
    expect(detectLanguage('xx', ['fr-FR'])).toBe('en')
  })

  it('reads the saved language before the phone locale', async () => {
    jest.mocked(getLocales).mockReturnValueOnce([{ languageTag: 'he-IL' } as ReturnType<typeof getLocales>[number]])
    await expect(initialLanguage()).resolves.toBe('he')
    await AsyncStorage.setItem(LANG_STORAGE_KEY, 'es')
    await expect(initialLanguage()).resolves.toBe('es')
    await AsyncStorage.clear()
  })
})

let i18n: I18n
// hands the current i18n value to the test through a callback (render code must not assign outer variables)
function Probe({ onValue }: { onValue: (value: I18n) => void }) {
  const value = useI18n()
  onValue(value)
  return <Text>{value.t('tabs.home')}</Text>
}

function renderWith(lang: Language) {
  return render(
    <I18nProvider initialLang={lang}>
      <Probe onValue={(value) => (i18n = value)} />
    </I18nProvider>,
  )
}

describe('I18nProvider', () => {
  it('formats prices and plurals per language', async () => {
    await renderWith('es')
    expect(screen.getByText('Inicio')).toBeTruthy()
    expect(i18n.formatPrice(2599)).toMatch(/25,99/)
    expect(i18n.t('common.itemCount', { count: 1 })).toBe('1 artículo')
    expect(i18n.dir).toBe('ltr')
  })

  it('uses item translations with an English fallback', async () => {
    await renderWith('he')
    expect(i18n.dir).toBe('rtl')
    expect(i18n.itemText({ name: 'Lamp', description: 'Bright', translations: { he: { name: 'מנורה', description: 'בהירה' } } }).name).toBe('מנורה')
    expect(i18n.itemText({ name: 'Lamp' })).toEqual({ name: 'Lamp', description: '' })
  })

  it('translates API errors by code, keeps the server text in English', async () => {
    await renderWith('he')
    const err = new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists')
    expect(i18n.errorText(err)).toBe(catalogues.he && translate(catalogues.he, en, 'he-IL', 'apiErrors.EMAIL_TAKEN'))
    expect(i18n.errorText(new ApiError(0, 'UNREACHABLE', UNREACHABLE_MESSAGE))).toBe(translate(catalogues.he, en, 'he-IL', 'common.unreachable'))
    expect(i18n.errorText(new ApiError(500, 'HTTP_ERROR', 'boom'))).toBe(translate(catalogues.he, en, 'he-IL', 'common.genericError'))
    expect(i18n.errorText(null)).toBeNull()
  })

  it('switches language, saves it and changes the direction', async () => {
    const reload = jest.spyOn(DevSettings, 'reload').mockImplementation(() => {})
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {})
    await renderWith('en')
    await act(async () => i18n.setLang('he'))
    expect(screen.getByText('בית')).toBeTruthy()
    expect(await AsyncStorage.getItem(LANG_STORAGE_KEY)).toBe('he')
    expect(forceRTL).toHaveBeenCalledWith(true)
    expect(reload).toHaveBeenCalled()
    reload.mockRestore()
    forceRTL.mockRestore()
  })

  it('saves the new language before the development reload, so the app comes back in it', async () => {
    const order: string[] = []
    const save = jest.spyOn(AsyncStorage, 'setItem').mockImplementation(() => Promise.resolve().then(() => void order.push('save')))
    const reload = jest.spyOn(DevSettings, 'reload').mockImplementation(() => void order.push('reload'))
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {})
    await renderWith('en')
    await act(async () => i18n.setLang('he'))
    expect(order).toEqual(['save', 'reload'])
    save.mockRestore()
    reload.mockRestore()
    forceRTL.mockRestore()
  })
})

// __DEV__ is true under jest; these tests switch it off to act like a release build
const devFlag = globalThis as unknown as { __DEV__: boolean }

describe('applyDirection', () => {
  it('does nothing when the direction already matches', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {})
    expect(applyDirection(I18nManager.isRTL ? 'rtl' : 'ltr')).toBe('same')
    expect(forceRTL).not.toHaveBeenCalled()
    forceRTL.mockRestore()
  })

  it('asks for a restart in a release build', () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {})
    const dev = devFlag.__DEV__
    ;devFlag.__DEV__ = false
    expect(applyDirection(I18nManager.isRTL ? 'ltr' : 'rtl')).toBe('restart')
    ;devFlag.__DEV__ = dev
    forceRTL.mockRestore()
  })

  it('shows the restart message in the new language when a release build switches', async () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {})
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    const dev = devFlag.__DEV__
    ;devFlag.__DEV__ = false
    await renderWith('en')
    await act(async () => i18n.setLang('he'))
    expect(alert).toHaveBeenCalledWith(translate(catalogues.he, en, 'he-IL', 'prefs.restartTitle'), expect.any(String), expect.any(Array))
    ;devFlag.__DEV__ = dev
    alert.mockRestore()
    forceRTL.mockRestore()
  })
})
