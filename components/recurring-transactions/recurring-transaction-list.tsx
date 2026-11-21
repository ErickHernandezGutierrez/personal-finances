import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components/confirm-modal';
import FloatingButton from '@/components/floating-button';
import { AppModal } from '@/components/modal';
import { RecurringTransactionCard } from '@/components/recurring-transactions/recurring-transaction-card';
import {
  RecurringTransactionForm,
  type RecurringTransactionFormSubmitPayload,
} from '@/components/recurring-transactions/recurring-transaction-form';
import { useTheme } from '@/contexts/theme-context';
import { useRecurringTransactions } from '@/hooks/use-recurring-transactions';
import type { Account, Category, RecurringTransaction } from '@/types/app';

export type RecurringTransactionFilters = {
  accountId?: string;
  categoryId?: string;
};

type RecurringTransactionListProps = {
  filters: RecurringTransactionFilters;
  accounts: Account[];
  categories: Category[];
  search: string;
};

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isEnded(r: RecurringTransaction, today: string) {
  return r.end_date < today;
}

/** `null` = closed; `{ recurring: null }` = creating a new template. */
type EditorState = { recurring: RecurringTransaction | null } | null;

type Notice = { kind: 'info' | 'error'; text: string };

export function RecurringTransactionList({ filters, accounts, categories, search }: RecurringTransactionListProps) {
  const { theme } = useTheme();
  const { recurring, loading, error, refetch, create, update, remove } = useRecurringTransactions();

  const [editor, setEditor] = useState<EditorState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<RecurringTransaction | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Data may be stale after switching away to another tab and back.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const { accountId, categoryId } = filters;
  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      recurring.filter(
        (r) =>
          (!accountId || r.account_id === accountId || r.to_account_id === accountId) &&
          (!categoryId || r.category_id === categoryId) &&
          (!query || r.description.toLowerCase().includes(query) || String(r.amount).includes(query)),
      ),
    [recurring, accountId, categoryId, query],
  );

  const today = todayString();

  function openEditor(item: RecurringTransaction | null) {
    setFormError(null);
    setEditor({ recurring: item });
  }

  function closeEditor() {
    setEditor(null);
    setFormError(null);
  }

  async function handleSubmit(payload: RecurringTransactionFormSubmitPayload) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (payload.mode === 'edit' && editor?.recurring) {
        await update(editor.recurring.id, payload.data);
      } else if (payload.mode === 'create') {
        await create(payload.data);
      }
      closeEditor();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await remove(deleting.id);
      setDeleting(null);
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to delete recurring transaction.' });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  const editing = editor?.recurring ?? null;

  return (
    <>
      {notice ? (
        <View style={styles.toolbar}>
          <Text
            style={[styles.notice, { color: notice.kind === 'error' ? '#ef4444' : theme.icon }]}
            numberOfLines={2}>
            {notice.text}
          </Text>
        </View>
      ) : null}

      {loading && recurring.length === 0 ? (
        <ActivityIndicator color={theme.tint} style={styles.loading} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <RecurringTransactionCard
              recurring={item}
              account={accountsById.get(item.account_id)}
              toAccount={item.to_account_id ? accountsById.get(item.to_account_id) : undefined}
              category={item.category_id ? categoriesById.get(item.category_id) : undefined}
              isEnded={isEnded(item, today)}
              onPress={() => openEditor(item)}
              onDelete={() => setDeleting(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.icon }]}>
              {query || accountId || categoryId
                ? 'No recurring transactions match your filters.'
                : 'No recurring transactions yet. Tap + to add one.'}
            </Text>
          }
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FloatingButton onPress={() => openEditor(null)} />

      <AppModal
        visible={!!editor}
        title={editing ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
        onClose={closeEditor}>
        <RecurringTransactionForm
          key={editing?.id ?? 'new'}
          mode={editing ? 'edit' : 'create'}
          recurring={editing}
          accounts={accounts}
          categories={categories}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeEditor}
        />
      </AppModal>

      <ConfirmModal
        visible={!!deleting}
        title="Delete recurring transaction"
        message={`Delete "${deleting?.description}"? Its pending transactions will be deleted; paid ones are kept. This cannot be undone.`}
        confirmLabel={deleteBusy ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  notice: { flex: 1, fontSize: 14 },
  loading: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: 32 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
