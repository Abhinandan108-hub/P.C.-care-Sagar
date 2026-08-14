import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  FolderTree,
  Tag,
  MessageSquareText,
  Clock,
  PlusCircle,
  ImageOff,
  Mail,
} from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { adminClient } from "../lib/adminClient";
import { getLatestEnquiries } from "../services/enquiryService";
import type { DashboardStats } from "../types";
import type { Product } from "../types/product";
import type { Enquiry } from "../types/enquiry";

const initialStats: DashboardStats = {
  totalProducts: 0,
  totalCategories: 0,
  totalBrands: 0,
  pendingEnquiries: 0,
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loadingStats, setLoadingStats] = useState(true);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [latestEnquiries, setLatestEnquiries] = useState<Enquiry[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const adminName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : "Admin");

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      setLoadingStats(true);

      const [products, categories, brands, enquiries] = await Promise.all([
        adminClient.from("products").select("*", { count: "exact", head: true }),
        adminClient.from("categories").select("*", { count: "exact", head: true }),
        adminClient.from("brands").select("*", { count: "exact", head: true }),
        adminClient
          .from("enquiries")
          .select("*", { count: "exact", head: true })
          .eq("status", "new"),
      ]);

      if (!mounted) return;

      setStats({
        totalProducts: products.count ?? 0,
        totalCategories: categories.count ?? 0,
        totalBrands: brands.count ?? 0,
        pendingEnquiries: enquiries.count ?? 0,
      });
      setLoadingStats(false);
    }

    async function loadLists() {
      setLoadingLists(true);
      const [productsRes, enquiries] = await Promise.all([
        adminClient
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        getLatestEnquiries(5),
      ]);

      if (!mounted) return;
      setLatestProducts((productsRes.data ?? []) as Product[]);
      setLatestEnquiries(enquiries);
      setLoadingLists(false);
    }

    loadStats();
    loadLists();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Welcome back, {adminName} 👋</h1>
          <p>Here's what's happening with your store today.</p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => navigate("/admin/products/add")}
        >
          <PlusCircle size={16} />
          Add Product
        </button>
      </div>

      <div className="admin-grid-cards">
        <DashboardCard
          label="Total Products"
          value={loadingStats ? "—" : stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <DashboardCard
          label="Categories"
          value={loadingStats ? "—" : stats.totalCategories}
          icon={FolderTree}
          color="teal"
        />
        <DashboardCard
          label="Brands"
          value={loadingStats ? "—" : stats.totalBrands}
          icon={Tag}
          color="green"
        />
        <DashboardCard
          label="New Enquiries"
          value={loadingStats ? "—" : stats.pendingEnquiries}
          icon={MessageSquareText}
          color="amber"
        />
      </div>

      <div className="admin-panels">
        <div className="admin-block">
          <div className="admin-block__head">
            <h3>Latest Products</h3>
            <a href="/admin/products">View all</a>
          </div>
          {loadingLists ? (
            <LoadingSpinner label="Loading products…" />
          ) : latestProducts.length === 0 ? (
            <div className="admin-empty-state">
              <Package />
              <h4>No products yet</h4>
              <p>Products you add will show up here.</p>
            </div>
          ) : (
            <div className="admin-list">
              {latestProducts.map((product) => (
                <a
                  key={product.id}
                  className="admin-list__item"
                  href={`/admin/products/edit/${product.id}`}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        objectFit: "cover",
                        border: "1px solid var(--a-border)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <span className="admin-table__thumb-fallback" style={{ width: 36, height: 36 }}>
                      <ImageOff size={14} />
                    </span>
                  )}
                  <div>
                    <div className="admin-list__title">{product.name}</div>
                    <div className="admin-list__meta">
                      {product.brand} · {product.category}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="admin-block">
          <div className="admin-block__head">
            <h3>Latest Enquiries</h3>
            <a href="/admin/enquiries">View all</a>
          </div>
          {loadingLists ? (
            <LoadingSpinner label="Loading enquiries…" />
          ) : latestEnquiries.length === 0 ? (
            <div className="admin-empty-state">
              <MessageSquareText />
              <h4>No enquiries yet</h4>
              <p>Customer enquiries submitted from the website will appear here.</p>
            </div>
          ) : (
            <div className="admin-list">
              {latestEnquiries.map((enquiry) => (
                <a key={enquiry.id} className="admin-list__item" href="/admin/enquiries">
                  <span
                    className="admin-list__bullet"
                    style={{ background: enquiry.status === "new" ? "#2f5dff" : "#9095a1" }}
                  />
                  <div>
                    <div className="admin-list__title">
                      {enquiry.name}
                      {enquiry.status === "new" ? (
                        <Mail size={11} style={{ display: "inline", marginLeft: 6, verticalAlign: -1 }} />
                      ) : null}
                    </div>
                    <div className="admin-list__meta">
                      {enquiry.message.slice(0, 48)}
                      {enquiry.message.length > 48 ? "…" : ""} · {dateFormatter.format(new Date(enquiry.created_at))}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-panels" style={{ marginTop: 18 }}>
        <div className="admin-block">
          <div className="admin-block__head">
            <h3>Quick Actions</h3>
          </div>
          <div className="admin-list">
            <a className="admin-list__item" href="/admin/products">
              <span className="admin-list__bullet" style={{ background: "#2f5dff" }} />
              <div>
                <div className="admin-list__title">Manage Products</div>
                <div className="admin-list__meta">Add, edit or remove listings</div>
              </div>
            </a>
            <a className="admin-list__item" href="/admin/categories">
              <span className="admin-list__bullet" style={{ background: "#00c2a8" }} />
              <div>
                <div className="admin-list__title">Manage Categories</div>
                <div className="admin-list__meta">Organize your catalog</div>
              </div>
            </a>
            <a className="admin-list__item" href="/admin/brands">
              <span className="admin-list__bullet" style={{ background: "#16a34a" }} />
              <div>
                <div className="admin-list__title">Manage Brands</div>
                <div className="admin-list__meta">Keep brand listings current</div>
              </div>
            </a>
            <a className="admin-list__item" href="/admin/enquiries">
              <span className="admin-list__bullet" style={{ background: "#d97706" }} />
              <div>
                <div className="admin-list__title">
                  Review Enquiries
                  <Clock size={11} style={{ display: "inline", marginLeft: 6, verticalAlign: -1 }} />
                </div>
                <div className="admin-list__meta">Respond to customer questions</div>
              </div>
            </a>
            <a className="admin-list__item" href="/admin/website-settings">
              <span className="admin-list__bullet" style={{ background: "#7c3aed" }} />
              <div>
                <div className="admin-list__title">Website Settings</div>
                <div className="admin-list__meta">Update storefront content</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
