import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { getLocalOrders, fetchStoreOrders, updateOrderStatus, deleteOrder, clearAllOrders } from '../../services/orderService';
import { CheckCircle2, Clock, Trash2, RefreshCw, Printer } from 'lucide-react';
import { PosReceiptModal } from './PosReceiptModal';
import { orderToReceiptTrx } from '../../utils/receiptPrinter';

export const PosTransactionsView: React.FC = () => {
  const { currentStore } = useApp();
  const [orders, setOrders] = useState<Order[]>(() => getLocalOrders(currentStore.slug));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();

    const handleSync = () => {
      loadOrders();
    };

    window.addEventListener('sr12:cloud_sync_orders', handleSync);
    return () => {
      window.removeEventListener('sr12:cloud_sync_orders', handleSync);
    };
  }, [currentStore.slug]);

  const loadOrders = async () => {
    setIsRefreshing(true);
    setOrders(getLocalOrders(currentStore.slug));
    try {
      const cloudOrders = await fetchStoreOrders(currentStore.slug);
      if (cloudOrders) {
        setOrders(cloudOrders);
      }
    } catch (e) {}
    setIsRefreshing(false);
  };

  const handleConfirmOrder = async (order: Order) => {
    await updateOrderStatus(order.orderId, 'Lunas / Selesai', currentStore.slug);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: currentStore.slug } }));
    }

    setOrders(prev => prev.map(o => (o.orderId === order.orderId || o.id === order.orderId) ? { ...o, status: 'Lunas / Selesai' } : o));
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm(`Hapus transaksi #${orderId} dari riwayat toko?`)) {
      const remaining = await deleteOrder(orderId, currentStore.slug);
      setOrders(remaining);
    }
  };

  const handleClearAll = async () => {
    if (orders.length === 0) {
      alert('Tidak ada transaksi untuk dibersihkan.');
      return;
    }
    if (window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA (${orders.length}) riwayat transaksi toko ini untuk memulai simulasi dari nol?`)) {
      await clearAllOrders(currentStore.slug);
      setOrders([]);
    }
  };

  const filtered = orders.filter(o => {
    if (o.orderSource?.startsWith('Kas Manual')) return false;
    if (filter === 'pending') return o.status === 'Menunggu Konfirmasi' || o.status === 'Pending';
    if (filter === 'done') return o.status === 'Lunas / Selesai' || o.status === 'Selesai';
    return true;
  });

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Riwayat Pesanan &amp; Transaksi Toko</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>Pantau pesanan web masuk dan penjualan kasir langsung</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: filter === 'all' ? '#0284c7' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
              cursor: 'pointer'
            }}
          >
            Semua ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: filter === 'pending' ? '#f59e0b' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Pesanan Perlu Diproses"
          >
            <Clock size={13} />
            <span className="hide-on-mobile">Perlu Diproses</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('done')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: filter === 'done' ? '#059669' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Pesanan Selesai / Lunas"
          >
            <CheckCircle2 size={13} />
            <span className="hide-on-mobile">Selesai</span>
          </button>
          <button
            type="button"
            onClick={loadOrders}
            style={{ padding: '6px 10px', borderRadius: '6px', background: '#334155', color: '#fff', border: '1px solid #475569', cursor: 'pointer' }}
            title="Refresh Pesanan"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 800,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
            title="Hapus seluruh riwayat transaksi toko ini untuk mulai simulasi baru"
          >
            <Trash2 size={13} />
            <span className="hide-on-mobile">Bersihkan Transaksi</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#1e293b', borderRadius: '12px', border: '1px dashed #334155' }}>
          <Clock size={36} color="#64748b" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontWeight: 700, color: '#94a3b8' }}>Belum ada riwayat pesanan dengan filter ini.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(o => (
            <div
              key={o.orderId}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#38bdf8' }}>#{o.orderId}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(o.createdAt || o.orderDate || Date.now()).toLocaleString('id-ID')}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: o.status === 'Lunas / Selesai' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      color: o.status === 'Lunas / Selesai' ? '#34d399' : '#f59e0b'
                    }}
                  >
                    {o.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{o.customerName}</span>
                  <span style={{ color: '#94a3b8' }}>&bull; {o.tierLabel}</span>
                  {o.marketerId && (
                    <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 800 }}>
                      💼 Afiliasi: {o.marketerId}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {o.items.length} item &bull; {o.items.map(it => it.name).join(', ')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>
                    Rp {o.grandTotal.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{o.paymentMethod}</div>
                </div>

                {o.status !== 'Lunas / Selesai' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmOrder(o)}
                    style={{
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Konfirmasi Lunas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(o)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                  title="Cetak atau kirim ulang struk pembayaran pesanan ini"
                >
                  <Printer size={14} />
                  <span>Cetak Struk</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteOrder(o.orderId)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Hapus transaksi ini"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cetak Ulang Struk Pembayaran */}
      {selectedReceiptOrder && (
        <PosReceiptModal
          trx={orderToReceiptTrx(selectedReceiptOrder)}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};
