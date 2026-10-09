import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

const nav = [
  { to: '/dashboard', icon: 'home', label: 'Home' },
  { to: '/learn', icon: 'book', label: 'Learn' },
  { to: '/games', icon: 'game', label: 'Play' },
  { to: '/profile', icon: 'compass', label: 'My journey' }
];

function Brand({ to = '/dashboard', className = 'brand' }) {
  return <NavLink to={to} className={className} aria-label="SafeBuddy home">
    <span className="brand-mark" aria-hidden="true">S</span>
    <span className="brand-name">Safe<span>Buddy</span></span>
  </NavLink>;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = user?.role === 'admin' ? [...nav, { to: '/admin', icon: 'sliders', label: 'Admin' }] : nav;
  const signOut = () => { logout(); navigate('/'); };
  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <nav className="sidebar-nav" aria-label="Main">
        {items.map((item) => <NavLink key={item.to} to={item.to} className="nav-link">
          <Icon name={item.icon} size={18} />
          <span>{item.label}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-footer">
        <div className="help-box">
          <Icon name="message" size={18} />
          <div><strong>Need help?</strong><small>Talk to a trusted adult.</small></div>
        </div>
        <button className="text-button signout" onClick={signOut}><Icon name="logout" size={16} /> Sign out</button>
      </div>
    </aside>
    <header className="topbar">
      <Brand className="brand brand--mobile" />
      <div className="topbar-spacer" />
      <div className="xp-pill"><Icon name="zap" size={15} /><b>{user?.xp || 0}</b> XP</div>
      <NavLink to="/profile" className="profile-chip">
        <span className="avatar" aria-hidden="true">{user?.avatar || user?.name?.[0] || 'S'}</span>
        <span className="profile-chip__text"><b>{user?.name?.split(' ')[0]}</b><small>{user?.role === 'admin' ? 'Guide' : 'Learner'}</small></span>
      </NavLink>
    </header>
    <main className="page-content"><Outlet /></main>
    <nav className="bottom-nav" aria-label="Main">
      {items.slice(0, 5).map((item) => <NavLink key={item.to} to={item.to} className="bottom-nav__link">
        <Icon name={item.icon} size={20} />
        <small>{item.label}</small>
      </NavLink>)}
    </nav>
  </div>;
}
