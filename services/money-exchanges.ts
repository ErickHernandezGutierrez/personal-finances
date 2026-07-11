import { getUserId, supabase } from '@/lib/supabase'
import type { MoneyExchange, MoneyExchangeInsert, MoneyExchangeUpdate } from '@/types/app'
import { recalculateBalance } from './accounts'

// fx_rate is a generated column — never include it in writes
type ExchangeInsert = Omit<MoneyExchangeInsert, 'user_id' | 'fx_rate'>
type ExchangeUpdate = Omit<MoneyExchangeUpdate, 'fx_rate'>

export async function listMoneyExchanges(): Promise<MoneyExchange[]> {
  const { data, error } = await supabase
    .from('money_exchanges')
    .select('*')
    .order('date_sent', { ascending: false })
  if (error) throw error
  return data
}

export async function getMoneyExchange(id: string): Promise<MoneyExchange> {
  const { data, error } = await supabase
    .from('money_exchanges')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createMoneyExchange(data: ExchangeInsert): Promise<MoneyExchange> {
  const userId = await getUserId()
  const { data: exchange, error } = await supabase
    .from('money_exchanges')
    .insert({ ...data, user_id: userId })
    .select()
    .single()
  if (error) throw error

  if (exchange.is_sent) await recalculateBalance(exchange.from_account_id)
  if (exchange.is_received) await recalculateBalance(exchange.to_account_id)

  return exchange
}

export async function updateMoneyExchange(
  id: string,
  data: ExchangeUpdate,
): Promise<MoneyExchange> {
  const { data: before } = await supabase
    .from('money_exchanges')
    .select('from_account_id, to_account_id')
    .eq('id', id)
    .single()

  const { data: exchange, error } = await supabase
    .from('money_exchanges')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  const affected = new Set(
    [
      before?.from_account_id,
      before?.to_account_id,
      exchange.from_account_id,
      exchange.to_account_id,
    ].filter(Boolean) as string[],
  )
  await Promise.all([...affected].map(recalculateBalance))

  return exchange
}

export async function deleteMoneyExchange(id: string): Promise<void> {
  const { data: exchange } = await supabase
    .from('money_exchanges')
    .select('from_account_id, to_account_id, is_sent, is_received')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('money_exchanges').delete().eq('id', id)
  if (error) throw error

  const affected: string[] = []
  if (exchange?.is_sent) affected.push(exchange.from_account_id)
  if (exchange?.is_received) affected.push(exchange.to_account_id)
  await Promise.all(affected.map(recalculateBalance))
}
