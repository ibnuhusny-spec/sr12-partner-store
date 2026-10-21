import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, ShieldCheck } from 'lucide-react';

interface DistributorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DistributorLoginModal: React.FC<DistributorLoginModalProps> = ({ isOpen, onClose }) => {
  const { currentStore, loginDistributor, setIsPosOpen } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginDistributor(pin)) {
      setError(false);
      onClose();
      setIsPosOpen(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '380px' }}
      >
        <div className="modal-header-gradient">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#fde68a" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Login Pemilik Toko</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '4px' }}>
            Masuk ke Backoffice Toko:
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            {currentStore.storeName}
          </h4>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              autoFocus
              maxLength={6}
              placeholder="Masukkan PIN Admin (Demo: 1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: error ? '2px solid #ef4444' : '1.5px solid #cbd5e1',
                textAlign: 'center',
                fontSize: '1.1rem',
                letterSpacing: '0.15em',
                fontWeight: 800
              }}
            />
            {error && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                PIN toko salah! (Default demo: 1234)
              </span>
            )}
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.88rem',
                boxShadow: '0 4px 12px rgba(5,150,105,0.35)'
              }}
            >
              Masuk ke Olsera POS
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
