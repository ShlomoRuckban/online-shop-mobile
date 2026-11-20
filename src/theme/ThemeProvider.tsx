import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { writePref } from '../storage/prefs'
import { THEME_STORAGE_KEY, resolveTheme, type ThemeChoice } from './theme'

interface ThemePrefs {
  choice: ThemeChoice
  setChoice: (choice: ThemeChoice) => void
  dark: boolean
}

const ThemePrefsContext = createContext<ThemePrefs | null>(null)

export function useThemePrefs(): ThemePrefs {
  const prefs = useContext(ThemePrefsContext)
  if (!prefs) throw new Error('useThemePrefs must be used inside ThemeProvider')
  return prefs
}

/** Light, dark or the phone's setting (follows it live); the choice is saved on the device
 * and read back while the splash screen is up (src/app/_layout.tsx), so the wrong theme never shows. */
export function ThemeProvider({ children, initialChoice = 'system' }: { children: ReactNode; initialChoice?: ThemeChoice }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(initialChoice)
  // the saved choice arrives after the first render (the splash screen covers it); take it once it does
  const [seenInitial, setSeenInitial] = useState(initialChoice)
  if (initialChoice !== seenInitial) {
    setSeenInitial(initialChoice)
    setChoiceState(initialChoice)
  }
  const phoneScheme = useColorScheme()
  // anything other than light or dark (unknown, unspecified) counts as light
  const systemScheme = phoneScheme === 'dark' ? 'dark' : phoneScheme === 'light' ? 'light' : null


  const theme = useMemo(() => resolveTheme(choice, systemScheme), [choice, systemScheme])
  const value = useMemo<ThemePrefs>(() => {
    return {
      choice,
      dark: theme.dark,
      setChoice: (next) => {
        setChoiceState(next)
        void writePref(THEME_STORAGE_KEY, next)
      },
    }
  }, [choice, theme])

  return (
    <ThemePrefsContext value={value}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemePrefsContext>
  )
}
