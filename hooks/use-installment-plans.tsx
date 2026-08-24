import { useCallback, useEffect, useState } from 'react';

import { createInstallmentPlan, deleteInstallmentPlan, listInstallmentPlans } from '@/services/installment-plans';
import type { InstallmentPlan, InstallmentPlanInsert } from '@/types/app';

export function useInstallmentPlans() {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listInstallmentPlans();
      setPlans(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load installment plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(data: Omit<InstallmentPlanInsert, 'user_id'>) {
    await createInstallmentPlan(data);
    await refetch();
  }

  async function remove(id: string) {
    await deleteInstallmentPlan(id);
    await refetch();
  }

  return { plans, loading, error, refetch, create, remove };
}
