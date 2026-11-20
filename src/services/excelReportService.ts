import writeExcelFile, { Cell, Row } from 'write-excel-file/browser';

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
