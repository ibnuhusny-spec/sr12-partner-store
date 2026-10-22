import { supabase, getActiveSessionToken } from '../config/supabase';
import { Order, Store } from '../types';

export async function createOrder(order: Order, storeSlug: string): Promise<{ success: boolean; message: string; remainingQuota?: number }> {
  try {
    const { data, error } = await supabase.rpc('rpc_create_store_order', {
      p_slug: storeSlug,
      p_order: {
        id: order.orderId,
        order_id: order.orderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        tier: order.tier,
        tierLabel: order.tierLabel,
        items: order.items,
        subtotalHet: order.subtotalHet,
        discountAmount: order.discountAmount,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        status: order.status,
        orderSource: order.orderSource,
        marketerId: order.marketerId
      }
    });

    if (!error && data && data.success) {
      saveLocalOrder(order);
      return { success: true, message: 'Pesanan berhasil disimpan di Cloud!', remainingQuota: data.remaining_quota };
    }
  } catch (err) {
    console.warn('RPC rpc_create_store_order error, saving locally:', err);
  }

  saveLocalOrder(order);
  return { success: true, message: 'Pesanan berhasil dibuat.' };
}

function saveLocalOrder(order: Order) {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    const list: Order[] = raw ? JSON.parse(raw) : [];
    list.unshift(order);
    localStorage.setItem('sr12_customer_orders', JSON.stringify(list));
  } catch (e) {}
}

export function getLocalOrders(storeSlug?: string): Order[] {
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    const list: Order[] = raw ? JSON.parse(raw) : [];
    if (!storeSlug || storeSlug === 'all') return list;
    return list.filter(o => o.storeSlug === storeSlug);
  } catch {
    return [];
  }
}

export async function fetchStoreOrders(storeSlug: string): Promise<Order[]> {
  const token = getActiveSessionToken(storeSlug);
  const localOrders = getLocalOrders(storeSlug);

  try {
    const { data, error } = await supabase.rpc('rpc_get_store_orders', {
      p_slug: storeSlug,
      p_token: token
    });
    if (!error && Array.isArray(data)) {
      const cloudOrders: Order[] = data.map((d: any) => ({
        id: d.id,
        orderId: d.order_id,
        storeSlug: d.store_slug,
        orderDate: d.order_date || d.created_at,
        customerName: d.customer_name,
        customerPhone: d.customer_phone,
        customerAddress: d.customer_address,
        tier: d.tier,
        tierLabel: d.tier_label,
        items: Array.isArray(d.items_json) ? d.items_json : [],
        subtotalHet: Number(d.subtotal_het || 0),
        discountAmount: Number(d.discount_amount || 0),
        grandTotal: Number(d.grand_total || 0),
        paymentMethod: d.payment_method,
        status: d.status,
        orderSource: d.order_source || 'Online Web Store',
        createdAt: d.created_at
      }));

      // Gabungkan pesanan cloud dengan transaksi kasir lokal tanpa duplikasi
      const combined = [...localOrders];
      for (const co of cloudOrders) {
        const existingIdx = combined.findIndex(o => o.orderId === co.orderId);
        if (existingIdx >= 0) {
          combined[existingIdx] = { ...combined[existingIdx], ...co };
        } else {
          combined.push(co);
        }
      }
      return combined.sort((a, b) => new Date(b.createdAt || b.orderDate || 0).getTime() - new Date(a.createdAt || a.orderDate || 0).getTime());
    }
  } catch (e) {}

  return localOrders;
}

export async function updateOrderStatus(orderId: string, newStatus: string, storeSlug: string): Promise<boolean> {
  const token = getActiveSessionToken(storeSlug);
  try {
    await supabase.rpc('rpc_update_order_status', {
      p_slug: storeSlug,
      p_order_id: orderId,
      p_new_status: newStatus,
      p_token: token
    });
  } catch (e) {}

  // Update local
  try {
    const raw = localStorage.getItem('sr12_customer_orders');
    if (raw) {
      const list: Order[] = JSON.parse(raw);
      const idx = list.findIndex(o => o.orderId === orderId);
      if (idx >= 0) {
        list[idx].status = newStatus;
        localStorage.setItem('sr12_customer_orders', JSON.stringify(list));
      }
    }
  } catch (e) {}

  return true;
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
