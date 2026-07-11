import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountCard } from '@/components/accounts/account-card';
import { AccountForm, type AccountFormSubmitPayload } from '@/components/accounts/account-form';
import FloatingButton from '@/components/floating-button';
import { AppModal } from '@/components/modal';
import { useTheme } from '@/contexts/theme-context';
import { useAccounts } from '@/hooks/use-accounts';
import type { Account } from '@/types/app';

export default function AccountsScreen() {
  const { theme } = useTheme();
  const { accounts, archivedAccounts, loading, error, create, update, deactivate, reactivate } = useAccounts();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  function openCreateModal() {
    setEditingAccount(null);
    setFormError(null);
    setModalVisible(true);
  }

  function openEditModal(account: Account) {
    setEditingAccount(account);
    setFormError(null);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingAccount(null);
    setFormError(null);
  }

  async function handleSubmit(payload: AccountFormSubmitPayload) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (payload.mode === 'edit' && editingAccount) {
        await update(editingAccount.id, payload.data);
      } else if (payload.mode === 'create') {
        await create(payload.data);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeactivate(account: Account) {
    Alert.alert(
      'Archive account',
      `Archive "${account.name}"? You can restore it later from the archived list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', style: 'destructive', onPress: () => deactivate(account.id) },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Accounts</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AccountCard
              account={item}
              onPress={() => openEditModal(item)}
              onDeactivate={() => handleDeactivate(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.icon }]}>No accounts yet. Tap + to add one.</Text>
          }
          ListFooterComponent={
            archivedAccounts.length > 0 ? (
              <View style={styles.archivedSection}>
                <Pressable onPress={() => setShowArchived((v) => !v)}>
                  <Text style={{ color: theme.icon }}>
                    {showArchived ? '▾' : '▸'} Archived ({archivedAccounts.length})
                  </Text>
                </Pressable>
                {showArchived &&
                  archivedAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      archived
                      onPress={() => openEditModal(account)}
                      onReactivate={() => reactivate(account.id)}
                    />
                  ))}
              </View>
            ) : null
          }
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FloatingButton onPress={openCreateModal} />

      <AppModal visible={modalVisible} title={editingAccount ? 'Edit Account' : 'New Account'} onClose={closeModal}>
        <AccountForm
          mode={editingAccount ? 'edit' : 'create'}
          account={editingAccount}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 24, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: 32 },
  archivedSection: { marginTop: 16, gap: 12 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
