import React, { useState } from 'react';
import { Product, PartnerTier } from '../../types';
import { useApp } from '../../context/AppContext';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { PosReceiptModal } from './PosReceiptModal';
import { deductStoreTransactionQuota } from '../../services/storeService';
import { Coins, AlertTriangle } from 'lucide-react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  X,
  CreditCard,
  User,
  Phone,
  ShieldCheck
} from 'lucide-react';

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
  const [showMobileCheckoutDrawer, setShowMobileCheckoutDrawer] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
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
    setPosCart(prev =>
      prev
        .map(item => {
          if (item.product.id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as PosCartLine[]
    );
  };

  const removeLine = (id: string) => {
    setPosCart(prev => prev.filter(i => i.product.id !== id));
  };

  const clearPosCart = () => {
    setPosCart([]);
    setCashReceived(0);
  };

  // Calculations
  const subtotalHet = posCart.reduce((sum, line) => sum + line.product.het * line.qty, 0);
  const totalPayable = posCart.reduce((sum, line) => {
    const unitPrice = getProductTierPrice(line.product.het, buyerTier);
    return sum + unitPrice * line.qty;
  }, 0);
  const totalDiscount = Math.max(0, subtotalHet - totalPayable);
  const changeAmount = Math.max(0, (cashReceived || 0) - totalPayable);
  const totalCartCount = posCart.reduce((sum, line) => sum + line.qty, 0);

  const handleCheckout = async () => {
    if (posCart.length === 0) {
      alert('Keranjang kasir masih kosong.');
      return;
    }

    if ((currentStore.orderQuota || 0) <= 0) {
      alert('⚠️ Kuota Token Transaksi Toko Anda Telah Habis (0 Token)!\n\nUntuk memproses dan mencatat transaksi kasir baru, silakan lakukan Isi Ulang Token terlebih dahulu melalui tombol Token di menu atas.');
      return;
    }

    const res = await deductStoreTransactionQuota(currentStore.slug);
    if (!res.success) {
      alert('⚠️ Token Transaksi tidak mencukupi.');
      return;
    }
    currentStore.orderQuota = res.remainingQuota;

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
    } catch {}

    setCompletedTrx(trxData);
    clearPosCart();
    setShowMobileCheckoutDrawer(false);
  };

  // Reusable Checkout & Cart Panel Content
  const renderCartAndPaymentContent = (isModal = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Buyer Tier Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', background: '#1e293b' }}>
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
          <option value="marketer">Mitra Marketer (Diskon 15%)</option>
          <option value="reseller">Reseller Resmi (Diskon 20%)</option>
          <option value="sub_agen">Sub Agen (Diskon 30%)</option>
          <option value="agen">Agen Resmi (Diskon 40%)</option>
          <option value="distributor">Distributor Utama (Diskon 50%)</option>
        </select>

        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Nama Pelanggan"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '6px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#fff',
                fontSize: '0.76rem'
              }}
            />
          </div>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="No. WA (Struk)"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '6px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#fff',
                fontSize: '0.76rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {posCart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
            <ShoppingBag size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.82rem' }}>Keranjang kasir masih kosong</p>
            <p style={{ fontSize: '0.74rem', marginTop: '2px' }}>Pilih produk di katalog untuk ditambahkan</p>
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
                  gap: '8px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {line.product.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                    Rp {unitPrice.toLocaleString('id-ID')} &times; {line.qty} ={' '}
                    <b>Rp {(unitPrice * line.qty).toLocaleString('id-ID')}</b>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => updateQty(line.product.id, -1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: '#1e293b',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, width: '22px', textAlign: 'center', color: '#fff' }}>
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(line.product.id, 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: '#1e293b',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(line.product.id)}
                    style={{ color: '#ef4444', marginLeft: '4px' }}
                    title="Hapus baris"
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '3px' }}>
            <span>Subtotal HET:</span>
            <span>Rp {subtotalHet.toLocaleString('id-ID')}</span>
          </div>
          {totalDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#34d399', marginBottom: '3px' }}>
              <span>Diskon ({SR12_TIERS[buyerTier].name}):</span>
              <span>-Rp {totalDiscount.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.15rem',
              fontWeight: 900,
              color: '#38bdf8',
              marginBottom: '10px',
              borderTop: '1px solid #1e293b',
              paddingTop: '6px'
            }}
          >
            <span>TOTAL BAYAR:</span>
            <span>Rp {totalPayable.toLocaleString('id-ID')}</span>
          </div>

          {/* Cash Input & Quick Money Chips */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <input
                type="number"
                placeholder="Uang Tunai Diterima..."
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="button"
                onClick={() => setCashReceived(totalPayable)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '0.74rem',
                  fontWeight: 800
                }}
              >
                Uang Pas
              </button>
            </div>

            {/* Quick cash shortcut chips */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {[50000, 100000, 200000, 500000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashReceived(amt)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}
                >
                  {(amt / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>

            {cashReceived > totalPayable && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.25)'
                }}
              >
                <span>Kembalian:</span>
                <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          {(currentStore.orderQuota || 0) <= 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.18)', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', fontSize: '0.74rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} color="#ef4444" />
              <span>Token Transaksi Habis! Isi ulang token untuk melanjutkan.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={(currentStore.orderQuota || 0) <= 0}
            style={{
              width: '100%',
              background: (currentStore.orderQuota || 0) <= 0 ? '#475569' : 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: (currentStore.orderQuota || 0) <= 0 ? 'none' : '0 4px 14px rgba(2,132,199,0.4)',
              cursor: (currentStore.orderQuota || 0) <= 0 ? 'not-allowed' : 'pointer',
              opacity: (currentStore.orderQuota || 0) <= 0 ? 0.7 : 1
            }}
          >
            <CheckCircle size={18} />
            <span>Selesaikan &amp; Cetak Struk</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="pos-cashier-layout">
      {/* Left Catalog Area */}
      <div className="pos-catalog-area">
        {/* Search & Categories Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              placeholder="Cari produk / scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                fontSize: '0.82rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
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

        {/* Product Cards Grid for Cashier (Mobile 2-Column Friendly) */}
        <div className="pos-products-grid">
          {filteredProducts.map(p => {
            const unitPrice = getProductTierPrice(p.het, buyerTier);
            return (
              <div
                key={p.id}
                onClick={() => addToPosCart(p)}
                className="pos-product-card"
                title={`Klik untuk masukkan ke kasir: ${p.name}`}
              >
                <div className="pos-product-card-img">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <span className={`pos-stock-tag ${p.stock <= 15 ? 'warning' : 'ok'}`}>
                    {p.stock}
                  </span>
                </div>
                <div className="pos-product-card-name">
                  {p.name}
                </div>
                <div className="pos-product-card-price">
                  Rp {unitPrice.toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Right Cart & Payment Panel */}
      <aside className="pos-desktop-cart-panel">
        {renderCartAndPaymentContent(false)}
      </aside>

      {/* Mobile Floating Bottom Cashier Dock Bar */}
      {totalCartCount > 0 && (
        <div className="pos-mobile-floating-bar">
          <div
            className="pos-mobile-bar-summary"
            onClick={() => setShowMobileCheckoutDrawer(true)}
          >
            <div className="pos-mobile-bar-qty">
              <ShoppingBag size={16} />
              <span>{totalCartCount} Item</span>
            </div>
            <div className="pos-mobile-bar-total">
              Rp {totalPayable.toLocaleString('id-ID')}
            </div>
          </div>
          <button
            type="button"
            className="btn-pos-mobile-checkout"
            onClick={() => setShowMobileCheckoutDrawer(true)}
          >
            <span>Bayar</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Mobile Full Screen / Drawer Checkout Modal */}
      {showMobileCheckoutDrawer && (
        <div className="pos-mobile-drawer-overlay">
          <div className="pos-mobile-drawer-content">
            <div className="pos-mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
                  Keranjang &amp; Kasir Pembayaran
                </h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowMobileCheckoutDrawer(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {renderCartAndPaymentContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* Struk Modal */}
      {completedTrx && (
        <PosReceiptModal trx={completedTrx} onClose={() => setCompletedTrx(null)} />
      )}
    </div>
  );
};
