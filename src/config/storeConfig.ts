import { Store, StoreTheme } from '../types';

/**
 * Konfigurasi Tunggal Toko (Single-Tenant Mode)
 * Membaca konfigurasi dari local storage (jika sudah diubah di admin) atau dari environment variables (.env).
 */
const getSavedStoreConfig = (): Partial<Store> => {
  try {
    const raw = localStorage.getItem('sr12_custom_store_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

const saved = getSavedStoreConfig();

export const STORE_CONFIG: Store = {
  slug: saved.slug || import.meta.env.VITE_STORE_SLUG || 'sr12-central',
  storeName: saved.storeName || import.meta.env.VITE_STORE_NAME || 'SR12 Herbal Skin Care',
  storeTagline: saved.storeTagline || import.meta.env.VITE_STORE_TAGLINE || 'Distributor Resmi SR12 Skin Care & Herbal Alami BPOM & Halal MUI',
  storeTheme: (saved.storeTheme as StoreTheme) || (import.meta.env.VITE_STORE_THEME as StoreTheme) || 'emerald',
  heroTitle: saved.heroTitle || saved.storeName || import.meta.env.VITE_STORE_NAME || 'SR12 Herbal Skin Care',
  heroSubtitle: saved.heroSubtitle || saved.storeTagline || import.meta.env.VITE_STORE_TAGLINE || 'Distributor Resmi SR12 Skin Care & Herbal Alami BPOM & Halal MUI',
  heroBannerUrl: saved.heroBannerUrl || '/assets/hero-banner.jpg',
  storeLogoText: 'SR12',
  storeLogoUrl: '/assets/sr12-logo.png',
  storeWaNumber: saved.storeWaNumber || import.meta.env.VITE_STORE_WA || '6281200001212',
  storeCity: saved.storeCity || import.meta.env.VITE_STORE_CITY || 'Jakarta',
  originSubdistrictId: saved.originSubdistrictId || Number(import.meta.env.VITE_STORE_ORIGIN_ID) || 17473,
  originLabel: saved.originLabel || 'Jakarta Barat (DKI Jakarta)',
  storeOwner: saved.storeOwner || import.meta.env.VITE_STORE_OWNER || 'Ibnu Husny',
  partnerTier: 'distributor',
  feePayer: 'buyer',
  storeAdminPin: saved.storeAdminPin || import.meta.env.VITE_STORE_ADMIN_PIN || '1234',
  ownerEmail: saved.ownerEmail || import.meta.env.VITE_STORE_OWNER_EMAIL || 'admin@sr12.co.id',
  adminPassword: saved.adminPassword || import.meta.env.VITE_STORE_ADMIN_PASSWORD || 'AdminSR12@2026!',
  orderQuota: 99999,
  walletBalance: 1000000,
  totalTopupPaid: 0,
  totalTx: 0
};


