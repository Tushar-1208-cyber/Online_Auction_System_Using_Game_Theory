import { useState } from 'react';

export default function MyersonCalculator() {
  const [sellerVal, setSellerVal] = useState('0');
  const [maxMarketVal, setMaxMarketVal] = useState('');
  const [myersonResult, setMyersonResult] = useState(null);
  const [error, setError] = useState('');

  const handleMyerson = (e) => {
    e.preventDefault();
    setError('');
    const v0 = parseFloat(sellerVal);
    const vMax = parseFloat(maxMarketVal);
    if (vMax <= v0) return setError("Max Market Value must be greater than your own valuation.");
    
    const rStar = (v0 + vMax) / 2;
    setMyersonResult({ rStar: rStar.toFixed(2), v0, vMax });
  };

  return (
    <div className="calculator-page" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="calculator-card" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
        <h2>Myerson's Optimal Reserve Price 📈</h2>
        <p className="calc-subtitle">Calculate the mathematically perfect reserve price to maximize seller revenue, assuming a uniform distribution of bidder values.</p>
        
        {error && <div className="error-msg" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleMyerson} className="calc-form" style={{ marginTop: '1.5rem' }}>
          <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Your Value of the Item (v₀)</label>
              <input type="number" step="0.01" min="0" value={sellerVal} onChange={e => setSellerVal(e.target.value)} required placeholder="E.g., 0 if you just want to sell it" style={inputStyle} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Max Market Valuation (v_max)</label>
              <input type="number" step="0.01" min="1" value={maxMarketVal} onChange={e => setMaxMarketVal(e.target.value)} required placeholder="Maximum possible bid expected" style={inputStyle} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Calculate Reserve Price</button>
        </form>

        {myersonResult && (
          <div className="calc-results" style={{ marginTop: '2rem', background: '#eff6ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h3 style={{ color: 'var(--accent)' }}>Optimal Reserve Price: ${myersonResult.rStar}</h3>
            <p>To maximize expected revenue, do not sell below this price.</p>
            <code style={codeStyle}>Formula: r* = (v₀ + v_max) / 2 = ({myersonResult.v0} + {myersonResult.vMax}) / 2</code>
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
