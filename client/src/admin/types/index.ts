export interface AdminProfile {
  id: string;
  email: string | null;
  name: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  pendingEnquiries: number;
}
