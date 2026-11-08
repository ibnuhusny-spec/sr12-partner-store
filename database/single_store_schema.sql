-- =========================================================================
-- SR12 SINGLE-STORE / STANDALONE INSTANCE SCHEMA (SUPABASE POSTGRESQL)
-- Versi: 2.1 (Dikhususkan untuk Operasional Satu Toko Tunggal)
-- Cara Pakai: Buka SQL Editor di Dashboard Supabase toko Anda, Copy-Paste semua lalu Run.
-- =========================================================================

-- 1. TABEL: STORE_PROFILE (Identitas & Pengaturan Toko Tunggal)
CREATE TABLE IF NOT EXISTS store_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) UNIQUE NOT NULL DEFAULT 'sr12-central',
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
  store_admin_pin VARCHAR(20) DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL: PRODUCTS (Katalog Produk & Stok Toko)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80) DEFAULT 'sr12-central',
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80),
  netto VARCHAR(50),
  het_price NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  description TEXT,
  stock INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: ORDERS (Transaksi POS Kasir & Pesanan Web Masuk)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80) DEFAULT 'sr12-central',
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
  payment_method VARCHAR(80) DEFAULT 'Tunai',
  status VARCHAR(40) DEFAULT 'Lunas / Selesai',
  order_source VARCHAR(40) DEFAULT 'Kasir POS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: MITRA_DOWNLINES (Data Reseller, Sub Agen, Agen, Marketer)
CREATE TABLE IF NOT EXISTS mitra_downlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80) DEFAULT 'sr12-central',
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

-- 5. TABEL: CASHFLOW (Buku Arus Kas Masuk / Keluar Toko)
CREATE TABLE IF NOT EXISTS cashflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_slug VARCHAR(80) DEFAULT 'sr12-central',
  date TIMESTAMPTZ DEFAULT NOW(),
  type VARCHAR(10) NOT NULL, -- 'in' (masuk) atau 'out' (keluar)
  category VARCHAR(80) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  operator VARCHAR(80) DEFAULT 'Kasir Utama',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- INDEXING UNTUK PERFORMA QUERY CEPAT
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_single_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_single_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_single_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_single_mitra_code ON mitra_downlines(UPPER(partner_code));
CREATE INDEX IF NOT EXISTS idx_single_cashflow_date ON cashflow(date DESC);

-- =========================================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS UNTUK APLIKASI WEB TOKO
-- =========================================================================
ALTER TABLE store_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra_downlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Aplikasi Toko memiliki akses penuh melalui ANON KEY
CREATE POLICY "Public Read/Write store_profile" ON store_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write mitra_downlines" ON mitra_downlines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write cashflow" ON cashflow FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- AKTIFKAN SUPABASE REALTIME (Untuk update otomatis di HP & Komputer)
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE mitra_downlines;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE cashflow;

