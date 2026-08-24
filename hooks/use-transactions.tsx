import { useCallback, useEffect, useState } from 'react';

import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '@/services/transactions';
import type { TransactionFilters } from '@/services/transactions';
import type { Transaction, TransactionInsert, TransactionUpdate } from '@/types/app';

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listTransactions(filters);
      setTransactions(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(data: Omit<TransactionInsert, 'user_id'>) {
    await createTransaction(data);
    await refetch();
  }

  async function update(id: string, data: TransactionUpdate) {
    await updateTransaction(id, data);
    await refetch();
  }

  async function remove(id: string) {
    await deleteTransaction(id);
    await refetch();
  }

  return { transactions, loading, error, refetch, create, update, remove };
}
