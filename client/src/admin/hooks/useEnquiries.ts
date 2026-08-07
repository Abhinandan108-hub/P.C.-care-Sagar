import { useCallback, useEffect, useState } from "react";
import { getEnquiries } from "../services/enquiryService";
import type { Enquiry, EnquiryFilters } from "../types/enquiry";

interface UseEnquiriesResult {
  enquiries: Enquiry[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEnquiries(filters: EnquiryFilters): UseEnquiriesResult {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
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
        const result = await getEnquiries(filters);
        if (!mounted) return;
        setEnquiries(result.enquiries);
        setTotalCount(result.totalCount);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Failed to load enquiries.";
        setError(message);
        setEnquiries([]);
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
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.page,
    filters.pageSize,
    reloadToken,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  return { enquiries, totalCount, totalPages, loading, error, refetch };
}
