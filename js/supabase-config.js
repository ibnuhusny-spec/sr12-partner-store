/**
 * SR12 PARTNER STORE - SUPABASE CLOUD INTEGRATION
 * Konfigurasi resmi Supabase Cloud untuk database multi-tenant & image storage
 */

const SUPABASE_URL = 'https://ogjlmzugeggnpavoiukv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9namxtenVnZWdnbnBhdm9pdWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNTczNDQsImV4cCI6MjEwNjYzMzM0NH0.5_93l0rvmpQv2J1-sGwMMWT8DuYyGyZn3wJx7N-o5L8';

let supaClient = null;

function initSupabaseClient() {
  if (supaClient) return supaClient;
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = supaClient;
      console.log('⚡ Supabase Cloud Connected successfully:', SUPABASE_URL);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
    }
  }
  return supaClient;
}

// Auto-init immediately if library is ready
initSupabaseClient();

/**
 * Upload gambar produk ke Supabase Storage (bucket: products)
 * @param {File} fileObj - File objek gambar dari input file
 * @param {string} storeSlug - Slug toko distributor
 * @returns {Promise<string>} URL publik gambar
 */
async function uploadProductImageToSupabase(fileObj, storeSlug = 'global') {
  const client = initSupabaseClient();
  if (!client) {
    throw new Error('Supabase client belum terinisialisasi!');
  }

  const fileExt = fileObj.name.split('.').pop();
  const fileName = `${storeSlug}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { data, error } = await client.storage
    .from('products')
    .upload(fileName, fileObj, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Supabase Storage Upload Error:', error);
    throw error;
  }

  const { data: publicUrlData } = client.storage
    .from('products')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

/**
 * Sinkronisasi data Toko Resmi dari Supabase Cloud
 */
async function syncStoresFromSupabase() {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('stores')
      .select('*');

    if (error) {
      console.warn('Supabase fetch stores error:', error);
      return null;
    }

    return (data || [])
      .filter(row => row && row.slug && row.slug !== 'sr12-central' && row.slug !== 'toko-supa-distributor' && !row.slug.startsWith('deleted_') && !row.slug.includes('toko-supa') && row.store_tagline !== '__deleted__')
      .map(row => ({
      slug: row.slug,
      storeName: row.store_name,
      storeTagline: row.store_tagline || '',
      storeTheme: row.store_theme || 'emerald',
      heroTitle: row.hero_title || row.store_name,
      heroSubtitle: row.hero_subtitle || '',
      heroBannerUrl: row.hero_banner_url || 'assets/hero-banner.jpg',
      storeLogoText: row.store_logo_text || 'SR12',
      storeLogoUrl: row.store_logo_url || '',
      storeWaNumber: row.store_wa_number || '',
      storeCity: row.store_city || '',
      storeOwner: row.store_owner || '',
      partnerTier: row.partner_tier || 'distributor',
      recommenderDistributor: row.recommender_distributor || '',
      recommenderWa: row.recommender_wa || '',
      recommenderSlug: row.recommender_slug || '',
      recommendationCode: row.recommendation_code || '',
      feePayer: row.fee_payer || 'buyer',
      storeAdminPin: row.store_admin_pin || '1234',
      orderQuota: typeof row.order_quota === 'number' ? row.order_quota : 15,
      walletBalance: typeof row.wallet_balance === 'number' ? row.wallet_balance : 10000,
      totalTopupPaid: typeof row.total_topup_paid === 'number' ? row.total_topup_paid : 0,
      totalTx: typeof row.total_tx === 'number' ? row.total_tx : 0,
      verifiedSkNumber: row.verified_sk_number || '',
      approvedAt: row.approved_at || row.created_at
    }));
  } catch (e) {
    console.warn('Exception fetching stores from Supabase:', e);
    return null;
  }
}

/**
 * Hapus Toko dari Supabase Cloud
 */
async function deleteStoreFromSupabase(slug) {
  const client = initSupabaseClient();
  if (!client || !slug || slug === 'sr12-central') return false;
  try {
    // 1. Berikan tanda __deleted__ pada store_tagline agar query filter tidak pernah menariknya lagi
    try {
      await client.from('stores').update({ store_tagline: '__deleted__' }).eq('slug', slug);
    } catch(tagErr) {}

    // 2. Hapus baris toko secara permanen dari tabel stores
    const { error } = await client
      .from('stores')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.warn('Supabase delete store error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Exception deleting store from Supabase:', e);
    return false;
  }
}

/**
 * Simpan/Update data Toko Resmi ke Supabase Cloud
 */
async function saveStoreToSupabase(store) {
  const client = initSupabaseClient();
  if (!client || !store || !store.slug || store.slug === 'sr12-central' || store.slug === 'toko-supa-distributor' || store.slug.startsWith('deleted_') || store.slug.includes('toko-supa')) return;
  try {
    const payload = {
      slug: store.slug,
      store_name: store.storeName,
      store_tagline: store.storeTagline,
      store_theme: store.storeTheme || 'emerald',
      hero_title: store.heroTitle,
      hero_subtitle: store.heroSubtitle,
      hero_banner_url: store.heroBannerUrl,
      store_logo_text: store.storeLogoText,
      store_logo_url: store.storeLogoUrl,
      store_wa_number: store.storeWaNumber,
      store_city: store.storeCity,
      store_owner: store.storeOwner,
      partner_tier: store.partnerTier,
      recommender_distributor: store.recommenderDistributor || '',
      recommender_wa: store.recommenderWa || '',
      recommender_slug: store.recommenderSlug || '',
      recommendation_code: store.recommendationCode || '',
      fee_payer: store.feePayer || 'buyer',
      store_admin_pin: store.storeAdminPin || '1234',
      order_quota: store.orderQuota || 15,
      wallet_balance: store.walletBalance || 10000,
      total_topup_paid: store.totalTopupPaid || 0,
      total_tx: store.totalTx || 0,
      verified_sk_number: store.verifiedSkNumber || '',
      approved_at: store.approvedAt || new Date().toISOString()
    };

    const { error } = await client
      .from('stores')
      .upsert(payload, { onConflict: 'slug' });

    if (error) {
      console.warn('Supabase upsert store error:', error);
    } else {
      console.log('✅ Berhasil sinkronisasi toko ke Supabase Cloud:', store.storeName);
    }
  } catch (e) {
    console.warn('Exception saving store to Supabase:', e);
  }
}

/**
 * Sinkronisasi data Pengajuan Buka Toko (Pending) dari Supabase Cloud
 */
async function syncPendingStoresFromSupabase() {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('pending_stores')
      .select('*');

    if (error) {
      console.warn('Supabase fetch pending stores error:', error);
      return null;
    }

    return (data || []).map(row => ({
      id: row.id,
      slug: row.slug,
      storeName: row.store_name,
      storeTagline: row.store_tagline || '',
      storeTheme: row.store_theme || 'emerald',
      heroTitle: row.hero_title || row.store_name,
      heroSubtitle: row.hero_subtitle || '',
      heroBannerUrl: row.hero_banner_url || 'assets/hero-banner.jpg',
      storeLogoText: row.store_logo_text || 'SR12',
      storeLogoUrl: row.store_logo_url || '',
      storeWaNumber: row.store_wa_number || '',
      storeCity: row.store_city || '',
      storeOwner: row.store_owner || '',
      partnerTier: row.partner_tier || 'distributor',
      storeAdminPin: row.store_admin_pin || '1234',
      nikNumber: row.nik_number || '',
      ktpDocUrl: row.ktp_doc_url || '',
      ktpDocName: row.ktp_doc_name || '',
      skNumber: row.sk_number || '',
      skDocUrl: row.sk_doc_url || '',
      skDocName: row.sk_doc_name || '',
      selfieDocUrl: row.selfie_doc_url || '',
      selfieDocName: row.selfie_doc_name || '',
      recommenderDistributor: row.recommender_distributor || '',
      recommenderWa: row.recommender_wa || '',
      recommenderSlug: row.recommender_slug || '',
      recommendationCode: row.recommendation_code || '',
      recommendationDocUrl: row.recommendation_doc_url || '',
      recommendationDocName: row.recommendation_doc_name || '',
      notes: row.notes || '',
      submittedAt: row.submitted_at,
      status: row.status || 'pending'
    }));
  } catch (e) {
    console.warn('Exception fetching pending stores from Supabase:', e);
    return null;
  }
}

/**
 * Simpan Pengajuan Toko Baru ke Supabase Cloud
 */
async function savePendingStoreToSupabase(app) {
  const client = initSupabaseClient();
  if (!client || !app || !app.id) return;
  try {
    const payload = {
      id: app.id,
      slug: app.slug,
      store_name: app.storeName,
      store_tagline: app.storeTagline,
      store_theme: app.storeTheme || 'emerald',
      hero_title: app.heroTitle,
      hero_subtitle: app.heroSubtitle,
      hero_banner_url: app.heroBannerUrl,
      store_logo_text: app.storeLogoText,
      store_logo_url: app.storeLogoUrl,
      store_wa_number: app.storeWaNumber,
      store_city: app.storeCity,
      store_owner: app.storeOwner,
      partner_tier: app.partnerTier,
      store_admin_pin: app.storeAdminPin || '1234',
      nik_number: app.nikNumber || '',
      ktp_doc_url: app.ktpDocUrl || '',
      ktp_doc_name: app.ktpDocName || '',
      sk_number: app.skNumber || '',
      sk_doc_url: app.skDocUrl || '',
      sk_doc_name: app.skDocName || '',
      selfie_doc_url: app.selfieDocUrl || '',
      selfie_doc_name: app.selfieDocName || '',
      recommender_distributor: app.recommenderDistributor || '',
      recommender_wa: app.recommenderWa || '',
      recommender_slug: app.recommenderSlug || '',
      recommendation_code: app.recommendationCode || '',
      recommendation_doc_url: app.recommendationDocUrl || '',
      recommendation_doc_name: app.recommendationDocName || '',
      notes: app.notes || '',
      submitted_at: app.submittedAt || new Date().toISOString(),
      status: app.status || 'pending'
    };

    const { error } = await client
      .from('pending_stores')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase upsert pending store error:', error);
    } else {
      console.log('✅ Berhasil mendaftarkan permohonan toko ke Supabase Cloud:', app.storeName);
    }
  } catch (e) {
    console.warn('Exception saving pending store to Supabase:', e);
  }
}

/**
 * Hapus Pengajuan Toko dari Supabase Cloud (Setelah Disetujui/Ditolak)
 */
async function deletePendingStoreFromSupabase(id) {
  const client = initSupabaseClient();
  if (!client || !id) return;
  try {
    const { error } = await client
      .from('pending_stores')
      .delete()
      .eq('id', id);

    if (error) console.warn('Supabase delete pending store error:', error);
  } catch (e) {
    console.warn('Exception deleting pending store from Supabase:', e);
  }
}

// Window global exports
window.initSupabaseClient = initSupabaseClient;
window.syncStoresFromSupabase = syncStoresFromSupabase;
window.saveStoreToSupabase = saveStoreToSupabase;
window.deleteStoreFromSupabase = deleteStoreFromSupabase;
window.syncPendingStoresFromSupabase = syncPendingStoresFromSupabase;
window.savePendingStoreToSupabase = savePendingStoreToSupabase;
window.deletePendingStoreFromSupabase = deletePendingStoreFromSupabase;
window.uploadProductImageToSupabase = uploadProductImageToSupabase;
