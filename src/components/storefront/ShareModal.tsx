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

  const [isSharingImage, setIsSharingImage] = useState(false);

  if (!product) return null;

  // Build product direct link
  const origin = window.location.origin;
  let imgParam = '';
  if (product.image && product.image.startsWith('http')) {
    imgParam = `&img=${encodeURIComponent(product.image)}`;
  }
  
  const directLink = `${origin}/p?product=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}&price=${product.het}${imgParam}`;

  const promoCopywriting = `*PROMO SPESIAL: ${product.name.toUpperCase()}* 🌿
${product.summary || 'Produk perawatan kulit herbal berkualitas resmi SR12 BPOM & Halal MUI.'}

⭐ *Rating Pembeli:* 4.9 / 5.0 (Terbukti Berkhasiat)
🛡️ *Izin Edar:* BPOM ${product.bpom || 'Resmi'} & Halal MUI
💰 *Harga Promo Toko:* Rp ${product.het.toLocaleString('id-ID')}

👇 *Pesan Langsung di Toko Resmi Kami:*
👉 ${directLink}

📲 WhatsApp CS: wa.me/${currentStore.storeWaNumber.replace(/[^0-9]/g, '')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Kirim Foto Produk ASLI langsung ke WhatsApp (Seperti pada foto contoh yang Anda kirimkan!)
   * Menggunakan Web Share API files: [File] sehingga WhatsApp langsung melampirkan foto besar di atas teks caption!
   */
  const handleShareWithPhoto = async () => {
    setIsSharingImage(true);
    try {
      let fileToShare: File | null = null;

      // 1. Jika gambar berupa Base64 (data:image/...)
      if (product.image && product.image.startsWith('data:image')) {
        const res = await fetch(product.image);
        const blob = await res.blob();
        fileToShare = new File([blob], `${product.id || 'produk-sr12'}.jpg`, { type: blob.type || 'image/jpeg' });
      } 
      // 2. Jika gambar berupa URL HTTPS (Supabase Storage / Web)
      else if (product.image) {
        try {
          const res = await fetch(product.image, { mode: 'cors' });
          const blob = await res.blob();
          fileToShare = new File([blob], `${product.id || 'produk-sr12'}.jpg`, { type: blob.type || 'image/jpeg' });
        } catch {
          // Fallback jika CORS terhalang
          fileToShare = null;
        }
      }

      // 3. Eksekusi Native Share dengan File Gambar jika didukung HP
      if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          files: [fileToShare],
          title: product.name,
          text: promoCopywriting
        });
        setIsSharingImage(false);
        return;
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Native file share failed:', e);
      }
    }

    setIsSharingImage(false);

    // Fallback: Buka URL WhatsApp standar
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promoCopywriting)}`;
    window.open(waUrl, '_blank');
  };

  const handleWhatsAppShare = () => {
    handleShareWithPhoto();
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
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
              Bagikan Langsung dengan Foto Gambar (Shopee Style):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleShareWithPhoto}
                disabled={isSharingImage}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #25d366, #16a34a)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(37,211,102,0.4)',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={20} />
                <span>{isSharingImage ? 'Menyiapkan Foto...' : 'Kirim Foto & Teks ke WhatsApp'}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(promoCopywriting);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copied ? 'Teks Tersalin' : 'Salin Teks'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Share2 size={14} />
                  <span>Aplikasi Lain</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
