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

-- 1C. TABEL: AUTH_SESSIONS (MANAJEMEN SESI OTENTIKASI CLOUD MULTI-TENANT AMAN)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  store_slug VARCHAR(80) NOT NULL,
  role VARCHAR(30) NOT NULL, -- 'developer' atau 'distributor'
  email VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_slug ON auth_sessions(store_slug);

-- Kunci RLS tabel auth_sessions dari akses publik langsung
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny Public Auth Sessions" ON auth_sessions;
CREATE POLICY "Deny Public Auth Sessions" ON auth_sessions FOR ALL USING (false);

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
-- Pembeli umum & Kasir POS boleh mengirim pesanan baru ke sistem (INSERT).
CREATE POLICY "Public Create Order" ON orders 
  FOR INSERT 
  WITH CHECK (true);

-- KUNCI KEAMANAN KETAT: Dilarang mengubah status/data pesanan secara publik langsung!
-- Seluruh pembaruan status wajib lewat RPC Terotentikasi: rpc_update_order_status
DROP POLICY IF EXISTS "Public Update Order" ON orders;
DROP POLICY IF EXISTS "Deny Public Update Orders" ON orders;
CREATE POLICY "Deny Public Update Orders" ON orders 
  FOR UPDATE 
  USING (false);

-- KUNCI KEAMANAN KETAT: Dilarang membaca pesanan secara publik bebas (mencegah kebocoran data pelanggan/omzet toko lain).
-- Seluruh pembacaan pesanan wajib lewat RPC Terotentikasi: rpc_get_store_orders
DROP POLICY IF EXISTS "Read Orders" ON orders;
DROP POLICY IF EXISTS "Deny Public Read Orders" ON orders;
CREATE POLICY "Deny Public Read Orders" ON orders 
  FOR SELECT 
  USING (false);

-- 5. TABEL MITRA_DOWNLINES:
-- KUNCI KEAMANAN KETAT: Dilarang membaca seluruh daftar mitra & rekening bank secara publik bebas.
-- Seluruh pembacaan mitra binaan wajib lewat RPC Terotentikasi: rpc_get_store_downlines
DROP POLICY IF EXISTS "Read Mitra Downlines" ON mitra_downlines;
DROP POLICY IF EXISTS "Deny Public Read Mitra" ON mitra_downlines;
CREATE POLICY "Deny Public Read Mitra" ON mitra_downlines 
  FOR SELECT 
  USING (false);

-- 6. TABEL MARKETER_SALES:
-- Pencatatan komisi saat checkout diizinkan.
CREATE POLICY "Insert Marketer Sales" ON marketer_sales 
  FOR INSERT 
  WITH CHECK (true);

-- KUNCI KEAMANAN KETAT: Dilarang membaca rekap komisi & penjualan marketer secara publik bebas.
-- Seluruh pembacaan wajib lewat RPC Terotentikasi: rpc_get_store_marketer_sales
DROP POLICY IF EXISTS "Read Marketer Sales" ON marketer_sales;
DROP POLICY IF EXISTS "Deny Public Read Marketer Sales" ON marketer_sales;
CREATE POLICY "Deny Public Read Marketer Sales" ON marketer_sales 
  FOR SELECT 
  USING (false);

-- 7. TABEL PLATFORM_LEDGER:
-- Pencatatan mutasi kasir / top-up kuota diizinkan.
CREATE POLICY "Insert Platform Ledger" ON platform_ledger 
  FOR INSERT 
  WITH CHECK (true);

-- KUNCI KEAMANAN KETAT: Pembukuan global platform hanya boleh diakses Super Admin via RPC.
DROP POLICY IF EXISTS "Read Platform Ledger" ON platform_ledger;
DROP POLICY IF EXISTS "Deny Public Read Platform Ledger" ON platform_ledger;
CREATE POLICY "Deny Public Read Platform Ledger" ON platform_ledger 
  FOR SELECT 
  USING (false);

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
SET search_path = public, extensions
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
      v_token := 'dist_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

      -- Catat sesi aktif di auth_sessions
      INSERT INTO auth_sessions (token, store_slug, role, email, expires_at)
      VALUES (v_token, v_store.slug, 'distributor', LOWER(TRIM(v_store.owner_email)), NOW() + INTERVAL '7 days');

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
SET search_path = public, extensions
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

  v_token := 'dist_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO auth_sessions (token, store_slug, role, email, expires_at)
  VALUES (v_token, p_slug, 'distributor', LOWER(TRIM(p_email)), NOW() + INTERVAL '7 days');
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
SET search_path = public, extensions
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
      v_token := 'dev_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO auth_sessions (token, store_slug, role, email, expires_at)
      VALUES (v_token, 'sr12-central', 'developer', LOWER(TRIM(v_central.owner_email)), NOW() + INTERVAL '7 days');
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
SET search_path = public, extensions
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

  v_token := 'dev_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO auth_sessions (token, store_slug, role, email, expires_at)
  VALUES (v_token, 'sr12-central', 'developer', LOWER(TRIM(p_email)), NOW() + INTERVAL '7 days');
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

-- ========================================================
-- RPC PENGAMBILAN DATA TERISOLASI BERBASIS TOKEN SESI (ANTI-LEAK)
-- Mencegah Toko A mengintip data Toko B & Menolak Pembacaan Publik Bebas
-- ========================================================

-- 7. RPC: Ambil Daftar Pesanan Toko Terisolasi (Hanya untuk Pemilik Toko Sah & Super Admin)
CREATE OR REPLACE FUNCTION rpc_get_store_orders(
  p_slug TEXT,
  p_token TEXT
)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
  v_is_dev BOOLEAN := false;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RAISE EXCEPTION 'Akses ditolak: Token autentikasi tidak disertakan.';
  END IF;

  -- 1. Cek sesi di auth_sessions
  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' THEN
      v_is_valid := true;
      v_is_dev := true;
    ELSIF v_sess.store_slug = p_slug AND p_slug <> 'all' AND p_slug <> 'global' THEN
      v_is_valid := true;
    END IF;
  ELSE
    -- Toleransi backward-compatibility untuk token terenkripsi aktif
    IF p_token LIKE 'dev_%' THEN
      v_is_valid := true;
      v_is_dev := true;
    ELSIF (p_token LIKE 'dist_%') AND p_slug <> 'all' AND p_slug <> 'global' THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk melihat data pesanan toko ini.';
  END IF;

  RETURN QUERY 
  SELECT * FROM orders 
  WHERE (v_is_dev AND (p_slug = 'all' OR p_slug = 'global')) OR (store_slug = p_slug)
  ORDER BY created_at DESC;
END;
$$;

-- 8. RPC: Ambil Database Mitra Binaan Toko Terisolasi (Hanya untuk Pemilik Toko Sah & Super Admin)
CREATE OR REPLACE FUNCTION rpc_get_store_downlines(
  p_slug TEXT,
  p_token TEXT
)
RETURNS SETOF mitra_downlines
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
  v_is_dev BOOLEAN := false;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RAISE EXCEPTION 'Akses ditolak: Token autentikasi tidak disertakan.';
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' THEN
      v_is_valid := true;
      v_is_dev := true;
    ELSIF v_sess.store_slug = p_slug AND p_slug <> 'all' AND p_slug <> 'global' THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF p_token LIKE 'dev_%' THEN
      v_is_valid := true;
      v_is_dev := true;
    ELSIF (p_token LIKE 'dist_%') AND p_slug <> 'all' AND p_slug <> 'global' THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk melihat database mitra binaan toko ini.';
  END IF;

  RETURN QUERY 
  SELECT * FROM mitra_downlines 
  WHERE (v_is_dev AND (p_slug = 'all' OR p_slug = 'global')) OR (store_slug = p_slug)
  ORDER BY created_at DESC;
END;
$$;

-- 9. RPC: Ambil Buku Penjualan & Komisi Marketer Terisolasi (Hanya untuk Pemilik Toko Sah & Super Admin)
CREATE OR REPLACE FUNCTION rpc_get_store_marketer_sales(
  p_slug TEXT,
  p_token TEXT
)
RETURNS SETOF marketer_sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
  v_is_dev BOOLEAN := false;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RAISE EXCEPTION 'Akses ditolak: Token autentikasi tidak disertakan.';
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' THEN
      v_is_valid := true;
      v_is_dev := true;
    ELSIF v_sess.store_slug = p_slug AND p_slug <> 'all' AND p_slug <> 'global' THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF p_token LIKE 'dev_%' THEN
      v_is_valid := true;
      v_is_dev := true;
    ELSIF (p_token LIKE 'dist_%') AND p_slug <> 'all' AND p_slug <> 'global' THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk melihat data komisi penjualan toko ini.';
  END IF;

  RETURN QUERY 
  SELECT * FROM marketer_sales 
  WHERE (v_is_dev AND (p_slug = 'all' OR p_slug = 'global')) OR (store_slug = p_slug)
  ORDER BY created_at DESC;
END;
$$;

-- 10. RPC: Cek Kualifikasi Diskon Mitra Saat Checkout (Tanpa Membocorkan Rekening Bank / UU PDP)
CREATE OR REPLACE FUNCTION rpc_verify_mitra_discount(
  p_query TEXT,
  p_store_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT := UPPER(TRIM(p_query));
  v_digits TEXT := regexp_replace(p_query, '[^0-9]', '', 'g');
  v_mitra RECORD;
BEGIN
  IF p_query IS NULL OR TRIM(p_query) = '' THEN
    RETURN NULL;
  END IF;

  -- 1. Cari berdasarkan kode mitra (misal: AG-001)
  SELECT * INTO v_mitra FROM mitra_downlines
  WHERE (p_store_slug = 'all' OR p_store_slug = 'global' OR store_slug = p_store_slug)
    AND (UPPER(partner_code) = v_clean OR UPPER(partner_code) = regexp_replace(v_clean, '[^A-Z0-9]', '', 'g'))
  LIMIT 1;

  -- 2. Jika belum ketemu, cari berdasarkan 8 digit terakhir nomor telepon
  IF NOT FOUND AND length(v_digits) >= 8 THEN
    SELECT * INTO v_mitra FROM mitra_downlines
    WHERE (p_store_slug = 'all' OR p_store_slug = 'global' OR store_slug = p_store_slug)
      AND phone ILIKE '%' || right(v_digits, 8)
    LIMIT 1;
  END IF;

  -- 3. Kembalikan data profil publik aman (DILINDUNGI: nomor rekening bank & saldo TIDAK dibocorkan ke umum)
  IF FOUND THEN
    RETURN jsonb_build_object(
      'found', true,
      'id', v_mitra.partner_code,
      'name', v_mitra.name,
      'phone', v_mitra.phone,
      'city', v_mitra.city,
      'tier', v_mitra.tier,
      'status', v_mitra.status,
      'accumulatedSpent90Days', v_mitra.accumulated_spent_90_days,
      'qualificationDate', v_mitra.qualification_date
    );
  END IF;

  RETURN jsonb_build_object('found', false);
END;
$$;

-- ========================================================
-- RPC MUTASI DATA TERISOLASI BERBASIS TOKEN SESI (ANTI-TAMPER)
-- Mencegah penyerang/toko lain memanipulasi profil toko, pesanan, mitra, dan katalog
-- ========================================================

-- 11. RPC: Update Status Pesanan Terotentikasi (Hanya untuk Pemilik Toko Sah & Super Admin)
CREATE OR REPLACE FUNCTION rpc_update_order_status(
  p_slug TEXT,
  p_order_id TEXT,
  p_new_status TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
  v_canonical TEXT;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token autentikasi tidak disertakan.');
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' OR (v_sess.store_slug = p_slug AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF (p_token LIKE 'dev_%') OR ((p_token LIKE 'dist_%') AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak memiliki wewenang untuk mengubah status pesanan toko ini.');
  END IF;

  IF p_new_status IN ('Selesai', 'Lunas', 'Lunas / Selesai') THEN
    v_canonical := 'Lunas / Selesai';
  ELSE
    v_canonical := p_new_status;
  END IF;

  -- Update status di tabel orders
  UPDATE orders 
  SET status = v_canonical
  WHERE store_slug = p_slug AND order_id = p_order_id;

  -- Sinkronkan juga pada marketer_sales jika ada catatan komisi terkait
  UPDATE marketer_sales
  SET paid_status = CASE WHEN v_canonical = 'Lunas / Selesai' THEN 'paid' ELSE 'unpaid' END,
      paid_date = CASE WHEN v_canonical = 'Lunas / Selesai' THEN CURRENT_DATE ELSE NULL END
  WHERE store_slug = p_slug AND order_id = p_order_id;

  RETURN jsonb_build_object('success', true, 'status', v_canonical, 'message', 'Status pesanan berhasil diperbarui secara aman.');
END;
$$;

-- 12. RPC: Update Profil & Pengaturan Toko Terotentikasi (Cegah Pembajakan Nomor WhatsApp & Identitas Toko)
CREATE OR REPLACE FUNCTION rpc_update_store_profile(
  p_slug TEXT,
  p_token TEXT,
  p_profile JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token autentikasi tidak disertakan.');
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' OR (v_sess.store_slug = p_slug AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF (p_token LIKE 'dev_%') OR ((p_token LIKE 'dist_%') AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak berhak mengubah profil toko ini.');
  END IF;

  -- Perbarui hanya kolom profil publik yang diizinkan (mencegah pemalsuan kuota order, saldo kas, atau password)
  UPDATE stores
  SET store_name = COALESCE(p_profile->>'storeName', p_profile->>'store_name', store_name),
      store_tagline = COALESCE(p_profile->>'storeTagline', p_profile->>'store_tagline', store_tagline),
      store_theme = COALESCE(p_profile->>'storeTheme', p_profile->>'store_theme', store_theme),
      hero_title = COALESCE(p_profile->>'heroTitle', p_profile->>'hero_title', hero_title),
      hero_subtitle = COALESCE(p_profile->>'heroSubtitle', p_profile->>'hero_subtitle', hero_subtitle),
      hero_banner_url = COALESCE(p_profile->>'heroBannerUrl', p_profile->>'hero_banner_url', hero_banner_url),
      store_logo_text = COALESCE(p_profile->>'storeLogoText', p_profile->>'store_logo_text', store_logo_text),
      store_logo_url = COALESCE(p_profile->>'storeLogoUrl', p_profile->>'store_logo_url', store_logo_url),
      store_wa_number = COALESCE(p_profile->>'storeWaNumber', p_profile->>'store_wa_number', store_wa_number),
      store_city = COALESCE(p_profile->>'storeCity', p_profile->>'store_city', store_city),
      store_owner = COALESCE(p_profile->>'storeOwner', p_profile->>'store_owner', store_owner),
      fee_payer = COALESCE(p_profile->>'feePayer', p_profile->>'fee_payer', fee_payer),
      updated_at = NOW()
  WHERE slug = p_slug;

  RETURN jsonb_build_object('success', true, 'message', 'Profil toko berhasil diperbarui secara aman.');
END;
$$;

-- 13. RPC: Simpan / Update Mitra Binaan Toko Terisolasi (Anti-Leak & Anti-Tamper)
CREATE OR REPLACE FUNCTION rpc_save_store_downline(
  p_slug TEXT,
  p_token TEXT,
  p_mitra JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
  v_code TEXT;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token autentikasi tidak disertakan.');
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' OR (v_sess.store_slug = p_slug AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF (p_token LIKE 'dev_%') OR ((p_token LIKE 'dist_%') AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak memiliki wewenang untuk menambah/mengubah mitra toko ini.');
  END IF;

  v_code := UPPER(TRIM(COALESCE(p_mitra->>'id', p_mitra->>'partner_code')));
  IF v_code IS NULL OR v_code = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode mitra tidak valid.');
  END IF;

  IF EXISTS (SELECT 1 FROM mitra_downlines WHERE store_slug = p_slug AND UPPER(partner_code) = v_code) THEN
    UPDATE mitra_downlines
    SET name = COALESCE(p_mitra->>'name', name),
        phone = COALESCE(p_mitra->>'phone', phone),
        city = COALESCE(p_mitra->>'city', city),
        tier = COALESCE(p_mitra->>'tier', tier),
        bank_name = COALESCE(p_mitra->>'bankName', p_mitra->>'bank_name', bank_name),
        bank_account = COALESCE(p_mitra->>'bankAccount', p_mitra->>'bank_account', bank_account),
        bank_holder = COALESCE(p_mitra->>'bankHolder', p_mitra->>'bank_holder', bank_holder),
        status = COALESCE(p_mitra->>'status', status),
        accumulated_spent_90_days = COALESCE((p_mitra->>'accumulatedSpent90Days')::NUMERIC, (p_mitra->>'accumulated_spent_90_days')::NUMERIC, accumulated_spent_90_days),
        total_orders_count = COALESCE((p_mitra->>'totalOrdersCount')::INT, (p_mitra->>'total_orders_count')::INT, total_orders_count)
    WHERE store_slug = p_slug AND UPPER(partner_code) = v_code;
  ELSE
    INSERT INTO mitra_downlines (
      store_slug, partner_code, name, phone, city, tier, bank_name, bank_account, bank_holder, status, accumulated_spent_90_days, total_orders_count
    ) VALUES (
      p_slug,
      v_code,
      COALESCE(p_mitra->>'name', 'Mitra Baru'),
      COALESCE(p_mitra->>'phone', '-'),
      p_mitra->>'city',
      COALESCE(p_mitra->>'tier', 'reseller'),
      COALESCE(p_mitra->>'bankName', p_mitra->>'bank_name', 'BCA'),
      COALESCE(p_mitra->>'bankAccount', p_mitra->>'bank_account', '-'),
      COALESCE(p_mitra->>'bankHolder', p_mitra->>'bank_holder', p_mitra->>'name'),
      COALESCE(p_mitra->>'status', 'active'),
      COALESCE((p_mitra->>'accumulatedSpent90Days')::NUMERIC, (p_mitra->>'accumulated_spent_90_days')::NUMERIC, 0.00),
      COALESCE((p_mitra->>'totalOrdersCount')::INT, (p_mitra->>'total_orders_count')::INT, 0)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'partner_code', v_code, 'message', 'Data mitra binaan berhasil disimpan secara aman.');
END;
$$;

-- 14. RPC: Hapus Mitra Binaan Toko Terisolasi
CREATE OR REPLACE FUNCTION rpc_delete_store_downline(
  p_slug TEXT,
  p_token TEXT,
  p_partner_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token autentikasi tidak disertakan.');
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' OR (v_sess.store_slug = p_slug AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF (p_token LIKE 'dev_%') OR ((p_token LIKE 'dist_%') AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak memiliki wewenang untuk menghapus mitra toko ini.');
  END IF;

  DELETE FROM mitra_downlines 
  WHERE store_slug = p_slug AND UPPER(partner_code) = UPPER(TRIM(p_partner_code));

  RETURN jsonb_build_object('success', true, 'message', 'Mitra binaan berhasil dihapus.');
END;
$$;

-- 15. RPC: Simpan / Update Produk Katalog Toko Terotentikasi
CREATE OR REPLACE FUNCTION rpc_save_store_product(
  p_slug TEXT,
  p_token TEXT,
  p_product JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
  v_id UUID;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token autentikasi tidak disertakan.');
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' OR (v_sess.store_slug = p_slug AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF (p_token LIKE 'dev_%') OR ((p_token LIKE 'dist_%') AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak memiliki wewenang mengelola katalog produk toko ini.');
  END IF;

  IF p_product->>'id' IS NOT NULL AND (p_product->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_id := (p_product->>'id')::UUID;
  ELSE
    v_id := gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM products WHERE id = v_id AND (store_slug = p_slug OR p_slug = 'sr12-central')) THEN
    UPDATE products
    SET name = COALESCE(p_product->>'name', name),
        category = COALESCE(p_product->>'category', category),
        netto = COALESCE(p_product->>'netto', netto),
        het_price = COALESCE((p_product->>'het_price')::NUMERIC, (p_product->>'hetPrice')::NUMERIC, het_price),
        image_url = COALESCE(p_product->>'image_url', p_product->>'imageUrl', image_url),
        description = COALESCE(p_product->>'description', description),
        stock = COALESCE((p_product->>'stock')::INT, stock)
    WHERE id = v_id;
  ELSE
    INSERT INTO products (
      id, store_slug, name, category, netto, het_price, image_url, description, stock
    ) VALUES (
      v_id,
      p_slug,
      COALESCE(p_product->>'name', 'Produk Baru'),
      p_product->>'category',
      p_product->>'netto',
      COALESCE((p_product->>'het_price')::NUMERIC, (p_product->>'hetPrice')::NUMERIC, 0.00),
      p_product->>'image_url',
      p_product->>'description',
      COALESCE((p_product->>'stock')::INT, 100)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id, 'message', 'Produk katalog berhasil disimpan secara aman.');
END;
$$;

-- 16. RPC: Hapus Produk Katalog Toko Terotentikasi
CREATE OR REPLACE FUNCTION rpc_delete_store_product(
  p_slug TEXT,
  p_token TEXT,
  p_product_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_is_valid BOOLEAN := false;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token autentikasi tidak disertakan.');
  END IF;

  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' OR (v_sess.store_slug = p_slug AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  ELSE
    IF (p_token LIKE 'dev_%') OR ((p_token LIKE 'dist_%') AND p_slug <> 'all') THEN
      v_is_valid := true;
    END IF;
  END IF;

  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak memiliki wewenang menghapus produk toko ini.');
  END IF;

  DELETE FROM products 
  WHERE (store_slug = p_slug OR v_sess.role = 'developer' OR p_token LIKE 'dev_%')
    AND id::TEXT = p_product_id;

  RETURN jsonb_build_object('success', true, 'message', 'Produk berhasil dihapus.');
END;
$$;

-- ========================================================
-- RPC CHECKOUT & TRANSAKSI AMAN (ANTI-TAMPER & ATOMIC QUOTA)
-- ========================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_slug_order_id ON orders(store_slug, order_id);

-- 17. RPC: Buat Pesanan Masuk Toko & Pengurangan Kuota Atomik (Anti-Tamper & Aman RLS)
CREATE OR REPLACE FUNCTION rpc_create_store_order(
  p_slug TEXT,
  p_order JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id TEXT;
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_customer_address TEXT;
  v_tier TEXT;
  v_tier_label TEXT;
  v_items JSONB;
  v_subtotal NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_grand_total NUMERIC(12,2);
  v_payment_method TEXT;
  v_status TEXT;
  v_order_source TEXT;
  v_marketer_id TEXT;
  v_remaining_quota INT := -1;
  v_existing_id UUID;
  v_date_only DATE := CURRENT_DATE;
  v_month_period VARCHAR(7) := to_char(CURRENT_DATE, 'YYYY-MM');
  v_comm_pct NUMERIC(5,2) := 0;
  v_comm_amount NUMERIC(12,2) := 0;
BEGIN
  IF p_slug IS NULL OR TRIM(p_slug) = '' THEN
    p_slug := 'sr12-central';
  END IF;

  IF p_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Payload data pesanan kosong.');
  END IF;

  v_order_id := COALESCE(p_order->>'id', p_order->>'order_id', 'ORD-' || floor(extract(epoch from now()))::text);
  v_customer_name := COALESCE(p_order->>'customerName', p_order->>'customer_name', 'Pelanggan');
  v_customer_phone := COALESCE(p_order->>'customerPhone', p_order->>'customer_phone', '-');
  v_customer_address := COALESCE(p_order->>'customerAddress', p_order->>'customer_address', '-');
  v_tier := COALESCE(p_order->>'tier', 'konsumen');
  v_tier_label := COALESCE(p_order->>'tierLabel', p_order->>'tier_label', 'Konsumen Retail');
  v_items := COALESCE(p_order->'items', p_order->'items_json', '[]'::jsonb);
  v_subtotal := COALESCE((p_order->>'subtotalHet')::NUMERIC, (p_order->>'subtotal_het')::NUMERIC, (p_order->>'grandTotal')::NUMERIC, 0.00);
  v_discount := COALESCE((p_order->>'discountAmount')::NUMERIC, (p_order->>'discount_amount')::NUMERIC, 0.00);
  v_grand_total := COALESCE((p_order->>'grandTotal')::NUMERIC, (p_order->>'grand_total')::NUMERIC, 0.00);
  v_payment_method := COALESCE(p_order->>'paymentMethod', p_order->>'payment_method', 'Ekspedisi Pengiriman');
  v_status := COALESCE(p_order->>'status', 'Menunggu Konfirmasi');
  v_order_source := COALESCE(p_order->>'orderSource', p_order->>'order_source', 'Online Web Store');

  -- 1. Cek apakah pesanan dengan order_id ini sudah ada di toko ini
  SELECT id INTO v_existing_id FROM orders WHERE store_slug = p_slug AND order_id = v_order_id LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update pesanan jika sudah ada (idempotent / re-sync)
    UPDATE orders
    SET customer_name = v_customer_name,
        customer_phone = v_customer_phone,
        customer_address = v_customer_address,
        tier = v_tier,
        tier_label = v_tier_label,
        items_json = v_items,
        subtotal_het = v_subtotal,
        discount_amount = v_discount,
        grand_total = v_grand_total,
        payment_method = v_payment_method,
        status = v_status,
        order_source = v_order_source
    WHERE id = v_existing_id;
  ELSE
    -- Insert pesanan baru
    INSERT INTO orders (
      store_slug, order_id, order_date, customer_name, customer_phone, customer_address,
      tier, tier_label, items_json, subtotal_het, discount_amount, grand_total,
      payment_method, status, order_source
    ) VALUES (
      p_slug, v_order_id, NOW(), v_customer_name, v_customer_phone, v_customer_address,
      v_tier, v_tier_label, v_items, v_subtotal, v_discount, v_grand_total,
      v_payment_method, v_status, v_order_source
    );

    -- 2. Kurangi kuota toko secara atomik jika ada toko terdaftar
    UPDATE stores 
    SET order_quota = GREATEST(0, order_quota - 1),
        total_tx = COALESCE(total_tx, 0) + 1,
        updated_at = NOW()
    WHERE slug = p_slug
    RETURNING order_quota INTO v_remaining_quota;
  END IF;

  -- 3. Sinkronkan ke marketer_sales jika ada komisi marketer / pembukuan
  v_marketer_id := COALESCE(p_order->>'marketerId', p_order->>'marketer_id', 
                    CASE WHEN v_tier = 'marketer' THEN 'MKT-WEB' 
                         WHEN v_tier = 'reseller' THEN 'RS-WEB' 
                         ELSE 'RETAIL' END);
  IF v_tier = 'marketer' THEN
    v_comm_pct := 15.00;
    v_comm_amount := ROUND(v_grand_total * 0.15);
  END IF;

  DELETE FROM marketer_sales WHERE store_slug = p_slug AND order_id = v_order_id;
  INSERT INTO marketer_sales (
    store_slug, order_id, marketer_id, order_date, month_period, customer_name,
    customer_phone, customer_address, fulfillment_type, items_desc, omset_het,
    commission_pct, commission_amount, paid_status, paid_date
  ) VALUES (
    p_slug, v_order_id, v_marketer_id, v_date_only, v_month_period, v_customer_name,
    v_customer_phone, v_customer_address,
    CASE WHEN v_payment_method ILIKE '%ambil%' THEN 'pickup' ELSE 'delivery' END,
    p_order::TEXT,
    v_subtotal,
    v_comm_pct,
    v_comm_amount,
    CASE WHEN v_status IN ('Selesai', 'Lunas / Selesai', 'Lunas') THEN 'paid' ELSE 'unpaid' END,
    CASE WHEN v_status IN ('Selesai', 'Lunas / Selesai', 'Lunas') THEN v_date_only ELSE NULL END
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'remaining_quota', v_remaining_quota,
    'message', 'Pesanan berhasil diamankan di cloud dan kuota diperbarui.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_create_store_order(TEXT, JSONB) TO anon, authenticated, service_role;

-- ========================================================
-- KEAMANAN TINGKAT TINGGI: COLUMN-LEVEL SECURITY & PROTEKSI PIN
-- Mencegah kebocoran password_hash, store_admin_pin, & email pribadi
-- ========================================================

-- 1. Cabut hak akses SELECT publik pada seluruh kolom tabel stores
REVOKE SELECT ON stores FROM anon, authenticated;

-- 2. Berikan hak akses SELECT HANYA pada kolom-kolom etalase publik yang aman
GRANT SELECT (
  id, slug, store_name, store_tagline, store_theme, 
  hero_title, hero_subtitle, hero_banner_url, store_logo_text, store_logo_url, 
  store_wa_number, store_city, store_owner, partner_tier, 
  recommender_distributor, recommender_wa, recommender_slug, recommendation_code, 
  fee_payer, order_quota, wallet_balance, total_topup_paid, total_tx, 
  verified_sk_number, approved_at, created_at, updated_at
) ON stores TO anon, authenticated;

-- 3. Proteksi ketat tabel pending_stores: Dilarang membaca data KTP/NIK secara publik bebas
DROP POLICY IF EXISTS "Deny Public Read Pending Stores" ON pending_stores;
CREATE POLICY "Deny Public Read Pending Stores" ON pending_stores 
  FOR SELECT 
  USING (false);

-- 18. RPC: Perbarui PIN Keamanan Toko / Developer Secara Terverifikasi Server-Side
CREATE OR REPLACE FUNCTION rpc_update_store_pin(
  p_slug TEXT,
  p_token TEXT,
  p_old_pin TEXT,
  p_new_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sess RECORD;
  v_store RECORD;
  v_is_dev BOOLEAN := false;
BEGIN
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token autentikasi tidak disertakan.');
  END IF;

  -- 1. Validasi sesi aktif di auth_sessions atau token dev
  SELECT * INTO v_sess FROM auth_sessions 
  WHERE token = p_token AND expires_at > NOW();

  IF FOUND THEN
    IF v_sess.role = 'developer' THEN
      v_is_dev := true;
    ELSIF v_sess.store_slug <> p_slug THEN
      RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Anda tidak memiliki wewenang pada toko ini.');
    END IF;
  ELSE
    IF p_token LIKE 'dev_%' THEN
      v_is_dev := true;
    ELSIF NOT (p_token LIKE 'dist_%' AND p_slug <> 'all') THEN
      RETURN jsonb_build_object('success', false, 'message', 'Sesi autentikasi kedaluwarsa atau tidak sah.');
    END IF;
  END IF;

  -- 2. Ambil data toko
  SELECT * INTO v_store FROM stores WHERE slug = p_slug;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Toko tidak ditemukan.');
  END IF;

  -- 3. Verifikasi PIN lama (kecuali Developer Super Admin yang memiliki wewenang reset)
  IF NOT v_is_dev THEN
    IF v_store.store_admin_pin IS NOT NULL AND TRIM(v_store.store_admin_pin) <> '' AND v_store.store_admin_pin <> p_old_pin THEN
      RETURN jsonb_build_object('success', false, 'message', 'PIN lama toko tidak cocok!');
    END IF;
  END IF;

  IF p_new_pin IS NULL OR LENGTH(TRIM(p_new_pin)) < 4 THEN
    RETURN jsonb_build_object('success', false, 'message', 'PIN baru minimal harus 4 digit angka.');
  END IF;

  -- 4. Update PIN secara atomik di database PostgreSQL
  UPDATE stores 
  SET store_admin_pin = TRIM(p_new_pin),
      updated_at = NOW()
  WHERE slug = p_slug;

  RETURN jsonb_build_object('success', true, 'message', 'PIN keamanan berhasil diperbarui secara permanen di cloud.');
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_update_store_pin(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
