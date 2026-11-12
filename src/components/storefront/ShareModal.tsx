import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { openWhatsAppUrl } from '../../services/orderService';
import { X, MessageCircle, Copy, Share2, Check } from 'lucide-react';

interface ShareModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ product, onClose }) => {
  const { currentStore, activeTier } = useApp();
  const [copied, setCopied] = useState(false);

  const [isSharingImage, setIsSharingImage] = useState(false);

  if (!product) return null;

  // Hitung harga sesuai level tier yang sedang aktif (Konsumen, Marketer, Reseller, Sub Agen, dll)
  const currentPrice = getProductTierPrice(product.het, activeTier);
  const tierInfo = SR12_TIERS[activeTier];
  const isDiscounted = activeTier !== 'konsumen' && activeTier !== 'marketer' && currentPrice < product.het;

  // Format tautan singkat dan rapi dengan parameter tier jika bukan konsumen
  // Contoh: https://sr12-partner-store.vercel.app/p?product=sr12-acne-total-tube-10g&store=sr12-central&tier=reseller
  const origin = window.location.origin;
  const tierParam = activeTier !== 'konsumen' ? `&tier=${encodeURIComponent(activeTier)}` : '';
  const shortShareLink = `${origin}/p?product=${encodeURIComponent(product.id)}&store=${encodeURIComponent(currentStore.slug)}${tierParam}`;
  const directLink = shortShareLink;

  const benefitsText = `✅ 100% Produk Herbal Terdaftar BPOM & Halal MUI\n✅ Formulasi Lembut & Aman Digunakan Tiap Hari\n✅ Garansi Keaslian Resmi Pabrik PT SR12`;

  const promoCopywriting = `✨ *PROMO SPESIAL${activeTier !== 'konsumen' ? ` (${tierInfo.name.toUpperCase()})` : ''}: ${product.name.toUpperCase()}* ✨
${product.summary || 'Produk perawatan kulit herbal berkualitas resmi SR12.'} 🌿

⭐ *Rating Pembeli:* 4.9 / 5.0 (Terbukti Berkhasiat)
🛡️ *Izin Edar Resmi:* 100% Terverifikasi BPOM & Halal MUI

🔥 *Keunggulan Produk:*
${benefitsText}

💰 *Harga Spesial:* Rp ${currentPrice.toLocaleString('id-ID')}${isDiscounted ? ` (Harga Normal: Rp ${product.het.toLocaleString('id-ID')})` : ''}
🚚 *Pengiriman Cepat, Aman & Garansi Original!*

👇 *Beli & Lihat Detail Produk Langsung di Toko Resmi (${currentStore.storeName}):*
${shortShareLink}

Silakan klik tautan di atas untuk melihat katalog lengkap & langsung order via WhatsApp! 🌸`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortShareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderImageUrlToJpegFile = async (src: string, fileName: string): Promise<File | null> => {
    try {
      const img = new Image();
      if (!src.startsWith('data:') && !src.startsWith('/')) {
        img.crossOrigin = 'anonymous';
      }
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = src;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 800);
      ctx.drawImage(img, 0, 0, 800, 800);
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.9));
      return blob ? new File([blob], fileName, { type: 'image/jpeg' }) : null;
    } catch {
      return null;
    }
  };

  const buildShareImageFile = async (imageSrc: string | undefined, cleanProdId: string): Promise<File | null> => {
    const fileName = `${cleanProdId}.jpg`;
    if (imageSrc) {
      // 1. Gambar SVG harus dikonversi ke JPEG asli dulu (karena SVG dimulai dengan "data:image" juga)
      if (imageSrc.startsWith('data:image/svg') || imageSrc.toLowerCase().includes('.svg')) {
        const converted = await renderImageUrlToJpegFile(imageSrc, fileName);
        if (converted) return converted;
      }

      // 2. Gambar Base64 raster (PNG/JPG/WebP) atau URL eksternal / aset lokal
      try {
        const res = await fetch(imageSrc);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.type && !blob.type.includes('svg')) {
            return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
          }
          const converted = await renderImageUrlToJpegFile(imageSrc, fileName);
          if (converted) return converted;
        }
      } catch {
        const converted = await renderImageUrlToJpegFile(imageSrc, fileName);
        if (converted) return converted;
      }
    }

    // 3. Fallback ke foto produk standar lokal
    try {
      const fallbackRes = await fetch('/assets/deodorant-spray-square.jpg');
      if (fallbackRes.ok) {
        const blob = await fallbackRes.blob();
        return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      }
    } catch {}

    return null;
  };

  /**
   * Kirim Foto Asli Produk + Teks Promosi Lengkap ke WhatsApp (Shopee Style)
   * Menggunakan Web Share API files: [File JPEG asli] dan membuka WA langsung di HP tanpa kena blokir pop-up.
   */
  const handleShareWithPhoto = async () => {
    setIsSharingImage(true);

    // Salin teks di latar belakang tanpa menahan gesture klik user
    try {
      navigator.clipboard?.writeText(promoCopywriting).catch(() => {});
    } catch {}

    try {
      const cleanProdId = (product.id || 'produk-sr12').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileToShare = await buildShareImageFile(product.image, cleanProdId);

      // Jalankan Web Share API langsung ke WhatsApp / HP
      if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        setIsSharingImage(false);
        await navigator.share({
          files: [fileToShare],
          title: product.name,
          text: promoCopywriting
        });
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setIsSharingImage(false);
        return;
      }
      console.warn('Native photo share failed:', e);
    }

    setIsSharingImage(false);

    // Fallback aman tanpa memicu pop-up blocker HP
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promoCopywriting)}`;
    openWhatsAppUrl(waUrl);
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#065f46' }}>
                  Rp {currentPrice.toLocaleString('id-ID')}
                </span>
                {isDiscounted && (
                  <>
                    <span style={{ fontSize: '0.74rem', textDecoration: 'line-through', color: '#94a3b8' }}>
                      Rp {product.het.toLocaleString('id-ID')}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px' }}>
                      {tierInfo.label}
                    </span>
                  </>
                )}
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

          {/* 3 Tombol Aksi Sesuai Format Klasik */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleWhatsAppShare}
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
                  cursor: isSharingImage ? 'wait' : 'pointer',
                  opacity: isSharingImage ? 0.8 : 1
                }}
              >
                <MessageCircle size={20} />
                <span>{isSharingImage ? 'Menyiapkan Foto Asli...' : 'Kirim Foto Asli ke WhatsApp'}</span>
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
