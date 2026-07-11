import { useCallback, useEffect, useState } from 'react';

import { createAccount, deactivateAccount, listAccounts, updateAccount } from '@/services/accounts';
import type { Account, AccountInsert, AccountUpdate } from '@/types/app';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [archivedAccounts, setArchivedAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listAccounts();
      setAccounts(all.filter((a) => a.is_active));
      setArchivedAccounts(all.filter((a) => !a.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(data: Omit<AccountInsert, 'user_id'>) {
    await createAccount(data);
    await refetch();
  }

  async function update(id: string, data: AccountUpdate) {
    await updateAccount(id, data);
    await refetch();
  }

  async function deactivate(id: string) {
    await deactivateAccount(id);
    await refetch();
  }

  async function reactivate(id: string) {
    await updateAccount(id, { is_active: true });
    await refetch();
  }

  return { accounts, archivedAccounts, loading, error, refetch, create, update, deactivate, reactivate };
}