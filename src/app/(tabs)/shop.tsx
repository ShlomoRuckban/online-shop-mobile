import { Text } from 'react-native-paper'
import { Screen } from '../../components/Screen'
import { useI18n } from '../../i18n/context'

// The catalog arrives in leaf 3.1.
export default function ShopScreen() {
  const { t } = useI18n()
  return (
    <Screen>
      <Text variant="bodyLarge">{t('shop.empty')}</Text>
    </Screen>
  )
}
