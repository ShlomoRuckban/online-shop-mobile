import { DevSettings, I18nManager, Platform } from 'react-native'

/**
 * Makes the native layout direction match the language. React Native applies a direction
 * change only after a reload: in development the app reloads itself; a release build asks the
 * shopper to reopen it (returns 'restart'). Web follows `dir` on the root view instead.
 */
export function applyDirection(dir: 'ltr' | 'rtl'): 'same' | 'reloading' | 'restart' {
  const rtl = dir === 'rtl'
  if (Platform.OS === 'web' || I18nManager.isRTL === rtl) return 'same'
  I18nManager.allowRTL(rtl)
  I18nManager.forceRTL(rtl)
  if (__DEV__) {
    DevSettings.reload()
    return 'reloading'
  }
  return 'restart'
}
