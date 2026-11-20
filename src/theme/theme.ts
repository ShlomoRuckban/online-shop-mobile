import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper'

export type ThemeChoice = 'light' | 'dark' | 'system'
export const THEME_CHOICES: ThemeChoice[] = ['light', 'dark', 'system']
export const THEME_STORAGE_KEY = 'online-shop:theme'

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** The web shop's colors (src/theme.ts in the web client) on Material 3. */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1565c0',
    onPrimary: '#ffffff',
    primaryContainer: '#d6e3ff',
    onPrimaryContainer: '#001b3e',
    secondary: '#a15c00',
    onSecondary: '#ffffff',
    secondaryContainer: '#ffdcbe',
    onSecondaryContainer: '#2f1500',
    background: '#f7f8fa',
    surface: '#ffffff',
  },
}

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90caf9',
    onPrimary: '#003063',
    primaryContainer: '#0d47a1',
    onPrimaryContainer: '#d6e3ff',
    secondary: '#ffb74d',
    onSecondary: '#4c2700',
    secondaryContainer: '#6d3a00',
    onSecondaryContainer: '#ffdcbe',
    background: '#0f1214',
    surface: '#171b1f',
  },
}

/** The theme to show for a choice, given the phone's current scheme. */
export function resolveTheme(choice: ThemeChoice, systemScheme: 'light' | 'dark' | null | undefined): MD3Theme {
  const scheme = choice === 'system' ? (systemScheme ?? 'light') : choice
  return scheme === 'dark' ? darkTheme : lightTheme
}
