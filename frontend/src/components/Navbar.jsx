import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, t, switchLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="nav-left">
          {/* Mobile toggle button */}
          <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <div className="lang-switch">
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => switchLang('en')}>{t('langEn')}</button>
            <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => switchLang('hi')}>{t('langHi')}</button>
          </div>
          {user ? (
            <>
              {user.role === 'seller' && (
                <Link to="/create" className="nav-link btn-create" onClick={() => setMenuOpen(false)}>{t('newAuction')}</Link>
              )}
              <div className="nav-user">
                <span className="user-badge">{user.username}</span>
                <span className="balance">${(user.balance || 10000).toLocaleString()}</span>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="btn-logout">{t('logout')}</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>{t('login')}</Link>
              <Link to="/register" className="nav-link btn-register" onClick={() => setMenuOpen(false)}>{t('register')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
