import { CashflowEntry, CashierAttendanceLog, CashierOperator, StockMutation } from '../types';

export const DEFAULT_CASHIERS: CashierOperator[] = [
  { id: 'KASIR-01', name: 'Siti Aminah', pin: '1234', role: 'kasir', phone: '081234567891' },
  { id: 'KASIR-02', name: 'Budi Santoso', pin: '5678', role: 'gudang', phone: '081234567892' },
  { id: 'SPV-01', name: 'Hj. Aisyah', pin: '8899', role: 'spv', phone: '081234567893' }
];

export function getStoredCashflow(storeSlug: string): CashflowEntry[] {
  try {
    const raw = localStorage.getItem(`sr12_cashflow_${storeSlug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCashflowEntry(entry: CashflowEntry, storeSlug: string): void {
  const list = getStoredCashflow(storeSlug);
  list.unshift(entry);
  localStorage.setItem(`sr12_cashflow_${storeSlug}`, JSON.stringify(list));
}

export function deleteCashflowEntry(id: string, storeSlug: string): CashflowEntry[] {
  const list = getStoredCashflow(storeSlug);
  const next = list.filter(item => item.id !== id);
  localStorage.setItem(`sr12_cashflow_${storeSlug}`, JSON.stringify(next));
  return next;
}

export function clearAllCashflow(storeSlug: string): void {
  localStorage.removeItem(`sr12_cashflow_${storeSlug}`);
}

export function getStoredStockMutations(storeSlug: string): StockMutation[] {
  try {
    const raw = localStorage.getItem(`sr12_mutations_${storeSlug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordStockMutation(mutation: StockMutation, storeSlug: string): void {
  const list = getStoredStockMutations(storeSlug);
  list.unshift(mutation);
  localStorage.setItem(`sr12_mutations_${storeSlug}`, JSON.stringify(list));
}

export function clearAllStockMutations(storeSlug: string): void {
  localStorage.removeItem(`sr12_mutations_${storeSlug}`);
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
