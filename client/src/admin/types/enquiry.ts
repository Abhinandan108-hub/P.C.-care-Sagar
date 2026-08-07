export type EnquiryStatus = "new" | "read";

export interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  product_id: string | null;
  product_name: string | null;
  status: EnquiryStatus;
  created_at: string;
}

export interface EnquiryFilters {
  search: string;
  status: EnquiryStatus | "";
  dateFrom: string; // yyyy-mm-dd
  dateTo: string; // yyyy-mm-dd
  page: number;
  pageSize: number;
}

export const DEFAULT_ENQUIRY_FILTERS: EnquiryFilters = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 15,
};
