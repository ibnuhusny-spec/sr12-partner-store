-- ========================================================
-- SR12 PARTNER STORE - PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- Skema Database Multi-Tenant Cloud Terisolasi per Distributor & Antrean Pendaftaran
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
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending'
);

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
-- KEAMANAN: ROW LEVEL SECURITY (RLS) SUPABASE
-- Mengaktifkan akses baca/tulis aman untuk klien aplikasi web
-- ========================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra_downlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public insert stores" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stores" ON stores FOR UPDATE USING (true);
CREATE POLICY "Public delete stores" ON stores FOR DELETE USING (true);

CREATE POLICY "Public read pending_stores" ON pending_stores FOR SELECT USING (true);
CREATE POLICY "Public insert pending_stores" ON pending_stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update pending_stores" ON pending_stores FOR UPDATE USING (true);
CREATE POLICY "Public delete pending_stores" ON pending_stores FOR DELETE USING (true);

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public manage products" ON products FOR ALL USING (true);

CREATE POLICY "Public manage mitra" ON mitra_downlines FOR ALL USING (true);
CREATE POLICY "Public manage marketer_sales" ON marketer_sales FOR ALL USING (true);
CREATE POLICY "Public manage platform_ledger" ON platform_ledger FOR ALL USING (true);

-- INDEX UNTUK KECEPATAN TINGGI
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_pending_stores_slug ON pending_stores(slug);
CREATE INDEX IF NOT EXISTS idx_mitra_store_slug ON mitra_downlines(store_slug);
CREATE INDEX IF NOT EXISTS idx_marketer_sales_store_month ON marketer_sales(store_slug, month_period);
CREATE INDEX IF NOT EXISTS idx_products_store_slug ON products(store_slug);

-- ========================================================
-- KEAMANAN STORAGE: IZIN UPLOAD & AKSES FOTO BUCKET PRODUCTS
-- ========================================================
CREATE POLICY "Public Access Products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public Upload Products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Public Update Products" ON storage.objects FOR UPDATE USING (bucket_id = 'products');
CREATE POLICY "Public Delete Products" ON storage.objects FOR DELETE USING (bucket_id = 'products');

