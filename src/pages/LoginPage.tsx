import { useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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
  const { isAuthenticated, handleGoogleSignIn, error } = useAuth();
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

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setFormError("Google sign-in failed. Please try again.");
      return;
    }

    setFormError(null);
    try {
      await handleGoogleSignIn(credentialResponse.credential);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  const handleGoogleError = () => {
    setFormError("Google sign-in was cancelled or failed");
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
          <div className="card">
            <div className="login-card-header">
              <h2>Sign in to Stockly</h2>
              <p>Sign in with your Google account to access your personalized stock dashboard.</p>
            </div>
            {(formError || error) && (
              <p className="error" style={{ marginBottom: "1rem" }}>
                {formError ?? error}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          </div>
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
