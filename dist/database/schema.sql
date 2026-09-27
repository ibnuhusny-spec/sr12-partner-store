-- ========================================================
-- SR12 PARTNER STORE - PRODUCTION POSTGRESQL / SUPABASE SCHEMA
-- Skema Database Multi-Tenant Cloud Terisolasi per Distributor
-- ========================================================

-- 1. TABEL: STORES (DATA TOKO & AKUN DISTRIBUTOR)
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
  owner_email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  partner_tier VARCHAR(30) DEFAULT 'distributor',
  fee_payer VARCHAR(20) DEFAULT 'buyer',
  order_quota INT DEFAULT 15,
  wallet_balance NUMERIC(12,2) DEFAULT 15000.00,
  total_topup_paid NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL: MITRA_DOWNLINES (DATABASE AGEN, SUB AGEN, RESELLER, MARKETER)
CREATE TABLE IF NOT EXISTS mitra_downlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  partner_code VARCHAR(50) NOT NULL, -- AG-001, SUB-001, RS-001, MKT-001
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
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'warning', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_store_partner_code UNIQUE (store_id, partner_code)
);

-- 3. TABEL: MARKETER_SALES (BUKU PENJUALAN & REKAP GAJI BULANAN MARKETER 15%)
CREATE TABLE IF NOT EXISTS marketer_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id VARCHAR(50) NOT NULL,
  marketer_id VARCHAR(50) NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month_period VARCHAR(7) NOT NULL, -- '2026-09'
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(30),
  customer_address TEXT,
  fulfillment_type VARCHAR(20) DEFAULT 'pickup', -- 'pickup' (ambil sendiri) atau 'dropship'
  items_desc TEXT NOT NULL,
  omset_het NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  commission_pct NUMERIC(5,2) DEFAULT 15.00,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  paid_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid' atau 'paid'
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: PRODUCTS (KATALOG PRODUK & FOTO PRODUK PER DISTRIBUTOR)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
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
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  transaction_type VARCHAR(30) NOT NULL, -- 'TOPUP_WALLET', 'DEDUCT_ORDER_QUOTA'
  quota_amount INT NOT NULL,
  nominal_amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'QRIS',
  payment_status VARCHAR(20) DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS) SUPABASE
-- Distributor hanya dapat mengelola data miliknya sendiri!
-- Pengunjung publik dapat melihat info toko & katalog produk.
-- ========================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitra_downlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ledger ENABLE ROW LEVEL SECURITY;

-- Toko: Publik bisa baca info toko (nama, logo, WA), Distributor bisa kelola tokonya
CREATE POLICY "Public read stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Distributor manage own store" ON stores FOR ALL USING (auth.uid() = id);

-- Produk: Publik bisa lihat katalog produk, Distributor bisa tambah/ubah produk tokonya
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Distributor manage products" ON products FOR ALL USING (store_id = auth.uid());

-- Mitra: Hanya distributor pemilik yang bisa melihat dan mengelola mitranya
CREATE POLICY "Mitra isolation policy" ON mitra_downlines FOR ALL USING (store_id = auth.uid());

-- Penjualan Marketer: Hanya distributor pemilik yang bisa melihat dan mengelola
CREATE POLICY "Marketer sales isolation policy" ON marketer_sales FOR ALL USING (store_id = auth.uid());

-- Platform Ledger: Distributor bisa melihat riwayat top up miliknya
CREATE POLICY "Distributor read ledger" ON platform_ledger FOR SELECT USING (store_id = auth.uid());

-- INDEX UNTUK PERFORMA TINGGI
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_mitra_store_id ON mitra_downlines(store_id);
CREATE INDEX IF NOT EXISTS idx_marketer_sales_store_month ON marketer_sales(store_id, month_period);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

-- ========================================================
-- SEED DATA AWAL: TOKO CONTOH & MITRA
-- ========================================================
INSERT INTO stores (id, slug, store_name, store_tagline, store_theme, hero_title, hero_subtitle, hero_banner_url, store_logo_text, store_wa_number, store_city, store_owner, owner_email, password_hash, partner_tier, order_quota, wallet_balance)
VALUES 
(
  'a0000000-0000-0000-0000-000000000001',
  'aisyah-herbal',
  'Aisyah SR12 Distributor Hub',
  'Distributor Resmi SR12 Wilayah Jawa Barat',
  'emerald',
  'Pusat Distribusi & Grosir Resmi SR12 Jawa Barat',
  'Melayani Agen, Sub Agen, Reseller & Konsumen. Order instan via WhatsApp, stok ready gudang distributor.',
  'assets/hero-banner.jpg',
  'SR12',
  '6281234567890',
  'Bandung',
  'Ibu Aisyah (Distributor Utama)',
  'aisyah@sr12.co.id',
  '1234',
  'distributor',
  15,
  15000.00
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO mitra_downlines (store_id, partner_code, name, phone, city, tier, bank_name, bank_account, bank_holder, accumulated_spent_90_days, total_orders_count)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'AG-001', 'dr. Linda Sp.KK', '085712345678', 'Jakarta Selatan', 'agen', 'BCA', '1234567890', 'dr. Linda', 8500000, 14),
('a0000000-0000-0000-0000-000000000001', 'SUB-001', 'Haji Ahmad Fauzi', '087890123456', 'Surabaya', 'sub_agen', 'BRI', '4455667788', 'Ahmad Fauzi', 2400000, 6),
('a0000000-0000-0000-0000-000000000001', 'RS-001', 'Siti Rahmawati', '081345678901', 'Bandung', 'reseller', 'Mandiri', '13100998877', 'Siti Rahmawati', 650000, 3),
('a0000000-0000-0000-0000-000000000001', 'MKT-001', 'Dina Lestari (Marketer)', '087722334455', 'Cimahi', 'marketer', 'Dana', '087722334455', 'Dina Lestari', 820000, 2)
ON CONFLICT DO NOTHING;
