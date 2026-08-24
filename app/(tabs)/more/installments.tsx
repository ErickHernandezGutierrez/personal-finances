import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/confirm-modal';
import FloatingButton from '@/components/floating-button';
import {
  InstallmentPlanForm,
  type InstallmentPlanFormSubmitPayload,
} from '@/components/installment-plans/installment-plan-form';
import { InstallmentPlanCard } from '@/components/installment-plans/installment-plan-card';
import { AppModal } from '@/components/modal';
import { useTheme } from '@/contexts/theme-context';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useInstallmentPlans } from '@/hooks/use-installment-plans';
import type { InstallmentPlan } from '@/types/app';

export default function InstallmentPlansScreen() {
  const { theme } = useTheme();
  const { plans, loading, error, refetch, create, remove } = useInstallmentPlans();
  const { accounts, loading: accountsLoading, refetch: refetchAccounts } = useAccounts();
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchAccounts();
      refetchCategories();
    }, [refetch, refetchAccounts, refetchCategories]),
  );

  const creditCards = useMemo(() => accounts.filter((a) => a.type === 'credit_card'), [accounts]);
  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<InstallmentPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreateModal() {
    setFormError(null);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setFormError(null);
  }

  async function handleSubmit(payload: InstallmentPlanFormSubmitPayload) {
    setSubmitting(true);
    setFormError(null);
    try {
      await create(payload.data);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(plan: InstallmentPlan) {
    setDeletingPlan(plan);
  }

  async function confirmDelete() {
    if (!deletingPlan) return;
    setDeleting(true);
    try {
      await remove(deletingPlan.id);
      setDeletingPlan(null);
    } finally {
      setDeleting(false);
    }
  }

  const isLoading = loading || accountsLoading || categoriesLoading;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Installment Plans</Text>

      {isLoading ? (
        <ActivityIndicator color={theme.tint} style={styles.centered} />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <InstallmentPlanCard
              plan={item}
              account={accountsById.get(item.account_id)}
              category={item.category_id ? categoriesById.get(item.category_id) : undefined}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.icon }]}>No installment plans yet. Tap + to add one.</Text>
          }
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FloatingButton onPress={openCreateModal} />

      <AppModal visible={modalVisible} title="New Installment Plan" onClose={closeModal}>
        <InstallmentPlanForm
          creditCards={creditCards}
          categories={categories}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </AppModal>

      <ConfirmModal
        visible={!!deletingPlan}
        title="Delete installment plan"
        message={`Delete "${deletingPlan?.description}"? This removes all ${deletingPlan?.num_installments ?? ''} linked transactions and cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingPlan(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  centered: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: 32 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
