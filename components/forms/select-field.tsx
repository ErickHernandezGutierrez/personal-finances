import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { AppModal } from '@/components/modal'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'

export type SelectOption = { label: string; value: string }

type SelectFieldProps = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const { theme } = useTheme()
  const [visible, setVisible] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <Pressable style={[styles.trigger, { backgroundColor: theme.fieldBackground, borderColor: theme.border }]} onPress={() => setVisible(true)}>
        <View style={styles.triggerText}>
          <Text style={[styles.label, { color: theme.icon }]}>{label}</Text>
          <Text style={{ color: theme.text }} numberOfLines={1}>
            {selected?.label ?? 'Select'}
          </Text>
        </View>
        <Text style={{ color: theme.icon }}>▾</Text>
      </Pressable>

      <AppModal visible={visible} title={label} onClose={() => setVisible(false)}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={styles.option}
            onPress={() => {
              onChange(option.value)
              setVisible(false)
            }}>
            <Text style={{ color: theme.text }}>{option.label}</Text>
            {option.value === value && <IconSymbol name="checkmark" size={18} color={theme.tint} />}
          </Pressable>
        ))}
      </AppModal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  triggerText: { flex: 1, marginRight: 8 },
  label: { fontSize: 11 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
})
