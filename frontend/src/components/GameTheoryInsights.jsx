import { useLang } from '../context/LanguageContext';

export default function GameTheoryInsights({ insights, auction, bidCount }) {
  const { t } = useLang();
  if (!insights) return null;

  return (
    <div className="gt-insights">
      <h3>{t('gameTheoryAnalysis')}</h3>

      <div className="insight-card highlight">
        <h4>{insights.type}</h4>
        <p className="insight-strategy">{insights.dominantStrategy}</p>
      </div>

      <div className="insight-card">
        <h4>{t('strategicInsight')}</h4>
        <p>{insights.insight}</p>
      </div>

      <div className="insight-card">
        <h4>{t('bayesianNash')}</h4>
        <code className="formula">{insights.bayesianNash}</code>
      </div>

      <div className="insight-card">
        <h4>{t('revenueEquivalence')}</h4>
        <p>{insights.expectedRevenue}</p>
      </div>

      <div className="insight-card">
        <h4>{t('riskConsiderations')}</h4>
        <p>{insights.riskNote}</p>
      </div>

      <div className="insight-card info">
        <h4>{t('auctionStats')}</h4>
        <div className="stat-row">
          <span>{t('bidders')}:</span>
          <span>{bidCount}</span>
        </div>
        <div className="stat-row">
          <span>{t('type')}:</span>
          <span>{auction.auction_type}</span>
        </div>
        <div className="stat-row">
          <span>{t('mechanism')}:</span>
          <span>{auction.auction_type === 'vickrey' ? t('incentiveCompatible') : t('strategic')}</span>
        </div>
      </div>

      <div className="insight-card theory">
        <h4>{t('keyTheorems')}</h4>
        <ul>
          <li><strong>{t('revenueEquivalenceLabel')}</strong> {t('revenueEquivalenceTheorem')}</li>
          <li><strong>{t('winnersCurseLabel')}</strong> {t('winnersCurse')}</li>
          <li><strong>{t('myersonLabel')}</strong> {t('myersonOptimal')}</li>
        </ul>
      </div>
    </div>
  );
}
