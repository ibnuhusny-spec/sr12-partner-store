import { supabase, getActiveSessionToken } from '../config/supabase';
import { Order, Store } from '../types';

export async function createOrder(order: Order, storeSlug: string): Promise<{ success: boolean; message: string; remainingQuota?: number }> {
  const enriched: Order = {
    ...order,
    storeSlug: storeSlug || order.storeSlug || 'sr12-central'
  };
  saveLocalOrder(enriched);
  return { success: true, message: 'Pesanan berhasil dibuat.' };
}

function saveLocalOrder(order: Order) {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    const list: Order[] = raw ? JSON.parse(raw) : [];
    // Hindari duplikasi jika orderId sudah ada
    const existingIdx = list.findIndex(o => o.orderId === order.orderId);
    if (existingIdx >= 0) {
      list[existingIdx] = order;
    } else {
      list.unshift(order);
    }
    localStorage.setItem('sr12_customer_orders', JSON.stringify(list));
  } catch (e) {}
}

export function getLocalOrders(storeSlug?: string): Order[] {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    const list: Order[] = raw ? JSON.parse(raw) : [];
    if (!storeSlug || storeSlug === 'all') return list;
    return list.filter(o => !o.storeSlug || o.storeSlug === storeSlug || o.storeSlug === 'all');
  } catch {
    return [];
  }
}

export async function fetchStoreOrders(storeSlug: string): Promise<Order[]> {
  // Kembalikan data pesanan secara instan 0ms (tanpa jeda RPC lambat)
  return getLocalOrders(storeSlug);
}

export async function updateOrderStatus(orderId: string, newStatus: string, storeSlug: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    if (raw) {
      const list: Order[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.orderId === orderId || o.id === orderId);
      if (idx >= 0) {
        list[idx].status = newStatus;
        localStorage.setItem('sr12_customer_orders', JSON.stringify(list));
      }
    }
  } catch (e) {}

  return true;
}

export function deleteOrder(orderId: string, storeSlug?: string): Order[] {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    if (raw) {
      const list: Order[] = JSON.parse(raw);
      const filtered = list.filter(o => o.orderId !== orderId && o.id !== orderId);
      localStorage.setItem('sr12_customer_orders', JSON.stringify(filtered));
      if (!storeSlug || storeSlug === 'all') return filtered;
      return filtered.filter(o => !o.storeSlug || o.storeSlug === storeSlug || o.storeSlug === 'all');
    }
  } catch (e) {}
  return [];
}

export function clearAllOrders(storeSlug?: string): void {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    if (!raw) {
      localStorage.setItem('sr12_customer_orders', JSON.stringify([]));
      return;
    }
    const list: Order[] = JSON.parse(raw);
    if (!storeSlug || storeSlug === 'all') {
      localStorage.setItem('sr12_customer_orders', JSON.stringify([]));
    } else {
      // Hapus seluruh order milik toko ini atau yang berstatus global/all
      const remaining = list.filter(o => o.storeSlug && o.storeSlug !== storeSlug && o.storeSlug !== 'all');
      localStorage.setItem('sr12_customer_orders', JSON.stringify(remaining));
    }
  } catch (e) {
    localStorage.setItem('sr12_customer_orders', JSON.stringify([]));
  }
}

/**
 * Format pesan WhatsApp resmi untuk pemesanan toko
 */
export function formatWhatsAppOrderMessage(order: Order, store: Store): string {
  const itemsText = order.items.map((it, idx) => 
    `${idx + 1}. *${it.name}*\n   ${it.quantity} pcs x Rp ${it.price.toLocaleString('id-ID')} = Rp ${it.subtotal.toLocaleString('id-ID')}`
  ).join('\n');

  const discountText = order.discountAmount > 0 
    ? `\n🎁 Diskon Kemitraan (${order.tierLabel}): -Rp ${order.discountAmount.toLocaleString('id-ID')}`
    : '';

  const shippingText = order.shippingCost && order.shippingCost > 0
    ? `\n🚚 Ongkir (${order.courierName || 'Ekspedisi'}): Rp ${order.shippingCost.toLocaleString('id-ID')}`
    : `\n🚚 Pengiriman: ${order.courierName || 'Ambil di Toko / Bebas Ongkir'}`;

  const platformFeeText = order.platformFee && order.platformFee > 0
    ? `\n🛡️ Biaya Layanan Aplikasi: Rp ${order.platformFee.toLocaleString('id-ID')}`
    : '';

  const dropshipText = order.dropship?.isDropship
    ? `\n\n📦 *PENGIRIMAN DROPSHIP*\nDari: ${order.dropship.senderName} (${order.dropship.senderPhone})`
    : '';

  const marketerText = order.marketerId 
    ? `\n💼 *Kode Marketer / Referral:* ${order.marketerId}`
    : '';

  return `*PESANAN BARU - ${store.storeName.toUpperCase()}* 🌿
No. Invoice: *#${order.orderId}*
Waktu: ${new Date().toLocaleString('id-ID')}

👤 *DATA PEMESAN:*
Nama: *${order.customerName}*
WhatsApp: ${order.customerPhone}
Alamat: ${order.customerAddress}
Level Harga: *${order.tierLabel}*${marketerText}${dropshipText}

📋 *RINCIAN PESANAN:*
${itemsText}

💰 *TOTAL PEMBAYARAN:*
Subtotal Produk: Rp ${order.subtotalHet.toLocaleString('id-ID')}${discountText}${shippingText}${platformFeeText}
---------------------------------------
*TOTAL TRANSFER: Rp ${order.grandTotal.toLocaleString('id-ID')}*

Metode Bayar: ${order.paymentMethod}

Mohon konfirmasi ketersediaan stok & nomor rekening resmi toko ya kak. Terima kasih! 🙏`;
}
