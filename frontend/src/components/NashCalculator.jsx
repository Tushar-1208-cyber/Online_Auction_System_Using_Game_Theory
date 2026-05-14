import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function NashCalculator() {
  const { token } = useAuth();
  const { t } = useLang();
  
  const [valuation, setValuation] = useState('');
  const [numBidders, setNumBidders] = useState('3');
  const [nashResult, setNashResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNash = async (e) => {
    e.preventDefault();
    setError('');
    if (!valuation || parseFloat(valuation) <= 0) return setError(t('valuationPositive'));
    if (!numBidders || parseInt(numBidders) < 2) return setError(t('biddersMin'));
    
    setLoading(true);
    try {
      const data = await api.getNashCalculation(
        { valuation: parseFloat(valuation), num_bidders: parseInt(numBidders) },
        token
      );
      setNashResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculator-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="calculator-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
        <h2>Nash Equilibrium Calculator 🎯</h2>
        <p className="calc-subtitle">Compute the symmetric Bayesian Nash Equilibrium bid for a first-price sealed-bid auction under uniform independent private values.</p>
        
        {error && <div className="error-msg" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleNash} className="calc-form" style={{ marginTop: '1.5rem' }}>
          <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>{t('yourValuation')}</label>
              <input type="number" step="0.01" min="0.01" value={valuation} onChange={e => setValuation(e.target.value)} required placeholder={t('valuationPlaceholder')} style={inputStyle} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>{t('numberOfBidders')}</label>
              <input type="number" min="2" max="100" value={numBidders} onChange={e => setNumBidders(e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? t('calculating') : t('calculateOptimal')}
          </button>
        </form>

        {nashResult && (
          <div className="calc-results" style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: 'var(--green)' }}>Optimal Bid: ${nashResult.nashEquilibriumBid}</h3>
            <p>Bid <strong>{(nashResult.optimalFraction * 100).toFixed(1)}%</strong> of your valuation.</p>
            <code style={codeStyle}>Formula: b(v) = v × (n-1)/n = {nashResult.valuation} × {nashResult.numBidders - 1}/{nashResult.numBidders}</code>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h4>{t('expectedPayoff')}</h4>
              <p className="result-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>${nashResult.expectedPayoff}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  fontSize: '1rem'
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
