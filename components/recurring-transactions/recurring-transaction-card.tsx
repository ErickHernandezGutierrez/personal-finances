import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { useTheme } from '@/contexts/theme-context'
import { formatCurrency } from '@/lib/format'
import type { Account, Category, RecurringTransaction } from '@/types/app'

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const TYPE_LABELS: Record<string, string> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
  credit_payment: 'Credit Payment',
  withdrawal: 'Withdrawal',
  investment: 'Investment',
}

type RecurringTransactionCardProps = {
  recurring: RecurringTransaction
  account?: Account
  toAccount?: Account
  category?: Category
  isEnded: boolean
  onPress: () => void
  onDelete: () => void
}

export function RecurringTransactionCard({
  recurring,
  account,
  toAccount,
  category,
  isEnded,
  onPress,
  onDelete,
}: RecurringTransactionCardProps) {
  const { theme } = useTheme()

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.content}>
          <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>
            {recurring.description}
          </Text>
          <Text style={{ color: theme.icon }}>
            {TYPE_LABELS[recurring.type] ?? recurring.type}
            {' · '}
            {account?.name ?? 'Unknown account'}
            {toAccount ? ` → ${toAccount.name}` : ''}
            {category ? ` · ${category.name}` : ''}
          </Text>
          <Text style={[styles.amount, { color: theme.text }]}>
            {formatCurrency(recurring.amount, recurring.currency)}
          </Text>
          <Text style={{ color: theme.icon, fontSize: 12 }}>
            {FREQUENCY_LABELS[recurring.frequency] ?? recurring.frequency}
            {` · ${recurring.start_date} → ${recurring.end_date}`}
            {isEnded ? ' · ended' : ''}
          </Text>
        </View>
        <IconButton name="trash" onPress={onDelete} />
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  content: { flex: 1, gap: 4 },
  description: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '700', marginTop: 2 },
})
