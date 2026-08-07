import { useCallback, useEffect, useState } from "react";
import { getBrands } from "../services/brandService";
import type { Brand, BrandFilters } from "../types/brand";

interface UseBrandsResult {
  brands: Brand[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBrands(filters: BrandFilters): UseBrandsResult {
  const [brands, setBrands] = useState<Brand[]>([]);
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
        const result = await getBrands(filters);
        if (!mounted) return;
        setBrands(result.brands);
        setTotalCount(result.totalCount);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Failed to load brands.";
        setError(message);
        setBrands([]);
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
  }, [filters.search, filters.status, filters.categoryId, filters.page, filters.pageSize, reloadToken]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  return { brands, totalCount, totalPages, loading, error, refetch };
}
