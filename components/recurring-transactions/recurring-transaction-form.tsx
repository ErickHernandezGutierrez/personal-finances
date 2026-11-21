import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { ChipSelect } from '@/components/forms/chip-select'
import { InputField } from '@/components/forms/input-field'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/theme-context'
import { MAX_OCCURRENCES, occurrenceCount } from '@/lib/recurrence'
import type {
  Account,
  Category,
  RecurringFrequency,
  RecurringTransaction,
  RecurringTransactionInsert,
  TransactionType,
} from '@/types/app'

const TYPE_OPTIONS: { label: string; value: TransactionType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Credit Payment', value: 'credit_payment' },
  { label: 'Withdrawal', value: 'withdrawal' },
  { label: 'Investment', value: 'investment' },
]

const FREQUENCY_OPTIONS: { label: string; value: RecurringFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Every 2 weeks', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const NEEDS_TO_ACCOUNT = new Set<TransactionType>(['transfer', 'credit_payment', 'investment', 'withdrawal'])
const NEEDS_CATEGORY = new Set<TransactionType>(['expense', 'income', 'withdrawal'])
const NONE_CATEGORY = '__none__'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type FormState = {
  type: TransactionType
  description: string
  amount: string
  currency: string
  frequency: RecurringFrequency
  start_date: string
  end_date: string
  account_id: string
  to_account_id: string
  category_id: string
}

function initialState(accounts: Account[], recurring?: RecurringTransaction | null): FormState {
  if (!recurring) {
    return {
      type: 'expense',
      description: '',
      amount: '',
      currency: accounts[0]?.currency ?? 'COP',
      frequency: 'monthly',
      start_date: todayString(),
      end_date: '',
      account_id: accounts[0]?.id ?? '',
      to_account_id: '',
      category_id: NONE_CATEGORY,
    }
  }
  return {
    type: recurring.type as TransactionType,
    description: recurring.description,
    amount: String(recurring.amount),
    currency: recurring.currency,
    frequency: recurring.frequency as RecurringFrequency,
    start_date: recurring.start_date,
    end_date: recurring.end_date,
    account_id: recurring.account_id,
    to_account_id: recurring.to_account_id ?? '',
    category_id: recurring.category_id ?? NONE_CATEGORY,
  }
}

/** Occurrences the current dates/frequency produce (capped just above MAX_OCCURRENCES). */
function countFor(state: FormState): number {
  return occurrenceCount(state.start_date, state.end_date, state.frequency)
}

/** Same as countFor, or null while the dates are incomplete or inverted. */
function previewCount(state: FormState): number | null {
  if (!DATE_RE.test(state.start_date) || !DATE_RE.test(state.end_date)) return null
  if (state.end_date < state.start_date) return null
  return countFor(state)
}

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!state.description.trim()) errors.description = 'Description is required.'
  if (!state.amount || Number.isNaN(Number(state.amount)) || Number(state.amount) <= 0) {
    errors.amount = 'Must be a number greater than 0.'
  }
  if (!state.currency.trim()) errors.currency = 'Currency is required.'
  if (!DATE_RE.test(state.start_date)) errors.start_date = 'Use format YYYY-MM-DD.'
  if (!state.end_date) errors.end_date = 'End date is required.'
  else if (!DATE_RE.test(state.end_date)) errors.end_date = 'Use format YYYY-MM-DD.'
  else if (state.end_date < state.start_date) errors.end_date = 'Must be on or after the start date.'
  else if (DATE_RE.test(state.start_date) && countFor(state) > MAX_OCCURRENCES) {
    errors.end_date = `Too many occurrences (max ${MAX_OCCURRENCES}). Choose an earlier end date.`
  }
  if (!state.account_id) errors.account_id = 'Account is required.'
  if (NEEDS_TO_ACCOUNT.has(state.type)) {
    if (!state.to_account_id) errors.to_account_id = 'Destination account is required.'
    else if (state.to_account_id === state.account_id) errors.to_account_id = 'Must differ from the account.'
  }
  return errors
}

type RecurringData = Omit<RecurringTransactionInsert, 'user_id'>

export type RecurringTransactionFormSubmitPayload =
  | { mode: 'create'; data: RecurringData }
  | { mode: 'edit'; data: Partial<RecurringData> }

type RecurringTransactionFormProps = {
  mode: 'create' | 'edit'
  recurring?: RecurringTransaction | null
  accounts: Account[]
  categories: Category[]
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: RecurringTransactionFormSubmitPayload) => void
  onCancel: () => void
}

export function RecurringTransactionForm({
  mode,
  recurring,
  accounts,
  categories,
  submitting,
  error,
  onSubmit,
  onCancel,
}: RecurringTransactionFormProps) {
  const { theme } = useTheme()
  const [state, setState] = useState<FormState>(() => initialState(accounts, recurring))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const validationErrors = validate(state)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const shared = {
      type: state.type,
      description: state.description.trim(),
      amount: Number(state.amount),
      currency: state.currency.trim(),
      frequency: state.frequency,
      start_date: state.start_date,
      end_date: state.end_date,
      account_id: state.account_id,
      to_account_id: NEEDS_TO_ACCOUNT.has(state.type) ? state.to_account_id : null,
      category_id:
        NEEDS_CATEGORY.has(state.type) && state.category_id !== NONE_CATEGORY ? state.category_id : null,
    }

    onSubmit(mode === 'create' ? { mode: 'create', data: shared } : { mode: 'edit', data: shared })
  }

  const count = previewCount(state)

  const accountOptions = accounts.map((a) => ({ label: a.name, value: a.id }))
  const toAccountOptions = accounts.filter((a) => a.id !== state.account_id).map((a) => ({ label: a.name, value: a.id }))
  const categoryOptions = [
    { label: 'None', value: NONE_CATEGORY },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ]

  return (
    <View style={styles.form}>
      <ChipSelect
        label="Type"
        options={TYPE_OPTIONS}
        value={state.type}
        onChange={(v) => update('type', v as TransactionType)}
      />

      <InputField
        label="Description"
        value={state.description}
        onChangeText={(v) => update('description', v)}
        error={errors.description}
        placeholder="e.g. Netflix subscription"
      />

      <InputField
        label="Amount"
        value={state.amount}
        onChangeText={(v) => update('amount', v)}
        keyboardType="decimal-pad"
        error={errors.amount}
      />

      <ChipSelect
        label="Currency"
        options={[{ label: 'COP', value: 'COP' }, { label: 'USD', value: 'USD' }, { label: 'MXN', value: 'MXN' }]}
        value={state.currency}
        onChange={(v) => update('currency', v)}
        error={errors.currency}
        allowCustom
        customPlaceholder="ISO code, e.g. MXN"
      />

      <ChipSelect
        label="Frequency"
        options={FREQUENCY_OPTIONS}
        value={state.frequency}
        onChange={(v) => update('frequency', v as RecurringFrequency)}
      />

      <InputField
        label="Start date"
        value={state.start_date}
        onChangeText={(v) => update('start_date', v)}
        error={errors.start_date}
        placeholder="YYYY-MM-DD"
      />

      <InputField
        label="End date"
        value={state.end_date}
        onChangeText={(v) => update('end_date', v)}
        error={errors.end_date}
        placeholder="YYYY-MM-DD"
      />

      {accountOptions.length > 0 ? (
        <ChipSelect
          label="Account"
          options={accountOptions}
          value={state.account_id}
          onChange={(v) => update('account_id', v)}
          error={errors.account_id}
        />
      ) : (
        <Text style={{ color: theme.icon }}>Create an account first.</Text>
      )}

      {NEEDS_TO_ACCOUNT.has(state.type) && (
        <ChipSelect
          label="To account"
          options={toAccountOptions}
          value={state.to_account_id}
          onChange={(v) => update('to_account_id', v)}
          error={errors.to_account_id}
        />
      )}

      {NEEDS_CATEGORY.has(state.type) && (
        <ChipSelect
          label="Category"
          options={categoryOptions}
          value={state.category_id}
          onChange={(v) => update('category_id', v)}
        />
      )}

      <Text style={{ color: theme.icon, fontSize: 12 }}>
        {count !== null && count <= MAX_OCCURRENCES
          ? `${mode === 'create' ? 'Creates' : 'Schedule has'} ${count} transaction${count === 1 ? '' : 's'}. `
          : ''}
        Transactions are created as pending and don&apos;t affect balances until marked paid. Edits apply to
        pending transactions only; paid ones are never changed.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button variant="tertiary" size="medium" title="Cancel" onPress={onCancel} disabled={submitting} />
        <Button
          variant="primary"
          size="medium"
          title={mode === 'create' ? 'Create' : 'Save'}
          onPress={handleSubmit}
          disabled={submitting || accountOptions.length === 0}
          loading={submitting}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8, alignSelf: 'flex-end' },
})
