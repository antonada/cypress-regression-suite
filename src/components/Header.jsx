import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { clearSession, getSession } from '../lib/session';
import { Notifications } from './Notifications';

export function Header() {
  const navigate = useNavigate();
  const user = getSession()?.user;

  async function logout() {
    try {
      await api.logout();
    } catch {
      // Logging out locally is enough even if the server call fails
    }
    clearSession();
    navigate('/login');
  }

  return (
    <header className="header">
      <Link to="/orders" className="logo">
        Orderly
      </Link>
      <nav aria-label="Main">
        <NavLink to="/orders" end>
          Orders
        </NavLink>
        <NavLink to="/orders/new">New order</NavLink>
      </nav>
      <div className="header__right">
        <Notifications />
        <span className="user" data-cy="current-user">
          {user?.name}
        </span>
        <button type="button" className="link-button" onClick={logout} data-cy="logout">
          Sign out
        </button>
      </div>
    </header>
  );
}
