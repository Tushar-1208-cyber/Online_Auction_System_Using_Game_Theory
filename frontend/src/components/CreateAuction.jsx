import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function CreateAuction() {
  const { token } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', auction_type: 'english', starting_price: '',
    reserve_price: '', min_increment: '1', dutch_decrement: '10', dutch_interval_sec: '5', duration_minutes: '60',
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const TYPES = [
    { value: 'english', label: '🔼 ' + t('english'), desc: t('englishDesc') },
    { value: 'dutch', label: '🔽 ' + t('dutch'), desc: t('dutchDesc') },
    { value: 'sealed_first', label: '📨 ' + t('sealedFirst'), desc: t('sealedFirstDesc') },
    { value: 'vickrey', label: '🏆 ' + t('vickrey'), desc: t('vickreyDesc') },
  ];

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const selectedType = TYPES.find(tp => tp.value === form.auction_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError(t('titleRequired'));
      return;
    }
    if (!form.starting_price || parseFloat(form.starting_price) <= 0) {
      setError(t('priceRequired'));
      return;
    }
    if (!form.duration_minutes || parseInt(form.duration_minutes) < 1) {
      setError(t('durationRequired'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('auction_type', form.auction_type);
      formData.append('starting_price', parseFloat(form.starting_price));
      formData.append('reserve_price', parseFloat(form.reserve_price) || 0);
      formData.append('min_increment', parseFloat(form.min_increment));
      formData.append('dutch_decrement', parseFloat(form.dutch_decrement));
      formData.append('dutch_interval_sec', parseInt(form.dutch_interval_sec));
      formData.append('duration_minutes', parseInt(form.duration_minutes));
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const auction = await api.createAuction(formData, token);
      navigate(`/auction/${auction.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <div className="create-card">
        <h2>{t('createNewAuction')}</h2>
        <p className="create-subtitle">{t('chooseMechanism')}</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auctionType')}</label>
            <div className="type-selector">
              {TYPES.map(tp => (
                <button
                  key={tp.value}
                  type="button"
                  className={`type-option ${form.auction_type === tp.value ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, auction_type: tp.value }))}
                >
                  <span className="type-label">{tp.label}</span>
                  <span className="type-desc">{tp.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>{t('title')}</label>
            <input type="text" value={form.title} onChange={update('title')} required placeholder={t('titlePlaceholder')} />
          </div>

          <div className="form-group">
            <label>{t('description')}</label>
            <textarea value={form.description} onChange={update('description')} rows={3} placeholder={t('descPlaceholder')} />
          </div>

          <div className="form-group">
            <label>Upload Item Image (Optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ padding: '10px' }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('startingPriceLabel')}</label>
              <input type="number" step="0.01" min="0.01" value={form.starting_price} onChange={update('starting_price')} required />
            </div>
            <div className="form-group">
              <label>{t('reservePriceLabel')}</label>
              <input type="number" step="0.01" min="0" value={form.reserve_price} onChange={update('reserve_price')} placeholder={t('optional')} />
            </div>
          </div>

          {form.auction_type === 'english' && (
            <div className="form-group">
              <label>{t('minIncrementLabel')}</label>
              <input type="number" step="0.01" min="0.01" value={form.min_increment} onChange={update('min_increment')} />
            </div>
          )}

          {form.auction_type === 'dutch' && (
            <div className="form-row">
              <div className="form-group">
                <label>{t('priceDropLabel')}</label>
                <input type="number" step="0.01" min="0.01" value={form.dutch_decrement} onChange={update('dutch_decrement')} />
              </div>
              <div className="form-group">
                <label>{t('dropIntervalLabel')}</label>
                <input type="number" min="1" value={form.dutch_interval_sec} onChange={update('dutch_interval_sec')} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>{t('durationLabel')}</label>
            <input type="number" min="1" value={form.duration_minutes} onChange={update('duration_minutes')} required />
          </div>

          <div className="theory-hint">
            <strong>💡 {selectedType?.label}:</strong> {selectedType?.desc}
          </div>

          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? t('creating') : t('createAuction')}
          </button>
        </form>
      </div>
    </div>
  );
}
