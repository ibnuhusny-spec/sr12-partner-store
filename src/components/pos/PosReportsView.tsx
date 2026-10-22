import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchStoreOrders, clearAllOrders } from '../../services/orderService';
import { exportReportsToCSV } from '../../services/posService';
import { Order } from '../../types';
import { BarChart3, Download, DollarSign, ShoppingCart, Percent, Trash2 } from 'lucide-react';

export const PosReportsView: React.FC = () => {
  const { currentStore } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<'all' | 'today' | 'month'>('all');

  useEffect(() => {
    fetchStoreOrders(currentStore.slug).then(setOrders);
  }, [currentStore.slug]);

  const totalGMV = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalSubtotal = orders.reduce((sum, o) => sum + o.subtotalHet, 0);
  const totalDiscounts = orders.reduce((sum, o) => sum + o.discountAmount, 0);
  const estProfit = Math.round(totalGMV * 0.35); // Estimasi margin rata-rata distributor

  const handleResetReports = () => {
    if (orders.length === 0) {
      alert('Laporan sudah bernilai 0 (belum ada transaksi).');
      return;
    }
    if (window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin mereset laporan dan menghapus ${orders.length} transaksi untuk toko ${currentStore.storeName} ke nol?`)) {
      clearAllOrders(currentStore.slug);
      setOrders([]);
      alert('Data transaksi dan laporan berhasil direset ke nol!');
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Belum ada data transaksi untuk diekspor.');
      return;
    }

    const rows = orders.map(o => ({
      'No Invoice': o.orderId,
      'Waktu': new Date(o.createdAt || o.orderDate || Date.now()).toLocaleString('id-ID'),
      'Pelanggan': o.customerName,
      'No WhatsApp': o.customerPhone,
      'Tier Harga': o.tierLabel,
      'Subtotal HET': o.subtotalHet,
      'Diskon Kemitraan': o.discountAmount,
      'Total Bayar': o.grandTotal,
      'Metode Pembayaran': o.paymentMethod,
      'Status': o.status
    }));

    exportReportsToCSV(rows, `laporan-omset-${currentStore.slug}.csv`);
  };

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Laporan Laba/Rugi &amp; Rekapitulasi Omset</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Rekap performa keuangan toko {currentStore.storeName}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleResetReports}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Bersihkan seluruh data transaksi dan reset laporan omzet ke nol"
          >
            <Trash2 size={14} />
            <span>Reset Laporan ke Nol</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={15} />
            <span>Ekspor Data ke CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Total Omset Kotor (GMV)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
            Rp {totalGMV.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Dari {orders.length} pesanan tercatat</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 700 }}>Total Diskon Kemitraan Diberikan</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>
            Rp {totalDiscounts.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Margin reseller/agen/marketer</div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #10b981', padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>Estimasi Laba Bersih Distributor</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
            Rp {estProfit.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '4px' }}>Margin ~35% dari omset</div>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Rincian Transaksi Terakhir</h4>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 14px' }}>Invoice</th>
                <th style={{ padding: '10px 14px' }}>Tanggal</th>
                <th style={{ padding: '10px 14px' }}>Pelanggan</th>
                <th style={{ padding: '10px 14px' }}>Tier</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Belanja</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 800 }}>#{o.orderId}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{new Date(o.createdAt || o.orderDate || Date.now()).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{o.customerName}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{o.tierLabel}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#34d399' }}>
                      Rp {o.grandTotal.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', fontWeight: 800 }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
