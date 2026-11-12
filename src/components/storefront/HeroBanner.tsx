import React from 'react';
import { useApp } from '../../context/AppContext';
import { getAllowedDownlineTiers, SR12_TIERS } from '../../config/tiers';
import { Award, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { currentStore } = useApp();

  const maxBuyerDiscountPct = getAllowedDownlineTiers(currentStore.partnerTier).reduce(
    (max, t) => Math.max(max, SR12_TIERS[t]?.discountPct || 0),
    0
  );

  // Sanitize subtitle: ensure no raw JSON or developer config strings are displayed
  const cleanSubtitle = (() => {
    const raw = currentStore.heroSubtitle || currentStore.storeTagline || '';
    if (!raw || raw.trim().startsWith('{') || raw.includes('bankName') || raw.includes('activeTokens') || raw.includes('platformFee')) {
      return 'Dapatkan produk herbal & skin care resmi SR12 terverifikasi BPOM dan Halal MUI dengan harga resmi, jaminan keaslian 100%, serta pengiriman cepat ke seluruh Indonesia.';
    }
    return raw;
  })();

  return (
    <div className="hero-banner-container" style={{ margin: '15px auto', maxWidth: '1380px', padding: '0 16px' }}>
      <div
        className="hero-banner-card"
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.4)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          minHeight: '260px'
        }}
      >
        {currentStore.heroBannerUrl && (
          <img
            src={currentStore.heroBannerUrl}
            alt="Hero Banner"
            className="hero-banner-bg-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div className="hero-content" style={{ padding: '36px 28px', maxWidth: '780px' }}>
          <div className="hero-badge" style={{ fontSize: '0.82rem', padding: '6px 14px', marginBottom: '14px' }}>
            <Sparkles size={14} color="#fde68a" />
            <span>Katalog Resmi &bull; Pasokan Langsung dari Gudang SR12</span>
          </div>

          <h2
            className="hero-title"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 900,
              letterSpacing: '-0.5px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              marginBottom: '12px'
            }}
          >
            {currentStore.heroTitle || currentStore.storeName}
          </h2>
          <p
            className="hero-subtitle"
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#ecfdf5',
              maxWidth: '650px',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              marginBottom: '20px'
            }}
          >
            {cleanSubtitle}
          </p>

          <div className="hero-stats-row">
            <div className="hero-stat-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={16} color="#34d399" />
                <span className="hero-stat-num">100%</span>
              </div>
              <span className="hero-stat-label">Herbal BPOM & Halal</span>
            </div>

            <div className="hero-stat-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Award size={16} color="#fde68a" />
                <span className="hero-stat-num">{maxBuyerDiscountPct > 0 ? `${maxBuyerDiscountPct}%` : '15%'}</span>
              </div>
              <span className="hero-stat-label">
                {maxBuyerDiscountPct > 0 ? `Diskon Kemitraan s/d ${maxBuyerDiscountPct}%` : 'Komisi Marketer 15%'}
              </span>
            </div>

            <div className="hero-stat-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={16} color="#67e8f9" />
                <span className="hero-stat-num">Ready</span>
              </div>
              <span className="hero-stat-label">Stok Gudang Terverifikasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
