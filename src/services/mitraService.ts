import { supabase, getActiveSessionToken } from '../config/supabase';
import { MarketerSale, MitraDownline, PartnerTier } from '../types';
import {
  filterDeletedDownlines,
  filterDeletedMarketerSales,
  markDownlinesDeleted,
  markMarketerSalesDeleted,
  notifyPosDataSync,
  unmarkDownlineDeleted
} from './cleanupGuard';
import { fetchCancelledOrderIds, fetchStoreOrders } from './orderService';
import { isDemoSessionActive } from './demoGuard';

export const DEFAULT_SAMPLE_DOWNLINES: MitraDownline[] = [
  // 1. AGEN RESMI SR12 (Diskon 40%)
  {
    storeSlug: 'all',
    partnerCode: 'AG-001',
    name: 'dr. H. Irfan Syarifuddin, Sp.KK',
    phone: '081234567890',
    address: 'Jl. Pemuda No. 18, Rawamangun, Pulo Gadung, Jakarta Timur 13220',
    city: 'Jakarta Timur',
    tier: 'agen',
    bankName: 'BCA',
    bankAccount: '5210982341',
    bankHolder: 'Irfan Syarifuddin',
    status: 'active',
    accumulatedSpent90Days: 48500000, // Target 3 bln 45jt tercapai aman (Diskon 40%)
    totalOrdersCount: 38,
    joinDate: '2026-08-20',
    evaluationDueDate: '2026-11-20',
    lastOrderDate: '2026-10-21'
  },
  // 2. SUB AGEN RESMI SR12 (Diskon 30%)
  {
    storeSlug: 'all',
    partnerCode: 'SA-201',
    name: 'Hj. Nurul Hidayah',
    phone: '081399001122',
    address: 'Jl. Raya Darmo No. 88, Wonokromo, Surabaya, Jawa Timur 60241',
    city: 'Surabaya',
    tier: 'sub_agen',
    bankName: 'BSI',
    bankAccount: '7109283746',
    bankHolder: 'Nurul Hidayah',
    status: 'active',
    accumulatedSpent90Days: 26500000, // >= 25jt -> LAYAK PROMOSI KE AGEN (First Order Agen 25jt)!
    totalOrdersCount: 24,
    joinDate: '2026-08-15',
    evaluationDueDate: '2026-11-15',
    lastOrderDate: '2026-10-20'
  },
  {
    storeSlug: 'all',
    partnerCode: 'SA-202',
    name: 'Fitri Handayani',
    phone: '082155667788',
    address: 'Jl. Malioboro No. 45, Sosromenduran, Gedongtengen, Kota Yogyakarta 55271',
    city: 'Yogyakarta',
    tier: 'sub_agen',
    bankName: 'BCA',
    bankAccount: '8830192847',
    bankHolder: 'Fitri Handayani',
    status: 'active',
    accumulatedSpent90Days: 3200000, // < 4jt/bln (target 3 bln 12jt) -> PERINGATAN TURUN KE RESELLER!
    totalOrdersCount: 4,
    joinDate: '2026-08-01',
    evaluationDueDate: '2026-10-31',
    lastOrderDate: '2026-10-05'
  },
  // 3. RESELLER RESMI SR12 (Diskon 20%)
  {
    storeSlug: 'all',
    partnerCode: 'RS-101',
    name: 'Dewi Anggraini, S.Farm',
    phone: '081288992211',
    address: 'Jl. Tebet Barat Dalam Raya No. 12, Tebet, Jakarta Selatan 12810',
    city: 'Jakarta Selatan',
    tier: 'reseller',
    bankName: 'BCA',
    bankAccount: '7310294821',
    bankHolder: 'Dewi Anggraini',
    status: 'active',
    accumulatedSpent90Days: 5200000, // >= 5jt -> LAYAK PROMOSI KE SUB AGEN (First Order Sub Agen 5jt)!
    totalOrdersCount: 16,
    joinDate: '2026-09-05',
    evaluationDueDate: '2026-12-05',
    lastOrderDate: '2026-10-18'
  },
  {
    storeSlug: 'all',
    partnerCode: 'RS-102',
    name: 'Budi Santoso',
    phone: '085712345678',
    address: 'Jl. Dago No. 104, Lebakgede, Coblong, Kota Bandung 40132',
    city: 'Bandung',
    tier: 'reseller',
    bankName: 'Mandiri',
    bankAccount: '132001928374',
    bankHolder: 'Budi Santoso',
    status: 'active',
    accumulatedSpent90Days: 1850000, // Target min 3 bln 1.5jt tercapai aman
    totalOrdersCount: 7,
    joinDate: '2026-08-28',
    evaluationDueDate: '2026-11-28',
    lastOrderDate: '2026-10-15'
  },
  {
    storeSlug: 'all',
    partnerCode: 'RS-103',
    name: 'Rina Wulandari',
    phone: '087899887766',
    address: 'Jl. Pandanaran No. 56, Mugassari, Semarang Selatan, Kota Semarang 50249',
    city: 'Semarang',
    tier: 'reseller',
    bankName: 'BRI',
    bankAccount: '009801234567',
    bankHolder: 'Rina Wulandari',
    status: 'active',
    accumulatedSpent90Days: 350000, // < 500rb/bln atau < 1.5jt/3 bln -> PERINGATAN TURUN KE MARKETER!
    totalOrdersCount: 2,
    joinDate: '2026-08-05',
    evaluationDueDate: '2026-11-05',
    lastOrderDate: '2026-10-02'
  },
  // 4. MARKETER SR12 (Komisi 15% - Gaji serentak tgl 25 bulanan)
  {
    storeSlug: 'all',
    partnerCode: 'MK-301',
    name: 'Siti Rahmawati',
    phone: '089611223344',
    city: 'Tangerang',
    tier: 'marketer',
    bankName: 'BCA',
    bankAccount: '6040192837',
    bankHolder: 'Siti Rahmawati',
    status: 'active',
    accumulatedSpent90Days: 950000, // >= 500rb FO / 800rb prestasi -> LAYAK PROMOSI KE RESELLER!
    totalOrdersCount: 8,
    joinDate: '2026-09-01',
    evaluationDueDate: '2026-10-25',
    lastOrderDate: '2026-10-19'
  },
  {
    storeSlug: 'all',
    partnerCode: 'MK-302',
    name: 'Mega Utami',
    phone: '085712349988',
    city: 'Bekasi',
    tier: 'marketer',
    bankName: 'Mandiri',
    bankAccount: '167001928374',
    bankHolder: 'Mega Utami',
    status: 'active',
    accumulatedSpent90Days: 220000, // Belum 500rb -> Status: Tetap Marketer Aktif (tidak turun / keluar)!
    totalOrdersCount: 3,
    joinDate: '2026-09-15',
    evaluationDueDate: '2026-10-25',
    lastOrderDate: '2026-10-14'
  },
  // 5. NON MITRA (LANGGANAN / CUSTOMER TETAP - HET)
  {
    storeSlug: 'all',
    partnerCode: 'CUST-001',
    name: 'Anisa Maharani (Pelanggan Setia)',
    phone: '081388776655',
    city: 'Jakarta Selatan',
    tier: 'konsumen',
    bankName: '-',
    bankAccount: '-',
    bankHolder: 'Anisa Maharani',
    status: 'active',
    accumulatedSpent90Days: 620000, // Sering belanja > 500rb -> LAYAK DITAWARI GABUNG JADI MITRA RESELLER!
    totalOrdersCount: 5,
    joinDate: '2026-07-10',
    lastOrderDate: '2026-10-21'
  },
  {
    storeSlug: 'all',
    partnerCode: 'CUST-002',
    name: 'Lestari Indah (Langganan Herbal)',
    phone: '087711223344',
    city: 'Depok',
    tier: 'konsumen',
    bankName: '-',
    bankAccount: '-',
    bankHolder: 'Lestari Indah',
    status: 'active',
    accumulatedSpent90Days: 250000, // Pelanggan aktif -> Siap dikirim promo produk baru via WA
    totalOrdersCount: 3,
    lastOrderDate: '2026-10-17'
  }
];

export const DEFAULT_SAMPLE_MARKETER_SALES: MarketerSale[] = [
  {
    storeSlug: 'all',
    orderId: 'ORD-982101',
    marketerId: 'MK-301',
    orderDate: '2026-10-18',
    monthPeriod: '2026-10',
    customerName: 'Anisa Maharani',
    customerPhone: '081299887711',
    fulfillmentType: 'delivery',
    itemsDesc: '1x Deodorant Spray, 1x Toner Chamomile',
    omsetHet: 185000,
    commissionPct: 15,
    commissionAmount: 27750,
    paidStatus: 'paid',
    paidDate: '2026-10-19'
  },
  {
    storeSlug: 'all',
    orderId: 'ORD-982102',
    marketerId: 'MK-301',
    orderDate: '2026-10-19',
    monthPeriod: '2026-10',
    customerName: 'Dian Permatasari',
    customerPhone: '085711223344',
    fulfillmentType: 'delivery',
    itemsDesc: '2x Salimah Slim, 1x Manjakani Kapsul',
    omsetHet: 320000,
    commissionPct: 15,
    commissionAmount: 48000,
    paidStatus: 'unpaid'
  },
  {
    storeSlug: 'all',
    orderId: 'ORD-982103',
    marketerId: 'MK-302',
    orderDate: '2026-10-20',
    monthPeriod: '2026-10',
    customerName: 'Kartika Sari',
    customerPhone: '087799112233',
    fulfillmentType: 'pickup',
    itemsDesc: '1x Paket Glowing Pemula, 1x Sunscreen Gel',
    omsetHet: 265000,
    commissionPct: 15,
    commissionAmount: 39750,
    paidStatus: 'unpaid'
  }
];

export async function verifyMitraDiscount(query: string, storeSlug: string): Promise<{ found: boolean; mitra?: Partial<MitraDownline> }> {
  if (!query || !query.trim()) return { found: false };

  try {
    const { data, error } = await supabase.rpc('rpc_verify_mitra_discount', {
      p_query: query.trim(),
      p_store_slug: storeSlug
    });

    if (!error && data && data.found) {
      return {
        found: true,
        mitra: {
          partnerCode: data.id,
          name: data.name,
          phone: data.phone,
          address: data.address || data.city,
          city: data.city,
          tier: data.tier,
          status: data.status,
          accumulatedSpent90Days: Number(data.accumulatedSpent90Days || 0)
        }
      };
    }
  } catch (err) {
    console.warn('RPC rpc_verify_mitra_discount fallback to local:', err);
  }

  // Fallback to local
  const cleanQ = query.toUpperCase().trim();
  const list = getLocalDownlines(storeSlug);

  const found = list.find(m =>
    (m.partnerCode && m.partnerCode.toUpperCase() === cleanQ) ||
    (m.phone && m.phone.replace(/[^0-9]/g, '').endsWith(cleanQ.replace(/[^0-9]/g, '')))
  );

  if (found) {
    return { found: true, mitra: found };
  }

  return { found: false };
}

export function getLocalDownlines(storeSlug?: string): MitraDownline[] {
  try {
    if (storeSlug && storeSlug !== 'all') {
      const specific = localStorage.getItem(`sr12_mitra_downlines_${storeSlug}`);
      if (specific !== null) {
        const parsed = JSON.parse(specific);
        if (Array.isArray(parsed)) return filterDeletedDownlines(storeSlug, parsed as MitraDownline[]);
      }
    }
    const raw = localStorage.getItem('sr12_mitra_downlines_v2');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return filterDeletedDownlines(storeSlug, parsed as MitraDownline[]);
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchStoreDownlines(storeSlug: string): Promise<MitraDownline[]> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  if (isDemoSessionActive() && localStorage.getItem(`sr12_mitra_downlines_${targetSlug}`) !== null) {
    return getLocalDownlines(targetSlug);
  }

  try {
    const { data, error } = await supabase.rpc('rpc_get_store_downlines', {
      p_slug: targetSlug,
      p_token: token
    });

    if (!error && Array.isArray(data)) {
      const mapped: MitraDownline[] = filterDeletedDownlines(
        targetSlug,
        data.map((d: any) => ({
          id: d.id,
          storeSlug: d.store_slug || targetSlug,
          partnerCode: d.partner_code,
          name: d.name,
          phone: d.phone,
          city: d.city || '',
          tier: d.tier as PartnerTier,
          bankName: d.bank_name || 'BCA',
          bankAccount: d.bank_account || '',
          bankHolder: d.bank_holder || d.name,
          qualificationDate: d.qualification_date,
          lastOrderDate: d.last_order_date,
          accumulatedSpent90Days: Number(d.accumulated_spent_90_days || 0),
          totalOrdersCount: Number(d.total_orders_count || 0),
          status: d.status || 'active',
          joinDate: d.qualification_date || undefined,
          evaluationDueDate: d.evaluation_due_date || undefined
        }))
      );

      // Simpan ke local cache untuk kedua device
      try {
        localStorage.setItem(`sr12_mitra_downlines_${targetSlug}`, JSON.stringify(mapped));
        localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(mapped));
      } catch {}

      return mapped;
    } else if (error) {
      console.warn('rpc_get_store_downlines warning:', error.message);
    }
  } catch (err) {
    console.warn('Network error in fetchStoreDownlines:', err);
  }

  return getLocalDownlines(targetSlug);
}

export async function saveStoreDownline(mitra: Partial<MitraDownline>, storeSlug: string): Promise<boolean> {
  const targetSlug = storeSlug || mitra.storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  if (mitra.partnerCode) {
    unmarkDownlineDeleted(targetSlug, [mitra.partnerCode]);
  }

  // 1. Simpan ke local cache untuk responsivitas instan di perangkat ini
  try {
    const list: MitraDownline[] = getLocalDownlines(targetSlug);
    const idx = list.findIndex(m => m.partnerCode === mitra.partnerCode);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...mitra } as MitraDownline;
    } else {
      list.push(mitra as MitraDownline);
    }
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(list));
    localStorage.setItem(`sr12_mitra_downlines_${targetSlug}`, JSON.stringify(list));
  } catch (e) {}

  if (isDemoSessionActive()) {
    notifyPosDataSync(targetSlug, ['downlines']);
    return true;
  }

  // 2. Simpan secara permanen ke Supabase Cloud
  try {
    const res = await supabase.rpc('rpc_save_store_downline', {
      p_slug: targetSlug,
      p_token: token,
      p_mitra: {
        id: mitra.partnerCode,
        partner_code: mitra.partnerCode,
        name: mitra.name,
        phone: mitra.phone,
        city: mitra.city,
        tier: mitra.tier,
        bankName: mitra.bankName,
        bankAccount: mitra.bankAccount,
        bankHolder: mitra.bankHolder,
        status: mitra.status || 'active',
        accumulatedSpent90Days: mitra.accumulatedSpent90Days || 0,
        totalOrdersCount: mitra.totalOrdersCount || 0
      }
    });
    return !!res.data?.success;
  } catch (e) {
    console.warn('Error saving downline to Supabase:', e);
    return false;
  }
}

export async function updateMitraTier(partnerCode: string, newTier: PartnerTier, storeSlug: string): Promise<boolean> {
  return updateMitraLevelAndDueDate(partnerCode, newTier, undefined, storeSlug);
}

export async function updateMitraLevelAndDueDate(
  partnerCode: string,
  newTier: PartnerTier,
  newDueDate: string | undefined,
  storeSlug: string
): Promise<boolean> {
  const targetSlug = storeSlug || 'sr12-central';
  try {
    const list: MitraDownline[] = getLocalDownlines(targetSlug);
    const idx = list.findIndex(m => m.partnerCode === partnerCode);
    if (idx >= 0) {
      list[idx].tier = newTier;
      if (newDueDate !== undefined) {
        list[idx].evaluationDueDate = newDueDate;
      }
      localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(list));
      localStorage.setItem(`sr12_mitra_downlines_${targetSlug}`, JSON.stringify(list));
      await saveStoreDownline(list[idx], targetSlug);
      return true;
    }
  } catch (e) {}
  return false;
}

function formatMarketerItemsDesc(rawDesc?: string | null): string {
  if (!rawDesc || typeof rawDesc !== 'string') return '-';
  const trimmed = rawDesc.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const itemsList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
      if (itemsList.length > 0) {
        return itemsList
          .map((it: any) => `${it.quantity || 1}x ${it.name || 'Produk SR12'}`)
          .join(', ');
      }
      return parsed?.tierLabel || 'Pesanan Toko';
    } catch {
      return 'Pesanan Toko';
    }
  }
  return trimmed;
}

function isActualMarketerSale(row: { marketerId?: string; commissionAmount?: number }): boolean {
  const mId = (row.marketerId || '').toUpperCase().trim();
  const comm = Number(row.commissionAmount || 0);
  if (comm > 0) return true;
  if (!mId || mId === 'RETAIL' || mId === 'RS-WEB') return false;
  return true;
}

export function getLocalMarketerSales(storeSlug?: string): MarketerSale[] {
  const normalizeList = (arr: any[]): MarketerSale[] =>
    filterDeletedMarketerSales(
      storeSlug,
      arr
        .map(s => ({ ...s, itemsDesc: formatMarketerItemsDesc(s.itemsDesc) }))
        .filter(s => isActualMarketerSale(s))
    );

  try {
    if (storeSlug && storeSlug !== 'all') {
      const specific = localStorage.getItem(`sr12_marketer_sales_${storeSlug}`);
      if (specific !== null) {
        const parsed = JSON.parse(specific);
        if (Array.isArray(parsed)) return normalizeList(parsed);
      }
    }
    const raw = localStorage.getItem('sr12_marketer_sales_v1');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return normalizeList(parsed);
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchStoreMarketerSales(storeSlug: string): Promise<MarketerSale[]> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  if (isDemoSessionActive() && localStorage.getItem(`sr12_marketer_sales_${targetSlug}`) !== null) {
    return getLocalMarketerSales(targetSlug);
  }

  try {
    const [{ data, error }, cancelledIds] = await Promise.all([
      supabase.rpc('rpc_get_store_marketer_sales', {
        p_slug: targetSlug,
        p_token: token
      }),
      fetchCancelledOrderIds(targetSlug)
    ]);

    if (!error && Array.isArray(data)) {
      const rawMapped: MarketerSale[] = data
        .map((d: any) => ({
          id: d.id,
          storeSlug: d.store_slug || targetSlug,
          orderId: d.order_id,
          marketerId: d.marketer_id,
          orderDate: d.order_date,
          monthPeriod: d.month_period,
          customerName: d.customer_name,
          customerPhone: d.customer_phone,
          customerAddress: d.customer_address,
          fulfillmentType: d.fulfillment_type as 'pickup' | 'delivery',
          itemsDesc: formatMarketerItemsDesc(d.items_desc),
          omsetHet: Number(d.omset_het || 0),
          commissionPct: Number(d.commission_pct || 15),
          commissionAmount: Number(d.commission_amount || 0),
          paidStatus: d.paid_status as 'paid' | 'unpaid',
          paidDate: d.paid_date
        }))
        .filter(s => isActualMarketerSale(s));

      const mapped = filterDeletedMarketerSales(targetSlug, rawMapped, cancelledIds);

      try {
        localStorage.setItem(`sr12_marketer_sales_${targetSlug}`, JSON.stringify(mapped));
        localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(mapped));
      } catch {}

      return mapped;
    }
  } catch (err) {
    console.warn('Error fetching marketer sales from Supabase:', err);
  }

  return getLocalMarketerSales(targetSlug);
}

/**
 * Prepends a newly created marketer commission entry into both store-scoped and legacy caches.
 */
export function appendLocalMarketerSale(sale: MarketerSale, storeSlug?: string): void {
  const targetSlug = (storeSlug || sale.storeSlug || 'sr12-central').toLowerCase();
  try {
    const existing = getLocalMarketerSales(targetSlug);
    const deduped = [sale, ...existing.filter(s => s.orderId !== sale.orderId)];
    localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(deduped));
    localStorage.setItem(`sr12_marketer_sales_${targetSlug}`, JSON.stringify(deduped));
  } catch {}
}

export function updateMarketerSalePaidStatus(orderId: string, newStatus: 'paid' | 'unpaid', storeSlug?: string): boolean {
  const targetSlug = storeSlug || 'sr12-central';
  try {
    const list: MarketerSale[] = getLocalMarketerSales(targetSlug);
    const idx = list.findIndex(s => s.orderId === orderId);
    if (idx >= 0) {
      list[idx].paidStatus = newStatus;
      if (newStatus === 'paid') {
        list[idx].paidDate = new Date().toISOString().split('T')[0];
      } else {
        delete list[idx].paidDate;
      }
      localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(list));
      localStorage.setItem(`sr12_marketer_sales_${targetSlug}`, JSON.stringify(list));
      return true;
    }
  } catch {}
  return false;
}

export async function deleteStoreDownline(partnerCode: string, storeSlug?: string): Promise<MitraDownline[]> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  // 1. Catat tombstone & hapus dari local storage
  markDownlinesDeleted(targetSlug, [partnerCode]);
  const filtered = getLocalDownlines(targetSlug).filter(
    m => m.partnerCode !== partnerCode && m.id !== partnerCode
  );
  try {
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(filtered));
    localStorage.setItem(`sr12_mitra_downlines_${targetSlug}`, JSON.stringify(filtered));
  } catch {}

  // 2. Hapus dari Supabase Cloud (dilewati saat Mode Demo)
  if (!isDemoSessionActive()) {
    try {
      await supabase.rpc('rpc_delete_store_downline', {
        p_slug: targetSlug,
        p_token: token,
        p_partner_code: partnerCode
      });
    } catch (e) {
      console.warn('Error deleting downline in Supabase:', e);
    }
  }

  notifyPosDataSync(targetSlug, ['downlines']);
  return filtered;
}

export async function clearAllStoreDownlines(storeSlug?: string): Promise<void> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  const codes = new Set<string>(
    getLocalDownlines(targetSlug).flatMap(m => [m.partnerCode, m.id || '']).filter(Boolean)
  );
  try {
    const { data: list } = await supabase.rpc('rpc_get_store_downlines', {
      p_slug: targetSlug,
      p_token: token
    });
    if (Array.isArray(list)) {
      list.forEach((m: any) => m.partner_code && codes.add(String(m.partner_code)));
    }
  } catch {}

  markDownlinesDeleted(targetSlug, Array.from(codes), true);

  try {
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify([]));
    localStorage.setItem(`sr12_mitra_downlines_${targetSlug}`, JSON.stringify([]));
  } catch {}

  if (isDemoSessionActive()) {
    notifyPosDataSync(targetSlug, ['downlines']);
    return;
  }

  try {
    await supabase.rpc('rpc_clear_store_downlines', {
      p_slug: targetSlug,
      p_token: token
    });
  } catch {}

  try {
    const { data: remaining } = await supabase.rpc('rpc_get_store_downlines', {
      p_slug: targetSlug,
      p_token: token
    });
    if (Array.isArray(remaining)) {
      for (const m of remaining) {
        try {
          await supabase.rpc('rpc_delete_store_downline', {
            p_slug: targetSlug,
            p_token: token,
            p_partner_code: m.partner_code
          });
        } catch {}
      }
    }
  } catch (e) {
    console.warn('Error clearing downlines in Supabase:', e);
  }

  notifyPosDataSync(targetSlug, ['downlines']);
}

export async function resetDownlineAccumulatedSpent(storeSlug?: string): Promise<void> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  try {
    const list = getLocalDownlines(targetSlug);
    const resetList = list.map(m => ({
      ...m,
      accumulatedSpent90Days: 0,
      totalOrdersCount: 0,
      lastOrderDate: undefined
    }));
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(resetList));
    localStorage.setItem(`sr12_mitra_downlines_${targetSlug}`, JSON.stringify(resetList));

    if (isDemoSessionActive()) {
      notifyPosDataSync(targetSlug, ['downlines']);
      return;
    }

    let rpcOk = false;
    try {
      const { data, error } = await supabase.rpc('rpc_reset_store_downline_spent', {
        p_slug: targetSlug,
        p_token: token
      });
      rpcOk = !error && Boolean(data?.success);
    } catch {}

    if (!rpcOk) {
      for (const m of resetList) {
        await saveStoreDownline(m, targetSlug);
      }
    }
  } catch {}

  notifyPosDataSync(targetSlug, ['downlines']);
}

export async function resetDownlinesToDefault(storeSlug?: string): Promise<void> {
  const targetSlug = storeSlug || 'sr12-central';
  try {
    unmarkDownlineDeleted(
      targetSlug,
      DEFAULT_SAMPLE_DOWNLINES.map(m => m.partnerCode)
    );
    const scoped = DEFAULT_SAMPLE_DOWNLINES.map(m => ({ ...m, storeSlug: targetSlug }));
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(scoped));
    localStorage.setItem(`sr12_mitra_downlines_${targetSlug}`, JSON.stringify(scoped));
    for (const m of scoped) {
      await saveStoreDownline(m, targetSlug);
    }
  } catch {}
  notifyPosDataSync(targetSlug, ['downlines']);
}

/**
 * Deletes a single marketer commission entry permanently from local cache and Supabase Cloud.
 */
export async function deleteMarketerSale(orderId: string, storeSlug?: string): Promise<MarketerSale[]> {
  const targetSlug = (storeSlug || 'sr12-central').toLowerCase();
  const token = getActiveSessionToken(targetSlug);

  markMarketerSalesDeleted(targetSlug, [orderId]);
  const remaining = getLocalMarketerSales(targetSlug).filter(
    s => s.orderId.toUpperCase() !== orderId.toUpperCase()
  );
  try {
    localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(remaining));
    localStorage.setItem(`sr12_marketer_sales_${targetSlug}`, JSON.stringify(remaining));
  } catch {}

  if (isDemoSessionActive()) {
    notifyPosDataSync(targetSlug, ['downlines']);
    return remaining;
  }

  try {
    const { data, error } = await supabase.rpc('rpc_delete_marketer_sale', {
      p_slug: targetSlug,
      p_order_id: orderId,
      p_token: token
    });
    if (error || !data?.success) {
      // If order is orphaned (already absent or cancelled in active orders), rpc_delete_store_order is safe
      const activeOrders = await fetchStoreOrders(targetSlug);
      const stillActiveOrder = activeOrders.some(
        o => o.orderId.toUpperCase() === orderId.toUpperCase()
      );
      if (!stillActiveOrder) {
        await supabase.rpc('rpc_delete_store_order', {
          p_slug: targetSlug,
          p_order_id: orderId,
          p_token: token
        });
      }
    }
  } catch (err) {
    console.warn('Error deleting marketer sale in Supabase:', err);
  }

  notifyPosDataSync(targetSlug, ['downlines']);
  return remaining;
}

/**
 * Clears all marketer commission rows locally via persistent tombstones and in Supabase via SECURITY DEFINER RPCs.
 */
export async function clearAllMarketerSales(
  storeSlug?: string
): Promise<{ cloudDeleted: boolean; remainingCount: number }> {
  const targetSlug = (storeSlug || 'sr12-central').toLowerCase();
  const token = getActiveSessionToken(targetSlug);

  const allSaleOrderIds = new Set<string>(
    getLocalMarketerSales(targetSlug).map(s => s.orderId).filter(Boolean)
  );
  try {
    const { data: list } = await supabase.rpc('rpc_get_store_marketer_sales', {
      p_slug: targetSlug,
      p_token: token
    });
    if (Array.isArray(list)) {
      list.forEach((s: any) => s.order_id && allSaleOrderIds.add(String(s.order_id)));
    }
  } catch {}

  markMarketerSalesDeleted(targetSlug, Array.from(allSaleOrderIds));

  try {
    localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify([]));
    localStorage.setItem(`sr12_marketer_sales_${targetSlug}`, JSON.stringify([]));
  } catch {}

  if (isDemoSessionActive()) {
    notifyPosDataSync(targetSlug, ['downlines']);
    return { cloudDeleted: true, remainingCount: 0 };
  }

  // Unconditionally call SECURITY DEFINER RPCs (never rely on direct RLS DELETE returning an error)
  try {
    await supabase.rpc('rpc_clear_store_marketer_sales', {
      p_slug: targetSlug,
      p_token: token
    });
  } catch {}

  let remainingCount = 0;
  try {
    const [{ data: list }, activeOrders] = await Promise.all([
      supabase.rpc('rpc_get_store_marketer_sales', {
        p_slug: targetSlug,
        p_token: token
      }),
      fetchStoreOrders(targetSlug)
    ]);

    if (Array.isArray(list) && list.length > 0) {
      const activeIdSet = new Set(activeOrders.map(o => o.orderId.toUpperCase()));
      for (const s of list) {
        let rowDeleted = false;
        try {
          const { data: dRes, error: dErr } = await supabase.rpc('rpc_delete_marketer_sale', {
            p_slug: targetSlug,
            p_order_id: s.order_id,
            p_token: token
          });
          rowDeleted = !dErr && Boolean(dRes?.success);
        } catch {}

        if (!rowDeleted && !activeIdSet.has(String(s.order_id || '').toUpperCase())) {
          // Safe to use rpc_delete_store_order when the underlying order is already deleted/cancelled
          try {
            await supabase.rpc('rpc_delete_store_order', {
              p_slug: targetSlug,
              p_order_id: s.order_id,
              p_token: token
            });
          } catch {}
        }
      }

      // Final verification count
      const [{ data: afterList }, cancelledIds] = await Promise.all([
        supabase.rpc('rpc_get_store_marketer_sales', {
          p_slug: targetSlug,
          p_token: token
        }),
        fetchCancelledOrderIds(targetSlug)
      ]);
      if (Array.isArray(afterList)) {
        remainingCount = afterList.filter(
          (row: any) =>
            isActualMarketerSale({
              marketerId: row.marketer_id,
              commissionAmount: Number(row.commission_amount || 0)
            }) && !cancelledIds.has(String(row.order_id || '').toUpperCase())
        ).length;
      }
    }
  } catch (err) {
    console.warn('Error clearing marketer sales in Supabase:', err);
  }

  notifyPosDataSync(targetSlug, ['downlines']);
  return { cloudDeleted: remainingCount === 0, remainingCount };
}

