import { useCallback, useEffect, useState } from "react";
import { getCategories } from "../services/categoryService";
import type { Category, CategoryFilters } from "../types/category";

interface UseCategoriesResult {
  categories: Category[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCategories(filters: CategoryFilters): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getCategories(filters);
        if (!mounted) return;
        setCategories(result.categories);
        setTotalCount(result.totalCount);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Failed to load categories.";
        setError(message);
        setCategories([]);
        setTotalCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.page, filters.pageSize, reloadToken]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  return { categories, totalCount, totalPages, loading, error, refetch };
}
