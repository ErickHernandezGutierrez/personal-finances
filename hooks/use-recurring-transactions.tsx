import { useCallback, useEffect, useState } from 'react';

import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  listRecurringTransactions,
  updateRecurringTransaction,
} from '@/services/recurring-transactions';
import type { RecurringTransaction, RecurringTransactionInsert } from '@/types/app';

type RecurringData = Omit<RecurringTransactionInsert, 'user_id'>;

export function useRecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listRecurringTransactions();
      setRecurring(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(data: RecurringData) {
    await createRecurringTransaction(data);
    await refetch();
  }

  async function update(id: string, data: Partial<RecurringData>) {
    await updateRecurringTransaction(id, data);
    await refetch();
  }

  async function remove(id: string) {
    await deleteRecurringTransaction(id);
    await refetch();
  }

  return { recurring, loading, error, refetch, create, update, remove };
}
