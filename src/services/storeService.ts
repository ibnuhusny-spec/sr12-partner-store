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
        feePayer: d.fee_payer || 'buyer',
        storeAdminPin: '1234',
        orderQuota: d.order_quota ?? 15,
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
    orderQuota: 15,
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
