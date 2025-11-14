import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AUTH_STORAGE_KEY = "stockly-webapp-auth";
const FALLBACK_USERNAME =
  import.meta.env.VITE_STOCKLY_USERNAME ?? "demo";
const FALLBACK_PASS =
  import.meta.env.VITE_STOCKLY_PASS ?? "demo123";

type AuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
        setIsAuthenticated(true);
        return;
      }
      if (response.status === 401) {
        setError("Invalid credentials");
        setIsAuthenticated(false);
        return;
      }
      if (response.status !== 404) {
        console.warn("Unexpected login response", response.status);
      }
    } catch (networkError) {
      console.warn("Login API unavailable, falling back to local env", networkError);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    if (username === FALLBACK_USERNAME && password === FALLBACK_PASS) {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      setIsAuthenticated(true);
    } else {
      setError("Invalid credentials");
      setIsAuthenticated(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, loading, login, logout, error }),
    [isAuthenticated, loading, login, logout, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
