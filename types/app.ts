import type { Tables, TablesInsert, TablesUpdate } from './database'

// ── Row types (what you read from Supabase) ──────────────────────────────────
export type Account = Tables<'accounts'>
export type Category = Tables<'categories'>
export type Transaction = Tables<'transactions'>
export type RecurringTransaction = Tables<'recurring_transactions'>
export type InstallmentPlan = Tables<'installment_plans'>
export type MoneyExchange = Tables<'money_exchanges'>

// ── Insert types (what you send on create) ───────────────────────────────────
export type AccountInsert = TablesInsert<'accounts'>
export type CategoryInsert = TablesInsert<'categories'>
export type TransactionInsert = TablesInsert<'transactions'>
export type RecurringTransactionInsert = TablesInsert<'recurring_transactions'>
export type InstallmentPlanInsert = TablesInsert<'installment_plans'>
export type MoneyExchangeInsert = TablesInsert<'money_exchanges'>

// ── Update types (all fields optional) ───────────────────────────────────────
export type AccountUpdate = TablesUpdate<'accounts'>
export type CategoryUpdate = TablesUpdate<'categories'>
export type TransactionUpdate = TablesUpdate<'transactions'>
export type RecurringTransactionUpdate = TablesUpdate<'recurring_transactions'>
export type InstallmentPlanUpdate = TablesUpdate<'installment_plans'>
export type MoneyExchangeUpdate = TablesUpdate<'money_exchanges'>

// ── String literal unions (mirror DB check constraints) ──────────────────────
export type AccountType =
  | 'checking'
  | 'savings'
  | 'investment'
  | 'cash'
  | 'credit_card'

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'credit_payment'
  | 'withdrawal'
  | 'investment'

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'
