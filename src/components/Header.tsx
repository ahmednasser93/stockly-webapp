import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

const APP_VERSION = __APP_VERSION__;

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <span>Stockly</span>
        <span className="app-version">v{APP_VERSION}</span>
      </Link>
      <nav>
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/alerts" end>
          Alerts
        </NavLink>
        <NavLink to="/docs" end>
          Docs
        </NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <div className="nav-dropdown">
          <span className="nav-dropdown-label">Admin ▾ Will be removed soon</span>
          <div className="nav-dropdown-menu">
            <NavLink to="/admin/docs">Docs</NavLink>
          </div>
        </div>
      </nav>
      <ThemeToggle />
      <button type="button" className="ghost logout-button" onClick={logout}>
        Logout
      </button>
    </header>
  );
}
