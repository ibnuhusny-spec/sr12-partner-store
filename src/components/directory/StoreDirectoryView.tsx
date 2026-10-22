import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Store, PartnerTier } from '../../types';
import {
  Search,
  MapPin,
  MessageCircle,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Truck,
  PlusCircle,
  Lock,
  ArrowRight,
  Clock,
  Store as StoreIcon
} from 'lucide-react';

interface StoreDirectoryViewProps {
  onSelectStore: (store: Store) => void;
  onOpenRegister: () => void;
  onOpenStoreLogin: () => void;
  onSecretDevOpen?: () => void;
}

export const StoreDirectoryView: React.FC<StoreDirectoryViewProps> = ({
  onSelectStore,
  onOpenRegister,
  onOpenStoreLogin,
  onSecretDevOpen
}) => {
  const { partnerStores, isStoreAdminLoggedIn, isDistributorLoggedIn, isDevMasterLoggedIn, setIsPosOpen } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [secretClickCount, setSecretClickCount] = useState(0);

  const handleSecretClick = () => {
    setSecretClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        if (onSecretDevOpen) onSecretDevOpen();
        return 0;
      }
      return next;
    });
  };

  // Check if visitor has a remembered / last visited store
  const lastVisitedSlug = useMemo(() => {
    try {
      return localStorage.getItem('sr12_last_visited_store');
    } catch {
      return null;
    }
  }, []);

  const rememberedStore = useMemo(() => {
    if (!lastVisitedSlug) return null;
    return partnerStores.find(s => s.slug === lastVisitedSlug && s.slug !== 'sr12-central') || null;
  }, [lastVisitedSlug, partnerStores]);

  // Filter out central store from the public merchant directory (since central doesn't sell retail)
  const activeMerchantStores = useMemo(() => {
    return partnerStores.filter(s => s.slug !== 'sr12-central');
  }, [partnerStores]);

  // Extract unique cities
  const cities = useMemo(() => {
    const set = new Set(activeMerchantStores.map(s => s.storeCity).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [activeMerchantStores]);

  // Filtered store list
  const filteredStores = useMemo(() => {
    return activeMerchantStores.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        s.storeName.toLowerCase().includes(q) ||
        (s.storeOwner && s.storeOwner.toLowerCase().includes(q)) ||
        (s.storeCity && s.storeCity.toLowerCase().includes(q)) ||
        (s.storeTagline && s.storeTagline.toLowerCase().includes(q));

      const matchCity = selectedCity === 'all' || s.storeCity === selectedCity;
      const matchTier = selectedTier === 'all' || s.partnerTier === selectedTier;

      return matchSearch && matchCity && matchTier;
    });
  }, [activeMerchantStores, searchQuery, selectedCity, selectedTier]);

  const handleWaChat = (store: Store, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!store.storeWaNumber) return;
    const cleanWa = store.storeWaNumber.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Halo Admin ${store.storeName}, saya menemukan toko Anda di Direktori Resmi SR12 dan ingin konsultasi/order produk.`);
    window.open(`https://wa.me/${cleanWa}?text=${text}`, '_blank');
  };

  const getTierBadge = (tier: PartnerTier) => {
    switch (tier) {
      case 'distributor':
        return { label: '👑 DISTRIBUTOR UTAMA', bg: 'linear-gradient(135deg, #b45309, #d97706)', text: '#ffffff' };
      case 'agen':
        return { label: '⭐ AGEN RESMI', bg: 'linear-gradient(135deg, #047857, #059669)', text: '#ffffff' };
      case 'sub_agen':
        return { label: '💠 SUB AGEN RESMI', bg: 'linear-gradient(135deg, #0369a1, #0284c7)', text: '#ffffff' };
      default:
        return { label: 'MITRA RESMI', bg: '#334155', text: '#ffffff' };
    }
  };

  return (
    <div className="store-directory-wrapper">
      {/* 1. Header Direktori */}
      <header className="directory-header">
        <div className="directory-header-inner">
          <div
            className="directory-brand"
            onClick={handleSecretClick}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Direktori Toko Resmi SR12"
          >
            <div className="directory-logo-badge">
              <span>SR12</span>
            </div>
            <div>
              <h1 className="directory-brand-title">Direktori Mitra Resmi SR12</h1>
              <p className="directory-brand-sub">Portal Jaringan Distributor &amp; Agen Resmi Seluruh Indonesia</p>
            </div>
          </div>

          <div className="directory-header-actions">
            <button
              type="button"
              className="btn-topbar btn-topbar-primary"
              onClick={onOpenRegister}
              title="Daftarkan Toko Online SR12 Anda"
            >
              <PlusCircle size={14} />
              <span>Buka Toko Mitra</span>
            </button>

            <button
              type="button"
              className="btn-topbar btn-topbar-pos"
              onClick={() => {
                if (isStoreAdminLoggedIn || isDistributorLoggedIn || isDevMasterLoggedIn) {
                  setIsPosOpen(true);
                } else {
                  onOpenStoreLogin();
                }
              }}
              title="Login Admin Toko &amp; Kasir POS"
            >
              <Lock size={13} />
              <span>Kasir POS</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Search Section */}
      <section className="directory-hero">
        <div className="directory-hero-content">
          <div className="directory-hero-badge">
            <Sparkles size={13} color="#fde68a" />
            <span>Belanja Hemat Ongkir &bull; Pengiriman Cepat dari Toko Terdekat</span>
          </div>

          <h2 className="directory-hero-title">
            Temukan Toko Mitra Resmi SR12 di Kota Anda
          </h2>
          <p className="directory-hero-subtitle">
            Pusat SR12 tidak melayani penjualan eceran. Silakan pilih toko distributor atau agen resmi di kota Anda untuk mendapatkan jaminan produk 100% original, ongkir termurah, serta konsultasi kulit langsung via WhatsApp.
          </p>

          {/* Remembered Store Smart Banner */}
          {rememberedStore && (
            <div className="directory-remembered-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="remembered-icon">
                  <Clock size={18} color="#059669" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 800, textTransform: 'uppercase' }}>
                    Toko Langganan Terakhir Anda:
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0f172a' }}>
                    {rememberedStore.storeName} &bull; <span style={{ color: '#059669' }}>{rememberedStore.storeCity}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-remembered-action"
                onClick={() => onSelectStore(rememberedStore)}
              >
                <span>Lanjut Belanja di Sini</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Search Box & Filters */}
          <div className="directory-search-container">
            <div className="directory-search-input-wrapper">
              <Search size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '14px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama toko, nama pemilik, atau kota (contoh: Aisyah, Bandung, Surabaya)..."
                className="directory-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="directory-search-reset"
                >
                  Reset
                </button>
              )}
            </div>

            {/* City Quick Pills Slider */}
            <div className="directory-filter-row">
              <div className="directory-filter-label">
                <MapPin size={14} color="#059669" />
                <span>Pilih Kota:</span>
              </div>
              <div className="directory-city-slider">
                {cities.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`directory-city-pill ${selectedCity === city ? 'active' : ''}`}
                  >
                    {city === 'all' ? '🇮🇩 Semua Wilayah' : city}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier Filters */}
            <div className="directory-filter-row" style={{ marginTop: '6px' }}>
              <div className="directory-filter-label">
                <ShieldCheck size={14} color="#0284c7" />
                <span>Level Mitra:</span>
              </div>
              <div className="directory-tier-pills">
                {[
                  { key: 'all', label: 'Semua Mitra' },
                  { key: 'distributor', label: '👑 Distributor Utama' },
                  { key: 'agen', label: '⭐ Agen Resmi' },
                  { key: 'sub_agen', label: '💠 Sub Agen' }
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTier(t.key)}
                    className={`directory-tier-pill ${selectedTier === t.key ? 'active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Grid Kartu Toko Resmi (Store Cards) */}
      <main className="directory-main-container">
        <div className="directory-section-heading">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Daftar Toko Mitra Resmi SR12 Terverifikasi
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              Ditemukan {filteredStores.length} toko resmi yang siap melayani pesanan Anda
            </p>
          </div>
        </div>

        {filteredStores.length === 0 ? (
          <div className="directory-empty-state">
            <StoreIcon size={48} color="#94a3b8" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155', marginTop: '12px' }}>
              Belum ada toko yang cocok dengan pencarian Anda
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: '450px', margin: '6px auto 16px' }}>
              Coba gunakan kata kunci pencarian yang lebih umum atau pilih filter &quot;Semua Wilayah&quot;.
            </p>
            <button
              type="button"
              className="btn-topbar btn-topbar-primary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedTier('all');
              }}
            >
              Tampilkan Semua Toko Mitra
            </button>
          </div>
        ) : (
          <div className="directory-store-grid">
            {filteredStores.map(store => {
              const tierBadge = getTierBadge(store.partnerTier);
              return (
                <article
                  key={store.slug}
                  className="directory-store-card"
                  onClick={() => onSelectStore(store)}
                >
                  {/* Top Tier Ribbon */}
                  <div
                    className="store-card-tier-ribbon"
                    style={{ background: tierBadge.bg, color: tierBadge.text }}
                  >
                    <span>{tierBadge.label}</span>
                    <span className="store-verified-pill">✓ Resmi</span>
                  </div>

                  {/* Card Content Body */}
                  <div className="store-card-body">
                    {/* Header: Avatar, Name, Owner */}
                    <div className="store-card-header">
                      <div className="store-card-avatar">
                        {store.storeLogoUrl ? (
                          <img src={store.storeLogoUrl} alt={store.storeName} />
                        ) : (
                          <span>{store.storeLogoText || 'SR12'}</span>
                        )}
                        <span className="store-card-live-dot" title="Toko Online &amp; Buka Hari Ini" />
                      </div>

                      <div className="store-card-meta">
                        <h4 className="store-card-title">{store.storeName}</h4>
                        <div className="store-card-owner">
                          <span>Pemilik:</span> <b>{store.storeOwner || 'Mitra Resmi SR12'}</b>
                        </div>
                        <div className="store-card-city">
                          <MapPin size={12} color="#059669" />
                          <span>{store.storeCity || 'Indonesia'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tagline / Bio */}
                    <p className="store-card-tagline">
                      {store.storeTagline || 'Direktori Kemitraan & Pasokan Resmi SR12 Skin Care'}
                    </p>

                    {/* Value Proposition Badges */}
                    <div className="store-card-badges">
                      <div className="store-service-badge">
                        <Truck size={12} color="#059669" />
                        <span>Sameday &amp; COD Ready</span>
                      </div>
                      <div className="store-service-badge">
                        <ShoppingBag size={12} color="#0284c7" />
                        <span>160+ Produk Lengkap</span>
                      </div>
                      <div className="store-service-badge">
                        <ShieldCheck size={12} color="#b45309" />
                        <span>BPOM &amp; Halal MUI</span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="store-card-actions">
                      <button
                        type="button"
                        className="btn-store-visit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStore(store);
                        }}
                      >
                        <ShoppingBag size={15} />
                        <span>Kunjungi Toko</span>
                      </button>

                      {store.storeWaNumber && (
                        <button
                          type="button"
                          className="btn-store-wa"
                          onClick={(e) => handleWaChat(store, e)}
                          title="Chat WhatsApp dengan Pemilik Toko"
                        >
                          <MessageCircle size={16} />
                          <span>Chat WA</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* 4. Bottom Join As Partner CTA Banner */}
        <section className="directory-cta-card">
          <div className="directory-cta-content">
            <div className="directory-cta-badge">
              <Sparkles size={14} color="#fde68a" />
              <span>Program Kemitraan Resmi SR12</span>
            </div>
            <h3 className="directory-cta-title">
              Anda Mitra Distributor atau Agen SR12? Ingin Memiliki Toko Online Resmi Seperti Ini?
            </h3>
            <p className="directory-cta-text">
              Daftarkan toko online kemitraan Anda sekarang. Anda akan langsung mendapatkan etalase 160+ produk SR12 lengkap, sistem kasir gudang POS Olsera, serta link toko online yang siap dibagikan ke pelanggan &amp; downline.
            </p>
            <button
              type="button"
              className="btn-cta-open-store"
              onClick={onOpenRegister}
            >
              <PlusCircle size={18} />
              <span>Daftar &amp; Buka Toko Online Gratis Sekarang</span>
            </button>
          </div>
        </section>
      </main>

      {/* Directory Footer */}
      <footer className="directory-footer">
        <p
          onClick={handleSecretClick}
          style={{ cursor: 'default', userSelect: 'none' }}
        >
          &copy; {new Date().getFullYear()} SR12 Skin Care Official Partner Store Network &bull; Terverifikasi BPOM &amp; Halal MUI
        </p>
      </footer>
    </div>
  );
};
