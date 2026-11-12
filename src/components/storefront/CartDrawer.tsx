import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { verifyMitraDiscount, getLocalDownlines, saveStoreDownline, getLocalMarketerSales } from '../../services/mitraService';
import { createOrder, formatWhatsAppOrderMessage, normalizeWhatsAppNumber } from '../../services/orderService';
import { Order, OrderItemPayload, MarketerSale, PartnerTier } from '../../types';
import { getStoreCatalog, saveStoreCatalog } from '../../services/catalogService';
import { recordStockMutation } from '../../services/posService';
import confetti from 'canvas-confetti';
import { X, Trash2, ShoppingBag, Truck, MessageCircle, UserCheck, RotateCcw } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStock?: (productId: string, newStock: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onUpdateStock }) => {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    clearCart,
    currentStore,
    activeTier,
    setActiveTier,
    verifiedMitra,
    setVerifiedMitra,
    marketerReferral
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [mitraQuery, setMitraQuery] = useState('');
  const [isVerifyingMitra, setIsVerifyingMitra] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [isDropship, setIsDropship] = useState(false);
  const [dropshipSenderName, setDropshipSenderName] = useState('');
  const [dropshipSenderPhone, setDropshipSenderPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mencegah modal tertutup tidak sengaja saat menyeleksi teks lalu kursor keluar panel
  const isMouseDownOnOverlay = useRef(false);

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownOnOverlay.current = (e.target === e.currentTarget);
  };

  const handleOverlayMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDownOnOverlay.current && e.target === e.currentTarget) {
      onClose();
    }
    isMouseDownOnOverlay.current = false;
  };

  if (!isOpen) return null;

  // Hitung subtotal dan harga produk (Tanpa biaya layanan aplikasi)
  const subtotalHet = cart.reduce((sum, item) => sum + (item.product.het * item.quantity), 0);
  const totalProductsPrice = cart.reduce((sum, item) => {
    const price = getProductTierPrice(item.product.het, activeTier);
    return sum + (price * item.quantity);
  }, 0);

  const discountAmount = Math.max(0, subtotalHet - totalProductsPrice);
  const grandTotal = totalProductsPrice; // Murni total belanja produk tanpa biaya aplikasi

  // Verifikasi Kode Mitra & Auto-Fill Data Pembeli
  const handleVerifyMitra = async () => {
    if (!mitraQuery.trim()) return;
    setIsVerifyingMitra(true);
    setVerifyMsg('');
    try {
      const res = await verifyMitraDiscount(mitraQuery, currentStore.slug);
      if (res.found && res.mitra) {
        setVerifiedMitra(res.mitra);
        if (res.mitra.tier) {
          setActiveTier(res.mitra.tier);
        }
        // Auto-fill otomatis: Nama, HP, dan Alamat
        if (res.mitra.name) setCustomerName(res.mitra.name);
        if (res.mitra.phone) setCustomerPhone(res.mitra.phone);
        if (res.mitra.address) {
          setCustomerAddress(res.mitra.address);
        } else if (res.mitra.city) {
          setCustomerAddress(res.mitra.city);
        }
        setVerifyMsg(`✅ Berhasil! Diskon ${SR12_TIERS[res.mitra.tier || 'reseller']?.name || 'Mitra'} aktif (${res.mitra.name})`);
        
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        setVerifyMsg('❌ Kode Mitra tidak ditemukan. Silakan periksa kembali atau isi data pembeli di bawah.');
      }
    } catch {
      setVerifyMsg('❌ Gagal memeriksa kode mitra.');
    } finally {
      setIsVerifyingMitra(false);
    }
  };

  // Reset status Mitra ke Konsumen umum
  const handleResetMitra = () => {
    setVerifiedMitra(null);
    setActiveTier('konsumen');
    setMitraQuery('');
    setVerifyMsg('');
  };

  const handleCheckoutWhatsApp = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Mohon isi Nama Lengkap dan Nomor WhatsApp pemesan terlebih dahulu!');
      return;
    }

    if (deliveryMethod === 'delivery' && !customerAddress.trim()) {
      alert('Mohon isi Alamat Pengiriman lengkap agar Admin dapat menghitung ongkir!');
      return;
    }

    if (cart.length === 0) {
      alert('Keranjang belanja Anda masih kosong.');
      return;
    }

    const cleanStorePhone = normalizeWhatsAppNumber(currentStore.storeWaNumber || '');
    if (!cleanStorePhone) {
      alert('Nomor WhatsApp Admin Toko belum diatur!\n\nSilakan atur "Nomor WhatsApp Toko" Anda terlebih dahulu di menu POS Admin → Banner & Profil Toko.');
      return;
    }

    setIsSubmitting(true);

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    // Deteksi Mitra Downline yang berbelanja (berdasarkan kode input, nomor WA, atau nama)
    const downlines = getLocalDownlines();
    const qCode = (mitraQuery || verifiedMitra?.partnerCode || '').toUpperCase().trim();
    const qPhone = customerPhone.replace(/[^0-9]/g, '');
    const qName = customerName.toLowerCase().trim();

    const targetMitra = downlines.find(m => 
      (qCode && m.partnerCode && m.partnerCode.toUpperCase() === qCode) ||
      (m.partnerCode && qName.includes(m.partnerCode.toLowerCase())) ||
      (qPhone && m.phone && m.phone.replace(/[^0-9]/g, '').endsWith(qPhone.slice(-8))) ||
      (qName && m.name && m.name.toLowerCase() === qName)
    ) || null;

    const finalTier: PartnerTier = (targetMitra?.tier || verifiedMitra?.tier || activeTier) as PartnerTier;
    const assignedPartnerCode = targetMitra?.partnerCode || verifiedMitra?.partnerCode || (qCode || undefined);

    const calculatedItems: OrderItemPayload[] = cart.map(item => {
      const uPrice = getProductTierPrice(item.product.het, finalTier);
      return {
        id: item.product.id,
        name: item.product.name,
        price: uPrice,
        quantity: item.quantity,
        subtotal: uPrice * item.quantity,
        het: item.product.het,
        weightGram: item.product.weightGram
      };
    });

    const calculatedProductsPrice = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const calculatedDiscountAmount = Math.max(0, subtotalHet - calculatedProductsPrice);
    const calculatedGrandTotal = calculatedProductsPrice; // Tanpa biaya aplikasi

    const courierDisplayName = deliveryMethod === 'pickup' 
      ? '🏪 Ambil Sendiri di Toko (Bebas Ongkir)' 
      : '🚚 Kirim ke Alamat (Ongkir Dikonfirmasi Admin via WA)';

    const orderData: Order = {
      orderId,
      storeSlug: currentStore.slug,
      partnerCode: assignedPartnerCode,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || (deliveryMethod === 'pickup' ? 'Ambil di Toko / Gudang' : 'Alamat dikonfirmasi via WA'),
      tier: finalTier,
      tierLabel: SR12_TIERS[finalTier].name,
      items: calculatedItems,
      subtotalHet,
      discountAmount: calculatedDiscountAmount,
      grandTotal: calculatedGrandTotal,
      paymentMethod: deliveryMethod === 'pickup' ? 'Bayar saat Ambil di Toko' : 'Transfer Bank / Ekspedisi (Sesuai Konfirmasi Admin)',
      status: 'Menunggu Konfirmasi',
      orderSource: 'Online Web Store',
      marketerId: marketerReferral || undefined,
      courierName: courierDisplayName,
      shippingCost: 0, // Ongkir diatur & disepakati bersama Admin via WhatsApp
      platformFee: 0,  // Bebas biaya layanan aplikasi
      createdAt: new Date().toISOString(),
      dropship: isDropship ? {
        isDropship: true,
        senderName: dropshipSenderName,
        senderPhone: dropshipSenderPhone
      } : undefined
    };

    try {
      // 1. Format pesan WhatsApp & siapkan URL yang 100% valid
      const waMsg = formatWhatsAppOrderMessage(orderData, currentStore);
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanStorePhone}&text=${encodeURIComponent(waMsg)}`;

      // 2. Salin otomatis ke clipboard sebagai proteksi ganda jika WA klien tidak otomatis mem-paste
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(waMsg).catch(() => {});
      }

      // 3. Simpan pesanan ke database toko & mutasi stok
      await createOrder(orderData, currentStore.slug);

      const currentCatalog = getStoreCatalog(currentStore.slug);
      const updatedCatalog = currentCatalog.map(p => {
        const inCart = cart.find(ci => ci.product.id === p.id);
        if (inCart) {
          const nextStock = Math.max(0, p.stock - inCart.quantity);
          recordStockMutation({
            id: 'MUT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            storeSlug: currentStore.slug,
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            date: new Date().toISOString(),
            type: 'out',
            qty: inCart.quantity,
            beforeStock: p.stock,
            afterStock: nextStock,
            remainingStock: nextStock,
            notes: `Pesanan Web #${orderId} (${customerName.trim()})`,
            reason: `Pesanan Web #${orderId} (${customerName.trim()})`,
            operator: 'Online Web Store'
          }, currentStore.slug);
          return { ...p, stock: nextStock };
        }
        return p;
      });

      saveStoreCatalog(currentStore.slug, updatedCatalog);

      // Update state React katalog toko agar sinkron seketika
      cart.forEach(item => {
        const nextItem = updatedCatalog.find(p => p.id === item.product.id);
        if (nextItem) {
          onUpdateStock?.(nextItem.id, nextItem.stock);
        }
      });

      // 4. Catat omset & evaluasi mitra jika pembeli adalah mitra
      if (targetMitra) {
        targetMitra.accumulatedSpent90Days = (targetMitra.accumulatedSpent90Days || 0) + calculatedGrandTotal;
        targetMitra.totalOrdersCount = (targetMitra.totalOrdersCount || 0) + 1;
        targetMitra.lastOrderDate = new Date().toISOString().split('T')[0];
        await saveStoreDownline(targetMitra, currentStore.slug);

        if (finalTier === 'marketer' || targetMitra.tier === 'marketer') {
          const mId = targetMitra.tier === 'marketer' ? targetMitra.partnerCode : (marketerReferral || targetMitra.partnerCode);
          const commissionAmt = Math.round(subtotalHet * 0.15);
          const mSale: MarketerSale = {
            storeSlug: currentStore.slug,
            orderId,
            marketerId: mId,
            orderDate: new Date().toISOString().split('T')[0],
            monthPeriod: new Date().toISOString().slice(0, 7),
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            fulfillmentType: deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
            itemsDesc: calculatedItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
            omsetHet: subtotalHet,
            commissionPct: 15,
            commissionAmount: commissionAmt,
            paidStatus: 'unpaid'
          };
          const salesList = getLocalMarketerSales();
          salesList.unshift(mSale);
          localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(salesList));
        }
      } else if (marketerReferral) {
        const commissionAmt = Math.round(subtotalHet * 0.15);
        const mSale: MarketerSale = {
          storeSlug: currentStore.slug,
          orderId,
          marketerId: marketerReferral,
          orderDate: new Date().toISOString().split('T')[0],
          monthPeriod: new Date().toISOString().slice(0, 7),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          fulfillmentType: deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
          itemsDesc: calculatedItems.map(i => `${i.quantity}x ${i.name}`).join(', '),
          omsetHet: subtotalHet,
          commissionPct: 15,
          commissionAmount: commissionAmt,
          paidStatus: 'unpaid'
        };
        const salesList = getLocalMarketerSales();
        salesList.unshift(mSale);
        localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(salesList));
      }

      // 5. Trigger confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // 6. Buka WhatsApp secara aman & terpercaya
      const win = window.open(waUrl, '_blank');
      if (!win) {
        // Fallback jika browser memblokir pop-up tab baru
        window.location.href = waUrl;
      }

      // 7. Bersihkan keranjang
      clearCart();
      onClose();
    } catch {
      alert('Gagal memproses pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="cart-drawer-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div
        className="cart-drawer-panel"
        onMouseDown={(e) => {
          e.stopPropagation();
          isMouseDownOnOverlay.current = false;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Keranjang Belanja ({cart.length})
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="cart-drawer-items" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700 }}>Keranjang Anda masih kosong</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Silakan pilih produk SR12 herbal favorit Anda di etalase</p>
            </div>
          ) : (
            <>
              {/* Daftar Produk di Keranjang */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map(item => {
                  const unitPrice = getProductTierPrice(item.product.het, activeTier);
                  return (
                    <div key={item.product.id} className="cart-item-row">
                      <img src={item.product.image} alt={item.product.name} className="cart-item-img" />
                      <div className="cart-item-info">
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                          {item.product.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, margin: '2px 0' }}>
                          Rp {unitPrice.toLocaleString('id-ID')}
                          {activeTier !== 'konsumen' && (
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                              Rp {item.product.het.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <div className="cart-stepper">
                            <button
                              type="button"
                              className="btn-stepper"
                              onClick={() => updateCartQty(item.product.id, -1)}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="btn-stepper"
                              onClick={() => updateCartQty(item.product.id, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            style={{ color: '#ef4444', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Hapus item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Box Kemitraan: Klaim Kode Mitra */}
              {verifiedMitra ? (
                <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '12px 14px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={18} color="#059669" />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065f46' }}>
                          Mitra Terverifikasi: {verifiedMitra.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>
                          Level: <b>{SR12_TIERS[verifiedMitra.tier || activeTier]?.name}</b> (Diskon {SR12_TIERS[verifiedMitra.tier || activeTier]?.discountPct}%) • Kode: {verifiedMitra.partnerCode}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetMitra}
                      title="Ganti ke Pelanggan Umum"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={11} />
                      <span>Ganti</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    <UserCheck size={14} color="#059669" />
                    <span>Punya Kode Mitra Resmi SR12? (Reseller / Sub Agen / Agen):</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={mitraQuery}
                      onChange={(e) => setMitraQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyMitra();
                        }
                      }}
                      placeholder="Ketik Kode Mitra Anda (contoh: RS-101)..."
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.78rem',
                        background: '#ffffff'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMitra}
                      disabled={isVerifyingMitra}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isVerifyingMitra ? 'Cek...' : 'Klaim Diskon'}
                    </button>
                  </div>
                  {verifyMsg && (
                    <div style={{ fontSize: '0.72rem', marginTop: '6px', fontWeight: 700, color: verifyMsg.includes('✅') ? '#059669' : '#dc2626' }}>
                      {verifyMsg}
                    </div>
                  )}
                </div>
              )}

              {/* Data Pembeli / Pengiriman */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>
                    Data Pembeli &amp; Pengiriman:
                  </label>
                  <span style={{ fontSize: '0.68rem', color: verifiedMitra ? '#059669' : '#64748b', fontWeight: 600 }}>
                    {verifiedMitra ? '✓ Terisi dari data Mitra' : 'Wajib diisi'}
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                    Nama Lengkap Pemesan *
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap Anda..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      background: '#ffffff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                    Nomor WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      background: '#ffffff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                    Alamat Pengiriman Lengkap {deliveryMethod === 'delivery' ? '*' : '(Opsional)'}
                  </label>
                  <textarea
                    placeholder="Ketik alamat lengkap (Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos)..."
                    rows={3}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      background: '#ffffff',
                      lineHeight: 1.4
                    }}
                  />
                </div>
              </div>

              {/* Pilihan Metode Pengiriman Simpel */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                  <Truck size={15} color="#059669" />
                  <span>Pilihan Pengiriman / Pengambilan:</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: deliveryMethod === 'delivery' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: deliveryMethod === 'delivery' ? '#ecfdf5' : '#ffffff',
                      color: deliveryMethod === 'delivery' ? '#047857' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontWeight: 800 }}>🚚 Kirim ke Alamat</span>
                    <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Ekspedisi / Kurir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: deliveryMethod === 'pickup' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: deliveryMethod === 'pickup' ? '#ecfdf5' : '#ffffff',
                      color: deliveryMethod === 'pickup' ? '#047857' : '#475569',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontWeight: 800 }}>🏪 Ambil di Toko</span>
                    <span style={{ fontSize: '0.66rem', color: '#16a34a', fontWeight: 800 }}>Bebas Ongkir (Rp 0)</span>
                  </button>
                </div>

                {deliveryMethod === 'delivery' ? (
                  <div style={{ fontSize: '0.72rem', color: '#475569', background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px', lineHeight: 1.4 }}>
                    📦 <b>Info Ongkir:</b> Admin Toko kami akan memilihkan kurir pengiriman terbaik &amp; mengonfirmasikan nominal ongkir ke WhatsApp Anda sebelum pesanan dikirim.
                  </div>
                ) : (
                  <div style={{ fontSize: '0.72rem', color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 10px', borderRadius: '6px', lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 800, marginBottom: '2px' }}>🏪 Bebas Biaya Ongkir (Rp 0)</div>
                    <div>Paket diambil langsung oleh Anda di alamat toko/gudang <b>{currentStore.storeName}</b> ({currentStore.originLabel || currentStore.storeCity}).</div>
                  </div>
                )}
              </div>

              {/* Opsi Dropship */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={isDropship}
                    onChange={(e) => setIsDropship(e.target.checked)}
                  />
                  <span>Kirim sebagai Dropshipper (Nama Anda di Resi)</span>
                </label>
                {isDropship && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Nama Pengirim / Toko Anda"
                      value={dropshipSenderName}
                      onChange={(e) => setDropshipSenderName(e.target.value)}
                      style={{ flex: 1, padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', background: '#ffffff' }}
                    />
                    <input
                      type="tel"
                      placeholder="No WhatsApp Pengirim"
                      value={dropshipSenderPhone}
                      onChange={(e) => setDropshipSenderPhone(e.target.value)}
                      style={{ flex: 1, padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', background: '#ffffff' }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal Produk:</span>
                <span>Rp {subtotalHet.toLocaleString('id-ID')}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                  <span>Diskon Mitra ({SR12_TIERS[activeTier].name}):</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Biaya Ongkir:</span>
                {deliveryMethod === 'pickup' ? (
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>Gratis (Rp 0)</span>
                ) : (
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>Dikonfirmasi via WA</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.96rem', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                <span>Total Sementara:</span>
                <span style={{ color: '#065f46' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>

              {deliveryMethod === 'delivery' && (
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                  * Ongkir final &amp; rekening pembayaran resmi akan dikonfirmasi oleh Admin via WhatsApp.
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-checkout-wa"
              onClick={handleCheckoutWhatsApp}
              disabled={isSubmitting}
            >
              <MessageCircle size={20} />
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Pesan Sekarang via WhatsApp'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
