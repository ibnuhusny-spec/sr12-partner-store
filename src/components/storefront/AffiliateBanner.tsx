import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, User } from 'lucide-react';

export const AffiliateBanner: React.FC = () => {
  const { marketerReferral } = useApp();

  if (!marketerReferral) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '0.82rem',
        fontWeight: 700,
        boxShadow: '0 2px 10px rgba(2,132,199,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      <Sparkles size={16} color="#fde68a" />
      <span>
        Anda berbelanja melalui tautan promosi Mitra Marketer: <b>{marketerReferral}</b>
      </span>
      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '999px' }}>
        Diskon &amp; Pelayanan Prioritas
      </span>
    </div>
  );
};
