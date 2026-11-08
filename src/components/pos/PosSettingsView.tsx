import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Store } from '../../types';
import { STORE_CONFIG } from '../../config/storeConfig';
import { Settings, Image, Sparkles, Check, Save } from 'lucide-react';

export const PosSettingsView: React.FC = () => {
  const { currentStore } = useApp();
  
  const [storeName, setStoreName] = useState(currentStore.storeName || STORE_CONFIG.storeName);
  const [storeTagline, setStoreTagline] = useState(currentStore.storeTagline || STORE_CONFIG.storeTagline);
  const [heroBannerUrl, setHeroBannerUrl] = useState(currentStore.heroBannerUrl || '/assets/hero-banner.jpg');
  const [storeWaNumber, setStoreWaNumber] = useState(currentStore.storeWaNumber || STORE_CONFIG.storeWaNumber);
  const [storeCity, setStoreCity] = useState(currentStore.storeCity || STORE_CONFIG.storeCity);
  const [storeOwner, setStoreOwner] = useState(currentStore.storeOwner || STORE_CONFIG.storeOwner);
  const [isSaved, setIsSaved] = useState(false);

  // Preset banner resmi SR12 yang estetik dan siap pakai
  const BANNER_PRESETS = [
    {
      name: 'Default Natural SR12',
      url: '/assets/hero-banner.jpg'
    },
    {
      name: 'Herbal Skincare Soft Green',
      url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Beauty Spa & Cosmetics Emerald',
      url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1600&auto=format&fit=crop'
    },
    {
      name: 'Botanical Leaf Elegant Glow',
      url: 'https://images.unsplash.com/photo-1608248597359-0f04c6f592ba?q=80&w=1600&auto=format&fit=crop'
    }
  ];

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
    <div style={{ padding: '24px', maxWidth: '850px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
          <Settings size={24} color="#34d399" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Pengaturan Profil & Banner Toko</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            Sesuaikan nama toko, slogan, dan ganti banner etalase utama langsung dari dashboard.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner Preview Card */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', padding: '16px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image size={18} color="#38bdf8" />
            <span>Pratinjau Banner Utama Toko:</span>
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
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6, 78, 59, 0.9) 0%, rgba(6, 78, 59, 0.4) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
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

          {/* Quick Preset Buttons */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>Pilih Banner Rekomendasi Cepat:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              {BANNER_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHeroBannerUrl(p.url)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: heroBannerUrl === p.url ? '1px solid #34d399' : '1px solid #334155',
                    background: heroBannerUrl === p.url ? 'rgba(52, 211, 153, 0.15)' : '#1e293b',
                    color: heroBannerUrl === p.url ? '#34d399' : '#cbd5e1',
                    fontSize: '0.75rem',
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

        {/* Input Details */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Nama Toko (Tampil Besar &amp; Jelas di Banner &amp; Header):
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: SR12 Cantik Herbal Store"
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
              placeholder="Contoh: Distributor Resmi SR12 Skin Care & Herbal Alami BPOM"
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
              URL Gambar Banner Kustom (Link Foto / Banner Sendiri):
            </label>
            <input
              type="text"
              value={heroBannerUrl}
              onChange={(e) => setHeroBannerUrl(e.target.value)}
              placeholder="https://... (Link Gambar Banner)"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '0.85rem'
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
