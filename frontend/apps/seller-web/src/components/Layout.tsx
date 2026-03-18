import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/checkout-links', label: 'Checkout Links', icon: '🔗' },
  { to: '/orders', label: 'Orders', icon: '📋' },
  { to: '/profile', label: 'Profile', icon: '🏢' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <div className="logo-icon-wrap">S</div>
          <span className="logo-text">SafeCart</span>
        </div>

        <p className="sidebar-section-label">Menu</p>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.phone?.slice(-2) ?? 'U'}</div>
            <div className="user-details">
              <div className="user-org">{org?.name ?? 'No org yet'}</div>
              <div className="user-phone">{user?.phone}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={logout}>
            ← Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
