# 📘 PANDUAN SIMULASI LENGKAP & SKENARIO PENGUJIAN APLIKASI
## **SR12 Partner Hub & Multi-Storefront Network (v5.4)**

Panduan ini disusun agar Anda dapat melakukan simulasi menyeluruh (*end-to-end testing*) fitur demi fitur, baik secara mandiri di satu perangkat maupun sinkronisasi lintas perangkat (Laptop & HP), serta mendeteksi setiap anomali atau *bug* yang masih tersisa.

---

## 📌 INFORMASI AKSES & KREDENSIAL PENGUJIAN

| Informasi | Nilai / Akses | Keterangan |
| :--- | :--- | :--- |
| **URL Production (Vercel)** | `https://sr12-partner-store.vercel.app` | Dapat diakses bersamaan di Laptop & HP |
| **URL Local (Opsional)** | `http://localhost:8080` | Server lokal di laptop |
| **PIN Console Dev (Super Admin)** | `8899` | Tombol `🔐 Console Dev` di pojok kanan bawah |
| **Default PIN Admin Toko Mitra** | `1234` | Untuk login ke dasbor pemilik toko mitra |
| **Toko Induk (Pusat)** | `?store=sr12-central` | Toko resmi pusat SR12 Herbal Skin Care |
| **Format Toko Mitra** | `?store=[slug-toko]` | Contoh: `?store=toko-cantik-berkah` |
| **Format Deep-Link Produk** | `?store=[slug]&product=[id-produk]` | Link langsung membuka & menyorot produk spesifik |

---

## 👥 STRUKTUR PERAN & TIER DALAM APLIKASI

1. **Kantor Pusat (SR12 Central)**:
   * Mengelola master katalog produk nasional.
   * Menerima & memverifikasi pengajuan toko baru tanpa distributor perujuk.
   * Memantau seluruh jaringan toko mitra di Indonesia.
2. **Distributor**:
   * Mitra tier tertinggi dengan margin diskon maksimal.
   * Memiliki **Kode Rekomendasi** untuk merekrut Agen, Sub-Agen, dan Reseller.
   * Berhak memvalidasi & menyetujui pengajuan toko baru di bawah jaringannya.
   * Menerima margin royalti / komisi downline.
3. **Agen / Sub-Agen / Reseller**:
   * Memiliki etalase toko mandiri dengan branding nama toko dan nomor WhatsApp sendiri.
   * Mendapatkan tier harga modal sesuai level kemitraannya.
   * Terikat pada batas kuota order toko (default: 15 transaksi) yang dapat di-topup.
4. **Marketer**:
   * Menjual produk tanpa modal fisik melalui link afiliasi/promosi.
   * Memperoleh komisi per item produk yang terjual.
5. **Pelanggan Umum (Customer Retail)**:
   * Mengakses toko melalui link web, melihat katalog, memilih produk, dan checkout instan via WhatsApp pemilik toko.

---

# 🧪 10 MODUL SKENARIO PENGUJIAN LENGKAP

---

### 📦 MODUL 1: Navigasi Toko & Multi-Storefront
*Menguji apakah identitas toko berganti secara sempurna antara Pusat dan Toko Mitra.*

* **Langkah Uji**:
  1. Buka halaman utama: `https://sr12-partner-store.vercel.app`
  2. Perhatikan Header, Logo, Nama Toko, Badge, dan Banner Promo.
  3. Cek tombol WhatsApp CS di pojok/header: pastikan mengarah ke nomor CS Toko yang bersangkutan.
  4. Gulir ke bawah hingga bagian Footer: pastikan alamat dan kontak sesuai dengan toko yang aktif.
* **Titik Kritis yang Diuji**:
  * [ ] Apakah nama toko di banner, navbar, dan footer konsisten?
  * [ ] Jika membuka toko mitra, apakah nomor WhatsApp saat checkout langsung mengarah ke nomor pemilik toko mitra (bukan nomor pusat)?
  * [ ] Apakah tombol "Ganti Toko / Belanja di Pusat" berfungsi mengembalikan tampilan ke SR12 Central?

---

### 🛍️ MODUL 2: Tampilan Produk & 3 Tombol Aksi Kapsul
*Menguji konsistensi UI kartu produk, responsivitas 3 tombol kapsul sebaris, dan popup detail.*

* **Langkah Uji**:
  1. Perhatikan kartu-kartu produk pada etalase.
  2. Periksa baris aksi di bawah setiap kartu produk: terdapat 3 tombol berbentuk **kapsul (*pill*) sebaris**:
     * **Tombol 1**: Ikon Keranjang (Tambah ke Keranjang)
     * **Tombol 2**: Ikon Mata (Lihat Detail Produk)
     * **Tombol 3**: Ikon Panah Lengkung Melengkung (Promosikan / Bagikan Produk)
  3. Klik **Tombol Mata (Detail)**:
     * Pastikan modal informasi produk muncul dengan foto jelas, deskripsi lengkap, nomor izin BPOM, dan berat produk.
     * Coba klik tombol "Tambah ke Keranjang" dari dalam modal detail.
  4. Buka di layar sempit / HP:
     * Pastikan ketiga tombol kapsul tetap **sebaris horizontal** (tidak patah menjadi 2 baris).
* **Titik Kritis yang Diuji**:
  * [ ] Apakah ketiga tombol memiliki tinggi dan lengkungan kapsul yang seragam?
  * [ ] Apakah tombol keranjang menampilkan animasi / notifikasi angka badge keranjang di navbar bertambah?

---

### 📢 MODUL 3: Direct Link Promosi Produk & Share Modal
*Menguji fitur promosi produk tanpa sebutan Shopee, tombol aksi icon-only, dan tautan unik produk.*

* **Langkah Uji**:
  1. Pada salah satu produk (contoh: *Deodorant Spray*), klik tombol kapsul **Panah (Share)**.
  2. Periksa jendela popup (*Share Modal*):
     * Judul modal harus bertuliskan **"Bagikan & Promosikan Produk"** (Pastikan **TIDAK ADA kata "Shopee"**).
     * Terlihat pratinjau kartu iklan: Foto produk, Nama produk, Deskripsi singkat, dan Harga.
     * Terdapat kotak **"Link Khusus Produk Ini"** yang berisi URL spesifik dengan parameter `?store=...&product=...`.
     * Terdapat 3 tombol aksi dalam bentuk **Ikon Saja (*Icon-Only*)**:
       * 🟢 Ikon WhatsApp
       * 📋 Ikon Salin Teks
       * 🔗 Ikon Share Bawaan HP
  3. Klik tombol **Salin Link** khusus produk.
  4. Buka tab baru di browser dan *Paste* URL tersebut:
     * Halaman harus langsung terbuka, otomatis menggulir (*auto-scroll*) ke kartu produk tersebut, memberikan animasi denyut highlight (*pulse effect*), dan membuka modal detail produk secara otomatis.
* **Titik Kritis yang Diuji**:
  * [ ] Apakah kata "Shopee" sudah bersih total dari teks promosi dan template copywriting?
  * [ ] Apakah link langsung produk berfungsi presisi saat dibagikan ke orang lain?

---

### 📝 MODUL 4: Formulir Pengajuan Toko Agen Baru
*Menguji proses pendaftaran mitra baru dari sisi calon agen.*

* **Langkah Uji**:
  1. Di halaman beranda, cari dan klik tombol **"Daftar Jadi Mitra / Buka Toko Agen"**.
  2. Isi formulir pengajuan toko baru:
     * **Nama Toko**: contoh `Toko Cantik Herbal`
     * **Nama Pemilik**: contoh `Siti Rahma`
     * **Nomor WhatsApp**: contoh `081234567890` (atau format `628...`)
     * **Kota / Domisili**: contoh `Makassar`
     * **Level Kemitraan**: Pilih `Agen` (atau `Sub-Agen` / `Reseller`)
     * **Distributor Perujuk**: Pilih distributor rekomendasi atau masukkan kode rekomendasi.
     * **PIN Admin Toko**: Buat 4 angka (contoh `5678`).
  3. Klik **"Kirim Pengajuan Toko"**.
  4. Pastikan muncul notifikasi sukses dan pengajuan masuk ke status antrean (*pending*).
* **Titik Kritis yang Diuji**:
  * [ ] Apakah data tervalidasi dengan baik (nomor WA tidak boleh kosong, PIN wajib 4 angka)?
  * [ ] Apakah data pengajuan tersimpan ke cloud Supabase (`pending_stores`)?

---

### ⚖️ MODUL 5: Approval & Verifikasi Pengajuan Toko Baru
*Menguji alur persetujuan toko baru oleh Distributor atau Super Admin.*

* **Langkah Uji**:
  1. Jika pengajuan ditujukan ke distributor tertentu: buka toko distributor tersebut (atau buka melalui Toko Pusat).
  2. Buka **Console Dev / Panel Admin** (PIN: `8899` atau PIN admin toko).
  3. Buka tab **"📥 Pengajuan Mitra Baru"**:
     * Anda akan melihat kartu notifikasi pengajuan toko `Toko Cantik Herbal`.
  4. Periksa detail yang diajukan (Nama, Pemilik, Kota, Tier, No WA).
  5. Klik tombol hijau **"✅ Setujui & Terbitkan Toko"**:
     * Sistem akan menerbitkan Nomor SK Kemitraan resmi (contoh: `SK-Agen-XXXX`).
     * Kotak pengajuan akan hilang dari daftar antrean.
     * Toko resmi baru aktif dan langsung memiliki URL toko mandiri: `?store=toko-cantik-herbal`.
  6. Klik tombol **"Kunjungi Toko"** atau **"Belanja di Toko Ini"**.
* **Titik Kritis yang Diuji**:
  * [ ] Apakah kotak notifikasi pengajuan toko baru langsung hilang setelah disetujui?
  * [ ] Apakah kotak pengajuan tersebut **TIDAK MUNCUL** di beranda toko baru yang baru saja disetujui?
  * [ ] Saat toko baru dibuka, apakah nama toko, nama pemilik, dan nomor WA sudah tepat 100% milik toko baru tersebut (bukan toko lain)?

---

### 🔄 MODUL 6: Sinkronisasi Multi-Device Realtime (Laptop & HP)
*Menguji apakah aksi di Laptop langsung tersinkronisasi ke HP secara instan tanpa perlu refresh manual.*

* **Persiapan**:
  * Buka `https://sr12-partner-store.vercel.app` di **Laptop**.
  * Buka `https://sr12-partner-store.vercel.app` di **HP**.
* **Skenario Uji 6A (Persetujuan Toko)**:
  1. Buka formulir di HP, daftarkan toko baru `Toko Berkah Bersama`.
  2. Lihat di Laptop: antrean pengajuan langsung muncul.
  3. Di Laptop, klik **"Setujui Toko"**.
  4. Perhatikan layar HP: Toko baru langsung terdaftar dan dapat dibuka di HP seketika!
* **Skenario Uji 6B (Penghapusan Toko)**:
  1. Di Laptop, buka Console Dev (PIN: `8899`), tab **"🏪 Jaringan Toko Mitra"**.
  2. Cari toko `Toko Berkah Bersama`, lalu klik tombol merah **"🗑️ Hapus Toko"**.
  3. Konfirmasi hapus.
  4. **Perhatikan layar HP Anda (tanpa menyentuh layar HP)**:
     * Toko tersebut harus otomatis hilang dari daftar toko di HP dalam hitungan detik.
     * Jika HP sedang membuka URL toko tersebut, HP akan otomatis dialihkan kembali ke Toko Pusat (`sr12-central`).
* **Titik Kritis yang Diuji**:
  * [ ] Apakah toko yang dihapus di Laptop tidak pernah muncul kembali di HP?
  * [ ] Apakah HP tidak melakukan auto re-upload toko yang sudah dihapus?

---

### 🛒 MODUL 7: Keranjang Belanja, Ongkir & Checkout WhatsApp
*Menguji proses belanja konsumen hingga pengiriman pesan order ke WhatsApp toko.*

* **Langkah Uji**:
  1. Pilih 2 atau 3 produk berbeda, klik tombol kapsul **Keranjang** pada masing-masing produk.
  2. Buka keranjang belanja (klik ikon floating keranjang atau tombol di navbar).
  3. Di dalam drawer keranjang:
     * Ubah jumlah produk (+ / -): pastikan subtotal terhitung otomatis.
     * Coba hapus satu produk: pastikan daftar dan total berkurang.
  4. Isi data pengiriman:
     * **Nama Pemesan**: `Budi Santoso`
     * **Nomor HP / WhatsApp**: `081122334455`
     * **Alamat Lengkap & Kota Tujuan**: `Jl. Mallengkeri No. 12, Makassar`
     * **Pilih Kurir Pengiriman**: J&T / POS / SiCepat / COD.
  5. Periksa rincian biaya: Subtotal Produk + Estimasi Ongkir = Total Bayar.
  6. Klik tombol **"Pesan Sekarang via WhatsApp"**:
     * Aplikasi akan membuka aplikasi WhatsApp dengan pesan rapi yang berisi daftar item, alamat, nomor invoice, dan total belanja ke nomor WA pemilik toko yang aktif.
* **Titik Kritis yang Diuji**:
  * [ ] Apakah pesan WhatsApp terformat dengan rapi dan mudah dibaca?
  * [ ] Apakah nomor tujuan WhatsApp sesuai dengan nomor toko yang sedang dikunjungi?

---

### 💰 MODUL 8: Perhitungan Margin Tier & Kuota Transaksi Toko
*Menguji apakah tier harga (Distributor vs Agen vs Reseller) dan kuota transaksi toko berjalan tepat.*

* **Langkah Uji**:
  1. Periksa harga produk saat dibuka di Toko Pusat (Harga Retail Normal).
  2. Buka toko dengan tier **Agen**:
     * Periksa apakah harga modal agen terhitung otomatis sesuai diskon tier agen.
  3. Cek sisa **Kuota Pesanan (Order Quota)** pada toko mitra:
     * Setiap toko mitra baru dibekali kuota gratis (default: 15 transaksi).
     * Saat terjadi transaksi, periksa apakah kuota berkurang 1.
  4. Uji simulasi **Top-Up Kuota**:
     * Buka admin toko / console dev, coba lakukan simulasi isi ulang saldo/kuota toko.
* **Titik Kritis yang Diuji**:
  * [ ] Apakah diskon tier konsisten dan tidak ada kebocoran harga modal ke pembeli umum?
  * [ ] Apakah toko yang kehabisan kuota menampilkan instruksi top-up yang jelas?

---

### 🤝 MODUL 9: Jaringan Downline & Komisi Marketer
*Menguji pencatatan referral kemitraan dan komisi penjualan marketer.*

* **Langkah Uji**:
  1. Buka Console Dev (PIN: `8899`), tab **"👥 Jaringan Downline"**.
  2. Pastikan pohon relasi distributor -> agen -> reseller tercatat dengan benar.
  3. Cek tab **"💵 Kasflow & Royalti"**:
     * Periksa pencatatan komisi bagi distributor saat downline di bawahnya melakukan penjualan.
  4. Uji tautan marketer:
     * Bagikan link dengan parameter marketer `?ref=[kode-marketer]`.
     * Simulasikan pembelian melalui link tersebut.
     * Pastikan saldo komisi marketer tercatat pada tabel `marketer_sales`.
* **Titik Kritis yang Diuji**:
  * [ ] Apakah kode referral terbaca saat checkout?
  * [ ] Apakah riwayat kasflow dapat difilter berdasarkan tanggal/toko?

---

### ⚙️ MODUL 10: Console Dev & Pemeliharaan Data
*Menguji tombol reset data, pembersihan dummy, dan audit log sistem.*

* **Langkah Uji**:
  1. Buka **Console Dev** (PIN: `8899`).
  2. Uji fitur-fitur pemeliharaan:
     * **Tab Metrik & Omzet**: Menampilkan ringkasan GMV, transaksi, dan jumlah toko aktif.
     * **Tombol "🔄 Nol-kan Data Dummy"**: Menghapus seluruh data pengujian palsu dan mengembalikan sistem ke kondisi segar (*clean slate*).
     * **Tombol "Salin Log Diagnostik"**: Menyalin status koneksi Supabase, LocalStorage, dan error runtime untuk debugging.
* **Titik Kritis yang Diuji**:
  * [ ] Apakah fitur "Nol-kan Data Dummy" aman dan tidak merusak konfigurasi toko pusat?
  * [ ] Apakah status indikator Supabase di pojok console dev selalu berstatus hijau (ONLINE)?

---

## 📋 LEMBAR CEKLIS PENEMUAN BUG (TEMPLAT LAPORAN)

Jika Anda menemukan kejanggalan saat melakukan simulasi di atas, silakan salin format ringkas berikut dan kirimkan ke chat:

```markdown
### 🚨 LAPORAN TEMUAN BUG / KEJANGGALAN
- **Modul Pengujian**: (Contoh: Modul 5 - Approval Toko)
- **Perangkat yang Digunakan**: (Contoh: HP Android Chrome / Laptop Windows)
- **Langkah yang Dilakukan**: (Contoh: Saya klik tombol setujui toko X...)
- **Yang Seharusnya Terjadi**: (Contoh: Toko X harusnya langsung bisa diakses...)
- **Yang Nyatanya Terjadi**: (Contoh: Muncul tulisan error atau layar putih...)
- **Tangkapan Layar / Teks Error**: (Jika ada)
```
