import { supabase, getActiveSessionToken } from '../config/supabase';
import { Order, Store } from '../types';
import {
  filterDeletedOrders,
  isOrderDeletedStatus,
  markOrdersDeleted,
  notifyPosDataSync
} from './cleanupGuard';

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
      if (rawStore !== null) {
        const parsed = JSON.parse(rawStore);
        return Array.isArray(parsed) ? filterDeletedOrders(storeSlug, parsed) : [];
      }
    }
    const raw = localStorage.getItem('sr12_customer_orders');
    const list: Order[] = raw ? JSON.parse(raw) : [];
    const scoped = (!storeSlug || storeSlug === 'all')
      ? list
      : list.filter(o => !o.storeSlug || o.storeSlug === storeSlug || o.storeSlug === 'all');
    return filterDeletedOrders(storeSlug, scoped);
  } catch {
    return [];
  }
}

/**
 * Fetches uppercase order IDs that have been deleted or cancelled in Supabase orders table.
 */
export async function fetchCancelledOrderIds(storeSlug: string): Promise<Set<string>> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);
  const cancelled = new Set<string>();

  try {
    const { data, error } = await supabase.rpc('rpc_get_store_orders', {
      p_slug: targetSlug,
      p_token: token
    });
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (isOrderDeletedStatus(row.status) && row.order_id) {
          cancelled.add(String(row.order_id).trim().toUpperCase());
        }
      }
    }
  } catch {}

  return cancelled;
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
      const mapped: Order[] = filterDeletedOrders(
        targetSlug,
        data
          .filter((d: any) => !isOrderDeletedStatus(d.status))
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
          }))
      );

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
  const token = getActiveSessionToken(targetSlug);
  const deleting = isOrderDeletedStatus(newStatus);

  if (deleting) {
    markOrdersDeleted(targetSlug, [orderId], { alsoMarketerSales: true, alsoCashflow: true });
  } else {
    try {
      for (const key of ['sr12_customer_orders', `sr12_customer_orders_${targetSlug}`]) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const list: Order[] = JSON.parse(raw);
        const idx = list.findIndex(o => o.orderId === orderId || o.id === orderId);
        if (idx >= 0) {
          list[idx].status = newStatus;
          localStorage.setItem(key, JSON.stringify(list));
        }
      }
    } catch (e) {}
  }

  // 2. Update di Supabase Cloud
  try {
    await supabase.rpc('rpc_update_order_status', {
      p_slug: targetSlug,
      p_order_id: orderId,
      p_new_status: newStatus,
      p_token: token
    });
    if (deleting) {
      try {
        await supabase.rpc('rpc_delete_marketer_sale', {
          p_slug: targetSlug,
          p_order_id: orderId,
          p_token: token
        });
      } catch {}
    }
  } catch (e) {
    console.warn('Error updating order status in Supabase:', e);
  }

  if (deleting) {
    notifyPosDataSync(targetSlug, ['orders', 'cashflow', 'downlines']);
  }

  return true;
}

export async function deleteOrder(orderId: string, storeSlug?: string): Promise<Order[]> {
  const targetSlug = storeSlug || 'sr12-central';
  const token = getActiveSessionToken(targetSlug);

  // 1. Catat tombstone & bersihkan cache lokal
  markOrdersDeleted(targetSlug, [orderId], { alsoMarketerSales: true, alsoCashflow: true });
  const remaining = getLocalOrders(targetSlug);

  // 2. Hapus di Supabase Cloud via SECURITY DEFINER RPC (+ fallback status batal)
  try {
    await supabase.rpc('rpc_delete_store_order', {
      p_slug: targetSlug,
      p_order_id: orderId,
      p_token: token
    });
  } catch {}
  try {
    await supabase.rpc('rpc_update_order_status', {
      p_slug: targetSlug,
      p_order_id: orderId,
      p_new_status: 'Dibatalkan / Dihapus',
      p_token: token
    });
  } catch (e) {
    console.warn('Error updating deleted order status in Supabase:', e);
  }
  try {
    await supabase.rpc('rpc_delete_marketer_sale', {
      p_slug: targetSlug,
      p_order_id: orderId,
      p_token: token
    });
  } catch {}

  notifyPosDataSync(targetSlug, ['orders', 'cashflow', 'downlines']);
  return remaining;
}

export async function clearAllOrders(storeSlug?: string): Promise<void> {
  const targetSlug = (storeSlug || 'sr12-central').toLowerCase();
  const token = getActiveSessionToken(targetSlug);

  // 1. Kumpulkan seluruh ID transaksi lokal & cloud untuk tombstone anti-muncul ulang
  const allOrderIds = new Set<string>(
    getLocalOrders(targetSlug).flatMap(o => [o.orderId, o.id || '']).filter(Boolean)
  );
  try {
    const [{ data: cloudOrders }, { data: cloudSales }] = await Promise.all([
      supabase.rpc('rpc_get_store_orders', { p_slug: targetSlug, p_token: token }),
      supabase.rpc('rpc_get_store_marketer_sales', { p_slug: targetSlug, p_token: token })
    ]);
    if (Array.isArray(cloudOrders)) {
      cloudOrders.forEach((o: any) => o.order_id && allOrderIds.add(String(o.order_id)));
    }
    if (Array.isArray(cloudSales)) {
      cloudSales.forEach((s: any) => s.order_id && allOrderIds.add(String(s.order_id)));
    }
  } catch {}

  markOrdersDeleted(targetSlug, Array.from(allOrderIds), { alsoMarketerSales: true, alsoCashflow: true });

  try {
    localStorage.setItem('sr12_customer_orders', JSON.stringify([]));
    localStorage.setItem(`sr12_customer_orders_${targetSlug}`, JSON.stringify([]));
    localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify([]));
    localStorage.setItem(`sr12_marketer_sales_${targetSlug}`, JSON.stringify([]));
    localStorage.setItem(`sr12_cashflow_${targetSlug}`, JSON.stringify([]));
    localStorage.removeItem('sr12_pos_transactions_v1');
  } catch {}

  // 2. Panggil RPC pembersih permanen di Supabase Cloud
  try {
    await supabase.rpc('rpc_clear_store_orders', { p_slug: targetSlug, p_token: token });
  } catch {}
  try {
    await supabase.rpc('rpc_clear_store_marketer_sales', { p_slug: targetSlug, p_token: token });
  } catch {}

  // 3. Verifikasi apakah masih ada baris tersisa di Supabase; jika masih ada, bersihkan per baris & tandai batal
  try {
    const { data: remainingOrders } = await supabase.rpc('rpc_get_store_orders', {
      p_slug: targetSlug,
      p_token: token
    });
    if (Array.isArray(remainingOrders)) {
      for (const o of remainingOrders) {
        if (!isOrderDeletedStatus(o.status)) {
          try {
            await supabase.rpc('rpc_delete_store_order', {
              p_slug: targetSlug,
              p_order_id: o.order_id,
              p_token: token
            });
          } catch {}
          try {
            await supabase.rpc('rpc_update_order_status', {
              p_slug: targetSlug,
              p_order_id: o.order_id,
              p_new_status: 'Dibatalkan / Dihapus',
              p_token: token
            });
          } catch {}
        }
      }
    }

    const { data: remainingSales } = await supabase.rpc('rpc_get_store_marketer_sales', {
      p_slug: targetSlug,
      p_token: token
    });
    if (Array.isArray(remainingSales)) {
      for (const s of remainingSales) {
        try {
          await supabase.rpc('rpc_delete_marketer_sale', {
            p_slug: targetSlug,
            p_order_id: s.order_id,
            p_token: token
          });
        } catch {}
        try {
          await supabase.rpc('rpc_delete_store_order', {
            p_slug: targetSlug,
            p_order_id: s.order_id,
            p_token: token
          });
        } catch {}
      }
    }
  } catch (e) {
    console.warn('Error verifying cleared orders in Supabase:', e);
  }

  notifyPosDataSync(targetSlug, ['orders', 'cashflow', 'downlines']);
}

/**
 * Normalisasi nomor WhatsApp ke format internasional (misal: 0812 -> 62812)
 */
export function normalizeWhatsAppNumber(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Format pesan WhatsApp resmi untuk pemesanan toko
 */
export function formatWhatsAppOrderMessage(order: Order, store: Store): string {
  const storeTitle = (store?.storeName || 'SR12 STORE').toUpperCase();
  const itemsText = order.items.map((it, idx) => 
    `${idx + 1}. *${it.name}*\n   ${it.quantity} pcs x Rp ${it.price.toLocaleString('id-ID')} = Rp ${it.subtotal.toLocaleString('id-ID')}`
  ).join('\n');

  const discountText = order.discountAmount > 0 
    ? `\n🎁 *Diskon Mitra (${order.tierLabel}):* -Rp ${order.discountAmount.toLocaleString('id-ID')}`
    : '';

  const shippingText = order.courierName?.includes('Ambil Sendiri') 
    ? `\n🚚 *Metode:* Ambil Sendiri di Toko (Bebas Ongkir - Rp 0)`
    : `\n🚚 *Metode:* Kirim ke Alamat (Ekspedisi / Kurir)\n📦 *Ongkir:* Dikonfirmasi Admin Toko via WhatsApp`;

  const dropshipText = order.dropship?.isDropship
    ? `\n\n📦 *PENGIRIMAN DROPSHIP*\nDari: ${order.dropship.senderName} (${order.dropship.senderPhone})`
    : '';

  const partnerText = order.partnerCode
    ? `\n🏷️ *Kode Mitra:* ${order.partnerCode}`
    : '';

  const marketerText = order.marketerId 
    ? `\n💼 *Kode Marketer / Referral:* ${order.marketerId}`
    : '';

  return `*PESANAN BARU - ${storeTitle}* 🌿
No. Invoice: *#${order.orderId}*
Waktu: ${new Date().toLocaleString('id-ID')}

👤 *DATA PEMESAN:*
Nama: *${order.customerName}*
WhatsApp: ${order.customerPhone}
Alamat Pengiriman: ${order.customerAddress}
Status Pembeli: *${order.tierLabel}*${partnerText}${marketerText}${dropshipText}

📋 *RINCIAN PESANAN:*
${itemsText}

💰 *TOTAL PEMBAYARAN:*
Subtotal Produk: Rp ${order.subtotalHet.toLocaleString('id-ID')}${discountText}${shippingText}
---------------------------------------
*TOTAL SEMENTARA: Rp ${order.grandTotal.toLocaleString('id-ID')}*
*(Ongkir final & rekening pembayaran resmi akan dikonfirmasi Admin Toko)*

Mohon cek & konfirmasi total pesanan dan ongkirnya ya Admin. Terima kasih! 🙏`;
}
