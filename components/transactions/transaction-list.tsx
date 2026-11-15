import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';

import { ConfirmModal } from '@/components/confirm-modal';
import FloatingButton from '@/components/floating-button';
import { TransactionCard } from '@/components/transactions/transaction-card';
import type { TransactionFormSubmitPayload } from '@/components/transactions/transaction-form';
import { EmptyTransactionList } from '@/components/transactions/transaction-list-empty';
import { TransactionListHeader } from '@/components/transactions/transaction-list-header';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import { useTheme } from '@/contexts/theme-context';
import { useTransactions } from '@/hooks/use-transactions';
import type { TransactionFilters } from '@/services/transactions';
import type { Account, Category, Transaction } from '@/types/app';

type TransactionListProps = {
  filters: TransactionFilters;
  accounts: Account[];
  categories: Category[];
  search: string;
};

/** `null` = closed; `{ transaction: null }` = creating a new transaction. */
type EditorState = { transaction: Transaction | null } | null;

export function TransactionList({ filters, accounts, categories, search }: TransactionListProps) {
  const { theme } = useTheme();
  const { transactions, loading, error, refetch, create, update, remove } = useTransactions(filters);

  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Data may be stale after switching away to another tab and back.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const query = search.trim().toLowerCase();
  const visibleTransactions = useMemo(() => {
    if (!query) return transactions;
    return transactions.filter(
      (t) => t.description.toLowerCase().includes(query) || String(t.amount).includes(query),
    );
  }, [transactions, query]);

  async function handleSubmit(payload: TransactionFormSubmitPayload) {
    if (payload.mode === 'edit' && editor?.transaction) {
      await update(editor.transaction.id, payload.data);
    } else if (payload.mode === 'create') {
      await create(payload.data);
    }
  }

  async function handleTogglePaid(transaction: Transaction, isPaid: boolean) {
    setTogglingId(transaction.id);
    setActionError(null);
    try {
      await update(transaction.id, { is_paid: isPaid });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update transaction.');
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError(null);
    try {
      await remove(deleting.id);
      setDeleting(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete transaction.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const listError = error ?? actionError;

  return (
    <>
      <TransactionListHeader />
      
      {loading ? (
        <ActivityIndicator color={theme.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={visibleTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              category={item.category_id ? categoriesById.get(item.category_id) : undefined}
              togglingPaid={togglingId === item.id}
              onPress={() => setEditor({ transaction: item })}
              onDelete={() => setDeleting(item)}
              onTogglePaid={(isPaid) => handleTogglePaid(item, isPaid)}
            />
          )}
          ListEmptyComponent={<EmptyTransactionList isSearching={!!query} />}
        />
      )}

      {listError ? <Text style={styles.errorText}>{listError}</Text> : null}

      <FloatingButton onPress={() => setEditor({ transaction: null })} />

      <TransactionModal
        visible={!!editor}
        transaction={editor?.transaction ?? null}
        accounts={accounts}
        categories={categories}
        onSubmit={handleSubmit}
        onClose={() => setEditor(null)}
      />

      <ConfirmModal
        visible={!!deleting}
        title="Delete transaction"
        message={`Delete "${deleting?.description}"? This cannot be undone.`}
        confirmLabel={deleteBusy ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 96, gap: 12 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
