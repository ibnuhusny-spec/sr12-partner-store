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
    // 1. Hapus dari tabel stores
    const { error } = await client
      .from('stores')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.warn('Supabase delete store error:', error);
    }

    // 2. Hapus dari tabel pending_stores jika ada berkas terkait
    try {
      await client.from('pending_stores').delete().eq('slug', slug);
    } catch(pErr) {}

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

/**
 * Realtime Listener untuk sinkronisasi otomatis instan antar perangkat (HP & Laptop)
 */
function subscribeToStoreChanges(onStoreChanged) {
  const client = initSupabaseClient();
  if (!client || typeof client.channel !== 'function') return null;
  try {
    const channel = client.channel('sr12-cloud-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, (payload) => {
        console.log('⚡ [Realtime Cloud] Perubahan Toko Terdeteksi:', payload.eventType);
        if (typeof onStoreChanged === 'function') onStoreChanged(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_stores' }, (payload) => {
        console.log('⚡ [Realtime Cloud] Perubahan Antrean Terdeteksi:', payload.eventType);
        if (typeof onStoreChanged === 'function') onStoreChanged(payload);
      })
      .subscribe();
    return channel;
  } catch (e) {
    console.warn('Realtime subscription warning:', e);
    return null;
  }
}

/**
 * Sinkronisasi data Mitra Binaan (Agen, Sub Agen, Reseller, Marketer) dari Supabase Cloud
 */
async function syncMitraFromSupabase(storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    let query = client.from('mitra_downlines').select('*');
    if (storeSlug) {
      query = query.eq('store_slug', storeSlug);
    }
    const { data, error } = await query;
    if (error) {
      // Tabel belum ada atau belum dimigrasi di cloud, fallback lokal
      return null;
    }
    return (data || []).map(row => ({
      id: row.partner_code || row.id,
      name: row.name,
      phone: row.phone,
      city: row.city || '',
      tier: row.tier || 'reseller',
      bankName: row.bank_name || 'BCA',
      bankAccount: row.bank_account || '-',
      bankHolder: row.bank_holder || row.name,
      qualificationDate: row.qualification_date || row.created_at,
      lastOrderDate: row.last_order_date || row.created_at,
      accumulatedSpent90Days: Number(row.accumulated_spent_90_days) || 0,
      totalOrdersCount: Number(row.total_orders_count) || 0,
      status: row.status || 'active'
    }));
  } catch (e) {
    return null;
  }
}

/**
 * Simpan / Update Mitra ke Supabase Cloud
 */
async function saveMitraToSupabase(mitra, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !mitra || !mitra.id) return;
  try {
    const payload = {
      store_slug: storeSlug,
      partner_code: mitra.id,
      name: mitra.name,
      phone: mitra.phone,
      city: mitra.city || '',
      tier: mitra.tier || 'reseller',
      bank_name: mitra.bankName || 'BCA',
      bank_account: mitra.bankAccount || '-',
      bank_holder: mitra.bankHolder || mitra.name,
      qualification_date: mitra.qualificationDate || new Date().toISOString().split('T')[0],
      last_order_date: mitra.lastOrderDate || new Date().toISOString().split('T')[0],
      accumulated_spent_90_days: mitra.accumulatedSpent90Days || 0,
      total_orders_count: mitra.totalOrdersCount || 0,
      status: mitra.status || 'active'
    };
    await client.from('mitra_downlines').upsert(payload, { onConflict: 'store_slug,partner_code' });
  } catch (e) {}
}

/**
 * Hapus Mitra dari Supabase Cloud
 */
async function deleteMitraFromSupabase(partnerCode, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !partnerCode) return;
  try {
    await client.from('mitra_downlines').delete().match({ store_slug: storeSlug, partner_code: partnerCode });
  } catch (e) {}
}

/**
 * Sinkronisasi data Penjualan Marketer dari Supabase Cloud
 */
async function syncMarketerSalesFromSupabase(storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    let query = client.from('marketer_sales').select('*');
    if (storeSlug) {
      query = query.eq('store_slug', storeSlug);
    }
    const { data, error } = await query;
    if (error) return null;
    return (data || []).map(row => ({
      orderId: row.order_id,
      marketerId: row.marketer_id,
      date: row.order_date,
      monthPeriod: row.month_period,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerAddress: row.customer_address,
      fulfillmentType: row.fulfillment_type,
      itemsSummary: row.items_desc,
      omsetHet: Number(row.omset_het) || 0,
      commissionPct: Number(row.commission_pct) || 15,
      commissionAmount: Number(row.commission_amount) || 0,
      paidStatus: row.paid_status || 'unpaid',
      paidDate: row.paid_date
    }));
  } catch (e) {
    return null;
  }
}

/**
 * Simpan Catatan Penjualan Marketer ke Supabase Cloud
 */
async function saveMarketerSaleToSupabase(sale, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !sale || !sale.orderId) return;
  try {
    const payload = {
      store_slug: storeSlug,
      order_id: sale.orderId,
      marketer_id: sale.marketerId,
      order_date: sale.date || new Date().toISOString().split('T')[0],
      month_period: sale.monthPeriod || new Date().toISOString().slice(0, 7),
      customer_name: sale.customerName || 'Pembeli',
      customer_phone: sale.customerPhone || '-',
      customer_address: sale.customerAddress || '-',
      fulfillment_type: sale.fulfillmentType || 'pickup',
      items_desc: sale.itemsSummary || '-',
      omset_het: sale.omsetHet || 0,
      commission_pct: sale.commissionPct || 15,
      commission_amount: sale.commissionAmount || 0,
      paid_status: sale.paidStatus || 'unpaid',
      paid_date: sale.paidDate || null
    };
    await client.from('marketer_sales').upsert(payload, { onConflict: 'store_slug,order_id' });
  } catch (e) {}
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
window.subscribeToStoreChanges = subscribeToStoreChanges;
window.syncMitraFromSupabase = syncMitraFromSupabase;
window.saveMitraToSupabase = saveMitraToSupabase;
window.deleteMitraFromSupabase = deleteMitraFromSupabase;
window.syncMarketerSalesFromSupabase = syncMarketerSalesFromSupabase;
window.saveMarketerSaleToSupabase = saveMarketerSaleToSupabase;

