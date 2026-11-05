import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { Backdrop } from '@/components/ui/backdrop';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import Modal from 'react-native-modal';

type AppModalProps = {
  visible: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
};

export function AppModal({ visible, title, onClose, children }: AppModalProps) {
  const { theme } = useTheme();

  return (
    <Modal 
      isVisible={visible} 
      style={styles.modal}
      customBackdrop={<Backdrop />}
    >
      <View style={[styles.content, { backgroundColor: theme.tertiaryBackground }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Button 
            variant='tertiary'
            size='small'
            title='Close'
            onPress={onClose}
            leadingIconName='xmark'
          />
        </View>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 24,
    alignItems: 'center', 
    marginBottom: 8, 
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 24 },
});
