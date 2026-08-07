import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const titleMap: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/products/add": "Add Product",
  "/admin/categories": "Categories",
  "/admin/brands": "Brands",
  "/admin/enquiries": "Enquiries",
  "/admin/website-settings": "Website Settings",
  "/admin/settings": "Settings",
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title =
    titleMap[location.pathname] ||
    (location.pathname.startsWith("/admin/products/edit")
      ? "Edit Product"
      : "Dashboard");

  return (
    <div className="admin-root admin-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div>
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
