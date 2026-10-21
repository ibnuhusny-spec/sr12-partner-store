import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Eye, X } from 'lucide-react';

export const NotificationChime: React.FC = () => {
  const { realtimeOrderAlert, dismissOrderAlert, setIsPosOpen } = useApp();

  if (!realtimeOrderAlert) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        right: '20px',
        zIndex: 99999,
        maxWidth: '380px',
        width: 'calc(100% - 40px)',
        background: '#ffffff',
        border: '2px solid #10b981',
        borderRadius: '16px',
        padding: '14px 16px',
        boxShadow: '0 15px 35px -5px rgba(0,0,0,0.3)',
        animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            flexShrink: 0
          }}
        >
          <Bell size={20} className="pulse-chime" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔔 Pesanan Baru Masuk!
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
            {realtimeOrderAlert.customerName} ({realtimeOrderAlert.tierLabel})
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
            Rp {realtimeOrderAlert.grandTotal.toLocaleString('id-ID')} &bull; {realtimeOrderAlert.items.length} jenis produk
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                dismissOrderAlert();
                setIsPosOpen(true);
              }}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Eye size={13} />
              <span>Cek Pesanan</span>
            </button>
            <button
              type="button"
              onClick={dismissOrderAlert}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              Tutup
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissOrderAlert}
          style={{ color: '#94a3b8', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
