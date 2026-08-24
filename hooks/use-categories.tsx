import { useCallback, useEffect, useState } from 'react';

import { createCategory, deleteCategory, listCategories, updateCategory } from '@/services/categories';
import type { Category } from '@/types/app';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listCategories();
      setCategories(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(name: string) {
    await createCategory(name);
    await refetch();
  }

  async function update(id: string, name: string) {
    await updateCategory(id, name);
    await refetch();
  }

  async function remove(id: string) {
    await deleteCategory(id);
    await refetch();
  }

  return { categories, loading, error, refetch, create, update, remove };
}
