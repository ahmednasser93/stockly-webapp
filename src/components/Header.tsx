import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import "./Header.css";

const APP_VERSION = __APP_VERSION__;

export function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="header-modern">
      <div className="header-background" />
      <div className="header-content">
        <Link to="/" className="brand-modern">
          <div className="brand-icon">
            <img 
              src="/images/logo.png" 
              alt="Stockly" 
              className="brand-logo"
              onError={(e) => {
                // Fallback to icon if logo fails
                const target = e.target as HTMLImageElement;
                if (target.src !== '/images/icon.png') {
                  target.src = '/images/icon.png';
                }
              }}
            />
          </div>
          <span className="brand-text">Stockly</span>
          <span className="app-version-modern">v{APP_VERSION}</span>
        </Link>
        
        <nav className="nav-modern">
          <NavLink to="/" end className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/alerts" end className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Alerts</span>
          </NavLink>
          <NavLink to="/docs" end className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Docs</span>
          </NavLink>
          <NavLink to="/settings" className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 18.364m12.728 0l-4.243-4.243m-4.242 0L5.636 5.636" />
            </svg>
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="header-actions">
          {user && (
            <div className="user-info" style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem",
              marginRight: "1rem",
              padding: "0.5rem 1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              fontSize: "0.875rem"
            }}>
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name || user.username || user.email}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    objectFit: "cover"
                  }}
                />
              )}
              <span style={{ fontWeight: 500 }}>
                {user.username || user.name || user.email}
              </span>
            </div>
          )}
          <ThemeToggle />
          <button type="button" className="btn-logout" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
