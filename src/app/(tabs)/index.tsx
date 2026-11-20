import { Text } from 'react-native-paper'
import { Screen } from '../../components/Screen'
import { useI18n } from '../../i18n/context'

export default function HomeScreen() {
  const { t } = useI18n()
  return (
    <Screen>
      <Text variant="headlineSmall" accessibilityRole="header">
        {t('home.welcome')}
      </Text>
      <Text variant="bodyLarge">{t('home.intro')}</Text>
    </Screen>
  )
}
