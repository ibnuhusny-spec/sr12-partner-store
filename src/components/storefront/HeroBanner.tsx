import React from 'react';
import { useApp } from '../../context/AppContext';
import { Award, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { currentStore } = useApp();

  // Sanitize subtitle: ensure no raw JSON or developer config strings are displayed
  const cleanSubtitle = (() => {
    const raw = currentStore.heroSubtitle || currentStore.storeTagline || '';
    if (!raw || raw.trim().startsWith('{') || raw.includes('bankName') || raw.includes('activeTokens') || raw.includes('platformFee')) {
      return 'Dapatkan produk herbal & skin care resmi SR12 terverifikasi BPOM dan Halal MUI dengan harga resmi, jaminan keaslian 100%, serta pengiriman cepat ke seluruh Indonesia.';
    }
    return raw;
  })();

  return (
    <div className="hero-banner-container">
      <div className="hero-banner-card">
        {currentStore.heroBannerUrl && (
          <img
            src={currentStore.heroBannerUrl}
            alt="Hero Banner"
            className="hero-banner-bg-img"
          />
        )}
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={13} color="#fde68a" />
            <span>Katalog Resmi &bull; Pasokan Langsung dari Pabrik SR12</span>
          </div>

          <h2 className="hero-title">{currentStore.heroTitle || currentStore.storeName}</h2>
          <p className="hero-subtitle">
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
                <span className="hero-stat-num">50%</span>
              </div>
              <span className="hero-stat-label">Diskon Kemitraan s/d 50%</span>
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
