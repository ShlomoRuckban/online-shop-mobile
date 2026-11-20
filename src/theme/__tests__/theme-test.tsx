import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, render } from '@testing-library/react-native'
import * as ReactNative from 'react-native'
import { useTheme } from 'react-native-paper'
import { ThemeProvider, useThemePrefs } from '../ThemeProvider'
import { THEME_STORAGE_KEY, darkTheme, isThemeChoice, lightTheme, resolveTheme } from '../theme'

describe('resolveTheme', () => {
  it('follows the phone for "system" and ignores it otherwise', () => {
    expect(resolveTheme('system', 'dark')).toBe(darkTheme)
    expect(resolveTheme('system', null)).toBe(lightTheme)
    expect(resolveTheme('light', 'dark')).toBe(lightTheme)
    expect(resolveTheme('dark', 'light')).toBe(darkTheme)
  })

  it('accepts only known choices', () => {
    expect(isThemeChoice('dark')).toBe(true)
    expect(isThemeChoice('blue')).toBe(false)
    expect(isThemeChoice(null)).toBe(false)
  })

  it('uses the web shop brand colors', () => {
    expect(lightTheme.colors.primary).toBe('#1565c0')
    expect(darkTheme.colors.background).toBe('#0f1214')
  })
})

let prefs: ReturnType<typeof useThemePrefs>
let paperDark = false
// hands the current values to the test through a callback (render code must not assign outer variables)
function Probe({ onValue }: { onValue: (value: { prefs: ReturnType<typeof useThemePrefs>; dark: boolean }) => void }) {
  const value = { prefs: useThemePrefs(), dark: useTheme().dark }
  onValue(value)
  return null
}

function record(value: { prefs: ReturnType<typeof useThemePrefs>; dark: boolean }) {
  prefs = value.prefs
  paperDark = value.dark
}

describe('ThemeProvider', () => {
  it('starts from the saved choice and saves a new one', async () => {
    await render(
      <ThemeProvider initialChoice="dark">
        <Probe onValue={record} />
      </ThemeProvider>,
    )
    expect(paperDark).toBe(true)
    await act(async () => prefs.setChoice('light'))
    expect(paperDark).toBe(false)
    expect(prefs.choice).toBe('light')
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('follows the phone scheme for "system"', async () => {
    const scheme = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark')
    await render(
      <ThemeProvider>
        <Probe onValue={record} />
      </ThemeProvider>,
    )
    expect(prefs.choice).toBe('system')
    expect(paperDark).toBe(true)
    scheme.mockRestore()
  })
})
