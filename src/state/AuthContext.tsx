import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE_URL } from "../api/client";

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  username: string | null;
}

type AuthContextValue = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  requiresUsername: boolean;
  handleGoogleSignIn: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUsername: (username: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresUsername, setRequiresUsername] = useState(false);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/api/auth/me`, {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        // Set requiresUsername based on whether user has username
        const hasUsername = !!data.user.username;
        setRequiresUsername(!hasUsername);
        setError(null);
      } else if (response.status === 401) {
        // Not authenticated - clear state
        setIsAuthenticated(false);
        setUser(null);
        setRequiresUsername(false);
      } else {
        // Other error
        setIsAuthenticated(false);
        setUser(null);
        setRequiresUsername(false);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthenticated(false);
      setUser(null);
      setRequiresUsername(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle Google OAuth sign-in with ID token
  const handleGoogleSignIn = useCallback(async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);

      // Send Google ID token to our API
      const response = await fetch(`${API_BASE_URL}/v1/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies for httpOnly cookie storage
        body: JSON.stringify({
          idToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Authentication failed");
      }

      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
      // Set requiresUsername based on whether user has username
      setRequiresUsername(!data.user.username);

      // If user already has username, redirect to home immediately
      if (data.user.username) {
        window.location.href = "/";
      }
      // Otherwise, ProtectedRoute will handle redirect to username-selection
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      throw err; // Re-throw so LoginPage can handle it
    } finally {
      setLoading(false);
    }
  }, []);

  // Set username after initial sign-in
  const setUsername = useCallback(async (username: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/v1/api/auth/username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to set username";
        
        // If username already set (409), refresh auth state and don't throw
        if (response.status === 409) {
          await checkAuth();
          // Return success since username is already set
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUser(data.user);
      setRequiresUsername(false);
      // Navigation will be handled by ProtectedRoute
    } catch (err) {
      console.error("Set username error:", err);
      setError(err instanceof Error ? err.message : "Failed to set username");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/v1/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setRequiresUsername(false);
      // Navigation will be handled by ProtectedRoute
      window.location.href = "/login";
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      loading,
      error,
      requiresUsername,
      handleGoogleSignIn,
      logout,
      checkAuth,
      setUsername,
    }),
    [isAuthenticated, user, loading, error, requiresUsername, handleGoogleSignIn, logout, checkAuth, setUsername]
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
