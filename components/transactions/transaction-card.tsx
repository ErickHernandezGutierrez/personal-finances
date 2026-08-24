import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'

import { Card } from '@/components/ui/card'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'
import { formatCurrency } from '@/lib/format'
import type { Account, Category, Transaction, TransactionType } from '@/types/app'

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
  credit_payment: 'Credit Payment',
  withdrawal: 'Withdrawal',
  investment: 'Investment',
}

const NEGATIVE_TYPES = new Set<TransactionType>(['expense', 'withdrawal', 'credit_payment'])

type TransactionCardProps = {
  transaction: Transaction
  account?: Account
  toAccount?: Account
  category?: Category
  togglingPaid?: boolean
  onPress: () => void
  onDelete: () => void
  onTogglePaid: (isPaid: boolean) => void
}

export function TransactionCard({
  transaction,
  account,
  toAccount,
  category,
  togglingPaid,
  onPress,
  onDelete,
  onTogglePaid,
}: TransactionCardProps) {
  const { theme } = useTheme()
  const type = transaction.type as TransactionType
  const isNegative = NEGATIVE_TYPES.has(type)
  const isIncome = type === 'income'
  const amountColor = isIncome ? '#22c55e' : isNegative ? '#ef4444' : theme.text
  const sign = isIncome ? '+' : isNegative ? '-' : ''

  return (
    <Card style={styles.card}>
      {/* Only the description/metadata area opens the edit modal — the switch and delete
          button below live outside this Pressable so their taps never bubble into it. */}
      <Pressable onPress={onPress} style={styles.content}>
        <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={{ color: theme.icon }}>
          {TYPE_LABELS[type] ?? type}
          {category ? ` · ${category.name}` : ''}
        </Text>
        <Text style={{ color: theme.icon }}>
          {account?.name ?? 'Unknown account'}
          {toAccount ? ` → ${toAccount.name}` : ''}
          {' · '}
          {transaction.date}
        </Text>
        <Text style={[styles.amount, { color: amountColor }]}>
          {sign}
          {formatCurrency(transaction.amount, transaction.currency)}
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.paidToggle}>
          <Text style={{ color: transaction.is_paid ? '#22c55e' : theme.icon, fontSize: 12 }}>
            {transaction.is_paid ? 'Paid' : 'Pending'}
          </Text>
          <Switch
            value={transaction.is_paid}
            onValueChange={onTogglePaid}
            disabled={togglingPaid}
            trackColor={{ true: theme.tint }}
          />
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <IconSymbol name="trash" size={18} color={theme.icon} />
        </Pressable>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  content: { gap: 4 },
  description: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paidToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
