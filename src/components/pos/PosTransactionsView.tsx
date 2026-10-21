import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { fetchStoreOrders, updateOrderStatus } from '../../services/orderService';
import { CheckCircle2, Clock, Trash2, RefreshCw } from 'lucide-react';

export const PosTransactionsView: React.FC = () => {
  const { currentStore } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => {
    loadOrders();
  }, [currentStore.slug]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchStoreOrders(currentStore.slug);
      setOrders(data);
    } catch {}
    setLoading(false);
  };

  const handleConfirmOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'Lunas / Selesai', currentStore.slug);
    await loadOrders();
  };

  const filtered = orders.filter(o => {
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

        <div style={{ display: 'flex', gap: '8px' }}>
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
              border: '1px solid #334155'
            }}
          >
            Semua ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: filter === 'pending' ? '#f59e0b' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155'
            }}
          >
            Perlu Diproses
          </button>
          <button
            type="button"
            onClick={() => setFilter('done')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              background: filter === 'done' ? '#059669' : '#1e293b',
              color: '#fff',
              border: '1px solid #334155'
            }}
          >
            Selesai
          </button>
          <button
            type="button"
            onClick={loadOrders}
            style={{ padding: '6px 10px', borderRadius: '6px', background: '#334155', color: '#fff' }}
            title="Refresh Pesanan"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat pesanan...</div>
      ) : filtered.length === 0 ? (
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

                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {o.customerName} &bull; <span style={{ color: '#94a3b8' }}>{o.tierLabel}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {o.items.length} item &bull; {o.items.map(it => it.name).join(', ')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>
                    Rp {o.grandTotal.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{o.paymentMethod}</div>
                </div>

                {o.status !== 'Lunas / Selesai' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmOrder(o.orderId)}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
