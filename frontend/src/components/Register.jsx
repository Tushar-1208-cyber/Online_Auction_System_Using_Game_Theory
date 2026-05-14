import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('bidder');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError(t('fillAllFields'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordMin'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password, role);
      navigate('/verify-otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{t('createAccount')}</h2>
        <p className="auth-subtitle">{t('registerSubtitle')}</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('username')}</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="johndoe" />
          </div>
          <div className="form-group">
            <label>{t('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" minLength={6} />
          </div>
          <div className="form-group">
            <label>I am a:</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="role" value="bidder" checked={role === 'bidder'} onChange={e => setRole(e.target.value)} />
                Bidder
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={e => setRole(e.target.value)} />
                Seller
              </label>
            </div>
          </div>
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? t('creatingAccount') : t('createAccount')}
          </button>
        </form>
        <p className="auth-footer">{t('haveAccount')} <Link to="/login">{t('login')}</Link></p>
      </div>
    </div>
  );
}
