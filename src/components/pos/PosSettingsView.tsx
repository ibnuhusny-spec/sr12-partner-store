import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Store } from '../../types';
import { STORE_CONFIG } from '../../config/storeConfig';
import { Settings, Image, Sparkles, Check, Save, Upload, RefreshCw } from 'lucide-react';
import { compressImageToBase64 } from '../../services/catalogService';

export const PosSettingsView: React.FC = () => {
  const { currentStore } = useApp();
  
  const [storeName, setStoreName] = useState(currentStore.storeName || STORE_CONFIG.storeName);
  const [storeTagline, setStoreTagline] = useState(currentStore.storeTagline || STORE_CONFIG.storeTagline);
  const [heroBannerUrl, setHeroBannerUrl] = useState(currentStore.heroBannerUrl || '/assets/hero-banner.jpg');
  const [storeWaNumber, setStoreWaNumber] = useState(currentStore.storeWaNumber || STORE_CONFIG.storeWaNumber);
  const [storeCity, setStoreCity] = useState(currentStore.storeCity || STORE_CONFIG.storeCity);
  const [storeOwner, setStoreOwner] = useState(currentStore.storeOwner || STORE_CONFIG.storeOwner);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Preset banner estetik SR12: Murni Alam, Daun Herbal, Kosmetik, Botani (Bebas dari gambar manusia / makhluk bernyawa)
  const BANNER_PRESETS = [
    {
      name: 'Default Natural SR12',
      url: '/assets/hero-banner.jpg'
    },
    {
      name: 'Herbal Leaf & Fresh Dew',
      url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Botanic Greenery & Plants',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Natural Skincare Herbal Bottles',
      url: 'https://images.unsplash.com/photo-1608248597359-0f04c6f592ba?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Emerald Forest Nature',
      url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Minimalist Botanical Wood & Leaf',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Soft Herbal Tea & Pure Water',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Olive & Herbal Organic Extracts',
      url: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=1600&auto=format&fit=crop'
    }
  ];

  // Upload foto banner manual langsung dari HP / Laptop (Konversi ke Base64 cepat)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10 MB');
      return;
    }

    setIsUploading(true);
    try {
      // Kompres ukuran banner maksimal lebar 1600px dengan kualitas prima
      const base64Url = await compressImageToBase64(file, 1600, 0.85);
      setHeroBannerUrl(base64Url);
    } catch (err) {
      console.error('Gagal memproses gambar banner:', err);
      alert('Gagal memproses gambar dari perangkat.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStore: Store = {
      ...currentStore,
      storeName,
      storeTagline,
      heroTitle: storeName,
      heroSubtitle: storeTagline,
      heroBannerUrl,
      storeWaNumber,
      storeCity,
      storeOwner
    };

    try {
      localStorage.setItem('sr12_custom_store_profile', JSON.stringify(updatedStore));
    } catch {}

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '850px', margin: '0 auto', color: '#f8fafc', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
          <Settings size={24} color="#34d399" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Pengaturan Profil &amp; Banner Toko</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            Sesuaikan nama toko, slogan, dan ganti banner etalase utama langsung dari dashboard kasir.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner Preview & Upload Card */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', padding: '16px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={18} color="#38bdf8" />
              <span>Pratinjau Banner Utama Toko:</span>
            </div>

            {/* Tombol Unggah Manual dari HP / PC */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Upload size={14} />
              <span>{isUploading ? 'Memproses...' : 'Unggah Banner dari HP / Laptop'}</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <div style={{ position: 'relative', height: '180px', borderRadius: '12px', overflow: 'hidden', background: '#020617', border: '1px solid #334155' }}>
            <img
              src={heroBannerUrl}
              alt="Preview Banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/hero-banner.jpg';
              }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6, 78, 59, 0.9) 0%, rgba(6, 78, 59, 0.35) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                🌿 TOKO RESMI SR12
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                {storeName}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#d1fae5', maxWidth: '80%' }}>
                {storeTagline}
              </p>
            </div>
          </div>

          {/* Preset Alam & Tumbuhan Herbal (Tanpa Makhluk Bernyawa) */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color="#fde68a" />
              <span>Atau Pilih Banner Herbal Alami SR12 (Bebas Makhluk Bernyawa):</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
              {BANNER_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHeroBannerUrl(p.url)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: heroBannerUrl === p.url ? '1.5px solid #34d399' : '1px solid #334155',
                    background: heroBannerUrl === p.url ? 'rgba(52, 211, 153, 0.15)' : '#1e293b',
                    color: heroBannerUrl === p.url ? '#34d399' : '#cbd5e1',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Biodata Toko */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Nama Toko (Tampil Besar &amp; Cantik di Banner &amp; Header):
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: SR12 Herbal Cantik Alami"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Slogan / Tagline Toko:
            </label>
            <input
              type="text"
              value={storeTagline}
              onChange={(e) => setStoreTagline(e.target.value)}
              placeholder="Contoh: Distributor Resmi SR12 Skin Care & Herbal Alami BPOM & Halal MUI"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Nomor WhatsApp Toko:
              </label>
              <input
                type="text"
                value={storeWaNumber}
                onChange={(e) => setStoreWaNumber(e.target.value)}
                placeholder="62812xxxxxxx"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Kota / Domisili Toko:
              </label>
              <input
                type="text"
                value={storeCity}
                onChange={(e) => setStoreCity(e.target.value)}
                placeholder="Contoh: Jakarta"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}
        >
          {isSaved ? (
            <>
              <Check size={20} />
              <span>Profil &amp; Banner Berhasil Disimpan!</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Simpan Perubahan Tampilan Toko</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
