import { supabase, getActiveSessionToken } from '../config/supabase';
import { MarketerSale, MitraDownline } from '../types';

export async function verifyMitraDiscount(query: string, storeSlug: string): Promise<{ found: boolean; mitra?: Partial<MitraDownline> }> {
  if (!query || !query.trim()) return { found: false };

  try {
    const { data, error } = await supabase.rpc('rpc_verify_mitra_discount', {
      p_query: query.trim(),
      p_store_slug: storeSlug
    });

    if (!error && data && data.found) {
      return {
        found: true,
        mitra: {
          partnerCode: data.id,
          name: data.name,
          phone: data.phone,
          city: data.city,
          tier: data.tier,
          status: data.status,
          accumulatedSpent90Days: Number(data.accumulatedSpent90Days || 0)
        }
      };
    }
  } catch (err) {
    console.warn('RPC rpc_verify_mitra_discount fallback to local:', err);
  }

  // Fallback to local
  const cleanQ = query.toUpperCase().trim();
  const raw = localStorage.getItem('sr12_mitra_downlines_v2');
  if (raw) {
    try {
      const list: MitraDownline[] = JSON.parse(raw);
      const found = list.find(m => 
        (m.partnerCode && m.partnerCode.toUpperCase() === cleanQ) ||
        (m.phone && m.phone.replace(/[^0-9]/g, '').endsWith(cleanQ.replace(/[^0-9]/g, '')))
      );
      if (found) {
        return { found: true, mitra: found };
      }
    } catch (e) {}
  }

  return { found: false };
}

export async function fetchStoreDownlines(storeSlug: string): Promise<MitraDownline[]> {
  const token = getActiveSessionToken(storeSlug);
  try {
    const { data, error } = await supabase.rpc('rpc_get_store_downlines', {
      p_slug: storeSlug,
      p_token: token
    });
    if (!error && Array.isArray(data)) {
      return data.map((d: any) => ({
        id: d.id,
        storeSlug: d.store_slug,
        partnerCode: d.partner_code,
        name: d.name,
        phone: d.phone,
        city: d.city,
        tier: d.tier,
        bankName: d.bank_name || 'BCA',
        bankAccount: d.bank_account || '-',
        bankHolder: d.bank_holder || d.name,
        status: d.status || 'active',
        accumulatedSpent90Days: Number(d.accumulated_spent_90_days || 0),
        totalOrdersCount: Number(d.total_orders_count || 0)
      }));
    }
  } catch (e) {}

  // Fallback local
  try {
    const raw = localStorage.getItem('sr12_mitra_downlines_v2');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveStoreDownline(mitra: Partial<MitraDownline>, storeSlug: string): Promise<boolean> {
  const token = getActiveSessionToken(storeSlug);
  try {
    await supabase.rpc('rpc_save_store_downline', {
      p_slug: storeSlug,
      p_token: token,
      p_mitra: {
        id: mitra.partnerCode,
        partner_code: mitra.partnerCode,
        name: mitra.name,
        phone: mitra.phone,
        city: mitra.city,
        tier: mitra.tier,
        bankName: mitra.bankName,
        bankAccount: mitra.bankAccount,
        bankHolder: mitra.bankHolder,
        status: mitra.status || 'active'
      }
    });
  } catch (e) {}

  // Update local
  try {
    const raw = localStorage.getItem('sr12_mitra_downlines_v2');
    const list: MitraDownline[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(m => m.partnerCode === mitra.partnerCode);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...mitra } as MitraDownline;
    } else {
      list.push(mitra as MitraDownline);
    }
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify(list));
  } catch (e) {}

  return true;
}

export async function fetchStoreMarketerSales(storeSlug: string): Promise<MarketerSale[]> {
  const token = getActiveSessionToken(storeSlug);
  try {
    const { data, error } = await supabase.rpc('rpc_get_store_marketer_sales', {
      p_slug: storeSlug,
      p_token: token
    });
    if (!error && Array.isArray(data)) {
      return data.map((d: any) => ({
        id: d.id,
        storeSlug: d.store_slug,
        orderId: d.order_id,
        marketerId: d.marketer_id,
        orderDate: d.order_date,
        monthPeriod: d.month_period,
        customerName: d.customer_name,
        customerPhone: d.customer_phone,
        customerAddress: d.customer_address,
        fulfillmentType: d.fulfillment_type || 'delivery',
        itemsDesc: d.items_desc,
        omsetHet: Number(d.omset_het || 0),
        commissionPct: Number(d.commission_pct || 15),
        commissionAmount: Number(d.commission_amount || 0),
        paidStatus: d.paid_status || 'unpaid',
        paidDate: d.paid_date
      }));
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('sr12_marketer_sales_v1');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
