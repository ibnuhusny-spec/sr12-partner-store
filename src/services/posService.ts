import { CashflowEntry, CashierAttendanceLog, CashierOperator, StockMutation, MarketerSale } from '../types';
import { supabase, getActiveSessionToken } from '../config/supabase';
import { fetchStoreOrders, createOrder, updateOrderStatus, getLocalOrders } from './orderService';
import { filterDeletedCashflow, markCashflowDeleted, notifyPosDataSync, unmarkCashflowDeleted } from './cleanupGuard';
import { getLocalMarketerSales, fetchStoreMarketerSales, updateMarketerSalePaidStatus } from './mitraService';
import { isDemoSessionActive } from './demoGuard';

export function buildDefaultOwnerCashier(ownerName?: string, ownerPin?: string): CashierOperator {
  return {
    id: 'OWNER-01',
    name: (ownerName || '').trim() || 'Pemilik Toko',
    pin: (ownerPin || '').trim() || '1234',
    role: 'spv',
    phone: ''
  };
}

/**
 * Mengambil daftar kasir/operator toko dari penyimpanan lokal.
 * Jika belum ada, otomatis diisi dengan akun Pemilik Toko sebagai operator utama.
 */
export function getStoreCashiers(storeSlug: string, ownerName?: string, ownerPin?: string): CashierOperator[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const key = `sr12_cashiers_${safeSlug}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as CashierOperator[];
      }
    }
  } catch {}

  const initial = [buildDefaultOwnerCashier(ownerName, ownerPin)];
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function saveStoreCashiers(storeSlug: string, cashiers: CashierOperator[]): void {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    localStorage.setItem(`sr12_cashiers_${safeSlug}`, JSON.stringify(cashiers));
  } catch {}
}

export function getActiveCashier(storeSlug: string, ownerName?: string, ownerPin?: string): CashierOperator {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const cashiers = getStoreCashiers(safeSlug, ownerName, ownerPin);
  try {
    const raw = localStorage.getItem(`sr12_active_cashier_${safeSlug}`);
    if (raw) {
      const saved = JSON.parse(raw) as CashierOperator;
      const matched = cashiers.find(c => c.id === saved.id);
      if (matched) return matched;
    }
  } catch {}
  return cashiers[0];
}

export function setActiveCashier(storeSlug: string, cashier: CashierOperator): void {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    localStorage.setItem(`sr12_active_cashier_${safeSlug}`, JSON.stringify(cashier));
    saveAttendanceLog({
      id: `ATT-${Date.now()}`,
      storeSlug: safeSlug,
      cashierId: cashier.id,
      cashierName: cashier.name,
      clockIn: new Date().toISOString(),
      shiftSalesCount: 0,
      shiftOmsetTotal: 0,
      shiftCashTotal: 0,
      notes: 'Ganti shift kasir via PIN'
    }, safeSlug);
  } catch {}
}

/**
 * Membaca data buku kas dari memori lokal (0ms respon instan)
 * Otomatis merekonsiliasi setiap komisi marketer yang sudah LUNAS agar selalu tercatat sebagai Kas Keluar
 */
export function getStoredCashflow(storeSlug: string): CashflowEntry[] {
  try {
    const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
    const raw = localStorage.getItem(`sr12_cashflow_${safeSlug}`);
    const parsed = raw ? JSON.parse(raw) : [];
    const baseList: CashflowEntry[] = Array.isArray(parsed) ? filterDeletedCashflow(safeSlug, parsed) : [];

    // AUTO-RECONCILE (0ms): Pastikan seluruh marketer_sales dengan paidStatus === 'paid' selalu hadir di cashflow lokal
    const existingIds = new Set(baseList.map(e => e.id));
    const localSales = getLocalMarketerSales(safeSlug);
    let hasNewPaidSales = false;

    localSales.forEach(s => {
      if (s.paidStatus === 'paid' && (s.commissionAmount || 0) > 0) {
        const payoutId = `CSH-MKT-${s.orderId}`;
        unmarkCashflowDeleted(safeSlug, [payoutId, s.orderId]);
        if (!existingIds.has(payoutId)) {
          existingIds.add(payoutId);
          baseList.push({
            id: payoutId,
            storeSlug: safeSlug,
            date: s.paidDate || s.orderDate || new Date().toISOString(),
            type: 'out',
            category: 'Gaji & Komisi Marketer',
            amount: s.commissionAmount,
            description: `Pelunasan Komisi 15% Marketer #${s.marketerId} (Pesanan #${s.orderId} - ${s.customerName || 'Konsumen'})`,
            operator: 'Owner Toko'
          });
          hasNewPaidSales = true;
        }
      }
    });

    if (hasNewPaidSales) {
      baseList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      try {
        localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(baseList));
      } catch {}
    }

    return baseList;
  } catch {
    return [];
  }
}

/**
 * Mengambil data buku kas langsung dari Supabase Database (Single Source of Truth).
 * Otomatis menyinkronkan:
 * 1. Transaksi penjualan kasir POS offline (Kas Masuk)
 * 2. Transaksi pesanan web toko yang sudah lunas (Kas Masuk)
 * 3. Seluruh pelunasan komisi 15% marketer yang berstatus LUNAS (Kas Keluar)
 * 4. Catatan kas masuk / kas keluar manual (seperti Buka Kas / Modal Awal, Operasional)
 * Jika data direset/dikosongkan di satu perangkat, perangkat lain OTOMATIS BERSIH 100%.
 */
export async function fetchStoreCashflow(storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();

  try {
    // 1. Ambil transaksi aktif toko dan data komisi marketer dari Supabase Cloud / Fallback Lokal
    const [orders, cloudSales] = await Promise.all([
      fetchStoreOrders(safeSlug).catch(() => getLocalOrders(safeSlug)),
      fetchStoreMarketerSales(safeSlug).catch(() => getLocalMarketerSales(safeSlug))
    ]);
    
    // Filter HANYA transaksi yang aktif (TIDAK DIBATALKAN / TIDAK DIHAPUS)
    const activeOrders = (orders || []).filter(o => 
      !o.status?.toLowerCase().includes('batal') && 
      !o.status?.toLowerCase().includes('hapus')
    );

    const cashList: CashflowEntry[] = [];
    const addedIds = new Set<string>();

    // 1. Catat penjualan kasir & manual cashflow dari orders
    activeOrders.forEach(ord => {
      const orderIdentifier = ord.orderId || ord.id || '';
      if (!orderIdentifier) return;

      const isManualIn = ord.orderSource === 'Kas Manual: in';
      const isManualOut = ord.orderSource === 'Kas Manual: out';

      if (isManualIn || isManualOut) {
        if (!addedIds.has(orderIdentifier)) {
          addedIds.add(orderIdentifier);
          cashList.push({
            id: orderIdentifier,
            storeSlug: safeSlug,
            date: ord.createdAt || ord.orderDate || new Date().toISOString(),
            type: isManualOut ? 'out' : 'in',
            category: ord.customerName || 'Arus Kas Toko',
            amount: ord.grandTotal || 0,
            description: ord.customerAddress !== '-' ? (ord.customerAddress || '-') : (ord.customerName || '-'),
            operator: ord.paymentMethod || 'Kasir Utama'
          });
        }
      } else if (
        ord.status === 'Lunas / Selesai' || 
        ord.status === 'Selesai' || 
        ord.status === 'Lunas' || 
        ord.orderSource?.includes('Kasir')
      ) {
        const entryId = `CSH-ORD-${orderIdentifier}`;
        if (!addedIds.has(entryId)) {
          addedIds.add(entryId);
          cashList.push({
            id: entryId,
            storeSlug: safeSlug,
            date: ord.createdAt || ord.orderDate || new Date().toISOString(),
            type: 'in',
            category: ord.orderSource?.includes('Kasir') ? 'Penjualan Kasir POS' : 'Pelunasan Pesanan Web',
            amount: ord.grandTotal || ord.subtotalHet || 0,
            description: `${ord.orderSource || 'Penjualan'} #${orderIdentifier} (${ord.customerName})`,
            operator: 'Kasir POS'
          });
        }
      }
    });

    // 2. OTOMATIS CATAT SETIAP GAJI MARKETER YANG TELAH DILUNASKAN (PAID) KE KAS KELUAR
    const localSales = getLocalMarketerSales(safeSlug);
    const salesMap = new Map<string, MarketerSale>();

    // Masukkan data komisi dari cloud
    (cloudSales || []).forEach(s => {
      if (s && s.orderId) salesMap.set(s.orderId, s);
    });

    // Gabungkan dengan penjualan lokal (status 'paid' dari perangkat manapun selalu diprioritaskan)
    (localSales || []).forEach(s => {
      if (!s || !s.orderId) return;
      const existing = salesMap.get(s.orderId);
      if (!existing) {
        salesMap.set(s.orderId, s);
      } else if (s.paidStatus === 'paid') {
        salesMap.set(s.orderId, {
          ...existing,
          ...s,
          paidStatus: 'paid',
          paidDate: s.paidDate || existing.paidDate || new Date().toISOString().split('T')[0]
        });
      }
    });

    // Periksa juga apakah ada pesanan aktif marketer yang belum sempat sinkron ke tabel komisi
    activeOrders.forEach(ord => {
      const orderId = ord.orderId || ord.id;
      if (!orderId) return;
      const isMarketer = ord.tier === 'marketer' || Boolean(ord.marketerId);
      if (isMarketer && !salesMap.has(orderId)) {
        const mCode = ord.marketerId || ord.partnerCode || 'MKT-001-MRS';
        const subHet = ord.subtotalHet || ord.grandTotal || 0;
        const comm = Math.round(subHet * 0.15);
        salesMap.set(orderId, {
          storeSlug: safeSlug,
          orderId,
          marketerId: mCode,
          orderDate: (ord.createdAt || new Date().toISOString()).split('T')[0],
          monthPeriod: (ord.createdAt || new Date().toISOString()).slice(0, 7),
          customerName: ord.customerName || 'Konsumen',
          customerPhone: ord.customerPhone || '-',
          fulfillmentType: ord.orderSource?.includes('Kasir') ? 'pickup' : 'delivery',
          itemsDesc: typeof ord.items === 'string' ? ord.items : JSON.stringify(ord.items || []),
          omsetHet: subHet,
          commissionPct: 15,
          commissionAmount: comm,
          paidStatus: 'unpaid'
        });
      }
    });

    const activeSales = Array.from(salesMap.values());
    activeSales.forEach(s => {
      if (s.paidStatus === 'paid' && (s.commissionAmount || 0) > 0) {
        const payoutId = `CSH-MKT-${s.orderId}`;
        unmarkCashflowDeleted(safeSlug, [payoutId, s.orderId]);
        if (!addedIds.has(payoutId)) {
          addedIds.add(payoutId);
          cashList.push({
            id: payoutId,
            storeSlug: safeSlug,
            date: s.paidDate || s.orderDate || new Date().toISOString(),
            type: 'out',
            category: 'Gaji & Komisi Marketer',
            amount: s.commissionAmount,
            description: `Pelunasan Komisi 15% Marketer #${s.marketerId} (Pesanan #${s.orderId} - ${s.customerName || 'Konsumen'})`,
            operator: 'Owner Toko'
          });
        }
      }
    });

    // 3. Gabungkan juga entri lokal yang valid (seperti manual modal awal / buka kas yang tersimpan di cache)
    let localCache: CashflowEntry[] = [];
    try {
      const raw = localStorage.getItem(`sr12_cashflow_${safeSlug}`);
      if (raw) localCache = JSON.parse(raw);
    } catch {}

    if (Array.isArray(localCache)) {
      localCache.forEach(e => {
        if (e && e.id && !addedIds.has(e.id)) {
          addedIds.add(e.id);
          cashList.push(e);
        }
      });
    }

    // Urutkan dari yang paling baru & saring entri yang sudah dihapus permanen
    cashList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const cleanCashList = filterDeletedCashflow(safeSlug, cashList);

    // Timpa penyimpanan lokal dengan data mutlak dari Supabase Cloud + Payroll Marketer
    localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(cleanCashList));
    return cleanCashList;
  } catch (err) {
    console.warn(`[PosService] Error fetching cloud cashflow for ${safeSlug}:`, err);
    return getStoredCashflow(safeSlug);
  }
}

/**
 * Menyimpan catatan arus kas baru langsung ke Supabase Database via RPC
 * Menjamin tersinkronisasi instan ke seluruh laptop, HP, dan tablet.
 */
export async function saveCashflowEntry(entry: CashflowEntry, storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const cleanId = entry.id.replace(/^CSH-ORD-/, '').replace(/^CSH-MKT-/, '').replace(/^CSH-/, '');

  // 1. Bersihkan dari tombstone jika sebelumnya pernah dihapus
  unmarkCashflowDeleted(safeSlug, [
    entry.id,
    cleanId,
    `CSH-${cleanId}`,
    `CSH-MKT-${cleanId}`,
    `CSH-ORD-${cleanId}`
  ]);

  // 2. Simpan mutasi arus kas ke local storage secara instan (0ms latency)
  let dedupedLocal: CashflowEntry[] = [entry];
  try {
    const raw = localStorage.getItem(`sr12_cashflow_${safeSlug}`);
    const localList: CashflowEntry[] = raw ? JSON.parse(raw) : [];
    dedupedLocal = [entry, ...localList.filter(e => e.id !== entry.id)];
    localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(dedupedLocal));
  } catch {}

  // 3. Simpan mutasi arus kas ke Supabase Database table 'orders'
  const orderPayload: any = {
    orderId: entry.id.startsWith('CSH-') ? entry.id : `CSH-${entry.id}`,
    storeSlug: safeSlug,
    customerName: entry.category,
    customerPhone: '-',
    customerAddress: entry.description || '-',
    tier: 'konsumen',
    tierLabel: 'Buku Kas',
    items: [],
    subtotalHet: entry.amount,
    discountAmount: 0,
    grandTotal: entry.amount,
    paymentMethod: entry.operator || 'Kasir Utama',
    status: 'Lunas / Selesai',
    orderSource: `Kas Manual: ${entry.type}`,
    createdAt: entry.date || new Date().toISOString()
  };

  try {
    await createOrder(orderPayload, safeSlug);
  } catch (err) {
    console.warn('[PosService] Warning saving cashflow order to Supabase:', err);
  }

  const freshList = await fetchStoreCashflow(safeSlug);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: safeSlug } }));
  }
  return freshList.length > 0 ? freshList : dedupedLocal;
}

/**
 * Menghapus satu catatan arus kas dari Supabase Database
 */
export async function deleteCashflowEntry(id: string, storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const cleanId = id.replace(/^CSH-ORD-/, '').replace(/^CSH-MKT-/, '');
  const token = getActiveSessionToken(safeSlug);

  markCashflowDeleted(safeSlug, [id, cleanId, `CSH-MKT-${cleanId}`, `CSH-ORD-${cleanId}`]);

  // Jika mutasi ini adalah pelunasan gaji marketer (CSH-MKT-...), ubah juga status komisinya kembali ke unpaid!
  if (id.startsWith('CSH-MKT-')) {
    try {
      await updateMarketerSalePaidStatus(cleanId, 'unpaid', safeSlug);
    } catch {}
  }

  // Hapus dari local storage instan
  try {
    const localList = getStoredCashflow(safeSlug);
    const filtered = localList.filter(e => e.id !== id && e.id !== cleanId && e.id !== `CSH-MKT-${cleanId}`);
    localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(filtered));
  } catch {}

  try {
    await updateOrderStatus(cleanId, 'Dibatalkan / Dihapus', safeSlug);
    if (id !== cleanId) {
      await updateOrderStatus(id, 'Dibatalkan / Dihapus', safeSlug);
    }
    if (!isDemoSessionActive()) {
      try {
        await supabase.rpc('rpc_delete_marketer_sale', {
          p_slug: safeSlug,
          p_order_id: cleanId,
          p_token: token
        });
      } catch {}
    }
  } catch (err) {
    console.warn('[PosService] Warning deleting cashflow order in Supabase:', err);
  }

  const freshList = await fetchStoreCashflow(safeSlug);
  notifyPosDataSync(safeSlug, ['cashflow', 'orders', 'downlines']);
  return freshList;
}

/**
 * Mengosongkan seluruh riwayat buku kas di Supabase Database dan memori lokal
 */
export async function clearAllCashflow(storeSlug: string): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const token = getActiveSessionToken(safeSlug);

  const idsToClear = new Set<string>(getStoredCashflow(safeSlug).map(e => e.id).filter(Boolean));
  const targetOrders: string[] = [];

  try {
    const orders = await fetchStoreOrders(safeSlug);
    for (const o of orders) {
      if (
        o.orderSource?.startsWith('Kas Manual') ||
        o.orderSource?.includes('Kasir') ||
        o.status?.includes('Lunas') ||
        o.status?.includes('Selesai')
      ) {
        idsToClear.add(o.orderId);
        idsToClear.add(`CSH-ORD-${o.orderId}`);
        targetOrders.push(o.orderId);
      }
    }
  } catch (err) {
    console.warn('[PosService] Warning fetching cashflow orders for clear:', err);
  }

  markCashflowDeleted(safeSlug, Array.from(idsToClear));
  localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify([]));

  try {
    for (const oid of targetOrders) {
      await updateOrderStatus(oid, 'Dibatalkan / Dihapus', safeSlug);
      if (!isDemoSessionActive()) {
        try {
          await supabase.rpc('rpc_delete_marketer_sale', {
            p_slug: safeSlug,
            p_order_id: oid,
            p_token: token
          });
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[PosService] Warning clearing cashflow in Supabase:', err);
  }

  notifyPosDataSync(safeSlug, ['cashflow', 'orders', 'downlines']);
}

/**
 * Membaca mutasi stok dari lokal
 */
export function getStoredStockMutations(storeSlug: string): StockMutation[] {
  try {
    const raw = localStorage.getItem(`sr12_mutations_${storeSlug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mengambil mutasi stok
 */
export async function fetchStoreStockMutations(storeSlug: string): Promise<StockMutation[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  return getStoredStockMutations(safeSlug);
}

/**
 * Mencatat mutasi stok
 */
export async function recordStockMutation(mutation: StockMutation, storeSlug: string): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const list = getStoredStockMutations(safeSlug);
  list.unshift(mutation);
  localStorage.setItem(`sr12_mutations_${safeSlug}`, JSON.stringify(list));
}

/**
 * Mengosongkan mutasi stok toko
 */
export async function clearAllStockMutations(storeSlug: string): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  localStorage.removeItem(`sr12_mutations_${safeSlug}`);
}

export function getStoredAttendanceLogs(storeSlug: string): CashierAttendanceLog[] {
  try {
    const raw = localStorage.getItem(`sr12_attendance_${storeSlug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAttendanceLog(log: CashierAttendanceLog, storeSlug: string): void {
  const list = getStoredAttendanceLogs(storeSlug);
  const idx = list.findIndex(l => l.id === log.id);
  if (idx >= 0) {
    list[idx] = log;
  } else {
    list.unshift(log);
  }
  localStorage.setItem(`sr12_attendance_${storeSlug}`, JSON.stringify(list));
}

export function exportReportsToCSV(rows: Array<Record<string, any>>, filename = 'laporan-penjualan.csv'): void {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
