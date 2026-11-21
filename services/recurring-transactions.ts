import { MAX_OCCURRENCES, occurrenceCount, occurrenceDate } from '@/lib/recurrence'
import { getUserId, supabase } from '@/lib/supabase'
import type {
  RecurringFrequency,
  RecurringTransaction,
  RecurringTransactionInsert,
  TransactionInsert,
  TransactionType,
  TransactionUpdate,
} from '@/types/app'

type RecurringData = Omit<RecurringTransactionInsert, 'user_id'>

/** Plan fields copied onto every generated transaction. */
const TEMPLATE_FIELDS = [
  'type',
  'amount',
  'currency',
  'description',
  'account_id',
  'to_account_id',
  'category_id',
] as const

/** Bounded concurrency for per-row date updates. */
const UPDATE_BATCH_SIZE = 20

function countOccurrences(plan: Pick<RecurringTransaction, 'start_date' | 'end_date' | 'frequency'>): number {
  const n = occurrenceCount(plan.start_date, plan.end_date, plan.frequency as RecurringFrequency)
  if (n > MAX_OCCURRENCES) {
    throw new Error(`A recurring transaction can have at most ${MAX_OCCURRENCES} occurrences.`)
  }
  return n
}

function buildRow(plan: RecurringTransaction, n: number, userId: string): TransactionInsert {
  return {
    type: plan.type as TransactionType,
    amount: plan.amount,
    currency: plan.currency,
    date: occurrenceDate(plan.start_date, plan.frequency as RecurringFrequency, n),
    description: plan.description,
    is_paid: false,
    account_id: plan.account_id,
    to_account_id: plan.to_account_id,
    category_id: plan.category_id,
    recurring_transaction_id: plan.id,
    occurrence_number: n,
    user_id: userId,
  }
}

export async function listRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .order('start_date', { ascending: false })
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

/** Creates the plan and one pending transaction per occurrence between start_date and end_date. */
export async function createRecurringTransaction(data: RecurringData): Promise<RecurringTransaction> {
  const total = countOccurrences(data)
  const userId = await getUserId()

  const { data: plan, error } = await supabase
    .from('recurring_transactions')
    .insert({ ...data, user_id: userId })
    .select()
    .single()
  if (error) throw error

  const rows = Array.from({ length: total }, (_, i) => buildRow(plan, i + 1, userId))
  const { error: txError } = await supabase.from('transactions').insert(rows)
  if (txError) {
    // Don't leave a plan without its transactions behind.
    await supabase.from('recurring_transactions').delete().eq('id', plan.id)
    throw txError
  }

  return plan
}

/**
 * Updates the plan and syncs its pending transactions:
 * - changed template fields are copied onto every pending transaction (only the changed ones,
 *   so per-transaction edits to other fields survive);
 * - a new start date or frequency re-dates every pending transaction;
 * - a shorter schedule deletes pending transactions past the end, a longer one creates the missing ones.
 * Paid transactions are never modified or deleted.
 */
export async function updateRecurringTransaction(
  id: string,
  data: Partial<RecurringData>,
): Promise<RecurringTransaction> {
  const before = await getRecurringTransaction(id)
  countOccurrences({ ...before, ...data })

  const { data: plan, error } = await supabase
    .from('recurring_transactions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  const patch: TransactionUpdate = {}
  for (const field of TEMPLATE_FIELDS) {
    if (plan[field] !== before[field]) Object.assign(patch, { [field]: plan[field] })
  }
  const redate = plan.start_date !== before.start_date || plan.frequency !== before.frequency

  await syncRecurringTransactions(plan, patch, redate)
  return plan
}

async function syncRecurringTransactions(
  plan: RecurringTransaction,
  patch: TransactionUpdate,
  redate: boolean,
): Promise<void> {
  const total = countOccurrences(plan)

  // Shrink: drop pending occurrences past the new end. Paid ones stay linked.
  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('recurring_transaction_id', plan.id)
    .eq('is_paid', false)
    .gt('occurrence_number', total)
  if (deleteError) throw deleteError

  // Propagate changed template fields to the remaining pending occurrences.
  if (Object.keys(patch).length > 0) {
    const { error: patchError } = await supabase
      .from('transactions')
      .update(patch)
      .eq('recurring_transaction_id', plan.id)
      .eq('is_paid', false)
    if (patchError) throw patchError
  }

  const { data: existing, error: listError } = await supabase
    .from('transactions')
    .select('id, occurrence_number, is_paid')
    .eq('recurring_transaction_id', plan.id)
  if (listError) throw listError

  // Re-date pending occurrences when the schedule itself changed.
  if (redate) {
    const pending = existing.filter((t) => !t.is_paid && t.occurrence_number !== null)
    for (let i = 0; i < pending.length; i += UPDATE_BATCH_SIZE) {
      const results = await Promise.all(
        pending.slice(i, i + UPDATE_BATCH_SIZE).map((t) =>
          supabase
            .from('transactions')
            .update({
              date: occurrenceDate(plan.start_date, plan.frequency as RecurringFrequency, t.occurrence_number!),
            })
            .eq('id', t.id),
        ),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
    }
  }

  // Extend: create every occurrence that has no transaction yet (paid or pending).
  const taken = new Set(existing.map((t) => t.occurrence_number))
  const missing = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !taken.has(n))
  if (missing.length > 0) {
    const userId = await getUserId()
    const { error: insertError } = await supabase
      .from('transactions')
      .insert(missing.map((n) => buildRow(plan, n, userId)))
    if (insertError) throw insertError
  }
}

/** Deletes the plan and its pending transactions. Paid transactions are kept (the FK unlinks them). */
export async function deleteRecurringTransaction(id: string): Promise<void> {
  const { error: txError } = await supabase
    .from('transactions')
    .delete()
    .eq('recurring_transaction_id', id)
    .eq('is_paid', false)
  if (txError) throw txError

  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
  if (error) throw error
}
