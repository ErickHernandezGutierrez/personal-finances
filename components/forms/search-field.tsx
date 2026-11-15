import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchField({ value, onChange, placeholder = 'Search' }: SearchFieldProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.fieldBackground, borderColor: theme.border }]}>
      <IconSymbol name="magnifyingglass" size={18} color={theme.icon} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.icon}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <IconSymbol name="xmark" size={18} color={theme.icon} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
})
