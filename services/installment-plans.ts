import { occurrenceDate } from '@/lib/recurrence'
import { getUserId, supabase } from '@/lib/supabase'
import type { InstallmentPlan, InstallmentPlanInsert, TransactionInsert } from '@/types/app'
import { recalculateBalance } from './accounts'

export async function listInstallmentPlans(): Promise<InstallmentPlan[]> {
  const { data, error } = await supabase
    .from('installment_plans')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function getInstallmentPlan(id: string): Promise<InstallmentPlan> {
  const { data, error } = await supabase
    .from('installment_plans')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createInstallmentPlan(
  data: Omit<InstallmentPlanInsert, 'user_id'>,
): Promise<InstallmentPlan> {
  const userId = await getUserId()

  const { data: plan, error: planError } = await supabase
    .from('installment_plans')
    .insert({ ...data, user_id: userId })
    .select()
    .single()
  if (planError) throw planError

  const rows: TransactionInsert[] = Array.from({ length: plan.num_installments }, (_, i) => ({
    type: 'expense' as const,
    amount: plan.installment_amount,
    currency: plan.currency,
    // Computed from the start date with month-end clamping (Jan 31 → Feb 28 → Mar 31).
    date: occurrenceDate(plan.start_date, 'monthly', i + 1),
    description: `${plan.description} (${i + 1}/${plan.num_installments})`,
    is_paid: true,
    account_id: plan.account_id,
    category_id: plan.category_id ?? undefined,
    installment_plan_id: plan.id,
    installment_number: i + 1,
    user_id: userId,
  }))

  const { error: txError } = await supabase.from('transactions').insert(rows)
  if (txError) throw txError

  // Installments are created as paid, so they count toward the account balance.
  await recalculateBalance(plan.account_id)

  return plan
}

export async function deleteInstallmentPlan(id: string): Promise<void> {
  const { data: plan } = await supabase
    .from('installment_plans')
    .select('account_id')
    .eq('id', id)
    .single()

  // FK cascade removes all linked transaction rows automatically
  const { error } = await supabase.from('installment_plans').delete().eq('id', id)
  if (error) throw error

  // Cascaded rows may include paid installments, so the balance has to be recomputed.
  if (plan) await recalculateBalance(plan.account_id)
}
