import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { ChipSelect } from '@/components/forms/chip-select'
import { InputField } from '@/components/forms/input-field'
import { useTheme } from '@/contexts/theme-context'
import type { Account, Category, InstallmentPlanInsert } from '@/types/app'

const NONE_CATEGORY = '__none__'

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type FormState = {
  description: string
  total_amount: string
  currency: string
  num_installments: string
  account_id: string
  category_id: string
  start_date: string
}

function initialState(creditCards: Account[]): FormState {
  return {
    description: '',
    total_amount: '',
    currency: creditCards[0]?.currency ?? 'COP',
    num_installments: '',
    account_id: creditCards[0]?.id ?? '',
    category_id: NONE_CATEGORY,
    start_date: todayString(),
  }
}

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!state.description.trim()) errors.description = 'Description is required.'
  if (!state.total_amount || Number.isNaN(Number(state.total_amount)) || Number(state.total_amount) <= 0) {
    errors.total_amount = 'Must be a number greater than 0.'
  }
  if (!state.currency.trim()) errors.currency = 'Currency is required.'
  const n = Number(state.num_installments)
  if (!state.num_installments || !Number.isInteger(n) || n <= 1) {
    errors.num_installments = 'Must be a whole number greater than 1.'
  }
  if (!state.account_id) errors.account_id = 'Credit card is required.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.start_date)) errors.start_date = 'Use format YYYY-MM-DD.'
  return errors
}

export type InstallmentPlanFormSubmitPayload = { data: Omit<InstallmentPlanInsert, 'user_id'> }

type InstallmentPlanFormProps = {
  creditCards: Account[]
  categories: Category[]
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: InstallmentPlanFormSubmitPayload) => void
  onCancel: () => void
}

export function InstallmentPlanForm({
  creditCards,
  categories,
  submitting,
  error,
  onSubmit,
  onCancel,
}: InstallmentPlanFormProps) {
  const { theme } = useTheme()
  const [state, setState] = useState<FormState>(() => initialState(creditCards))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const validationErrors = validate(state)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const totalAmount = Number(state.total_amount)
    const numInstallments = Number(state.num_installments)
    const installmentAmount = Math.round((totalAmount / numInstallments) * 100) / 100

    onSubmit({
      data: {
        description: state.description.trim(),
        total_amount: totalAmount,
        installment_amount: installmentAmount,
        currency: state.currency.trim(),
        num_installments: numInstallments,
        account_id: state.account_id,
        category_id: state.category_id !== NONE_CATEGORY ? state.category_id : null,
        start_date: state.start_date,
      },
    })
  }

  const accountOptions = creditCards.map((a) => ({ label: a.name, value: a.id }))
  const categoryOptions = [
    { label: 'None', value: NONE_CATEGORY },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ]

  return (
    <View style={styles.form}>
      <InputField
        label="Description"
        value={state.description}
        onChangeText={(v) => update('description', v)}
        error={errors.description}
        placeholder="e.g. iPhone 16"
      />

      <InputField
        label="Total amount"
        value={state.total_amount}
        onChangeText={(v) => update('total_amount', v)}
        keyboardType="decimal-pad"
        error={errors.total_amount}
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
        label="Number of installments"
        value={state.num_installments}
        onChangeText={(v) => update('num_installments', v)}
        keyboardType="number-pad"
        error={errors.num_installments}
        placeholder="e.g. 12"
      />

      {accountOptions.length > 0 ? (
        <ChipSelect
          label="Credit card"
          options={accountOptions}
          value={state.account_id}
          onChange={(v) => update('account_id', v)}
          error={errors.account_id}
        />
      ) : (
        <Text style={{ color: theme.icon }}>Create a credit card account first.</Text>
      )}

      <ChipSelect
        label="Category"
        options={categoryOptions}
        value={state.category_id}
        onChange={(v) => update('category_id', v)}
      />

      <InputField
        label="Start date"
        value={state.start_date}
        onChangeText={(v) => update('start_date', v)}
        error={errors.start_date}
        placeholder="YYYY-MM-DD"
      />

      <Text style={{ color: theme.icon, fontSize: 12 }}>
        Creates {state.num_installments || 'N'} monthly transaction rows on the selected credit card, one month apart
        starting on the start date.
      </Text>

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
          disabled={submitting || accountOptions.length === 0}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create</Text>}
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
