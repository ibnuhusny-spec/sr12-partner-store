import { Product } from '../types';
import { SR12_MASTER_CATALOG } from '../data/sr12MasterCatalog';
import { supabase } from '../config/supabase';

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

  // Ekstensi dan nama file yang bersih
  const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const cleanProdId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanProdId}_${Date.now()}.${cleanExt}`;
  const filePath = `store_images/${safeSlug}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 tahun CDN cache
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
 * Membaca data override (perubahan kustom toko seperti gambar, nama, harga, stok) dari cache lokal.
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
 * Menyimpan data override toko ke cache lokal dan mengunggah asinkron ke Cloud Storage Supabase.
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

  // Upload ke Supabase Cloud Storage di latar belakang (agar tahan hapus history browser)
  uploadOverridesToCloud(safeSlug, overrides).catch(err => {
    console.warn('[CatalogService] Warning sinkronisasi cloud overrides:', err);
  });
}

/**
 * Mengunggah file overrides.json toko ke Supabase Storage
 */
async function uploadOverridesToCloud(
  safeSlug: string,
  overrides: Record<string, Partial<Product>>
): Promise<void> {
  const path = `catalogs/${safeSlug}/overrides.json`;
  const content = JSON.stringify(overrides, null, 2);
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, content, {
    contentType: 'application/json',
    upsert: true
  });
  if (error) {
    console.warn(`[CatalogService] Gagal mengunggah overrides.json untuk ${safeSlug}:`, error);
  }
}

/**
 * Mendapatkan katalog produk khusus untuk toko tertentu (Multi-Tenant Catalog).
 * Jika toko baru pertama kali dibuka, sistem otomatis mengkloning (seed) 160+ Master Data SR12
 * dan menerapkan overrides yang ada.
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

  // Auto-Seed: Duplikasi Master Catalog ke partisi toko ini dan gabungkan overrides jika ada
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
 * Sinkronisasi katalog toko dari Supabase Cloud.
 * Fungsi ini memastikan seluruh gambar yang telah diedit atau detail produk yang diubah
 * TETAP UTUH meskipun browser history/cache dibersihkan atau toko dibuka di HP/komputer lain.
 */
export async function syncStoreCatalogFromCloud(storeSlug: string): Promise<Product[]> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();

  try {
    const path = `catalogs/${safeSlug}/overrides.json`;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);

    if (error || !data) {
      // Belum ada file kustomisasi di cloud, kembalikan katalog lokal / master
      return getStoreCatalog(safeSlug);
    }

    const text = await data.text();
    const cloudOverrides: Record<string, Partial<Product>> = JSON.parse(text);

    if (cloudOverrides && typeof cloudOverrides === 'object') {
      // Simpan override ke cache lokal
      try {
        localStorage.setItem(`${OVERRIDES_STORAGE_PREFIX}${safeSlug}`, JSON.stringify(cloudOverrides));
      } catch {}

      // Ambil master data segar dan timpa dengan kustomisasi cloud yang tersimpan
      const masterCloned: Product[] = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));
      const mergedCatalog = masterCloned.map(p => {
        const ov = cloudOverrides[p.id] || cloudOverrides[p.sku];
        return ov ? { ...p, ...ov } : p;
      });

      // Update penyimpanan lokal
      saveStoreCatalog(safeSlug, mergedCatalog);
      return mergedCatalog;
    }
  } catch (err) {
    console.warn(`[CatalogService] Error sinkronisasi cloud catalog untuk ${safeSlug}:`, err);
  }

  return getStoreCatalog(safeSlug);
}

/**
 * Menyimpan seluruh katalog khusus toko ke penyimpanan terisolasi.
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
 * Mengupdate detail spesifik satu produk (misal: ganti gambar custom, nama display, harga jual promo, berat, stok).
 * Perubahan ini 100% TERISOLASI hanya untuk toko yang bersangkutan dan langsung disinkronkan ke Supabase Cloud.
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

  // Rekam ke overrides dan sinkronkan ke Supabase Cloud Storage
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

  return nextCatalog;
}

/**
 * Update cepat jumlah stok gudang untuk toko tertentu di POS Backoffice.
 */
export function updateStoreProductStock(storeSlug: string, productId: string, newStock: number): Product[] {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();
  const currentCatalog = getStoreCatalog(safeSlug);

  const nextCatalog = currentCatalog.map(p => {
    if (p.id === productId) {
      return { ...p, stock: Math.max(0, newStock) };
    }
    return p;
  });

  saveStoreCatalog(safeSlug, nextCatalog);

  // Rekam perubahan stok ke overrides
  const currentOverrides = getStoreOverrides(safeSlug);
  currentOverrides[productId] = {
    ...(currentOverrides[productId] || {}),
    stock: Math.max(0, newStock)
  };
  saveStoreOverrides(safeSlug, currentOverrides);

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

  // Bersihkan overrides lokal dan cloud
  try {
    localStorage.removeItem(`${OVERRIDES_STORAGE_PREFIX}${safeSlug}`);
  } catch {}
  uploadOverridesToCloud(safeSlug, {}).catch(() => {});

  return cloned;
}
