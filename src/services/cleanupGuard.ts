import type { CashflowEntry, MarketerSale, MitraDownline, Order } from '../types';

export interface CleanupTombstones {
  deletedOrderIds: string[];
  deletedMarketerOrderIds: string[];
  deletedDownlineCodes: string[];
  deletedCashflowIds: string[];
  downlinesSampleBlocked: boolean;
}

const MAX_TOMBSTONE_IDS = 2000;

function normalizeSlug(storeSlug?: string): string {
  return (storeSlug || 'sr12-central').toLowerCase().trim() || 'sr12-central';
}

function normalizeId(value?: string | null): string {
  return (value || '').trim().toUpperCase();
}

function tombstoneKey(storeSlug?: string): string {
  return `sr12_cleanup_tombstones_${normalizeSlug(storeSlug)}`;
}

function mergeUniqueIds(existing: string[], additions: string[]): string[] {
  const merged = new Set<string>();
  for (const id of existing) {
    const clean = normalizeId(id);
    if (clean) merged.add(clean);
  }
  for (const id of additions) {
    const clean = normalizeId(id);
    if (clean) merged.add(clean);
  }
  const arr = Array.from(merged);
  return arr.length > MAX_TOMBSTONE_IDS ? arr.slice(arr.length - MAX_TOMBSTONE_IDS) : arr;
}

function removeFromJsonList<T>(key: string, shouldRemove: (item: T) => boolean): void {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const filtered = parsed.filter((item: T) => !shouldRemove(item));
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}
}

/**
 * Checks whether an order status indicates deletion or cancellation.
 */
export function isOrderDeletedStatus(status?: string | null): boolean {
  const lower = (status || '').toLowerCase();
  return lower.includes('hapus') || lower.includes('batal');
}

/**
 * Reads persistent per-store deletion tombstones from localStorage.
 */
export function getTombstones(storeSlug?: string): CleanupTombstones {
  const empty: CleanupTombstones = {
    deletedOrderIds: [],
    deletedMarketerOrderIds: [],
    deletedDownlineCodes: [],
    deletedCashflowIds: [],
    downlinesSampleBlocked: false
  };
  try {
    const raw = localStorage.getItem(tombstoneKey(storeSlug));
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      deletedOrderIds: Array.isArray(parsed.deletedOrderIds) ? parsed.deletedOrderIds : [],
      deletedMarketerOrderIds: Array.isArray(parsed.deletedMarketerOrderIds) ? parsed.deletedMarketerOrderIds : [],
      deletedDownlineCodes: Array.isArray(parsed.deletedDownlineCodes) ? parsed.deletedDownlineCodes : [],
      deletedCashflowIds: Array.isArray(parsed.deletedCashflowIds) ? parsed.deletedCashflowIds : [],
      downlinesSampleBlocked: Boolean(parsed.downlinesSampleBlocked)
    };
  } catch {
    return empty;
  }
}

function saveTombstones(storeSlug: string | undefined, next: CleanupTombstones): void {
  try {
    localStorage.setItem(tombstoneKey(storeSlug), JSON.stringify(next));
  } catch {}
}

/**
 * Records deleted order IDs and purges them from local caches across orders, commission sales, and cashflow.
 */
export function markOrdersDeleted(
  storeSlug: string | undefined,
  orderIds: string[],
  options: { alsoMarketerSales?: boolean; alsoCashflow?: boolean } = {}
): void {
  const slug = normalizeSlug(storeSlug);
  const cleanIds = orderIds.map(normalizeId).filter(Boolean);
  if (cleanIds.length === 0) return;

  const tombstones = getTombstones(slug);
  tombstones.deletedOrderIds = mergeUniqueIds(tombstones.deletedOrderIds, cleanIds);

  if (options.alsoMarketerSales) {
    tombstones.deletedMarketerOrderIds = mergeUniqueIds(tombstones.deletedMarketerOrderIds, cleanIds);
  }
  if (options.alsoCashflow) {
    const cashIds = cleanIds.flatMap(id => [id, id.startsWith('CSH-ORD-') ? id : `CSH-ORD-${id}`]);
    tombstones.deletedCashflowIds = mergeUniqueIds(tombstones.deletedCashflowIds, cashIds);
  }
  saveTombstones(slug, tombstones);

  const idSet = new Set(cleanIds);
  const matchesOrder = (o: Partial<Order>) =>
    idSet.has(normalizeId(o.orderId)) || idSet.has(normalizeId(o.id));

  removeFromJsonList<Order>('sr12_customer_orders', matchesOrder);
  removeFromJsonList<Order>(`sr12_customer_orders_${slug}`, matchesOrder);

  if (options.alsoMarketerSales) {
    const matchesSale = (s: Partial<MarketerSale>) => idSet.has(normalizeId(s.orderId));
    removeFromJsonList<MarketerSale>('sr12_marketer_sales_v1', matchesSale);
    removeFromJsonList<MarketerSale>(`sr12_marketer_sales_${slug}`, matchesSale);
  }

  if (options.alsoCashflow) {
    const matchesCash = (c: Partial<CashflowEntry>) => {
      const cid = normalizeId(c.id);
      return idSet.has(cid) || idSet.has(cid.replace(/^CSH-ORD-/, ''));
    };
    removeFromJsonList<CashflowEntry>(`sr12_cashflow_${slug}`, matchesCash);
  }
}

/**
 * Records deleted marketer commission order IDs so they never reappear after clearing commission history.
 */
export function markMarketerSalesDeleted(storeSlug: string | undefined, orderIds: string[]): void {
  const slug = normalizeSlug(storeSlug);
  const cleanIds = orderIds.map(normalizeId).filter(Boolean);
  const tombstones = getTombstones(slug);
  if (cleanIds.length > 0) {
    tombstones.deletedMarketerOrderIds = mergeUniqueIds(tombstones.deletedMarketerOrderIds, cleanIds);
    saveTombstones(slug, tombstones);
  }

  const idSet = new Set(cleanIds);
  if (idSet.size > 0) {
    const matchesSale = (s: Partial<MarketerSale>) => idSet.has(normalizeId(s.orderId));
    removeFromJsonList<MarketerSale>('sr12_marketer_sales_v1', matchesSale);
    removeFromJsonList<MarketerSale>(`sr12_marketer_sales_${slug}`, matchesSale);
  }
}

/**
 * Records deleted partner codes (and optional full clear flag) so deleted or sample partners do not return.
 */
export function markDownlinesDeleted(
  storeSlug: string | undefined,
  partnerCodes: string[],
  clearedAll = false
): void {
  const slug = normalizeSlug(storeSlug);
  const cleanCodes = partnerCodes.map(normalizeId).filter(Boolean);
  const tombstones = getTombstones(slug);
  if (cleanCodes.length > 0) {
    tombstones.deletedDownlineCodes = mergeUniqueIds(tombstones.deletedDownlineCodes, cleanCodes);
  }
  if (clearedAll) {
    tombstones.downlinesSampleBlocked = true;
  }
  saveTombstones(slug, tombstones);

  if (cleanCodes.length > 0) {
    const codeSet = new Set(cleanCodes);
    const matchesDownline = (m: Partial<MitraDownline>) =>
      codeSet.has(normalizeId(m.partnerCode)) || codeSet.has(normalizeId(m.id));
    removeFromJsonList<MitraDownline>('sr12_mitra_downlines_v2', matchesDownline);
    removeFromJsonList<MitraDownline>(`sr12_mitra_downlines_${slug}`, matchesDownline);
  }
}

/**
 * Removes partner codes from deletion tombstones when the owner explicitly creates or restores them.
 */
export function unmarkDownlineDeleted(storeSlug: string | undefined, partnerCodes: string[]): void {
  const slug = normalizeSlug(storeSlug);
  const removeSet = new Set(partnerCodes.map(normalizeId).filter(Boolean));
  if (removeSet.size === 0) return;

  const tombstones = getTombstones(slug);
  tombstones.deletedDownlineCodes = tombstones.deletedDownlineCodes.filter(
    code => !removeSet.has(normalizeId(code))
  );
  saveTombstones(slug, tombstones);
}

/**
 * Records deleted cashflow entry IDs and maps order-backed entries to deletedOrderIds too.
 */
export function markCashflowDeleted(storeSlug: string | undefined, cashflowIds: string[]): void {
  const slug = normalizeSlug(storeSlug);
  const cleanIds = cashflowIds.map(normalizeId).filter(Boolean);
  if (cleanIds.length === 0) return;

  const tombstones = getTombstones(slug);
  tombstones.deletedCashflowIds = mergeUniqueIds(tombstones.deletedCashflowIds, cleanIds);
  const derivedOrderIds = cleanIds.map(id => id.replace(/^CSH-ORD-/, ''));
  tombstones.deletedOrderIds = mergeUniqueIds(tombstones.deletedOrderIds, derivedOrderIds);
  saveTombstones(slug, tombstones);

  const cashSet = new Set(cleanIds);
  const orderSet = new Set(derivedOrderIds);
  removeFromJsonList<CashflowEntry>(`sr12_cashflow_${slug}`, c => {
    const cid = normalizeId(c.id);
    return cashSet.has(cid) || orderSet.has(cid.replace(/^CSH-ORD-/, ''));
  });
}

export function filterDeletedOrders(storeSlug: string | undefined, orders: Order[]): Order[] {
  const tombstones = getTombstones(storeSlug);
  const deletedSet = new Set(tombstones.deletedOrderIds.map(normalizeId));
  return orders.filter(o => {
    if (isOrderDeletedStatus(o.status)) return false;
    const oid = normalizeId(o.orderId);
    const uid = normalizeId(o.id);
    return !deletedSet.has(oid) && (!uid || !deletedSet.has(uid));
  });
}

export function filterDeletedMarketerSales(
  storeSlug: string | undefined,
  sales: MarketerSale[],
  cancelledOrderIds?: Set<string>
): MarketerSale[] {
  const tombstones = getTombstones(storeSlug);
  const deletedOrderSet = new Set(tombstones.deletedOrderIds.map(normalizeId));
  const deletedSaleSet = new Set(tombstones.deletedMarketerOrderIds.map(normalizeId));
  const cancelledUpperSet = new Set(
    Array.from(cancelledOrderIds || []).map(normalizeId).filter(Boolean)
  );

  return sales.filter(s => {
    const oid = normalizeId(s.orderId);
    if (!oid) return false;
    return !deletedOrderSet.has(oid) && !deletedSaleSet.has(oid) && !cancelledUpperSet.has(oid);
  });
}

export function filterDeletedDownlines(
  storeSlug: string | undefined,
  downlines: MitraDownline[]
): MitraDownline[] {
  const tombstones = getTombstones(storeSlug);
  const deletedSet = new Set(tombstones.deletedDownlineCodes.map(normalizeId));
  return downlines.filter(m => {
    const code = normalizeId(m.partnerCode);
    const id = normalizeId(m.id);
    return !deletedSet.has(code) && (!id || !deletedSet.has(id));
  });
}

export function filterDeletedCashflow(
  storeSlug: string | undefined,
  entries: CashflowEntry[]
): CashflowEntry[] {
  const tombstones = getTombstones(storeSlug);
  const cashSet = new Set(tombstones.deletedCashflowIds.map(normalizeId));
  const orderSet = new Set(tombstones.deletedOrderIds.map(normalizeId));
  return entries.filter(e => {
    const cid = normalizeId(e.id);
    const stripped = cid.replace(/^CSH-ORD-/, '');
    return !cashSet.has(cid) && !orderSet.has(cid) && !orderSet.has(stripped);
  });
}

/**
 * Broadcasts cloud sync events so all mounted POS views update immediately after deletions or resets.
 */
export function notifyPosDataSync(
  storeSlug: string | undefined,
  domains: Array<'orders' | 'cashflow' | 'downlines'>
): void {
  if (typeof window === 'undefined') return;
  const slug = normalizeSlug(storeSlug);
  for (const domain of domains) {
    window.dispatchEvent(
      new CustomEvent(`sr12:cloud_sync_${domain}`, { detail: { storeSlug: slug } })
    );
  }
}
