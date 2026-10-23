import { CashflowEntry, CashierAttendanceLog, CashierOperator, StockMutation } from '../types';
import { supabase } from '../config/supabase';
import { fetchStoreOrders, createOrder, updateOrderStatus } from './orderService';

export const DEFAULT_CASHIERS: CashierOperator[] = [
  { id: 'KASIR-01', name: 'Siti Aminah', pin: '1234', role: 'kasir', phone: '081234567891' },
  { id: 'KASIR-02', name: 'Budi Santoso', pin: '5678', role: 'gudang', phone: '081234567892' },
  { id: 'SPV-01', name: 'Hj. Aisyah', pin: '8899', role: 'spv', phone: '081234567893' }
];

/**
 * Membaca data buku kas dari memori lokal (0ms respon instan)
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
 * Mengambil data buku kas langsung dari Supabase Database (Single Source of Truth).
 * Otomatis menyinkronkan:
 * 1. Transaksi penjualan kasir POS offline
 * 2. Transaksi pesanan web toko yang sudah lunas
 * 3. Catatan kas masuk / kas keluar manual (seperti Buka Kas / Modal Awal, Operasional)
 * Jika data direset/dikosongkan di satu perangkat, perangkat lain OTOMATIS BERSIH 100%.
 */
export async function fetchStoreCashflow(storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();

  try {
    // 1. Ambil seluruh transaksi aktif toko dari Supabase RPC Database
    const orders = await fetchStoreOrders(safeSlug);
    
    // Filter HANYA transaksi yang aktif (TIDAK DIBATALKAN / TIDAK DIHAPUS)
    const activeOrders = (orders || []).filter(o => 
      !o.status?.toLowerCase().includes('batal') && 
      !o.status?.toLowerCase().includes('hapus')
    );

    const cashList: CashflowEntry[] = [];

    activeOrders.forEach(ord => {
      const orderIdentifier = ord.orderId || ord.id || '';
      if (!orderIdentifier) return;

      const isManualIn = ord.orderSource === 'Kas Manual: in';
      const isManualOut = ord.orderSource === 'Kas Manual: out';

      if (isManualIn || isManualOut) {
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
      } else if (
        ord.status === 'Lunas / Selesai' || 
        ord.status === 'Selesai' || 
        ord.status === 'Lunas' || 
        ord.orderSource?.includes('Kasir')
      ) {
        cashList.push({
          id: `CSH-ORD-${orderIdentifier}`,
          storeSlug: safeSlug,
          date: ord.createdAt || ord.orderDate || new Date().toISOString(),
          type: 'in',
          category: ord.orderSource?.includes('Kasir') ? 'Penjualan Kasir POS' : 'Pelunasan Pesanan Web',
          amount: ord.grandTotal || ord.subtotalHet || 0,
          description: `${ord.orderSource || 'Penjualan'} #${orderIdentifier} (${ord.customerName})`,
          operator: 'Kasir POS'
        });
      }
    });

    // Urutkan dari yang paling baru
    cashList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Timpa penyimpanan lokal dengan data mutlak dari Supabase Cloud
    localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify(cashList));
    return cashList;
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

  // Simpan mutasi arus kas ke Supabase Database table 'orders'
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
  return freshList;
}

/**
 * Menghapus satu catatan arus kas dari Supabase Database
 */
export async function deleteCashflowEntry(id: string, storeSlug: string): Promise<CashflowEntry[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const cleanId = id.replace('CSH-ORD-', '');

  try {
    await updateOrderStatus(cleanId, 'Dibatalkan / Dihapus', safeSlug);
    await updateOrderStatus(id, 'Dibatalkan / Dihapus', safeSlug);
  } catch (err) {
    console.warn('[PosService] Warning deleting cashflow order in Supabase:', err);
  }

  const freshList = await fetchStoreCashflow(safeSlug);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: safeSlug } }));
  }
  return freshList;
}

/**
 * Mengosongkan seluruh riwayat buku kas di Supabase Database dan memori lokal
 */
export async function clearAllCashflow(storeSlug: string): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();

  try {
    const orders = await fetchStoreOrders(safeSlug);
    for (const o of orders) {
      if (
        o.orderSource?.startsWith('Kas Manual') || 
        o.orderSource?.includes('Kasir') ||
        o.status?.includes('Lunas') ||
        o.status?.includes('Selesai')
      ) {
        await updateOrderStatus(o.orderId, 'Dibatalkan / Dihapus', safeSlug);
      }
    }
  } catch (err) {
    console.warn('[PosService] Warning clearing cashflow in Supabase:', err);
  }

  localStorage.setItem(`sr12_cashflow_${safeSlug}`, JSON.stringify([]));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: safeSlug } }));
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
