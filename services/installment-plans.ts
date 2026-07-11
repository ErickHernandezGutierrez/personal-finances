import { getUserId, supabase } from '@/lib/supabase'
import type { InstallmentPlan, InstallmentPlanInsert, TransactionInsert } from '@/types/app'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

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

  const start = new Date(plan.start_date)
  const rows: TransactionInsert[] = Array.from({ length: plan.num_installments }, (_, i) => ({
    type: 'expense' as const,
    amount: plan.installment_amount,
    currency: plan.currency,
    date: formatDate(addMonths(start, i)),
    description: `${plan.description} (${i + 1}/${plan.num_installments})`,
    is_paid: false,
    account_id: plan.account_id,
    category_id: plan.category_id ?? undefined,
    installment_plan_id: plan.id,
    installment_number: i + 1,
    user_id: userId,
  }))

  const { error: txError } = await supabase.from('transactions').insert(rows)
  if (txError) throw txError

  return plan
}

export async function deleteInstallmentPlan(id: string): Promise<void> {
  // FK cascade removes all linked transaction rows automatically
  const { error } = await supabase.from('installment_plans').delete().eq('id', id)
  if (error) throw error
}
