import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/theme-context'

export default function TransactionsScreen() {
  const { theme } = useTheme()
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        <Text style={{ color: theme.icon }}>Your transactions will appear here.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: 'bold' },
})
