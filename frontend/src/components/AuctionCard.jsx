import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

const TYPE_COLORS = {
  english: '#059669',
  dutch: '#d97706',
  sealed_first: '#7c3aed',
  vickrey: '#2563eb',
};

function timeLeft(endTime, t) {
  const diff = new Date(endTime) - new Date();
  if (diff <= 0) return t('ended');
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatPrice(price) {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

export default function AuctionCard({ auction }) {
  const { t } = useLang();
  const typeKey = { english: 'english', dutch: 'dutch', sealed_first: 'sealedFirst', vickrey: 'vickrey' };
  const typeIcons = { english: '🔼', dutch: '🔽', sealed_first: '📨', vickrey: '🏆' };
  const color = TYPE_COLORS[auction.auction_type] || '#888';
  const isEnded = auction.status === 'ended';
  const remaining = timeLeft(auction.end_time, t);
  const bidCount = auction.bid_count || 0;
  const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const imgUrl = auction.image_url ? (auction.image_url.startsWith('http') ? auction.image_url : `${API_ROOT}${auction.image_url}`) : null;

  return (
    <Link to={`/auction/${auction.id}`} className="auction-card">
      {imgUrl && (
        <div className="card-image">
          <img src={imgUrl} alt={auction.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px 12px 0 0', marginBottom: '12px' }} />
        </div>
      )}
      <div className="card-header">
        <span className="type-badge" style={{ backgroundColor: color }}>
          {typeIcons[auction.auction_type]} {t(typeKey[auction.auction_type] || 'english')}
        </span>
        <span className={`time-badge ${isEnded ? 'ended' : ''}`}>
          {isEnded ? `✓ ${t('ended')}` : `⏱ ${remaining}`}
        </span>
      </div>
      <h3 className="card-title">{auction.title}</h3>
      <p className="card-desc">{auction.description?.slice(0, 100)}{auction.description?.length > 100 ? '...' : ''}</p>
      <div className="card-footer">
        <div className="price-section">
          <span className="price-label">{t('currentPrice')}</span>
          <span className="price-value">${formatPrice(auction.current_price)}</span>
        </div>
        <div className="bids-section">
          <span className="bid-count">{bidCount} {bidCount === 1 ? t('bid') : t('bids')}</span>
          <span className="seller">{t('seller')}: {auction.seller_name}</span>
        </div>
      </div>
    </Link>
  );
}