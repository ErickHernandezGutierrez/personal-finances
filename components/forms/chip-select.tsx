import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '@/contexts/theme-context'

type ChipOption = { label: string; value: string }

type ChipSelectProps = {
  label: string
  options: ChipOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  allowCustom?: boolean
  customPlaceholder?: string
}

export function ChipSelect({
  label,
  options,
  value,
  onChange,
  error,
  allowCustom,
  customPlaceholder,
}: ChipSelectProps) {
  const { theme } = useTheme()
  const isCustom = allowCustom && !options.some((option) => option.value === value)

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                { borderColor: active ? theme.tint : theme.border },
                active && { backgroundColor: theme.tint },
              ]}>
              <Text style={{ color: active ? theme.background : theme.text }}>{option.label}</Text>
            </Pressable>
          )
        })}
        {allowCustom && (
          <Pressable
            onPress={() => onChange('')}
            style={[
              styles.chip,
              { borderColor: isCustom ? theme.tint : theme.border },
              isCustom && { backgroundColor: theme.tint },
            ]}>
            <Text style={{ color: isCustom ? theme.background : theme.text }}>Other</Text>
          </Pressable>
        )}
      </View>
      {isCustom && (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={customPlaceholder}
          placeholderTextColor={theme.icon}
          autoCapitalize="characters"
          style={[
            styles.input,
            { color: theme.text, borderColor: error ? '#ef4444' : theme.icon, backgroundColor: theme.background },
          ]}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginTop: 4 },
  error: { fontSize: 12, color: '#ef4444' },
})
