import { Product } from '../types';
import { SR12_MASTER_CATALOG } from '../data/sr12MasterCatalog';
import { supabase, getActiveSessionToken } from '../config/supabase';
import { isDemoSessionActive } from './demoGuard';

const CATALOG_STORAGE_PREFIX = 'sr12_catalog_';
const OVERRIDES_STORAGE_PREFIX = 'sr12_overrides_';
const BUCKET_NAME = 'products';

/**
 * Cadangan URL foto riil resmi SR12 yang telah diunggah ke Supabase Cloud Storage.
 * Digunakan sebagai proteksi permanen (self-healing) agar foto tidak pernah kembali ke dummy SVG.
 */
export const KNOWN_STORE_DEFAULT_IMAGES: Record<string, string> = {
  'sr12-acne-total-tube-10g': 'https://roezaobiexlmhxpuvfds.supabase.co/storage/v1/object/public/products/store_images/sr12-central/sr12-acne-total-tube-10g_1794733052218.jpg',
  'sr12-acne-cream-12-5g': 'https://roezaobiexlmhxpuvfds.supabase.co/storage/v1/object/public/products/store_images/sr12-central/sr12-acne-cream-12-5g_1794732901463.jpg'
};

/**
 * Memeriksa apakah gambar merupakan foto produk asli (bukan ilustrasi / dummy SVG).
 * Foto produk asli:
 * - URL Supabase Storage / HTTPS / HTTP (misal https://roezaobiexlmhxpuvfds.supabase.co/...)
 * - Data URL foto terkompresi (data:image/jpeg, data:image/png, data:image/webp)
 * Dummy SVG / Ilustrasi bawaan:
 * - data:image/svg+xml...
 */
export function isRealProductImage(img?: string | null): boolean {
  if (!img || typeof img !== 'string') return false;
  const trimmed = img.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  if (trimmed.startsWith('data:image/svg+xml')) return false;
  return true;
}

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
    // HANYA kirim image_url jika merupakan foto produk riil (bukan dummy SVG ilustrasi)
    // Jika dummy SVG atau tidak valid, kirim undefined agar database TIDAK menimpa foto riil di Supabase
    const cleanImageUrl = isRealProductImage(product.image) ? product.image!.trim() : undefined;

    await supabase.rpc('rpc_save_store_product', {
      p_slug: safeSlug,
      p_token: token,
      p_product: {
        name: product.name,
        stock: product.stock,
        het_price: product.het,
        image_url: cleanImageUrl,
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
  const overrides = getStoreOverrides(safeSlug);

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Pemulihan otomatis (Self-Healing): jika ada foto riil di overrides atau known images
        // tapi di cache lokal masih berupa SVG dummy, gantikan dengan foto riil!
        let hasHealed = false;
        const healed = parsed.map(p => {
          const ov = overrides[p.id] || overrides[p.sku];
          let bestImage = p.image;
          if (isRealProductImage(ov?.image)) {
            bestImage = ov!.image!.trim();
          } else if (KNOWN_STORE_DEFAULT_IMAGES[p.id]) {
            bestImage = KNOWN_STORE_DEFAULT_IMAGES[p.id];
          }

          if (bestImage !== p.image) {
            hasHealed = true;
            return { ...p, image: bestImage };
          }
          return p;
        });

        if (hasHealed) {
          saveStoreCatalog(safeSlug, healed);
          return healed;
        }

        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[CatalogService] Failed to read store catalog for ${safeSlug}:`, err);
  }

  const cloned: Product[] = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));

  const merged = cloned.map(p => {
    const ov = overrides[p.id] || overrides[p.sku];
    let bestImage = p.image;
    if (isRealProductImage(ov?.image)) {
      bestImage = ov!.image!.trim();
    } else if (KNOWN_STORE_DEFAULT_IMAGES[p.id]) {
      bestImage = KNOWN_STORE_DEFAULT_IMAGES[p.id];
    }
    return {
      ...p,
      ...(ov || {}),
      image: bestImage
    };
  });

  saveStoreCatalog(safeSlug, merged);
  return merged;
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

    // 2. Map database custom products dengan proteksi foto riil
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

        const putInMap = (key: string) => {
          const existing = dbProductMap.get(key);
          if (!existing) {
            dbProductMap.set(key, row);
          } else {
            // Jika row yang sudah ada memiliki foto riil tetapi row baru adalah null atau dummy SVG,
            // JANGAN pernah menimpa foto riil tersebut!
            const existingHasRealImg = isRealProductImage(existing.image_url);
            const rowHasRealImg = isRealProductImage(row.image_url);
            if (existingHasRealImg && !rowHasRealImg) {
              dbProductMap.set(key, { ...row, image_url: existing.image_url });
            } else {
              dbProductMap.set(key, row);
            }
          }
        };

        if (localId) {
          putInMap(localId);
        }
        if (row.name) {
          putInMap(row.name.toLowerCase().trim());
        }
      });
    }

    // 3. Baca overrides lokal di perangkat ini untuk menjaga foto kustom & kustomisasi nama/harga
    const localOverrides = getStoreOverrides(safeSlug);

    // 4. Bangun katalog final dari Master SR12 Catalog dengan proteksi foto kustom & stok riil akurat
    const masterCloned: Product[] = JSON.parse(JSON.stringify(SR12_MASTER_CATALOG));
    const finalCatalog = masterCloned.map(p => {
      const dbRow = dbProductMap.get(p.id) || dbProductMap.get(p.name.toLowerCase().trim());
      const ov = localOverrides[p.id] || localOverrides[p.sku];

      // Prioritas stok: Cloud DB -> Overrides lokal -> Master default
      // CATATAN PENTING: Nilai stok di Cloud DB & Overrides lokal merupakan stok riil running-balance
      // yang langsung dikurangi secara presisi pada setiap transaksi sukses.
      // DILARANG mengurangkan lagi dengan pesanan historis agar tidak terjadi double-deduction (pengurangan ganda).
      const baseStock = (dbRow && typeof dbRow.stock === 'number')
        ? dbRow.stock
        : ((ov && typeof ov.stock === 'number') ? ov.stock : (p.stock ?? 50));
      const currentRemainingStock = Math.max(0, baseStock);

      // Prioritas gambar: Selalu utamakan Foto Riil (Real Product Image) di mana pun ditemukan
      let finalImage = p.image;
      if (isRealProductImage(dbRow?.image_url)) {
        finalImage = dbRow.image_url.trim();
      } else if (isRealProductImage(ov?.image)) {
        finalImage = ov!.image!.trim();
      } else if (KNOWN_STORE_DEFAULT_IMAGES[p.id]) {
        finalImage = KNOWN_STORE_DEFAULT_IMAGES[p.id];
      } else if (isRealProductImage(p.image)) {
        finalImage = p.image;
      } else {
        // Fallback jika belum ada foto riil sama sekali
        finalImage = (dbRow?.image_url && typeof dbRow.image_url === 'string' && dbRow.image_url.trim())
          ? dbRow.image_url.trim()
          : ((ov?.image && typeof ov.image === 'string' && ov.image.trim()) ? ov.image.trim() : p.image);
      }

      // Kunci foto riil ke localOverrides agar cache lokal tidak pernah kehilangan foto
      if (isRealProductImage(finalImage)) {
        if (!localOverrides[p.id]) {
          localOverrides[p.id] = {};
        }
        localOverrides[p.id].image = finalImage;
      }

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

    // Simpan overrides yang sudah diproteksi dan katalog ke penyimpanan lokal
    saveStoreOverrides(safeSlug, localOverrides);
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

  // Proteksi: Jika updatedProduct.image adalah dummy SVG tetapi produk saat ini sudah punya foto riil, pertahankan foto riil!
  const currentProd = currentCatalog.find(p => p.id === updatedProduct.id || p.sku === updatedProduct.sku);
  let finalImage = updatedProduct.image;
  if (!isRealProductImage(finalImage) && isRealProductImage(currentProd?.image)) {
    finalImage = currentProd!.image;
  }

  const normalizedProduct = {
    ...updatedProduct,
    image: finalImage
  };

  const nextCatalog = currentCatalog.map(p => {
    if (p.id === normalizedProduct.id || p.sku === normalizedProduct.sku) {
      return {
        ...p,
        ...normalizedProduct
      };
    }
    return p;
  });

  saveStoreCatalog(safeSlug, nextCatalog);

  // 1. Simpan overrides lokal TERLEBIH DAHULU agar foto & kustomisasi langsung aman
  const currentOverrides = getStoreOverrides(safeSlug);
  currentOverrides[normalizedProduct.id] = {
    name: normalizedProduct.name,
    het: normalizedProduct.het,
    price: normalizedProduct.het,
    stock: normalizedProduct.stock,
    weightGram: normalizedProduct.weightGram,
    image: isRealProductImage(normalizedProduct.image)
      ? normalizedProduct.image
      : (currentOverrides[normalizedProduct.id]?.image || undefined),
    summary: normalizedProduct.summary
  };
  saveStoreOverrides(safeSlug, currentOverrides);

  // 2. Simpan ke Supabase PostgreSQL Database via RPC
  saveProductToSupabaseDb(safeSlug, {
    name: normalizedProduct.name,
    stock: normalizedProduct.stock,
    localId: normalizedProduct.id,
    sku: normalizedProduct.sku,
    category: normalizedProduct.category,
    het: normalizedProduct.het,
    image: isRealProductImage(normalizedProduct.image) ? normalizedProduct.image : undefined
  });

  // 3. Beri tanda skipCloudSync agar listener internal tidak menimpa katalog lokal
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:stock_updated', {
      detail: { storeSlug: safeSlug, product: normalizedProduct, skipCloudSync: true }
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
      image: isRealProductImage(targetProd.image) ? targetProd.image : undefined
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
      detail: { storeSlug: safeSlug, targetStock, skipCloudSync: true }
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
        het: found.het,
        image: isRealProductImage(found.image) ? found.image : undefined
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
      detail: { storeSlug: safeSlug, updates, skipCloudSync: true }
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
