import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '@/contexts/theme-context'

type CardProps = {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function Card({ children, style }: CardProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
})
