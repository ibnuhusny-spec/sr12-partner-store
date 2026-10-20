# 🌿 SR12 Partner Store & Olsera POS Backoffice

Platform Toko Online Resmi & Sistem Manajemen Gudang POS Distributor untuk Ekosistem Kemitraan **SR12 Herbal Skin Care**.

---

## ✨ Fitur Utama

### 🛒 1. Toko Online Pembeli (Storefront Retail & Mitra)
* **Katalog Produk Resmi SR12:** Terverifikasi BPOM & Halal dengan deskripsi lengkap, netto, dan foto produk asli.
* **Harga Kemitraan Otomatis (Tiering System):**
  * Konsumen Retail (Harga Eceran Tertinggi / HET)
  * Mitra Marketer (Diskon 15%)
  * Reseller Resmi (Diskon 20%)
  * Sub Agen (Diskon 30%)
  * Agen Resmi (Diskon 40%)
  * Distributor Utama (Diskon 50%)
* **Checkout Cepat via WhatsApp:** Format pesan rapi otomatis dengan total diskon, ongkir, dan data transfer bank.

### 🏢 2. Dashboard Kasir & Gudang Olsera (Backoffice Distributor)
* **Point of Sale (POS Kasir Cepat Gudang):** Layani transaksi offline langsung di gudang distributor dengan pencarian instan dan cetak/kirim struk via WhatsApp.
* **Manajemen Transaksi:** Pantau riwayat seluruh pesanan, omset, dan status pembayaran.
* **Inventori & Low Stock Alert:** Indikator stok cerdas Olsera:
  * 🟢 **Ready** (> 15 pcs)
  * 🟡 **Menipis (⚠️)** (≤ 15 pcs: pengingat otomatis restock ke PT SR12 Pusat)
  * 🔴 **Habis** (0 pcs)
* **Kas Masuk-Keluar (Buku Kas):** Catat arus kas pemasukan dan pengeluaran operasional.
* **Laporan Laba/Rugi & Omset:** Rekapitulasi keuangan bisnis distributor dengan ekspor data CSV.
* **Database Seluruh Mitra (CRM):** Pantau performa Agen, Sub Agen, dan Reseller dalam jaringan toko Anda.
* **Penggajian Tim Marketer Tanpa Modal:** Hitung otomatis komisi bulanan 15% dari omset penjualan tiap marketer.
* **Pengaturan Toko & Upload Logo:** Kustomisasi nama toko, nomor WhatsApp, rekening bank, serta upload logo resmi toko.

### ☁️ 3. Cloud Database & Storage (Supabase Integration)
* Penyimpanan aset gambar produk dan logo toko ke bucket storage Supabase.
* Sinkronisasi multi-tenant profil toko distributor ke cloud PostgreSQL database.

---

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/ibnuhusny-spec/sr12-partner-store.git
   cd sr12-partner-store
   ```

2. **Jalankan server lokal:**
   ```bash
   node server.js
   ```

3. **Buka di browser:**
   ```
   http://127.0.0.1:3000
   ```

4. **Login Distributor (Demo):**
   * **Email:** `aisyah-herbal@sr12.co.id`
   * **PIN / Password:** `1234`
