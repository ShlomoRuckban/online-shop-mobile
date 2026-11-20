import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createQueryClient } from '../api/queryClient'
import { loadToken } from '../auth/tokenStore'
import { I18nProvider } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/context'
import { applyDirection } from '../i18n/direction'
import { initialLanguage } from '../i18n/initial'
import { LANGUAGES, type Language } from '../i18n/translate'
import { readPref } from '../storage/prefs'
import { ThemeProvider, useThemePrefs } from '../theme/ThemeProvider'
import { THEME_STORAGE_KEY, isThemeChoice, type ThemeChoice } from '../theme/theme'

interface Boot {
  lang: Language
  theme: ThemeChoice
}

// the native splash screen stays up until the saved preferences are read
void SplashScreen.preventAutoHideAsync().catch(() => undefined)

/** Reads the saved language, theme and session while the splash screen is up, so nothing flashes or flips. */
async function boot(): Promise<Boot> {
  const [lang, savedTheme] = await Promise.all([initialLanguage(), readPref(THEME_STORAGE_KEY), loadToken()])
  // first launch in Hebrew: set the native direction now (development reloads; a release build
  // shows the right direction from the next launch)
  applyDirection(LANGUAGES[lang].dir)
  return { lang, theme: isThemeChoice(savedTheme) ? savedTheme : 'system' }
}

function Navigator({ booting }: { booting: boolean }) {
  const { t } = useI18n()
  const { dark } = useThemePrefs()
  const theme = useTheme()
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="health" options={{ title: t('health.title') }} />
      </Stack>
      {/* web and tests have no native splash screen: cover the screens until the preferences are in */}
      {booting && <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]} testID="booting" />}
    </>
  )
}

export default function RootLayout() {
  const [ready, setReady] = useState<Boot | null>(null)
  const [queryClient] = useState(createQueryClient)

  useEffect(() => {
    void boot()
      .then(setReady)
      .finally(() => SplashScreen.hideAsync().catch(() => undefined))
  }, [])

  // Expo Router needs the navigator on the first render, so it mounts with defaults and the saved
  // choices replace them as soon as they are read
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialChoice={ready?.theme ?? 'system'}>
          <I18nProvider initialLang={ready?.lang ?? 'en'}>
            <Navigator booting={!ready} />
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
