import { Pressable, StyleSheet, Text, View } from 'react-native'

import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'

const COLORS = [
  '#0a7ea4',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#64748b',
]

type ColorSwatchPickerProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorSwatchPicker({ label, value, onChange }: ColorSwatchPickerProps) {
  const { theme } = useTheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.row}>
        {COLORS.map((color) => (
          <Pressable key={color} onPress={() => onChange(color)} style={[styles.swatch, { backgroundColor: color }]}>
            {value === color && <IconSymbol name="checkmark" size={16} color="#fff" />}
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
})
