import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'

export default function DashboardScreen() {
  const { theme } = useTheme()
  const { session, signOut } = useAuth()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
        <Text style={[styles.email, { color: theme.icon }]}>{session?.user.email}</Text>

        <Pressable style={[styles.signOut, { borderColor: theme.icon }]} onPress={signOut}>
          <Text style={{ color: theme.text }}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: 'bold' },
  email: { fontSize: 14 },
  signOut: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
})
