import { CashflowEntry, CashierAttendanceLog, CashierOperator, StockMutation } from '../types';
import { supabase } from '../config/supabase';
import { fetchStoreOrders } from './orderService';

export const DEFAULT_CASHIERS: CashierOperator[] = [
  { id: 'KASIR-01', name: 'Siti Aminah', pin: '1234', role: 'kasir', phone: '081234567891' },
  { id: 'KASIR-02', name: 'Budi Santoso', pin: '5678', role: 'gudang', phone: '081234567892' },
  { id: 'SPV-01', name: 'Hj. Aisyah', pin: '8899', role: 'spv', phone: '081234567893' }
];

const BUCKET_NAME = 'products';

/**
 * Mengunggah data buku kas ke Supabase Cloud Storage (Multi-Device Sync)
 */
export async function uploadCashflowToCloud(storeSlug: string, list: CashflowEntry[]): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    const path = `catalogs/${safeSlug}/cashflow.json`;
    await supabase.storage.from(BUCKET_NAME).upload(path, JSON.stringify(list, null, 2), {
      contentType: 'application/json',
      upsert: true
    });
  } catch (e) {
    console.warn('[PosService] Failed to upload cashflow to cloud:', e);
  }
}

/**
 * Membaca data buku kas dari memori lokal (0ms respon)
 */
export function getStoredCashflow(storeSlug: string): CashflowEntry[] {
  try {
    const raw = localStorage.getItem(`sr12_cashflow_${storeSlug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mengambil data buku kas dari Supabase Cloud Storage dan menyinkronkan dengan riwayat pesanan kasir
 */
export async function fetchStoreCashflow(storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const localList = getStoredCashflow(safeSlug);

  try {
    const path = `catalogs/${safeSlug}/cashflow.json`;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
    let cloudList: CashflowEntry[] = [];
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        cloudList = parsed;
      }
    }

    // Bersihkan catatan dummy test jika ada
    const cleanLocal = localList.filter(e => e.id !== 'CSH-TEST' && e.category !== 'Test Kas');
    const cleanCloud = cloudList.filter(e => e.id !== 'CSH-TEST' && e.category !== 'Test Kas');

    // Gabungkan cloud dan local, prioritaskan cloud
    const mergedMap = new Map<string, CashflowEntry>();
    cleanCloud.forEach(e => mergedMap.set(e.id, e));
    cleanLocal.forEach(e => {
      if (!mergedMap.has(e.id)) {
        mergedMap.set(e.id, e);
      }
    });
    mergedMap.delete('CSH-TEST');

    // Otomatis sinkronkan dari riwayat pesanan (orders) toko jika ada transaksi kasir/web lunas
    // yang belum tercatat di Buku Kas (menjamin omset tidak pernah 0 di HP baru)
    try {
      const orders = await fetchStoreOrders(safeSlug);
      const paidOrders = orders.filter(o => 
        !o.status?.toLowerCase().includes('batal') && 
        !o.status?.toLowerCase().includes('hapus') &&
        (o.status === 'Lunas / Selesai' || o.status === 'Selesai' || o.status === 'Lunas' || o.orderSource?.includes('Kasir'))
      );

      for (const ord of paidOrders) {
        const orderIdentifier = ord.orderId || ord.id || '';
        if (!orderIdentifier) continue;

        const exists = Array.from(mergedMap.values()).some(e => 
          (Boolean(e.id) && e.id.includes(orderIdentifier)) || 
          (Boolean(e.description) && e.description.includes(orderIdentifier)) ||
          (Boolean(e.category) && e.category.includes(orderIdentifier))
        );

        if (!exists) {
          const autoEntry: CashflowEntry = {
            id: `CSH-ORD-${orderIdentifier}`,
            storeSlug: safeSlug,
            date: ord.createdAt || ord.orderDate || new Date().toISOString(),
            type: 'in',
            category: ord.orderSource?.includes('Kasir') ? 'Penjualan Kasir POS' : `Pelunasan Order #${orderIdentifier}`,
            amount: ord.grandTotal || ord.subtotalHet || 0,
            description: `${ord.orderSource || 'Penjualan Kasir'} #${orderIdentifier} (${ord.customerName})`,
            operator: 'Kasir POS'
          };
          mergedMap.set(autoEntry.id, autoEntry);
        }
      }
    } catch (orderErr) {
      console.warn('[PosService] Warning checking orders for cashflow sync:', orderErr);
    }

    const merged = Array.from(mergedMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(merged));
    uploadCashflowToCloud(safeSlug, merged).catch(() => {});
    return merged;
  } catch (err) {
    console.warn(`[PosService] Error fetching cloud cashflow for ${safeSlug}:`, err);
    return localList;
  }
}

/**
 * Menyimpan catatan arus kas baru ke lokal dan Supabase Cloud
 */
export async function saveCashflowEntry(entry: CashflowEntry, storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const list = getStoredCashflow(safeSlug);
  const existingIdx = list.findIndex(e => e.id === entry.id);
  if (existingIdx >= 0) {
    list[existingIdx] = entry;
  } else {
    list.unshift(entry);
  }
  localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(list));
  uploadCashflowToCloud(safeSlug, list).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: safeSlug } }));
  }
  return list;
}

/**
 * Menghapus satu catatan arus kas dari lokal dan Supabase Cloud
 */
export async function deleteCashflowEntry(id: string, storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const list = getStoredCashflow(safeSlug);
  const next = list.filter(item => item.id !== id);
  localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(next));
  uploadCashflowToCloud(safeSlug, next).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: safeSlug } }));
  }
  return next;
}

/**
 * Mengosongkan seluruh riwayat buku kas di lokal dan Supabase Cloud
 */
export async function clearAllCashflow(storeSlug: string): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  localStorage.removeItem(`sr12_cashflow_${safeSlug}`);
  uploadCashflowToCloud(safeSlug, []).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: safeSlug } }));
  }
}

/**
 * Mengunggah riwayat mutasi stok ke Supabase Cloud
 */
export async function uploadStockMutationsToCloud(storeSlug: string, list: StockMutation[]): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    const path = `catalogs/${safeSlug}/mutations.json`;
    await supabase.storage.from(BUCKET_NAME).upload(path, JSON.stringify(list, null, 2), {
      contentType: 'application/json',
      upsert: true
    });
  } catch (e) {
    console.warn('[PosService] Failed to upload stock mutations to cloud:', e);
  }
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
 * Mengambil mutasi stok dari Supabase Cloud
 */
export async function fetchStoreStockMutations(storeSlug: string): Promise<StockMutation[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const localList = getStoredStockMutations(safeSlug);

  try {
    const path = `catalogs/${safeSlug}/mutations.json`;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(`sr12_mutations_${safeSlug}`, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch {}
  return localList;
}

/**
 * Mencatat mutasi stok keluar / masuk ke lokal dan Supabase Cloud
 */
export async function recordStockMutation(mutation: StockMutation, storeSlug: string): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const list = getStoredStockMutations(safeSlug);
  list.unshift(mutation);
  localStorage.setItem(`sr12_mutations_${safeSlug}`, JSON.stringify(list));
  uploadStockMutationsToCloud(safeSlug, list).catch(() => {});
}

/**
 * Mengosongkan mutasi stok toko
 */
export async function clearAllStockMutations(storeSlug: string): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  localStorage.removeItem(`sr12_mutations_${safeSlug}`);
  uploadStockMutationsToCloud(safeSlug, []).catch(() => {});
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
