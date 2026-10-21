import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, MessageCircle, Copy, Share2, Check } from 'lucide-react';

interface ShareModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ product, onClose }) => {
  const { currentStore } = useApp();
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  // Build product direct link
  const origin = window.location.origin;
  const directLink = `${origin}/?store=${currentStore.slug}&product=${product.id}`;

  const promoCopywriting = `*PROMO SPESIAL SR12 HERBAL SKIN CARE* 🌿
*${product.name}*
Harga Resmi: Rp ${product.het.toLocaleString('id-ID')}
Izin Edar: BPOM ${product.bpom} & Halal MUI

${product.summary}

🛒 *Pesan langsung di Toko Resmi kami:*
👉 ${directLink}

Atau hubungi admin WhatsApp:
📲 wa.me/${currentStore.storeWaNumber.replace(/[^0-9]/g, '')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promoCopywriting)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - ${currentStore.storeName}`,
          text: promoCopywriting,
          url: directLink
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        {/* Header */}
        <div className="modal-header-gradient">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
            Bagikan &amp; Promosikan Produk
          </h3>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Card Preview */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                {product.category}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.summary}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#065f46', marginTop: '4px' }}>
                Rp {product.het.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Kotak Link Khusus Produk */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '5px' }}>
              Link Khusus Produk Ini:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                readOnly
                value={directLink}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.78rem',
                  background: '#f1f5f9',
                  color: '#0f172a'
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: copied ? '#059669' : '#0f172a',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* 3 Tombol Aksi Icon-Only (Sesuai Spesifikasi PANDUAN_SIMULASI_APLIKASI.md) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textAlign: 'center' }}>
              Kirim Teks Promosi Siap Pakai:
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {/* 1. Ikon WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#25d366',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(37,211,102,0.35)',
                  transition: 'transform 0.15s ease'
                }}
                title="Bagikan ke WhatsApp"
                aria-label="Bagikan ke WhatsApp"
              >
                <MessageCircle size={22} />
              </button>

              {/* 2. Ikon Salin Teks */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(promoCopywriting);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(2,132,199,0.35)',
                  transition: 'transform 0.15s ease'
                }}
                title="Salin Seluruh Copywriting Promo"
                aria-label="Salin Teks Promo"
              >
                {copied ? <Check size={22} /> : <Copy size={22} />}
              </button>

              {/* 3. Ikon Share Bawaan HP */}
              <button
                type="button"
                onClick={handleNativeShare}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#475569',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(71,85,105,0.35)',
                  transition: 'transform 0.15s ease'
                }}
                title="Bagikan via Aplikasi Lain di HP"
                aria-label="Bagikan via HP"
              >
                <Share2 size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
