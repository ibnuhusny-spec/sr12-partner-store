import { supabase, getActiveSessionToken } from '../config/supabase';
import { Order, Store } from '../types';

export async function createOrder(order: Order, storeSlug: string): Promise<{ success: boolean; message: string; remainingQuota?: number }> {
  const targetSlug = storeSlug || order.storeSlug || 'sr12-central';
  const enriched: Order = {
    ...order,
    storeSlug: targetSlug
  };

  // 1. Simpan ke local cache untuk responsivitas instan di perangkat ini
  saveLocalOrder(enriched);

  // 2. Simpan secara permanen ke Supabase Cloud
  try {
    const { data, error } = await supabase.rpc('rpc_create_store_order', {
      p_slug: targetSlug,
      p_order: {
        order_id: enriched.orderId,
        storeSlug: targetSlug,
        customerName: enriched.customerName,
        customerPhone: enriched.customerPhone,
        customerAddress: enriched.customerAddress,
        tier: enriched.tier,
        tierLabel: enriched.tierLabel,
        items: enriched.items,
        subtotalHet: enriched.subtotalHet,
        discountAmount: enriched.discountAmount,
        grandTotal: enriched.grandTotal,
        paymentMethod: enriched.paymentMethod,
        status: enriched.status,
        orderSource: enriched.orderSource,
        marketerId: enriched.marketerId
      }
    });

    if (error) {
      console.warn('rpc_create_store_order warning:', error);
    } else {
      console.log('Order successfully synced to Supabase Cloud:', data);
    }
  } catch (err) {
    console.warn('Network error saving order to Supabase:', err);
  }

  return { success: true, message: 'Pesanan berhasil dibuat.' };
}

function saveLocalOrder(order: Order) {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    const list: Order[] = raw ? JSON.parse(raw) : [];
    const existingIdx = list.findIndex(o => o.orderId === order.orderId);
    if (existingIdx >= 0) {
      list[existingIdx] = order;
    } else {
      list.unshift(order);
    }
    localStorage.setItem('sr12_customer_orders', JSON.stringify(list));
    if (order.storeSlug) {
      localStorage.setItem(`sr12_customer_orders_${order.storeSlug}`, JSON.stringify(list));
    }
  } catch (e) {}
}

export function getLocalOrders(storeSlug?: string): Order[] {
  try {
    if (storeSlug && storeSlug !== 'all') {
      const rawStore = localStorage.getItem(`sr12_customer_orders_${storeSlug}`);
      if (rawStore) return JSON.parse(rawStore);
    }
    const raw = localStorage.getItem('sr12_customer_orders');
    const list: Order[] = raw ? JSON.parse(raw) : [];
    if (!storeSlug || storeSlug === 'all') return list;
    return list.filter(o => !o.storeSlug || o.storeSlug === storeSlug || o.storeSlug === 'all');
  } catch {
    return [];
  }
}

export async function fetchStoreOrders(storeSlug: string): Promise<Order[]> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  try {
    const { data, error } = await supabase.rpc('rpc_get_store_orders', {
      p_slug: targetSlug,
      p_token: token
    });

    if (!error && Array.isArray(data)) {
      const mapped: Order[] = data
        .filter((d: any) => !d.status || (!d.status.includes('Dihapus') && !d.status.includes('Dibatalkan')))
        .map((d: any) => ({
          id: d.id,
          orderId: d.order_id,
          storeSlug: d.store_slug || targetSlug,
          customerName: d.customer_name,
          customerPhone: d.customer_phone,
          customerAddress: d.customer_address,
          tier: d.tier,
          tierLabel: d.tier_label,
          items: d.items_json || [],
          subtotalHet: Number(d.subtotal_het || 0),
          discountAmount: Number(d.discount_amount || 0),
          grandTotal: Number(d.grand_total || 0),
          paymentMethod: d.payment_method,
          status: d.status,
          orderSource: d.order_source,
          createdAt: d.created_at || d.order_date
        }));

      // Simpan ke local cache untuk kedua device
      try {
        localStorage.setItem(`sr12_customer_orders_${targetSlug}`, JSON.stringify(mapped));
        localStorage.setItem('sr12_customer_orders', JSON.stringify(mapped));
      } catch {}

      return mapped;
    } else if (error) {
      console.warn('rpc_get_store_orders warning:', error.message);
    }
  } catch (err) {
    console.warn('Network error in fetchStoreOrders:', err);
  }

  return getLocalOrders(targetSlug);
}

export async function updateOrderStatus(orderId: string, newStatus: string, storeSlug: string): Promise<boolean> {
  const targetSlug = storeSlug || 'sr12-central';
  // 1. Update local cache
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    if (raw) {
      const list: Order[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.orderId === orderId || o.id === orderId);
      if (idx >= 0) {
        list[idx].status = newStatus;
        localStorage.setItem('sr12_customer_orders', JSON.stringify(list));
        localStorage.setItem(`sr12_customer_orders_${targetSlug}`, JSON.stringify(list));
      }
    }
  } catch (e) {}

  // 2. Update di Supabase Cloud
  try {
    const token = getActiveSessionToken(targetSlug);
    await supabase.rpc('rpc_update_order_status', {
      p_slug: targetSlug,
      p_order_id: orderId,
      p_new_status: newStatus,
      p_token: token
    });
  } catch (e) {
    console.warn('Error updating order status in Supabase:', e);
  }

  return true;
}

export async function deleteOrder(orderId: string, storeSlug?: string): Promise<Order[]> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  // 1. Update local cache
  let filtered: Order[] = [];
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    if (raw) {
      const list: Order[] = JSON.parse(raw);
      filtered = list.filter(o => o.orderId !== orderId && o.id !== orderId);
      localStorage.setItem('sr12_customer_orders', JSON.stringify(filtered));
      localStorage.setItem(`sr12_customer_orders_${targetSlug}`, JSON.stringify(filtered));
    }
  } catch (e) {}

  // 2. Update status to 'Dibatalkan / Dihapus' di Supabase Cloud
  try {
    await supabase.rpc('rpc_update_order_status', {
      p_slug: targetSlug,
      p_order_id: orderId,
      p_new_status: 'Dibatalkan / Dihapus',
      p_token: token
    });
  } catch (e) {
    console.warn('Error deleting order in Supabase:', e);
  }

  return filtered;
}

export async function clearAllOrders(storeSlug?: string): Promise<void> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  try {
    localStorage.setItem('sr12_customer_orders', JSON.stringify([]));
    localStorage.setItem(`sr12_customer_orders_${targetSlug}`, JSON.stringify([]));
  } catch {}

  try {
    const { data: list } = await supabase.rpc('rpc_get_store_orders', {
      p_slug: targetSlug,
      p_token: token
    });
    if (Array.isArray(list)) {
      for (const o of list) {
        await supabase.rpc('rpc_update_order_status', {
          p_slug: targetSlug,
          p_order_id: o.order_id,
          p_new_status: 'Dibatalkan / Dihapus',
          p_token: token
        });
      }
    }
  } catch (e) {
    console.warn('Error clearing orders in Supabase:', e);
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
