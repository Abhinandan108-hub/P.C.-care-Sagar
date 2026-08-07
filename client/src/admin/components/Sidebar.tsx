import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  MessageSquareText,
  Globe,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/brands", label: "Brands", icon: Tag },
  { to: "/admin/enquiries", label: "Enquiries", icon: MessageSquareText },
  { to: "/admin/website-settings", label: "Website Settings", icon: Globe },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { signOut } = useAuth();

  return (
    <>
      {isOpen && <div className="admin-overlay" onClick={onClose} />}
      <aside className={`admin-sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-mark">PC</div>
          <div className="admin-sidebar__brand-text">
            P.C. Care Sagar
            <span>Admin Panel</span>
          </div>
          <button
            className="admin-topbar__menu-btn"
            style={{ display: isOpen ? "flex" : "none", marginLeft: "auto", color: "#fff" }}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav">
          <span className="admin-nav__label">Main Menu</span>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? "is-active" : ""}`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <button className="admin-nav__item" onClick={() => signOut()}>
            <LogOut />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
