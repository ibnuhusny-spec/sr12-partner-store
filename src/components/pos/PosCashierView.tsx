import React, { useState, useEffect } from 'react';
import { Product, PartnerTier, Order, MitraDownline, MarketerSale, CashflowEntry } from '../../types';
import { useApp } from '../../context/AppContext';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { PosReceiptModal } from './PosReceiptModal';
import { deductStoreTransactionQuota } from '../../services/storeService';
import { createOrder } from '../../services/orderService';
import { updateStoreProductStock, batchUpdateStoreProductStocks } from '../../services/catalogService';
import { recordStockMutation } from '../../services/posService';
import { fetchStoreDownlines, saveStoreDownline, fetchStoreMarketerSales, getLocalDownlines } from '../../services/mitraService';
import { Coins, AlertTriangle, Users, Sparkles, CheckCircle2 } from 'lucide-react';
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
  ShieldCheck,
  Package
} from 'lucide-react';

interface PosCashierViewProps {
  products: Product[];
  activeCashierName: string;
  onUpdateStock: (productId: string, newStock: number) => void;
  onSwitchTab?: (tab: string) => void;
}

interface PosCartLine {
  product: Product;
  qty: number;
}

export const PosCashierView: React.FC<PosCashierViewProps> = ({
  products,
  activeCashierName,
  onUpdateStock,
  onSwitchTab
}) => {
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
  const [downlinesList, setDownlinesList] = useState<MitraDownline[]>(() => getLocalDownlines());
  const [selectedDownlineCode, setSelectedDownlineCode] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Load registered downlines for easy customer tagging
  useEffect(() => {
    setDownlinesList(getLocalDownlines());
  }, [currentStore.slug]);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSelectDownline = (partnerCode: string) => {
    setSelectedDownlineCode(partnerCode);
    if (!partnerCode) {
      setBuyerTier('konsumen');
      return;
    }
    const found = downlinesList.find(m => m.partnerCode === partnerCode);
    if (found) {
      setBuyerTier(found.tier);
      setBuyerName(found.name);
      setBuyerPhone(found.phone);
    }
  };

  const addToPosCart = (product: Product) => {
    // PROTEKSI: Produk 0 stok tidak boleh dibeli
    if (product.stock <= 0) {
      alert(`Mohon maaf, produk "${product.name}" sedang HABIS (0 stok di gudang)! Silakan restock terlebih dahulu melalui menu Inventori & Stok.`);
      return;
    }

    setPosCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx >= 0) {
        if (prev[idx].qty + 1 > product.stock) {
          alert(`Stok tidak mencukupi! Hanya tersisa ${product.stock} pcs di gudang toko.`);
          return prev;
        }
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
            if (delta > 0 && nextQty > item.product.stock) {
              alert(`Maksimal stok yang tersedia di gudang hanya ${item.product.stock} pcs.`);
              return item;
            }
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

    // 1. Validasi stok semua item di keranjang sebelum transaksi diselesaikan
    for (const line of posCart) {
      if (line.qty > line.product.stock) {
        alert(`Stok tidak mencukupi untuk "${line.product.name}". Tersedia: ${line.product.stock} pcs, jumlah kasir: ${line.qty} pcs.`);
        return;
      }
    }

    if ((currentStore.orderQuota || 0) <= 0) {
      alert('⚠️ Kuota Token Transaksi Toko Anda Telah Habis (0 Token)!\n\nUntuk memproses dan mencatat transaksi kasir baru, silakan lakukan Isi Ulang Token terlebih dahulu melalui tombol Token di menu atas.');
      return;
    }

    setIsProcessingCheckout(true);

    try {
      // 2. Deduksi token transaksi toko
      const res = await deductStoreTransactionQuota(currentStore.slug);
      if (!res.success) {
        alert('⚠️ Token Transaksi tidak mencukupi.');
        setIsProcessingCheckout(false);
        return;
      }
      currentStore.orderQuota = res.remainingQuota;

      const trxId = 'POS-' + Math.floor(100000 + Math.random() * 900000);
      const custName = buyerName.trim() || 'Konsumen Kasir Langsung';
      const custPhone = buyerPhone.trim() || '-';

      // 2. IDENTIFIKASI MITRA / DOWNLINE: Cek apakah pembeli adalah Mitra Terdaftar
      let targetMitra = selectedDownlineCode
        ? downlinesList.find(m => m.partnerCode === selectedDownlineCode)
        : null;

      if (!targetMitra && (custPhone !== '-' || custName)) {
        targetMitra = downlinesList.find(m => 
          (custPhone !== '-' && m.phone.replace(/[^0-9]/g, '').endsWith(custPhone.replace(/[^0-9]/g, ''))) ||
          (custName && m.name.toLowerCase() === custName.toLowerCase().trim()) ||
          (custName && m.partnerCode.toUpperCase() === custName.toUpperCase().trim())
        ) || null;
      }

      // Pastikan level mitra yang terdaftar menjadi prioritas utama
      const finalBuyerTier: PartnerTier = targetMitra ? targetMitra.tier : buyerTier;
      const payableAmount = posCart.reduce((sum, line) => {
        const uPrice = getProductTierPrice(line.product.het, finalBuyerTier);
        return sum + uPrice * line.qty;
      }, 0);
      const discountAmt = Math.max(0, subtotalHet - payableAmount);

      // 3. TERHUBUNG KE MENU TRANSAKSI & LAPORAN: Simpan ke tabel Orders
      const orderData: Order = {
        orderId: trxId,
        storeSlug: currentStore.slug,
        partnerCode: targetMitra ? targetMitra.partnerCode : (selectedDownlineCode || undefined),
        customerName: custName,
        customerPhone: custPhone,
        customerAddress: 'Transaksi Kasir Langsung di Toko / Gudang',
        tier: finalBuyerTier,
        tierLabel: SR12_TIERS[finalBuyerTier].name,
        items: posCart.map(line => ({
          id: line.product.id,
          name: line.product.name,
          price: getProductTierPrice(line.product.het, finalBuyerTier),
          quantity: line.qty,
          subtotal: getProductTierPrice(line.product.het, finalBuyerTier) * line.qty,
          het: line.product.het,
          weightGram: line.product.weightGram || 100
        })),
        subtotalHet,
        discountAmount: discountAmt,
        grandTotal: payableAmount,
        paymentMethod: 'Tunai Kasir POS',
        status: 'Lunas / Selesai',
        orderSource: 'Kasir POS Offline',
        createdAt: new Date().toISOString()
      };
      await createOrder(orderData, currentStore.slug);

      // 4. TERHUBUNG KE INVENTORI & STOK: Kurangi stok dan catat mutasi stok keluar
      const stockUpdates: { productId: string; newStock: number }[] = [];
      for (const line of posCart) {
        const nextStock = Math.max(0, line.product.stock - line.qty);
        onUpdateStock(line.product.id, nextStock);
        stockUpdates.push({ productId: line.product.id, newStock: nextStock });
        recordStockMutation({
          id: 'MUT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          storeSlug: currentStore.slug,
          productId: line.product.id,
          productName: line.product.name,
          sku: line.product.sku,
          date: new Date().toISOString(),
          type: 'out',
          qty: line.qty,
          beforeStock: line.product.stock,
          afterStock: nextStock,
          remainingStock: nextStock,
          notes: `Penjualan Kasir POS #${trxId} (${custName})`,
          reason: `Penjualan Kasir POS #${trxId} (${custName})`,
          operator: activeCashierName
        }, currentStore.slug);
      }
      if (stockUpdates.length > 0) {
        batchUpdateStoreProductStocks(currentStore.slug, stockUpdates);
      }

      // 5. TERHUBUNG KE BUKU KAS: Otomatis tercatat dari pesanan order POS di atas (Single Source of Truth)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sr12:cloud_sync_cashflow', { detail: { storeSlug: currentStore.slug } }));
      }

      // 6. TERHUBUNG KE MITRA / DOWNLINE: Perbarui akumulasi belanja & hitung komisi Marketer
      if (targetMitra) {
        targetMitra.accumulatedSpent90Days = (targetMitra.accumulatedSpent90Days || 0) + totalPayable;
        targetMitra.totalOrdersCount = (targetMitra.totalOrdersCount || 0) + 1;
        targetMitra.lastOrderDate = new Date().toISOString().split('T')[0];
        await saveStoreDownline(targetMitra, currentStore.slug);

        // Jika transaksi dicatat untuk Marketer, catat komisi 15% di Payroll
        if (finalBuyerTier === 'marketer') {
          const mSale: MarketerSale = {
            storeSlug: currentStore.slug,
            orderId: trxId,
            marketerId: targetMitra.partnerCode,
            orderDate: new Date().toISOString().split('T')[0],
            monthPeriod: new Date().toISOString().slice(0, 7),
            customerName: custName,
            customerPhone: custPhone,
            fulfillmentType: 'pickup',
            itemsDesc: posCart.map(l => `${l.qty}x ${l.product.name}`).join(', '),
            omsetHet: subtotalHet,
            commissionPct: 15,
            commissionAmount: Math.round(subtotalHet * 0.15),
            paidStatus: 'unpaid'
          };
          const curSales = await fetchStoreMarketerSales(currentStore.slug);
          curSales.unshift(mSale);
          try {
            localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(curSales));
          } catch {}
        }
      }

      // 7. Simpan juga ke cache struk transaksi kasir
      const trxData = {
        id: trxId,
        date: new Date().toISOString(),
        storeSlug: currentStore.slug,
        cashier: activeCashierName,
        customerName: custName,
        customerPhone: custPhone,
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

      try {
        const raw = localStorage.getItem(`sr12_pos_transactions_v1`);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(trxData);
        localStorage.setItem(`sr12_pos_transactions_v1`, JSON.stringify(list));
      } catch {}

      setCompletedTrx(trxData);
      clearPosCart();
      setShowMobileCheckoutDrawer(false);
    } catch (err: any) {
      console.error('Error processing POS checkout:', err);
      alert(`Terjadi kesalahan saat memproses transaksi: ${err.message || 'Error'}`);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Reusable Checkout & Cart Panel Content
  const renderCartAndPaymentContent = (isModal = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Buyer Tier & Customer Linkage Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155', background: '#1e293b' }}>
        {/* Quick Downline Picker */}
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <Users size={12} color="#38bdf8" />
            <span>Pilih Mitra / Downline (Otomatis Level):</span>
          </label>
          <select
            value={selectedDownlineCode}
            onChange={(e) => handleSelectDownline(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#f8fafc',
              fontSize: '0.76rem',
              fontWeight: 700
            }}
          >
            <option value="">— Pelanggan Umum / Non-Mitra —</option>
            {downlinesList.map(m => (
              <option key={m.partnerCode} value={m.partnerCode}>
                {m.name} ({m.partnerCode} &bull; {m.tier.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
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
          <option value="marketer">Mitra Marketer (Komisi 15%)</option>
          <option value="reseller">Reseller Resmi (Diskon 20%)</option>
          <option value="sub_agen">Sub Agen (Diskon 30%)</option>
          <option value="agen">Agen Resmi (Diskon 40%)</option>
          <option value="distributor">Distributor Utama (Diskon 50%)</option>
        </select>

        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Nama Pelanggan / Kode Mitra"
              value={buyerName}
              onChange={(e) => {
                const val = e.target.value;
                setBuyerName(val);
                if (val.trim()) {
                  const m = downlinesList.find(d => 
                    d.partnerCode.toUpperCase() === val.toUpperCase().trim() ||
                    d.name.toLowerCase() === val.toLowerCase().trim()
                  );
                  if (m) {
                    setSelectedDownlineCode(m.partnerCode);
                    setBuyerTier(m.tier);
                    if (m.phone && (!buyerPhone || buyerPhone === '-')) {
                      setBuyerPhone(m.phone);
                    }
                  }
                }
              }}
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
              onChange={(e) => {
                const val = e.target.value;
                setBuyerPhone(val);
                const digits = val.replace(/[^0-9]/g, '');
                if (digits.length >= 8) {
                  const m = downlinesList.find(d => d.phone.replace(/[^0-9]/g, '').endsWith(digits.slice(-8)));
                  if (m) {
                    setSelectedDownlineCode(m.partnerCode);
                    setBuyerTier(m.tier);
                    if (!buyerName || buyerName === 'Konsumen Kasir Langsung') {
                      setBuyerName(m.name);
                    }
                  }
                }
              }}
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
            <p style={{ fontSize: '0.74rem', marginTop: '2px' }}>Pilih produk di katalog sebelah kiri untuk transaksi</p>
          </div>
        ) : (
          posCart.map(line => {
            const unitPrice = getProductTierPrice(line.product.het, buyerTier);
            const isAtMaxStock = line.qty >= line.product.stock;
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
                      fontWeight: 700,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={line.product.name}
                  >
                    {line.product.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#38bdf8', marginTop: '2px' }}>
                    <span>Rp {unitPrice.toLocaleString('id-ID')}</span>
                    <span style={{ color: isAtMaxStock ? '#f87171' : '#64748b', fontSize: '0.68rem' }}>
                      (Stok: {line.product.stock})
                    </span>
                  </div>
                </div>

                {/* Qty Steppers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => updateQty(line.product.id, -1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: '#334155',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ width: '26px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem', color: '#fff' }}>
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    disabled={isAtMaxStock}
                    onClick={() => updateQty(line.product.id, 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: isAtMaxStock ? '#475569' : '#0284c7',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 800,
                      cursor: isAtMaxStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isAtMaxStock ? 0.5 : 1
                    }}
                    title={isAtMaxStock ? 'Maksimal stok tercapai' : 'Tambah Qty'}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(line.product.id)}
                    style={{
                      marginLeft: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
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

      {/* Cart Summary & Checkout Footer */}
      {posCart.length > 0 && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #334155', background: '#1e293b' }}>
          {/* Subtotal & Discount Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
            <span>Subtotal HET ({totalCartCount} pcs):</span>
            <span>Rp {subtotalHet.toLocaleString('id-ID')}</span>
          </div>

          {totalDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginBottom: '6px' }}>
              <span>Diskon {SR12_TIERS[buyerTier].label}:</span>
              <span>-Rp {totalDiscount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', marginBottom: '10px' }}>
            <span>Total Bayar:</span>
            <span style={{ color: '#38bdf8' }}>Rp {totalPayable.toLocaleString('id-ID')}</span>
          </div>

          {/* Quick Cash Buttons */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
              {[totalPayable, Math.ceil(totalPayable / 50000) * 50000, Math.ceil(totalPayable / 100000) * 100000].filter((val, idx, self) => val > 0 && self.indexOf(val) === idx).map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashReceived(amt)}
                  style={{
                    flex: 1,
                    minWidth: '70px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    background: cashReceived === amt ? '#0284c7' : '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Rp {amt.toLocaleString('id-ID')}
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
            disabled={(currentStore.orderQuota || 0) <= 0 || isProcessingCheckout}
            style={{
              width: '100%',
              background: (currentStore.orderQuota || 0) <= 0 || isProcessingCheckout ? '#475569' : 'linear-gradient(135deg, #0284c7, #0369a1)',
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
              cursor: (currentStore.orderQuota || 0) <= 0 || isProcessingCheckout ? 'not-allowed' : 'pointer',
              opacity: (currentStore.orderQuota || 0) <= 0 || isProcessingCheckout ? 0.7 : 1
            }}
          >
            <CheckCircle size={18} />
            <span>{isProcessingCheckout ? 'Memproses Transaksi...' : 'Selesaikan & Cetak Struk'}</span>
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
            const isOutOfStock = p.stock <= 0;
            return (
              <div
                key={p.id}
                onClick={() => addToPosCart(p)}
                className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                title={isOutOfStock ? `Stok ${p.name} sedang habis` : `Klik untuk masukkan ke kasir: ${p.name}`}
                style={{
                  opacity: isOutOfStock ? 0.45 : 1,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  position: 'relative'
                }}
              >
                <div className="pos-product-card-img">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <span className={`pos-stock-tag ${isOutOfStock ? 'empty' : p.stock <= 15 ? 'warning' : 'ok'}`} style={{
                    background: isOutOfStock ? '#ef4444' : undefined,
                    color: isOutOfStock ? '#fff' : undefined,
                    fontWeight: 800
                  }}>
                    {isOutOfStock ? 'HABIS (0)' : `Stok: ${p.stock}`}
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
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderCartAndPaymentContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {completedTrx && (
        <PosReceiptModal
          trx={completedTrx}
          onClose={() => setCompletedTrx(null)}
        />
      )}
    </div>
  );
};
