import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        Stockly Web
      </Link>
      <nav>
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <button type="button" className="ghost" onClick={logout}>
        Logout
      </button>
    </header>
  );
}
