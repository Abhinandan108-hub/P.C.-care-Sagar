import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, Settings, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const adminName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : "Admin");
  const initials = adminName.slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        <button className="admin-topbar__menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <span className="admin-topbar__title">{title}</span>
      </div>

      <div className="admin-topbar__right">
        <div className="admin-profile" ref={notifRef}>
          <button
            className="admin-icon-btn"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="admin-icon-btn__dot" />
          </button>

          {notifOpen && (
            <div className="admin-panel">
              <div className="admin-panel__title">Notifications</div>
              <div className="admin-empty-state" style={{ padding: "26px 6px 6px" }}>
                <Bell />
                <h4>You're all caught up</h4>
                <p>New enquiries and order alerts will show up here.</p>
              </div>
            </div>
          )}
        </div>

        <div className="admin-profile" ref={profileRef}>
          <button className="admin-profile__trigger" onClick={() => setProfileOpen((v) => !v)}>
            <div className="admin-avatar">{initials}</div>
            <span className="admin-profile__name">
              {adminName}
              <span className="admin-profile__role">Administrator</span>
            </span>
          </button>

          {profileOpen && (
            <div className="admin-dropdown">
              <div className="admin-dropdown__header">
                <strong>{adminName}</strong>
                <span>{user?.email}</span>
              </div>
              <button
                className="admin-dropdown__item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/admin/settings");
                }}
              >
                <UserCircle />
                Profile Settings
              </button>
              <button
                className="admin-dropdown__item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/admin/settings");
                }}
              >
                <Settings />
                Preferences
              </button>
              <button
                className="admin-dropdown__item admin-dropdown__item--danger"
                onClick={() => signOut()}
              >
                <LogOut />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
