import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import AuctionCard from './AuctionCard';

export default function Dashboard() {
  const { token, user } = useAuth();
  const { t } = useLang();
  const [data, setData] = useState({ myAuctions: [], myActiveAuctions: [], wonAuctions: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bids');

  useEffect(() => {
    api.getDashboard(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <div className="dashboard-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-header" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Welcome, {user.username} 👋</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your auctions, track your bids, and explore game theory insights.</p>
      </div>

      <div className="dashboard-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button className={`tab-btn ${activeTab === 'bids' ? 'active' : ''}`} onClick={() => setActiveTab('bids')} style={tabStyle(activeTab === 'bids')}>
          My Active Bids ({data.myActiveAuctions.length})
        </button>
        <button className={`tab-btn ${activeTab === 'auctions' ? 'active' : ''}`} onClick={() => setActiveTab('auctions')} style={tabStyle(activeTab === 'auctions')}>
          My Created Auctions ({data.myAuctions.length})
        </button>
        <button className={`tab-btn ${activeTab === 'won' ? 'active' : ''}`} onClick={() => setActiveTab('won')} style={tabStyle(activeTab === 'won')}>
          Won Items ({data.wonAuctions.length})
        </button>
        <button className={`tab-btn ${activeTab === 'professor' ? 'active' : ''}`} onClick={() => setActiveTab('professor')} style={{...tabStyle(activeTab === 'professor'), color: 'var(--accent)', fontWeight: 'bold'}}>
          🎓 Professor View
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'bids' && (
          <div className="auction-grid">
            {data.myActiveAuctions.length === 0 ? <p className="no-data">You haven't bid on any active auctions yet.</p> : 
              data.myActiveAuctions.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="auction-grid">
            {data.myAuctions.length === 0 ? <p className="no-data">You haven't created any auctions yet.</p> : 
              data.myAuctions.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        )}

        {activeTab === 'won' && (
          <div className="auction-grid">
            {data.wonAuctions.length === 0 ? <p className="no-data">You haven't won any auctions yet.</p> : 
              data.wonAuctions.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        )}

        {activeTab === 'professor' && (
          <div className="professor-view" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
            <h2 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🎓 Game Theory Integration Lab
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              This section demonstrates how advanced economic concepts and game theory mechanisms are actively applied within the system architecture.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="concept-card" style={conceptCardStyle}>
                <h3>1. Mechanism Design (Auction Theory)</h3>
                <p>The platform implements 4 distinct algorithmic mechanisms to allocate resources and discover prices:</p>
                <ul>
                  <li><strong>English Auction:</strong> Ascending price, open-cry. Price increases until one bidder remains.</li>
                  <li><strong>Dutch Auction:</strong> Descending price. System algorithmically drops the price every interval until a bidder accepts.</li>
                  <li><strong>First-Price Sealed-Bid:</strong> Bidders submit hidden bids. Highest bidder wins and pays exactly what they bid.</li>
                  <li><strong>Vickrey (Second-Price):</strong> Highest bidder wins but pays the <strong>second-highest</strong> bid amount.</li>
                </ul>
              </div>

              <div className="concept-card" style={conceptCardStyle}>
                <h3>2. Bayesian Nash Equilibrium & Dominant Strategies</h3>
                <p>Our `auctionEngine.js` dynamically evaluates the auction state to provide bidders with their equilibrium strategy.</p>
                <code style={codeStyle}>
                  Vickrey Strategy: b_i* = v_i (Truth-telling is weakly dominant)<br/>
                  First-Price Strategy: b_i* = v_i - (v_i / N) (Bid shading based on N bidders)
                </code>
              </div>

              <div className="concept-card" style={conceptCardStyle}>
                <h3>3. Revenue Equivalence Theorem</h3>
                <p>Assuming risk-neutral bidders and Independent Private Values (IPV), the system calculates that the expected revenue for the seller across all 4 standard auction formats is theoretically identical.</p>
                <code style={codeStyle}>E[R_English] = E[R_Dutch] = E[R_FirstPrice] = E[R_Vickrey]</code>
              </div>

              <div className="concept-card" style={conceptCardStyle}>
                <h3>4. The Winner's Curse Protection</h3>
                <p>In common-value environments, winning often implies the bidder over-estimated the item's true value. The platform provides automated warnings to bidders regarding the Winner's Curse to encourage rational bid shading.</p>
              </div>

              <div className="concept-card" style={conceptCardStyle}>
                <h3>5. Myerson's Optimal Auction (Reserve Pricing)</h3>
                <p>The system allows sellers to set a <strong>Reserve Price (r)</strong>. According to Myerson's theory, setting an optimal reserve price excludes low-value bidders but forces higher-value bidders to pay more, strictly increasing expected seller revenue compared to standard auctions.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const tabStyle = (isActive) => ({
  padding: '12px 24px',
  fontSize: '1.1rem',
  background: isActive ? 'white' : 'transparent',
  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
  borderBottom: isActive ? 'none' : '1px solid var(--border)',
  marginBottom: '-1px',
  borderRadius: '8px 8px 0 0',
  cursor: 'pointer',
  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
  fontWeight: isActive ? '600' : '400',
});

const conceptCardStyle = {
  padding: '1.5rem',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
};

const codeStyle = {
  display: 'block',
  background: '#1e293b',
  color: '#38bdf8',
  padding: '1rem',
  borderRadius: '6px',
  marginTop: '10px',
  fontFamily: 'monospace',
  lineHeight: '1.5'
};
