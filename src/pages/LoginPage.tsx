import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function LoginPage() {
  const { isAuthenticated, login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!username || !password) {
      setFormError("Please provide username and password");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  };

  return (
    <div className="auth-container">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Stockly Login</h1>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {(formError || error) && (
          <p className="error">{formError ?? error}</p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Login"}
        </button>
      </form>
    </div>
  );
}
