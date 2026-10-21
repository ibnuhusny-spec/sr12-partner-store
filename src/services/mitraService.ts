import { supabase, getActiveSessionToken } from '../config/supabase';
import { MarketerSale, MitraDownline, PartnerTier } from '../types';

export const DEFAULT_SAMPLE_DOWNLINES: MitraDownline[] = [
  {
    storeSlug: 'all',
    partnerCode: 'RS-101',
    name: 'Dewi Anggraini, S.Farm',
    phone: '081288992211',
    city: 'Jakarta Selatan',
    tier: 'reseller',
    bankName: 'BCA',
    bankAccount: '7310294821',
    bankHolder: 'Dewi Anggraini',
    status: 'active',
    accumulatedSpent90Days: 5200000, // >= 5jt -> LAYAK PROMOSI KE SUB AGEN (First Order Sub Agen 5jt)!
    totalOrdersCount: 16,
    lastOrderDate: '2026-10-18'
  },
  {
    storeSlug: 'all',
    partnerCode: 'RS-102',
    name: 'Budi Santoso',
    phone: '085712345678',
    city: 'Bandung',
    tier: 'reseller',
    bankName: 'Mandiri',
    bankAccount: '132001928374',
    bankHolder: 'Budi Santoso',
    status: 'active',
    accumulatedSpent90Days: 1850000, // Target min 3 bln 1.5jt tercapai aman
    totalOrdersCount: 7,
    lastOrderDate: '2026-10-15'
  },
  {
    storeSlug: 'all',
    partnerCode: 'RS-103',
    name: 'Rina Wulandari',
    phone: '087899887766',
    city: 'Semarang',
    tier: 'reseller',
    bankName: 'BRI',
    bankAccount: '009801234567',
    bankHolder: 'Rina Wulandari',
    status: 'active',
    accumulatedSpent90Days: 350000, // < 500rb/bln atau < 1.5jt/3 bln -> PERINGATAN TURUN KE MARKETER!
    totalOrdersCount: 2,
    lastOrderDate: '2026-10-02'
  },
  {
    storeSlug: 'all',
    partnerCode: 'SA-201',
    name: 'Hj. Nurul Hidayah',
    phone: '081399001122',
    city: 'Surabaya',
    tier: 'sub_agen',
    bankName: 'BSI',
    bankAccount: '7109283746',
    bankHolder: 'Nurul Hidayah',
    status: 'active',
    accumulatedSpent90Days: 26500000, // >= 25jt -> LAYAK PROMOSI KE AGEN (First Order Agen 25jt)!
    totalOrdersCount: 24,
    lastOrderDate: '2026-10-20'
  },
  {
    storeSlug: 'all',
    partnerCode: 'SA-202',
    name: 'Fitri Handayani',
    phone: '082155667788',
    city: 'Yogyakarta',
    tier: 'sub_agen',
    bankName: 'BCA',
    bankAccount: '8830192847',
    bankHolder: 'Fitri Handayani',
    status: 'active',
    accumulatedSpent90Days: 3200000, // < 4jt/bln (target 3 bln 12jt) -> PERINGATAN TURUN KE RESELLER!
    totalOrdersCount: 4,
    lastOrderDate: '2026-10-05'
  },
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
    accumulatedSpent90Days: 950000, // >= 800rb jalur prestasi / 500rb FO -> LAYAK PROMOSI KE RESELLER!
    totalOrdersCount: 8,
    lastOrderDate: '2026-10-19'
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
  const raw = localStorage.getItem('sr12_mitra_downlines_v2');
  let list: MitraDownline[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch {}
  }
  if (list.length === 0) {
    list = DEFAULT_SAMPLE_DOWNLINES;
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(list));
  }

  const found = list.find(m => 
    (m.partnerCode && m.partnerCode.toUpperCase() === cleanQ) ||
    (m.phone && m.phone.replace(/[^0-9]/g, '').endsWith(cleanQ.replace(/[^0-9]/g, '')))
  );

  if (found) {
    return { found: true, mitra: found };
  }

  return { found: false };
}

export async function fetchStoreDownlines(storeSlug: string): Promise<MitraDownline[]> {
  const token = getActiveSessionToken(storeSlug);
  try {
    const { data, error } = await supabase.rpc('rpc_get_store_downlines', {
      p_slug: storeSlug,
      p_token: token
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        storeSlug: d.store_slug,
        partnerCode: d.partner_code,
        name: d.name,
        phone: d.phone,
        city: d.city,
        tier: d.tier,
        bankName: d.bank_name || 'BCA',
        bankAccount: d.bank_account || '-',
        bankHolder: d.bank_holder || d.name,
        status: d.status || 'active',
        accumulatedSpent90Days: Number(d.accumulated_spent_90_days || 0),
        totalOrdersCount: Number(d.total_orders_count || 0)
      }));
    }
  } catch (e) {}

  // Fallback local
  try {
    const raw = localStorage.getItem('sr12_mitra_downlines_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed initial demo downlines so user can see rank promotion / warning right away
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(DEFAULT_SAMPLE_DOWNLINES));
    return DEFAULT_SAMPLE_DOWNLINES;
  } catch {
    return DEFAULT_SAMPLE_DOWNLINES;
  }
}

export async function saveStoreDownline(mitra: Partial<MitraDownline>, storeSlug: string): Promise<boolean> {
  const token = getActiveSessionToken(storeSlug);
  try {
    await supabase.rpc('rpc_save_store_downline', {
      p_slug: storeSlug,
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
        status: mitra.status || 'active'
      }
    });
  } catch (e) {}

  // Update local
  try {
    const raw = localStorage.getItem('sr12_mitra_downlines_v2');
    const list: MitraDownline[] = raw ? JSON.parse(raw) : [...DEFAULT_SAMPLE_DOWNLINES];
    const idx = list.findIndex(m => m.partnerCode === mitra.partnerCode);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...mitra } as MitraDownline;
    } else {
      list.push(mitra as MitraDownline);
    }
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(list));
  } catch (e) {}

  return true;
}

export async function updateMitraTier(partnerCode: string, newTier: PartnerTier, storeSlug: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem('sr12_mitra_downlines_v2');
    const list: MitraDownline[] = raw ? JSON.parse(raw) : [...DEFAULT_SAMPLE_DOWNLINES];
    const idx = list.findIndex(m => m.partnerCode === partnerCode);
    if (idx >= 0) {
      list[idx].tier = newTier;
      localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(list));
      await saveStoreDownline(list[idx], storeSlug);
      return true;
    }
  } catch (e) {}
  return false;
}

export async function fetchStoreMarketerSales(storeSlug: string): Promise<MarketerSale[]> {
  const token = getActiveSessionToken(storeSlug);
  try {
    const { data, error } = await supabase.rpc('rpc_get_store_marketer_sales', {
      p_slug: storeSlug,
      p_token: token
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        storeSlug: d.store_slug,
        orderId: d.order_id,
        marketerId: d.marketer_id,
        orderDate: d.order_date,
        monthPeriod: d.month_period,
        customerName: d.customer_name,
        customerPhone: d.customer_phone,
        customerAddress: d.customer_address,
        fulfillmentType: d.fulfillment_type || 'delivery',
        itemsDesc: d.items_desc,
        omsetHet: Number(d.omset_het || 0),
        commissionPct: Number(d.commission_pct || 15),
        commissionAmount: Number(d.commission_amount || 0),
        paidStatus: d.paid_status || 'unpaid',
        paidDate: d.paid_date
      }));
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('sr12_marketer_sales_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(DEFAULT_SAMPLE_MARKETER_SALES));
    return DEFAULT_SAMPLE_MARKETER_SALES;
  } catch {
    return DEFAULT_SAMPLE_MARKETER_SALES;
  }
}

export function updateMarketerSalePaidStatus(orderId: string, newStatus: 'paid' | 'unpaid'): boolean {
  try {
    const raw = localStorage.getItem('sr12_marketer_sales_v1');
    const list: MarketerSale[] = raw ? JSON.parse(raw) : [...DEFAULT_SAMPLE_MARKETER_SALES];
    const idx = list.findIndex(s => s.orderId === orderId);
    if (idx >= 0) {
      list[idx].paidStatus = newStatus;
      if (newStatus === 'paid') {
        list[idx].paidDate = new Date().toISOString().split('T')[0];
      } else {
        delete list[idx].paidDate;
      }
      localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(list));
      return true;
    }
  } catch {}
  return false;
}
