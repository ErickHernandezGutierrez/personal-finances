import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { ChipSelect } from '@/components/forms/chip-select'
import { InputField } from '@/components/forms/input-field'
import { useTheme } from '@/contexts/theme-context'
import type { Account, MoneyExchange, MoneyExchangeInsert, MoneyExchangeUpdate } from '@/types/app'

const SENT_OPTIONS = [
  { label: 'Sent', value: 'sent' },
  { label: 'Pending', value: 'pending' },
]
const RECEIVED_OPTIONS = [
  { label: 'Received', value: 'received' },
  { label: 'Pending', value: 'pending' },
]

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type FormState = {
  description: string
  from_account_id: string
  to_account_id: string
  amount_sent: string
  currency_sent: string
  amount_received: string
  currency_received: string
  date_sent: string
  date_received: string
  is_sent: 'sent' | 'pending'
  is_received: 'received' | 'pending'
}

function initialState(accounts: Account[], exchange?: MoneyExchange | null): FormState {
  if (!exchange) {
    return {
      description: '',
      from_account_id: accounts[0]?.id ?? '',
      to_account_id: '',
      amount_sent: '',
      currency_sent: accounts[0]?.currency ?? 'COP',
      amount_received: '',
      currency_received: accounts[0]?.currency ?? 'COP',
      date_sent: todayString(),
      date_received: todayString(),
      is_sent: 'pending',
      is_received: 'pending',
    }
  }
  return {
    description: exchange.description ?? '',
    from_account_id: exchange.from_account_id,
    to_account_id: exchange.to_account_id,
    amount_sent: String(exchange.amount_sent),
    currency_sent: exchange.currency_sent,
    amount_received: String(exchange.amount_received),
    currency_received: exchange.currency_received,
    date_sent: exchange.date_sent,
    date_received: exchange.date_received,
    is_sent: exchange.is_sent ? 'sent' : 'pending',
    is_received: exchange.is_received ? 'received' : 'pending',
  }
}

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!state.description.trim()) errors.description = 'Description is required.'
  if (!state.from_account_id) errors.from_account_id = 'Source account is required.'
  if (!state.to_account_id) errors.to_account_id = 'Destination account is required.'
  else if (state.to_account_id === state.from_account_id) errors.to_account_id = 'Must differ from the source account.'
  if (!state.amount_sent || Number.isNaN(Number(state.amount_sent)) || Number(state.amount_sent) <= 0) {
    errors.amount_sent = 'Must be a number greater than 0.'
  }
  if (!state.currency_sent.trim()) errors.currency_sent = 'Currency is required.'
  if (!state.amount_received || Number.isNaN(Number(state.amount_received)) || Number(state.amount_received) <= 0) {
    errors.amount_received = 'Must be a number greater than 0.'
  }
  if (!state.currency_received.trim()) errors.currency_received = 'Currency is required.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.date_sent)) errors.date_sent = 'Use format YYYY-MM-DD.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.date_received)) errors.date_received = 'Use format YYYY-MM-DD.'
  return errors
}

export type MoneyExchangeFormSubmitPayload =
  | { kind: 'money_exchange'; mode: 'create'; data: Omit<MoneyExchangeInsert, 'user_id' | 'fx_rate'> }
  | { kind: 'money_exchange'; mode: 'edit'; data: Omit<MoneyExchangeUpdate, 'fx_rate'> }

type MoneyExchangeFormProps = {
  mode: 'create' | 'edit'
  exchange?: MoneyExchange | null
  accounts: Account[]
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: MoneyExchangeFormSubmitPayload) => void
  onCancel: () => void
}

export function MoneyExchangeForm({
  mode,
  exchange,
  accounts,
  submitting,
  error,
  onSubmit,
  onCancel,
}: MoneyExchangeFormProps) {
  const { theme } = useTheme()
  const [state, setState] = useState<FormState>(() => initialState(accounts, exchange))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const validationErrors = validate(state)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const shared = {
      description: state.description.trim(),
      from_account_id: state.from_account_id,
      to_account_id: state.to_account_id,
      amount_sent: Number(state.amount_sent),
      currency_sent: state.currency_sent.trim(),
      amount_received: Number(state.amount_received),
      currency_received: state.currency_received.trim(),
      date_sent: state.date_sent,
      date_received: state.date_received,
      is_sent: state.is_sent === 'sent',
      is_received: state.is_received === 'received',
    }

    if (mode === 'create') {
      onSubmit({ kind: 'money_exchange', mode: 'create', data: shared })
    } else {
      onSubmit({ kind: 'money_exchange', mode: 'edit', data: shared })
    }
  }

  const fromAccountOptions = accounts.map((a) => ({ label: a.name, value: a.id }))
  const toAccountOptions = accounts
    .filter((a) => a.id !== state.from_account_id)
    .map((a) => ({ label: a.name, value: a.id }))

  return (
    <View style={styles.form}>
      <InputField
        label="Description"
        value={state.description}
        onChangeText={(v) => update('description', v)}
        error={errors.description}
        placeholder="e.g. USD to COP exchange"
      />

      {fromAccountOptions.length > 0 ? (
        <ChipSelect
          label="From account"
          options={fromAccountOptions}
          value={state.from_account_id}
          onChange={(v) => update('from_account_id', v)}
          error={errors.from_account_id}
        />
      ) : (
        <Text style={{ color: theme.icon }}>Create an account first.</Text>
      )}

      <ChipSelect
        label="To account"
        options={toAccountOptions}
        value={state.to_account_id}
        onChange={(v) => update('to_account_id', v)}
        error={errors.to_account_id}
      />

      <InputField
        label="Amount sent"
        value={state.amount_sent}
        onChangeText={(v) => update('amount_sent', v)}
        keyboardType="decimal-pad"
        error={errors.amount_sent}
      />

      <ChipSelect
        label="Currency sent"
        options={[{ label: 'COP', value: 'COP' }, { label: 'USD', value: 'USD' }, { label: 'MXN', value: 'MXN' }]}
        value={state.currency_sent}
        onChange={(v) => update('currency_sent', v)}
        error={errors.currency_sent}
        allowCustom
        customPlaceholder="ISO code, e.g. MXN"
      />

      <InputField
        label="Amount received"
        value={state.amount_received}
        onChangeText={(v) => update('amount_received', v)}
        keyboardType="decimal-pad"
        error={errors.amount_received}
      />

      <ChipSelect
        label="Currency received"
        options={[{ label: 'COP', value: 'COP' }, { label: 'USD', value: 'USD' }, { label: 'MXN', value: 'MXN' }]}
        value={state.currency_received}
        onChange={(v) => update('currency_received', v)}
        error={errors.currency_received}
        allowCustom
        customPlaceholder="ISO code, e.g. MXN"
      />

      <InputField
        label="Date sent"
        value={state.date_sent}
        onChangeText={(v) => update('date_sent', v)}
        error={errors.date_sent}
        placeholder="YYYY-MM-DD"
      />

      <InputField
        label="Date received"
        value={state.date_received}
        onChangeText={(v) => update('date_received', v)}
        error={errors.date_received}
        placeholder="YYYY-MM-DD"
      />

      <ChipSelect
        label="Sent status"
        options={SENT_OPTIONS}
        value={state.is_sent}
        onChange={(v) => update('is_sent', v as 'sent' | 'pending')}
      />

      <ChipSelect
        label="Received status"
        options={RECEIVED_OPTIONS}
        value={state.is_received}
        onChange={(v) => update('is_received', v as 'received' | 'pending')}
      />

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
          disabled={submitting || fromAccountOptions.length === 0}>
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
