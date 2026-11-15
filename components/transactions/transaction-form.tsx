import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChipSelect } from '@/components/forms/chip-select';
import { InputField } from '@/components/forms/input-field';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import type { Account, Category, Transaction, TransactionInsert, TransactionType, TransactionUpdate } from '@/types/app';

const TYPE_OPTIONS: { label: string; value: TransactionType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Credit Payment', value: 'credit_payment' },
  { label: 'Withdrawal', value: 'withdrawal' },
  { label: 'Investment', value: 'investment' },
]

const PAID_OPTIONS = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
]

const NEEDS_TO_ACCOUNT = new Set<TransactionType>(['transfer', 'credit_payment', 'investment', 'withdrawal'])
const NEEDS_CATEGORY = new Set<TransactionType>(['expense', 'income', 'withdrawal'])
const NONE_CATEGORY = '__none__'

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type FormState = {
  type: TransactionType
  description: string
  amount: string
  currency: string
  date: string
  is_paid: 'paid' | 'pending'
  account_id: string
  to_account_id: string
  category_id: string
}

function initialState(accounts: Account[], transaction?: Transaction | null): FormState {
  if (!transaction) {
    return {
      type: 'expense',
      description: '',
      amount: '',
      currency: accounts[0]?.currency ?? 'COP',
      date: todayString(),
      is_paid: 'paid',
      account_id: accounts[0]?.id ?? '',
      to_account_id: '',
      category_id: NONE_CATEGORY,
    }
  }
  return {
    type: transaction.type as TransactionType,
    description: transaction.description,
    amount: String(transaction.amount),
    currency: transaction.currency,
    date: transaction.date,
    is_paid: transaction.is_paid ? 'paid' : 'pending',
    account_id: transaction.account_id,
    to_account_id: transaction.to_account_id ?? '',
    category_id: transaction.category_id ?? NONE_CATEGORY,
  }
}

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!state.description.trim()) errors.description = 'Description is required.'
  if (!state.amount || Number.isNaN(Number(state.amount)) || Number(state.amount) <= 0) {
    errors.amount = 'Must be a number greater than 0.'
  }
  if (!state.currency.trim()) errors.currency = 'Currency is required.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.date)) errors.date = 'Use format YYYY-MM-DD.'
  if (!state.account_id) errors.account_id = 'Account is required.'
  if (NEEDS_TO_ACCOUNT.has(state.type)) {
    if (!state.to_account_id) errors.to_account_id = 'Destination account is required.'
    else if (state.to_account_id === state.account_id) errors.to_account_id = 'Must differ from the account.'
  }
  return errors
}

export type TransactionFormSubmitPayload =
  | { kind: 'transaction'; mode: 'create'; data: Omit<TransactionInsert, 'user_id'> }
  | { kind: 'transaction'; mode: 'edit'; data: TransactionUpdate }

type TransactionFormProps = {
  mode: 'create' | 'edit'
  transaction?: Transaction | null
  accounts: Account[]
  categories: Category[]
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: TransactionFormSubmitPayload) => void
  onCancel: () => void
}

export function TransactionForm({
  mode,
  transaction,
  accounts,
  categories,
  submitting,
  error,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const { theme } = useTheme()
  const [state, setState] = useState<FormState>(() => initialState(accounts, transaction))
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
      date: state.date,
      is_paid: state.is_paid === 'paid',
      account_id: state.account_id,
      to_account_id: NEEDS_TO_ACCOUNT.has(state.type) ? state.to_account_id : null,
      category_id:
        NEEDS_CATEGORY.has(state.type) && state.category_id !== NONE_CATEGORY ? state.category_id : null,
    }

    if (mode === 'create') {
      onSubmit({ kind: 'transaction', mode: 'create', data: shared })
    } else {
      onSubmit({ kind: 'transaction', mode: 'edit', data: shared })
    }
  }

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
        placeholder="e.g. Groceries at the market"
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

      <InputField
        label="Date"
        value={state.date}
        onChangeText={(v) => update('date', v)}
        error={errors.date}
        placeholder="YYYY-MM-DD"
      />

      <ChipSelect
        label="Status"
        options={PAID_OPTIONS}
        value={state.is_paid}
        onChange={(v) => update('is_paid', v as 'paid' | 'pending')}
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button 
          variant="tertiary"
          size="medium"
          title="Cancel"
          onPress={onCancel}
          disabled={submitting}
        />
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
  button: { flex: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { borderWidth: 1 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
