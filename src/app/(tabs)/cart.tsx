import { Text } from 'react-native-paper'
import { Screen } from '../../components/Screen'
import { useI18n } from '../../i18n/context'

// The cart arrives in leaf 5.1.
export default function CartScreen() {
  const { t } = useI18n()
  return (
    <Screen>
      <Text variant="bodyLarge">{t('cart.empty')}</Text>
    </Screen>
  )
}
