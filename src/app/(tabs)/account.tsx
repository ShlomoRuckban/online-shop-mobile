import { router } from 'expo-router'
import { List, SegmentedButtons, Text } from 'react-native-paper'
import { Screen } from '../../components/Screen'
import { useI18n } from '../../i18n/context'
import { LANGUAGES, LANGUAGE_CODES, isLanguage } from '../../i18n/translate'
import { useThemePrefs } from '../../theme/ThemeProvider'
import { isThemeChoice } from '../../theme/theme'

export default function AccountScreen() {
  const { t, lang, setLang } = useI18n()
  const { choice, setChoice } = useThemePrefs()

  return (
    <Screen>
      <Text variant="titleMedium" accessibilityRole="header">
        {t('accountTab.preferences')}
      </Text>

      <Text variant="labelLarge" nativeID="language-label">
        {t('prefs.language')}
      </Text>
      <SegmentedButtons
        value={lang}
        onValueChange={(value) => isLanguage(value) && setLang(value)}
        buttons={LANGUAGE_CODES.map((code) => ({ value: code, label: LANGUAGES[code].label, testID: `lang-${code}` }))}
      />

      <Text variant="labelLarge" nativeID="theme-label">
        {t('prefs.theme')}
      </Text>
      <SegmentedButtons
        value={choice}
        onValueChange={(value) => isThemeChoice(value) && setChoice(value)}
        buttons={[
          { value: 'light', label: t('prefs.light'), testID: 'theme-light' },
          { value: 'dark', label: t('prefs.dark'), testID: 'theme-dark' },
          { value: 'system', label: t('prefs.system'), testID: 'theme-system' },
        ]}
      />

      <List.Item
        title={t('accountTab.serverStatus')}
        left={(props) => <List.Icon {...props} icon="server-network" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/health')}
        accessibilityRole="button"
        testID="server-status-link"
      />
    </Screen>
  )
}
