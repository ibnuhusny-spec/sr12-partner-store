import { Product } from '../types';
import { SR12_MASTER_CATALOG } from '../data/sr12MasterCatalog';
import { supabase, getActiveSessionToken } from '../config/supabase';
import { fetchStoreOrders } from './orderService';

const CATALOG_STORAGE_PREFIX = 'sr12_catalog_';
const OVERRIDES_STORAGE_PREFIX = 'sr12_overrides_';
const BUCKET_NAME = 'products';

/**
 * Mengunggah file gambar produk langsung ke Cloud Storage Supabase (Bucket 'products').
 * Menghasilkan URL HTTPS publik permanen yang tahan hapus cache / history browser dan dapat diakses lintas perangkat.
 */
export async function uploadProductImageFile(
  file: File,
  storeSlug: string,
  productId: string
): Promise<string> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file gambar maksimal 5 MB.');
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const cleanProdId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanProdId}_${Date.now()}.${cleanExt}`;
  const filePath = `store_images/${safeSlug}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || `image/${cleanExt}`
    });

  if (uploadError) {
    console.error('[CatalogService] Gagal mengunggah foto ke Supabase Storage:', uploadError);
    throw new Error(`Gagal mengunggah gambar ke cloud: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Menyimpan data kustomisasi produk langsung ke tabel PostgreSQL Supabase Database ('products') via RPC
 */
export async function saveProductToSupabaseDb(
  storeSlug: string,
  product: { id?: string; localId?: string; name: string; stock?: number; het?: number; image?: string; sku?: string; category?: string }
): Promise<void> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    const token = getActiveSessionToken(safeSlug);
    await supabase.rpc('rpc_save_store_product', {
      p_slug: safeSlug,
      p_token: token,
      p_product: {
        name: product.name,
        stock: product.stock,
        het_price: product.het,
        image_url: product.image,
        category: product.category,
        description: JSON.stringify({
          localId: product.localId || product.id,
          sku: product.sku
        })
      }
    });
  } catch (err) {
    console.warn('[CatalogService] Gagal menyimpan produk ke Supabase DB:', err);
  }
}

/**
 * Membaca data override dari cache lokal.
 */
export function getStoreOverrides(storeSlug: string): Record<string, Partial<Product>> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    const raw = localStorage.getItem(`${OVERRIDES_STORAGE_PREFIX}${safeSlug}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[CatalogService] Error membaca overrides lokal untuk ${safeSlug}:`, err);
  }
  return {};
}

/**
 * Menyimpan data override toko ke cache lokal.
 */
export function saveStoreOverrides(
  storeSlug: string,
  overrides: Record<string, Partial<Product>>
): void {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  try {
    localStorage.setItem(`${OVERRIDES_STORAGE_PREFIX}${safeSlug}`, JSON.stringify(overrides));
  } catch (err) {
    console.warn('[CatalogService] Gagal menyimpan cache overrides lokal:', err);
  }
}

/**
 * Mendapatkan katalog produk khusus untuk toko tertentu (Multi-Tenant Catalog).
 */
export function getStoreCatalog(storeSlug: string): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const storageKey = `${CATALOG_STORAGE_PREFIX}${safeSlug}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[CatalogService] Failed to read store catalog for ${safeSlug}:`, err);
  }

  const cloned: Product[] = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));
  const overrides = getStoreOverrides(safeSlug);

  if (overrides && Object.keys(overrides).length > 0) {
    const merged = cloned.map(p => {
      const ov = overrides[p.id] || overrides[p.sku];
      return ov ? { ...p, ...ov } : p;
    });
    saveStoreCatalog(safeSlug, merged);
    return merged;
  }

  saveStoreCatalog(safeSlug, cloned);
  return cloned;
}

/**
 * Sinkronisasi katalog toko dari Supabase Cloud (Online Real-Time Multi-Device).
 * Mengintegrasikan:
 * 1. Master Data SR12 (160+ produk resmi)
 * 2. Kustomisasi produk dari tabel PostgreSQL 'products' di Supabase
 * 3. Pengurangan stok riil dari seluruh transaksi pesanan aktif di Supabase ('orders')
 * Menjamin 100% LAPTOP dan HP memiliki data stok, nama, harga, dan gambar yang PERSIS SAMA.
 */
export async function syncStoreCatalogFromCloud(storeSlug: string): Promise<Product[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();

  try {
    // 1. Ambil kustomisasi produk dari tabel PostgreSQL Supabase 'products'
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*')
      .eq('store_slug', safeSlug);

    // 2. Ambil seluruh pesanan aktif toko dari Supabase RPC untuk menghitung pengurangan stok riil dari transaksi
    const orders = await fetchStoreOrders(safeSlug);
    const validOrders = (orders || []).filter(o => 
      !o.status?.toLowerCase().includes('batal') && 
      !o.status?.toLowerCase().includes('hapus')
    );

    // Hitung akumulasi quantity yang terjual per produk
    const soldQtyMap = new Map<string, number>();
    validOrders.forEach(ord => {
      (ord.items || []).forEach((it: any) => {
        const id = it.id || it.productId || it.product?.id;
        const qty = it.quantity || it.qty || 1;
        if (id) {
          soldQtyMap.set(id, (soldQtyMap.get(id) || 0) + Number(qty));
        }
      });
    });

    // 3. Map database custom products
    const dbProductMap = new Map<string, any>();
    if (Array.isArray(dbProducts)) {
      dbProducts.forEach(row => {
        let localId = '';
        if (row.description) {
          try {
            const parsed = JSON.parse(row.description);
            if (parsed && parsed.localId) localId = parsed.localId;
          } catch {}
        }
        if (localId) {
          dbProductMap.set(localId, row);
        }
        if (row.name) {
          dbProductMap.set(row.name.toLowerCase().trim(), row);
        }
      });
    }

    // 4. Bangun katalog final dari Master SR12 Catalog dengan pengurangan stok akurat
    const masterCloned: Product[] = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));
    const finalCatalog = masterCloned.map(p => {
      const dbRow = dbProductMap.get(p.id) || dbProductMap.get(p.name.toLowerCase().trim());
      const baseStock = (dbRow && typeof dbRow.stock === 'number') ? dbRow.stock : (p.stock ?? 50);
      const totalSold = soldQtyMap.get(p.id) || soldQtyMap.get(p.sku) || 0;
      const currentRemainingStock = Math.max(0, baseStock - totalSold);

      return {
        ...p,
        stock: currentRemainingStock,
        ...(dbRow?.image_url ? { image: dbRow.image_url } : {}),
        ...(dbRow?.het_price && dbRow.het_price > 0 ? { het: Number(dbRow.het_price), price: Number(dbRow.het_price) } : {})
      };
    });

    // Update penyimpanan lokal
    saveStoreCatalog(safeSlug, finalCatalog);
    return finalCatalog;
  } catch (err) {
    console.warn(`[CatalogService] Error sinkronisasi cloud catalog untuk ${safeSlug}:`, err);
    return getStoreCatalog(safeSlug);
  }
}

/**
 * Menyimpan seluruh katalog khusus toko ke penyimpanan lokal.
 */
export function saveStoreCatalog(storeSlug: string, products: Product[]): void {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const storageKey = `${CATALOG_STORAGE_PREFIX}${safeSlug}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(products));
  } catch (err) {
    console.error(`[CatalogService] Failed to save store catalog for ${safeSlug}:`, err);
  }
}

/**
 * Mengupdate detail spesifik satu produk dan menyinkronkannya ke Supabase PostgreSQL
 */
export function updateStoreProduct(storeSlug: string, updatedProduct: Product): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const currentCatalog = getStoreCatalog(safeSlug);

  const nextCatalog = currentCatalog.map(p => {
    if (p.id === updatedProduct.id || p.sku === updatedProduct.sku) {
      return {
        ...p,
        ...updatedProduct
      };
    }
    return p;
  });

  saveStoreCatalog(safeSlug, nextCatalog);

  // Simpan ke Supabase PostgreSQL Database via RPC
  saveProductToSupabaseDb(safeSlug, {
    name: updatedProduct.name,
    stock: updatedProduct.stock,
    localId: updatedProduct.id,
    sku: updatedProduct.sku,
    category: updatedProduct.category,
    het: updatedProduct.het,
    image: updatedProduct.image
  });

  const currentOverrides = getStoreOverrides(safeSlug);
  currentOverrides[updatedProduct.id] = {
    name: updatedProduct.name,
    het: updatedProduct.het,
    price: updatedProduct.het,
    stock: updatedProduct.stock,
    weightGram: updatedProduct.weightGram,
    image: updatedProduct.image,
    summary: updatedProduct.summary
  };
  saveStoreOverrides(safeSlug, currentOverrides);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:stock_updated', {
      detail: { storeSlug: safeSlug, product: updatedProduct }
    }));
  }

  return nextCatalog;
}

/**
 * Update cepat jumlah stok gudang untuk toko tertentu di POS Backoffice dan simpan ke Supabase DB
 */
export function updateStoreProductStock(storeSlug: string, productId: string, newStock: number): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const currentCatalog = getStoreCatalog(safeSlug);

  const targetProd = currentCatalog.find(p => p.id === productId || p.sku === productId);

  const nextCatalog = currentCatalog.map(p => {
    if (p.id === productId || p.sku === productId) {
      return { ...p, stock: Math.max(0, newStock) };
    }
    return p;
  });

  saveStoreCatalog(safeSlug, nextCatalog);

  if (targetProd) {
    saveProductToSupabaseDb(safeSlug, {
      name: targetProd.name,
      stock: Math.max(0, newStock),
      localId: targetProd.id,
      sku: targetProd.sku,
      category: targetProd.category,
      het: targetProd.het
    });
  }

  const currentOverrides = getStoreOverrides(safeSlug);
  currentOverrides[productId] = {
    ...(currentOverrides[productId] || {}),
    stock: Math.max(0, newStock)
  };
  saveStoreOverrides(safeSlug, currentOverrides);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:stock_updated', {
      detail: { storeSlug: safeSlug, productId, stock: newStock }
    }));
  }

  return nextCatalog;
}

/**
 * Auto-Seed saat toko baru mendaftar atau disetujui oleh Super Admin.
 */
export function seedNewStoreCatalog(storeSlug: string): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const cloned = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));
  saveStoreCatalog(safeSlug, cloned);
  return cloned;
}

/**
 * Reset katalog toko kembali ke Master Data resmi SR12 jika diperlukan.
 */
export function resetStoreCatalogToMaster(storeSlug: string): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const cloned = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));
  saveStoreCatalog(safeSlug, cloned);

  try {
    localStorage.removeItem(`${OVERRIDES_STORAGE_PREFIX}${safeSlug}`);
  } catch {}

  return cloned;
}

/**
 * Setel stok semua produk toko ini ke nilai tertentu (misal: 0 untuk simulasi habis, atau 50 untuk default).
 */
export function setAllStoreProductsStock(storeSlug: string, targetStock: number): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const currentCatalog = getStoreCatalog(safeSlug);
  const nextCatalog = currentCatalog.map(p => ({
    ...p,
    stock: Math.max(0, targetStock)
  }));

  saveStoreCatalog(safeSlug, nextCatalog);

  const currentOverrides = getStoreOverrides(safeSlug);
  nextCatalog.forEach(p => {
    currentOverrides[p.id] = {
      ...(currentOverrides[p.id] || {}),
      stock: Math.max(0, targetStock)
    };
  });
  saveStoreOverrides(safeSlug, currentOverrides);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:stock_updated', {
      detail: { storeSlug: safeSlug, targetStock }
    }));
  }

  return nextCatalog;
}

/**
 * Update banyak stok produk sekaligus (batch)
 */
export function batchUpdateStoreProductStocks(
  storeSlug: string,
  updates: { productId: string; newStock: number }[]
): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const currentCatalog = getStoreCatalog(safeSlug);
  const updateMap = new Map(updates.map(u => [u.productId, Math.max(0, u.newStock)]));

  const nextCatalog = currentCatalog.map(p => {
    if (updateMap.has(p.id)) {
      return { ...p, stock: updateMap.get(p.id)! };
    }
    return p;
  });

  saveStoreCatalog(safeSlug, nextCatalog);

  updates.forEach(u => {
    const found = currentCatalog.find(p => p.id === u.productId);
    if (found) {
      saveProductToSupabaseDb(safeSlug, {
        name: found.name,
        stock: Math.max(0, u.newStock),
        localId: found.id,
        sku: found.sku,
        category: found.category,
        het: found.het
      });
    }
  });

  const currentOverrides = getStoreOverrides(safeSlug);
  updates.forEach(u => {
    currentOverrides[u.productId] = {
      ...(currentOverrides[u.productId] || {}),
      stock: Math.max(0, u.newStock)
    };
  });
  saveStoreOverrides(safeSlug, currentOverrides);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:stock_updated', {
      detail: { storeSlug: safeSlug, updates }
    }));
  }

  return nextCatalog;
}
