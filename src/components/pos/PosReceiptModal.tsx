import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SafeModalOverlay } from '../common/SafeModalOverlay';
import { X, Printer, MessageCircle, FileText } from 'lucide-react';
import { printReceiptDirect, ThermalPaperWidth, formatRupiah } from '../../utils/receiptPrinter';

interface PosReceiptModalProps {
  trx: any;
  onClose: () => void;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({ trx, onClose }) => {
  const { currentStore } = useApp();
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>('58mm');
  const [isPrinting, setIsPrinting] = useState(false);

  if (!trx) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    await printReceiptDirect(trx, currentStore, paperWidth);
    setTimeout(() => setIsPrinting(false), 800);
  };

  const handleSendWA = () => {
    const trxId = trx.id || trx.orderId || '-';
    const trxDate = trx.date ? new Date(trx.date).toLocaleString('id-ID') : '-';
    const storeName = currentStore.storeName || 'SR12 HERBAL SKINCARE';
    const items = (trx.items || []).map((it: any) => {
      const name = it.name || 'Produk';
      const qty = it.qty || it.quantity || 1;
      const price = it.price || 0;
      const subtotal = it.subtotal || (price * qty);
      return `• ${name}\n   ${qty} x Rp ${formatRupiah(price)} = Rp ${formatRupiah(subtotal)}`;
    }).join('\n');

    const subtotal = trx.subtotal || trx.grandTotal || 0;
    const discount = trx.discount || 0;
    const shipping = trx.shippingCost || 0;
    const grandTotal = trx.grandTotal || 0;
    const cash = trx.cashReceived || grandTotal;
    const change = trx.change || (cash > grandTotal ? cash - grandTotal : 0);

    const waText = `🧾 *STRUK PEMBAYARAN - ${storeName.toUpperCase()}*
No. Trx: *#${trxId}*
Waktu: ${trxDate}
Kasir: ${trx.cashier || 'Kasir'}
Pelanggan: ${trx.customerName || 'Umum'} (${trx.buyerTier || 'Konsumen'})

-----------------------------------------
${items}
-----------------------------------------
Subtotal: Rp ${formatRupiah(subtotal)}
${discount > 0 ? `Diskon: -Rp ${formatRupiah(discount)}\n` : ''}${shipping > 0 ? `Ongkir: +Rp ${formatRupiah(shipping)}\n` : ''}*TOTAL BAYAR: Rp ${formatRupiah(grandTotal)}*
Bayar (${trx.paymentMethod || 'Tunai'}): Rp ${formatRupiah(cash)}
Kembalian: Rp ${formatRupiah(change)}

Terima kasih telah berbelanja di *${storeName}*! 🙏
_Barang yang sudah dibeli tidak dapat ditukar/dikembalikan._`;

    const rawPhone = trx.customerPhone || currentStore.storeWaNumber || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const targetUrl = cleanPhone.length > 5
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(waText)}`
      : `https://wa.me/?text=${encodeURIComponent(waText)}`;

    window.open(targetUrl, '_blank');
  };

  const trxId = trx.id || trx.orderId || '-';
  const trxDate = trx.date ? new Date(trx.date).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '-';

  const subtotal = trx.subtotal || trx.grandTotal || 0;
  const discount = trx.discount || 0;
  const shipping = trx.shippingCost || 0;
  const grandTotal = trx.grandTotal || 0;
  const cash = trx.cashReceived || grandTotal;
  const change = trx.change || (cash > grandTotal ? cash - grandTotal : 0);

  return (
    <SafeModalOverlay onClose={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '95%',
          background: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #334155',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Header Modal */}
        <div style={{
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
              Struk Pembayaran Kasir
            </h3>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Paper Size Option */}
        <div style={{
          padding: '10px 18px',
          background: '#131f37',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>
            Ukuran Kertas Printer:
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: paperWidth === '58mm' ? '#0284c7' : '#334155',
                background: paperWidth === '58mm' ? 'rgba(2, 132, 199, 0.25)' : '#1e293b',
                color: paperWidth === '58mm' ? '#38bdf8' : '#94a3b8'
              }}
            >
              58 mm (Mini / Bluetooth)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: paperWidth === '80mm' ? '#0284c7' : '#334155',
                background: paperWidth === '80mm' ? 'rgba(2, 132, 199, 0.25)' : '#1e293b',
                color: paperWidth === '80mm' ? '#38bdf8' : '#94a3b8'
              }}
            >
              80 mm (Standar)
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          background: '#090d16',
          flex: 1
        }}>
          {/* Authentic Paper Visual */}
          <div
            id="thermalReceiptArea"
            style={{
              maxWidth: paperWidth === '58mm' ? '280px' : '340px',
              margin: '0 auto',
              background: '#ffffff',
              color: '#000000',
              padding: '16px 14px',
              fontFamily: "'Courier New', Courier, 'Lucida Console', monospace",
              fontSize: '11px',
              lineHeight: 1.3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              borderRadius: '2px',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Store Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {currentStore.storeName || 'SR12 HERBAL SKINCARE'}
              </div>
              <div style={{ fontSize: '10px', marginTop: '2px' }}>
                {currentStore.storeCity} &bull; WA: {currentStore.storeWaNumber}
              </div>
              <div style={{ margin: '6px 0', borderBottom: '1px dashed #000' }} />
            </div>

            {/* Trx Meta */}
            <div style={{ fontSize: '10px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No. Trx:</span>
                <span style={{ fontWeight: 700 }}>#{trxId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Waktu:</span>
                <span>{trxDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kasir:</span>
                <span>{trx.cashier || 'Kasir'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pelanggan:</span>
                <span>{trx.customerName || 'Umum'} ({trx.buyerTier || 'Konsumen'})</span>
              </div>
              {trx.marketerId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Afiliasi:</span>
                  <span>{trx.marketerId}</span>
                </div>
              )}
              <div style={{ margin: '6px 0', borderBottom: '1px dashed #000' }} />
            </div>

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '6px' }}>
              {(trx.items || []).map((it: any, idx: number) => {
                const name = it.name || 'Produk';
                const qty = it.qty || it.quantity || 1;
                const price = it.price || 0;
                const lineTotal = it.subtotal || (price * qty);
                return (
                  <div key={idx} style={{ pageBreakInside: 'avoid' }}>
                    <div style={{ fontWeight: 700, wordBreak: 'break-word', lineHeight: 1.2 }}>
                      {name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                      <span>{qty} x Rp {formatRupiah(price)}</span>
                      <span style={{ fontWeight: 700 }}>Rp {formatRupiah(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>Rp {formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Diskon</span>
                  <span>-Rp {formatRupiah(discount)}</span>
                </div>
              )}
              {shipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ongkos Kirim</span>
                  <span>+Rp {formatRupiah(shipping)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 900,
                fontSize: '13px',
                borderTop: '1px dashed #000',
                borderBottom: '1px dashed #000',
                padding: '4px 0',
                margin: '4px 0'
              }}>
                <span>TOTAL</span>
                <span>Rp {formatRupiah(grandTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span>Bayar ({trx.paymentMethod || 'Tunai'})</span>
                <span>Rp {formatRupiah(cash)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span>Kembalian</span>
                <span>Rp {formatRupiah(change)}</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700 }}>*** TERIMA KASIH ***</div>
              <div>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
              <div>Simpan struk ini sebagai bukti pembayaran</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '14px 18px',
          background: '#1e293b',
          borderTop: '1px solid #334155'
        }}>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              padding: '11px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              border: 'none',
              cursor: isPrinting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Printer size={16} />
            <span>{isPrinting ? 'Menyiapkan Cetak...' : `Cetak Struk (${paperWidth})`}</span>
          </button>
          <button
            type="button"
            onClick={handleSendWA}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              padding: '11px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
            }}
          >
            <MessageCircle size={16} />
            <span>Kirim Nota via WA</span>
          </button>
        </div>
      </div>
    </SafeModalOverlay>
  );
};
