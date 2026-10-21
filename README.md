# 🌿 SR12 Partner Store & Olsera POS Backoffice (v2.0 Component Architecture)

Platform Toko Online Resmi & Sistem Manajemen Gudang POS Distributor untuk Ekosistem Kemitraan **SR12 Herbal Skin Care**.

Arsitektur telah diperbarui dari monolitik vanilla menjadi **Vite + React (TypeScript)** berbasis komponen modular, tipe data aman (*type-safe*), dan terhubung langsung ke **Supabase PostgreSQL Cloud**. Seluruh kode lama tersimpan aman di folder `legacy/` dan git branch `legacy-monolith`.

---

## ✨ Fitur & Modul Utama

### 🛒 1. Toko Online Pembeli (Storefront Retail & Mitra)
* **Katalog Resmi SR12:** BPOM & Halal MUI dengan detail netto, deskripsi lengkap, dan foto asli.
* **Harga Kemitraan Otomatis (Tiering System):**
  * Konsumen Retail (Harga HET Resmi)
  * Mitra Marketer (Komisi 15% akumulasi bulanan)
  * Reseller Resmi (Diskon 20%, FO Rp 400.000)
  * Sub Agen (Diskon 30%, FO Rp 3.500.000)
  * Agen Resmi (Diskon 40%, FO Rp 15.000.000)
  * Distributor Utama (Diskon 50%)
* **Kartu Produk dengan 3 Tombol Kapsul Sebaris:**
  * Tombol Beli / Keranjang
  * Tombol Detail Produk (Modal info lengkap)
  * Tombol Share / Promosi (Link langsung tanpa Shopee, 3 tombol icon-only: WhatsApp, Salin, Share HP)
* **Drawer Keranjang Belanja:** Pilihan kurir (J&T, JNE, SiCepat, COD, Ambil di Gudang), validasi kode diskon kemitraan, formulir dropship, dan checkout pesan rapi langsung ke WhatsApp pemilik toko.
* **Pendaftaran Toko Baru:** Formulir mandiri calon mitra (upload KTP, NIK, SK, Foto Selfie, Rekomendasi).

### 🏢 2. Dashboard Kasir & Gudang Olsera (Backoffice Distributor)
* **Point of Sale (Kasir Cepat):** Layanan offline langsung di gudang distributor, pencarian barcode SKU, kalkulator kembalian, dan cetak struk thermal / kirim nota WhatsApp.
* **Absensi Operator Kasir:** Shift *Clock-In*, *Clock-Out*, dan pergantian operator kasir.
* **Inventori & Indikator Stok Cerdas Olsera:**
  * 🟢 **Ready** (> 15 pcs)
  * 🟡 **Menipis (⚠️)** (≤ 15 pcs: restock warning ke PT SR12 Pusat dengan generator format order WhatsApp otomatis)
  * 🔴 **Habis** (0 pcs)
* **Buku Kas (Masuk / Keluar):** Catat mutasi kas operasional, saldo akhir, dan kategori biaya.
* **Laporan Laba/Rugi & Omset:** Rekapitulasi GMV, total diskon, estimasi laba bersih distributor, dan ekspor data ke file CSV.
* **Database Jaringan Mitra (CRM):** Pantau performa belanja 90 hari Agen, Sub Agen, dan Reseller binaan.
* **Penggajian Marketer 15%:** Hitung otomatis komisi bulanan 15% dari omset penjualan tiap marketer.

### 🔐 3. Console Super Admin Developer (PIN: 8899)
* **Metrik & GMV:** Pantau total toko terdaftar, volume pesanan, dan sistem kuota order platform @ Rp 1.000 / transaksi.
* **Antrean Verifikasi Mitra Baru:** Tinjau pengajuan KTP/NIK, 1-klik terbitkan toko mitra dengan nomor SK Kemitraan resmi (`SK-[TIER]-XXXX`).
* **Jaringan Toko:** Hapus toko, kunjungi toko mandiri, dan manajemen kuota order toko.
* **Reset Simulasi:** Tombol nol-kan dummy data pengujian.

---

## 📁 Struktur Direktori Baru

```
src/
├── config/
│   ├── supabase.ts             # Inisialisasi Supabase SDK & helper token RPC
│   └── tiers.ts                # Master aturan kemitraan (HET, FO, diskon, kurir)
├── context/
│   └── AppContext.tsx          # State global terpusat: store aktif, cart, tier, realtime alerts
├── data/
│   ├── defaultProducts.ts      # Master katalog resmi SR12 (BPOM, Halal, netto, gambar)
│   └── defaultStores.ts        # Toko pusat (sr12-central) dan demo distributor
├── services/
│   ├── storeService.ts         # Service sinkronisasi toko, pengajuan, approval, storage upload
│   ├── orderService.ts         # Service pemesanan cloud & generator format pesan WhatsApp
│   ├── mitraService.ts         # Verifikasi kualifikasi diskon mitra & komisi marketer
│   └── posService.ts           # Service buku kas, mutasi stok, dan ekspor CSV
├── components/
│   ├── common/
│   │   ├── PlatformTopbar.tsx  # Topbar switcher toko, status cloud, tombol POS & Dev
│   │   ├── Navbar.tsx          # Brand header, WhatsApp CS toko, badge keranjang
│   │   ├── NotificationChime.tsx # Banner mengambang pesanan masuk realtime + audio
│   │   └── Footer.tsx          # Info toko, legalitas BPOM & Halal MUI
│   ├── storefront/
│   │   ├── HeroBanner.tsx      # Promo hero banner toko aktif
│   │   ├── CategorySlider.tsx  # Slider kategori produk & pencarian instan
│   │   ├── TierSelector.tsx    # Banner simulasi level harga reseller/agen
│   │   ├── ProductCard.tsx     # Kartu produk dengan 3 tombol kapsul sebaris
│   │   ├── ProductDetailModal.tsx # Popup detail izin BPOM & netto
│   │   ├── ShareModal.tsx      # Modal share produk bersih tanpa Shopee (icon-only)
│   │   ├── CartDrawer.tsx      # Drawer keranjang, cek diskon kemitraan, kurir, WA checkout
│   │   ├── RegisterStoreModal.tsx # Pendaftaran buka toko baru
│   │   └── AffiliateBanner.tsx # Banner promosi jika dibuka via ?ref=kode-marketer
│   ├── pos/
│   │   ├── PosLayout.tsx       # Shell utama Olsera POS Backoffice
│   │   ├── PosCashierView.tsx  # Kasir sentuh, bayar tunai, hitung kembalian
│   │   ├── PosReceiptModal.tsx # Struk kasir thermal & kirim nota WA
│   │   ├── PosInventoryView.tsx# Smart stock Olsera (🟢🟡🔴) & Restock WA PT SR12
│   │   ├── PosCashflowView.tsx # Buku kas masuk/keluar
│   │   ├── PosReportsView.tsx  # Laba rugi & ekspor CSV
│   │   └── PosDownlinesView.tsx# Database mitra & gaji marketer 15%
│   └── dev/
│       ├── DevConsoleModal.tsx # Console Super Admin (PIN: 8899)
│       └── DistributorLoginModal.tsx # Login pemilik toko (PIN: 1234)
├── styles/
│   ├── index.css               # Design system tokens, Google Fonts, 5 preset tema
│   └── components.css          # Styling kartu, 3 tombol kapsul, drawer, thermal print
├── types/
│   └── index.ts                # TypeScript interfaces lengkap
├── App.tsx                     # Orkestrator aplikasi utama
└── main.tsx                    # Entry point React 19
```

---

## 🚀 Cara Menjalankan

1. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Akses di browser: `http://localhost:5173`

2. **Build untuk Produksi:**
   ```bash
   npm run build
   ```

3. **Kredensial Akses Pengujian:**
   * **Console Dev Super Admin:** PIN `8899` (Tombol *Console Dev* di topbar kanan atas).
   * **Login Pemilik Toko Distributor:** PIN `1234` (Bisa diklik melalui tombol POS atau ketuk 2x logo toko).
   * **Deep-Link Toko:** `?store=aisyah-herbal` atau `?store=toko-cantik-berkah`.
   * **Deep-Link Produk:** `?product=sr12-deodorant-spray-herbal-60ml`.
