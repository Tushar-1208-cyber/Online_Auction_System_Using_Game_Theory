import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function Sidebar() {
  const { user } = useAuth();
  const { t } = useLang();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">⚡</span>
          <span>{t('brand')}</span>
        </Link>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <h4 className="nav-heading">Main Navigation</h4>
          <Link to="/" className={`side-link ${isActive('/') ? 'active' : ''}`}>🏠 {t('auctions')}</Link>
          
          {user && (
            <Link to="/dashboard" className={`side-link ${isActive('/dashboard') ? 'active' : ''}`}>📊 Dashboard</Link>
          )}
          
          {user?.role === 'admin' && (
            <Link to="/admin" className={`side-link ${isActive('/admin') ? 'active' : ''}`} style={{ color: isActive('/admin') ? '#b45309' : '' }}>🛡️ Admin Panel</Link>
          )}
        </div>

        <div className="nav-section">
          <h4 className="nav-heading">Game Theory Tools</h4>
          <Link to="/calculator/nash" className={`side-link ${isActive('/calculator/nash') ? 'active' : ''}`}>🎯 Nash Equilibrium</Link>
          <Link to="/calculator/myerson" className={`side-link ${isActive('/calculator/myerson') ? 'active' : ''}`}>📈 Myerson Reserve</Link>
          <Link to="/calculator/curse" className={`side-link ${isActive('/calculator/curse') ? 'active' : ''}`}>⚠️ Winner's Curse</Link>
        </div>
      </div>
    </aside>
  );
}
