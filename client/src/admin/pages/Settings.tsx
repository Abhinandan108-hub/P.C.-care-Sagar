import { FormEvent, useState } from "react";
import { KeyRound, Mail, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { adminClient } from "../lib/adminClient";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }

    setSaving(true);
    const { error } = await adminClient.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: "Password updated successfully." });
      setNewPassword("");
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Settings</h1>
          <p>Manage your admin account and preferences.</p>
        </div>
      </div>

      <div className="admin-panels">
        <div className="admin-block">
          <div className="admin-block__head">
            <h3>Account Details</h3>
          </div>

          <div className="admin-list">
            <div className="admin-list__item">
              <span className="admin-list__bullet" style={{ background: "#2f5dff" }} />
              <div>
                <div className="admin-list__title">
                  <Mail size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
                  Email
                </div>
                <div className="admin-list__meta">{user?.email}</div>
              </div>
            </div>
            <div className="admin-list__item">
              <span className="admin-list__bullet" style={{ background: "#16a34a" }} />
              <div>
                <div className="admin-list__title">
                  <ShieldCheck size={13} style={{ display: "inline", marginRight: 6, verticalAlign: -2 }} />
                  Role
                </div>
                <div className="admin-list__meta">Store Administrator</div>
              </div>
            </div>
          </div>

          <button
            className="admin-btn admin-btn--ghost"
            style={{ marginTop: 16 }}
            onClick={() => signOut()}
          >
            <LogOut size={15} />
            Logout of Admin Panel
          </button>
        </div>

        <div className="admin-block">
          <div className="admin-block__head">
            <h3>Appearance</h3>
          </div>
          <div className="admin-theme-toggle" role="group" aria-label="Choose theme">
            <button
              type="button"
              className={`admin-theme-toggle__btn ${theme === "light" ? "is-active" : ""}`}
              onClick={() => setTheme("light")}
            >
              <Sun size={16} />
              Light Mode
            </button>
            <button
              type="button"
              className={`admin-theme-toggle__btn ${theme === "dark" ? "is-active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              <Moon size={16} />
              Dark Mode
            </button>
          </div>
        </div>

        <div className="admin-block">
          <div className="admin-block__head">
            <h3>Change Password</h3>
          </div>

          {status && (
            <div
              className="admin-alert"
              style={
                status.type === "success"
                  ? { background: "rgba(22,163,74,0.1)", color: "#16a34a", borderColor: "rgba(22,163,74,0.18)" }
                  : undefined
              }
            >
              <ShieldCheck size={16} />
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordUpdate}>
            <div className="admin-field">
              <label htmlFor="new-password">New Password</label>
              <div className="admin-input-wrap">
                <KeyRound />
                <input
                  id="new-password"
                  type="password"
                  className="admin-input"
                  placeholder="Enter a new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
