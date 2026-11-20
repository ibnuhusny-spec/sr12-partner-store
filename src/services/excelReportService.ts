import writeExcelFile, { Cell, Row } from 'write-excel-file/browser';
import { readSheet } from 'read-excel-file/browser';
import { MitraDownline, PartnerTier } from '../types';

export interface DailyPartnerSummaryItem {
  date: string;
  partnerCode: string;
  partnerName: string;
  tier: string;
  tierLabel: string;
  discountPct: number;
  orderCount: number;
  totalHet: number;
  totalHpp: number;
  totalDiscount: number;
  totalPaid: number;
  grossProfit: number;
  marketerCommission: number;
  netProfit: number;
}

export interface StoreReportContext {
  storeName: string;
  partnerTier: string;
  storeCity: string;
  storeOwner: string;
  slug: string;
}

export interface CompleteTransactionItem {
  date: string;
  time: string;
  invoice: string;
  source: string;
  partnerCode: string;
  marketerCode: string;
  customerName: string;
  customerPhone: string;
  tierLabel: string;
  discountPct: number;
  het: number;
  hpp: number;
  discount: number;
  netPaid: number;
  marketerComm: number;
  netProfit: number;
  paymentMethod: string;
  status: string;
}

const BASE_BORDER = {
  borderColor: '#cbd5e1',
  borderStyle: 'thin' as const
};

/**
 * Ekspor Rekap Harian Mitra ke file Excel (.xlsx) resmi dengan desain eksekutif & penuh warna
 */
export async function exportDailyPartnerSummaryToExcel(
  summaries: DailyPartnerSummaryItem[],
  store: StoreReportContext,
  periodLabel: string,
  customFileName?: string
): Promise<void> {
  const fileName = customFileName || `rekap-harian-mitra-${store.slug}-${new Date().toISOString().split('T')[0]}.xlsx`;

  const totalCols = 13;
  const nowFormatted = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  // 1. Header Banner Atas (Baris 1 - 3)
  const titleRow: Row = [
    {
      value: `LAPORAN REKAPITULASI PENJUALAN HARIAN MITRA`,
      fontWeight: 'bold',
      fontSize: 15,
      textColor: '#064e3b',
      backgroundColor: '#ecfdf5',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 28
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const storeInfoRow: Row = [
    {
      value: `Toko: ${store.storeName} (${store.partnerTier.toUpperCase()})  |  Kota: ${store.storeCity}  |  Pemilik Toko: ${store.storeOwner}`,
      fontWeight: 'bold',
      fontSize: 11,
      textColor: '#1e293b',
      backgroundColor: '#ecfdf5',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 20
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const metaRow: Row = [
    {
      value: `Periode: ${periodLabel}  |  Waktu Unduh: ${nowFormatted}  |  Total Data: ${summaries.length} Mitra/Hari`,
      fontStyle: 'italic',
      fontSize: 10,
      textColor: '#475569',
      backgroundColor: '#ecfdf5',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 18
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const spacerRow: Row = [];

  // 2. Judul Kolom Tabel (Baris 5)
  const HEADER_STYLE = {
    backgroundColor: '#047857', // Hijau Emerald Khas SR12
    textColor: '#ffffff',
    fontWeight: 'bold' as const,
    fontSize: 11,
    align: 'center' as const,
    alignVertical: 'center' as const,
    borderColor: '#065f46',
    borderStyle: 'thin' as const,
    height: 26,
    wrap: true
  };

  const headerRow: Row = [
    { value: 'No', ...HEADER_STYLE },
    { value: 'Tanggal', ...HEADER_STYLE },
    { value: 'Kode Mitra', ...HEADER_STYLE },
    { value: 'Nama Mitra / Pelanggan', ...HEADER_STYLE },
    { value: 'Level Kemitraan', ...HEADER_STYLE },
    { value: 'Diskon %', ...HEADER_STYLE },
    { value: 'Jml Order', ...HEADER_STYLE },
    { value: 'Total Omset HET (Rp)', ...HEADER_STYLE },
    { value: 'Modal Toko / HPP (Rp)', ...HEADER_STYLE },
    { value: 'Potongan Diskon (Rp)', ...HEADER_STYLE },
    { value: 'Total Bayar Net (Rp)', ...HEADER_STYLE },
    { value: 'Hak Gaji Marketer 15% (Rp)', ...HEADER_STYLE },
    { value: 'Laba Bersih Toko (Rp)', ...HEADER_STYLE }
  ];

  // 3. Baris Data (Zebra Striping & Pewarnaan Cerdas)
  const dataRows: Row[] = summaries.map((s, idx) => {
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? '#ffffff' : '#f8fafc';

    // Highlight Level Kemitraan
    let tierBg = rowBg;
    let tierColor = '#0f172a';
    const lowerTier = (s.tierLabel || '').toLowerCase();
    if (s.tier === 'marketer' || lowerTier.includes('marketer') || lowerTier.includes('afiliasi')) {
      tierBg = '#ede9fe'; // Ungu lembut Marketer
      tierColor = '#6b21a8';
    } else if (s.tier === 'agen' || lowerTier.includes('agen')) {
      tierBg = '#e0f2fe'; // Biru lembut Agen
      tierColor = '#0369a1';
    } else if (s.tier === 'sub_agen' || lowerTier.includes('sub agen')) {
      tierBg = '#e0f7fa'; // Cyan lembut Sub Agen
      tierColor = '#006064';
    } else if (s.tier === 'reseller' || lowerTier.includes('reseller')) {
      tierBg = '#fef3c7'; // Amber lembut Reseller
      tierColor = '#92400e';
    }

    return [
      { value: idx + 1, type: Number, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: s.date, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: s.partnerCode, type: String, fontWeight: 'bold', align: 'center', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: s.partnerName, type: String, align: 'left', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: s.tierLabel, type: String, align: 'center', fontWeight: 'bold', backgroundColor: tierBg, textColor: tierColor, ...BASE_BORDER },
      { value: `${s.discountPct}%`, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: s.orderCount, type: Number, align: 'center', fontWeight: 'bold', backgroundColor: rowBg, ...BASE_BORDER },
      { value: s.totalHet, type: Number, format: '#,##0', align: 'right', backgroundColor: rowBg, ...BASE_BORDER },
      { value: s.totalHpp, type: Number, format: '#,##0', align: 'right', backgroundColor: rowBg, ...BASE_BORDER },
      { value: s.totalDiscount, type: Number, format: '#,##0', align: 'right', backgroundColor: rowBg, ...BASE_BORDER },
      { value: s.totalPaid, type: Number, format: '#,##0', align: 'right', fontWeight: 'bold', backgroundColor: rowBg, textColor: '#0284c7', ...BASE_BORDER },
      { value: s.marketerCommission, type: Number, format: '#,##0', align: 'right', fontWeight: s.marketerCommission > 0 ? 'bold' : undefined, backgroundColor: rowBg, textColor: s.marketerCommission > 0 ? '#7c3aed' : '#94a3b8', ...BASE_BORDER },
      { value: s.netProfit, type: Number, format: '#,##0', align: 'right', fontWeight: 'bold', backgroundColor: isEven ? '#ecfdf5' : '#e6fcf1', textColor: '#047857', ...BASE_BORDER }
    ];
  });

  // 4. Baris Total Keseluruhan
  const totalOrders = summaries.reduce((sum, s) => sum + s.orderCount, 0);
  const totalHet = summaries.reduce((sum, s) => sum + s.totalHet, 0);
  const totalHpp = summaries.reduce((sum, s) => sum + s.totalHpp, 0);
  const totalDiscount = summaries.reduce((sum, s) => sum + s.totalDiscount, 0);
  const totalPaid = summaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalMarketer = summaries.reduce((sum, s) => sum + s.marketerCommission, 0);
  const totalNet = summaries.reduce((sum, s) => sum + s.netProfit, 0);
  const netMarginPct = totalPaid > 0 ? ((totalNet / totalPaid) * 100) : 0;

  const TOTAL_STYLE = {
    backgroundColor: '#d1fae5', // Hijau mint lembut
    fontWeight: 'bold' as const,
    fontSize: 11,
    borderColor: '#059669',
    borderStyle: 'thin' as const,
    height: 26
  };

  const totalRow: Row = [
    {
      value: 'TOTAL KESELURUHAN',
      type: String,
      columnSpan: 6,
      align: 'center',
      alignVertical: 'center',
      textColor: '#064e3b',
      ...TOTAL_STYLE
    },
    ...Array(5).fill(null),
    { value: totalOrders, type: Number, align: 'center', textColor: '#064e3b', ...TOTAL_STYLE },
    { value: totalHet, type: Number, format: '#,##0', align: 'right', textColor: '#064e3b', ...TOTAL_STYLE },
    { value: totalHpp, type: Number, format: '#,##0', align: 'right', textColor: '#064e3b', ...TOTAL_STYLE },
    { value: totalDiscount, type: Number, format: '#,##0', align: 'right', textColor: '#064e3b', ...TOTAL_STYLE },
    { value: totalPaid, type: Number, format: '#,##0', align: 'right', textColor: '#0284c7', ...TOTAL_STYLE },
    { value: totalMarketer, type: Number, format: '#,##0', align: 'right', textColor: '#7c3aed', ...TOTAL_STYLE },
    { ...TOTAL_STYLE, value: totalNet, type: Number, format: '#,##0', align: 'right', textColor: '#047857', backgroundColor: '#a7f3d0' }
  ];

  // 5. Kotak Ringkasan Eksekutif Keuangan Toko di Bawah Tabel
  const kpiTitleRow: Row = [
    {
      value: 'RINGKASAN EKSEKUTIF KEUANGAN TOKO',
      type: String,
      columnSpan: 5,
      fontWeight: 'bold',
      fontSize: 11,
      textColor: '#064e3b',
      backgroundColor: '#ecfdf5',
      borderColor: '#059669',
      borderStyle: 'thin',
      align: 'left',
      height: 22
    },
    ...Array(4).fill(null)
  ];

  const makeKpiRow = (label: string, val: number | string, isCurrency = true, highlightBg?: string, highlightColor?: string): Row => [
    {
      value: label,
      type: String,
      columnSpan: 3,
      fontWeight: 'bold',
      fontSize: 10,
      textColor: '#334155',
      backgroundColor: highlightBg || '#f8fafc',
      borderColor: '#cbd5e1',
      borderStyle: 'thin',
      align: 'left',
      height: 20
    },
    null, null,
    {
      value: val,
      type: typeof val === 'number' ? Number : String,
      columnSpan: 2,
      fontWeight: 'bold',
      fontSize: 10,
      textColor: highlightColor || '#0f172a',
      backgroundColor: highlightBg || '#f8fafc',
      borderColor: '#cbd5e1',
      borderStyle: 'thin',
      align: 'right',
      format: isCurrency && typeof val === 'number' ? '#,##0' : undefined
    },
    null
  ];

  const kpiRows: Row[] = [
    spacerRow,
    kpiTitleRow,
    makeKpiRow('Total Omset Kotor (HET):', totalHet),
    makeKpiRow('Modal Kulakan Toko (HPP):', totalHpp),
    makeKpiRow('Total Diskon Mitra Diberikan:', totalDiscount),
    makeKpiRow('Total Omset Bersih Toko (GMV / Kas Masuk):', totalPaid, true, '#e0f2fe', '#0284c7'),
    makeKpiRow('Total Hak Gaji / Komisi Marketer (15%):', totalMarketer, true, '#f3e8ff', '#7c3aed'),
    makeKpiRow('Keuntungan Bersih Pemilik Toko (Net Profit):', totalNet, true, '#d1fae5', '#047857'),
    makeKpiRow('Margin Keuntungan Bersih Toko (%):', `${netMarginPct.toFixed(1)}%`, false, '#d1fae5', '#047857')
  ];

  // Gabungkan seluruh baris
  const sheetData: Row[] = [
    titleRow,
    storeInfoRow,
    metaRow,
    spacerRow,
    headerRow,
    ...dataRows,
    totalRow,
    ...kpiRows
  ];

  // Konfigurasi lebar kolom profesional (menghindari teks terpotong / ###)
  const columns = [
    { width: 6 },  // No
    { width: 14 }, // Tanggal
    { width: 18 }, // Kode Mitra
    { width: 30 }, // Nama Mitra / Pelanggan
    { width: 24 }, // Level Kemitraan
    { width: 13 }, // Diskon %
    { width: 14 }, // Jml Order
    { width: 22 }, // Total Omset HET
    { width: 24 }, // Modal Toko / HPP
    { width: 22 }, // Potongan Diskon
    { width: 22 }, // Total Bayar Net
    { width: 26 }, // Hak Gaji Marketer 15%
    { width: 26 }  // Laba Bersih Toko
  ];

  try {
    await writeExcelFile(sheetData, {
      sheet: 'Rekap Harian Mitra',
      columns,
      stickyRowsCount: 5, // Bekukan 5 baris pertama agar header selalu terlihat saat scroll
      orientation: 'landscape'
    }).toFile(fileName);
  } catch (err) {
    console.warn('[ExcelService] Fallback ke toBlob() untuk download:', err);
    const blob = await writeExcelFile(sheetData, {
      sheet: 'Rekap Harian Mitra',
      columns,
      stickyRowsCount: 5,
      orientation: 'landscape'
    }).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Ekspor Seluruh Transaksi Pesanan Lengkap ke file Excel (.xlsx) dengan tema Biru Samudra
 */
export async function exportCompleteTransactionsToExcel(
  items: CompleteTransactionItem[],
  store: StoreReportContext,
  periodLabel: string,
  customFileName?: string
): Promise<void> {
  const fileName = customFileName || `transaksi-lengkap-${store.slug}-${new Date().toISOString().split('T')[0]}.xlsx`;

  const totalCols = 19;
  const nowFormatted = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  // 1. Header Banner Atas
  const titleRow: Row = [
    {
      value: `RINCIAN SELURUH TRANSAKSI PENJUALAN TOKO`,
      fontWeight: 'bold',
      fontSize: 15,
      textColor: '#0369a1',
      backgroundColor: '#f0f9ff',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 28
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const storeInfoRow: Row = [
    {
      value: `Toko: ${store.storeName} (${store.partnerTier.toUpperCase()})  |  Kota: ${store.storeCity}  |  Pemilik Toko: ${store.storeOwner}`,
      fontWeight: 'bold',
      fontSize: 11,
      textColor: '#1e293b',
      backgroundColor: '#f0f9ff',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 20
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const metaRow: Row = [
    {
      value: `Periode: ${periodLabel}  |  Waktu Unduh: ${nowFormatted}  |  Total Transaksi: ${items.length} Pesanan`,
      fontStyle: 'italic',
      fontSize: 10,
      textColor: '#475569',
      backgroundColor: '#f0f9ff',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 18
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const spacerRow: Row = [];

  // 2. Judul Kolom Tabel (Tema Biru Samudra)
  const HEADER_STYLE = {
    backgroundColor: '#0284c7', // Biru Samudra
    textColor: '#ffffff',
    fontWeight: 'bold' as const,
    fontSize: 11,
    align: 'center' as const,
    alignVertical: 'center' as const,
    borderColor: '#0369a1',
    borderStyle: 'thin' as const,
    height: 26,
    wrap: true
  };

  const headerRow: Row = [
    { value: 'No', ...HEADER_STYLE },
    { value: 'Tanggal', ...HEADER_STYLE },
    { value: 'Waktu', ...HEADER_STYLE },
    { value: 'No Invoice', ...HEADER_STYLE },
    { value: 'Sumber Pesanan', ...HEADER_STYLE },
    { value: 'Kode Mitra', ...HEADER_STYLE },
    { value: 'Kode Marketer / Ref', ...HEADER_STYLE },
    { value: 'Nama Pelanggan', ...HEADER_STYLE },
    { value: 'No WhatsApp', ...HEADER_STYLE },
    { value: 'Level Kemitraan', ...HEADER_STYLE },
    { value: 'Diskon %', ...HEADER_STYLE },
    { value: 'Subtotal HET (Rp)', ...HEADER_STYLE },
    { value: 'Modal HPP (Rp)', ...HEADER_STYLE },
    { value: 'Potongan Diskon (Rp)', ...HEADER_STYLE },
    { value: 'Total Bayar Net (Rp)', ...HEADER_STYLE },
    { value: 'Komisi Marketer 15% (Rp)', ...HEADER_STYLE },
    { value: 'Keuntungan Bersih (Rp)', ...HEADER_STYLE },
    { value: 'Metode Pembayaran', ...HEADER_STYLE },
    { value: 'Status Pesanan', ...HEADER_STYLE }
  ];

  // 3. Data Rows
  const dataRows: Row[] = items.map((o, idx) => {
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? '#ffffff' : '#f8fafc';

    return [
      { value: idx + 1, type: Number, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.date, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.time, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.invoice, type: String, fontWeight: 'bold', align: 'center', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: o.source, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.partnerCode, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.marketerCode, type: String, align: 'center', backgroundColor: rowBg, textColor: o.marketerCode !== '-' ? '#7c3aed' : '#94a3b8', ...BASE_BORDER },
      { value: o.customerName, type: String, align: 'left', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: o.customerPhone, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.tierLabel, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: `${o.discountPct}%`, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.het, type: Number, format: '#,##0', align: 'right', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.hpp, type: Number, format: '#,##0', align: 'right', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.discount, type: Number, format: '#,##0', align: 'right', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.netPaid, type: Number, format: '#,##0', align: 'right', fontWeight: 'bold', backgroundColor: rowBg, textColor: '#0284c7', ...BASE_BORDER },
      { value: o.marketerComm, type: Number, format: '#,##0', align: 'right', fontWeight: o.marketerComm > 0 ? 'bold' : undefined, backgroundColor: rowBg, textColor: o.marketerComm > 0 ? '#7c3aed' : '#94a3b8', ...BASE_BORDER },
      { value: o.netProfit, type: Number, format: '#,##0', align: 'right', fontWeight: 'bold', backgroundColor: isEven ? '#ecfdf5' : '#e6fcf1', textColor: '#047857', ...BASE_BORDER },
      { value: o.paymentMethod, type: String, align: 'center', backgroundColor: rowBg, ...BASE_BORDER },
      { value: o.status, type: String, align: 'center', fontWeight: 'bold', backgroundColor: rowBg, textColor: '#059669', ...BASE_BORDER }
    ];
  });

  // 4. Baris Total
  const totalHet = items.reduce((sum, o) => sum + o.het, 0);
  const totalHpp = items.reduce((sum, o) => sum + o.hpp, 0);
  const totalDiscount = items.reduce((sum, o) => sum + o.discount, 0);
  const totalNetPaid = items.reduce((sum, o) => sum + o.netPaid, 0);
  const totalMarketerComm = items.reduce((sum, o) => sum + o.marketerComm, 0);
  const totalNetProfit = items.reduce((sum, o) => sum + o.netProfit, 0);

  const TOTAL_STYLE = {
    backgroundColor: '#bae6fd', // Biru muda cerah
    fontWeight: 'bold' as const,
    fontSize: 11,
    borderColor: '#0284c7',
    borderStyle: 'thin' as const,
    height: 26
  };

  const totalRow: Row = [
    {
      value: 'TOTAL KESELURUHAN',
      type: String,
      columnSpan: 11,
      align: 'center',
      alignVertical: 'center',
      textColor: '#0369a1',
      ...TOTAL_STYLE
    },
    ...Array(10).fill(null),
    { value: totalHet, type: Number, format: '#,##0', align: 'right', textColor: '#0369a1', ...TOTAL_STYLE },
    { value: totalHpp, type: Number, format: '#,##0', align: 'right', textColor: '#0369a1', ...TOTAL_STYLE },
    { value: totalDiscount, type: Number, format: '#,##0', align: 'right', textColor: '#0369a1', ...TOTAL_STYLE },
    { value: totalNetPaid, type: Number, format: '#,##0', align: 'right', textColor: '#0284c7', ...TOTAL_STYLE },
    { value: totalMarketerComm, type: Number, format: '#,##0', align: 'right', textColor: '#7c3aed', ...TOTAL_STYLE },
    { ...TOTAL_STYLE, value: totalNetProfit, type: Number, format: '#,##0', align: 'right', textColor: '#047857', backgroundColor: '#a7f3d0' },
    { value: '-', type: String, align: 'center', textColor: '#0369a1', ...TOTAL_STYLE },
    { value: '-', type: String, align: 'center', textColor: '#0369a1', ...TOTAL_STYLE }
  ];

  const sheetData: Row[] = [
    titleRow,
    storeInfoRow,
    metaRow,
    spacerRow,
    headerRow,
    ...dataRows,
    totalRow
  ];

  const columns = [
    { width: 6 },  // No
    { width: 14 }, // Tanggal
    { width: 12 }, // Waktu
    { width: 22 }, // No Invoice
    { width: 16 }, // Sumber
    { width: 18 }, // Kode Mitra
    { width: 22 }, // Kode Marketer / Ref
    { width: 28 }, // Nama Pelanggan
    { width: 16 }, // No WhatsApp
    { width: 22 }, // Level
    { width: 12 }, // Diskon %
    { width: 20 }, // Subtotal HET
    { width: 22 }, // Modal HPP
    { width: 20 }, // Potongan Diskon
    { width: 22 }, // Total Bayar Net
    { width: 24 }, // Komisi Marketer 15%
    { width: 24 }, // Keuntungan Bersih
    { width: 18 }, // Metode
    { width: 16 }  // Status
  ];

  try {
    await writeExcelFile(sheetData, {
      sheet: 'Rincian Transaksi',
      columns,
      stickyRowsCount: 5,
      orientation: 'landscape'
    }).toFile(fileName);
  } catch (err) {
    console.warn('[ExcelService] Fallback ke toBlob() untuk download:', err);
    const blob = await writeExcelFile(sheetData, {
      sheet: 'Rincian Transaksi',
      columns,
      stickyRowsCount: 5,
      orientation: 'landscape'
    }).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export interface ParsedMitraRow {
  mitra: MitraDownline;
  isExisting: boolean;
  rowNumber: number;
}

export interface ParseMitraExcelResult {
  validMitra: MitraDownline[];
  previewRows: ParsedMitraRow[];
  skippedRows: Array<{ rowNumber: number; reason: string }>;
  totalRead: number;
}

/**
 * Mengunduh file template Excel resmi untuk import mitra baru
 * (Marketer, Reseller, Sub Agen, Agen, Distributor)
 */
export async function downloadMitraImportTemplate(storeName = 'SR12 Official'): Promise<void> {
  const fileName = 'template-import-mitra-sr12.xlsx';
  const totalCols = 10;

  const titleRow: Row = [
    {
      value: `TEMPLATE RESMI IMPORT DATA MITRA SR12`,
      fontWeight: 'bold',
      fontSize: 14,
      textColor: '#064e3b',
      backgroundColor: '#ecfdf5',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 26
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const guideRow1: Row = [
    {
      value: `Petunjuk: Kolom bertanda (*) wajib diisi. Pilihan Level Kemitraan: Marketer, Reseller, Sub Agen, Agen, Distributor.`,
      fontStyle: 'italic',
      fontSize: 10,
      textColor: '#334155',
      backgroundColor: '#ecfdf5',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 18
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const guideRow2: Row = [
    {
      value: `Aturan Diskon: Marketer (0% + Gaji 15%), Reseller (20%), Sub Agen (30%), Agen (40%), Distributor (50%). Jika Kode Mitra dikosongkan, sistem akan otomatis membuatkan kode.`,
      fontSize: 9.5,
      textColor: '#047857',
      backgroundColor: '#ecfdf5',
      columnSpan: totalCols,
      align: 'left',
      alignVertical: 'center',
      height: 18
    },
    ...Array(totalCols - 1).fill(null)
  ];

  const spacerRow: Row = [];

  const HEADER_STYLE = {
    backgroundColor: '#047857',
    textColor: '#ffffff',
    fontWeight: 'bold' as const,
    fontSize: 11,
    align: 'center' as const,
    alignVertical: 'center' as const,
    borderColor: '#065f46',
    borderStyle: 'thin' as const,
    height: 26,
    wrap: true
  };

  const headerRow: Row = [
    { value: 'Kode Mitra', ...HEADER_STYLE },
    { value: 'Nama Lengkap *', ...HEADER_STYLE },
    { value: 'Nomor WhatsApp / HP *', ...HEADER_STYLE },
    { value: 'Level Kemitraan *', ...HEADER_STYLE },
    { value: 'Kota / Kabupaten *', ...HEADER_STYLE },
    { value: 'Alamat Lengkap', ...HEADER_STYLE },
    { value: 'Nama Bank', ...HEADER_STYLE },
    { value: 'Nomor Rekening', ...HEADER_STYLE },
    { value: 'Nama Pemilik Rekening', ...HEADER_STYLE },
    { value: 'Status', ...HEADER_STYLE }
  ];

  const makeSampleRow = (
    code: string,
    name: string,
    phone: string,
    tier: string,
    city: string,
    addr: string,
    bank: string,
    norek: string,
    holder: string,
    tierBg: string,
    tierColor: string,
    isEven: boolean
  ): Row => {
    const rowBg = isEven ? '#ffffff' : '#f8fafc';
    return [
      { value: code, type: String, align: 'center', fontWeight: 'bold', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: name, type: String, align: 'left', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: phone, type: String, align: 'center', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: tier, type: String, align: 'center', fontWeight: 'bold', backgroundColor: tierBg, textColor: tierColor, ...BASE_BORDER },
      { value: city, type: String, align: 'center', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: addr, type: String, align: 'left', backgroundColor: rowBg, textColor: '#475569', ...BASE_BORDER },
      { value: bank, type: String, align: 'center', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: norek, type: String, align: 'center', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: holder, type: String, align: 'left', backgroundColor: rowBg, textColor: '#0f172a', ...BASE_BORDER },
      { value: 'Aktif', type: String, align: 'center', fontWeight: 'bold', backgroundColor: rowBg, textColor: '#059669', ...BASE_BORDER }
    ];
  };

  const sampleRows: Row[] = [
    makeSampleRow('MKT-001-MRS', 'Ahmad Fauzi', '081234567891', 'Marketer', 'Maros', 'Jl. Poros Maros No. 10', 'BCA', '8291002341', 'Ahmad Fauzi', '#ede9fe', '#6b21a8', false),
    makeSampleRow('RS-002-MAK', 'Dewi Sartika', '081234567892', 'Reseller', 'Makassar', 'Jl. Cendrawasih No. 25', 'BRI', '012301098765501', 'Dewi Sartika', '#fef3c7', '#92400e', true),
    makeSampleRow('SUB-003-GOW', 'Hj. Nurul Hidayah', '081345678903', 'Sub Agen', 'Gowa', 'Jl. Sultan Hasanuddin No. 8', 'Mandiri', '1520098765432', 'Nurul Hidayah', '#e0f7fa', '#006064', false),
    makeSampleRow('AG-004-BDG', 'dr. Rina Kusuma', '081345678904', 'Agen', 'Bandung', 'Jl. Buah Batu No. 120', 'BSI', '7123456789', 'Rina Kusuma', '#e0f2fe', '#0369a1', true)
  ];

  const notesHeaderRow: Row[] = [
    spacerRow,
    [
      {
        value: 'PANDUAN & KETENTUAN PENGISIAN LEVEL KEMITRAAN SR12:',
        fontWeight: 'bold',
        fontSize: 10,
        textColor: '#064e3b',
        backgroundColor: '#ecfdf5',
        columnSpan: 8,
        height: 20
      },
      ...Array(7).fill(null)
    ],
    [
      {
        value: '1. Marketer: Mendapatkan Komisi Bulanan 15% dari total omset HET. Harga pembelian di kasir/web adalah Full HET (0% diskon langsung).',
        fontSize: 9,
        textColor: '#334155',
        columnSpan: 8
      },
      ...Array(7).fill(null)
    ],
    [
      {
        value: '2. Reseller: Mendapatkan diskon langsung 20% saat bertransaksi di kasir maupun toko online.',
        fontSize: 9,
        textColor: '#334155',
        columnSpan: 8
      },
      ...Array(7).fill(null)
    ],
    [
      {
        value: '3. Sub Agen: Mendapatkan diskon langsung 30% dari HET.',
        fontSize: 9,
        textColor: '#334155',
        columnSpan: 8
      },
      ...Array(7).fill(null)
    ],
    [
      {
        value: '4. Agen: Mendapatkan diskon langsung 40% dari HET.',
        fontSize: 9,
        textColor: '#334155',
        columnSpan: 8
      },
      ...Array(7).fill(null)
    ],
    [
      {
        value: '5. Distributor: Mendapatkan diskon langsung 50% dari HET.',
        fontSize: 9,
        textColor: '#334155',
        columnSpan: 8
      },
      ...Array(7).fill(null)
    ],
    [
      {
        value: 'Tips: Anda bisa langsung menghapus baris contoh data di atas atau mengeditnya dengan data mitra Anda yang sebenarnya.',
        fontStyle: 'italic',
        fontSize: 9,
        textColor: '#047857',
        columnSpan: 8
      },
      ...Array(7).fill(null)
    ]
  ];

  const sheetData: Row[] = [
    titleRow,
    guideRow1,
    guideRow2,
    spacerRow,
    headerRow,
    ...sampleRows,
    ...notesHeaderRow
  ];

  const columns = [
    { width: 18 }, // Kode Mitra
    { width: 28 }, // Nama Lengkap
    { width: 22 }, // No WA / HP
    { width: 20 }, // Level Kemitraan
    { width: 20 }, // Kota
    { width: 32 }, // Alamat
    { width: 16 }, // Bank
    { width: 22 }, // Rekening
    { width: 24 }, // Pemilik
    { width: 14 }  // Status
  ];

  try {
    await writeExcelFile(sheetData, {
      sheet: 'Template Mitra',
      columns,
      stickyRowsCount: 5,
      orientation: 'landscape'
    }).toFile(fileName);
  } catch (err) {
    console.warn('[ExcelService] Fallback toBlob() untuk download template:', err);
    const blob = await writeExcelFile(sheetData, {
      sheet: 'Template Mitra',
      columns,
      stickyRowsCount: 5,
      orientation: 'landscape'
    }).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Membaca dan memvalidasi file Excel (.xlsx) yang diunggah pengguna untuk diimport sebagai mitra baru
 */
export async function parseMitraExcelFile(
  file: File,
  storeSlug: string,
  existingDownlines: MitraDownline[]
): Promise<ParseMitraExcelResult> {
  const sheetData = await readSheet(file);

  if (!sheetData || sheetData.length === 0) {
    throw new Error('File Excel kosong atau tidak dapat dibaca.');
  }

  // 1. Temukan baris header secara cerdas
  let headerRowIndex = -1;
  const colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(sheetData.length, 15); r++) {
    const row = sheetData[r];
    if (!Array.isArray(row)) continue;
    const rowStrs = row.map(c => String(c ?? '').toLowerCase().trim());
    const hasName = rowStrs.some(s => s.includes('nama') || s.includes('name'));
    const hasPhone = rowStrs.some(s => s.includes('hp') || s.includes('wa') || s.includes('telepon') || s.includes('phone'));
    const hasTier = rowStrs.some(s => s.includes('level') || s.includes('tier') || s.includes('kemitraan'));

    if ((hasName && hasPhone) || (hasName && hasTier)) {
      headerRowIndex = r;
      rowStrs.forEach((colName, colIdx) => {
        if (colName.includes('kode') || colName.includes('partner code') || colName.includes('id')) {
          colMap['partnerCode'] = colIdx;
        } else if (colName.includes('nama') && !colName.includes('bank') && !colName.includes('pemilik') && !colName.includes('rekening')) {
          colMap['name'] = colIdx;
        } else if (colName.includes('hp') || colName.includes('wa') || colName.includes('telepon') || colName.includes('phone')) {
          colMap['phone'] = colIdx;
        } else if (colName.includes('level') || colName.includes('tier') || colName.includes('kemitraan')) {
          colMap['tier'] = colIdx;
        } else if (colName.includes('kota') || colName.includes('city') || colName.includes('kabupaten')) {
          colMap['city'] = colIdx;
        } else if (colName.includes('alamat') || colName.includes('address') || colName.includes('domisili')) {
          colMap['address'] = colIdx;
        } else if (colName.includes('bank') && !colName.includes('pemilik') && !colName.includes('rekening')) {
          colMap['bankName'] = colIdx;
        } else if (colName.includes('rekening') && !colName.includes('pemilik') && !colName.includes('atas nama')) {
          colMap['bankAccount'] = colIdx;
        } else if (colName.includes('pemilik') || colName.includes('atas nama') || colName.includes('holder')) {
          colMap['bankHolder'] = colIdx;
        } else if (colName.includes('status')) {
          colMap['status'] = colIdx;
        }
      });
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: anggap baris 0 adalah header standar
    headerRowIndex = 0;
    colMap['partnerCode'] = 0;
    colMap['name'] = 1;
    colMap['phone'] = 2;
    colMap['tier'] = 3;
    colMap['city'] = 4;
    colMap['address'] = 5;
    colMap['bankName'] = 6;
    colMap['bankAccount'] = 7;
    colMap['bankHolder'] = 8;
    colMap['status'] = 9;
  }

  const existingCodesMap = new Map(existingDownlines.map(m => [m.partnerCode.toUpperCase().trim(), m]));
  const existingPhonesMap = new Map(existingDownlines.map(m => [m.phone.replace(/[^0-9]/g, '').slice(-8), m]));

  const validMitra: MitraDownline[] = [];
  const previewRows: ParsedMitraRow[] = [];
  const skippedRows: Array<{ rowNumber: number; reason: string }> = [];

  const todayStr = new Date().toISOString().split('T')[0];
  const evalDate = new Date();
  evalDate.setDate(evalDate.getDate() + 90);
  const evalDueDateStr = evalDate.toISOString().split('T')[0];

  let autoNumCounter = existingDownlines.length + 1;

  for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
    const row = sheetData[r];
    if (!Array.isArray(row)) continue;

    const rawName = colMap['name'] !== undefined ? row[colMap['name']] : '';
    const name = String(rawName ?? '').trim();

    // Abaikan baris kosong atau baris panduan di bawah tabel
    if (!name || name.toLowerCase().includes('panduan') || name.toLowerCase().includes('petunjuk')) {
      continue;
    }

    const rawPhone = colMap['phone'] !== undefined ? row[colMap['phone']] : '';
    let phone = String(rawPhone ?? '').trim().replace(/[^0-9+]/g, '');
    if (phone.startsWith('+62')) phone = '0' + phone.slice(3);
    else if (phone.startsWith('62')) phone = '0' + phone.slice(2);
    else if (phone.startsWith('8')) phone = '0' + phone;

    if (!phone || phone.length < 8) {
      skippedRows.push({
        rowNumber: r + 1,
        reason: `Nomor HP/WA "${String(rawPhone)}" tidak valid (minimal 8 digit).`
      });
      continue;
    }

    // Normalisasi Level Kemitraan
    const rawTier = colMap['tier'] !== undefined ? String(row[colMap['tier']] ?? '').toLowerCase().trim() : '';
    let tier: PartnerTier = 'reseller';
    if (rawTier.includes('market') || rawTier.includes('afilias') || rawTier.includes('mkt')) {
      tier = 'marketer';
    } else if (rawTier.includes('sub')) {
      tier = 'sub_agen';
    } else if (rawTier.includes('agen') || rawTier === 'ag') {
      tier = 'agen';
    } else if (rawTier.includes('distrib') || rawTier === 'dist') {
      tier = 'distributor';
    } else if (rawTier.includes('resell') || rawTier === 'rs') {
      tier = 'reseller';
    }

    const city = colMap['city'] !== undefined ? String(row[colMap['city']] ?? '').trim() : '';
    const safeCity = city || 'Maros';

    const address = colMap['address'] !== undefined ? String(row[colMap['address']] ?? '').trim() : '';
    const bankName = colMap['bankName'] !== undefined ? String(row[colMap['bankName']] ?? '').trim() : 'BCA';
    const bankAccount = colMap['bankAccount'] !== undefined ? String(row[colMap['bankAccount']] ?? '').trim() : '-';
    const bankHolder = colMap['bankHolder'] !== undefined ? String(row[colMap['bankHolder']] ?? '').trim() : name;

    const rawStatus = colMap['status'] !== undefined ? String(row[colMap['status']] ?? '').toLowerCase().trim() : '';
    const status: 'active' | 'inactive' = rawStatus.includes('non') || rawStatus.includes('inact') ? 'inactive' : 'active';

    // Kode Mitra
    let code = colMap['partnerCode'] !== undefined ? String(row[colMap['partnerCode']] ?? '').trim().toUpperCase() : '';
    if (!code || code === '-' || code.length < 3) {
      const prefix = tier === 'marketer' ? 'MKT' : tier === 'sub_agen' ? 'SUB' : tier === 'agen' ? 'AG' : tier === 'distributor' ? 'DIST' : 'RS';
      const cityCode = safeCity.slice(0, 3).toUpperCase();
      code = `${prefix}-${String(autoNumCounter).padStart(3, '0')}-${cityCode}`;
      autoNumCounter++;
    }

    const phoneKey = phone.slice(-8);
    const existingByCode = existingCodesMap.get(code);
    const existingByPhone = existingPhonesMap.get(phoneKey);
    const isExisting = Boolean(existingByCode || existingByPhone);

    const mitra: MitraDownline = {
      storeSlug,
      partnerCode: code,
      name,
      phone,
      city: safeCity,
      address: address || undefined,
      tier,
      bankName: bankName || 'BCA',
      bankAccount: bankAccount || '-',
      bankHolder: bankHolder || name,
      status,
      accumulatedSpent90Days: existingByCode?.accumulatedSpent90Days || 0,
      totalOrdersCount: existingByCode?.totalOrdersCount || 0,
      joinDate: existingByCode?.joinDate || todayStr,
      qualificationDate: existingByCode?.qualificationDate || todayStr,
      evaluationDueDate: tier === 'marketer' ? undefined : evalDueDateStr
    };

    validMitra.push(mitra);
    previewRows.push({
      mitra,
      isExisting,
      rowNumber: r + 1
    });
  }

  return {
    validMitra,
    previewRows,
    skippedRows,
    totalRead: validMitra.length + skippedRows.length
  };
}
