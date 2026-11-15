import { Product } from '../types';
import { SR12_MASTER_CATALOG } from '../data/sr12MasterCatalog';
import { supabase, getActiveSessionToken } from '../config/supabase';
import { fetchStoreOrders } from './orderService';
import { isDemoSessionActive } from './demoGuard';

const CATALOG_STORAGE_PREFIX = 'sr12_catalog_';
const OVERRIDES_STORAGE_PREFIX = 'sr12_overrides_';
const BUCKET_NAME = 'products';

/**
 * Kompres gambar ke Base64 (WebP/JPEG) ringan yang siap pakai di HP dan Desktop.
 */
export function compressImageToBase64(file: File, maxWidth = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          resolve(webpData);
        } catch {
          const jpegData = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegData);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Kompres file gambar foto HP / gallery kamera ke WebP/JPEG Blob (~60KB - 120KB) dan Data URL.
 * Menjamin foto HP berukuran besar (5MB - 25MB) langsung ringan dan tidak pernah gagal upload.
 */
export function compressImageToBlob(
  file: File,
  maxWidth = 800,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawUrl = event.target?.result as string;
          resolve({ blob: file, dataUrl: rawUrl });
          return;
        }

        // Background putih untuk menghindari artefak transparansi
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              resolve({ blob: file, dataUrl });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Format foto tidak terbaca. Silakan pilih foto JPG/PNG/WebP yang valid.'));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari penyimpanan HP.'));
  });
}

/**
 * Mengunggah file gambar produk:
 * 1. Kompresi otomatis di browser/HP (dari 5MB-20MB menjadi JPEG ringan ~70KB).
 * 2. Upload file terkompresi ke Cloud Storage Supabase (cepat & anti-timeout).
 * 3. Jika koneksi bermasalah/offline, otomatis fallback ke Base64 terkompresi lokal.
 */
export async function uploadProductImageFile(
  file: File,
  storeSlug: string,
  productId: string
): Promise<string> {
  const safeSlug = (storeSlug || 'sr12-central').toLowerCase();

  // 1. Kompresi lokal di HP/perangkat
  let compressed: { blob: Blob; dataUrl: string };
  try {
    compressed = await compressImageToBlob(file, 800, 0.82);
  } catch (compErr) {
    console.warn('[CatalogService] Kompresi canvas gagal, mencoba fallback FileReader langsung:', compErr);
    const dataUrl = await compressImageToBase64(file, 800, 0.82);
    return dataUrl;
  }

  if (isDemoSessionActive()) {
    return compressed.dataUrl;
  }

  // 2. Upload file JPEG yang sudah ringan (~70KB) ke Supabase Cloud Storage
  try {
    const cleanProdId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanProdId}_${Date.now()}.jpg`;
    const filePath = `store_images/${safeSlug}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, compressed.blob, {
        cacheControl: '31536000',
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (!uploadError) {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      if (data && data.publicUrl) {
        return data.publicUrl;
      }
    } else {
      console.warn('[CatalogService] Supabase Storage uploadError:', uploadError.message);
    }
  } catch (cloudErr) {
    console.warn('[CatalogService] Cloud Storage gagal, otomatis menggunakan Base64 terkompresi:', cloudErr);
  }

  // 3. Fallback andal: kembalikan Data URL terkompresi (~70KB)
  return compressed.dataUrl;
}

/**
 * Menyimpan data kustomisasi produk langsung ke tabel PostgreSQL Supabase Database ('products') via RPC
 */
export async function saveProductToSupabaseDb(
  storeSlug: string,
  product: { id?: string; localId?: string; name: string; stock?: number; het?: number; image?: string; sku?: string; category?: string }
): Promise<void> {
  if (isDemoSessionActive()) return;
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

    // 4. Baca overrides lokal di perangkat ini untuk menjaga foto kustom & kustomisasi nama/harga
    const localOverrides = getStoreOverrides(safeSlug);

    // 5. Bangun katalog final dari Master SR12 Catalog dengan proteksi foto kustom & pengurangan stok akurat
    const masterCloned: Product[] = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));
    const finalCatalog = masterCloned.map(p => {
      const dbRow = dbProductMap.get(p.id) || dbProductMap.get(p.name.toLowerCase().trim());
      const ov = localOverrides[p.id] || localOverrides[p.sku];

      // Prioritas stok: Cloud DB -> Overrides lokal -> Master default
      const baseStock = (dbRow && typeof dbRow.stock === 'number')
        ? dbRow.stock
        : ((ov && typeof ov.stock === 'number') ? ov.stock : (p.stock ?? 50));
      const totalSold = soldQtyMap.get(p.id) || soldQtyMap.get(p.sku) || 0;
      const currentRemainingStock = Math.max(0, baseStock - totalSold);

      // Prioritas gambar: Cloud DB image_url -> Overrides lokal image -> Master default image
      // JANGAN PERNAH menimpa gambar kustom dengan dummy SVG jika user sudah pernah mengunggah foto!
      const finalImage = (dbRow?.image_url && typeof dbRow.image_url === 'string' && dbRow.image_url.trim())
        ? dbRow.image_url.trim()
        : ((ov?.image && typeof ov.image === 'string' && ov.image.trim()) ? ov.image.trim() : p.image);

      const finalHet = (dbRow?.het_price && Number(dbRow.het_price) > 0)
        ? Number(dbRow.het_price)
        : ((ov?.het && ov.het > 0) ? ov.het : p.het);

      const finalName = dbRow?.name || ov?.name || p.name;
      const finalSummary = ov?.summary || p.summary;

      return {
        ...p,
        name: finalName,
        stock: currentRemainingStock,
        image: finalImage,
        het: finalHet,
        price: finalHet,
        summary: finalSummary
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

  // 1. Simpan overrides lokal TERLEBIH DAHULU agar foto & kustomisasi langsung aman
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

  // 2. Simpan ke Supabase PostgreSQL Database via RPC
  saveProductToSupabaseDb(safeSlug, {
    name: updatedProduct.name,
    stock: updatedProduct.stock,
    localId: updatedProduct.id,
    sku: updatedProduct.sku,
    category: updatedProduct.category,
    het: updatedProduct.het,
    image: updatedProduct.image
  });

  // 3. Beri tanda skipCloudSync agar listener internal tidak menimpa katalog lokal
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:stock_updated', {
      detail: { storeSlug: safeSlug, product: updatedProduct, skipCloudSync: true }
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
      het: targetProd.het,
      image: targetProd.image
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
      detail: { storeSlug: safeSlug, productId, stock: newStock, skipCloudSync: true }
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

/**
 * Memutar susunan tampilan produk di etalase toko secara deterministik setiap hari (YYYY-MM-DD).
 * - Memberikan nuansa etalase toko yang selalu segar dan berganti setiap hari.
 * - Tetap stabil sepanjang hari tersebut (tidak melompat acak antar refresh halaman).
 * - Produk dengan stok ready (> 0) diprioritaskan di baris depan dibanding produk berstok 0.
 */
export function getDailyRotatedCatalog(list: Product[]): Product[] {
  if (!list || list.length <= 1) return list;

  const now = new Date();
  const seedNum = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  // Algoritma Mulberry32 (Deterministic Pseudo-Random Generator)
  let s = seedNum;
  const rng = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const readyItems: Product[] = [];
  const outOfStockItems: Product[] = [];

  list.forEach(p => {
    if (p.stock > 0) {
      readyItems.push(p);
    } else {
      outOfStockItems.push(p);
    }
  });

  const shuffle = (arr: Product[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  return [...shuffle(readyItems), ...shuffle(outOfStockItems)];
}
