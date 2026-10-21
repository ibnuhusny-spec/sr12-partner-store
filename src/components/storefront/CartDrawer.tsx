import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SR12_SHIPPING_PROVIDERS, getProductTierPrice, SR12_TIERS } from '../../config/tiers';
import { verifyMitraDiscount } from '../../services/mitraService';
import { createOrder, formatWhatsAppOrderMessage } from '../../services/orderService';
import { Order, OrderItemPayload } from '../../types';
import confetti from 'canvas-confetti';
import { X, Trash2, ShoppingBag, Truck, Check, MessageCircle, UserCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
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
  const [selectedCourierId, setSelectedCourierId] = useState('jne');
  const [mitraQuery, setMitraQuery] = useState('');
  const [isVerifyingMitra, setIsVerifyingMitra] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [isDropship, setIsDropship] = useState(false);
  const [dropshipSenderName, setDropshipSenderName] = useState('');
  const [dropshipSenderPhone, setDropshipSenderPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedCourier = SR12_SHIPPING_PROVIDERS.find(c => c.id === selectedCourierId) || SR12_SHIPPING_PROVIDERS[0];
  const shippingCost = selectedCourier.costPerKg;

  // Calculate weights & prices
  const totalWeightGram = cart.reduce((sum, item) => sum + (item.product.weightGram * item.quantity), 0);
  const totalWeightKg = Math.max(1, Math.ceil(totalWeightGram / 1000));
  const finalShippingCost = selectedCourier.type === 'pickup' ? 0 : shippingCost * totalWeightKg;

  const subtotalHet = cart.reduce((sum, item) => sum + (item.product.het * item.quantity), 0);
  const totalProductsPrice = cart.reduce((sum, item) => {
    const price = getProductTierPrice(item.product.het, activeTier);
    return sum + (price * item.quantity);
  }, 0);

  const discountAmount = Math.max(0, subtotalHet - totalProductsPrice);

  // Dynamic Platform Fee (Developer Monetization)
  const platformFee = (() => {
    try {
      const payerMode = localStorage.getItem('sr12_fee_payer_mode') || 'buyer';
      if (payerMode === 'buyer') {
        const val = localStorage.getItem('sr12_platform_fee_nominal');
        return val ? Number(val) : 1500;
      }
      return 0;
    } catch {
      return 1500;
    }
  })();

  const grandTotal = totalProductsPrice + finalShippingCost + platformFee;

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
        setVerifyMsg(`✅ Terverifikasi: ${res.mitra.name} (${res.mitra.tier?.toUpperCase()})`);
      } else {
        setVerifyMsg('❌ Kode Mitra / Nomor HP tidak ditemukan.');
      }
    } catch {
      setVerifyMsg('❌ Gagal memeriksa database mitra.');
    } finally {
      setIsVerifyingMitra(false);
    }
  };

  const handleCheckoutWhatsApp = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Mohon isi Nama Pemesan dan Nomor WhatsApp terlebih dahulu!');
      return;
    }

    if (cart.length === 0) {
      alert('Keranjang belanja Anda masih kosong.');
      return;
    }

    setIsSubmitting(true);

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const orderItems: OrderItemPayload[] = cart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: getProductTierPrice(item.product.het, activeTier),
      quantity: item.quantity,
      subtotal: getProductTierPrice(item.product.het, activeTier) * item.quantity,
      het: item.product.het,
      weightGram: item.product.weightGram
    }));

    const orderData: Order = {
      orderId,
      storeSlug: currentStore.slug,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || 'Alamat dikonfirmasi via WA',
      tier: activeTier,
      tierLabel: SR12_TIERS[activeTier].name,
      items: orderItems,
      subtotalHet,
      discountAmount,
      grandTotal,
      paymentMethod: selectedCourier.type === 'cod' ? 'COD (Bayar Tunai di Tempat)' : 'Transfer Bank / Ekspedisi',
      status: 'Menunggu Konfirmasi',
      orderSource: 'Online Web Store',
      marketerId: marketerReferral || undefined,
      courierName: selectedCourier.name,
      shippingCost: finalShippingCost,
      platformFee,
      dropship: isDropship ? {
        isDropship: true,
        senderName: dropshipSenderName,
        senderPhone: dropshipSenderPhone
      } : undefined
    };

    try {
      // 1. Simpan order ke cloud Supabase
      await createOrder(orderData, currentStore.slug);

      // 2. Format pesan WhatsApp
      const waMsg = formatWhatsAppOrderMessage(orderData, currentStore);
      const waUrl = `https://wa.me/${currentStore.storeWaNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`;

      // 3. Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // 4. Buka WhatsApp
      window.open(waUrl, '_blank');

      // 5. Bersihkan keranjang
      clearCart();
      onClose();
    } catch (e) {
      alert('Gagal memproses pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="#34d399" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Keranjang Belanja ({cart.length})</h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="cart-drawer-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700 }}>Keranjang Anda masih kosong</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Silakan pilih produk herbal favorit Anda di etalase</p>
            </div>
          ) : (
            <>
              {/* Items List */}
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
                          style={{ color: '#ef4444', padding: '4px' }}
                          title="Hapus item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Box Kemitraan (Cek Diskon Reseller / Agen) */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  <UserCheck size={14} color="#059669" />
                  <span>Klaim Diskon Mitra Resmi (Reseller / Agen):</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={mitraQuery}
                    onChange={(e) => setMitraQuery(e.target.value)}
                    placeholder="Masukkan Kode Mitra / No. WhatsApp..."
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.76rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyMitra}
                    disabled={isVerifyingMitra}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}
                  >
                    {isVerifyingMitra ? 'Cek...' : 'Klaim'}
                  </button>
                </div>
                {verifyMsg && (
                  <div style={{ fontSize: '0.72rem', marginTop: '6px', fontWeight: 700, color: verifyMsg.includes('✅') ? '#059669' : '#dc2626' }}>
                    {verifyMsg}
                  </div>
                )}
              </div>

              {/* Kurir Pengiriman */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <Truck size={14} color="#059669" />
                  <span>Pilih Kurir / Pengambilan:</span>
                </label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.8rem',
                    background: '#ffffff'
                  }}
                >
                  {SR12_SHIPPING_PROVIDERS.map(sp => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} {sp.type !== 'pickup' ? `(Rp ${(sp.costPerKg * totalWeightKg).toLocaleString('id-ID')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Data Pemesan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569' }}>
                  Data Pembeli:
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Pemesan *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  placeholder="Nomor WhatsApp (contoh: 081234567890) *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
                <textarea
                  placeholder="Alamat Pengiriman Lengkap (Kecamatan, Kota, Kode Pos)..."
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
              </div>

              {/* Opsi Dropship */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
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
                      placeholder="Nama Pengirim"
                      value={dropshipSenderName}
                      onChange={(e) => setDropshipSenderName(e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                    />
                    <input
                      type="text"
                      placeholder="No HP Pengirim"
                      value={dropshipSenderPhone}
                      onChange={(e) => setDropshipSenderPhone(e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal Produk:</span>
                <span>Rp {subtotalHet.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                  <span>Diskon Kemitraan ({SR12_TIERS[activeTier].name}):</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Ongkir ({selectedCourier.name}):</span>
                <span>{finalShippingCost === 0 ? 'Gratis (Rp 0)' : `Rp ${finalShippingCost.toLocaleString('id-ID')}`}</span>
              </div>
              {platformFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontWeight: 600 }}>
                  <span>Biaya Layanan Aplikasi:</span>
                  <span>Rp {platformFee.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                <span>Total Bayar:</span>
                <span style={{ color: '#065f46' }}>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
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
