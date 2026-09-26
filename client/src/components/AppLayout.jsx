import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  { to: '/dashboard', icon: '⌂', label: 'Home' },
  { to: '/learn', icon: '◈', label: 'Learn' },
  { to: '/leaderboard', icon: '♛', label: 'Leaders' },
  { to: '/profile', icon: '◌', label: 'My journey' }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = user?.role === 'admin' ? [...nav, { to: '/admin', icon: '⚙', label: 'Admin' }] : nav;
  const signOut = () => { logout(); navigate('/'); };
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand"><span className="brand-mark">S</span><span>Safe<span>Buddy</span></span></NavLink>
      <p className="sidebar-kicker">LEARN · GROW · SPEAK UP</p>
      <nav>{items.map((item) => <NavLink key={item.to} to={item.to} className="nav-link"><span>{item.icon}</span>{item.label}</NavLink>)}</nav>
      <div className="sidebar-footer">
        <div className="help-box"><span>💬</span><div><strong>Need help?</strong><small>Talk to a trusted adult.</small></div></div>
        <button className="text-button signout" onClick={signOut}>↪ Sign out</button>
      </div>
    </aside>
    <header className="topbar">
      <NavLink to="/dashboard" className="brand brand--mobile"><span className="brand-mark">S</span><span>Safe<span>Buddy</span></span></NavLink>
      <div className="topbar-spacer" />
      <div className="xp-pill"><span>⚡</span><b>{user?.xp || 0}</b> XP</div>
      <NavLink to="/profile" className="profile-chip"><span className="avatar">{user?.avatar || '🌟'}</span><span className="profile-chip__text"><b>{user?.name?.split(' ')[0]}</b><small>{user?.role === 'admin' ? 'Guide' : 'Learner'}</small></span></NavLink>
    </header>
    <main className="page-content"><Outlet /></main>
    <nav className="bottom-nav">{items.slice(0, 4).map((item) => <NavLink key={item.to} to={item.to} className="bottom-nav__link"><span>{item.icon}</span><small>{item.label}</small></NavLink>)}</nav>
  </div>;
}
