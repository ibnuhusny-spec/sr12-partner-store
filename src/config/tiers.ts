import { PartnerTier, ShippingProvider, TierInfo } from '../types';

export const SR12_TIERS: Record<PartnerTier, TierInfo> = {
  konsumen: {
    id: 'konsumen',
    name: 'Konsumen Retail',
    label: 'Konsumen Umum',
    discountPct: 0,
    minOrderNominal: 0,
    minOrderPcs: 1,
    badgeColor: '#64748b',
    description: 'Harga Eceran Tertinggi (HET) resmi konsumen'
  },
  marketer: {
    id: 'marketer',
    name: 'Mitra Marketer',
    label: 'Marketer (Gaji 15%)',
    discountPct: 0,
    commissionPct: 15,
    minOrderNominal: 0,
    minOrderPcs: 1,
    badgeColor: '#6366f1',
    description: 'Membayar Full sesuai harga HET (tanpa diskon langsung). Hak komisi 15% masuk ke Gaji Bulanan.'
  },
  reseller: {
    id: 'reseller',
    name: 'Reseller Resmi',
    label: 'Reseller (20%)',
    discountPct: 20,
    firstOrderNet: 400000,
    firstOrderHet: 500000,
    minOrderNominal: 400000,
    maintenanceMonthly: 500000,
    maintenance3Months: 1500000,
    downgradeTier: 'marketer',
    minOrderPcs: 3,
    badgeColor: '#10b981',
    description: 'Diskon 20%, First Order Rp 400.000 (Rp 500.000 HET), Pemeliharaan Omset Rp 1.500.000 / 3 Bulan'
  },
  sub_agen: {
    id: 'sub_agen',
    name: 'Sub Agen SR12',
    label: 'Sub Agen (30%)',
    discountPct: 30,
    firstOrderNet: 3500000,
    firstOrderHet: 5000000,
    minOrderNominal: 3500000,
    maintenanceMonthly: 4000000,
    maintenance3Months: 12000000,
    downgradeTier: 'reseller',
    minOrderPcs: 15,
    badgeColor: '#8b5cf6',
    description: 'Diskon 30%, First Order Rp 3.500.000 (Rp 5.000.000 HET), Pemeliharaan Omset Rp 12.000.000 / 3 Bulan'
  },
  agen: {
    id: 'agen',
    name: 'Agen Resmi SR12',
    label: 'Agen (40%)',
    discountPct: 40,
    firstOrderNet: 15000000,
    firstOrderHet: 25000000,
    minOrderNominal: 15000000,
    maintenanceMonthly: 15000000,
    maintenance3Months: 45000000,
    downgradeTier: 'sub_agen',
    minOrderPcs: 50,
    badgeColor: '#f59e0b',
    description: 'Diskon 40%, First Order Rp 15.000.000 (Rp 25.000.000 HET), Pemeliharaan Omset Rp 45.000.000 / 3 Bulan'
  },
  distributor: {
    id: 'distributor',
    name: 'Distributor Utama',
    label: 'Distributor (50%)',
    discountPct: 50,
    minOrderNominal: 25000000,
    minOrderPcs: 150,
    badgeColor: '#dc2626',
    description: 'Margin maksimal 50%, pemegang pasokan stok wilayah besar'
  }
};

export const SR12_SHIPPING_PROVIDERS: ShippingProvider[] = [
  { id: 'jne', name: 'JNE Express (Reguler)', costPerKg: 12000, estDays: '2-3 hari', minKg: 1, type: 'courier' },
  { id: 'jnt', name: 'J&T Express (Kilat)', costPerKg: 14000, estDays: '1-2 hari', minKg: 1, type: 'courier' },
  { id: 'sicepat', name: 'SiCepat Halu / Reguler', costPerKg: 11000, estDays: '2-3 hari', minKg: 1, type: 'courier' },
  { id: 'cod', name: '💵 COD (Bayar Tunai di Tempat saat Sampai)', costPerKg: 15000, estDays: '1-3 hari', minKg: 1, type: 'cod' },
  { id: 'pickup', name: '🏪 Ambil Sendiri di Gudang Toko (Bebas Ongkir - Rp 0)', costPerKg: 0, estDays: 'Bisa langsung diambil', minKg: 1, type: 'pickup' },
  { id: 'instant', name: '⚡ Kurir Instan / Same Day (GoSend / GrabExpress)', costPerKg: 20000, estDays: '1-3 jam', minKg: 1, type: 'instant' },
  { id: 'cargo', name: '🚛 J&T Cargo / Indah Kargo (Grosir Min. 10 kg)', costPerKg: 3500, estDays: '3-5 hari', minKg: 10, type: 'cargo' }
];

export function getProductTierPrice(het: number, tierId: PartnerTier): number {
  if (tierId === 'konsumen' || tierId === 'marketer') {
    return het; // Konsumen dan Marketer membayar Full HET tanpa diskon langsung saat transaksi
  }
  const tier = SR12_TIERS[tierId] || SR12_TIERS.konsumen;
  const multiplier = 1 - (tier.discountPct / 100);
  return Math.round(het * multiplier);
}
