import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'

import { Card } from '@/components/ui/card'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'
import { formatCurrency } from '@/lib/format'
import type { Account, MoneyExchange } from '@/types/app'

type MoneyExchangeCardProps = {
  exchange: MoneyExchange
  fromAccount?: Account
  toAccount?: Account
  togglingId?: boolean
  onPress: () => void
  onDelete: () => void
  onToggleSent: (isSent: boolean) => void
  onToggleReceived: (isReceived: boolean) => void
}

export function MoneyExchangeCard({
  exchange,
  fromAccount,
  toAccount,
  togglingId,
  onPress,
  onDelete,
  onToggleSent,
  onToggleReceived,
}: MoneyExchangeCardProps) {
  const { theme } = useTheme()

  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} style={styles.content}>
        <Text style={[styles.description, { color: theme.text }]} numberOfLines={1}>
          {exchange.description || 'Money exchange'}
        </Text>
        <Text style={{ color: theme.icon }}>
          {fromAccount?.name ?? 'Unknown account'} → {toAccount?.name ?? 'Unknown account'}
          {' · '}
          {exchange.date_sent}
        </Text>
        <Text style={[styles.amount, { color: theme.text }]}>
          {formatCurrency(exchange.amount_sent, exchange.currency_sent)} → {formatCurrency(exchange.amount_received, exchange.currency_received)}
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.toggle}>
          <Text style={{ color: exchange.is_sent ? '#22c55e' : theme.icon, fontSize: 12 }}>Sent</Text>
          <Switch
            value={exchange.is_sent}
            onValueChange={onToggleSent}
            disabled={togglingId}
            trackColor={{ true: theme.tint }}
          />
        </View>
        <View style={styles.toggle}>
          <Text style={{ color: exchange.is_received ? '#22c55e' : theme.icon, fontSize: 12 }}>Received</Text>
          <Switch
            value={exchange.is_received}
            onValueChange={onToggleReceived}
            disabled={togglingId}
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
    gap: 12,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
})
