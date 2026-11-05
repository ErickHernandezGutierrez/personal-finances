import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';
import { formatCurrency } from '@/lib/format';
import type { Account } from '@/types/app';

type AccountCardProps = {
  account: Account
  onPress: () => void
  archived?: boolean
  onDeactivate?: () => void
  onReactivate?: () => void
};

export function AccountCard({ account, onPress, archived, onDeactivate, onReactivate }: AccountCardProps) {
  const { theme } = useTheme();
  const balanceColor = account.current_balance < 0 
    ? theme.balanceNegative
    : account.current_balance > 0
      ? theme.balancePositive
      : theme.balanceNeutral;

  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.card, archived && styles.archivedCard]}>
        <View style={[styles.colorBar, { backgroundColor: account.color }]} />
        <View style={styles.content}>
          <View style={styles.rowBetween}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {account.name}
            </Text>
            <Pressable onPress={archived ? onReactivate : onDeactivate} hitSlop={8}>
              <IconSymbol name={archived ? 'arrow.counterclockwise' : 'trash'} size={18} color={theme.icon} />
            </Pressable>
          </View>
          <Text style={[styles.balance, { color: balanceColor }]}>
            {formatCurrency(account.current_balance, account.currency)}
          </Text>
          {account.type === 'credit_card' && account.credit_limit != null && (
            <Text style={{ color: theme.icon, fontSize: 12 }}>
              Limit: {formatCurrency(account.credit_limit, account.currency)}
              {account.payment_due_day ? ` · Due day ${account.payment_due_day}` : ''}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { 
    maxWidth: 300,
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 12,
    aspectRatio: 1.678,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  archivedCard: { opacity: 0.6 },
  colorBar: { width: 4, borderRadius: 2 },
  content: { flex: 1, gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  balance: { fontSize: 18, fontWeight: '700', marginTop: 2 },
})
