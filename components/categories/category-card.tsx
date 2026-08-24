import { Pressable, StyleSheet, Text } from 'react-native'

import { Card } from '@/components/ui/card'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'
import type { Category } from '@/types/app'

type CategoryCardProps = {
  category: Category
  onPress: () => void
  onDelete: () => void
}

export function CategoryCard({ category, onPress, onDelete }: CategoryCardProps) {
  const { theme } = useTheme()

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {category.name}
        </Text>
        <Pressable onPress={onDelete} hitSlop={8}>
          <IconSymbol name="trash" size={18} color={theme.icon} />
        </Pressable>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
})
