import { adminClient } from "../lib/adminClient";
import type { Enquiry, EnquiryFilters } from "../types/enquiry";

const TABLE = "enquiries";

export interface GetEnquiriesResult {
  enquiries: Enquiry[];
  totalCount: number;
}

export async function getEnquiries(filters: EnquiryFilters): Promise<GetEnquiriesResult> {
  let query = adminClient.from(TABLE).select("*", { count: "exact" });

  if (filters.search.trim()) {
    const term = filters.search.trim().replace(/,/g, " ");
    query = query.or(
      `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,message.ilike.%${term}%`
    );
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  }

  query = query.order("created_at", { ascending: false });

  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    enquiries: (data ?? []) as Enquiry[],
    totalCount: count ?? 0,
  };
}

/** Fetch every enquiry matching the current filters (ignores pagination) — used for CSV export. */
export async function getAllEnquiriesForExport(
  filters: Omit<EnquiryFilters, "page" | "pageSize">
): Promise<Enquiry[]> {
  let query = adminClient.from(TABLE).select("*");

  if (filters.search.trim()) {
    const term = filters.search.trim().replace(/,/g, " ");
    query = query.or(
      `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,message.ilike.%${term}%`
    );
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }

  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Enquiry[];
}

export async function markEnquiryAsRead(id: string): Promise<void> {
  const { error } = await adminClient.from(TABLE).update({ status: "read" }).eq("id", id);
  if (error) throw error;
}

export async function deleteEnquiry(id: string): Promise<void> {
  const { error } = await adminClient.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function getLatestEnquiries(limit = 5): Promise<Enquiry[]> {
  const { data, error } = await adminClient
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as Enquiry[];
}
