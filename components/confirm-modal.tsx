import { Pressable, StyleSheet, Text, View } from 'react-native'

import { AppModal } from '@/components/modal'
import { useTheme } from '@/contexts/theme-context'

type ConfirmModalProps = {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { theme } = useTheme()

  return (
    <AppModal visible={visible} title={title} onClose={onCancel}>
      <View style={styles.body}>
        <Text style={{ color: theme.text }}>{message}</Text>
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.cancelButton, { borderColor: theme.border }]} onPress={onCancel}>
            <Text style={{ color: theme.text }}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: destructive ? '#ef4444' : theme.tint }]}
            onPress={onConfirm}>
            <Text style={styles.buttonText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  body: { gap: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  cancelButton: { borderWidth: 1 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
