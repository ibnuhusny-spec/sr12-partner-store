import { Store, StoreTheme } from '../types';

/**
 * Konfigurasi Tunggal Toko (Single-Tenant Mode)
 * Membaca konfigurasi dari environment variables (.env).
 * Jika tidak tersedia, akan menggunakan nilai default yang aman.
 */
export const STORE_CONFIG: Store = {
  slug: import.meta.env.VITE_STORE_SLUG || 'sr12-central',
  storeName: import.meta.env.VITE_STORE_NAME || 'SR12 Herbal Skin Care',
  storeTagline: import.meta.env.VITE_STORE_TAGLINE || 'Distributor Resmi SR12 Skin Care & Herbal Alami',
  storeTheme: (import.meta.env.VITE_STORE_THEME as StoreTheme) || 'emerald',
  heroTitle: import.meta.env.VITE_STORE_NAME || 'SR12 Herbal Skin Care',
  heroSubtitle: import.meta.env.VITE_STORE_TAGLINE || 'Pusat pasokan resmi produk SR12 Herbal Skin Care berlisensi BPOM & Halal MUI.',
  heroBannerUrl: '/assets/hero-banner.jpg',
  storeLogoText: 'SR12',
  storeLogoUrl: '/assets/sr12-logo.png',
  storeWaNumber: import.meta.env.VITE_STORE_WA || '6281200001212',
  storeCity: import.meta.env.VITE_STORE_CITY || 'Jakarta',
  storeOwner: import.meta.env.VITE_STORE_OWNER || 'Ibnu Husny',
  partnerTier: 'distributor',
  feePayer: 'buyer',
  storeAdminPin: import.meta.env.VITE_STORE_ADMIN_PIN || '1234',
  ownerEmail: import.meta.env.VITE_STORE_OWNER_EMAIL || 'admin@sr12.co.id',
  adminPassword: import.meta.env.VITE_STORE_ADMIN_PASSWORD || 'AdminSR12@2026!',
  orderQuota: 99999,
  walletBalance: 1000000,
  totalTopupPaid: 0,
  totalTx: 0
};

