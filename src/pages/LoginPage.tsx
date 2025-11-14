import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { AuroraBackground } from "../components/reactbits/AuroraBackground";
import { useGsapFadeIn } from "../hooks/useGsapFadeIn";
import { useGsapStaggerList } from "../hooks/useGsapStaggerList";

const LOGIN_PERKS = [
  "Realtime watchlist synced with your Stockly workspace",
  "Responsive API docs with built-in auth guard",
  "Custom refresh cadence tuned per user",
];

export function LoginPage() {
  const { isAuthenticated, login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const formAnimation = useMemo(() => ({ delay: 0.15 }), []);
  const listAnimation = useMemo(() => ({ delay: 0.2 }), []);

  useGsapFadeIn(heroRef);
  useGsapFadeIn(formRef, formAnimation);
  useGsapStaggerList(listRef, listAnimation);

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
    <AuroraBackground variant="login">
      <div className="login-grid">
        <div className="login-hero" ref={heroRef}>
          <p className="eyebrow">Stockly Command</p>
          <h1>Everything you track, now in one guard-railed panel.</h1>
          <p className="muted">
            Jump into your personalized stock cockpit and docs with delightful
            motion powered by ReactBits-inspired components and GSAP.
          </p>
          <div className="login-perks" ref={listRef}>
            {LOGIN_PERKS.map((perk) => (
              <div key={perk} data-animate-item>
                <span>◆</span>
                {perk}
              </div>
            ))}
          </div>
        </div>
        <div className="login-panel" ref={formRef}>
          <form className="card" onSubmit={handleSubmit}>
            <div className="login-card-header">
              <h2>Secure Login</h2>
              <p>Use the shared Stockly credentials to unlock dashboard + docs.</p>
            </div>
            <label>
              Username
              <input
                type="text"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {(formError || error) && (
              <p className="error">{formError ?? error}</p>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? "Verifying…" : "Enter command center"}
            </button>
          </form>
          <div className="doc-preview card">
            <p className="muted">Need the API contract?</p>
            <h3>Docs tab mirrors backend Swagger with live credentials.</h3>
            <p className="muted">
              Once signed in you can test calls immediately with the embedded
              ReactBits-style doc viewer.
            </p>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
