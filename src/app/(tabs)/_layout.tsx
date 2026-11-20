import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'
import { useTheme } from 'react-native-paper'
import { useI18n } from '../../i18n/context'

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name']

function tabIcon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue | null; size: number }) {
    return <MaterialCommunityIcons name={name} color={typeof color === 'string' ? color : undefined} size={size} />
  }
  return TabIcon
}

export default function TabsLayout() {
  const { t } = useI18n()
  const theme = useTheme()
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="shop" options={{ title: t('tabs.shop'), tabBarIcon: tabIcon('storefront-outline') }} />
      <Tabs.Screen name="cart" options={{ title: t('tabs.cart'), tabBarIcon: tabIcon('cart-outline') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.account'), tabBarIcon: tabIcon('account-circle-outline') }} />
    </Tabs>
  )
}
