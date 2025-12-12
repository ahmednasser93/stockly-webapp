import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, requiresUsername } = useAuth();

  if (loading) {
    return (
      <div className="loading" style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "1.125rem",
        color: "#6b7280"
      }}>
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to username selection if username is required
  if (requiresUsername) {
    return <Navigate to="/username-selection" replace />;
  }

  return <>{children}</>;
}
