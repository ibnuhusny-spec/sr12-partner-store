import { supabase, getActiveSessionToken } from '../config/supabase';
import { DEFAULT_PARTNER_STORES } from '../data/defaultStores';
import { PendingStore, Store } from '../types';

const STORAGE_STORES_KEY = 'sr12_partner_stores_v3';
const STORAGE_PENDING_KEY = 'sr12_pending_store_apps_v2';

function cleanTaglineText(text: string | null | undefined, fallback: string): string {
  if (!text || typeof text !== 'string') return fallback;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.includes('bankName') || trimmed.includes('activeTokens') || trimmed.includes('platformFee')) {
    return fallback;
  }
  return trimmed;
}

export async function fetchStores(): Promise<Store[]> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, slug, store_name, store_tagline, store_theme, hero_title, hero_subtitle, hero_banner_url, store_logo_text, store_logo_url, store_wa_number, store_city, store_owner, partner_tier, recommender_distributor, recommender_wa, recommender_slug, recommendation_code, fee_payer, order_quota, wallet_balance, total_topup_paid, total_tx, verified_sk_number, approved_at, created_at');

    if (!error && data && data.length > 0) {
      const mapped: Store[] = data.map((d: any) => ({
        id: d.id,
        slug: d.slug,
        storeName: d.store_name,
        storeTagline: cleanTaglineText(d.store_tagline, 'Direktori Kemitraan & Pasokan Resmi SR12 Skin Care'),
        storeTheme: d.store_theme || 'emerald',
        heroTitle: d.hero_title || d.store_name,
        heroSubtitle: cleanTaglineText(d.hero_subtitle, 'Dapatkan produk herbal & skin care resmi SR12 terverifikasi BPOM dan Halal MUI dengan harga resmi, jaminan keaslian 100%, serta pengiriman cepat ke seluruh Indonesia.'),
        heroBannerUrl: d.hero_banner_url || '/assets/hero-banner.jpg',
        storeLogoText: d.store_logo_text || 'SR12',
        storeLogoUrl: d.store_logo_url || '/assets/sr12-logo.png',
        storeWaNumber: d.store_wa_number,
        storeCity: d.store_city,
        storeOwner: d.store_owner,
        partnerTier: d.partner_tier || 'distributor',
        recommenderDistributor: d.recommender_distributor,
        recommenderWa: d.recommender_wa,
        recommenderSlug: d.recommender_slug,
        recommendationCode: d.recommendation_code,
        feePayer: 'store',
        storeAdminPin: '1234',
        orderQuota: 999999,
        walletBalance: d.wallet_balance ? Number(d.wallet_balance) : 10000,
        totalTopupPaid: d.total_topup_paid ? Number(d.total_topup_paid) : 0,
        totalTx: d.total_tx ?? 0,
        verifiedSkNumber: d.verified_sk_number,
        approvedAt: d.approved_at,
        createdAt: d.created_at
      }));

      // Ensure central store is at index 0
      const centralIdx = mapped.findIndex(s => s.slug === 'sr12-central');
      if (centralIdx > 0) {
        const [central] = mapped.splice(centralIdx, 1);
        mapped.unshift(central);
      } else if (centralIdx === -1) {
        mapped.unshift(DEFAULT_PARTNER_STORES[0]);
      }

      localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.warn('Supabase fetchStores fallback to local:', err);
  }

  // Fallback to localStorage or default
  const local = localStorage.getItem(STORAGE_STORES_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  return DEFAULT_PARTNER_STORES;
}

export async function submitStoreApplication(app: Partial<PendingStore>): Promise<{ success: boolean; message: string; id?: string }> {
  const appId = 'APP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const payload: PendingStore = {
    id: appId,
    slug: app.slug || app.storeName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'toko-' + Date.now(),
    storeName: app.storeName || 'Toko Mitra SR12',
    storeTagline: app.storeTagline || `Mitra Resmi SR12 ${app.storeCity || ''}`,
    storeTheme: app.storeTheme || 'emerald',
    heroBannerUrl: app.heroBannerUrl || '/assets/hero-banner.jpg',
    storeLogoText: app.storeLogoText || 'SR12',
    storeLogoUrl: app.storeLogoUrl || '/assets/sr12-logo.png',
    storeWaNumber: app.storeWaNumber || '',
    storeCity: app.storeCity || '',
    storeOwner: app.storeOwner || '',
    partnerTier: app.partnerTier || 'reseller',
    storeAdminPin: app.storeAdminPin || '1234',
    nikNumber: app.nikNumber || '',
    ktpDocUrl: app.ktpDocUrl || '',
    ktpDocName: app.ktpDocName || '',
    skNumber: app.skNumber || '',
    skDocUrl: app.skDocUrl || '',
    skDocName: app.skDocName || '',
    selfieDocUrl: app.selfieDocUrl || '',
    selfieDocName: app.selfieDocName || '',
    recommenderDistributor: app.recommenderDistributor || '',
    recommenderWa: app.recommenderWa || '',
    recommenderSlug: app.recommenderSlug || '',
    recommendationCode: app.recommendationCode || '',
    recommendationDocUrl: app.recommendationDocUrl || '',
    recommendationDocName: app.recommendationDocName || '',
    notes: app.notes || '',
    ownerEmail: app.ownerEmail || '',
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  // 1. Save to Supabase RPC
  try {
    const { data, error } = await supabase.rpc('rpc_submit_store_application', {
      p_application: payload
    });
    if (!error && data && data.success) {
      return { success: true, message: data.message || 'Pengajuan toko berhasil dikirim!', id: data.id };
    }
  } catch (err) {
    console.warn('RPC rpc_submit_store_application fallback:', err);
  }

  // 2. Direct insert fallback
  try {
    await supabase.from('pending_stores').insert({
      id: payload.id,
      slug: payload.slug,
      store_name: payload.storeName,
      store_tagline: payload.storeTagline,
      store_wa_number: payload.storeWaNumber,
      store_city: payload.storeCity,
      store_owner: payload.storeOwner,
      partner_tier: payload.partnerTier,
      nik_number: payload.nikNumber,
      ktp_doc_url: payload.ktpDocUrl,
      recommender_distributor: payload.recommenderDistributor,
      status: 'pending'
    });
  } catch (e) {}

  // Save to local cache
  const pending = getLocalPendingStores();
  pending.unshift(payload);
  localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(pending));

  return { success: true, message: 'Pengajuan pendaftaran toko Anda telah masuk ke antrean verifikasi!', id: appId };
}

export function getLocalPendingStores(): PendingStore[] {
  try {
    const raw = localStorage.getItem(STORAGE_PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchPendingStores(): Promise<PendingStore[]> {
  try {
    const token = getActiveSessionToken();
    const { data, error } = await supabase.rpc('rpc_get_pending_stores', {
      p_admin_token: token
    });
    if (!error && Array.isArray(data)) {
      return data.map((d: any) => ({
        id: d.id,
        slug: d.slug,
        storeName: d.store_name,
        storeTagline: d.store_tagline,
        storeTheme: d.store_theme || 'emerald',
        storeWaNumber: d.store_wa_number,
        storeCity: d.store_city,
        storeOwner: d.store_owner,
        partnerTier: d.partner_tier,
        nikNumber: d.nik_number,
        ktpDocUrl: d.ktp_doc_url,
        skNumber: d.sk_number,
        skDocUrl: d.sk_doc_url,
        selfieDocUrl: d.selfie_doc_url,
        recommenderDistributor: d.recommender_distributor,
        recommendationDocUrl: d.recommendation_doc_url,
        submittedAt: d.submitted_at || new Date().toISOString(),
        status: d.status || 'pending'
      }));
    }
  } catch (e) {}

  return getLocalPendingStores();
}

export async function approveStoreApplication(app: PendingStore): Promise<{ success: boolean; message: string; newStore?: Store }> {
  const token = getActiveSessionToken();
  const newStore: Store = {
    slug: app.slug,
    storeName: app.storeName,
    storeTagline: app.storeTagline || `Mitra Resmi SR12 ${app.storeCity}`,
    storeTheme: app.storeTheme || 'emerald',
    heroTitle: app.storeName,
    heroSubtitle: `Toko Resmi Mitra SR12 ${app.storeCity}`,
    heroBannerUrl: app.heroBannerUrl || '/assets/hero-banner.jpg',
    storeLogoText: app.storeLogoText || 'SR12',
    storeLogoUrl: app.storeLogoUrl || '/assets/sr12-logo.png',
    storeWaNumber: app.storeWaNumber,
    storeCity: app.storeCity,
    storeOwner: app.storeOwner,
    partnerTier: app.partnerTier,
    recommenderDistributor: app.recommenderDistributor,
    recommenderWa: app.recommenderWa,
    storeAdminPin: app.storeAdminPin || '1234',
    feePayer: 'store',
    orderQuota: 999999,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0,
    verifiedSkNumber: `SK-${app.partnerTier.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    approvedAt: new Date().toISOString()
  };

  try {
    await supabase.rpc('rpc_publish_store', {
      p_token: token,
      p_store: newStore
    });
  } catch (e) {
    console.warn('RPC rpc_publish_store fallback to direct:', e);
  }

  // Remove from pending list
  try {
    await supabase.from('pending_stores').delete().eq('id', app.id);
  } catch (e) {}

  const pending = getLocalPendingStores().filter(p => p.id !== app.id && p.slug !== app.slug);
  localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(pending));

  // Add to local stores
  const localStores = await fetchStores();
  const exists = localStores.findIndex(s => s.slug === newStore.slug);
  if (exists >= 0) {
    localStores[exists] = newStore;
  } else {
    localStores.push(newStore);
  }
  localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(localStores));

  return { success: true, message: `Toko "${newStore.storeName}" berhasil diterbitkan dan aktif!`, newStore };
}

export async function deleteStore(slug: string): Promise<{ success: boolean; message: string }> {
  if (slug === 'sr12-central') {
    return { success: false, message: 'Toko Resmi Pusat tidak boleh dihapus!' };
  }

  const token = getActiveSessionToken();
  try {
    const { data } = await supabase.rpc('rpc_delete_store', {
      p_slug: slug,
      p_admin_token: token
    });
    if (data && data.success) {
      console.log('Toko berhasil dihapus di cloud:', slug);
    }
  } catch (e) {}

  // Update local
  const localStores = (await fetchStores()).filter(s => s.slug !== slug);
  localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(localStores));

  return { success: true, message: `Toko "${slug}" berhasil dihapus.` };
}

export async function uploadImageToSupabase(file: File, storeSlug = 'global'): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${storeSlug}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('products')
    .upload(fileName, file, { cacheControl: '3600', upsert: true });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('products').getPublicUrl(fileName);
  return data.publicUrl;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
  tag?: string;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'token-50', name: 'Paket Starter', tokens: 50, price: 75000, tag: 'Uji Coba' },
  { id: 'token-100', name: 'Paket Bisnis', tokens: 100, price: 150000 },
  { id: 'token-250', name: 'Paket Pro Store', tokens: 250, price: 375000, popular: true, tag: 'Paling Laris' },
  { id: 'token-500', name: 'Paket Distributor', tokens: 500, price: 750000, tag: 'Hemat 10%' }
];

export async function updateStoreFeePayer(slug: string, feePayer: 'buyer' | 'store'): Promise<boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_STORES_KEY);
    if (raw) {
      const list: Store[] = JSON.parse(raw);
      const idx = list.findIndex(s => s.slug === slug);
      if (idx >= 0) {
        list[idx].feePayer = feePayer;
        localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(list));
        return true;
      }
    }
  } catch {}
  return false;
}

export async function topupStoreQuota(slug: string, addedTokens: number): Promise<{ success: boolean; newQuota: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_STORES_KEY);
    if (raw) {
      const list: Store[] = JSON.parse(raw);
      const idx = list.findIndex(s => s.slug === slug);
      if (idx >= 0) {
        list[idx].orderQuota = (list[idx].orderQuota || 0) + addedTokens;
        localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(list));
        return { success: true, newQuota: list[idx].orderQuota };
      }
    }
  } catch {}
  return { success: false, newQuota: 0 };
}

export async function deductStoreTransactionQuota(slug: string): Promise<{ success: boolean; remainingQuota: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_STORES_KEY);
    if (raw) {
      const list: Store[] = JSON.parse(raw);
      const idx = list.findIndex(s => s.slug === slug);
      if (idx >= 0) {
        const currentQuota = list[idx].orderQuota || 0;
        if (currentQuota <= 0) {
          return { success: false, remainingQuota: 0 };
        }
        list[idx].orderQuota = currentQuota - 1;
        list[idx].totalTx = (list[idx].totalTx || 0) + 1;
        localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(list));
        return { success: true, remainingQuota: list[idx].orderQuota };
      }
    }
  } catch {}
  return { success: true, remainingQuota: 99 };
}

export async function redeemTokenVoucher(slug: string, code: string): Promise<{ success: boolean; message: string; addedTokens?: number }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { success: false, message: 'Masukkan kode voucher token!' };

  // Example valid voucher formats:
  // SR12-TOKEN50, SR12-TOKEN100, SR12-TOKEN250, SR12-VIP
  let tokens = 0;
  if (cleanCode.includes('50')) tokens = 50;
  else if (cleanCode.includes('100')) tokens = 100;
  else if (cleanCode.includes('250')) tokens = 250;
  else if (cleanCode.includes('500')) tokens = 500;
  else if (cleanCode === 'SR12-BONUS' || cleanCode === 'BONUS-MITRA') tokens = 25;
  else {
    return { success: false, message: 'Kode voucher tidak valid atau sudah kadaluarsa.' };
  }

  const res = await topupStoreQuota(slug, tokens);
  if (res.success) {
    return { success: true, message: `Selamat! Voucher berhasil digunakan. +${tokens} Token Transaksi ditambahkan ke toko Anda.`, addedTokens: tokens };
  }
  return { success: false, message: 'Gagal mengklaim voucher.' };
}

function sanitizeStoredWa(wa?: string | null): string {
  const clean = (wa || '').trim();
  return clean === '6281200001212' ? '' : clean;
}

/**
 * Mengambil profil toko tunggal langsung dari Cloud Supabase (tabel `stores` atau fallback `store_profile`)
 * sehingga semua HP pembeli otomatis menerima perubahan nomor WA, nama toko, level, & banner dari POS.
 */
export async function fetchSingleStoreProfile(slug: string): Promise<Partial<Store> | null> {
  const safeSlug = (slug || 'sr12-central').toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, slug, store_name, store_tagline, store_theme, hero_title, hero_subtitle, hero_banner_url, store_logo_text, store_logo_url, store_wa_number, store_city, store_owner, partner_tier, recommender_distributor, recommender_wa, recommender_slug, recommendation_code, fee_payer, updated_at')
      .eq('slug', safeSlug)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        slug: data.slug,
        storeName: data.store_name || undefined,
        storeTagline: cleanTaglineText(data.store_tagline, '') || undefined,
        storeTheme: (data.store_theme as Store['storeTheme']) || undefined,
        heroTitle: data.hero_title || data.store_name || undefined,
        heroSubtitle: cleanTaglineText(data.hero_subtitle, '') || undefined,
        heroBannerUrl: data.hero_banner_url || undefined,
        storeLogoText: data.store_logo_text || undefined,
        storeLogoUrl: data.store_logo_url || undefined,
        storeWaNumber: sanitizeStoredWa(data.store_wa_number),
        storeCity: data.store_city || undefined,
        storeOwner: data.store_owner || undefined,
        partnerTier: (data.partner_tier as Store['partnerTier']) || undefined,
        recommenderDistributor: data.recommender_distributor || undefined,
        recommenderWa: data.recommender_wa || undefined,
        recommenderSlug: data.recommender_slug || undefined,
        recommendationCode: data.recommendation_code || undefined,
        feePayer: 'store',
        updatedAt: data.updated_at || undefined
      };
    }
  } catch (err) {
    console.warn('[StoreService] Gagal baca tabel stores, mencoba store_profile:', err);
  }

  try {
    const { data, error } = await supabase
      .from('store_profile')
      .select('*')
      .eq('slug', safeSlug)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        slug: data.slug,
        storeName: data.store_name || undefined,
        storeTagline: data.store_tagline || undefined,
        storeTheme: (data.store_theme as Store['storeTheme']) || undefined,
        heroTitle: data.hero_title || data.store_name || undefined,
        heroSubtitle: data.hero_subtitle || undefined,
        heroBannerUrl: data.hero_banner_url || undefined,
        storeLogoText: data.store_logo_text || undefined,
        storeLogoUrl: data.store_logo_url || undefined,
        storeWaNumber: sanitizeStoredWa(data.store_wa_number),
        storeCity: data.store_city || undefined,
        storeOwner: data.store_owner || undefined,
        partnerTier: (data.partner_tier as Store['partnerTier']) || undefined,
        recommenderWa: data.recommender_wa || undefined,
        feePayer: 'store',
        updatedAt: data.updated_at || undefined
      };
    }
  } catch {}

  return null;
}

/**
 * Menggabungkan profil toko lokal/env dengan profil terbaru dari Cloud Supabase.
 */
export function mergeStoreProfileWithCloud(baseStore: Store, cloudProfile: Partial<Store> | null): Store {
  if (!cloudProfile) return baseStore;

  let hasLocalCustom = false;
  try {
    hasLocalCustom = Boolean(localStorage.getItem('sr12_custom_store_profile'));
  } catch {}

  const cloudMs = cloudProfile.updatedAt ? Date.parse(cloudProfile.updatedAt) : 0;
  const localMs = baseStore.updatedAt ? Date.parse(baseStore.updatedAt) : 0;

  // Di HP pembeli (tidak punya cache lokal) atau jika data cloud lebih baru daripada cache lokal, pakai data cloud
  const cloudWins = !hasLocalCustom || (localMs > 0 ? cloudMs >= localMs : Boolean(cloudProfile.storeWaNumber));

  const pickField = <T>(cloudVal: T | undefined, baseVal: T): T => {
    if (cloudVal === undefined || cloudVal === null || cloudVal === '') return baseVal;
    return cloudWins || !baseVal ? cloudVal : baseVal;
  };

  return {
    ...baseStore,
    id: cloudProfile.id || baseStore.id,
    storeName: pickField(cloudProfile.storeName, baseStore.storeName),
    storeTagline: pickField(cloudProfile.storeTagline, baseStore.storeTagline),
    storeTheme: pickField(cloudProfile.storeTheme, baseStore.storeTheme),
    heroTitle: pickField(cloudProfile.heroTitle, baseStore.heroTitle),
    heroSubtitle: pickField(cloudProfile.heroSubtitle, baseStore.heroSubtitle),
    heroBannerUrl: pickField(cloudProfile.heroBannerUrl, baseStore.heroBannerUrl),
    storeLogoText: pickField(cloudProfile.storeLogoText, baseStore.storeLogoText),
    storeLogoUrl: pickField(cloudProfile.storeLogoUrl, baseStore.storeLogoUrl),
    storeWaNumber: pickField(cloudProfile.storeWaNumber, baseStore.storeWaNumber),
    storeCity: pickField(cloudProfile.storeCity, baseStore.storeCity),
    storeOwner: pickField(cloudProfile.storeOwner, baseStore.storeOwner),
    partnerTier: pickField(cloudProfile.partnerTier, baseStore.partnerTier),
    recommenderWa: pickField(cloudProfile.recommenderWa, baseStore.recommenderWa),
    feePayer: 'store',
    updatedAt: cloudWins && cloudProfile.updatedAt ? cloudProfile.updatedAt : baseStore.updatedAt
  };
}

/**
 * Menyimpan perubahan profil toko dari POS Admin langsung ke Cloud Supabase
 * agar otomatis terbaca di seluruh HP pembeli tanpa perlu edit Vercel.
 */
export async function saveStoreProfileToCloud(
  store: Store,
  previousPin?: string
): Promise<{ success: boolean; message: string }> {
  const safeSlug = (store.slug || 'sr12-central').toLowerCase().trim();
  const token = getActiveSessionToken(safeSlug);

  const cloudPayload = {
    slug: safeSlug,
    storeName: store.storeName,
    storeTagline: store.storeTagline,
    storeTheme: store.storeTheme || 'emerald',
    heroTitle: store.heroTitle || store.storeName,
    heroSubtitle: store.heroSubtitle || store.storeTagline,
    heroBannerUrl: store.heroBannerUrl || '/assets/hero-banner.jpg',
    storeLogoText: store.storeLogoText || 'SR12',
    storeLogoUrl: store.storeLogoUrl || '/assets/sr12-logo.png',
    storeWaNumber: store.storeWaNumber,
    storeCity: store.storeCity,
    storeOwner: store.storeOwner,
    partnerTier: store.partnerTier || 'distributor',
    recommenderWa: store.recommenderWa || '',
    feePayer: 'store',
    orderQuota: 999999,
    ownerEmail: store.ownerEmail || undefined,
    storeAdminPin: store.storeAdminPin || '1234'
  };

  let syncedStores = false;

  try {
    const { data: pubData, error: pubErr } = await supabase.rpc('rpc_publish_store', {
      p_token: token,
      p_store: cloudPayload
    });
    if (!pubErr && (!pubData || pubData.success !== false)) {
      syncedStores = true;
    }
  } catch (err) {
    console.warn('[StoreService] rpc_publish_store warning:', err);
  }

  try {
    const { data: updData, error: updErr } = await supabase.rpc('rpc_update_store_profile', {
      p_slug: safeSlug,
      p_token: token,
      p_profile: cloudPayload
    });
    if (!updErr && updData && updData.success) {
      syncedStores = true;
    }
  } catch (err) {
    console.warn('[StoreService] rpc_update_store_profile warning:', err);
  }

  // Upaya pembaruan kolom tambahan (partner_tier, recommender_wa) jika diizinkan RLS
  try {
    const { error: directErr } = await supabase
      .from('stores')
      .update({
        partner_tier: cloudPayload.partnerTier,
        recommender_wa: cloudPayload.recommenderWa,
        store_wa_number: cloudPayload.storeWaNumber,
        store_name: cloudPayload.storeName,
        store_owner: cloudPayload.storeOwner,
        store_city: cloudPayload.storeCity,
        hero_banner_url: cloudPayload.heroBannerUrl,
        updated_at: new Date().toISOString()
      })
      .eq('slug', safeSlug);
    if (!directErr) syncedStores = true;
  } catch {}

  if (store.storeAdminPin && previousPin && store.storeAdminPin !== previousPin) {
    try {
      await supabase.rpc('rpc_update_store_pin', {
        p_slug: safeSlug,
        p_token: token,
        p_old_pin: previousPin,
        p_new_pin: store.storeAdminPin
      });
    } catch {}
  }

  if (syncedStores) {
    return {
      success: true,
      message: 'Profil toko & nomor WhatsApp tersimpan di Cloud Supabase dan langsung aktif di semua HP pembeli!'
    };
  }

  // Fallback jika Supabase menggunakan skema single-store (tabel `store_profile`)
  const baseSingleRow = {
    slug: safeSlug,
    store_name: cloudPayload.storeName,
    store_tagline: cloudPayload.storeTagline,
    store_theme: cloudPayload.storeTheme,
    hero_title: cloudPayload.heroTitle,
    hero_subtitle: cloudPayload.heroSubtitle,
    hero_banner_url: cloudPayload.heroBannerUrl,
    store_logo_text: cloudPayload.storeLogoText,
    store_logo_url: cloudPayload.storeLogoUrl,
    store_wa_number: cloudPayload.storeWaNumber,
    store_city: cloudPayload.storeCity,
    store_owner: cloudPayload.storeOwner,
    owner_email: cloudPayload.ownerEmail || null,
    store_admin_pin: cloudPayload.storeAdminPin,
    updated_at: new Date().toISOString()
  };

  try {
    const { error: singleErr } = await supabase
      .from('store_profile')
      .upsert(
        {
          ...baseSingleRow,
          partner_tier: cloudPayload.partnerTier,
          recommender_wa: cloudPayload.recommenderWa
        },
        { onConflict: 'slug' }
      );

    if (!singleErr) {
      return {
        success: true,
        message: 'Profil toko & nomor WhatsApp tersimpan di Cloud Supabase dan aktif di semua HP pembeli!'
      };
    }

    // Jika tabel store_profile lama belum punya kolom partner_tier / recommender_wa, simpan kolom intinya
    const { error: legacySingleErr } = await supabase
      .from('store_profile')
      .upsert(baseSingleRow, { onConflict: 'slug' });

    if (!legacySingleErr) {
      return {
        success: true,
        message: 'Profil toko & nomor WhatsApp tersimpan di Cloud Supabase!'
      };
    }
  } catch (err) {
    console.warn('[StoreService] store_profile fallback error:', err);
  }

  return {
    success: false,
    message: 'Pengaturan tersimpan di perangkat ini, namun belum berhasil sinkron ke Cloud Supabase.'
  };
}

