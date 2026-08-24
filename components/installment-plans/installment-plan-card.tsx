import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Card } from '@/components/ui/card'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'
import { formatCurrency } from '@/lib/format'
import type { Account, Category, InstallmentPlan } from '@/types/app'

type InstallmentPlanCardProps = {
  plan: InstallmentPlan
  account?: Account
  category?: Category
  onDelete: () => void
}

export function InstallmentPlanCard({ plan, account, category, onDelete }: InstallmentPlanCardProps) {
  const { theme } = useTheme()

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>
          {plan.description}
        </Text>
        <Text style={{ color: theme.icon }}>
          {account?.name ?? 'Unknown account'}
          {category ? ` · ${category.name}` : ''}
          {' · starts '}
          {plan.start_date}
        </Text>
        <Text style={[styles.amount, { color: theme.text }]}>
          {formatCurrency(plan.total_amount, plan.currency)}
        </Text>
        <Text style={{ color: theme.icon, fontSize: 12 }}>
          {plan.num_installments} installments of {formatCurrency(plan.installment_amount, plan.currency)}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={8}>
        <IconSymbol name="trash" size={18} color={theme.icon} />
      </Pressable>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  content: { flex: 1, gap: 4 },
  description: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '700', marginTop: 2 },
})
