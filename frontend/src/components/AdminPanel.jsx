import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function AdminPanel() {
  const { token, user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats(token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <div className="admin-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Admin Control Panel 🛡️</h1>
        <p style={{ color: 'var(--text-secondary)' }}>System statistics and moderation</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="stat-card" style={statCardStyle}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{stats?.totalUsers || 0}</p>
        </div>
        <div className="stat-card" style={statCardStyle}>
          <h3>Total Auctions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--green)' }}>{stats?.totalAuctions || 0}</p>
        </div>
        <div className="stat-card" style={statCardStyle}>
          <h3>Active Bids</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>{stats?.totalBids || 0}</p>
        </div>
      </div>
      
      <div className="admin-notice" style={{ padding: '2rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px' }}>
        <h3 style={{ color: '#b45309', marginBottom: '1rem' }}>Admin Tools (Coming Soon)</h3>
        <p style={{ color: '#92400e' }}>User management and auction moderation tools will be available in the next system update.</p>
      </div>
    </div>
  );
}

const statCardStyle = {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--border)',
  textAlign: 'center'
};
