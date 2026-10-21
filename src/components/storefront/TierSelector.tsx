import React from 'react';
import { useApp } from '../../context/AppContext';
import { SR12_TIERS } from '../../config/tiers';
import { PartnerTier } from '../../types';
import { Tag, Sparkles } from 'lucide-react';

export const TierSelector: React.FC = () => {
  const { activeTier, setActiveTier } = useApp();

  const tierKeys: PartnerTier[] = ['konsumen', 'marketer', 'reseller', 'sub_agen', 'agen', 'distributor'];

  return (
    <div className="tier-selector-banner" id="tierSelectorSection">
      <div className="tier-header-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={16} color="#059669" />
          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
            Simulasi Level Harga:
          </span>
        </div>
        <span className="tier-swipe-hint">
          <Sparkles size={11} color="#f59e0b" />
          <span>Geser untuk level kemitraan</span>
        </span>
      </div>

      <div className="tier-pill-group" role="tablist" aria-label="Level Harga Mitra SR12">
        {tierKeys.map(tKey => {
          const t = SR12_TIERS[tKey];
          const isSelected = activeTier === tKey;
          return (
            <button
              key={tKey}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`tier-pill ${isSelected ? 'active' : ''}`}
              onClick={() => setActiveTier(tKey)}
              title={t.description}
            >
              <span className="tier-pill-label">{t.label}</span>
              {t.discountPct > 0 ? (
                <span className="tier-discount-badge">
                  -{t.discountPct}%
                </span>
              ) : (
                <span className="tier-het-badge">
                  HET
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

