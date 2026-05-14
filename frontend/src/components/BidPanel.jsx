import { useState, useEffect } from 'react';
import { api } from '../api';
import { useLang } from '../context/LanguageContext';

export default function BidPanel({ auction, token, onBidPlaced }) {
  const { t } = useLang();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isDutch = auction.auction_type === 'dutch';
  const isSealed = auction.auction_type === 'sealed_first' || auction.auction_type === 'vickrey';
  const minBid = isDutch ? auction.current_price : auction.current_price + auction.min_increment;

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const bidAmount = isDutch ? auction.current_price : parseFloat(amount);

    if (!isDutch && (isNaN(bidAmount) || bidAmount <= 0)) {
      setError(t('validBidError'));
      return;
    }
    if (!isDutch && !isSealed && bidAmount < minBid) {
      setError(`${t('minBidHint')}: $${minBid.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await api.placeBid({ auction_id: auction.id, amount: bidAmount }, token);
      setSuccess(isDutch ? `${t('bidAccepted')} $${bidAmount.toFixed(2)}!` : `${t('bidPlaced')} $${bidAmount.toFixed(2)} ${t('placed')}`);
      setAmount('');
      onBidPlaced?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bid-panel">
      <h3>{isDutch ? t('acceptCurrentPrice') : isSealed ? t('submitSealedBid') : t('placeBid')}</h3>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <form onSubmit={handleBid}>
        {isDutch ? (
          <div className="dutch-accept">
            <p>{t('dutchPriceLabel')}: <strong>${auction.current_price?.toFixed(2)}</strong></p>
            <p className="hint">{t('dutchHint')}</p>
            <button type="submit" className="btn-primary full-width btn-dutch" disabled={loading}>
              {loading ? t('processing') : `${t('acceptAt')} $${auction.current_price?.toFixed(2)}`}
            </button>
          </div>
        ) : (
          <>
            <div className="bid-input-group">
              <span className="currency">$</span>
              <input
                type="number"
                step="0.01"
                min={isSealed ? 0.01 : minBid}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={isSealed ? t('yourSealedBid') : `Min: ${minBid.toFixed(2)}`}
                required
              />
            </div>
            {!isSealed && (
              <p className="hint">{t('minBidHint')}: ${minBid.toFixed(2)} (current + ${auction.min_increment} {t('increment')})</p>
            )}
            {isSealed && (
              <p className="hint">
                {auction.auction_type === 'vickrey' ? t('vickreyHint') : t('sealedHint')}
              </p>
            )}
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? t('processing') : isSealed ? t('submitSealedBid') : t('placeBid')}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
