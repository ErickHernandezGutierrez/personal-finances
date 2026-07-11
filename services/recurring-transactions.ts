import { getUserId, supabase } from '@/lib/supabase'
import type {
  RecurringTransaction,
  RecurringTransactionInsert,
  Transaction,
  TransactionInsert,
  TransactionType,
} from '@/types/app'

function advanceDate(date: Date, frequency: string): Date {
  const d = new Date(date)
  switch (frequency) {
    case 'daily':    d.setDate(d.getDate() + 1); break
    case 'weekly':   d.setDate(d.getDate() + 7); break
    case 'biweekly': d.setDate(d.getDate() + 14); break
    case 'monthly':  d.setMonth(d.getMonth() + 1); break
    case 'yearly':   d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function listRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .order('next_date')
  if (error) throw error
  return data
}

export async function getRecurringTransaction(id: string): Promise<RecurringTransaction> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createRecurringTransaction(
  data: Omit<RecurringTransactionInsert, 'user_id'>,
): Promise<RecurringTransaction> {
  const userId = await getUserId()
  const { data: recurring, error } = await supabase
    .from('recurring_transactions')
    .insert({ ...data, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return recurring
}

export async function updateRecurringTransaction(
  id: string,
  data: Omit<Partial<RecurringTransactionInsert>, 'user_id'>,
): Promise<RecurringTransaction> {
  const { data: recurring, error } = await supabase
    .from('recurring_transactions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return recurring
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
  if (error) throw error
}

/**
 * Creates one transaction row per due occurrence between next_date and today,
 * then advances next_date on the recurring record.
 */
export async function generateDueInstances(recurringId: string): Promise<Transaction[]> {
  const userId = await getUserId()

  const { data: recurring, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('id', recurringId)
    .single()
  if (error || !recurring) throw error ?? new Error('Recurring transaction not found')

  const today = formatDate(new Date())
  const rows: TransactionInsert[] = []
  let nextDate = new Date(recurring.next_date)

  while (formatDate(nextDate) <= today) {
    if (recurring.end_date && formatDate(nextDate) > recurring.end_date) break
    rows.push({
      type: recurring.type as TransactionType,
      amount: recurring.amount,
      currency: recurring.currency,
      date: formatDate(nextDate),
      description: recurring.description,
      is_paid: false,
      account_id: recurring.account_id,
      to_account_id: recurring.to_account_id ?? undefined,
      category_id: recurring.category_id ?? undefined,
      recurring_id: recurring.id,
      user_id: userId,
    })
    nextDate = advanceDate(nextDate, recurring.frequency)
  }

  if (rows.length === 0) return []

  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .insert(rows)
    .select()
  if (txError) throw txError

  await supabase
    .from('recurring_transactions')
    .update({ next_date: formatDate(nextDate) })
    .eq('id', recurringId)

  return txs
}
