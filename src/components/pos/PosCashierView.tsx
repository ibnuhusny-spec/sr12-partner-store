import React, { useState } from 'react';
import { Product, PartnerTier } from '../../types';
import { useApp } from '../../context/AppContext';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { PosReceiptModal } from './PosReceiptModal';
import { Search, Plus, Minus, Trash2, Printer, CheckCircle } from 'lucide-react';

interface PosCashierViewProps {
  products: Product[];
  activeCashierName: string;
}

interface PosCartLine {
  product: Product;
  qty: number;
}

export const PosCashierView: React.FC<PosCashierViewProps> = ({ products, activeCashierName }) => {
  const { currentStore } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [buyerTier, setBuyerTier] = useState<PartnerTier>('konsumen');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [posCart, setPosCart] = useState<PosCartLine[]>([]);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [completedTrx, setCompletedTrx] = useState<any | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToPosCart = (product: Product) => {
    setPosCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setPosCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const nextQty = item.qty + delta;
        return nextQty > 0 ? { ...item, qty: nextQty } : null;
      }
      return item;
    }).filter(Boolean) as PosCartLine[]);
  };

  const removeLine = (id: string) => {
    setPosCart(prev => prev.filter(i => i.product.id !== id));
  };

  const clearPosCart = () => {
    setPosCart([]);
    setCashReceived(0);
  };

  // Calculations
  const subtotalHet = posCart.reduce((sum, line) => sum + (line.product.het * line.qty), 0);
  const totalPayable = posCart.reduce((sum, line) => {
    const unitPrice = getProductTierPrice(line.product.het, buyerTier);
    return sum + (unitPrice * line.qty);
  }, 0);
  const totalDiscount = Math.max(0, subtotalHet - totalPayable);
  const changeAmount = Math.max(0, (cashReceived || 0) - totalPayable);

  const handleCheckout = () => {
    if (posCart.length === 0) {
      alert('Keranjang kasir masih kosong.');
      return;
    }

    const trxId = 'POS-' + Math.floor(100000 + Math.random() * 900000);
    const trxData = {
      id: trxId,
      date: new Date().toISOString(),
      storeSlug: currentStore.slug,
      cashier: activeCashierName,
      customerName: buyerName.trim() || 'Konsumen Langsung',
      customerPhone: buyerPhone.trim(),
      buyerTier: SR12_TIERS[buyerTier].name,
      items: posCart.map(line => ({
        id: line.product.id,
        name: line.product.name,
        price: getProductTierPrice(line.product.het, buyerTier),
        qty: line.qty,
        subtotal: getProductTierPrice(line.product.het, buyerTier) * line.qty
      })),
      subtotal: subtotalHet,
      discount: totalDiscount,
      grandTotal: totalPayable,
      cashReceived: cashReceived || totalPayable,
      change: changeAmount
    };

    // Save to local pos transactions
    try {
      const raw = localStorage.getItem(`sr12_pos_transactions_v1`);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(trxData);
      localStorage.setItem(`sr12_pos_transactions_v1`, JSON.stringify(list));
    } catch (e) {}

    setCompletedTrx(trxData);
    clearPosCart();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* Left Catalog Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0b1329', padding: '16px', overflowY: 'auto' }}>
        {/* Search & Categories Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Cari nama produk / scan barcode SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '0.84rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  background: selectedCategory === cat ? '#0284c7' : '#1e293b',
                  color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                  border: '1px solid #334155'
                }}
              >
                {cat === 'all' ? 'Semua' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid for Cashier */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {filteredProducts.map(p => {
            const unitPrice = getProductTierPrice(p.het, buyerTier);
            return (
              <div
                key={p.id}
                onClick={() => addToPosCart(p)}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.15s ease'
                }}
                className="pos-product-card"
              >
                <div style={{ width: '100%', height: '110px', borderRadius: '6px', overflow: 'hidden', background: '#0f172a', marginBottom: '8px' }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3, minHeight: '32px' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                  Stok: <b style={{ color: p.stock <= 15 ? '#f59e0b' : '#34d399' }}>{p.stock} pcs</b>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>
                  Rp {unitPrice.toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Cart & Payment Panel */}
      <div style={{ width: '420px', background: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        {/* Buyer Tier Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
            Level Harga Pembeli:
          </div>
          <select
            value={buyerTier}
            onChange={(e) => setBuyerTier(e.target.value as PartnerTier)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 800
            }}
          >
            <option value="konsumen">Konsumen Retail (HET Penuh)</option>
            <option value="marketer">Mitra Marketer (15%)</option>
            <option value="reseller">Reseller Resmi (Diskon 20%)</option>
            <option value="sub_agen">Sub Agen (Diskon 30%)</option>
            <option value="agen">Agen Resmi (Diskon 40%)</option>
            <option value="distributor">Distributor Utama (Diskon 50%)</option>
          </select>

          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input
              type="text"
              placeholder="Nama Pelanggan (opsional)"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.76rem' }}
            />
            <input
              type="text"
              placeholder="No. WA (nota)"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '0.76rem' }}
            />
          </div>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {posCart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
              Pilih produk di katalog sebelah kiri untuk memasukkan ke keranjang kasir
            </div>
          ) : (
            posCart.map(line => {
              const unitPrice = getProductTierPrice(line.product.het, buyerTier);
              return (
                <div
                  key={line.product.id}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {line.product.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                      Rp {unitPrice.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => updateQty(line.product.id, -1)}
                      style={{ width: '24px', height: '24px', background: '#1e293b', color: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, minWidth: '18px', textAlign: 'center', color: '#fff' }}>
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.product.id, 1)}
                      style={{ width: '24px', height: '24px', background: '#1e293b', color: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(line.product.id)}
                      style={{ color: '#ef4444', marginLeft: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Payment Bottom Area */}
        {posCart.length > 0 && (
          <div style={{ padding: '14px 16px', background: '#090d16', borderTop: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Subtotal HET:</span>
              <span>Rp {subtotalHet.toLocaleString('id-ID')}</span>
            </div>
            {totalDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#34d399', marginBottom: '4px' }}>
                <span>Diskon ({SR12_TIERS[buyerTier].name}):</span>
                <span>-Rp {totalDiscount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8', marginBottom: '10px', borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
              <span>TOTAL BAYAR:</span>
              <span>Rp {totalPayable.toLocaleString('id-ID')}</span>
            </div>

            {/* Cash Input & Quick Buttons */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  type="number"
                  placeholder="Uang Tunai Diterima..."
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => setCashReceived(totalPayable)}
                  style={{ padding: '6px 10px', borderRadius: '6px', background: '#334155', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  Uang Pas
                </button>
              </div>

              {cashReceived > totalPayable && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
                  <span>Kembalian:</span>
                  <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2,132,199,0.4)'
              }}
            >
              <CheckCircle size={18} />
              <span>Selesaikan Transaksi &amp; Cetak Struk</span>
            </button>
          </div>
        )}
      </div>

      {/* Struk Modal */}
      {completedTrx && (
        <PosReceiptModal trx={completedTrx} onClose={() => setCompletedTrx(null)} />
      )}
    </div>
  );
};
