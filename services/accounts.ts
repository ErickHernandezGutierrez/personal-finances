import { getUserId, supabase } from '@/lib/supabase'
import type { Account, AccountInsert, AccountUpdate } from '@/types/app'

/**
 * Recomputes current_balance for an account from its initial_balance
 * plus all paid transactions and applied money exchanges.
 * Called automatically after any mutation that affects a balance.
 *
 * Credit cards use the same signed-balance formula as every other account:
 * negative = you owe that amount, positive = the card owes you (overpaid).
 */
export async function recalculateBalance(accountId: string): Promise<void> {
  const { data: account } = await supabase
    .from('accounts')
    .select('initial_balance')
    .eq('id', accountId)
    .single()

  if (!account) return

  const [{ data: txs }, { data: exchanges }] = await Promise.all([
    supabase
      .from('transactions')
      .select('type, amount, account_id, to_account_id')
      .eq('is_paid', true)
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`),
    supabase
      .from('money_exchanges')
      .select('amount_sent, amount_received, from_account_id, to_account_id, is_sent, is_received')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`),
  ])

  let balance = account.initial_balance

  for (const tx of txs ?? []) {
    if (tx.account_id === accountId) {
      if (tx.type === 'income') balance += tx.amount
      else balance -= tx.amount // expense, withdrawal, transfer, credit_payment, investment
    }
    if (tx.to_account_id === accountId) {
      if (tx.type === 'transfer' || tx.type === 'investment' || tx.type === 'withdrawal' || tx.type === 'credit_payment') {
        balance += tx.amount
      }
    }
  }

  for (const ex of exchanges ?? []) {
    if (ex.from_account_id === accountId && ex.is_sent) balance -= ex.amount_sent
    if (ex.to_account_id === accountId && ex.is_received) balance += ex.amount_received
  }

  await supabase
    .from('accounts')
    .update({ current_balance: balance })
    .eq('id', accountId)
}

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getAccount(id: string): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createAccount(
  data: Omit<AccountInsert, 'user_id'>,
): Promise<Account> {
  const userId = await getUserId()
  const { data: account, error } = await supabase
    .from('accounts')
    .insert({ ...data, user_id: userId, current_balance: data.initial_balance ?? 0 })
    .select()
    .single()
  if (error) throw error
  return account
}

export async function updateAccount(id: string, data: AccountUpdate): Promise<Account> {
  const { data: account, error } = await supabase
    .from('accounts')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  if (data.initial_balance !== undefined) {
    await recalculateBalance(id)
    return getAccount(id)
  }

  return account
}

export async function deactivateAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}
