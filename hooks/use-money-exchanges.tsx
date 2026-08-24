import { useCallback, useEffect, useState } from 'react';

import {
  createMoneyExchange,
  deleteMoneyExchange,
  listMoneyExchanges,
  updateMoneyExchange,
} from '@/services/money-exchanges';
import type { MoneyExchangeFilters } from '@/services/money-exchanges';
import type { MoneyExchange, MoneyExchangeInsert, MoneyExchangeUpdate } from '@/types/app';

type ExchangeInsert = Omit<MoneyExchangeInsert, 'user_id' | 'fx_rate'>
type ExchangeUpdate = Omit<MoneyExchangeUpdate, 'fx_rate'>

export function useMoneyExchanges(filters?: MoneyExchangeFilters) {
  const [exchanges, setExchanges] = useState<MoneyExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listMoneyExchanges(filters);
      setExchanges(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load money exchanges.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(data: ExchangeInsert) {
    await createMoneyExchange(data);
    await refetch();
  }

  async function update(id: string, data: ExchangeUpdate) {
    await updateMoneyExchange(id, data);
    await refetch();
  }

  async function remove(id: string) {
    await deleteMoneyExchange(id);
    await refetch();
  }

  return { exchanges, loading, error, refetch, create, update, remove };
}
