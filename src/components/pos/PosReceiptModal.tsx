import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, MessageCircle } from 'lucide-react';

interface PosReceiptModalProps {
  trx: any;
  onClose: () => void;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({ trx, onClose }) => {
  const { currentStore } = useApp();

  if (!trx) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    const waText = `*STRUK PEMBAYARAN - ${currentStore.storeName.toUpperCase()}* 🧾
No. Trx: *#${trx.id}*
Waktu: ${new Date(trx.date).toLocaleString('id-ID')}
Kasir: ${trx.cashier || 'Kasir'}

---------------------------------------
${(trx.items || []).map((it: any) => `${it.name}\n${it.qty} x Rp ${it.price.toLocaleString('id-ID')} = Rp ${it.subtotal.toLocaleString('id-ID')}`).join('\n')}
---------------------------------------
Subtotal: Rp ${trx.subtotal.toLocaleString('id-ID')}
${trx.discount > 0 ? `Diskon: -Rp ${trx.discount.toLocaleString('id-ID')}\n` : ''}*TOTAL BAYAR: Rp ${trx.grandTotal.toLocaleString('id-ID')}*
Bayar Tunai: Rp ${(trx.cashReceived || trx.grandTotal).toLocaleString('id-ID')}
Kembalian: Rp ${(trx.change || 0).toLocaleString('id-ID')}

Terima kasih telah berbelanja di ${currentStore.storeName}! 🙏`;

    const cleanPhone = (trx.customerPhone || currentStore.storeWaNumber).replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', background: '#f8fafc' }}
      >
        <div style={{ background: '#0f172a', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Struk Pembayaran Kasir</h3>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div
          id="thermalReceiptArea"
          style={{
            padding: '20px',
            background: '#ffffff',
            margin: '16px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            color: '#0f172a'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>{currentStore.storeName}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{currentStore.storeCity} &bull; WA: {currentStore.storeWaNumber}</div>
            <div style={{ margin: '6px 0', borderBottom: '1px dashed #94a3b8' }} />
          </div>

          <div style={{ fontSize: '0.74rem', marginBottom: '8px' }}>
            <div>No. Trx: #{trx.id}</div>
            <div>Waktu: {new Date(trx.date).toLocaleString('id-ID')}</div>
            <div>Pelanggan: {trx.customerName || 'Umum'} ({trx.buyerTier || 'Konsumen'})</div>
            <div>Kasir: {trx.cashier || 'Kasir Gudang'}</div>
            <div style={{ margin: '6px 0', borderBottom: '1px dashed #94a3b8' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            {(trx.items || []).map((it: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.name} x{it.qty}
                </span>
                <span>Rp {it.subtotal.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.9rem' }}>
              <span>TOTAL:</span>
              <span>Rp {trx.grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Tunai:</span>
              <span>Rp {(trx.cashReceived || trx.grandTotal).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Kembali:</span>
              <span>Rp {(trx.change || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.7rem', color: '#64748b' }}>
            *** Terima Kasih Telah Berbelanja ***
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px' }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              flex: 1,
              background: '#0f172a',
              color: '#ffffff',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Printer size={15} />
            <span>Cetak Struk Thermal</span>
          </button>
          <button
            type="button"
            onClick={handleSendWA}
            style={{
              flex: 1,
              background: '#059669',
              color: '#ffffff',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <MessageCircle size={15} />
            <span>Kirim Nota via WA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
