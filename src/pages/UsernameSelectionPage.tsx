import { useState, useCallback, useMemo } from "react";
import { useAuth } from "../state/AuthContext";
import { API_BASE_URL } from "../api/client";
import { AuroraBackground } from "../components/reactbits/AuroraBackground";
import { useGsapFadeIn } from "../hooks/useGsapFadeIn";
import { useRef } from "react";

export function UsernameSelectionPage() {
  const { setUsername, user, checkAuth } = useAuth();
  const [username, setUsernameInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useGsapFadeIn(formRef);

  // Debounced username availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/api/auth/username/check?username=${encodeURIComponent(value)}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsAvailable(data.available);
        if (!data.available) {
          setError(data.message || "This username is already taken");
        } else {
          setError(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setIsAvailable(false);
        setError(errorData.error || "Failed to check username availability");
      }
    } catch (err) {
      console.error("Availability check error:", err);
      setIsAvailable(null);
      setError("Failed to check username availability");
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Debounce the availability check
  const debouncedCheck = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkAvailability(value);
      }, 500);
    };
  }, [checkAvailability]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsernameInput(value);
    setError(null);
    setIsAvailable(null);
    
    // Basic client-side validation
    if (value.length > 0 && value.length < 3) {
      setError("Username must be at least 3 characters");
      setIsAvailable(false);
      return;
    }

    // Check for invalid characters
    if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens");
      setIsAvailable(false);
      return;
    }

    // Check if starts/ends with special characters
    if (value && (/^[_-]/.test(value) || /[_-]$/.test(value))) {
      setError("Username cannot start or end with underscore or hyphen");
      setIsAvailable(false);
      return;
    }

    // Check for consecutive special characters
    if (value && (/__/.test(value) || /--/.test(value) || /_-/.test(value) || /-_/.test(value))) {
      setError("Username cannot contain consecutive special characters");
      setIsAvailable(false);
      return;
    }

    if (value.length >= 3 && value.length <= 20) {
      debouncedCheck(value);
    } else if (value.length > 20) {
      setError("Username must be 20 characters or less");
      setIsAvailable(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || username.length < 3) {
      setError("Please enter a valid username");
      return;
    }

    if (isAvailable === false) {
      setError("This username is not available");
      return;
    }

    if (isChecking) {
      setError("Please wait while we check availability");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await setUsername(username);
      // Refresh auth state to get updated user data
      await checkAuth();
      // Navigation will happen automatically via ProtectedRoute
    } catch (err) {
      // Handle 409 error (username already set) - refresh auth state
      if (err instanceof Error && err.message.includes("already been set")) {
        await checkAuth();
        setError("Username has already been set. Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to set username");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuroraBackground variant="login">
      <div className="login-grid">
        <div className="login-hero">
          <p className="eyebrow">Welcome to Stockly</p>
          <h1>Choose your username</h1>
          <p className="muted">
            Pick a unique username that will be displayed across Stockly. 
            This cannot be changed later, so choose wisely!
          </p>
          {user && (
            <div className="user-info" style={{ marginTop: "2rem", padding: "1rem", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.8)" }}>
                Signed in as: <strong>{user.email}</strong>
              </p>
            </div>
          )}
        </div>
        <div className="login-panel" ref={formRef}>
          <form className="card" onSubmit={handleSubmit}>
            <div className="login-card-header">
              <h2>Select Username</h2>
              <p>3-20 characters, letters, numbers, underscores, and hyphens only.</p>
            </div>
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="johndoe"
                autoComplete="username"
                disabled={submitting}
                style={{
                  borderColor: error && isAvailable === false ? "#ef4444" : isAvailable === true ? "#10b981" : undefined,
                }}
              />
              {isChecking && (
                <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                  Checking availability...
                </p>
              )}
              {isAvailable === true && !isChecking && (
                <p style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>
                  ✓ Username is available
                </p>
              )}
            </label>
            {error && (
              <p className="error" style={{ marginTop: "0.5rem" }}>
                {error}
              </p>
            )}
            <button 
              type="submit" 
              disabled={submitting || isChecking || isAvailable !== true || !username}
            >
              {submitting ? "Setting username…" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </AuroraBackground>
  );
}





