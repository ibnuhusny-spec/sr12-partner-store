import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { SafeModalOverlay } from '../common/SafeModalOverlay';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { openWhatsAppUrl } from '../../services/orderService';
import { verifyMitraDiscount } from '../../services/mitraService';
import { X, MessageCircle, Copy, Share2, Check, Award } from 'lucide-react';

interface ShareModalProps {
  product: Product | null;
  onClose: () => void;
}

interface SavedAffiliate {
  partnerCode: string;
  name: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ product, onClose }) => {
  const { currentStore, activeTier, verifiedMitra } = useApp();
  const [copied, setCopied] = useState(false);
  const [copiedStoreAffiliate, setCopiedStoreAffiliate] = useState(false);

  const [isSharingImage, setIsSharingImage] = useState(false);
  const storageKey = `sr12_marketer_affiliate_${currentStore.slug}`;

  const [savedAffiliate, setSavedAffiliate] = useState<SavedAffiliate | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [showAffiliateInput, setShowAffiliateInput] = useState(false);
  const [affiliateQuery, setAffiliateQuery] = useState('');
  const [affiliateError, setAffiliateError] = useState('');
  const [isVerifyingAffiliate, setIsVerifyingAffiliate] = useState(false);

  useEffect(() => {
    if (!savedAffiliate && verifiedMitra?.tier === 'marketer' && verifiedMitra.partnerCode) {
      const nextAff: SavedAffiliate = {
        partnerCode: verifiedMitra.partnerCode.toUpperCase(),
        name: verifiedMitra.name || verifiedMitra.partnerCode.toUpperCase()
      };
      setSavedAffiliate(nextAff);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextAff));
      } catch {}
    }
  }, [verifiedMitra, savedAffiliate, storageKey]);

  if (!product) return null;

  const effectiveTier = savedAffiliate ? 'konsumen' : activeTier;
  // Hitung harga sesuai level tier yang sedang aktif (link affiliate Marketer memakai HET agar komisi 15% + omset HET penuh)
  const currentPrice = getProductTierPrice(product.het, effectiveTier);
  const tierInfo = SR12_TIERS[effectiveTier];
  const isDiscounted = effectiveTier !== 'konsumen' && effectiveTier !== 'marketer' && currentPrice < product.het;

  // Format tautan singkat dan rapi dengan parameter tier & referral marketer jika aktif
  // Contoh: https://sr12-partner-store.vercel.app/p?product=sr12-acne-total-tube-10g&store=sr12-central&ref=MK-301
  const origin = window.location.origin;
  const tierParam = effectiveTier !== 'konsumen' ? `&tier=${encodeURIComponent(effectiveTier)}` : '';
  const refParam = savedAffiliate ? `&ref=${encodeURIComponent(savedAffiliate.partnerCode)}` : '';
  const shortShareLink = `${origin}/p?product=${encodeURIComponent(product.id)}&store=${encodeURIComponent(currentStore.slug)}${tierParam}${refParam}`;
  const storeAffiliateLink = savedAffiliate ? `${origin}/?ref=${encodeURIComponent(savedAffiliate.partnerCode)}` : '';
  const directLink = shortShareLink;

  const handleVerifyAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = affiliateQuery.trim();
    if (!cleanInput) {
      setAffiliateError('Masukkan Kode Marketer atau No. WA yang terdaftar.');
      return;
    }

    setIsVerifyingAffiliate(true);
    setAffiliateError('');
    try {
      const res = await verifyMitraDiscount(cleanInput, currentStore.slug);
      if (!res.found || !res.mitra?.partnerCode) {
        setAffiliateError('Kode atau No. WA belum terdaftar di database Mitra toko ini.');
        return;
      }

      if (res.mitra.tier !== 'marketer') {
        const tierLabel = res.mitra.tier ? (SR12_TIERS[res.mitra.tier]?.name || res.mitra.tier) : 'Mitra';
        setAffiliateError(`Akun ${res.mitra.name || res.mitra.partnerCode} berstatus ${tierLabel}. Link Affiliate Komisi 15% khusus untuk Mitra Marketer.`);
        return;
      }

      const nextAff: SavedAffiliate = {
        partnerCode: res.mitra.partnerCode.toUpperCase(),
        name: res.mitra.name || res.mitra.partnerCode.toUpperCase()
      };
      setSavedAffiliate(nextAff);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextAff));
      } catch {}
      setShowAffiliateInput(false);
      setAffiliateQuery('');
    } catch {
      setAffiliateError('Gagal memverifikasi kode Marketer. Periksa koneksi Anda.');
    } finally {
      setIsVerifyingAffiliate(false);
    }
  };

  const handleClearAffiliate = () => {
    setSavedAffiliate(null);
    setAffiliateError('');
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const benefitsText = `✅ 100% Produk Herbal Terdaftar BPOM & Halal MUI\n✅ Formulasi Lembut & Aman Digunakan Tiap Hari\n✅ Garansi Keaslian Resmi Pabrik PT SR12`;

  const promoCopywriting = `✨ *PROMO SPESIAL${effectiveTier !== 'konsumen' ? ` (${tierInfo.name.toUpperCase()})` : ''}: ${product.name.toUpperCase()}* ✨
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
    <SafeModalOverlay onClose={onClose}>
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

          {/* Mode Link Affiliate Marketer (Komisi 15% + Omset HET) */}
          {savedAffiliate ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ecfdf5, #eef2ff)',
                border: '1px solid #10b981',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Award size={15} color="#059669" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Link Affiliate Aktif: {savedAffiliate.name} (#{savedAffiliate.partnerCode})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAffiliate}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Nonaktifkan
                </button>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#047857', lineHeight: 1.35 }}>
                Pembelian lewat link di bawah otomatis mencatat <b>Komisi 15%</b> &amp; menambah <b>Omset HET</b> Anda.
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                <input
                  type="text"
                  readOnly
                  value={storeAffiliateLink}
                  style={{
                    flex: 1,
                    padding: '6px 9px',
                    borderRadius: '7px',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.72rem',
                    background: '#ffffff',
                    color: '#065f46'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(storeAffiliateLink);
                    setCopiedStoreAffiliate(true);
                    setTimeout(() => setCopiedStoreAffiliate(false), 2000);
                  }}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    fontSize: '0.71rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedStoreAffiliate ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedStoreAffiliate ? 'Link Toko Tersalin' : 'Salin Link Toko'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px dashed #94a3b8'
              }}
            >
              {!showAffiliateInput ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Award size={14} color="#6366f1" />
                    Mitra Marketer? Sematkan kode Anda (Komisi 15%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAffiliateInput(true)}
                    style={{
                      background: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Buat Link Affiliate
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyAffiliate} style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                      Masukkan Kode Marketer / No. WA Terdaftar:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAffiliateInput(false);
                        setAffiliateError('');
                      }}
                      style={{ background: 'transparent', border: 'none', fontSize: '0.7rem', color: '#64748b', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Contoh: MK-301 atau 0812..."
                      value={affiliateQuery}
                      onChange={(e) => setAffiliateQuery(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '7px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.78rem',
                        color: '#0f172a',
                        background: '#ffffff'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingAffiliate}
                      style={{
                        background: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '7px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: isVerifyingAffiliate ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isVerifyingAffiliate ? 'Cek...' : 'Aktifkan'}
                    </button>
                  </div>
                  {affiliateError && (
                    <div style={{ fontSize: '0.71rem', color: '#dc2626', fontWeight: 600 }}>
                      {affiliateError}
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Kotak Link Khusus Produk */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '5px' }}>
              {savedAffiliate ? `Link Affiliate Produk (#${savedAffiliate.partnerCode}):` : 'Link Khusus Produk Ini:'}
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
    </SafeModalOverlay>
  );
};
