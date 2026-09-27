/**
 * SR12 PARTNER STORE - SUPABASE CLOUD INTEGRATION
 * Konfigurasi resmi Supabase Cloud untuk database multi-tenant & image storage
 */

const SUPABASE_URL = 'https://htdmdzbbwltesopfrmoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZG1kemJid2x0ZXNvcGZybW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDk5MjgsImV4cCI6MjEwNjAyNTkyOH0.Ko907etVaBnwUG7uLtaVxtDhe-mVQMiSiVaQiICIFiE';

let supabase = null;

if (window.supabase) {
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase;
    console.log('⚡ Supabase Cloud Connected successfully:', SUPABASE_URL);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

/**
 * Upload gambar produk ke Supabase Storage (bucket: products)
 * @param {File} fileObj - File objek gambar dari input file
 * @param {string} storeSlug - Slug toko distributor
 * @returns {Promise<string>} URL publik gambar
 */
async function uploadProductImageToSupabase(fileObj, storeSlug = 'global') {
  if (!supabase) {
    throw new Error('Supabase client belum terinisialisasi!');
  }

  // Nama file unik
  const fileExt = fileObj.name.split('.').pop();
  const fileName = `${storeSlug}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  // Upload ke bucket 'products'
  const { data, error } = await supabase.storage
    .from('products')
    .upload(fileName, fileObj, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Supabase Storage Upload Error:', error);
    throw error;
  }

  // Dapatkan Public URL
  const { data: publicUrlData } = supabase.storage
    .from('products')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

/**
 * Sinkronisasi data dari Supabase Cloud
 */
async function syncFromSupabase(storeSlug) {
  if (!supabase) return null;
  try {
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', storeSlug)
      .maybeSingle();

    const { data: mitraList } = await supabase
      .from('mitra_downlines')
      .select('*');

    const { data: salesList } = await supabase
      .from('marketer_sales')
      .select('*');

    return { store: storeData, mitra: mitraList || [], sales: salesList || [] };
  } catch (err) {
    console.warn('Gagal sync dari Supabase Cloud:', err);
    return null;
  }
}
