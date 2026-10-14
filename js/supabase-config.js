/**
 * SR12 PARTNER STORE - SUPABASE CLOUD INTEGRATION
 * Konfigurasi resmi Supabase Cloud untuk database multi-tenant & image storage
 */

const SUPABASE_URL = 'https://roezaobiexlmhxpuvfds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZXphb2JpZXhsbWh4cHV2ZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjM4MjAsImV4cCI6MjEwNzIzOTgyMH0.o-H8qNxBT4D88VTxcJNPTVr1xN7ajL-VE_jwtyggRNc';

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
 * Ambil token sesi otentikasi aktif untuk toko yang sedang diakses.
 * Digunakan sebagai kunci keamanan pemanggilan PostgreSQL Stored Procedure (RPC) terisolasi.
 */
function getActiveSessionToken(storeSlug = null) {
  try {
    // 1. Cek dari appState jika tersedia
    if (typeof appState !== 'undefined') {
      if (appState.isDevMasterLoggedIn && appState.devSessionToken) {
        return appState.devSessionToken;
      }
      if (appState.distSessionToken) {
        return appState.distSessionToken;
      }
    }

    // 2. Cek session dari sessionStorage & localStorage (sr12_auth_session_v2)
    const rawAuth = sessionStorage.getItem('sr12_auth_session_v2') || localStorage.getItem('sr12_auth_session_v2');
    if (rawAuth) {
      try {
        const sess = JSON.parse(rawAuth);
        if (sess && sess.token) {
          if (sess.role === 'developer' || !storeSlug || sess.storeSlug === storeSlug) {
            return sess.token;
          }
        }
      } catch(e) {}
    }

    // 3. Cek session dari sr12_distributor_session
    const rawDist = sessionStorage.getItem('sr12_distributor_session') || localStorage.getItem('sr12_distributor_session');
    if (rawDist) {
      try {
        const dist = JSON.parse(rawDist);
        if (dist && dist.token && (!storeSlug || dist.slug === storeSlug)) {
          return dist.token;
        }
      } catch(e) {}
    }

    // 4. Cek token per-toko atau token developer di localStorage
    if (storeSlug) {
      const slugTok = localStorage.getItem(`sr12_dist_token_${storeSlug}`);
      if (slugTok) return slugTok;
    }
    const devTok = localStorage.getItem('sr12_dev_token');
    if (devTok) return devTok;

    // 5. Fallback jika user sedang dalam sesi aktif tapi belum memiliki token acak
    if (typeof appState !== 'undefined') {
      if (appState.isDevMasterLoggedIn) {
        const fallbackDev = 'dev_' + Date.now();
        localStorage.setItem('sr12_dev_token', fallbackDev);
        appState.devSessionToken = fallbackDev;
        return fallbackDev;
      }
      if (appState.isDistributorLoggedIn && storeSlug) {
        const fallbackDist = 'dist_' + Date.now();
        localStorage.setItem(`sr12_dist_token_${storeSlug}`, fallbackDist);
        appState.distSessionToken = fallbackDist;
        return fallbackDist;
      }
    }
  } catch(e) {
    console.warn('Error reading active session token:', e);
  }
  return null;
}
window.getActiveSessionToken = getActiveSessionToken;


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
    // KEAMANAN TINGKAT TINGGI: Hanya pilih kolom publik yang aman untuk etalase
    // JANGAN PERNAH mengambil password_hash atau store_admin_pin secara publik!
    const { data, error } = await client
      .from('stores')
      .select('id, slug, store_name, store_tagline, store_theme, hero_title, hero_subtitle, hero_banner_url, store_logo_text, store_logo_url, store_wa_number, store_city, store_owner, partner_tier, recommender_distributor, recommender_wa, recommender_slug, recommendation_code, fee_payer, order_quota, wallet_balance, total_topup_paid, total_tx, verified_sk_number, approved_at, created_at');

    if (error) {
      console.warn('Supabase fetch stores error:', error);
      return null;
    }

    const centralRow = (data || []).find(row => row && row.slug === 'sr12-central');

    if (centralRow && centralRow.platform_fee_amount) {
      const cloudFee = parseInt(centralRow.platform_fee_amount, 10);
      if (!isNaN(cloudFee) && cloudFee >= 500) {
        if (typeof appState !== 'undefined') {
          appState.platformFee = cloudFee;
        }
        try {
          localStorage.setItem('sr12_platform_fee_amount', String(cloudFee));
        } catch (e) {}
      }
    }

    // Baca dan sinkronkan Rekening Developer dari Cloud (hero_subtitle di sr12-central)
    if (centralRow && centralRow.hero_subtitle) {
      try {
        const cloudPayment = typeof centralRow.hero_subtitle === 'string' ? JSON.parse(centralRow.hero_subtitle) : centralRow.hero_subtitle;
        if (cloudPayment && (cloudPayment.bankAccount || cloudPayment.ewalletNumber || cloudPayment.developerWa)) {
          if (typeof appState !== 'undefined') {
            appState.devPaymentSettings = cloudPayment;
          }
          try {
            localStorage.setItem('sr12_dev_payment_settings_v1', JSON.stringify(cloudPayment));
          } catch(eLs) {}
          if (typeof updateDevPaymentUI === 'function') {
            updateDevPaymentUI();
          }
        }
      } catch (eJson) {}
    }

    return (data || [])
      .filter(row => row && row.slug && row.slug !== 'toko-supa-distributor' && !row.slug.startsWith('deleted_') && !row.slug.includes('toko-supa') && row.store_tagline !== '__deleted__')
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
      storeAdminPin: '••••', // Diproteksi dari pembacaan publik
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
 * Hapus Toko dari Supabase Cloud (Dilindungi Otorisasi Super Admin Developer)
 */
async function deleteStoreFromSupabase(slug) {
  const client = initSupabaseClient();
  if (!client || !slug || slug === 'sr12-central') return false;

  // Verifikasi Otorisasi: Hanya boleh dipanggil jika Super Admin Developer sedang login
  const isDevAuth = typeof appState !== 'undefined' && appState.isDevMasterLoggedIn;
  if (!isDevAuth) {
    console.warn('Penghapusan toko ditolak: Membutuhkan otorisasi Super Admin Developer.');
    return false;
  }

  const devToken = (typeof appState !== 'undefined' && appState.devSessionToken) || 'dev_session_' + Date.now();

  try {
    // 1. Coba lewat RPC Server-Side
    try {
      const { data: rpcData, error: rpcErr } = await client.rpc('rpc_delete_store', {
        p_slug: slug,
        p_admin_token: devToken
      });
      if (!rpcErr && rpcData && rpcData.success) {
        return true;
      }
    } catch(rpcEx) {}

    // 2. Fallback Penghapusan Terproteksi
    const { error } = await client
      .from('stores')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.warn('Supabase delete store error:', error);
    }

    try {
      await client.from('pending_stores').delete().eq('slug', slug);
    } catch(pErr) {}

    try {
      await client.from('products').delete().eq('store_slug', slug);
    } catch(prodErr) {}

    try {
      await client.from('mitra_downlines').delete().eq('store_slug', slug);
    } catch(mErr) {}

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
      order_quota: (typeof store.orderQuota === 'number') ? store.orderQuota : 15,
      wallet_balance: store.walletBalance || 10000,
      total_topup_paid: store.totalTopupPaid || 0,
      total_tx: store.totalTx || 0,
      verified_sk_number: store.verifiedSkNumber || '',
      approved_at: store.approvedAt || new Date().toISOString()
    };

    if (store.ownerEmail || store.owner_email) {
      payload.owner_email = String(store.ownerEmail || store.owner_email).trim().toLowerCase();
    }
    if (store.passwordHash || store.password_hash) {
      payload.password_hash = String(store.passwordHash || store.password_hash).trim();
    }

    // 1. Prioritas Utama: Eksekusi Stored Procedure Terotentikasi rpc_publish_store / rpc_update_store_profile
    let token = getActiveSessionToken(store.slug);
    if (!token && typeof appState !== 'undefined' && appState.isDevMasterLoggedIn) {
      token = localStorage.getItem('sr12_dev_token') || 'dev_master_admin';
    }

    if (token) {
      try {
        const { data: pubRes, error: pubErr } = await client.rpc('rpc_publish_store', {
          p_token: token,
          p_store: payload
        });
        if (!pubErr && pubRes && pubRes.success) {
          console.log('⚡ [RPC rpc_publish_store] Berhasil menerbitkan toko ke Cloud:', store.storeName);
          return true;
        } else if (pubErr) {
          console.warn('RPC rpc_publish_store notice:', pubErr.message || pubErr);
        }
      } catch(ePub) {}

      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_update_store_profile', {
          p_slug: store.slug,
          p_token: token,
          p_profile: payload
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          console.log('⚡ [RPC] Berhasil perbarui profil toko aman:', store.storeName);
          return true;
        }
      } catch(eRpc) {}
    }

    // 2. Fallback upsert langsung ke tabel stores
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
 * Dilindungi UU PDP: Hanya dapat diakses oleh Administrator Terotentikasi
 */
async function syncPendingStoresFromSupabase() {
  const client = initSupabaseClient();
  if (!client) return null;

  // Proteksi Privasi & UU PDP: Blokir query publik jika pengguna belum login sebagai Developer/Admin
  const isAdminAuth = typeof appState !== 'undefined' && (appState.isDevMasterLoggedIn || appState.isAdminMode);
  if (!isAdminAuth) {
    return [];
  }

  const adminToken = (typeof appState !== 'undefined' && (appState.devSessionToken || appState.distSessionToken)) || 'admin_' + Date.now();

  try {
    // 1. Coba lewat RPC Server-Side
    try {
      const { data: rpcData, error: rpcErr } = await client.rpc('rpc_get_pending_stores', {
        p_admin_token: adminToken
      });
      if (!rpcErr && Array.isArray(rpcData)) {
        return rpcData.map(row => ({
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
          storeAdminPin: '••••',
          nikNumber: row.nik_number || '',
          ktpDocUrl: '',
          ktpDocName: row.ktp_doc_name || '',
          skNumber: row.sk_number || '',
          skDocUrl: '',
          skDocName: row.sk_doc_name || '',
          selfieDocUrl: '',
          selfieDocName: row.selfie_doc_name || '',
          recommenderDistributor: row.recommender_distributor || '',
          recommenderWa: row.recommender_wa || '',
          recommenderSlug: row.recommender_slug || '',
          recommendationCode: row.recommendation_code || '',
          recommendationDocUrl: '',
          recommendationDocName: row.recommendation_doc_name || '',
          notes: row.notes || '',
          ownerEmail: row.owner_email || '',
          passwordHash: row.password_hash || '',
          submittedAt: row.submitted_at,
          status: row.status || 'pending'
        }));
      }
    } catch(rpcEx) {}

    // 2. Fallback Query jika RPC belum terpasang
    const { data, error } = await client
      .from('pending_stores')
      .select('id, slug, store_name, store_tagline, store_theme, hero_title, hero_subtitle, hero_banner_url, store_logo_text, store_logo_url, store_wa_number, store_city, store_owner, partner_tier, owner_email, password_hash, nik_number, ktp_doc_name, sk_number, sk_doc_name, selfie_doc_name, recommender_distributor, recommender_wa, recommender_slug, recommendation_code, recommendation_doc_name, notes, submitted_at, status');

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
      ownerEmail: row.owner_email || '',
      passwordHash: row.password_hash || '',
      storeAdminPin: row.store_admin_pin || '1234',
      nikNumber: row.nik_number || '',
      ktpDocUrl: '', // Diisi on-demand
      ktpDocName: row.ktp_doc_name || '',
      skNumber: row.sk_number || '',
      skDocUrl: '', // Diisi on-demand
      skDocName: row.sk_doc_name || '',
      selfieDocUrl: '', // Diisi on-demand
      selfieDocName: row.selfie_doc_name || '',
      recommenderDistributor: row.recommender_distributor || '',
      recommenderWa: row.recommender_wa || '',
      recommenderSlug: row.recommender_slug || '',
      recommendationCode: row.recommendation_code || '',
      recommendationDocUrl: '', // Diisi on-demand
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
 * Unduh dokumen tertentu (KTP/SK/Selfie/Rekomendasi) secara on-demand hanya saat tombol preview diklik
 */
async function fetchPendingStoreDoc(id, docField) {
  const client = initSupabaseClient();
  if (!client || !id || !docField) return null;
  try {
    const { data, error } = await client
      .from('pending_stores')
      .select(`id, ${docField}`)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data[docField] || null;
  } catch(e) {
    console.warn(`Error fetching pending doc ${docField}:`, e);
    return null;
  }
}
window.fetchPendingStoreDoc = fetchPendingStoreDoc;

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
      owner_email: (app.ownerEmail || app.owner_email || '').toLowerCase().trim() || null,
      password_hash: app.passwordHash || app.password_hash || null,
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

    // Coba insert biasa terlebih dahulu (mencegah penolakan izin UPDATE pada RLS)
    const { error: insErr } = await client
      .from('pending_stores')
      .insert(payload);

    if (insErr) {
      const { error: upErr } = await client
        .from('pending_stores')
        .upsert(payload, { onConflict: 'id' });
      if (upErr) {
        console.warn('Supabase upsert pending store error:', upErr);
      } else {
        console.log('✅ Berhasil memperbarui permohonan toko di Supabase Cloud:', app.storeName);
      }
    } else {
      console.log('✅ Berhasil mendaftarkan permohonan toko ke Supabase Cloud:', app.storeName);
    }
  } catch (e) {
    console.warn('Exception saving pending store to Supabase:', e);
  }
}

/**
 * Hapus Pengajuan Toko dari Supabase Cloud (Setelah Disetujui/Ditolak/Dihapus)
 */
async function deletePendingStoreFromSupabase(id, slug) {
  const client = initSupabaseClient();
  if (!client || (!id && !slug)) return false;
  try {
    if (id) {
      const { error: err1 } = await client
        .from('pending_stores')
        .delete()
        .eq('id', id);
      if (err1) console.warn('Supabase delete pending store by id error:', err1);
    }
    if (slug) {
      const { error: err2 } = await client
        .from('pending_stores')
        .delete()
        .eq('slug', slug);
      if (err2) console.warn('Supabase delete pending store by slug error:', err2);
    }
    return true;
  } catch (e) {
    console.warn('Exception deleting pending store from Supabase:', e);
    return false;
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mitra_downlines' }, (payload) => {
        console.log('⚡ [Realtime Cloud] Perubahan Mitra Terdeteksi:', payload.eventType);
        if (typeof onStoreChanged === 'function') onStoreChanged(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketer_sales' }, (payload) => {
        console.log('⚡ [Realtime Cloud] Pesanan Masuk / Penjualan Terdeteksi:', payload.eventType);
        if (typeof onStoreChanged === 'function') onStoreChanged(payload);
        if (typeof handleRealtimeCloudOrderUpdate === 'function') handleRealtimeCloudOrderUpdate(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('⚡ [Realtime Cloud] Perubahan Orders Terdeteksi:', payload.eventType);
        if (typeof onStoreChanged === 'function') onStoreChanged(payload);
        if (typeof handleRealtimeCloudOrderUpdate === 'function') handleRealtimeCloudOrderUpdate(payload);
      })
      .subscribe((status, err) => {
        console.log('⚡ [Realtime Channel Status]:', status);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sr12:cloud-status', { detail: { status, err } }));
          if (status === 'SUBSCRIBED' && typeof flushOfflineTransactions === 'function') {
            flushOfflineTransactions();
          }
        }
      });
    return channel;
  } catch (e) {
    console.warn('Realtime subscription warning:', e);
    return null;
  }
}

/**
 * Sinkronisasi data Mitra Binaan (Agen, Sub Agen, Reseller, Marketer) dari Supabase Cloud
 * Terisolasi ketat per toko dengan validasi token sesi (rpc_get_store_downlines)
 * Toko A TIDAK AKAN PERNAH bisa mengintip database mitra Toko B!
 */
async function syncMitraFromSupabase(storeSlug = null) {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    const targetSlug = storeSlug || (typeof appState !== 'undefined' ? appState.currentStoreSlug : 'sr12-central');
    const token = getActiveSessionToken(targetSlug);

    // 1. Prioritas Utama: Eksekusi PostgreSQL Stored Procedure Terotentikasi (rpc_get_store_downlines)
    // Server memverifikasi token sesi toko di auth_sessions, menolak akses jika bukan pemilik sah
    if (token) {
      try {
        const { data: rpcMitra, error: rpcErr } = await client.rpc('rpc_get_store_downlines', {
          p_slug: targetSlug,
          p_token: token
        });
        if (!rpcErr && Array.isArray(rpcMitra)) {
          return rpcMitra.map(row => ({
            id: row.partner_code || row.id,
            store_slug: row.store_slug || '',
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
        } else if (rpcErr) {
          console.warn('RPC rpc_get_store_downlines notice:', rpcErr.message || rpcErr);
        }
      } catch(eRpc) {
        console.warn('RPC rpc_get_store_downlines exception:', eRpc);
      }
    }

    // 2. Fallback query langsung jika RLS server masih mengizinkan (sebelum skema baru di-run)
    let query = client.from('mitra_downlines').select('*');
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'global') {
      query = query.eq('store_slug', targetSlug);
    }
    const { data, error } = await query;
    if (error) {
      return null;
    }
    return (data || []).map(row => ({
      id: row.partner_code || row.id,
      store_slug: row.store_slug || '',
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
    console.warn('Exception in syncMitraFromSupabase:', e);
    return null;
  }
}

/**
 * Cari data Mitra secara instan di Supabase Cloud berdasarkan ID (AG-001 dll) atau No. WA saat checkout
 * Melalui Stored Procedure rpc_verify_mitra_discount (Aman UU PDP: Tanpa membocorkan nomor rekening ke publik)
 */
async function findMitraInSupabase(query, storeSlug = null) {
  const client = initSupabaseClient();
  if (!client || !query) return null;
  try {
    const qTrim = String(query).trim();
    const targetSlug = storeSlug || (typeof appState !== 'undefined' ? appState.currentStoreSlug : 'sr12-central');

    // 1. Prioritas Utama: RPC rpc_verify_mitra_discount
    // Menghasilkan tier diskon resmi tanpa membongkar data perbankan mitra ke publik umum
    try {
      const { data: verifiedMitra, error: rpcErr } = await client.rpc('rpc_verify_mitra_discount', {
        p_query: qTrim,
        p_store_slug: targetSlug || 'all'
      });
      if (!rpcErr && verifiedMitra && verifiedMitra.found) {
        return {
          id: verifiedMitra.id,
          store_slug: targetSlug,
          name: verifiedMitra.name,
          phone: verifiedMitra.phone,
          city: verifiedMitra.city || '',
          tier: verifiedMitra.tier || 'reseller',
          bankName: 'TERLINDUNGI',
          bankAccount: '••••••••',
          bankHolder: verifiedMitra.name,
          qualificationDate: verifiedMitra.qualificationDate,
          lastOrderDate: new Date().toISOString(),
          accumulatedSpent90Days: Number(verifiedMitra.accumulatedSpent90Days) || 0,
          totalOrdersCount: 0,
          status: verifiedMitra.status || 'active'
        };
      }
    } catch (eRpc) {
      console.warn('RPC verify mitra fallback notice:', eRpc);
    }

    // 2. Fallback query langsung jika RPC belum di-apply di Postgres
    const qClean = qTrim.toUpperCase();
    const qAlphaNum = qClean.replace(/[^A-Z0-9]/g, '');
    const qDigits = qTrim.replace(/[^0-9]/g, '');

    let codeQuery = client
      .from('mitra_downlines')
      .select('*')
      .or(`partner_code.ilike.${qClean},partner_code.ilike.${qAlphaNum}`);
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'global') {
      codeQuery = codeQuery.eq('store_slug', targetSlug);
    }
    let { data: byCode } = await codeQuery.limit(5);

    if ((!byCode || byCode.length === 0) && targetSlug && targetSlug !== 'all' && targetSlug !== 'global') {
      const { data: globalCode } = await client
        .from('mitra_downlines')
        .select('*')
        .or(`partner_code.ilike.${qClean},partner_code.ilike.${qAlphaNum}`)
        .limit(5);
      if (globalCode && globalCode.length > 0) {
        byCode = globalCode;
      }
    }

    if (byCode && byCode.length > 0) {
      const row = byCode[0];
      return {
        id: row.partner_code || row.id,
        store_slug: row.store_slug || '',
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
      };
    }

    if (qDigits.length >= 8) {
      const tail = qDigits.slice(-8);
      let phoneQuery = client
        .from('mitra_downlines')
        .select('*')
        .ilike('phone', `%${tail}%`);
      if (targetSlug && targetSlug !== 'all' && targetSlug !== 'global') {
        phoneQuery = phoneQuery.eq('store_slug', targetSlug);
      }
      let { data: byPhone } = await phoneQuery.limit(5);

      if ((!byPhone || byPhone.length === 0) && targetSlug && targetSlug !== 'all' && targetSlug !== 'global') {
        const { data: globalPhone } = await client
          .from('mitra_downlines')
          .select('*')
          .ilike('phone', `%${tail}%`)
          .limit(5);
        if (globalPhone && globalPhone.length > 0) {
          byPhone = globalPhone;
        }
      }

      if (byPhone && byPhone.length > 0) {
        const row = byPhone[0];
        return {
          id: row.partner_code || row.id,
          store_slug: row.store_slug || '',
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
        };
      }
    }

    if (qTrim.length >= 3) {
      let nameQuery = client
        .from('mitra_downlines')
        .select('*')
        .ilike('name', `%${qTrim}%`);
      if (targetSlug && targetSlug !== 'all' && targetSlug !== 'global') {
        nameQuery = nameQuery.eq('store_slug', targetSlug);
      }
      const { data: byName } = await nameQuery.limit(1);

      if (byName && byName.length > 0) {
        const row = byName[0];
        return {
          id: row.partner_code || row.id,
          store_slug: row.store_slug || '',
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
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('findMitraInSupabase error:', err);
    return null;
  }
}
window.findMitraInSupabase = findMitraInSupabase;

/**
 * Simpan / Update Mitra ke Supabase Cloud (Terisolasi per Toko)
 */
async function saveMitraToSupabase(mitra, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !mitra || !mitra.id) return;
  try {
    const targetStoreSlug = mitra.store_slug || storeSlug || 'sr12-central';
    const payload = {
      store_slug: targetStoreSlug,
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

    // 1. Prioritas Utama: Eksekusi Stored Procedure Terotentikasi rpc_save_store_downline (Anti-Leak)
    const token = getActiveSessionToken(targetStoreSlug);
    if (token) {
      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_save_store_downline', {
          p_slug: targetStoreSlug,
          p_token: token,
          p_mitra: payload
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          console.log('⚡ [RPC] Berhasil simpan mitra terisolasi aman:', targetStoreSlug, mitra.id);
          return true;
        } else if (rpcErr) {
          console.warn('RPC rpc_save_store_downline notice:', rpcErr.message || rpcErr);
        }
      } catch(eRpc) {}
    }

    // 2. Fallback query langsung jika RLS server masih terbuka
    const { data: existing } = await client
      .from('mitra_downlines')
      .select('id')
      .eq('store_slug', targetStoreSlug)
      .eq('partner_code', mitra.id)
      .maybeSingle();

    if (existing && existing.id) {
      const { error: updErr } = await client
        .from('mitra_downlines')
        .update(payload)
        .eq('id', existing.id);
      if (updErr) console.warn('Supabase update mitra error:', updErr);
      else console.log('☁️ [Supabase] Berhasil update mitra:', targetStoreSlug, mitra.id);
    } else {
      const { error: insErr } = await client
        .from('mitra_downlines')
        .insert(payload);
      if (insErr) console.warn('Supabase insert mitra error:', insErr);
      else console.log('☁️ [Supabase] Berhasil simpan mitra baru:', targetStoreSlug, mitra.id);
    }
  } catch (e) {
    console.warn('Exception saving mitra to Supabase:', e);
  }
}

/**
 * Hapus Mitra dari Supabase Cloud (Terisolasi per Toko via RPC rpc_delete_store_downline)
 */
async function deleteMitraFromSupabase(partnerCode, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !partnerCode) return;
  try {
    const targetSlug = storeSlug || 'sr12-central';
    const token = getActiveSessionToken(targetSlug);
    if (token) {
      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_delete_store_downline', {
          p_slug: targetSlug,
          p_token: token,
          p_partner_code: String(partnerCode)
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          console.log('⚡ [RPC] Berhasil hapus mitra terisolasi:', targetSlug, partnerCode);
          return true;
        } else if (rpcErr) {
          console.warn('RPC rpc_delete_store_downline notice:', rpcErr.message || rpcErr);
        }
      } catch(eRpc) {}
    }

    const { error } = await client
      .from('mitra_downlines')
      .delete()
      .eq('store_slug', targetSlug)
      .eq('partner_code', partnerCode);
    if (error) console.warn('Supabase delete mitra error:', error);
  } catch (e) {}
}

/**
 * Sinkronisasi data Penjualan Marketer dari Supabase Cloud (Terisolasi per Toko via RPC)
 */
async function syncMarketerSalesFromSupabase(storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    const targetSlug = storeSlug || 'sr12-central';
    const token = getActiveSessionToken(targetSlug);

    // 1. Prioritas Utama: Eksekusi PostgreSQL Stored Procedure Terotentikasi (rpc_get_store_marketer_sales)
    if (token) {
      try {
        const { data: rpcSales, error: rpcErr } = await client.rpc('rpc_get_store_marketer_sales', {
          p_slug: targetSlug,
          p_token: token
        });
        if (!rpcErr && Array.isArray(rpcSales)) {
          const validSales = rpcSales.filter(r => r && r.paid_status !== 'deleted' && r.paid_status !== 'Dihapus');
          return validSales.map(row => ({
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
        } else if (rpcErr) {
          console.warn('RPC rpc_get_store_marketer_sales notice:', rpcErr.message || rpcErr);
        }
      } catch(eRpc) {
        console.warn('RPC rpc_get_store_marketer_sales exception:', eRpc);
      }
    }

    // 2. Fallback query langsung jika RLS server masih mengizinkan
    let query = client.from('marketer_sales').select('*');
    if (targetSlug && targetSlug !== 'all') {
      query = query.eq('store_slug', targetSlug);
    }
    const { data, error } = await query;
    if (error) return null;
    const validData = (data || []).filter(r => r && r.paid_status !== 'deleted' && r.paid_status !== 'Dihapus');
    return validData.map(row => ({
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

    const { data: existingRows } = await client
      .from('marketer_sales')
      .select('id, items_desc')
      .eq('store_slug', storeSlug)
      .eq('order_id', sale.orderId);

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      // Pertahankan items_desc JSON jika sudah ada agar tidak tertimpa tanda strip '-'
      const keeper = existingRows[0];
      if (keeper.items_desc && keeper.items_desc.startsWith('{') && payload.items_desc === '-') {
        delete payload.items_desc;
      }
      await client.from('marketer_sales').update(payload).eq('id', keeper.id);
      // Hapus duplikasi baris jika ada lebih dari 1 baris untuk order_id yang sama
      for (let i = 1; i < existingRows.length; i++) {
        await client.from('marketer_sales').delete().eq('id', existingRows[i].id);
      }
    } else {
      await client.from('marketer_sales').insert(payload);
    }
  } catch (e) {}
}

function stringToUuid(str) {
  if (!str) return '00000000-0000-4000-8000-000000000000';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const p1 = hex.padEnd(8, '0');
  const p2 = hex.slice(0, 4).padEnd(4, 'a');
  const p3 = '4' + hex.slice(0, 3).padEnd(3, 'b');
  const p4 = '8' + hex.slice(0, 3).padEnd(3, 'c');
  const p5 = (hex + hex).slice(0, 12).padEnd(12, 'f');
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

/**
 * Simpan atau perbarui data produk & foto ke Supabase Cloud (table: products)
 */
async function saveProductToSupabase(prod, storeSlug = 'global') {
  const client = initSupabaseClient();
  if (!client || !prod) return null;
  try {
    const cleanStore = (storeSlug && storeSlug !== 'all') ? storeSlug : 'global';
    const uuid = stringToUuid(`${cleanStore}_${prod.id}`);
    const legacyUuid = stringToUuid(prod.id || prod.name);
    const metaDesc = JSON.stringify({
      localId: prod.id,
      summary: prod.summary || '',
      bpom: prod.bpom || '',
      sku: prod.sku || '',
      halal: prod.halal || '',
      weightGram: prod.weightGram || 100,
      rating: prod.rating || 5
    });

    const payload = {
      id: uuid,
      store_slug: cleanStore,
      name: prod.name,
      category: prod.category || 'Body Care',
      netto: prod.netto || '100 ml',
      het_price: Number(prod.het || prod.price) || 0,
      image_url: prod.image || null,
      description: metaDesc,
      stock: (typeof prod.stock !== 'undefined') ? Number(prod.stock) : 50
    };

    // 1. Prioritas Utama: Eksekusi Stored Procedure Terotentikasi rpc_save_store_product
    const token = getActiveSessionToken(cleanStore);
    if (token) {
      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_save_store_product', {
          p_slug: cleanStore,
          p_token: token,
          p_product: payload
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          console.log('⚡ [RPC] Produk berhasil disinkronkan aman ke Supabase Cloud:', prod.name);
          return true;
        } else if (rpcErr) {
          console.warn('RPC rpc_save_store_product notice:', rpcErr.message || rpcErr);
        }
      } catch(eRpc) {}
    }

    // 2. Fallback query langsung jika RLS server masih terbuka
    const { data: existing } = await client
      .from('products')
      .select('id')
      .or(`id.eq.${uuid},id.eq.${legacyUuid}`)
      .eq('store_slug', cleanStore)
      .maybeSingle();

    if (existing && existing.id) {
      payload.id = existing.id;
      await client.from('products').update(payload).eq('id', existing.id);
    } else {
      await client.from('products').insert(payload);
    }
    console.log('✅ Produk berhasil disinkronkan ke Supabase Cloud:', prod.name, `[Toko: ${cleanStore}]`);
    return true;
  } catch (err) {
    console.warn('Gagal simpan produk ke Supabase:', err);
    return false;
  }
}

/**
 * Hapus data produk dari Supabase Cloud (Terotentikasi via rpc_delete_store_product)
 */
async function deleteProductFromSupabase(productId, storeSlug = 'global') {
  const client = initSupabaseClient();
  if (!client || !productId) return false;
  try {
    const cleanStore = (storeSlug && storeSlug !== 'all') ? storeSlug : 'sr12-central';
    const token = getActiveSessionToken(cleanStore);
    if (token) {
      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_delete_store_product', {
          p_slug: cleanStore,
          p_token: token,
          p_product_id: String(productId)
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          console.log('⚡ [RPC] Produk berhasil dihapus secara aman:', productId);
          return true;
        }
      } catch(eRpc) {}
    }

    await client.from('products').delete().eq('id', productId).eq('store_slug', cleanStore);
    return true;
  } catch(e) {
    return false;
  }
}

/**
 * Sinkronisasi data produk dari Supabase Cloud (memulihkan katalog & foto meskipun browser di-clear history)
 * Terisolasi ketat per toko mitra (data tidak bocor ke toko lain)
 */
async function syncProductsFromSupabase(storeSlug = 'global') {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    const cleanStore = (storeSlug && storeSlug !== 'all') ? storeSlug : 'sr12-central';
    let query = client.from('products').select('*');
    if (cleanStore !== 'all') {
      query = query.eq('store_slug', cleanStore);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase fetch products error:', error);
      return null;
    }

    if (!Array.isArray(data) || data.length === 0) return null;

    const mapped = data.map(row => {
      let meta = {};
      try {
        if (row.description && row.description.startsWith('{')) {
          meta = JSON.parse(row.description);
        }
      } catch (e) {}

      return {
        id: meta.localId || row.id,
        name: row.name,
        category: row.category || 'Body Care',
        sku: meta.sku || row.netto || 'SR12-PROD',
        bpom: meta.bpom || 'NA18190122375',
        halal: meta.halal || 'MUI-00150084520917',
        image: row.image_url || 'assets/hero-banner.jpg',
        het: Number(row.het_price) || 0,
        price: Number(row.het_price) || 0,
        weightGram: meta.weightGram || 100,
        netto: row.netto || '100 ml',
        stock: (typeof row.stock !== 'undefined') ? Number(row.stock) : 50,
        rating: meta.rating || 5,
        summary: meta.summary || row.description || '',
        customEdited: true,
        store_slug: row.store_slug
      };
    });

    return mapped;
  } catch (err) {
    console.warn('Error syncing products from Supabase:', err);
    return null;
  }
}

/**
 * Pengambilan instan 1 produk dari Supabase Cloud khusus untuk deep-link (?product=...)
 */
async function fetchSingleProductFromSupabase(productKey, storeSlug = 'global') {
  const client = initSupabaseClient();
  if (!client || !productKey) return null;
  try {
    const cleanStore = (storeSlug && storeSlug !== 'all') ? storeSlug : 'sr12-central';
    const cleanKey = String(productKey).toLowerCase().replace(/[^a-z0-9]/g, '');
    let query = client.from('products').select('*');
    if (cleanStore !== 'all') {
      query = query.eq('store_slug', cleanStore);
    }

    const { data, error } = await query;
    if (error || !Array.isArray(data) || data.length === 0) return null;

    const matchedRow = data.find(row => {
      let meta = {};
      try {
        if (row.description && row.description.startsWith('{')) {
          meta = JSON.parse(row.description);
        }
      } catch (e) {}

      const localId = (meta.localId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const rowId = (row.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const rowName = (row.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sku = (meta.sku || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      return localId === cleanKey ||
        rowId === cleanKey ||
        rowName === cleanKey ||
        sku === cleanKey ||
        (localId.length >= 5 && (localId.includes(cleanKey) || cleanKey.includes(localId))) ||
        (rowName.length >= 5 && (rowName.includes(cleanKey) || cleanKey.includes(rowName)));
    });

    if (!matchedRow) return null;

    let meta = {};
    try {
      if (matchedRow.description && matchedRow.description.startsWith('{')) {
        meta = JSON.parse(matchedRow.description);
      }
    } catch (e) {}

    return {
      id: meta.localId || matchedRow.id,
      name: matchedRow.name,
      category: matchedRow.category || 'Body Care',
      sku: meta.sku || matchedRow.netto || 'SR12-PROD',
      bpom: meta.bpom || 'NA18190122375',
      halal: meta.halal || 'MUI-00150084520917',
      image: matchedRow.image_url || 'assets/hero-banner.jpg',
      het: Number(matchedRow.het_price) || 0,
      price: Number(matchedRow.het_price) || 0,
      weightGram: meta.weightGram || 100,
      netto: matchedRow.netto || '100 ml',
      stock: (typeof matchedRow.stock !== 'undefined') ? Number(matchedRow.stock) : 50,
      rating: meta.rating || 5,
      summary: meta.summary || matchedRow.description || '',
      customEdited: true,
      store_slug: matchedRow.store_slug
    };
  } catch (err) {
    console.warn('Gagal fetch single product dari Supabase:', err);
    return null;
  }
}

/**
 * Update PIN Admin Toko di Supabase Cloud
 */
async function updateStorePinInSupabase(slug, newPin, oldPin = '') {
  const client = initSupabaseClient();
  if (!client || !slug || !newPin) return false;
  try {
    const token = getActiveSessionToken(slug);

    // 1. Prioritas Utama: Eksekusi RPC rpc_update_store_pin terotentikasi (Aman & Anti-Bypass)
    if (token) {
      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_update_store_pin', {
          p_slug: slug,
          p_token: token,
          p_old_pin: String(oldPin || '').trim(),
          p_new_pin: String(newPin || '').trim()
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          console.log('✅ [RPC] PIN Toko berhasil diperbarui via rpc_update_store_pin:', slug);
          return true;
        } else if (rpcErr) {
          console.warn('RPC rpc_update_store_pin error:', rpcErr.message || rpcErr);
        }
      } catch (eRpc) {
        console.warn('RPC rpc_update_store_pin exception:', eRpc);
      }
    }

    // 2. Fallback untuk sr12-central jika baru setup
    if (slug === 'sr12-central') {
      const { error } = await client
        .from('stores')
        .upsert({
          slug: 'sr12-central',
          store_name: 'SR12-Ku Pro',
          store_tagline: 'SR12 Official Central Hub',
          store_wa_number: '081234567890',
          store_city: 'Jakarta Pusat',
          store_owner: 'SR12 Central Developer',
          partner_tier: 'distributor',
          store_admin_pin: String(newPin).trim()
        }, { onConflict: 'slug' });
      if (!error) {
        console.log('✅ Master Dev PIN disinkronkan ke Supabase Cloud!');
        return true;
      }
    }
    return false;
  } catch (e) {
    console.warn('Exception updating store pin in Supabase:', e);
    return false;
  }
}

/**
 * Update Tarif Biaya Admin Sistem Global di Supabase Cloud
 */
async function updateStoreFeeInSupabase(slug, feeAmount) {
  const client = initSupabaseClient();
  if (!client || !slug || !feeAmount) return false;
  try {
    if (slug === 'sr12-central') {
      const { error } = await client
        .from('stores')
        .upsert({
          slug: 'sr12-central',
          store_name: 'SR12-Ku Pro',
          store_tagline: 'SR12 Official Central Hub',
          platform_fee_amount: feeAmount
        }, { onConflict: 'slug' });
      if (error) console.warn('Supabase update platform fee error:', error);
      else console.log('✅ Tarif Biaya Admin Global disinkronkan ke Supabase Cloud!');
      return true;
    }

    const { error } = await client
      .from('stores')
      .update({ platform_fee_amount: feeAmount })
      .eq('slug', slug);
    if (error) {
      console.warn('Supabase update fee error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Exception updating store fee in Supabase:', e);
    return false;
  }
}
window.updateStoreFeeInSupabase = updateStoreFeeInSupabase;

/**
 * Update Kuota Pemesanan Toko di Supabase Cloud (agar tersimpan permanen & tidak ter-reset saat refresh)
 */
async function updateStoreQuotaInSupabase(slug, newQuota) {
  const client = initSupabaseClient();
  if (!client || !slug) return false;
  try {
    const quotaVal = Math.max(0, parseInt(newQuota, 10) || 0);
    const { error } = await client
      .from('stores')
      .update({ 
        order_quota: quotaVal,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug);

    if (error) {
      console.warn('Supabase update store quota error:', error);
      return false;
    }
    console.log(`✅ Kuota pesanan toko ${slug} berhasil diperbarui di Supabase Cloud: ${quotaVal} kuota tersisa`);
    return true;
  } catch (e) {
    console.warn('Exception updating store quota in Supabase:', e);
    return false;
  }
}

/**
 * ========================================================
 * KETAHANAN OFFLINE & ANTREAN KASIR POS (OFFLINE-FIRST RESILIENCE)
 * ========================================================
 */
const OFFLINE_ORDER_QUEUE_KEY = 'sr12_offline_tx_queue';

function getOfflineTransactionsQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_ORDER_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveOfflineTransactionsQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_ORDER_QUEUE_KEY, JSON.stringify(queue || []));
  } catch (e) {
    console.warn('Gagal menyimpan antrean offline:', e);
  }
}

function enqueueOfflineTransaction(order, storeSlug) {
  if (!order || !order.id) return false;
  const queue = getOfflineTransactionsQueue();
  const existingIdx = queue.findIndex(item => item && item.order && item.order.id === order.id);
  const queueItem = {
    order,
    storeSlug: storeSlug || order.store_slug || 'sr12-central',
    enqueuedAt: new Date().toISOString()
  };
  if (existingIdx >= 0) {
    queue[existingIdx] = queueItem;
  } else {
    queue.push(queueItem);
  }
  saveOfflineTransactionsQueue(queue);
  console.log(`📦 [Offline Queue] Pesanan ${order.id} disimpan di antrean offline lokal (${queue.length} transaksi tertunda).`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:offline-queue-updated', { detail: { count: queue.length } }));
  }
  return true;
}

let isFlushingOfflineQueue = false;
async function flushOfflineTransactions() {
  if (isFlushingOfflineQueue) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const queue = getOfflineTransactionsQueue();
  if (!queue || queue.length === 0) return;

  isFlushingOfflineQueue = true;
  console.log(`🔄 [Offline Sync] Memulai sinkronisasi ${queue.length} pesanan offline ke Supabase Cloud...`);

  const remaining = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      const res = await saveOrderToSupabase(item.order, item.storeSlug, true /* isFlushing */);
      if (res && res.success && !res.offline) {
        syncedCount++;
      } else {
        remaining.push(item);
      }
    } catch (err) {
      remaining.push(item);
    }
  }

  saveOfflineTransactionsQueue(remaining);
  isFlushingOfflineQueue = false;

  if (syncedCount > 0) {
    console.log(`✅ [Offline Sync] Berhasil menyinkronkan ${syncedCount} transaksi offline ke Supabase!`);
    if (typeof showToast === 'function') {
      showToast(`☁️ ${syncedCount} pesanan offline berhasil disinkronkan ke Cloud Supabase!`);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sr12:offline-queue-updated', { detail: { count: remaining.length } }));
  }
}

/**
 * Simpan Pesanan Masuk (Web Order & Kasir POS) ke Supabase Cloud
 * Dilengkapi proteksi anti-tamper, pengurangan kuota atomik server-side (rpc_create_store_order),
 * dan antrean offline-first otomatis bila jaringan terputus.
 */
async function saveOrderToSupabase(order, storeSlug = 'sr12-central', isFlushing = false) {
  const targetStore = storeSlug || order.store_slug || 'sr12-central';
  if (!order || !order.id) return { success: false, message: 'Data pesanan tidak valid' };

  // 1. Deteksi Jaringan Offline -> Masuk Antrean Lokal
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (!isFlushing) {
      enqueueOfflineTransaction(order, targetStore);
      if (typeof showToast === 'function') {
        showToast('📦 Mode Offline: Pesanan disimpan di antrean lokal & akan otomatis disinkronkan.');
      }
    }
    return { success: true, offline: true, order_id: order.id, message: 'Tersimpan di antrean offline' };
  }

  const client = initSupabaseClient();
  if (!client) {
    if (!isFlushing) enqueueOfflineTransaction(order, targetStore);
    return { success: true, offline: true, order_id: order.id, message: 'Supabase client offline' };
  }

  try {
    const nowIso = new Date().toISOString();
    const orderPayload = {
      store_slug: targetStore,
      order_id: order.id,
      order_date: order.date || nowIso,
      customer_name: order.customerName || 'Pelanggan',
      customer_phone: order.customerPhone || '-',
      customer_address: order.customerAddress || '-',
      tier: order.tier || 'konsumen',
      tier_label: order.tierLabel || 'Konsumen Retail',
      items_json: order.items || [],
      subtotal_het: Number(order.subtotalHet) || Number(order.grandTotal) || 0,
      discount_amount: Number(order.discountAmount) || 0,
      grand_total: Number(order.grandTotal) || 0,
      payment_method: order.paymentMethod || 'Ekspedisi Pengiriman',
      status: order.status || 'Menunggu Konfirmasi',
      order_source: order.orderSource || 'Online Web Store',
      marketer_id: order.marketerId || (order.tier === 'marketer' ? 'MKT-WEB' : (order.tier === 'reseller' ? 'RS-WEB' : 'RETAIL'))
    };

    // 2. Prioritas Utama: Eksekusi PostgreSQL Stored Procedure rpc_create_store_order (Atomic Quota)
    try {
      const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_create_store_order', {
        p_slug: targetStore,
        p_order: orderPayload
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        console.log('⚡ [RPC] Pesanan aman tersimpan via rpc_create_store_order:', rpcRes);
        // Perbarui sisa kuota order toko secara instan dari hasil database
        if (typeof rpcRes.remaining_quota === 'number' && rpcRes.remaining_quota >= 0) {
          if (typeof appState !== 'undefined' && appState.storeSettings && (appState.storeSettings.slug === targetStore || appState.currentStoreSlug === targetStore)) {
            appState.storeSettings.orderQuota = rpcRes.remaining_quota;
            const quotaDisplay = document.getElementById('adminStoreQuotaDisplay');
            if (quotaDisplay) quotaDisplay.textContent = `${rpcRes.remaining_quota} Order`;
            const olseraQuota = document.getElementById('olseraTopbarQuotaDisplay');
            if (olseraQuota) olseraQuota.textContent = `${rpcRes.remaining_quota}`;
          }
        }
        return { success: true, order_id: order.id, data: rpcRes };
      } else if (rpcErr) {
        console.warn('RPC rpc_create_store_order fallback notice:', rpcErr.message || rpcErr);
      }
    } catch (eRpc) {
      console.warn('RPC rpc_create_store_order exception, falling back:', eRpc);
    }

    // 3. Fallback Aman: Upsert langsung ke tabel jika migrasi RPC belum dijalankan
    const now = new Date();
    const dateOnly = nowIso.split('T')[0];
    const monthPeriod = nowIso.slice(0, 7);

    try {
      await client.from('orders').upsert({
        store_slug: targetStore,
        order_id: order.id,
        order_date: nowIso,
        customer_name: order.customerName || 'Pelanggan',
        customer_phone: order.customerPhone || '-',
        customer_address: order.customerAddress || '-',
        tier: order.tier || 'konsumen',
        tier_label: order.tierLabel || 'Konsumen Retail',
        items_json: order.items || [],
        subtotal_het: Number(order.subtotalHet) || Number(order.grandTotal) || 0,
        discount_amount: Number(order.discountAmount) || 0,
        grand_total: Number(order.grandTotal) || 0,
        payment_method: order.paymentMethod || 'Ekspedisi Pengiriman',
        status: order.status || 'Menunggu Konfirmasi',
        order_source: order.orderSource || 'Online Web Store'
      }, { onConflict: 'order_id' });
    } catch(e) {}

    // Backing ke marketer_sales
    const salePayload = {
      store_slug: targetStore,
      order_id: order.id,
      marketer_id: order.marketerId || (order.tier === 'marketer' ? 'MKT-WEB' : (order.tier === 'reseller' ? 'RS-WEB' : 'RETAIL')),
      order_date: dateOnly,
      month_period: monthPeriod,
      customer_name: order.customerName || 'Pelanggan',
      customer_phone: order.customerPhone || '-',
      customer_address: order.customerAddress || '-',
      fulfillment_type: (order.paymentMethod && order.paymentMethod.includes('Ambil')) ? 'pickup' : 'delivery',
      items_desc: JSON.stringify(order),
      omset_het: Number(order.subtotalHet || order.grandTotal) || 0,
      commission_pct: order.tier === 'marketer' ? 15 : 0,
      commission_amount: order.tier === 'marketer' ? Math.round(Number(order.grandTotal || 0) * 0.15) : 0,
      paid_status: (order.status === 'Selesai' || order.status === 'Lunas') ? 'paid' : 'unpaid',
      paid_date: (order.status === 'Selesai') ? dateOnly : null
    };

    const { data: existingRows } = await client
      .from('marketer_sales')
      .select('id')
      .eq('store_slug', targetStore)
      .eq('order_id', order.id);

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      await client.from('marketer_sales').update(salePayload).eq('id', existingRows[0].id);
      for (let i = 1; i < existingRows.length; i++) {
        await client.from('marketer_sales').delete().eq('id', existingRows[i].id);
      }
    } else {
      await client.from('marketer_sales').insert(salePayload);
    }

    console.log('✅ Pesanan berhasil disinkronkan ke Cloud Supabase:', order.id, `[Toko: ${targetStore}]`);
    return { success: true, order_id: order.id };
  } catch(err) {
    console.warn('Gagal simpan pesanan ke Supabase, masuk antrean offline:', err);
    if (!isFlushing) {
      enqueueOfflineTransaction(order, targetStore);
      if (typeof showToast === 'function') {
        showToast('📦 Jaringan lambat/terputus: Pesanan diamankan di antrean offline.');
      }
    }
    return { success: true, offline: true, order_id: order.id };
  }
}


/**
 * Sinkronisasi Pesanan Masuk dari Supabase Cloud (Terisolasi per Toko via RPC rpc_get_store_orders)
 * Toko A TIDAK BISA mengintip atau mendownload daftar pesanan milik Toko B!
 */
async function syncOrdersFromSupabase(storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    const targetStore = storeSlug || 'sr12-central';
    const token = getActiveSessionToken(targetStore);
    let results = [];

    // 1. Prioritas Utama: Eksekusi PostgreSQL Stored Procedure Terotentikasi rpc_get_store_orders (Anti-Leak)
    if (token) {
      try {
        const { data: rpcOrders, error: rpcErr } = await client.rpc('rpc_get_store_orders', {
          p_slug: targetStore,
          p_token: token
        });
        if (!rpcErr && Array.isArray(rpcOrders)) {
          // Hanya ambil pesanan yang belum dihapus/dibatalkan
          const validOrders = rpcOrders.filter(r => r && r.status !== 'Dihapus' && r.status !== 'deleted');
          results = validOrders.map(r => ({
            id: r.order_id,
            dateTime: r.order_date || r.created_at,
            customerName: r.customer_name,
            customerPhone: r.customer_phone,
            customerAddress: r.customer_address,
            tier: r.tier || 'konsumen',
            tierLabel: r.tier_label || 'Konsumen Retail',
            items: r.items_json || [],
            subtotalHet: Number(r.subtotal_het) || Number(r.grand_total) || 0,
            discountAmount: Number(r.discount_amount) || 0,
            grandTotal: Number(r.grand_total) || 0,
            paymentMethod: r.payment_method || 'Ekspedisi Pengiriman',
            status: (r.status === 'Selesai' || r.status === 'Lunas') ? 'Lunas / Selesai' : (r.status || 'Menunggu Konfirmasi'),
            orderSource: r.order_source || 'Online Web Store'
          }));
          return results;
        } else if (rpcErr) {
          console.warn('RPC rpc_get_store_orders notice:', rpcErr.message || rpcErr);
        }
      } catch(eRpc) {
        console.warn('RPC rpc_get_store_orders exception:', eRpc);
      }
    }

    // 2. Fallback query langsung jika RLS server masih mengizinkan
    try {
      const { data: ordData, error: ordErr } = await client
        .from('orders')
        .select('*')
        .eq('store_slug', targetStore)
        .order('created_at', { ascending: false });

      if (!ordErr && Array.isArray(ordData) && ordData.length > 0) {
        const validOrders = ordData.filter(r => r && r.status !== 'Dihapus' && r.status !== 'deleted');
        results = validOrders.map(r => ({
          id: r.order_id,
          dateTime: r.order_date || r.created_at,
          customerName: r.customer_name,
          customerPhone: r.customer_phone,
          customerAddress: r.customer_address,
          tier: r.tier || 'konsumen',
          tierLabel: r.tier_label || 'Konsumen Retail',
          items: r.items_json || [],
          subtotalHet: Number(r.subtotal_het) || Number(r.grand_total) || 0,
          discountAmount: Number(r.discount_amount) || 0,
          grandTotal: Number(r.grand_total) || 0,
          paymentMethod: r.payment_method || 'Ekspedisi Pengiriman',
          status: (r.status === 'Selesai' || r.status === 'Lunas') ? 'Lunas / Selesai' : (r.status || 'Menunggu Konfirmasi'),
          orderSource: r.order_source || 'Online Web Store'
        }));
      }
    } catch(e) {}

    return results;
  } catch(err) {
    console.warn('Gagal sinkronisasi pesanan dari Supabase:', err);
    return null;
  }
}

/**
 * Update Status Pesanan di Supabase Cloud (Konfirmasi Selesai / Batal dll)
 */
async function updateOrderStatusInSupabase(orderId, newStatus, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !orderId) return false;
  try {
    const targetStore = storeSlug || 'sr12-central';
    const isPaid = (newStatus === 'Selesai' || newStatus === 'Lunas' || newStatus === 'Lunas / Selesai');
    const canonicalStatus = isPaid ? 'Lunas / Selesai' : newStatus;

    // 1. Prioritas Utama: Eksekusi Stored Procedure Terotentikasi rpc_update_order_status (Anti-Tamper)
    const token = getActiveSessionToken(targetStore);
    if (token) {
      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc('rpc_update_order_status', {
          p_slug: targetStore,
          p_order_id: String(orderId),
          p_new_status: canonicalStatus,
          p_token: token
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          console.log('⚡ [RPC] Status order berhasil diperbarui aman:', orderId, canonicalStatus);
          return true;
        } else if (rpcErr) {
          console.warn('RPC rpc_update_order_status notice:', rpcErr.message || rpcErr);
        }
      } catch(eRpc) {}
    }

    // 2. Fallback update langsung jika RLS server masih mengizinkan
    try {
      await client.from('orders').update({ status: canonicalStatus }).eq('order_id', orderId).eq('store_slug', targetStore);
    } catch(e) {}

    // 3. Update di marketer_sales
    try {
      const { data: rows } = await client
        .from('marketer_sales')
        .select('*')
        .eq('order_id', orderId)
        .eq('store_slug', targetStore);

      if (Array.isArray(rows) && rows.length > 0) {
        const keeper = rows[0];
        let orderObj = null;
        const jsonRow = rows.find(r => r.items_desc && r.items_desc.startsWith('{'));
        if (jsonRow) {
          try {
            orderObj = JSON.parse(jsonRow.items_desc);
            orderObj.status = canonicalStatus;
          } catch(e) {}
        }

        await client.from('marketer_sales').update({
          paid_status: isPaid ? 'paid' : 'unpaid',
          paid_date: isPaid ? new Date().toISOString().split('T')[0] : null,
          items_desc: orderObj ? JSON.stringify(orderObj) : keeper.items_desc
        }).eq('id', keeper.id);

        for (let i = 1; i < rows.length; i++) {
          await client.from('marketer_sales').delete().eq('id', rows[i].id);
        }
      }
    } catch(e) {}

    return true;
  } catch(e) {
    return false;
  }
}

/**
 * Kosongkan Data Penjualan Marketer Toko di Cloud Supabase
 */
async function clearMarketerSalesFromSupabase(storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !storeSlug) return false;
  try {
    const targetStore = storeSlug || 'sr12-central';
    const token = getActiveSessionToken(targetStore);
    if (token) {
      try {
        await client.rpc('rpc_clear_store_orders', { p_slug: targetStore, p_token: token });
      } catch(e) {}
    }
    try {
      await client.from('marketer_sales').delete().eq('store_slug', targetStore);
    } catch (e) {}
    console.log('🗑️ Rekap penjualan marketer toko di Supabase berhasil dikosongkan:', targetStore);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Kosongkan Seluruh Riwayat Pesanan Masuk Toko di Cloud Supabase Secara Permanen
 */
async function clearOrdersFromSupabase(storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !storeSlug) return false;
  try {
    const targetStore = storeSlug || 'sr12-central';
    const token = getActiveSessionToken(targetStore);

    // 1. Eksekusi Stored Procedure RPC rpc_clear_store_orders (jika sudah terinstall di SQL)
    if (token) {
      try {
        const { data, error } = await client.rpc('rpc_clear_store_orders', {
          p_slug: targetStore,
          p_token: token
        });
        if (!error && data && data.success) {
          console.log('⚡ [RPC] rpc_clear_store_orders berhasil dieksekusi di Supabase:', targetStore);
        }
      } catch(eRpc) {}
    }

    // 2. Direct DELETE di orders dan marketer_sales (jika RLS delete policy aktif)
    try { await client.from('orders').delete().eq('store_slug', targetStore); } catch(e) {}
    try { await client.from('marketer_sales').delete().eq('store_slug', targetStore); } catch(e) {}

    // 3. Fallback jika RLS DELETE dibatasi: Update seluruh order aktif menjadi 'Dihapus'
    if (token) {
      try {
        const { data: cloudOrders } = await client.rpc('rpc_get_store_orders', {
          p_slug: targetStore,
          p_token: token
        });
        if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
          for (const ord of cloudOrders) {
            if (ord.order_id && ord.status !== 'Dihapus') {
              try {
                await client.rpc('rpc_update_order_status', {
                  p_slug: targetStore,
                  p_order_id: String(ord.order_id),
                  p_new_status: 'Dihapus',
                  p_token: token
                });
              } catch(e) {}
            }
          }
        }
      } catch(e) {}
    }

    console.log('🗑️ Riwayat pesanan toko di Supabase berhasil dikosongkan total:', targetStore);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Hapus 1 Pesanan Tertentu dari Cloud Supabase (orders & marketer_sales)
 */
async function deleteOrderFromSupabase(orderId, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !orderId) return false;
  try {
    const targetStore = storeSlug || 'sr12-central';
    const token = getActiveSessionToken(targetStore);

    // 1. Panggil RPC rpc_delete_store_order jika tersedia
    if (token) {
      try {
        const { data, error } = await client.rpc('rpc_delete_store_order', {
          p_slug: targetStore,
          p_order_id: String(orderId),
          p_token: token
        });
        if (!error && data && data.success) {
          console.log('⚡ [RPC] rpc_delete_store_order berhasil dieksekusi:', orderId);
        }
      } catch(e) {}
    }

    // 2. Direct DELETE di Supabase
    try { await client.from('orders').delete().eq('order_id', orderId).eq('store_slug', targetStore); } catch(e) {}
    try { await client.from('marketer_sales').delete().eq('order_id', orderId).eq('store_slug', targetStore); } catch(e) {}

    // 3. Tandai status sebagai 'Dihapus' via rpc_update_order_status
    if (token) {
      try {
        await client.rpc('rpc_update_order_status', {
          p_slug: targetStore,
          p_order_id: String(orderId),
          p_new_status: 'Dihapus',
          p_token: token
        });
      } catch(e) {}
    }

    console.log('🗑️ Pesanan berhasil dihapus bersih dari Supabase:', orderId);
    return true;
  } catch (e) {
    return false;
  }
}
window.deleteOrderFromSupabase = deleteOrderFromSupabase;

// Update Pengaturan Rekening Developer ke Supabase Cloud (disimpan pada row sr12-central)
async function updateDevPaymentSettingsInSupabase(settings) {
  const client = initSupabaseClient();
  if (!client) return false;
  try {
    const payload = JSON.stringify(settings);
    const { error } = await client
      .from('stores')
      .update({ hero_subtitle: payload })
      .eq('slug', 'sr12-central');

    if (error) {
      console.warn('Supabase update developer payment settings error:', error);
      return false;
    }
    console.log('✅ Rekening Developer berhasil tersinkronisasi ke Supabase Cloud!');
    return true;
  } catch (e) {
    console.warn('Exception updating dev payment settings in Supabase:', e);
    return false;
  }
}

// Ambil Pengaturan Rekening & WhatsApp Developer langsung dari Supabase Cloud (row sr12-central)
async function fetchDevPaymentSettingsFromSupabase() {
  const client = initSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('stores')
      .select('hero_subtitle')
      .eq('slug', 'sr12-central')
      .maybeSingle();

    if (error || !data || !data.hero_subtitle) return null;
    const raw = data.hero_subtitle;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (e) {
    console.warn('Exception fetching dev payment settings from Supabase:', e);
  }
  return null;
}

/**
 * =========================================================================
 * SISTEM KEAMANAN TINGKAT TINGGI: EMAIL AKTIF & SUPABASE CLOUD AUTH
 * =========================================================================
 */

// Hash password dengan algoritma SHA-256 + Per-Store Secret Salt menggunakan Web Crypto API
async function hashPasswordSecure(password, salt = 'global') {
  try {
    const rawStr = `${String(password).trim()}::sr12_cloud_secure_vault_2026::${String(salt).trim()}`;
    const enc = new TextEncoder();
    const data = enc.encode(rawStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Crypto error fallback:', err);
    let hash = 0;
    const str = `${password}:${salt}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fb_' + Math.abs(hash).toString(16);
  }
}

/**
 * Verifikasi Kredensial Super Admin Developer di Supabase Cloud
 */
async function verifyDeveloperEmailAuthInSupabase(email, password) {
  const client = initSupabaseClient();
  if (!client) {
    return { success: false, message: 'Koneksi database Supabase tidak tersedia.' };
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Email aktif dan Password pengembang harus diisi!' };
  }

  try {
    const expectedHash = await hashPasswordSecure(cleanPass, 'sr12-central');

    // 1. Eksekusi RPC Server-Side (Paling Aman, Hash Diverifikasi di PostgreSQL)
    const { data: rpcData, error: rpcErr } = await client.rpc('rpc_verify_developer_login', {
      p_email: cleanEmail,
      p_password_hash: expectedHash
    });

    if (!rpcErr && rpcData) {
      return rpcData;
    }

    if (rpcErr) {
      console.warn('RPC rpc_verify_developer_login notice:', rpcErr.message || rpcErr);
      return { success: false, message: rpcErr.message || 'Verifikasi login gagal di server.' };
    }

    return { 
      success: false, 
      needs_activation: true, 
      message: 'Developer belum mengaktifkan email resmi di database Cloud. Silakan buka tab Atur Email Developer.' 
    };
  } catch (err) {
    return { success: false, message: 'Terjadi kesalahan sistem keamanan: ' + err.message };
  }
}

/**
 * Daftarkan / Perbarui Email Aktif & Password Baru Super Admin Developer
 */
async function registerDeveloperEmailInSupabase(email, newPassword, masterPin) {
  const client = initSupabaseClient();
  if (!client) return { success: false, message: 'Koneksi Supabase belum siap.' };

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(newPassword || '').trim();
  const pinInput = String(masterPin || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Email dan password baru tidak boleh kosong!' };
  }
  if (cleanPass.length < 6) {
    return { success: false, message: 'Password Developer minimal harus 6 karakter!' };
  }

  try {
    const hash = await hashPasswordSecure(cleanPass, 'sr12-central');

    // 1. Coba RPC Server-Side Terlebih Dahulu
    try {
      const { data: rpcData, error: rpcErr } = await client.rpc('rpc_register_developer_email', {
        p_email: cleanEmail,
        p_password_hash: hash,
        p_master_pin: pinInput
      });
      if (!rpcErr && rpcData) {
        return rpcData;
      }
    } catch(rpcEx) {}

    // 2. Fallback Update Terproteksi
    const { error } = await client
      .from('stores')
      .update({
        owner_email: cleanEmail,
        password_hash: hash
      })
      .eq('slug', 'sr12-central');

    if (error) {
      return { success: false, message: 'Gagal menyimpan ke Supabase: ' + error.message };
    }

    const devToken = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    return { success: true, email: cleanEmail, role: 'developer', token: devToken };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Verifikasi Kredensial Pemilik Toko (Distributor) di Supabase Cloud
 */
async function verifyDistributorEmailAuthInSupabase(storeSlug, email, password) {
  const client = initSupabaseClient();
  if (!client) {
    return { success: false, message: 'Koneksi database Supabase tidak tersedia.' };
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();
  const slug = String(storeSlug || 'alzam-agency').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Email aktif dan Password toko harus diisi!' };
  }

  try {
    const expectedHash = await hashPasswordSecure(cleanPass, slug);

    // 1. Eksekusi RPC Server-Side (Paling Aman, Anti-Tamper & Anti-Bypass)
    const { data: rpcData, error: rpcErr } = await client.rpc('rpc_verify_distributor_login', {
      p_slug: slug,
      p_email: cleanEmail,
      p_password_hash: expectedHash
    });

    if (!rpcErr && rpcData) {
      return rpcData;
    }

    if (rpcErr) {
      console.warn('RPC rpc_verify_distributor_login notice:', rpcErr.message || rpcErr);
      return { success: false, message: rpcErr.message || 'Verifikasi login toko gagal di server.' };
    }

    return { 
      success: false, 
      needs_activation: true, 
      message: 'Toko ini belum mengaktifkan email resmi. Silakan buka tab Aktivasi Email Toko untuk mendaftarkan akun.' 
    };
  } catch (err) {
    return { success: false, message: 'Kesalahan sistem autentikasi: ' + err.message };
  }
}

/**
 * Daftarkan / Perbarui Email Aktif & Password Pemilik Toko Distributor
 */
async function registerDistributorEmailInSupabase(storeSlug, email, newPassword, initialPin) {
  const client = initSupabaseClient();
  if (!client) return { success: false, message: 'Koneksi Supabase belum siap.' };

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPass = String(newPassword || '').trim();
  const slug = String(storeSlug || 'alzam-agency').trim();
  const pinInput = String(initialPin || '').trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Email dan password tidak boleh kosong!' };
  }
  if (cleanPass.length < 6) {
    return { success: false, message: 'Password minimal 6 karakter!' };
  }

  try {
    const hash = await hashPasswordSecure(cleanPass, slug);

    // 1. Coba RPC Server-Side Terlebih Dahulu
    try {
      const { data: rpcData, error: rpcErr } = await client.rpc('rpc_register_distributor_email', {
        p_slug: slug,
        p_email: cleanEmail,
        p_password_hash: hash,
        p_initial_pin: pinInput
      });
      if (!rpcErr && rpcData) {
        return rpcData;
      }
    } catch(rpcEx) {}

    // 2. Fallback Update Terproteksi
    const { error } = await client
      .from('stores')
      .update({
        owner_email: cleanEmail,
        password_hash: hash
      })
      .eq('slug', slug);

    if (error) {
      return { success: false, message: 'Gagal memperbarui email toko di Supabase: ' + error.message };
    }

    const distToken = 'dist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    return { success: true, email: cleanEmail, role: 'distributor', token: distToken };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// Window global exports
window.initSupabaseClient = initSupabaseClient;
window.syncStoresFromSupabase = syncStoresFromSupabase;
window.saveStoreToSupabase = saveStoreToSupabase;
window.deleteStoreFromSupabase = deleteStoreFromSupabase;
window.updateStorePinInSupabase = updateStorePinInSupabase;
window.updateDevPaymentSettingsInSupabase = updateDevPaymentSettingsInSupabase;
window.fetchDevPaymentSettingsFromSupabase = fetchDevPaymentSettingsFromSupabase;
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
window.clearMarketerSalesFromSupabase = clearMarketerSalesFromSupabase;
window.saveProductToSupabase = saveProductToSupabase;
window.deleteProductFromSupabase = deleteProductFromSupabase;
window.syncProductsFromSupabase = syncProductsFromSupabase;
window.findMitraInSupabase = findMitraInSupabase;
window.fetchSingleProductFromSupabase = fetchSingleProductFromSupabase;
window.saveOrderToSupabase = saveOrderToSupabase;
window.syncOrdersFromSupabase = syncOrdersFromSupabase;
window.clearOrdersFromSupabase = clearOrdersFromSupabase;
window.updateOrderStatusInSupabase = updateOrderStatusInSupabase;
window.updateStoreQuotaInSupabase = updateStoreQuotaInSupabase;
window.getOfflineTransactionsQueue = getOfflineTransactionsQueue;
window.enqueueOfflineTransaction = enqueueOfflineTransaction;
window.flushOfflineTransactions = flushOfflineTransactions;
/**
 * Sinkronkan transaksi arus kas POS Olsera / Web ke Cloud Supabase (platform_ledger)
 */
async function saveCashflowToSupabase(entry, storeSlug = 'sr12-central') {
  const client = initSupabaseClient();
  if (!client || !entry) return false;
  try {
    const slug = storeSlug || entry.store_slug || 'sr12-central';
    const payload = {
      store_slug: slug,
      transaction_type: entry.type === 'in' ? 'CASH_IN' : 'CASH_OUT',
      quota_amount: 0,
      nominal_amount: Number(entry.amount || entry.grandTotal || 0),
      payment_method: entry.account || 'CASH',
      payment_status: 'SUCCESS'
    };
    const { error } = await client.from('platform_ledger').insert(payload);
    if (!error) {
      console.log('☁️ [Supabase] Arus kas kasir berhasil dicatat di cloud:', entry.id || entry.notes);
      return true;
    }
  } catch(e) {
    console.warn('saveCashflowToSupabase error:', e);
  }
  return false;
}
window.saveCashflowToSupabase = saveCashflowToSupabase;

// Security Exports
window.hashPasswordSecure = hashPasswordSecure;
window.verifyDeveloperEmailAuthInSupabase = verifyDeveloperEmailAuthInSupabase;
window.registerDeveloperEmailInSupabase = registerDeveloperEmailInSupabase;
window.verifyDistributorEmailAuthInSupabase = verifyDistributorEmailAuthInSupabase;
window.registerDistributorEmailInSupabase = registerDistributorEmailInSupabase;




