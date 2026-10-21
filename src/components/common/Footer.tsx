import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Award, Heart, Phone, MapPin, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  const { currentStore } = useApp();

  return (
    <footer style={{ background: '#090d16', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '40px', paddingBottom: '30px' }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '30px' }}>
        {/* Brand Col */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 900, fontSize: '1.2rem', marginBottom: '10px' }}>
            <span>🌿</span>
            <span>{currentStore.storeName}</span>
          </div>
          <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#64748b', marginBottom: '14px' }}>
            {currentStore.storeTagline || 'Pusat Distribusi & Penjualan Resmi Produk SR12 Herbal Skin Care Indonesia.'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              BPOM Terverifikasi
            </span>
            <span style={{ fontSize: '0.7rem', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              Halal MUI
            </span>
          </div>
        </div>

        {/* Contact Col */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px' }}>
            Kontak &amp; Gudang Toko
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={15} color="#38bdf8" />
              <span>{currentStore.storeCity}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={15} color="#34d399" />
              <span>WhatsApp CS: {currentStore.storeWaNumber}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color="#f59e0b" />
              <span>Senin - Sabtu: 08.00 - 21.00 WIB</span>
            </div>
          </div>
        </div>

        {/* Legal & Guarantee Col */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px' }}>
            Jaminan Pembelian
          </h4>
          <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#64748b' }}>
            Seluruh produk yang kami distribusikan dijamin 100% Asli dari Pabrik PT SR12 Herbal Perkasa. Tersegel rapi dengan nomor bets dan tanggal kedaluwarsa resmi.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1380px', margin: '30px auto 0', padding: '20px 20px 0', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: '#475569' }}>
        <div>
          &copy; {new Date().getFullYear()} {currentStore.storeName} &bull; SR12 Herbal Skin Care Partner Ecosystem
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Dikelola dengan</span>
          <Heart size={12} color="#ef4444" fill="#ef4444" />
          <span>untuk Kemitraan SR12 se-Indonesia</span>
        </div>
      </div>
    </footer>
  );
};
