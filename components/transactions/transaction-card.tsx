import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { useTheme } from '@/contexts/theme-context';
import { formatCurrency } from '@/lib/format';
import type { Account, Category, Transaction, TransactionType } from '@/types/app';

const NEGATIVE_TYPES = new Set<TransactionType>(
  ['expense', 'withdrawal', 'credit_payment']
);

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
  togglingPaid,
  onPress,
  onDelete,
  onTogglePaid,
}: TransactionCardProps) {
  const { theme } = useTheme();
  const type = transaction.type as TransactionType;
  const isNegative = NEGATIVE_TYPES.has(type);
  const isIncome = type === 'income';
  const amountColor = isIncome ? theme.balancePositive : isNegative ? theme.balanceNegative : theme.balanceNeutral;
  const sign = isIncome ? '+' : isNegative ? '-' : '';

  return (
    <Card style={[styles.card, { backgroundColor: theme.secondaryBackground }]}>
      <Pressable onPress={onPress} style={styles.content}>
        <View style={styles.image} />
        <View style={{ gap: 2 }}>
          <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={{ color: theme.icon }}>
            {transaction.date}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end', gap: 2 }}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {sign}
            {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <IconButton name='trash' onPress={onDelete} />
            <Switch
              value={transaction.is_paid}
              onValueChange={onTogglePaid}
              disabled={togglingPaid}
              trackColor={{ true: theme.primary, false: theme.tertiaryBackground }}
            />
          </View>
        </View>
      </Pressable>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 0 },
  content: { gap: 4, flexDirection: 'row', alignItems: 'center' },
  description: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paidToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  image: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', marginRight: 8 },
})
