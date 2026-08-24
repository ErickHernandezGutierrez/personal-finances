import { Link } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/theme-context'

type MenuRow = { label: string; href: string }

const MENU: MenuRow[] = [
  { label: 'Categories', href: '/(tabs)/more/categories' },
  { label: 'Recurring Transactions', href: '/(tabs)/more/recurring' },
  { label: 'Installment Plans', href: '/(tabs)/more/installments' },
]

export default function MoreScreen() {
  const { theme } = useTheme()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>More</Text>

        <View style={[styles.list, { borderColor: theme.icon }]}>
          {MENU.map((item, i) => (
            <Link key={item.href} href={item.href as any} asChild>
              <View
                style={StyleSheet.flatten([
                  styles.row,
                  { borderTopColor: theme.icon },
                  i === 0 && styles.rowFirst,
                ])}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={{ color: theme.icon }}>›</Text>
              </View>
            </Link>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: 'bold' },
  list: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  rowFirst: { borderTopWidth: 0 },
  rowLabel: { fontSize: 16 },
})
