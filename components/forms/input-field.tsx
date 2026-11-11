import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native'

import { useTheme } from '@/contexts/theme-context'

type Props = TextInputProps & {
  label: string
  error?: string
}

export function InputField({ label, error, style, ...props }: Props) {
  const { theme } = useTheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: error ? '#ef4444' : theme.border,
            backgroundColor: theme.fieldBackground,
          },
          style,
        ]}
        placeholderTextColor={theme.icon}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: { fontSize: 12, color: '#ef4444' },
})
