import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/confirm-modal';
import FloatingButton from '@/components/floating-button';
import { SelectField, type SelectOption } from '@/components/forms/select-field';
import { AppModal } from '@/components/modal';
import { MoneyExchangeCard } from '@/components/money-exchanges/money-exchange-card';
import { MoneyExchangeForm, type MoneyExchangeFormSubmitPayload } from '@/components/money-exchanges/money-exchange-form';
import { MonthNav } from '@/components/transactions/month-nav';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { TransactionForm, type TransactionFormSubmitPayload } from '@/components/transactions/transaction-form';
import { useTheme } from '@/contexts/theme-context';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useMoneyExchanges } from '@/hooks/use-money-exchanges';
import { useTransactions } from '@/hooks/use-transactions';
import type { MoneyExchangeFilters } from '@/services/money-exchanges';
import type { TransactionFilters } from '@/services/transactions';
import type { MoneyExchange, Transaction } from '@/types/app';

const ALL_ACCOUNTS = '__all_accounts__';
const ALL_CATEGORIES = '__all_categories__';

type FeedItem =
  | { kind: 'transaction'; id: string; date: string; data: Transaction }
  | { kind: 'money_exchange'; id: string; date: string; data: MoneyExchange };

type EditingItem =
  | { kind: 'transaction'; data: Transaction }
  | { kind: 'money_exchange'; data: MoneyExchange }
  | null;

function monthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [accountFilter, setAccountFilter] = useState(ALL_ACCOUNTS);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);

  const { from, to } = useMemo(() => monthRange(year, month), [year, month]);
  const filters = useMemo<TransactionFilters>(
    () => ({
      from,
      to,
      accountId: accountFilter !== ALL_ACCOUNTS ? accountFilter : undefined,
      categoryId: categoryFilter !== ALL_CATEGORIES ? categoryFilter : undefined,
    }),
    [from, to, accountFilter, categoryFilter],
  );
  // Money exchanges have no category, so a category filter naturally excludes them from the feed.
  const exchangeFilters = useMemo<MoneyExchangeFilters>(
    () => ({
      from,
      to,
      accountId: accountFilter !== ALL_ACCOUNTS ? accountFilter : undefined,
    }),
    [from, to, accountFilter],
  );

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    create: createTransaction,
    update: updateTransaction,
    remove: removeTransaction,
  } = useTransactions(filters);
  const {
    exchanges,
    loading: exchangesLoading,
    error: exchangesError,
    refetch: refetchExchanges,
    create: createExchange,
    update: updateExchange,
    remove: removeExchange,
  } = useMoneyExchanges(exchangeFilters);
  const { accounts, loading: accountsLoading, refetch: refetchAccounts } = useAccounts();
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();

  // Accounts/categories may have changed on another tab (e.g. an account created or
  // renamed), and this screen's own data may be stale after switching away and back.
  useFocusEffect(
    useCallback(() => {
      refetchTransactions();
      refetchExchanges();
      refetchAccounts();
      refetchCategories();
    }, [refetchTransactions, refetchExchanges, refetchAccounts, refetchCategories]),
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<EditingItem>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const feed = useMemo<FeedItem[]>(() => {
    const txItems: FeedItem[] = transactions.map((t) => ({ kind: 'transaction', id: t.id, date: t.date, data: t }));
    const exItems: FeedItem[] =
      categoryFilter === ALL_CATEGORIES
        ? exchanges.map((e) => ({ kind: 'money_exchange', id: e.id, date: e.date_sent, data: e }))
        : [];
    return [...txItems, ...exItems].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, exchanges, categoryFilter]);

  const accountOptions = useMemo<SelectOption[]>(
    () => [{ label: 'All accounts', value: ALL_ACCOUNTS }, ...accounts.map((a) => ({ label: a.name, value: a.id }))],
    [accounts],
  );
  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { label: 'All categories', value: ALL_CATEGORIES },
      ...categories.map((c) => ({ label: c.name, value: c.id })),
    ],
    [categories],
  );

  function openCreateModal() {
    setEditingItem(null);
    setFormError(null);
    setModalVisible(true);
  }

  function openEditModal(item: FeedItem) {
    setEditingItem(item.kind === 'transaction' ? { kind: 'transaction', data: item.data } : { kind: 'money_exchange', data: item.data });
    setFormError(null);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingItem(null);
    setFormError(null);
  }

  async function handleSubmit(payload: TransactionFormSubmitPayload | MoneyExchangeFormSubmitPayload) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (payload.kind === 'transaction') {
        if (payload.mode === 'edit' && editingItem?.kind === 'transaction') {
          await updateTransaction(editingItem.data.id, payload.data);
        } else if (payload.mode === 'create') {
          await createTransaction(payload.data);
        }
      } else {
        if (payload.mode === 'edit' && editingItem?.kind === 'money_exchange') {
          await updateExchange(editingItem.data.id, payload.data);
        } else if (payload.mode === 'create') {
          await createExchange(payload.data);
        }
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(item: FeedItem) {
    setDeletingItem(item.kind === 'transaction' ? { kind: 'transaction', data: item.data } : { kind: 'money_exchange', data: item.data });
  }

  async function confirmDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      if (deletingItem.kind === 'transaction') {
        await removeTransaction(deletingItem.data.id);
      } else {
        await removeExchange(deletingItem.data.id);
      }
      setDeletingItem(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleTogglePaid(transaction: Transaction, isPaid: boolean) {
    setTogglingId(transaction.id);
    setToggleError(null);
    try {
      await updateTransaction(transaction.id, { is_paid: isPaid });
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Failed to update transaction.');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleToggleExchange(exchange: MoneyExchange, patch: { is_sent?: boolean; is_received?: boolean }) {
    setTogglingId(exchange.id);
    setToggleError(null);
    try {
      await updateExchange(exchange.id, patch);
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : 'Failed to update money exchange.');
    } finally {
      setTogglingId(null);
    }
  }

  const isLoading = transactionsLoading || exchangesLoading || accountsLoading || categoriesLoading;
  const listError = transactionsError ?? exchangesError;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>

      <View style={styles.filters}>
        <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <View style={styles.filterRow}>
          <SelectField label="Account" value={accountFilter} options={accountOptions} onChange={setAccountFilter} />
          <SelectField label="Category" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.tint} style={styles.centered} />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) =>
            item.kind === 'transaction' ? (
              <TransactionCard
                transaction={item.data}
                account={accountsById.get(item.data.account_id)}
                toAccount={item.data.to_account_id ? accountsById.get(item.data.to_account_id) : undefined}
                category={item.data.category_id ? categoriesById.get(item.data.category_id) : undefined}
                togglingPaid={togglingId === item.data.id}
                onPress={() => openEditModal(item)}
                onDelete={() => handleDelete(item)}
                onTogglePaid={(isPaid) => handleTogglePaid(item.data, isPaid)}
              />
            ) : (
              <MoneyExchangeCard
                exchange={item.data}
                fromAccount={accountsById.get(item.data.from_account_id)}
                toAccount={accountsById.get(item.data.to_account_id)}
                togglingId={togglingId === item.data.id}
                onPress={() => openEditModal(item)}
                onDelete={() => handleDelete(item)}
                onToggleSent={(isSent) => handleToggleExchange(item.data, { is_sent: isSent })}
                onToggleReceived={(isReceived) => handleToggleExchange(item.data, { is_received: isReceived })}
              />
            )
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.icon }]}>No transactions this month.</Text>
          }
        />
      )}

      {listError || toggleError ? <Text style={styles.errorText}>{listError ?? toggleError}</Text> : null}

      <FloatingButton onPress={openCreateModal} />

      <AppModal
        visible={modalVisible}
        title={editingItem ? (editingItem.kind === 'transaction' ? 'Edit Transaction' : 'Edit Money Exchange') : 'New Transaction'}
        onClose={closeModal}>
        {editingItem?.kind === 'money_exchange' ? (
          <MoneyExchangeForm
            mode="edit"
            exchange={editingItem.data}
            accounts={accounts}
            submitting={submitting}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        ) : (
          <TransactionForm
            mode={editingItem ? 'edit' : 'create'}
            transaction={editingItem?.data ?? null}
            accounts={accounts}
            categories={categories}
            submitting={submitting}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}
      </AppModal>

      <ConfirmModal
        visible={!!deletingItem}
        title={deletingItem?.kind === 'money_exchange' ? 'Delete money exchange' : 'Delete transaction'}
        message={
          deletingItem?.kind === 'money_exchange'
            ? `Delete "${deletingItem.data.description || 'Money exchange'}"? This cannot be undone.`
            : `Delete "${deletingItem?.data.description}"? This cannot be undone.`
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  filters: { paddingHorizontal: 24, paddingBottom: 12, gap: 12 },
  filterRow: { flexDirection: 'row', gap: 12 },
  centered: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: 32 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
