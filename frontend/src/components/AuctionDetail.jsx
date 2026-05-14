import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useSocket } from '../hooks/useSocket';
import BidPanel from './BidPanel';
import GameTheoryInsights from './GameTheoryInsights';

function timeLeftStr(endTime, t) {
  const diff = new Date(endTime) - new Date();
  if (diff <= 0) return t('auctionEnded');
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}${t('hours')} ${m}${t('minutes')} ${s}${t('seconds')} ${t('remaining')}`;
}

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const TYPE_NAMES = {
    english: t('typeEnglish'),
    dutch: t('typeDutch'),
    sealed_first: t('typeSealedFirst'),
    vickrey: t('typeVickrey'),
  };

  const fetchAuction = useCallback(() => {
    api.getAuction(id)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchAuction(); }, [fetchAuction]);

  useEffect(() => {
    if (!data?.auction) return;
    const tick = () => setTimeLeft(timeLeftStr(data.auction.end_time, t));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data?.auction?.end_time, t]);

  useSocket(id, {
    onBid: (bidData) => {
      setData(prev => {
        if (!prev) return prev;
        const newBid = {
          id: bidData.bidId,
          bidder_id: bidData.bidder_id,
          bidder_name: bidData.bidder_name,
          amount: bidData.is_sealed ? '***sealed***' : bidData.amount,
          created_at: bidData.timestamp,
        };
        return {
          ...prev,
          auction: { ...prev.auction, current_price: bidData.newPrice ?? prev.auction.current_price },
          bids: [newBid, ...prev.bids],
          bidCount: prev.bidCount + 1,
        };
      });
    },
    onAuctionEnd: () => { fetchAuction(); },
    onDutchPrice: (priceData) => {
      setData(prev => prev ? {
        ...prev,
        auction: { ...prev.auction, current_price: priceData.currentPrice },
      } : prev);
    },
  });

  const handleDelete = async () => {
    if (!window.confirm(t('confirmDelete'))) return;
    setDeleting(true);
    try {
      await api.deleteAuction(id, token);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">{t('loadingAuction')}</div>;
  if (error && !data) return <div className="error-msg" style={{ maxWidth: 600, margin: '2rem auto' }}>{error}</div>;
  if (!data) return null;

  const { auction, bids, bidCount, insights } = data;
  const isActive = auction.status === 'active' && new Date(auction.end_time) > new Date();
  const isSeller = user && user.id === auction.seller_id;
  const isWinner = user && user.id === auction.winner_id;
  
  const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const imgUrl = auction.image_url ? (auction.image_url.startsWith('http') ? auction.image_url : `${API_ROOT}${auction.image_url}`) : null;

  return (
    <div className="auction-detail">
      <div className="detail-main">
        {imgUrl && (
          <div className="detail-image-container" style={{ marginBottom: '2rem' }}>
            <img src={imgUrl} alt={auction.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
          </div>
        )}
        <div className="detail-header">
          <span className="detail-type">{TYPE_NAMES[auction.auction_type]}</span>
          <h1>{auction.title}</h1>
          {auction.description && <p className="detail-desc">{auction.description}</p>}
          <div className="detail-meta">
            <span>{t('sellerLabel')}: <strong>{auction.seller_name}</strong></span>
            <span className={`detail-timer ${!isActive ? 'ended' : ''}`}>{timeLeft}</span>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="price-display">
          <div className="price-box main-price">
            <span className="price-label">{auction.auction_type === 'dutch' ? t('currentDroppingPrice') : t('currentPrice')}</span>
            <span className="price-amount">${auction.current_price?.toFixed(2)}</span>
          </div>
          <div className="price-box">
            <span className="price-label">{t('startingPrice')}</span>
            <span className="price-amount secondary">${auction.starting_price?.toFixed(2)}</span>
          </div>
          {auction.reserve_price > 0 && (
            <div className="price-box">
              <span className="price-label">{t('reserve')}</span>
              <span className="price-amount secondary">${auction.reserve_price?.toFixed(2)}</span>
            </div>
          )}
          <div className="price-box">
            <span className="price-label">{t('totalBids')}</span>
            <span className="price-amount secondary">{bidCount}</span>
          </div>
        </div>

        {auction.status === 'ended' && (
          <div className="winner-banner">
            {auction.winner_id ? (
              <div>
                <h3>🏆 {isWinner ? t('youWon') : t('auctionWon')}</h3>
                <p>{t('winner')}: <span className="winner-name">{auction.winner_name || 'Unknown'}</span></p>
                <p>{t('finalPrice')}: <strong>${auction.current_price?.toFixed(2)}</strong></p>
                {auction.auction_type === 'vickrey' && <p className="vickrey-note">{t('vickreyNote')}</p>}
              </div>
            ) : (
              <div>
                <h3>{t('noWinner')}</h3>
                <p>{t('noWinnerDesc')}</p>
              </div>
            )}
          </div>
        )}

        {isActive && user && !isSeller && (
          <BidPanel auction={auction} token={token} onBidPlaced={fetchAuction} />
        )}
        {isActive && !user && (
          <div className="bid-panel">
            <h3>{t('wantToBid')}</h3>
            <p className="hint">{t('loginToBid')}</p>
          </div>
        )}
        {isActive && user && isSeller && (
          <div className="bid-panel">
            <h3>{t('yourAuction')}</h3>
            <p className="hint">{t('cantBidOwn')}</p>
          </div>
        )}

        {/* Delete button for seller if no bids */}
        {isSeller && bidCount === 0 && (
          <div className="delete-section">
            <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? t('deleting') : t('deleteAuction')}
            </button>
          </div>
        )}

        <div className="bid-history">
          <h3>{t('bidHistory')}</h3>
          {bids.length === 0 ? (
            <p className="no-bids">{t('noBidsYet')}</p>
          ) : (
            <div className="bid-list">
              {bids.map((bid, i) => (
                <div key={bid.id || i} className="bid-item">
                  <span className="bid-rank">#{i + 1}</span>
                  <span className="bid-bidder">{bid.bidder_name}</span>
                  <span className="bid-amount">
                    {bid.amount === '***sealed***' ? t('sealed') : `$${parseFloat(bid.amount).toFixed(2)}`}
                  </span>
                  <span className="bid-time">{new Date(bid.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="detail-sidebar">
        <GameTheoryInsights insights={insights} auction={auction} bidCount={bidCount} />
      </div>
    </div>
  );
}
