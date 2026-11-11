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
  category,
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
        <View style={styles.image}>
          <Text style={{ fontSize: 18 }}>
            {category?.name.split(' ')[0]}
          </Text>
        </View>
        <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={{ flex: 1, color: theme.icon }}>
          {transaction.date}
        </Text>
        <Text style={{ flex: 1, color: theme.icon }}>
          {transaction.type}
        </Text>
        <Text style={[styles.amount, { color: amountColor }]}>
          {sign}
          {formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <Switch
          value={transaction.is_paid}
          onValueChange={onTogglePaid}
          disabled={togglingPaid}
          trackColor={{ true: theme.primary, false: theme.tertiaryBackground }}
        />
        <IconButton name='trash' onPress={onDelete} />
      </Pressable>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 0 },
  content: { gap: 4, flexDirection: 'row', alignItems: 'center' },
  description: { flex: 1, fontSize: 16, fontWeight: '600' },
  amount: { flex: 1, fontSize: 16, fontWeight: '700', marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paidToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  image: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222F38', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
})
