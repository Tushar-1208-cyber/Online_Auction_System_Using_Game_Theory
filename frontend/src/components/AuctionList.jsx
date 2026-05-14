import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AuctionCard from './AuctionCard';
import { useLang } from '../context/LanguageContext';

export default function AuctionList() {
  const { t } = useLang();
  const [auctions, setAuctions] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = { status: statusFilter };
    if (filter) params.type = filter;
    if (debouncedSearch) params.search = debouncedSearch;
    api.getAuctions(params)
      .then(setAuctions)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter, statusFilter, debouncedSearch]);

  const AUCTION_TYPES = [
    { value: '', label: t('all') },
    { value: 'english', label: '🔼 ' + t('english') },
    { value: 'dutch', label: '🔽 ' + t('dutch') },
    { value: 'sealed_first', label: '📨 ' + t('sealedFirst') },
    { value: 'vickrey', label: '🏆 ' + t('vickrey') },
  ];

  return (
    <div className="auction-list-page">
      <div className="page-header">
        <div>
          <h1>{t('liveAuctions')}</h1>
          <p className="subtitle">{t('gameTheoreticPlatform')}</p>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="filter-group">
          {AUCTION_TYPES.map(tp => (
            <button
              key={tp.value}
              className={`filter-btn ${filter === tp.value ? 'active' : ''}`}
              onClick={() => setFilter(tp.value)}
            >
              {tp.label}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <button className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>{t('active')}</button>
          <button className={`filter-btn ${statusFilter === 'ended' ? 'active' : ''}`} onClick={() => setStatusFilter('ended')}>{t('ended')}</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">{t('loading')}</div>
      ) : error ? (
        <div className="error-msg">{error}</div>
      ) : auctions.length === 0 ? (
        <div className="empty-state">
          <h3>{t('noAuctionsFound')}</h3>
          <p>{t('tryDifferentFilters')}</p>
        </div>
      ) : (
        <div className="auction-grid">
          {auctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
