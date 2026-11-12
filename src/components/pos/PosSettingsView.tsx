import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PartnerTier, Store } from '../../types';
import { STORE_CONFIG } from '../../config/storeConfig';
import { getAllowedDownlineTiers, getStoreTierEconomics, SR12_TIERS } from '../../config/tiers';
import { Settings, Image, Sparkles, Check, Save, Upload, RefreshCw, KeyRound, Mail, Lock, MapPin, Search, Award, Cloud, Loader2 } from 'lucide-react';
import { uploadProductImageFile } from '../../services/catalogService';
import { searchOngkirDestinations, OngkirDestination } from '../../services/ongkirService';
import { getStoreCashiers, saveStoreCashiers, getActiveCashier, setActiveCashier } from '../../services/posService';
import { saveStoreProfileToCloud } from '../../services/storeService';
import { normalizeWhatsAppNumber } from '../../services/orderService';

export const PosSettingsView: React.FC = () => {
  const { currentStore, refreshStores } = useApp();
  
  const [storeName, setStoreName] = useState(currentStore.storeName || STORE_CONFIG.storeName);
  const [storeTagline, setStoreTagline] = useState(currentStore.storeTagline || STORE_CONFIG.storeTagline);
  const [heroBannerUrl, setHeroBannerUrl] = useState(currentStore.heroBannerUrl || '/assets/hero-banner.jpg');
  const [storeWaNumber, setStoreWaNumber] = useState(currentStore.storeWaNumber || STORE_CONFIG.storeWaNumber);
  const [storeCity, setStoreCity] = useState(currentStore.storeCity || STORE_CONFIG.storeCity);
  const [storeOwner, setStoreOwner] = useState(currentStore.storeOwner || STORE_CONFIG.storeOwner);
  const [partnerTier, setPartnerTier] = useState<PartnerTier>(currentStore.partnerTier || STORE_CONFIG.partnerTier || 'distributor');
  const [recommenderWa, setRecommenderWa] = useState(currentStore.recommenderWa || '');

  // Lokasi Asal Gudang Toko (RajaOngkir Origin)
  const [originSubdistrictId, setOriginSubdistrictId] = useState<number>(currentStore.originSubdistrictId || STORE_CONFIG.originSubdistrictId || 17473);
  const [originLabel, setOriginLabel] = useState<string>(currentStore.originLabel || STORE_CONFIG.originLabel || 'Jakarta Barat (DKI Jakarta)');
  const [originSearch, setOriginSearch] = useState<string>('');
  const [originOptions, setOriginOptions] = useState<OngkirDestination[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);

  // Akun Login & Keamanan Toko
  const [ownerEmail, setOwnerEmail] = useState(currentStore.ownerEmail || STORE_CONFIG.ownerEmail || 'admin@sr12.co.id');
  const [adminPassword, setAdminPassword] = useState(currentStore.adminPassword || STORE_CONFIG.adminPassword || '');
  const [storeAdminPin, setStoreAdminPin] = useState(currentStore.storeAdminPin || STORE_CONFIG.storeAdminPin || '1234');
  const [showPassword, setShowPassword] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ ok: boolean; text: string } | null>(null);
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

  // Upload foto banner ke Cloud Storage Supabase (dengan fallback Base64 kompresi otomatis)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10 MB');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadProductImageFile(file, currentStore.slug, 'hero-banner');
      setHeroBannerUrl(uploadedUrl);
    } catch (err) {
      console.error('Gagal memproses gambar banner:', err);
      alert('Gagal memproses gambar dari perangkat.');
    } finally {
      setIsUploading(false);
    }
  };

  const tierEcon = getStoreTierEconomics(partnerTier);
  const allowedCustomerTiers = getAllowedDownlineTiers(partnerTier);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveNotice(null);

    const normalizedWa = storeWaNumber.trim() ? normalizeWhatsAppNumber(storeWaNumber) : '';
    const normalizedSupplierWa = recommenderWa.trim() ? normalizeWhatsAppNumber(recommenderWa) : '';
    const savedAt = new Date().toISOString();

    const updatedStore: Store = {
      ...currentStore,
      storeName: storeName.trim(),
      storeTagline: storeTagline.trim(),
      heroTitle: storeName.trim(),
      heroSubtitle: storeTagline.trim(),
      heroBannerUrl,
      storeWaNumber: normalizedWa,
      storeCity: storeCity.trim(),
      originSubdistrictId,
      originLabel,
      storeOwner: storeOwner.trim(),
      partnerTier,
      recommenderWa: normalizedSupplierWa,
      feePayer: 'store',
      ownerEmail: ownerEmail.trim().toLowerCase(),
      adminPassword: adminPassword.trim() || currentStore.adminPassword,
      storeAdminPin: storeAdminPin.trim() || currentStore.storeAdminPin,
      updatedAt: savedAt
    };

    if (normalizedWa) setStoreWaNumber(normalizedWa);
    if (normalizedSupplierWa) setRecommenderWa(normalizedSupplierWa);

    try {
      localStorage.setItem('sr12_custom_store_profile', JSON.stringify(updatedStore));
      // Sinkronkan data Pemilik / Kasir Utama (OWNER-01) bila nama pemilik atau PIN berubah
      const existingCashiers = getStoreCashiers(currentStore.slug, updatedStore.storeOwner, updatedStore.storeAdminPin);
      const updatedCashiers = existingCashiers.map(c =>
        c.id === 'OWNER-01'
          ? { ...c, name: updatedStore.storeOwner || c.name, pin: updatedStore.storeAdminPin || c.pin }
          : c
      );
      saveStoreCashiers(currentStore.slug, updatedCashiers);
      const currentActive = getActiveCashier(currentStore.slug, updatedStore.storeOwner, updatedStore.storeAdminPin);
      if (currentActive.id === 'OWNER-01') {
        setActiveCashier(currentStore.slug, currentActive);
      }
    } catch {}

    const cloudRes = await saveStoreProfileToCloud(updatedStore, currentStore.storeAdminPin);
    await refreshStores();

    setIsSaving(false);
    setIsSaved(true);
    setSaveNotice({ ok: cloudRes.success, text: cloudRes.message });
    setTimeout(() => setIsSaved(false), 3500);
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
                Nomor WhatsApp Resmi Toko *
              </label>
              <input
                type="text"
                value={storeWaNumber}
                onChange={(e) => setStoreWaNumber(e.target.value)}
                placeholder="0812xxxxxxx atau 62812xxxxxxx"
                required
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Nama Pemilik Toko:
              </label>
              <input
                type="text"
                value={storeOwner}
                onChange={(e) => setStoreOwner(e.target.value)}
                placeholder="Nama pemilik toko..."
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                No. WA Supplier / Upline Restock (Opsional):
              </label>
              <input
                type="text"
                value={recommenderWa}
                onChange={(e) => setRecommenderWa(e.target.value)}
                placeholder="WA Pusat / Distributor pembina (628xxx)"
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

          {/* Pengaturan Level Kemitraan Toko (Menentukan HPP, Margin Laba & Batas Diskon Downline) */}
          <div style={{ background: '#020617', padding: '14px', borderRadius: '12px', border: '1.5px solid #0284c7' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
              <Award size={16} color="#38bdf8" />
              <span>Level Kemitraan Pemilik Toko (Penentu HPP &amp; Margin Laba):</span>
            </label>
            <select
              value={partnerTier}
              onChange={(e) => setPartnerTier(e.target.value as PartnerTier)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 800
              }}
            >
              <option value="distributor">👑 Distributor Utama (Diskon Kulakan 50% • Modal HPP 50% HET)</option>
              <option value="agen">⭐ Agen Resmi SR12 (Diskon Kulakan 40% • Modal HPP 60% HET)</option>
              <option value="sub_agen">💠 Sub Agen SR12 (Diskon Kulakan 30% • Modal HPP 70% HET)</option>
              <option value="reseller">🌿 Reseller Resmi (Diskon Kulakan 20% • Modal HPP 80% HET)</option>
            </select>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5, background: '#0f172a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div>
                • <b>Modal Kulakan (HPP):</b> <span style={{ color: '#fbbf24', fontWeight: 800 }}>{tierEcon.costPct}% dari HET</span> &bull; <b>Untung Jual Konsumen Ecer:</b> <span style={{ color: '#34d399', fontWeight: 800 }}>{tierEcon.discountPct}% dari HET</span>
              </div>
              <div style={{ color: '#94a3b8', marginTop: '3px' }}>
                • <b>Level Pembeli / Mitra yang Dilayani:</b> {allowedCustomerTiers.map(t => SR12_TIERS[t].name).join(', ')}
              </div>
            </div>
          </div>

          {/* Pengaturan Lokasi Asal Pengiriman Gudang Toko (RajaOngkir) */}
          <div style={{ background: '#020617', padding: '14px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
              <MapPin size={15} color="#34d399" />
              <span>Lokasi Asal Pengiriman Gudang Toko (RajaOngkir Origin):</span>
            </label>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '10px' }}>
              Lokasi ini menjadi titik awal perhitungan tarif ongkir ke seluruh alamat pembeli se-Indonesia.
            </span>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={originSearch}
                onChange={async (e) => {
                  const val = e.target.value;
                  setOriginSearch(val);
                  if (val.trim().length >= 3) {
                    setIsSearchingOrigin(true);
                    const res = await searchOngkirDestinations(val);
                    setOriginOptions(res || []);
                    setIsSearchingOrigin(false);
                  } else {
                    setOriginOptions([]);
                  }
                }}
                placeholder={`Cari kecamatan / kota gudang Anda (Saat ini: ${originLabel})...`}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.85rem'
                }}
              />

              {originOptions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  zIndex: 20,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                  marginTop: '4px'
                }}>
                  {originOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setOriginSubdistrictId(opt.id);
                        const lbl = `${opt.district_name}, ${opt.city_name} (${opt.province_name})`;
                        setOriginLabel(lbl);
                        setOriginSearch('');
                        setOriginOptions([]);
                        setStoreCity(opt.city_name);
                      }}
                      style={{
                        padding: '10px 14px',
                        fontSize: '0.78rem',
                        borderBottom: '1px solid #1e293b',
                        cursor: 'pointer',
                        color: '#f8fafc'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
                    >
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>{opt.district_name}, {opt.city_name}</span>
                      <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} color="#34d399" />
              <span>Titik Asal Aktif: <b>{originLabel}</b> (ID: {originSubdistrictId})</span>
            </div>
          </div>
        </div>

        {/* Card Keamanan & Akun Login Toko */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
            <Lock size={18} color="#fde68a" />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>Akun Login &amp; Keamanan Admin</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Ubah email login, password, dan PIN kasir toko Anda di sini</div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Email Login Pemilik Toko:
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="email-anda@gmail.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Password Baru Admin Toko:
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Ketik password baru Anda"
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    borderRadius: '10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? 'Tutup' : 'Lihat'}
                </button>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Gunakan minimal 8 karakter kombinasi huruf &amp; angka.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                PIN Cepat Kasir (4-6 Digit):
              </label>
              <input
                type="password"
                maxLength={6}
                value={storeAdminPin}
                onChange={(e) => setStoreAdminPin(e.target.value)}
                placeholder="Contoh: 1234"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  fontWeight: 800
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                PIN untuk login cepat kasir harian &amp; membuka menu Kelola Daftar Kasir di bar atas POS.
              </span>
            </div>
          </div>
        </div>

        {saveNotice && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: saveNotice.ok ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
              border: `1px solid ${saveNotice.ok ? '#10b981' : '#f59e0b'}`,
              color: saveNotice.ok ? '#a7f3d0' : '#fde68a',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Cloud size={17} color={saveNotice.ok ? '#34d399' : '#fbbf24'} />
            <span>{saveNotice.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: isSaving ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: isSaving ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="spin" />
              <span>Menyimpan ke Cloud Supabase...</span>
            </>
          ) : isSaved ? (
            <>
              <Check size={20} />
              <span>Tersimpan &amp; Sinkron ke Cloud!</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Simpan &amp; Terapkan ke Semua Perangkat</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
