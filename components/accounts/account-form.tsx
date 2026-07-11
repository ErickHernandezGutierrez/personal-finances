import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { ChipSelect } from '@/components/forms/chip-select'
import { ColorSwatchPicker } from '@/components/forms/color-swatch-picker'
import { InputField } from '@/components/forms/input-field'
import { useTheme } from '@/contexts/theme-context'
import type { Account, AccountInsert, AccountType, AccountUpdate } from '@/types/app'

const TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: 'Checking', value: 'checking' },
  { label: 'Savings', value: 'savings' },
  { label: 'Investment', value: 'investment' },
  { label: 'Cash', value: 'cash' },
  { label: 'Credit Card', value: 'credit_card' },
]

const CURRENCY_OPTIONS = [
  { label: 'COP', value: 'COP' },
  { label: 'USD', value: 'USD' },
  { label: 'MXN', value: 'MXN' },
]

const DEFAULT_COLOR = '#0a7ea4'

type FormState = {
  name: string
  type: AccountType
  currency: string
  initial_balance: string
  bank: string
  credit_limit: string
  billing_cycle_day: string
  payment_due_day: string
  color: string
}

function initialState(account?: Account | null): FormState {
  if (!account) {
    return {
      name: '',
      type: 'checking',
      currency: 'COP',
      initial_balance: '0',
      bank: '',
      credit_limit: '',
      billing_cycle_day: '',
      payment_due_day: '',
      color: DEFAULT_COLOR,
    }
  }
  return {
    name: account.name,
    type: account.type as AccountType,
    currency: account.currency,
    initial_balance: String(account.initial_balance),
    bank: account.bank ?? '',
    credit_limit: account.credit_limit != null ? String(account.credit_limit) : '',
    billing_cycle_day: account.billing_cycle_day != null ? String(account.billing_cycle_day) : '',
    payment_due_day: account.payment_due_day != null ? String(account.payment_due_day) : '',
    color: account.color,
  }
}

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!state.name.trim()) errors.name = 'Name is required.'
  if (!state.currency.trim()) errors.currency = 'Currency is required.'
  if (state.initial_balance && Number.isNaN(Number(state.initial_balance))) {
    errors.initial_balance = 'Must be a number.'
  }
  if (state.type === 'credit_card') {
    for (const field of ['billing_cycle_day', 'payment_due_day'] as const) {
      const raw = state[field]
      if (raw) {
        const n = Number(raw)
        if (!Number.isInteger(n) || n < 1 || n > 31) errors[field] = 'Must be a day between 1 and 31.'
      }
    }
    if (state.credit_limit && Number.isNaN(Number(state.credit_limit))) {
      errors.credit_limit = 'Must be a number.'
    }
  }
  return errors
}

export type AccountFormSubmitPayload =
  | { mode: 'create'; data: Omit<AccountInsert, 'user_id'> }
  | { mode: 'edit'; data: AccountUpdate }

type AccountFormProps = {
  mode: 'create' | 'edit'
  account?: Account | null
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: AccountFormSubmitPayload) => void
  onCancel: () => void
}

export function AccountForm({ mode, account, submitting, error, onSubmit, onCancel }: AccountFormProps) {
  const { theme } = useTheme()
  const [state, setState] = useState<FormState>(() => initialState(account))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const validationErrors = validate(state)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const isCreditCard = state.type === 'credit_card'
    const shared = {
      name: state.name.trim(),
      type: state.type,
      currency: state.currency.trim(),
      color: state.color,
      bank: isCreditCard ? state.bank.trim() || null : null,
      credit_limit: isCreditCard && state.credit_limit ? Number(state.credit_limit) : null,
      billing_cycle_day: isCreditCard && state.billing_cycle_day ? Number(state.billing_cycle_day) : null,
      payment_due_day: isCreditCard && state.payment_due_day ? Number(state.payment_due_day) : null,
    }

    if (mode === 'create') {
      onSubmit({
        mode: 'create',
        data: { ...shared, initial_balance: Number(state.initial_balance) || 0 },
      })
    } else {
      onSubmit({ mode: 'edit', data: shared })
    }
  }

  const isCreditCard = state.type === 'credit_card'

  return (
    <View style={styles.form}>
      <InputField
        label="Name"
        value={state.name}
        onChangeText={(v) => update('name', v)}
        error={errors.name}
        placeholder="e.g. Main Checking"
      />

      <ChipSelect
        label="Type"
        options={TYPE_OPTIONS}
        value={state.type}
        onChange={(v) => update('type', v as AccountType)}
      />

      <ChipSelect
        label="Currency"
        options={CURRENCY_OPTIONS}
        value={state.currency}
        onChange={(v) => update('currency', v)}
        error={errors.currency}
        allowCustom
        customPlaceholder="ISO code, e.g. MXN"
      />

      <InputField
        label="Initial balance"
        value={state.initial_balance}
        onChangeText={(v) => update('initial_balance', v)}
        keyboardType="decimal-pad"
        error={errors.initial_balance}
        editable={mode === 'create'}
      />
      {mode === 'edit' && (
        <Text style={{ color: theme.icon, fontSize: 12 }}>
          Balance is recalculated automatically from transactions.
        </Text>
      )}

      {isCreditCard && (
        <>
          <InputField label="Bank" value={state.bank} onChangeText={(v) => update('bank', v)} placeholder="Optional" />
          <InputField
            label="Credit limit"
            value={state.credit_limit}
            onChangeText={(v) => update('credit_limit', v)}
            keyboardType="decimal-pad"
            error={errors.credit_limit}
          />
          <InputField
            label="Billing cycle day"
            value={state.billing_cycle_day}
            onChangeText={(v) => update('billing_cycle_day', v)}
            keyboardType="number-pad"
            error={errors.billing_cycle_day}
            placeholder="1-31"
          />
          <InputField
            label="Payment due day"
            value={state.payment_due_day}
            onChangeText={(v) => update('payment_due_day', v)}
            keyboardType="number-pad"
            error={errors.payment_due_day}
            placeholder="1-31"
          />
        </>
      )}

      <ColorSwatchPicker label="Color" value={state.color} onChange={(v) => update('color', v)} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
          onPress={onCancel}
          disabled={submitting}>
          <Text style={{ color: theme.text }}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: theme.tint }, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === 'create' ? 'Create' : 'Save'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: { flex: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { borderWidth: 1 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
