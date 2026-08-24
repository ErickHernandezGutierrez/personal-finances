import { KeyboardAvoidingView, Platform, Pressable, Modal as RNModal, ScrollView, StyleSheet, Text, View } from 'react-native'

import { IconSymbol } from '@/components/ui/icon-symbol'
import { useTheme } from '@/contexts/theme-context'

type AppModalProps = {
  visible: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function AppModal({ visible, title, onClose, children }: AppModalProps) {
  const { theme } = useTheme()

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <IconSymbol name="xmark" size={22} color={theme.icon} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    justifyContent: 'flex-start', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '50%',
    padding: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 24 },
})
