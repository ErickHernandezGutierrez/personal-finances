import { Redirect, Stack } from 'expo-router'

import { useAuth } from '@/contexts/auth-context'

export default function AuthLayout() {
  const { session } = useAuth()

  if (session) return <Redirect href="/(tabs)" />

  return <Stack screenOptions={{ headerShown: false }} />
}
