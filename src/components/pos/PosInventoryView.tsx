import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { Package, AlertTriangle, Plus, Minus, Send, Check, X } from 'lucide-react';

interface PosInventoryViewProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const PosInventoryView: React.FC<PosInventoryViewProps> = ({ products, onUpdateStock }) => {
  const { currentStore } = useApp();
  const [filter, setFilter] = useState<'all' | 'warning' | 'empty'>('all');
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(50);

  const filtered = products.filter(p => {
    if (filter === 'warning') return p.stock > 0 && p.stock <= 15;
    if (filter === 'empty') return p.stock === 0;
    return true;
  });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 15).length;
  const emptyStockCount = products.filter(p => p.stock === 0).length;

  const handleSendRestockOrder = () => {
    if (!restockProduct) return;
    const estCost = (restockProduct.het * 0.5) * restockQty; // 50% distributor modal
    const waMsg = `*ORDER RESTOCK PRODUK KE PT SR12 PUSAT* 📦
Dari: *${currentStore.storeName}* (${currentStore.storeCity})
Pemilik: ${currentStore.storeOwner}

Produk: *${restockProduct.name}*
SKU: ${restockProduct.sku}
Jumlah Restock: *${restockQty} pcs*
Estimasi Modal Distributor (50%): Rp ${estCost.toLocaleString('id-ID')}

Mohon segera diproses pengirimannya dari gudang pusat PT SR12. Terima kasih! 🙏`;

    window.open(`https://wa.me/6281200001212?text=${encodeURIComponent(waMsg)}`, '_blank');
    setRestockProduct(null);
  };

  return (
    <div style={{ padding: '20px', background: '#0b1329', minHeight: 'calc(100vh - 65px)', color: '#f8fafc' }}>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div
          onClick={() => setFilter('all')}
          style={{
            background: '#1e293b',
            border: filter === 'all' ? '2px solid #38bdf8' : '1px solid #334155',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Total SKU Aktif</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc' }}>{products.length} Item</div>
          <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Semua Katalog</div>
        </div>

        <div
          onClick={() => setFilter('warning')}
          style={{
            background: '#1e293b',
            border: filter === 'warning' ? '2px solid #f59e0b' : '1px solid #334155',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 700 }}>⚠️ Stok Menipis (&le; 15 pcs)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{lowStockCount} Item</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Perlu Restock ke PT SR12</div>
        </div>

        <div
          onClick={() => setFilter('empty')}
          style={{
            background: '#1e293b',
            border: filter === 'empty' ? '2px solid #ef4444' : '1px solid #334155',
            padding: '14px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 700 }}>⛔ Stok Habis (0 pcs)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{emptyStockCount} Item</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Segera Order Ulang</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
            Manajemen Inventori &amp; Indikator Cerdas Olsera
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 14px' }}>Produk</th>
                <th style={{ padding: '10px 14px' }}>Kategori</th>
                <th style={{ padding: '10px 14px' }}>HET</th>
                <th style={{ padding: '10px 14px' }}>Status Olsera</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Sisa Stok</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Aksi Cepat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                let badge = <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>🟢 Ready</span>;
                if (p.stock === 0) {
                  badge = <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>🔴 Habis</span>;
                } else if (p.stock <= 15) {
                  badge = <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>🟡 Menipis (⚠️)</span>;
                }

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 800, color: '#f8fafc' }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{p.category}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38bdf8' }}>Rp {p.het.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 14px' }}>{badge}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 900, fontSize: '0.92rem' }}>{p.stock} pcs</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Kurangi Stok 1"
                        >
                          <Minus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStock(p.id, p.stock + 1)}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#334155', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Tambah Stok 1"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestockProduct(p)}
                          style={{ padding: '4px 8px', borderRadius: '6px', background: '#0369a1', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}
                          title="Buat Order Restock ke PT SR12"
                        >
                          Restock WA
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Restock PT SR12 */}
      {restockProduct && (
        <div className="modal-overlay" onClick={() => setRestockProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', background: '#1e293b', color: '#fff' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Restock ke PT SR12 Pusat</h3>
              <button type="button" className="btn-close-modal" onClick={() => setRestockProduct(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Produk yang Direstock:</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{restockProduct.name}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Jumlah Restock (pcs):</label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Estimasi Modal Distributor (50% HET):</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>
                  Rp {((restockProduct.het * 0.5) * restockQty).toLocaleString('id-ID')}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendRestockOrder}
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={15} />
                <span>Kirim Format Order ke WA Pusat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
