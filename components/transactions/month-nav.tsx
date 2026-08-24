import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/contexts/theme-context'

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type MonthNavProps = {
  year: number
  month: number // 1-12
  onChange: (year: number, month: number) => void
}

export function MonthNav({ year, month, onChange }: MonthNavProps) {
  const { theme } = useTheme()

  function shift(delta: number) {
    let nextMonth = month + delta
    let nextYear = year
    if (nextMonth < 1) {
      nextMonth = 12
      nextYear -= 1
    } else if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    onChange(nextYear, nextMonth)
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={() => shift(-1)} hitSlop={8} style={styles.arrow}>
        <Text style={[styles.arrowText, { color: theme.tint }]}>‹</Text>
      </Pressable>
      <Text style={[styles.label, { color: theme.text }]}>
        {MONTH_LABELS[month - 1]} {year}
      </Text>
      <Pressable onPress={() => shift(1)} hitSlop={8} style={styles.arrow}>
        <Text style={[styles.arrowText, { color: theme.tint }]}>›</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { paddingHorizontal: 12, paddingVertical: 4 },
  arrowText: { fontSize: 22, fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600' },
})
