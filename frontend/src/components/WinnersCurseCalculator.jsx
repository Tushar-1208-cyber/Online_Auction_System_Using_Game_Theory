import { useState } from 'react';

export default function WinnersCurseCalculator() {
  const [myEstimate, setMyEstimate] = useState('');
  const [totalBidders, setTotalBidders] = useState('5');
  const [curseResult, setCurseResult] = useState(null);
  const [error, setError] = useState('');

  const handleCurse = (e) => {
    e.preventDefault();
    setError('');
    const est = parseFloat(myEstimate);
    const n = parseInt(totalBidders);
    if (est <= 0) return setError("Estimate must be greater than 0");
    if (n < 2) return setError("Must have at least 2 bidders");

    const expectedTrueValue = (est * (n - 1)) / n;
    const bidShading = est - expectedTrueValue;
    setCurseResult({ expectedTrueValue: expectedTrueValue.toFixed(2), bidShading: bidShading.toFixed(2), est, n });
  };

  return (
    <div className="calculator-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="calculator-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
        <h2>The Winner's Curse Risk Calculator ⚠️</h2>
        <p className="calc-subtitle">In common-value auctions, winning often means you overestimated the value. Calculate how much you should "shade" (reduce) your bid to stay safe.</p>
        
        {error && <div className="error-msg" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleCurse} className="calc-form" style={{ marginTop: '1.5rem' }}>
          <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Your Estimated Value ($)</label>
              <input type="number" step="0.01" min="1" value={myEstimate} onChange={e => setMyEstimate(e.target.value)} required placeholder="How much do you think it's worth?" style={inputStyle} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Total Number of Bidders</label>
              <input type="number" min="2" value={totalBidders} onChange={e => setTotalBidders(e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', background: '#dc2626' }}>Calculate Safe Bid</button>
        </form>

        {curseResult && (
          <div className="calc-results" style={{ marginTop: '2rem', background: '#fef2f2', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <h3 style={{ color: '#b91c1c' }}>Expected True Value: ${curseResult.expectedTrueValue}</h3>
            <p>If you win against {curseResult.n - 1} other bidders, the actual value is likely lower than your estimate of ${curseResult.est}.</p>
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '6px' }}>
              <strong>Recommended Bid Shading: <span style={{ color: '#dc2626' }}>-${curseResult.bidShading}</span></strong>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>You should reduce your bid by at least this amount to avoid the winner's curse.</p>
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
