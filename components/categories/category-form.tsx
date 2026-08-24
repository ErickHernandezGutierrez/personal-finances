import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { InputField } from '@/components/forms/input-field'
import { useTheme } from '@/contexts/theme-context'
import type { Category } from '@/types/app'

export type CategoryFormSubmitPayload =
  | { mode: 'create'; name: string }
  | { mode: 'edit'; name: string }

type CategoryFormProps = {
  mode: 'create' | 'edit'
  category?: Category | null
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: CategoryFormSubmitPayload) => void
  onCancel: () => void
}

export function CategoryForm({ mode, category, submitting, error, onSubmit, onCancel }: CategoryFormProps) {
  const { theme } = useTheme()
  const [name, setName] = useState(category?.name ?? '')
  const [nameError, setNameError] = useState<string | null>(null)

  function handleSubmit() {
    if (!name.trim()) {
      setNameError('Name is required.')
      return
    }
    setNameError(null)
    onSubmit({ mode, name: name.trim() })
  }

  return (
    <View style={styles.form}>
      <InputField
        label="Name"
        value={name}
        onChangeText={setName}
        error={nameError ?? undefined}
        placeholder="e.g. Groceries"
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
