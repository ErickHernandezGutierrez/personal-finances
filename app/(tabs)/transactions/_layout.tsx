import { Stack } from 'expo-router'

import { useTheme } from '@/contexts/theme-context'

export default function TransactionsLayout() {
  const { theme } = useTheme()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    />
  )
}
