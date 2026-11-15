import { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

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
        <Text style={[styles.triggerText, { color: theme.text }]}>
          {selected?.label ?? 'Select'}
        </Text>
        <IconSymbol name="chevron.down" size={18} color={theme.icon} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  triggerText: { 
    fontSize: 14, 
    fontWeight: '400', 
    lineHeight: 16, 
    marginRight: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
})
