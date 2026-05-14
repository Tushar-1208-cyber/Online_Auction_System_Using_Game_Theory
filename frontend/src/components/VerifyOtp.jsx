import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verify, user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await verify(otp.trim());
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Verify Email Address</h2>
        <p className="auth-subtitle">
          Please enter the 6-digit OTP sent to your registered email address. 
          <br/>
          <small><em>(If .env isn't configured, check the backend terminal)</em></small>
        </p>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>OTP Code</label>
            <input 
              type="text" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              required 
              placeholder="123456" 
              maxLength={6}
              style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.2rem' }}
            />
          </div>
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
