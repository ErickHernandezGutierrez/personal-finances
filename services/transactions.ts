import { getUserId, supabase } from '@/lib/supabase'
import type { Transaction, TransactionInsert, TransactionUpdate } from '@/types/app'
import { recalculateBalance } from './accounts'

export type TransactionFilters = {
  accountId?: string
  categoryId?: string
  type?: string
  isPaid?: boolean
  from?: string // YYYY-MM-DD
  to?: string   // YYYY-MM-DD
}

export async function listTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  if (filters?.accountId) {
    query = query.or(
      `account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`,
    )
  }
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.isPaid !== undefined) query = query.eq('is_paid', filters.isPaid)
  if (filters?.from) query = query.gte('date', filters.from)
  if (filters?.to) query = query.lte('date', filters.to)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTransaction(
  data: Omit<TransactionInsert, 'user_id'>,
): Promise<Transaction> {
  const userId = await getUserId()
  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({ ...data, user_id: userId })
    .select()
    .single()
  if (error) throw error

  if (tx.is_paid) {
    await recalculateBalance(tx.account_id)
    if (tx.to_account_id) await recalculateBalance(tx.to_account_id)
  }

  return tx
}

export async function updateTransaction(
  id: string,
  data: TransactionUpdate,
): Promise<Transaction> {
  const { data: before } = await supabase
    .from('transactions')
    .select('account_id, to_account_id')
    .eq('id', id)
    .single()

  const { data: tx, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  const affected = new Set(
    [
      before?.account_id,
      before?.to_account_id,
      tx.account_id,
      tx.to_account_id,
    ].filter(Boolean) as string[],
  )
  await Promise.all([...affected].map(recalculateBalance))

  return tx
}

export async function deleteTransaction(id: string): Promise<void> {
  const { data: tx } = await supabase
    .from('transactions')
    .select('account_id, to_account_id, is_paid')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error

  if (tx?.is_paid) {
    const affected = [tx.account_id, tx.to_account_id].filter(Boolean) as string[]
    await Promise.all(affected.map(recalculateBalance))
  }
}
