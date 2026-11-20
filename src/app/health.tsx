import { ActivityIndicator, Button, HelperText, Text } from 'react-native-paper'
import { apiBaseUrl } from '../api/config'
import { useHealth } from '../api/health'
import { Screen } from '../components/Screen'
import { useI18n } from '../i18n/context'

export default function HealthScreen() {
  const { t, errorText } = useI18n()
  const health = useHealth()

  return (
    <Screen>
      {health.isPending ? (
        <>
          <ActivityIndicator accessibilityLabel={t('health.checking')} />
          <Text>{t('health.checking')}</Text>
        </>
      ) : health.isError ? (
        <HelperText type="error" visible accessibilityLiveRegion="polite" testID="health-error">
          {errorText(health.error)}
        </HelperText>
      ) : (
        <Text variant="bodyLarge" accessibilityLiveRegion="polite" testID="health-status">
          {health.data.status === 'ok' ? t('health.ok') : t('health.degraded')}
        </Text>
      )}
      <Text variant="bodySmall">{t('health.address', { url: apiBaseUrl() })}</Text>
      <Button mode="contained" onPress={() => void health.refetch()} loading={health.isFetching} disabled={health.isFetching}>
        {t('health.check')}
      </Button>
    </Screen>
  )
}
