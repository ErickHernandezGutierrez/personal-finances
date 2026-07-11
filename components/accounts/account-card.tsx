import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Card } from '@/components/ui/card'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'
import type { Account, AccountType } from '@/types/app'

const TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investment',
  cash: 'Cash',
  credit_card: 'Credit Card',
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

type AccountCardProps = {
  account: Account
  onPress: () => void
  archived?: boolean
  onDeactivate?: () => void
  onReactivate?: () => void
}

export function AccountCard({ account, onPress, archived, onDeactivate, onReactivate }: AccountCardProps) {
  const { theme } = useTheme()
  const typeLabel = TYPE_LABELS[account.type as AccountType] ?? account.type

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
          <Text style={{ color: theme.icon }}>
            {typeLabel}
            {account.bank ? ` · ${account.bank}` : ''}
          </Text>
          <Text style={[styles.balance, { color: theme.text }]}>
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
  card: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  archivedCard: { opacity: 0.6 },
  colorBar: { width: 4, borderRadius: 2 },
  content: { flex: 1, gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  balance: { fontSize: 18, fontWeight: '700', marginTop: 2 },
})
