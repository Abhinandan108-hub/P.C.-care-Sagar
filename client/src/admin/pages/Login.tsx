import { FormEvent, useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      setFormError(error);
    }
    // On success, the AuthContext session update triggers the
    // PublicOnlyRoute redirect to /admin/dashboard automatically.
  };

  return (
    <div className="admin-root admin-login">
      <div className="admin-login__side">
        <div className="admin-login__brand">
          <div className="admin-login__brand-mark">PC</div>
          P.C. Care Sagar
        </div>

        <div className="admin-login__pitch">
          <h1>Manage your store from one powerful dashboard.</h1>
          <p>
            Update products, categories, brands and customer enquiries for
            laptops, desktops, printers, accessories, networking products and
            IT solutions — all in one secure admin panel.
          </p>
        </div>

        <div className="admin-login__foot">
          © {new Date().getFullYear()} P.C. Care Sagar. Admin access only.
        </div>
      </div>

      <div className="admin-login__main">
        <div className="admin-login__card">
          <h2>Admin Sign In</h2>
          <p>Enter your credentials to access the dashboard.</p>

          {formError && (
            <div className="admin-alert">
              <ShieldCheck size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="admin-field">
              <label htmlFor="admin-email">Email address</label>
              <div className="admin-input-wrap">
                <Mail />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@pccaresagar.com"
                  className="admin-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="admin-password">Password</label>
              <div className="admin-input-wrap">
                <Lock />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="admin-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="admin-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="admin-login__hint">
            Access is restricted to the store administrator only.
          </p>
        </div>
      </div>
    </div>
  );
}
