import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { adminClient } from "../lib/adminClient";

interface AuthContextValue {
  session: any | null;
  user: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    adminClient.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = adminClient.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const result = await adminClient.auth.signInWithPassword({ email, password });
    if (result.error) {
      setError(result.error.message);
      return { error: result.error.message };
    }

    setSession(result.data.session);
    return { error: null };
  };

  const signOut = async () => {
    await adminClient.auth.signOut();
    setSession(null);
  };

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    error,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
