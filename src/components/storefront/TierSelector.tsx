import React from 'react';
import { useApp } from '../../context/AppContext';
import { SR12_TIERS } from '../../config/tiers';
import { PartnerTier } from '../../types';
import { Tag } from 'lucide-react';

export const TierSelector: React.FC = () => {
  const { activeTier, setActiveTier } = useApp();

  const tierKeys: PartnerTier[] = ['konsumen', 'marketer', 'reseller', 'sub_agen', 'agen', 'distributor'];

  return (
    <div className="tier-selector-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tag size={16} color="#059669" />
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
          Simulasi Level Harga:
        </span>
      </div>

      <div className="tier-pill-group">
        {tierKeys.map(tKey => {
          const t = SR12_TIERS[tKey];
          const isSelected = activeTier === tKey;
          return (
            <button
              key={tKey}
              type="button"
              className={`tier-pill ${isSelected ? 'active' : ''}`}
              onClick={() => setActiveTier(tKey)}
              title={t.description}
            >
              <span>{t.label}</span>
              {t.discountPct > 0 && (
                <span
                  style={{
                    marginLeft: '4px',
                    fontSize: '0.7rem',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    padding: '1px 5px',
                    borderRadius: '999px'
                  }}
                >
                  -{t.discountPct}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
