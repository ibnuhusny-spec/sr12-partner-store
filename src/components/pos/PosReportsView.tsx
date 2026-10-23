import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getLocalOrders, clearAllOrders, fetchStoreOrders } from '../../services/orderService';
import { getLocalDownlines, fetchStoreDownlines } from '../../services/mitraService';
import { exportReportsToCSV } from '../../services/posService';
import { SR12_TIERS } from '../../config/tiers';
import { Order, MitraDownline, PartnerTier } from '../../types';
import {
  Download,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  Coins,
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DailyPartnerSummary {
  date: string; // YYYY-MM-DD
  partnerCode: string;
  partnerName: string;
  tier: string;
  tierLabel: string;
  discountPct: number;
  orderCount: number;
  totalHet: number;
  totalHpp: number; // Modal Kulakan Toko (HPP)
  totalDiscount: number;
  totalPaid: number;
  grossProfit: number; // Laba Kotor Toko
  marketerCommission: number; // Hak Gaji Marketer 15%
  netProfit: number; // Keuntungan Bersih Pemilik Toko
}

export const PosReportsView: React.FC = () => {
  const { currentStore } = useApp();
  const [orders, setOrders] = useState<Order[]>(() => getLocalOrders(currentStore.slug));
  const [downlines, setDownlines] = useState<MitraDownline[]>(() => getLocalDownlines(currentStore.slug));
  const [activeTab, setActiveTab] = useState<'daily_mitra' | 'all_orders'>('daily_mitra');
  const [period, setPeriod] = useState<'all' | 'today' | 'month'>('all');
  const [showProfitFormula, setShowProfitFormula] = useState(false);

  const loadData = async () => {
    // 1. Instant local cache
    setOrders(getLocalOrders(currentStore.slug));
    setDownlines(getLocalDownlines(currentStore.slug));

    // 2. Cloud sync via Supabase
    try {
      const [cloudOrders, cloudDownlines] = await Promise.all([
        fetchStoreOrders(currentStore.slug),
        fetchStoreDownlines(currentStore.slug)
      ]);
      setOrders(cloudOrders);
      setDownlines(cloudDownlines);
    } catch (e) {
      console.warn('Failed to fetch cloud reports data:', e);
    }
  };

  useEffect(() => {
    loadData();

    const handleSyncOrders = () => {
      fetchStoreOrders(currentStore.slug).then(setOrders).catch(console.error);
    };
    const handleSyncDownlines = () => {
      fetchStoreDownlines(currentStore.slug).then(setDownlines).catch(console.error);
    };

    window.addEventListener('sr12:cloud_sync_orders', handleSyncOrders);
    window.addEventListener('sr12:cloud_sync_downlines', handleSyncDownlines);

    return () => {
      window.removeEventListener('sr12:cloud_sync_orders', handleSyncOrders);
      window.removeEventListener('sr12:cloud_sync_downlines', handleSyncDownlines);
    };
  }, [currentStore.slug]);

  const getDiscountPctByTier = (tier?: string) => {
    switch (tier) {
      case 'distributor': return 50;
      case 'agen': return 40;
      case 'sub_agen': return 30;
      case 'reseller': return 20;
      case 'marketer': return 0; // Marketer bayar Full HET (0% diskon langsung)
      default: return 0;
    }
  };

  // Filter orders by period (hanya pesanan produk yang aktif, bukan kas manual atau order batal)
  const filteredOrders = useMemo(() => {
    const validOrders = orders.filter(o => 
      !o.orderSource?.startsWith('Kas Manual') && 
      !o.status?.toLowerCase().includes('batal') && 
      !o.status?.toLowerCase().includes('hapus')
    );
    if (period === 'all') return validOrders;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = now.toISOString().slice(0, 7);

    return validOrders.filter(o => {
      const d = new Date(o.createdAt || o.orderDate || Date.now());
      const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
      if (period === 'today') return dateStr === todayStr;
      if (period === 'month') return dateStr.startsWith(monthStr);
      return true;
    });
  }, [orders, period]);

  // Level kemitraan toko saat ini (Distributor, Agen, Sub Agen, Reseller)
  const storeTier = (currentStore.partnerTier || 'distributor') as PartnerTier;
  const storeDiscountPct = storeTier === 'agen' ? 40 : storeTier === 'sub_agen' ? 30 : storeTier === 'reseller' ? 20 : 50;
  const storeCostPct = 100 - storeDiscountPct; // Persentase modal kulakan: Distributor 50%, Agen 60%, Sub Agen 70%, Reseller 80%

  // Daily Partner Aggregation: Cross-reference with registered downlines for 100% tier, discount, and profit sync
  const dailyPartnerSummaries = useMemo(() => {
    const map = new Map<string, DailyPartnerSummary>();

    filteredOrders.forEach(o => {
      const d = new Date(o.createdAt || o.orderDate || Date.now());
      const dateKey = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'Hari Ini';

      // Match partner in downlines database by partnerCode, phone, or name
      const matchedMitra = downlines.find(m =>
        (o.partnerCode && m.partnerCode.toUpperCase() === o.partnerCode.toUpperCase()) ||
        (o.customerPhone && o.customerPhone !== '-' && m.phone && m.phone.replace(/[^0-9]/g, '').endsWith(o.customerPhone.replace(/[^0-9]/g, '').slice(-8))) ||
        (o.customerName && m.name.toLowerCase().trim() === o.customerName.toLowerCase().trim()) ||
        (o.customerName && m.partnerCode.toUpperCase() === o.customerName.toUpperCase().trim())
      );

      const partnerCode = matchedMitra?.partnerCode || o.partnerCode || (o.tier && o.tier !== 'konsumen' ? o.customerName : 'NON-MITRA');
      const partnerName = matchedMitra?.name || o.customerName || 'Konsumen Retail';
      const tierKey = (matchedMitra?.tier || o.tier || 'konsumen') as PartnerTier;
      const isMarketer = tierKey === 'marketer';
      // Marketer bayar Full HET (0% diskon langsung), 15% masuk gaji bulanan
      const discountPct = isMarketer ? 0 : (SR12_TIERS[tierKey]?.discountPct ?? getDiscountPctByTier(tierKey));
      const het = o.subtotalHet || o.grandTotal;

      const discount = isMarketer
        ? 0
        : ((o.discountAmount && o.discountAmount > 0)
          ? o.discountAmount
          : Math.round(het * (discountPct / 100)));
      const netPaid = isMarketer ? het : ((o.grandTotal && o.discountAmount) ? o.grandTotal : (het - discount));
      const marketerComm = isMarketer ? Math.round(het * 0.15) : 0;

      // Perhitungan Modal Kulakan Toko (HPP) & Keuntungan Bersih Pemilik Toko
      const storeHpp = Math.round(het * (storeCostPct / 100));
      const grossProfit = netPaid - storeHpp;
      const netProfit = grossProfit - marketerComm;

      const groupKey = `${dateKey}_${partnerCode}`;
      const existing = map.get(groupKey);
      if (existing) {
        existing.orderCount += 1;
        existing.totalHet += het;
        existing.totalHpp += storeHpp;
        existing.totalDiscount += discount;
        existing.totalPaid += netPaid;
        existing.grossProfit += grossProfit;
        existing.marketerCommission += marketerComm;
        existing.netProfit += netProfit;
      } else {
        const tierLabel = SR12_TIERS[tierKey]?.name || o.tierLabel || (tierKey === 'konsumen' ? 'Non-Mitra (HET)' : tierKey.toUpperCase());
        map.set(groupKey, {
          date: dateKey,
          partnerCode: partnerCode || '-',
          partnerName,
          tier: tierKey,
          tierLabel,
          discountPct,
          orderCount: 1,
          totalHet: het,
          totalHpp: storeHpp,
          totalDiscount: discount,
          totalPaid: netPaid,
          grossProfit,
          marketerCommission: marketerComm,
          netProfit
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredOrders, downlines, storeCostPct]);

  // Totals derived consistently from dailyPartnerSummaries
  const totalGMV = dailyPartnerSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalSubtotalHet = dailyPartnerSummaries.reduce((sum, s) => sum + s.totalHet, 0);
  const totalHpp = dailyPartnerSummaries.reduce((sum, s) => sum + s.totalHpp, 0);
  const totalDiscounts = dailyPartnerSummaries.reduce((sum, s) => sum + s.totalDiscount, 0);
  const totalGrossProfit = dailyPartnerSummaries.reduce((sum, s) => sum + s.grossProfit, 0);
  const totalMarketerCommission = dailyPartnerSummaries.reduce((sum, s) => sum + s.marketerCommission, 0);
  const totalNetProfit = dailyPartnerSummaries.reduce((sum, s) => sum + s.netProfit, 0);
  const totalMitraOrdersCount = dailyPartnerSummaries
    .filter(s => s.tier && s.tier !== 'konsumen')
    .reduce((sum, s) => sum + s.orderCount, 0);

  const handleResetReports = async () => {
    if (orders.length === 0) {
      alert('Laporan sudah bernilai 0 (belum ada transaksi).');
      return;
    }
    if (window.confirm(`⚠️ PERINGATAN:\nApakah Anda yakin ingin mereset seluruh laporan dan menghapus ${orders.length} riwayat transaksi ke nol untuk memulai pencatatan baru?`)) {
      await clearAllOrders(currentStore.slug);
      setOrders([]);
      alert('Data transaksi dan laporan berhasil direset ke nol!');
    }
  };

  // Export 1: Daily Partner Sales Summary CSV
  const handleExportDailyMitraCSV = () => {
    if (dailyPartnerSummaries.length === 0) {
      alert('Belum ada data penjualan mitra untuk diekspor.');
      return;
    }

    const rows = dailyPartnerSummaries.map(s => ({
      'Tanggal': s.date,
      'Kode Mitra': s.partnerCode,
      'Nama Mitra / Pelanggan': s.partnerName,
      'Level Kemitraan': s.tierLabel,
      'Diskon Level %': `${s.discountPct}%`,
      'Jumlah Pesanan': s.orderCount,
      'Total Omset HET (Rp)': s.totalHet,
      'Modal Kulakan Toko / HPP (Rp)': s.totalHpp,
      'Potongan Diskon Level (Rp)': s.totalDiscount,
      'Total Bayar Net (Rp)': s.totalPaid,
      'Gaji/Komisi Marketer 15% (Rp)': s.marketerCommission > 0 ? s.marketerCommission : 0,
      'Laba Kotor Toko (Rp)': s.grossProfit,
      'Keuntungan Bersih Pemilik Toko (Rp)': s.netProfit
    }));

    exportReportsToCSV(rows, `laporan-harian-mitra-${currentStore.slug}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Export 2: Complete Transaction-Level CSV
  const handleExportAllOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      alert('Belum ada transaksi untuk diekspor.');
      return;
    }

    const rows = filteredOrders.map(o => {
      const d = new Date(o.createdAt || o.orderDate || Date.now());
      const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '-';
      const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('id-ID') : '-';

      const matchedMitra = downlines.find(m =>
        (o.partnerCode && m.partnerCode.toUpperCase() === o.partnerCode.toUpperCase()) ||
        (o.customerPhone && o.customerPhone !== '-' && m.phone && m.phone.replace(/[^0-9]/g, '').endsWith(o.customerPhone.replace(/[^0-9]/g, '').slice(-8))) ||
        (o.customerName && m.name.toLowerCase().trim() === o.customerName.toLowerCase().trim())
      );

      const resolvedTier = (matchedMitra?.tier || o.tier || 'konsumen') as PartnerTier;
      const isMarketer = resolvedTier === 'marketer';
      const discPct = isMarketer ? 0 : (SR12_TIERS[resolvedTier]?.discountPct ?? getDiscountPctByTier(resolvedTier));
      const het = o.subtotalHet || o.grandTotal;
      const discount = isMarketer
        ? 0
        : ((o.discountAmount && o.discountAmount > 0)
          ? o.discountAmount
          : Math.round(het * (discPct / 100)));
      const netPaid = isMarketer ? het : ((o.grandTotal && o.discountAmount) ? o.grandTotal : (het - discount));
      const mktComm = isMarketer ? Math.round(het * 0.15) : 0;
      const storeHpp = Math.round(het * (storeCostPct / 100));
      const netProfit = (netPaid - storeHpp) - mktComm;
      const tierLabel = SR12_TIERS[resolvedTier]?.name || o.tierLabel || (resolvedTier === 'konsumen' ? 'Non-Mitra (HET)' : resolvedTier.toUpperCase());

      return {
        'Tanggal': dateStr,
        'Waktu': timeStr,
        'No Invoice': o.orderId,
        'Sumber Transaksi': o.orderSource || 'Kasir POS',
        'Kode Mitra': matchedMitra?.partnerCode || o.partnerCode || '-',
        'Nama Pelanggan': matchedMitra?.name || o.customerName,
        'No WhatsApp': matchedMitra?.phone || o.customerPhone || '-',
        'Tier Kemitraan': tierLabel,
        'Diskon %': `${discPct}%`,
        'Subtotal HET (Rp)': het,
        'Modal Kulakan Toko / HPP (Rp)': storeHpp,
        'Potongan Diskon (Rp)': discount,
        'Total Bayar Net (Rp)': netPaid,
        'Komisi Marketer 15% (Rp)': mktComm,
        'Keuntungan Bersih Toko (Rp)': netProfit,
        'Metode Pembayaran': o.paymentMethod || 'Tunai',
        'Status': o.status
      };
    });

    exportReportsToCSV(rows, `laporan-transaksi-lengkap-${currentStore.slug}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc' }}>
              Laporan Penjualan &amp; Rekap Mitra Harian
            </h3>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#0284c7', color: '#e0f2fe', padding: '2px 8px', borderRadius: '999px' }}>
              REKAP HARIAN &amp; KOMISI
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
            Rekap belanja mitra perhari, potongan diskon level (20%-40%), dan gaji bulanan marketer (15%) toko {currentStore.storeName}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleResetReports}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '7px 12px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Reset data transaksi ke nol"
          >
            <Trash2 size={13} />
            <span className="hide-on-mobile">Reset Laporan</span>
          </button>

          <button
            type="button"
            onClick={handleExportDailyMitraCSV}
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }}
            title="Download file CSV rekapitulasi penjualan mitra harian"
          >
            <FileSpreadsheet size={14} />
            <span>Download Rekap Harian Mitra (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportAllOrdersCSV}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#fff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
            title="Download file CSV seluruh transaksi pesanan lengkap"
          >
            <Download size={14} />
            <span className="hide-on-mobile">Ekspor Semua Transaksi (CSV)</span>
          </button>
        </div>
      </div>

      {/* Educational Profit Formula Explainer (Interactive Accordion) */}
      <div style={{ background: '#131d38', border: '1px solid #1e293b', borderRadius: '12px', marginBottom: '18px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowProfitFormula(!showProfitFormula)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#f8fafc',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Sparkles size={16} color="#fbbf24" />
            <span style={{ fontSize: '0.84rem', fontWeight: 800 }}>
              💡 Panduan Perhitungan Keuntungan Toko {currentStore.storeName} (Level {storeTier.toUpperCase()})
            </span>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800 }}>
              Diskon Kulakan Toko: {storeDiscountPct}% (Modal: {storeCostPct}%)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#94a3b8' }}>
            <span>{showProfitFormula ? 'Tutup Penjelasan' : 'Lihat Rumus Keuntungan'}</span>
            {showProfitFormula ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {showProfitFormula && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1e293b', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: '1.6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div style={{ background: '#090f1d', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>📦 1. Modal Kulakan Toko (HPP)</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                  Sebagai <b>{storeTier.toUpperCase()}</b>, Anda kulakan ke pusat/gudang dengan diskon <b>{storeDiscountPct}%</b>. Artinya modal barang Anda adalah <b>{storeCostPct}% dari HET</b>.
                </p>
                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>Contoh HET Rp 100.000 → Modal Anda Rp {(100000 * storeCostPct / 100).toLocaleString('id-ID')}</div>
              </div>

              <div style={{ background: '#090f1d', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>👥 2. Penjualan ke Reseller / Mitra</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                  Reseller dapat diskon 20% (bayar 80%). Anda mendapat keuntungan selisih diskon: <b>{storeDiscountPct}% - 20% = {Math.max(0, storeDiscountPct - 20)}% dari HET</b>.
                </p>
                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>Contoh HET Rp 100.000 → Untung Bersih Anda Rp {(Math.max(0, storeDiscountPct - 20) * 1000).toLocaleString('id-ID')}</div>
              </div>

              <div style={{ background: '#090f1d', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>🛒 3. Penjualan ke Konsumen Retail</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                  Konsumen umum membayar harga penuh HET (100%). Keuntungan Anda maksimal sebesar diskon tier kulakan Anda yaitu <b>{storeDiscountPct}% dari HET</b>.
                </p>
                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>Contoh HET Rp 100.000 → Untung Bersih Anda Rp {(storeDiscountPct * 1000).toLocaleString('id-ID')}</div>
              </div>

              <div style={{ background: '#090f1d', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontWeight: 800, color: '#818cf8', marginBottom: '4px' }}>💼 4. Penjualan via Marketer (Gaji 15%)</div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                  Marketer menyetor 100% HET. Komisi 15% disisihkan untuk gaji bulanan. Keuntungan bersih Anda: <b>{storeDiscountPct}% - 15% = {Math.max(0, storeDiscountPct - 15)}% dari HET</b>.
                </p>
                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#818cf8', fontWeight: 700 }}>Contoh HET Rp 100.000 → Untung Bersih Anda Rp {(Math.max(0, storeDiscountPct - 15) * 1000).toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        {/* 1. Total Omzet GMV */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Total Omset Net (GMV)</span>
            <DollarSign size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
            Rp {totalGMV.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
            Dari {filteredOrders.length} total transaksi
          </div>
        </div>

        {/* 2. Modal Kulakan HPP Toko */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Modal Kulakan Toko (HPP)</span>
            <Wallet size={16} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#cbd5e1', marginTop: '4px' }}>
            Rp {totalHpp.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
            Modal tier {storeTier.toUpperCase()} ({storeCostPct}% dari HET)
          </div>
        </div>

        {/* 3. Diskon Diberikan ke Mitra */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '14px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Diskon Mitra Diberikan</span>
            <Percent size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>
            Rp {totalDiscounts.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
            Potongan diskon Reseller (20%) &amp; Agen (30%-40%)
          </div>
        </div>

        {/* 4. Hak Gaji Marketer 15% */}
        <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1.5px solid rgba(99, 102, 241, 0.4)', padding: '14px 16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#a5b4fc', fontWeight: 800 }}>💼 Hak Gaji Marketer (15%)</span>
            <DollarSign size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#818cf8', marginTop: '4px' }}>
            Rp {totalMarketerCommission.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#c7d2fe', marginTop: '3px' }}>
            Komisi bulanan 15% hak marketer
          </div>
        </div>

        {/* 5. KEUNTUNGAN BERSIH PEMILIK TOKO (NET PROFIT) - HIGHLIGHT */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(6, 95, 70, 0.35))',
          border: '2px solid #10b981',
          padding: '14px 16px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#a7f3d0', fontWeight: 900 }}>💰 Keuntungan Bersih Toko</span>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              background: '#059669',
              color: '#ffffff',
              padding: '2px 6px',
              borderRadius: '999px'
            }}>
              {totalGMV > 0 ? ((totalNetProfit / totalGMV) * 100).toFixed(1) : 0}% MARGIN
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#34d399', marginTop: '4px' }}>
            Rp {totalNetProfit.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#d1fae5', marginTop: '3px' }}>
            Laba bersih setelah HPP ({storeCostPct}%) &amp; komisi marketer
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Period Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        {/* Tab Switcher */}
        <div style={{ display: 'inline-flex', background: '#090f1d', padding: '3px', borderRadius: '999px', border: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => setActiveTab('daily_mitra')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              border: 'none',
              background: activeTab === 'daily_mitra' ? '#0284c7' : 'transparent',
              color: activeTab === 'daily_mitra' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={14} />
            <span>Rekap Harian Mitra ({dailyPartnerSummaries.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all_orders')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              border: 'none',
              background: activeTab === 'all_orders' ? '#0284c7' : 'transparent',
              color: activeTab === 'all_orders' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrendingUp size={14} />
            <span>Rincian Per Transaksi ({filteredOrders.length})</span>
          </button>
        </div>

        {/* Period Filter */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={12} /> Periode:
          </span>
          {(['all', 'today', 'month'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: period === p ? '1px solid #38bdf8' : '1px solid #334155',
                background: period === p ? '#0284c7' : '#0f172a',
                color: period === p ? '#fff' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {p === 'all' ? 'Semua' : p === 'today' ? 'Hari Ini' : 'Bulan Ini'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'daily_mitra' ? (
        /* 1. Rekap Harian Mitra Table */
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                Rekapitulasi Pembelanjaan Mitra Per Hari
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                Tercatat per tanggal dan per mitra lengkap dengan diskon level dan komisi marketer
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
              {dailyPartnerSummaries.length} Baris Rekap Harian
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#090f1d', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '12px 14px' }}>Tanggal</th>
                  <th style={{ padding: '12px 14px' }}>Mitra / Downline</th>
                  <th style={{ padding: '12px 14px' }}>Level / Tier</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Diskon %</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Pesanan</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Omset HET</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Modal Toko (HPP)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Potongan Diskon</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Bayar Net</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Gaji Marketer (15%)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Keuntungan Bersih Toko</th>
                </tr>
              </thead>
              <tbody>
                {dailyPartnerSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada transaksi pembelanjaan mitra pada periode ini.
                    </td>
                  </tr>
                ) : (
                  dailyPartnerSummaries.map((s, idx) => {
                    const isMarketer = s.tier === 'marketer';
                    const isReseller = s.tier === 'reseller';
                    const isSubAgen = s.tier === 'sub_agen';
                    const isAgen = s.tier === 'agen';

                    return (
                      <tr key={`${s.date}-${s.partnerCode}-${idx}`} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#38bdf8', whiteSpace: 'nowrap' }}>
                          {s.date}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#f8fafc' }}>{s.partnerName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>#{s.partnerCode}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: isAgen
                                ? 'rgba(245, 158, 11, 0.2)'
                                : isSubAgen
                                ? 'rgba(56, 189, 248, 0.2)'
                                : isReseller
                                ? 'rgba(16, 185, 129, 0.2)'
                                : isMarketer
                                ? 'rgba(99, 102, 241, 0.2)'
                                : 'rgba(168, 85, 247, 0.2)',
                              color: isAgen
                                ? '#fbbf24'
                                : isSubAgen
                                ? '#38bdf8'
                                : isReseller
                                ? '#34d399'
                                : isMarketer
                                ? '#818cf8'
                                : '#c084fc'
                            }}
                          >
                            {s.tierLabel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#f8fafc' }}>
                          {s.discountPct}%
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#94a3b8' }}>
                          {s.orderCount}x
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                          Rp {s.totalHet.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8' }}>
                          Rp {s.totalHpp.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>
                          Rp {s.totalDiscount.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#38bdf8', fontSize: '0.88rem' }}>
                          Rp {s.totalPaid.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: isMarketer ? '#818cf8' : '#64748b' }}>
                          {isMarketer ? `Rp ${s.marketerCommission.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 950, color: '#34d399', fontSize: '0.88rem' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            +Rp {s.netProfit.toLocaleString('id-ID')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {dailyPartnerSummaries.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#090f1d', borderTop: '2px solid #334155', fontWeight: 900 }}>
                    <td colSpan={3} style={{ padding: '12px 14px', color: '#f8fafc' }}>
                      TOTAL AKUMULASI LAPORAN
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#94a3b8' }}>-</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#38bdf8' }}>
                      {totalMitraOrdersCount}x
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                      Rp {totalSubtotalHet.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8' }}>
                      Rp {totalHpp.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f59e0b' }}>
                      Rp {totalDiscounts.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#38bdf8', fontSize: '0.92rem' }}>
                      Rp {totalGMV.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#818cf8' }}>
                      Rp {totalMarketerCommission.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#34d399', fontSize: '0.95rem' }}>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.25)',
                        color: '#34d399',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid #10b981'
                      }}>
                        +Rp {totalNetProfit.toLocaleString('id-ID')}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* 2. Rincian Semua Transaksi Table */
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                Rincian Seluruh Transaksi Pesanan
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                Daftar transaksi kasir offline dan online order toko {currentStore.storeName}
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
              {filteredOrders.length} Pesanan
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#090f1d', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '12px 14px' }}>Invoice</th>
                  <th style={{ padding: '12px 14px' }}>Waktu</th>
                  <th style={{ padding: '12px 14px' }}>Pelanggan / Mitra</th>
                  <th style={{ padding: '12px 14px' }}>Tier</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Subtotal HET</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Modal Toko (HPP)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Diskon</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Bayar</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Keuntungan Bersih</th>
                  <th style={{ padding: '12px 14px' }}>Sumber</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada transaksi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => {
                    const het = o.subtotalHet || o.grandTotal;
                    const storeHpp = Math.round(het * (storeCostPct / 100));
                    const isMarketer = o.tier === 'marketer';
                    const mktComm = isMarketer ? Math.round(het * 0.15) : 0;
                    const netPaid = isMarketer ? het : o.grandTotal;
                    const netProfit = (netPaid - storeHpp) - mktComm;

                    return (
                      <tr key={o.orderId} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px 14px', color: '#38bdf8', fontWeight: 800 }}>#{o.orderId}</td>
                        <td style={{ padding: '12px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {new Date(o.createdAt || o.orderDate || Date.now()).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#f8fafc' }}>{o.customerName}</div>
                          {o.partnerCode && (
                            <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>#{o.partnerCode}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{o.tierLabel || '-'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                          Rp {het.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8' }}>
                          Rp {storeHpp.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>
                          Rp {(o.discountAmount || 0).toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#38bdf8' }}>
                          Rp {netPaid.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 950, color: '#34d399' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            +Rp {netProfit.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.72rem' }}>
                          {o.orderSource || 'Kasir POS'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', fontWeight: 800 }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredOrders.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#090f1d', borderTop: '2px solid #334155', fontWeight: 900 }}>
                    <td colSpan={4} style={{ padding: '12px 14px', color: '#f8fafc' }}>
                      TOTAL SELURUH TRANSAKSI ({filteredOrders.length} Pesanan)
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                      Rp {totalSubtotalHet.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8' }}>
                      Rp {totalHpp.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f59e0b' }}>
                      Rp {totalDiscounts.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#38bdf8', fontSize: '0.92rem' }}>
                      Rp {totalGMV.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#34d399', fontSize: '0.95rem' }}>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.25)',
                        color: '#34d399',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid #10b981'
                      }}>
                        +Rp {totalNetProfit.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td colSpan={2} style={{ padding: '12px 14px' }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
