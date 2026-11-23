import { Order } from '../types';

export type ThermalPaperWidth = '58mm' | '80mm';

export function formatRupiah(num: number): string {
  return (num || 0).toLocaleString('id-ID');
}

/**
 * Mengonversi Order riwayat transaksi ke bentuk payload struk yang seragam.
 */
export function orderToReceiptTrx(order: Order, fallbackCashier = 'Kasir Gudang'): any {
  const items = (order.items || []).map((it: any) => ({
    id: it.id || '',
    name: it.name || 'Produk SR12',
    price: it.price || it.het || 0,
    qty: it.quantity || it.qty || 1,
    subtotal: it.subtotal || ((it.price || it.het || 0) * (it.quantity || it.qty || 1))
  }));

  const subtotal = order.subtotalHet || items.reduce((sum: number, it: any) => sum + it.subtotal, 0);
  const discount = order.discountAmount || 0;
  const grandTotal = order.grandTotal || (subtotal - discount + (order.shippingCost || 0));

  let cashierName = fallbackCashier;
  if (order.paymentMethod?.toLowerCase().includes('kasir:')) {
    cashierName = order.paymentMethod.replace(/.*kasir:\s*/i, '').trim();
  }

  return {
    id: order.orderId,
    date: order.createdAt || order.orderDate || new Date().toISOString(),
    storeSlug: order.storeSlug,
    cashier: cashierName,
    customerName: order.customerName || 'Konsumen Umum',
    customerPhone: order.customerPhone || '-',
    buyerTier: order.tierLabel || 'Konsumen',
    items,
    subtotal,
    discount,
    shippingCost: order.shippingCost || 0,
    grandTotal,
    paymentMethod: order.paymentMethod || 'Tunai (Kasir)',
    cashReceived: (order as any).cashReceived || grandTotal,
    change: (order as any).change || 0,
    marketerId: order.marketerId
  };
}

/**
 * Menghasilkan HTML murni dokumen thermal receipt beresolusi tinggi,
 * kontras hitam pekat (100% black) tanpa margin browser agar cetak struk sangat jelas dan rapi.
 */
export function generateReceiptHtml(trx: any, store: any, paperWidth: ThermalPaperWidth = '58mm'): string {
  const is58 = paperWidth === '58mm';
  const printableWidth = is58 ? '48mm' : '72mm';
  const fontSize = is58 ? '11px' : '12px';
  const headerFontSize = is58 ? '14px' : '16px';
  const totalFontSize = is58 ? '13px' : '15px';

  const storeName = store?.storeName || 'SR12 HERBAL SKINCARE';
  const storeCity = store?.storeCity || 'Indonesia';
  const storePhone = store?.storeWaNumber || '-';
  const trxId = trx?.id || '-';
  const trxDate = trx?.date ? new Date(trx.date).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '-';

  const customerName = trx?.customerName || 'Konsumen';
  const buyerTier = trx?.buyerTier || 'Konsumen';
  const cashier = trx?.cashier || 'Kasir';

  const items = (trx?.items || []).map((it: any) => {
    const name = it.name || 'Produk';
    const qty = it.qty || it.quantity || 1;
    const price = it.price || 0;
    const subtotal = it.subtotal || (price * qty);
    return `
      <div class="item-block">
        <div class="item-name">${escapeHtml(name)}</div>
        <div class="item-calc">
          <span>${qty} x Rp ${formatRupiah(price)}</span>
          <span class="item-subtotal">Rp ${formatRupiah(subtotal)}</span>
        </div>
      </div>
    `;
  }).join('');

  const subtotal = trx?.subtotal || trx?.grandTotal || 0;
  const discount = trx?.discount || 0;
  const shipping = trx?.shippingCost || 0;
  const grandTotal = trx?.grandTotal || 0;
  const cashReceived = trx?.cashReceived || grandTotal;
  const change = trx?.change || (cashReceived > grandTotal ? cashReceived - grandTotal : 0);
  const paymentMethod = trx?.paymentMethod || 'Tunai';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Struk #${escapeHtml(trxId)}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: ${paperWidth};
      background: #ffffff;
      color: #000000;
      font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
      font-size: ${fontSize};
      line-height: 1.3;
    }
    .receipt-container {
      width: ${printableWidth};
      margin: 0 auto;
      padding: 3mm 1mm 8mm 1mm;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .text-left {
      text-align: left;
    }
    .bold {
      font-weight: 700;
    }
    .store-title {
      font-size: ${headerFontSize};
      font-weight: 900;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .store-sub {
      font-size: 10px;
      margin-bottom: 4px;
    }
    .divider {
      border-top: 1px dashed #000000;
      margin: 5px 0;
    }
    .meta-table {
      width: 100%;
      font-size: 10px;
      margin-bottom: 2px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }
    .item-block {
      margin-bottom: 4px;
      page-break-inside: avoid;
    }
    .item-name {
      font-weight: 700;
      word-wrap: break-word;
      word-break: break-word;
      line-height: 1.2;
    }
    .item-calc {
      display: flex;
      justify-content: space-between;
      font-size: ${fontSize};
      padding-left: 8px;
    }
    .totals-block {
      margin-top: 4px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .grand-total {
      font-size: ${totalFontSize};
      font-weight: 900;
      border-top: 1px dashed #000000;
      border-bottom: 1px dashed #000000;
      padding: 4px 0;
      margin: 4px 0;
    }
    .footer-note {
      text-align: center;
      margin-top: 8px;
      font-size: 10px;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="text-center">
      <div class="store-title">${escapeHtml(storeName)}</div>
      <div class="store-sub">${escapeHtml(storeCity)} &bull; WA: ${escapeHtml(storePhone)}</div>
    </div>

    <div class="divider"></div>

    <div class="meta-table">
      <div class="meta-row"><span>No. Trx</span><span class="bold">#${escapeHtml(trxId)}</span></div>
      <div class="meta-row"><span>Waktu</span><span>${escapeHtml(trxDate)}</span></div>
      <div class="meta-row"><span>Kasir</span><span>${escapeHtml(cashier)}</span></div>
      <div class="meta-row"><span>Pelanggan</span><span>${escapeHtml(customerName)} (${escapeHtml(buyerTier)})</span></div>
      ${trx?.marketerId ? `<div class="meta-row"><span>Afiliasi</span><span>${escapeHtml(trx.marketerId)}</span></div>` : ''}
    </div>

    <div class="divider"></div>

    <div class="items-list">
      ${items}
    </div>

    <div class="divider"></div>

    <div class="totals-block">
      <div class="total-row">
        <span>Subtotal</span>
        <span>Rp ${formatRupiah(subtotal)}</span>
      </div>
      ${discount > 0 ? `
      <div class="total-row">
        <span>Diskon</span>
        <span>-Rp ${formatRupiah(discount)}</span>
      </div>` : ''}
      ${shipping > 0 ? `
      <div class="total-row">
        <span>Ongkos Kirim</span>
        <span>+Rp ${formatRupiah(shipping)}</span>
      </div>` : ''}
      <div class="total-row grand-total">
        <span>TOTAL</span>
        <span>Rp ${formatRupiah(grandTotal)}</span>
      </div>
      <div class="total-row">
        <span>Bayar (${escapeHtml(paymentMethod)})</span>
        <span>Rp ${formatRupiah(cashReceived)}</span>
      </div>
      <div class="total-row">
        <span>Kembalian</span>
        <span>Rp ${formatRupiah(change)}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="footer-note">
      <div class="bold">*** TERIMA KASIH ***</div>
      <div>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
      <div>Simpan struk ini sebagai bukti pembayaran</div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Mencetak struk secara langsung melalui iframe terisolasi
 * Bebas dari interferensi CSS aplikasi/dark mode/modal backdrop.
 */
export function printReceiptDirect(trx: any, store: any, paperWidth: ThermalPaperWidth = '58mm'): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const html = generateReceiptHtml(trx, store, paperWidth);

      // Cari atau buat iframe khusus pencetakan struk
      let printFrame = document.getElementById('sr12-thermal-print-frame') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'sr12-thermal-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        printFrame.style.width = '0px';
        printFrame.style.height = '0px';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) {
        // Fallback jika iframe tidak dapat diakses
        window.print();
        resolve(true);
        return;
      }

      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      // Beri sedikit jeda agar font & stylesheet termuat sempurna sebelum dialog print muncul
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          resolve(true);
        } catch {
          window.print();
          resolve(true);
        }
      }, 350);
    } catch (e) {
      console.warn('Gagal memicu iframe print, menggunakan fallback browser print:', e);
      window.print();
      resolve(false);
    }
  });
}
