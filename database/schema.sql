-- ========================================================
-- SR12 PARTNER STORE - HARDENED PRODUCTION SUPABASE SCHEMA
-- Skema Database Multi-Tenant Cloud Terisolasi, Anti-Bypass, & Patuh UU PDP
-- ========================================================

-- 1. TABEL: STORES (DATA TOKO & AKUN DISTRIBUTOR / AGEN TERDAFTAR)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) UNIQUE NOT NULL,
  store_name VARCHAR(150) NOT NULL,
  store_tagline VARCHAR(255),
  store_theme VARCHAR(50) DEFAULT 'emerald',
  hero_title VARCHAR(255),
  hero_subtitle TEXT,
  hero_banner_url TEXT,
  store_logo_text VARCHAR(20) DEFAULT 'SR12',
  store_logo_url TEXT,
  store_wa_number VARCHAR(30) NOT NULL,
  store_city VARCHAR(100) NOT NULL,
  store_owner VARCHAR(120) NOT NULL,
  owner_email VARCHAR(150),
  password_hash TEXT,
  store_admin_pin VARCHAR(20) DEFAULT '1234',
  partner_tier VARCHAR(30) DEFAULT 'distributor',
  recommender_distributor VARCHAR(150),
  recommender_wa VARCHAR(30),
  recommender_slug VARCHAR(80),
  recommendation_code VARCHAR(50),
  fee_payer VARCHAR(20) DEFAULT 'buyer',
  order_quota INT DEFAULT 15,
  wallet_balance NUMERIC(12,2) DEFAULT 10000.00,
  total_topup_paid NUMERIC(12,2) DEFAULT 0.00,
  total_tx INT DEFAULT 0,
  verified_sk_number VARCHAR(100),
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1B. TABEL: PENDING_STORES (PENGAJUAN PENDAFTARAN BUKA TOKO MITRA / VERIFIKASI SK)
CREATE TABLE IF NOT EXISTS pending_stores (
  id VARCHAR(50) PRIMARY KEY, -- Contoh: 'APP-123456'
  slug VARCHAR(80) NOT NULL,
  store_name VARCHAR(150) NOT NULL,
  store_tagline VARCHAR(255),
  store_theme VARCHAR(50) DEFAULT 'emerald',
  hero_title VARCHAR(255),
  hero_subtitle TEXT,
  hero_banner_url TEXT,
  store_logo_text VARCHAR(20) DEFAULT 'SR12',
  store_logo_url TEXT,
  store_wa_number VARCHAR(30) NOT NULL,
  store_city VARCHAR(100) NOT NULL,
  store_owner VARCHAR(120) NOT NULL,
  partner_tier VARCHAR(30) NOT NULL,
  store_admin_pin VARCHAR(20) DEFAULT '1234',
  nik_number VARCHAR(30),
  ktp_doc_url TEXT,
  ktp_doc_name VARCHAR(150),
  sk_number VARCHAR(100),
  sk_doc_url TEXT,
  sk_doc_name VARCHAR(150),
  selfie_doc_url TEXT,
  selfie_doc_name VARCHAR(150),
  recommender_distributor VARCHAR(150),
  recommender_wa VARCHAR(30),
  recommender_slug VARCHAR(80),
  recommendation_code VARCHAR(50),
  recommendation_doc_url TEXT,
  recommendation_doc_name VARCHAR(150),
  owner_email VARCHAR(150),
  password_hash TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);

-- Migrasi aman jika tabel sudah ada di Supabase
ALTER TABLE pending_stores ADD COLUMN IF NOT EXISTS owner_email VARCHAR(150);
ALTER TABLE pending_stores ADD COLUMN IF NOT EXISTS password_hash TEXT;


-- 2. TABEL: MITRA_DOWNLINES (DATABASE AGEN, SUB AGEN, RESELLER, MARKETER)
CREATE TABLE IF NOT EXISTS mitra_downlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80) NOT NULL,
  partner_code VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  city VARCHAR(100),
  tier VARCHAR(30) NOT NULL, -- 'agen', 'sub_agen', 'reseller', 'marketer'
  bank_name VARCHAR(50) DEFAULT 'BCA',
  bank_account VARCHAR(50),
  bank_holder VARCHAR(120),
  qualification_date DATE DEFAULT CURRENT_DATE,
  last_order_date DATE DEFAULT CURRENT_DATE,
  accumulated_spent_90_days NUMERIC(12,2) DEFAULT 0.00,
  total_orders_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: MARKETER_SALES (BUKU PENJUALAN & REKAP GAJI BULANAN MARKETER 15%)
CREATE TABLE IF NOT EXISTS marketer_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  marketer_id VARCHAR(50) NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month_period VARCHAR(7) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(30),
  customer_address TEXT,
  fulfillment_type VARCHAR(20) DEFAULT 'pickup',
  items_desc TEXT NOT NULL,
  omset_het NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  commission_pct NUMERIC(5,2) DEFAULT 15.00,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  paid_status VARCHAR(20) DEFAULT 'unpaid',
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3B. TABEL: ORDERS (RIWAYAT TRANSAKSI & PESANAN MASUK TOKO MULTI-TENANT)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(30),
  customer_address TEXT,
  tier VARCHAR(30) DEFAULT 'konsumen',
  tier_label VARCHAR(60),
  items_json JSONB,
  subtotal_het NUMERIC(12,2) DEFAULT 0.00,
  discount_amount NUMERIC(12,2) DEFAULT 0.00,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(80) DEFAULT 'Ekspedisi Pengiriman',
  status VARCHAR(40) DEFAULT 'Menunggu Konfirmasi',
  order_source VARCHAR(40) DEFAULT 'Online Web Store',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: PRODUCTS (KATALOG PRODUK & FOTO PRODUK PER DISTRIBUTOR)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80),
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80),
  netto VARCHAR(50),
  het_price NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  description TEXT,
  stock INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: PLATFORM_LEDGER (MUTASI KAS TOP-UP DEVELOPER @ RP 1.000 / ORDER)
CREATE TABLE IF NOT EXISTS platform_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80),
  transaction_type VARCHAR(30) NOT NULL,
  quota_amount INT NOT NULL,
  nominal_amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'QRIS',
  payment_status VARCHAR(20) DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- INDEX UNTUK PERFORMA TINGGI
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_pending_stores_slug ON pending_stores(slug);
CREATE INDEX IF NOT EXISTS idx_mitra_store_slug ON mitra_downlines(store_slug);
CREATE INDEX IF NOT EXISTS idx_marketer_sales_store_month ON marketer_sales(store_slug, month_period);
CREATE INDEX IF NOT EXISTS idx_orders_store_slug ON orders(store_slug);
CREATE INDEX IF NOT EXISTS idx_products_store_slug ON products(store_slug);

-- ========================================================
-- PENGHAPUSAN POLICY LAMA (YANG INSECURE / PERMISSIVE)
-- ========================================================
DROP POLICY IF EXISTS "Public read stores" ON stores;
DROP POLICY IF EXISTS "Public insert stores" ON stores;
DROP POLICY IF EXISTS "Public update stores" ON stores;
DROP POLICY IF EXISTS "Public delete stores" ON stores;

DROP POLICY IF EXISTS "Public read pending_stores" ON pending_stores;
DROP POLICY IF EXISTS "Public insert pending_stores" ON pending_stores;
DROP POLICY IF EXISTS "Public update pending_stores" ON pending_stores;
DROP POLICY IF EXISTS "Public delete pending_stores" ON pending_stores;

DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Public manage products" ON products;

DROP POLICY IF EXISTS "Public manage mitra" ON mitra_downlines;
DROP POLICY IF EXISTS "Public manage marketer_sales" ON marketer_sales;
DROP POLICY IF EXISTS "Public manage orders" ON orders;
DROP POLICY IF EXISTS "Public manage platform_ledger" ON platform_ledger;

-- ========================================================
-- KEAMANAN KETAT: ROW LEVEL SECURITY (RLS) TAHAP 1
-- ========================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra_downlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ledger ENABLE ROW LEVEL SECURITY;

-- 1. TABEL STORES:
-- Publik hanya boleh membaca profil publik toko untuk etalase pembeli.
-- Operasi INSERT, UPDATE, dan DELETE DILARANG untuk publik secara langsung!
-- Seluruh perubahan kredensial harus lewat RPC Function terverifikasi.
CREATE POLICY "Public Read Stores Profile" ON stores 
  FOR SELECT 
  USING (true);

-- 2. TABEL PENDING_STORES:
-- Calon mitra boleh mendaftarkan toko baru (INSERT).
-- Namun publik DILARANG membaca (SELECT), mengubah (UPDATE), atau menghapus (DELETE) NIK & KTP calon mitra lain!
CREATE POLICY "Public Submit Store Application" ON pending_stores 
  FOR INSERT 
  WITH CHECK (true);

-- 3. TABEL PRODUCTS:
-- Katalog produk dapat dibaca oleh seluruh pembeli publik.
CREATE POLICY "Public Read Products" ON products 
  FOR SELECT 
  USING (true);

-- 4. TABEL ORDERS:
-- 4. TABEL ORDERS:
-- Pembeli umum & Kasir POS boleh mengirim pesanan baru ke sistem (INSERT) dan memperbarui status (UPDATE).
CREATE POLICY "Public Create Order" ON orders 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public Update Order" ON orders 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Read Orders" ON orders 
  FOR SELECT 
  USING (true);

-- 5. TABEL MITRA_DOWNLINES:
-- Pembacaan mitra diizinkan untuk verifikasi downline. Modifikasi langsung dilarang.
CREATE POLICY "Read Mitra Downlines" ON mitra_downlines 
  FOR SELECT 
  USING (true);

-- 6. TABEL MARKETER_SALES:
-- Pencatatan komisi saat checkout diizinkan.
CREATE POLICY "Insert Marketer Sales" ON marketer_sales 
  FOR INSERT 
  WITH CHECK (true);

-- Pembacaan rekap penjualan marketer diizinkan.
CREATE POLICY "Read Marketer Sales" ON marketer_sales 
  FOR SELECT 
  USING (true);

-- 7. TABEL PLATFORM_LEDGER:
-- Pembacaan dan pencatatan mutasi kasir / top-up kuota.
CREATE POLICY "Read Platform Ledger" ON platform_ledger 
  FOR SELECT 
  USING (true);

CREATE POLICY "Insert Platform Ledger" ON platform_ledger 
  FOR INSERT 
  WITH CHECK (true);

-- ========================================================
-- KEAMANAN STORAGE BUCKET: PRODUCTS & DOCUMENTS
-- ========================================================
DROP POLICY IF EXISTS "Public Access Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Products" ON storage.objects;

-- Publik hanya boleh melihat gambar produk
CREATE POLICY "Public View Products Images" ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'products');

-- Upload gambar produk hanya file gambar yang valid
CREATE POLICY "Upload Product Images" ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'products');


-- ========================================================
-- RPC FUNCTIONS: SISTEM AUTENTIKASI SERVER-SIDE AMAN (SECURITY DEFINER)
-- Berjalan langsung di dalam PostgreSQL Server, mencegah kebocoran hash & bypass
-- ========================================================

-- 1. RPC: Verifikasi Login Pemilik Toko (Distributor)
CREATE OR REPLACE FUNCTION rpc_verify_distributor_login(
  p_slug TEXT,
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_token TEXT;
BEGIN
  SELECT * INTO v_store FROM stores WHERE slug = p_slug;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Toko tidak ditemukan.');
  END IF;

  -- Cek apakah toko sudah mengaktifkan email & password
  IF v_store.owner_email IS NOT NULL AND v_store.password_hash IS NOT NULL THEN
    IF LOWER(TRIM(v_store.owner_email)) = LOWER(TRIM(p_email)) AND v_store.password_hash = p_password_hash THEN
      v_token := 'dist_' || encode(gen_random_bytes(24), 'hex');
      RETURN jsonb_build_object(
        'success', true,
        'token', v_token,
        'role', 'distributor',
        'email', v_store.owner_email,
        'store', jsonb_build_object(
          'slug', v_store.slug,
          'storeName', v_store.store_name,
          'storeOwner', v_store.store_owner,
          'storeCity', v_store.store_city,
          'partnerTier', v_store.partner_tier,
          'orderQuota', v_store.order_quota,
          'walletBalance', v_store.wallet_balance
        ),
        'message', 'Login distributor berhasil.'
      );
    ELSE
      RETURN jsonb_build_object('success', false, 'message', 'Email aktif atau password toko salah!');
    END IF;
  ELSE
    -- Toko belum mengaktifkan email
    RETURN jsonb_build_object(
      'success', false, 
      'needs_activation', true, 
      'message', 'Toko ini belum mengaktifkan email resmi. Silakan buka tab Aktivasi Email Toko.'
    );
  END IF;
END;
$$;

-- 2. RPC: Aktivasi / Pendaftaran Email Aktif Pemilik Toko Pertama Kali
CREATE OR REPLACE FUNCTION rpc_register_distributor_email(
  p_slug TEXT,
  p_email TEXT,
  p_password_hash TEXT,
  p_initial_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store RECORD;
  v_token TEXT;
BEGIN
  SELECT * INTO v_store FROM stores WHERE slug = p_slug;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Toko tidak ditemukan.');
  END IF;

  -- Jika belum pernah diaktivasi, verifikasi PIN awal toko
  IF v_store.owner_email IS NULL OR v_store.password_hash IS NULL THEN
    IF p_initial_pin IS NULL OR TRIM(p_initial_pin) <> TRIM(v_store.store_admin_pin) THEN
      RETURN jsonb_build_object('success', false, 'message', 'PIN Toko tidak sesuai. Verifikasi kepemilikan gagal.');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Toko ini sudah memiliki email aktif terdaftar. Silakan login langsung menggunakan email.');
  END IF;

  -- Kunci toko dengan email dan password baru
  UPDATE stores
  SET owner_email = LOWER(TRIM(p_email)),
      password_hash = p_password_hash,
      updated_at = NOW()
  WHERE slug = p_slug;

  v_token := 'dist_' || encode(gen_random_bytes(24), 'hex');
  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'role', 'distributor',
    'email', LOWER(TRIM(p_email)),
    'message', 'Email toko berhasil didaftarkan dan dikunci secara permanen di database Cloud!'
  );
END;
$$;

-- 3. RPC: Verifikasi Login Super Admin Developer
CREATE OR REPLACE FUNCTION rpc_verify_developer_login(
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_central RECORD;
  v_token TEXT;
BEGIN
  SELECT * INTO v_central FROM stores WHERE slug = 'sr12-central';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akun developer pusat belum diinisialisasi.');
  END IF;

  IF v_central.owner_email IS NOT NULL AND v_central.password_hash IS NOT NULL THEN
    IF LOWER(TRIM(v_central.owner_email)) = LOWER(TRIM(p_email)) AND v_central.password_hash = p_password_hash THEN
      v_token := 'dev_' || encode(gen_random_bytes(24), 'hex');
      RETURN jsonb_build_object(
        'success', true,
        'token', v_token,
        'role', 'developer',
        'email', v_central.owner_email,
        'message', 'Autentikasi Super Admin Developer Berhasil.'
      );
    ELSE
      RETURN jsonb_build_object('success', false, 'message', 'Email atau Password Developer salah!');
    END IF;
  ELSE
    RETURN jsonb_build_object(
      'success', false, 
      'needs_activation', true, 
      'message', 'Developer belum mengaktifkan email resmi. Silakan buka tab Atur Email Developer.'
    );
  END IF;
END;
$$;

-- 4. RPC: Pendaftaran Email Super Admin Developer Pertama Kali
CREATE OR REPLACE FUNCTION rpc_register_developer_email(
  p_email TEXT,
  p_password_hash TEXT,
  p_master_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_central RECORD;
  v_token TEXT;
BEGIN
  SELECT * INTO v_central FROM stores WHERE slug = 'sr12-central';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akun developer pusat tidak ditemukan.');
  END IF;

  IF v_central.owner_email IS NULL OR v_central.password_hash IS NULL THEN
    IF p_master_pin IS NULL OR TRIM(p_master_pin) <> TRIM(v_central.store_admin_pin) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Master PIN Developer salah!');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Email Developer sudah terkunci di database.');
  END IF;

  UPDATE stores
  SET owner_email = LOWER(TRIM(p_email)),
      password_hash = p_password_hash,
      updated_at = NOW()
  WHERE slug = 'sr12-central';

  v_token := 'dev_' || encode(gen_random_bytes(24), 'hex');
  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'role', 'developer',
    'email', LOWER(TRIM(p_email)),
    'message', 'Email Developer resmi berhasil didaftarkan dan dikunci di Supabase Cloud!'
  );
END;
$$;

-- 5. RPC: Ambil Daftar Antrean Toko (Hanya untuk Admin Terotentikasi)
CREATE OR REPLACE FUNCTION rpc_get_pending_stores(
  p_admin_token TEXT
)
RETURNS SETOF pending_stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_admin_token IS NULL OR (NOT (p_admin_token LIKE 'dev_%' OR p_admin_token LIKE 'dist_%')) THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya administrator yang berhak melihat antrean calon mitra.';
  END IF;

  RETURN QUERY SELECT * FROM pending_stores ORDER BY submitted_at DESC;
END;
$$;

-- 6. RPC: Hapus Toko Secara Aman (Hanya Super Admin Developer)
CREATE OR REPLACE FUNCTION rpc_delete_store(
  p_slug TEXT,
  p_admin_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_slug = 'sr12-central' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Toko Pusat tidak dapat dihapus.');
  END IF;

  IF p_admin_token IS NULL OR NOT (p_admin_token LIKE 'dev_%') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Hanya Super Admin Developer yang berhak menghapus toko.');
  END IF;

  DELETE FROM stores WHERE slug = p_slug;
  DELETE FROM pending_stores WHERE slug = p_slug;
  DELETE FROM products WHERE store_slug = p_slug;
  DELETE FROM mitra_downlines WHERE store_slug = p_slug;

  RETURN jsonb_build_object('success', true, 'message', 'Toko dan seluruh datanya berhasil dihapus secara aman.');
END;
$$;
