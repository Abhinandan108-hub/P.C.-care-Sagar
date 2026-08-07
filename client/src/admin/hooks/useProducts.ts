import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import type { Product, ProductFilters } from "../types/product";

interface UseProductsResult {
  products: Product[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(filters: ProductFilters): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
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
        const result = await getProducts(filters);
        if (!mounted) return;
        setProducts(result.products);
        setTotalCount(result.totalCount);
      } catch (err) {
        if (!mounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load products.";
        setError(message);
        setProducts([]);
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
  }, [
    filters.search,
    filters.category,
    filters.brand,
    filters.featured,
    filters.latest,
    filters.sort,
    filters.page,
    filters.pageSize,
    reloadToken,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  return { products, totalCount, totalPages, loading, error, refetch };
}
