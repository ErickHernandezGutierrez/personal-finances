import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';

import { ConfirmModal } from '@/components/confirm-modal';
import FloatingButton from '@/components/floating-button';
import { MoneyExchangeCard } from '@/components/money-exchanges/money-exchange-card';
import type { MoneyExchangeFormSubmitPayload } from '@/components/money-exchanges/money-exchange-form';
import { EmptyMoneyExchangeList } from '@/components/money-exchanges/money-exchange-list-empty';
import { MoneyExchangeModal } from '@/components/money-exchanges/money-exchange-modal';
import { useTheme } from '@/contexts/theme-context';
import { useMoneyExchanges } from '@/hooks/use-money-exchanges';
import type { MoneyExchangeFilters } from '@/services/money-exchanges';
import type { Account, MoneyExchange } from '@/types/app';

type MoneyExchangeListProps = {
  filters: MoneyExchangeFilters;
  accounts: Account[];
  search: string;
};

/** `null` = closed; `{ exchange: null }` = creating a new money exchange. */
type EditorState = { exchange: MoneyExchange | null } | null;

type StatusPatch = { is_sent?: boolean; is_received?: boolean };

export function MoneyExchangeList({ filters, accounts, search }: MoneyExchangeListProps) {
  const { theme } = useTheme();
  const { exchanges, loading, error, refetch, create, update, remove } = useMoneyExchanges(filters);

  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<MoneyExchange | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Data may be stale after switching away to another tab and back.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const query = search.trim().toLowerCase();
  const visibleExchanges = useMemo(() => {
    if (!query) return exchanges;
    return exchanges.filter(
      (e) =>
        (e.description ?? '').toLowerCase().includes(query) ||
        String(e.amount_sent).includes(query) ||
        String(e.amount_received).includes(query),
    );
  }, [exchanges, query]);

  async function handleSubmit(payload: MoneyExchangeFormSubmitPayload) {
    if (payload.mode === 'edit' && editor?.exchange) {
      await update(editor.exchange.id, payload.data);
    } else if (payload.mode === 'create') {
      await create(payload.data);
    }
  }

  async function handleToggle(exchange: MoneyExchange, patch: StatusPatch) {
    setTogglingId(exchange.id);
    setActionError(null);
    try {
      await update(exchange.id, patch);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update money exchange.');
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
      setActionError(err instanceof Error ? err.message : 'Failed to delete money exchange.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const listError = error ?? actionError;

  return (
    <>
      {loading ? (
        <ActivityIndicator color={theme.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={visibleExchanges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MoneyExchangeCard
              exchange={item}
              fromAccount={accountsById.get(item.from_account_id)}
              toAccount={accountsById.get(item.to_account_id)}
              togglingId={togglingId === item.id}
              onPress={() => setEditor({ exchange: item })}
              onDelete={() => setDeleting(item)}
              onToggleSent={(isSent) => handleToggle(item, { is_sent: isSent })}
              onToggleReceived={(isReceived) => handleToggle(item, { is_received: isReceived })}
            />
          )}
          ListEmptyComponent={<EmptyMoneyExchangeList isSearching={!!query} />}
        />
      )}

      {listError ? <Text style={styles.errorText}>{listError}</Text> : null}

      <FloatingButton onPress={() => setEditor({ exchange: null })} />

      <MoneyExchangeModal
        visible={!!editor}
        exchange={editor?.exchange ?? null}
        accounts={accounts}
        onSubmit={handleSubmit}
        onClose={() => setEditor(null)}
      />

      <ConfirmModal
        visible={!!deleting}
        title="Delete money exchange"
        message={`Delete "${deleting?.description || 'Money exchange'}"? This cannot be undone.`}
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
