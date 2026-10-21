import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TOKEN_PACKAGES,
  TokenPackage,
  redeemTokenVoucher,
  updateStoreFeePayer,
  topupStoreQuota
} from '../../services/storeService';
import { Coins, X, Check, MessageCircle, Gift, Sparkles, ShieldCheck, Settings, AlertTriangle } from 'lucide-react';

interface TokenTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuotaUpdated?: () => void;
}

export const TokenTopupModal: React.FC<TokenTopupModalProps> = ({
  isOpen,
  onClose,
  onQuotaUpdated
}) => {
  const { currentStore, refreshStores } = useApp();
  const [selectedPkg, setSelectedPkg] = useState<TokenPackage>(TOKEN_PACKAGES[1]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);

  // Fee payer setting state
  const [feePayerChoice, setFeePayerChoice] = useState<'buyer' | 'store'>(currentStore.feePayer || 'buyer');
  const [feeSaveNotice, setFeeSaveNotice] = useState(false);

  if (!isOpen) return null;

  const handleOrderWhatsApp = () => {
    const devWa = '6281200001212'; // Nomor WhatsApp Admin / Developer
    const text = `Halo Developer SR12 Ecosystem 🌿\n\n` +
      `Saya pemilik toko: *${currentStore.storeName}*\n` +
      `Slug Toko: *${currentStore.slug}*\n` +
      `Nomor Kontak: ${currentStore.storeWaNumber}\n\n` +
      `Saya ingin melakukan *TOP UP TOKEN TRANSAKSI*:\n` +
      `📦 Paket: *${selectedPkg.name}* (${selectedPkg.tokens} Token Transaksi)\n` +
      `💰 Total Transfer: *Rp ${selectedPkg.price.toLocaleString('id-ID')}*\n\n` +
      `Mohon info rekening pembayaran untuk pengisian kuota token transaksi toko saya. Terima kasih! 🙏`;

    window.open(`https://wa.me/${devWa}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleClaimVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    setIsSubmittingVoucher(true);
    setVoucherMsg(null);

    const res = await redeemTokenVoucher(currentStore.slug, voucherCode);
    if (res.success) {
      setVoucherMsg({ text: res.message, isError: false });
      setVoucherCode('');
      await refreshStores();
      if (onQuotaUpdated) onQuotaUpdated();
    } else {
      setVoucherMsg({ text: res.message, isError: true });
    }
    setIsSubmittingVoucher(false);
  };

  const handleSaveFeePayer = async () => {
    await updateStoreFeePayer(currentStore.slug, feePayerChoice);
    currentStore.feePayer = feePayerChoice;
    setFeeSaveNotice(true);
    await refreshStores();
    setTimeout(() => setFeeSaveNotice(false), 2500);
  };

  const isLowQuota = (currentStore.orderQuota || 0) <= 5;
  const isOutOfQuota = (currentStore.orderQuota || 0) <= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          border: '1.5px solid #334155',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ background: '#1e293b', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={20} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Token Transaksi &amp; Biaya Admin Toko</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                {currentStore.storeName} &bull; Olsera POS &amp; Web Store
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Current Quota Status Banner */}
          <div
            style={{
              background: isOutOfQuota
                ? 'rgba(239, 68, 68, 0.14)'
                : isLowQuota
                ? 'rgba(245, 158, 11, 0.14)'
                : 'rgba(16, 185, 129, 0.14)',
              border: `1.5px solid ${isOutOfQuota ? '#ef4444' : isLowQuota ? '#f59e0b' : '#10b981'}`,
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: isOutOfQuota ? '#f87171' : isLowQuota ? '#fbbf24' : '#34d399', textTransform: 'uppercase' }}>
                {isOutOfQuota ? '⚠️ Token Habis - Transaksi Terkunci' : isLowQuota ? '⚠️ Kuota Token Menipis' : '✓ Kuota Transaksi Aktif'}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>
                {currentStore.orderQuota || 0} <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#94a3b8' }}>Token Tersedia</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                1 Token digunakan untuk 1 transaksi sukses (Kasir POS / Pesanan Web)
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tarif Dev / Trx</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>Rp 1.500,-</div>
            </div>
          </div>

          {/* Section: Pengaturan Biaya Admin oleh Pemilik Toko */}
          <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings size={15} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Kebijakan Biaya Admin Toko Anda</h4>
              </div>
              {feeSaveNotice && (
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800 }}>
                  ✓ Pengaturan Tersimpan!
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 10px' }}>
              Pilih apakah biaya administrasi Rp 1.500,- dibebankan ke pembeli saat checkout web atau disubsidi oleh toko:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: feePayerChoice === 'buyer' ? 'rgba(2,132,199,0.15)' : '#0f172a',
                  border: `1.5px solid ${feePayerChoice === 'buyer' ? '#0284c7' : '#334155'}`,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="feePayer"
                  checked={feePayerChoice === 'buyer'}
                  onChange={() => setFeePayerChoice('buyer')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                    Dibebankan ke Pembeli (Direkomendasikan)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Biaya Layanan Aplikasi Rp 1.500 otomatis ditambahkan ke total belanja pembeli saat checkout.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: feePayerChoice === 'store' ? 'rgba(2,132,199,0.15)' : '#0f172a',
                  border: `1.5px solid ${feePayerChoice === 'store' ? '#0284c7' : '#334155'}`,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="feePayer"
                  checked={feePayerChoice === 'store'}
                  onChange={() => setFeePayerChoice('store')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                    Ditanggung Toko Sendiri (Gratis Admin untuk Pembeli)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Pembeli tidak dikenakan biaya tambahan (Rp 0), biaya token transaksi ditanggung dari margin toko.
                  </div>
                </div>
              </label>

              <button
                type="button"
                onClick={handleSaveFeePayer}
                style={{
                  alignSelf: 'flex-end',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  marginTop: '4px',
                  cursor: 'pointer'
                }}
              >
                Simpan Kebijakan Toko
              </button>
            </div>
          </div>

          {/* Section: Beli Paket Token */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Coins size={16} color="#f59e0b" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Pilih Paket Top-Up Token Transaksi</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {TOKEN_PACKAGES.map(pkg => {
                const isSelected = selectedPkg.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    style={{
                      background: isSelected ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                      border: `2px solid ${isSelected ? '#38bdf8' : '#334155'}`,
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {pkg.tag && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          fontSize: '0.64rem',
                          fontWeight: 900,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: pkg.popular ? '#f59e0b' : '#0284c7',
                          color: '#fff'
                        }}
                      >
                        {pkg.tag}
                      </span>
                    )}

                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc' }}>
                      {pkg.name}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', margin: '4px 0' }}>
                      {pkg.tokens} <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Token</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>
                      Rp {pkg.price.toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                      (Rp {(pkg.price / pkg.tokens).toLocaleString('id-ID')} / transaksi)
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleOrderWhatsApp}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
              }}
            >
              <MessageCircle size={18} />
              <span>Beli {selectedPkg.tokens} Token via WhatsApp Developer (Rp {selectedPkg.price.toLocaleString('id-ID')})</span>
            </button>
          </div>

          {/* Section: Klaim Kode Voucher Token */}
          <div style={{ background: '#1e293b', padding: '14px 16px', borderRadius: '12px', border: '1px dashed #475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Gift size={15} color="#ec4899" />
              <h5 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                Punya Kode Voucher Token dari Developer?
              </h5>
            </div>

            <form onSubmit={handleClaimVoucher} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Contoh: SR12-BONUS / TOKEN-100"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  fontWeight: 800
                }}
              />
              <button
                type="submit"
                disabled={isSubmittingVoucher}
                style={{
                  background: '#ec4899',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {isSubmittingVoucher ? 'Memproses...' : 'Klaim Token'}
              </button>
            </form>

            {voucherMsg && (
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  marginTop: '8px',
                  color: voucherMsg.isError ? '#f87171' : '#34d399'
                }}
              >
                {voucherMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
