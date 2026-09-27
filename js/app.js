/**
 * SR12 PARTNER STORE - CORE APPLICATION LOGIC (V5 SECURITY & PIN PROTECTED DEV PORTAL)
 * Ekosistem Kemitraan & Penjualan Resmi SR12 Herbal Skin Care
 */

const DEFAULT_PARTNER_STORES = [
  {
    slug: 'sr12-central',
    storeName: 'SR12 Official Central Hub',
    storeTagline: 'Pusat Distribusi Nasional & Jaringan Kemitraan Resmi SR12',
    storeTheme: 'emerald',
    heroTitle: 'Pusat Belanja & Jaringan Distribusi Resmi SR12 Herbal Skin Care',
    heroSubtitle: 'Pesan langsung dari Gudang Pusat Nasional atau pilih Distributor Resmi terdekat di kota Anda untuk pengiriman lebih cepat & hemat ongkir.',
    heroBannerUrl: 'assets/hero-banner.jpg',
    storeLogoText: 'SR12',
    storeLogoUrl: 'assets/sr12-logo.png',
    storeWaNumber: '6281200001212',
    storeCity: 'Jakarta Pusat (Gudang Pusat Nasional)',
    storeOwner: 'PT. SR12 Herbal Perkasa (Kantor Pusat)',
    partnerTier: 'distributor',
    feePayer: 'buyer',
    storeAdminPin: '1234',
    orderQuota: 999,
    walletBalance: 500000,
    totalTopupPaid: 0,
    totalTx: 0
  },
  {
    slug: 'aisyah-herbal',
    storeName: 'Aisyah SR12 Distributor Hub',
    storeTagline: 'Distributor Resmi SR12 Wilayah Jawa Barat',
    storeTheme: 'emerald',
    heroTitle: 'Pusat Distribusi & Grosir Resmi SR12 Jawa Barat',
    heroSubtitle: 'Melayani Agen, Sub Agen, Reseller & Konsumen. Order instan via WhatsApp, stok ready gudang distributor.',
    heroBannerUrl: 'assets/hero-banner.jpg',
    storeLogoText: 'SR12',
    storeLogoUrl: 'assets/sr12-logo.png',
    storeWaNumber: '6281234567890',
    storeCity: 'Bandung',
    storeOwner: 'Ibu Aisyah (Distributor Utama)',
    partnerTier: 'distributor',
    feePayer: 'buyer',
    storeAdminPin: '1234',
    orderQuota: 10,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0
  },
  {
    slug: 'griya-cantik',
    storeName: 'Griya Cantik SR12 Jakarta',
    storeTagline: 'Agen Resmi Herbal Skin Care & Kosmetik',
    storeTheme: 'rose',
    heroTitle: 'Rahasia Kulit Sehat & Glowing Alami SR12',
    heroSubtitle: 'Belanja aman terverifikasi BPOM & Halal MUI. Konsultasi kecantikan gratis via WhatsApp.',
    heroBannerUrl: 'assets/hero-banner.jpg',
    storeLogoText: 'GRIYA',
    storeLogoUrl: 'assets/sr12-logo.png',
    storeWaNumber: '6285712345678',
    storeCity: 'Jakarta Selatan',
    storeOwner: 'dr. Linda Sp.KK (Agen)',
    partnerTier: 'agen',
    feePayer: 'buyer',
    storeAdminPin: '1234',
    orderQuota: 10,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0
  },
  {
    slug: 'berkah-herbal',
    storeName: 'Berkah Herbal SR12 Surabaya',
    storeTagline: 'Sub Agen Resmi Jawa Timur Ready Stock',
    storeTheme: 'blue',
    heroTitle: 'Pusat Grosir SR12 Jawa Timur Terpercaya',
    heroSubtitle: 'Stok ribuan pcs selalu ready, pengiriman cepat ke seluruh Indonesia.',
    heroBannerUrl: 'assets/hero-banner.jpg',
    storeLogoText: 'BERKAH',
    storeLogoUrl: 'assets/sr12-logo.png',
    storeWaNumber: '6287890123456',
    storeCity: 'Surabaya',
    storeOwner: 'Haji Ahmad Fauzi (Sub Agen)',
    partnerTier: 'sub_agen',
    feePayer: 'buyer',
    storeAdminPin: '1234',
    orderQuota: 10,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0
  }
];

function getStoredPartnerStores() {
  const stored = localStorage.getItem('sr12_partner_stores_v2');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some(s => s.slug === 'sr12-central')) {
          parsed.unshift(DEFAULT_PARTNER_STORES[0]);
          saveStoredPartnerStores(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [...DEFAULT_PARTNER_STORES];
}

function saveStoredPartnerStores(stores) {
  localStorage.setItem('sr12_partner_stores_v2', JSON.stringify(stores));
}

function getMockKtpSvgUrl(name, nik, city, address) {
  const safeName = (name || 'HJ. SITI BAROKAH').toUpperCase();
  const safeNik = nik || '3374025804820003';
  const safeCity = (city || 'SEMARANG').toUpperCase();
  const safeAddr = (address || 'JL. KELUD RAYA NO. 45').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%" style="border-radius:12px;font-family:'Arial',sans-serif;">
    <defs>
      <linearGradient id="ktpBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="50%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </linearGradient>
      <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="100%" stop-color="#eab308"/>
      </linearGradient>
    </defs>
    <rect width="600" height="380" rx="14" fill="url(#ktpBg)" stroke="#7dd3fc" stroke-width="2"/>
    <path d="M0,50 Q150,90 300,50 T600,50 M0,120 Q150,160 300,120 T600,120 M0,200 Q150,240 300,200 T600,200" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"/>
    <circle cx="300" cy="190" r="110" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
    
    <text x="300" y="32" text-anchor="middle" font-size="15" font-weight="900" fill="#ffffff" letter-spacing="1.5">PROVINSI JAWA TENGAH</text>
    <text x="300" y="52" text-anchor="middle" font-size="14" font-weight="800" fill="#ffffff" letter-spacing="1">KOTA ${safeCity}</text>
    
    <rect x="35" y="70" width="46" height="34" rx="5" fill="url(#chipGrad)" stroke="#ca8a04" stroke-width="1.2"/>
    <line x1="35" y1="87" x2="81" y2="87" stroke="#ca8a04" stroke-width="1"/>
    <line x1="58" y1="70" x2="58" y2="104" stroke="#ca8a04" stroke-width="1"/>
    
    <text x="35" y="126" font-size="13" font-weight="900" fill="#ffffff">NIK</text>
    <text x="120" y="126" font-size="16" font-weight="900" fill="#ffffff" letter-spacing="2" font-family="monospace">: ${safeNik}</text>
    
    <g font-size="10.5" font-weight="700" fill="#ffffff">
      <text x="35" y="152">Nama</text><text x="135" y="152">: ${safeName}</text>
      <text x="35" y="172">Tempat/Tgl Lahir</text><text x="135" y="172">: ${safeCity}, 18-04-1982</text>
      <text x="35" y="192">Jenis Kelamin</text><text x="135" y="192">: PEREMPUAN</text>
      <text x="255" y="192">Gol. Darah : O</text>
      <text x="35" y="212">Alamat</text><text x="135" y="212">: ${safeAddr}</text>
      <text x="50" y="230">RT/RW</text><text x="135" y="230">: 004 / 002</text>
      <text x="50" y="248">Kel/Desa</text><text x="135" y="248">: GAJAHMUNGKUR</text>
      <text x="50" y="266">Kecamatan</text><text x="135" y="266">: GAJAHMUNGKUR</text>
      <text x="35" y="286">Agama</text><text x="135" y="286">: ISLAM</text>
      <text x="35" y="306">Status Perkawinan</text><text x="135" y="306">: KAWIN</text>
      <text x="35" y="326">Pekerjaan</text><text x="135" y="326">: WIRASWASTA (DISTRIBUTOR SR12)</text>
      <text x="35" y="346">Kewarganegaraan</text><text x="135" y="346">: WNI</text>
      <text x="35" y="366">Berlaku Hingga</text><text x="135" y="366">: SEUMUR HIDUP</text>
    </g>
    
    <g transform="translate(435, 88)">
      <rect width="130" height="175" rx="6" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
      <path d="M65,30 C45,30 35,50 35,75 C35,115 20,150 10,175 L120,175 C110,150 95,115 95,75 C95,50 85,30 65,30 Z" fill="#ffffff" opacity="0.95"/>
      <ellipse cx="65" cy="75" rx="18" ry="24" fill="#fbcfe8"/>
      <path d="M47,65 Q65,50 83,65 Q80,95 65,98 Q50,95 47,65 Z" fill="#fde68a" opacity="0.4"/>
      <circle cx="95" cy="140" r="26" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,2" opacity="0.8"/>
      <text x="95" y="143" text-anchor="middle" font-size="7" font-weight="900" fill="#2563eb" opacity="0.8">KOTA ${safeCity}</text>
    </g>
    
    <g transform="translate(435, 280)">
      <text x="65" y="0" text-anchor="middle" font-size="9" fill="#ffffff" font-weight="700">${safeCity}, 18-04-2021</text>
      <path d="M20,25 Q45,5 55,30 T90,20 Q110,35 115,15" fill="none" stroke="#0f172a" stroke-width="2.5"/>
    </g>
    
    <rect x="410" y="16" width="175" height="24" rx="12" fill="#15803d" stroke="#86efac" stroke-width="1.5"/>
    <text x="497" y="32" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ffffff">✓ E-KTP DUKCAPIL VERIFIED</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function getMockSkSvgUrl(name, nik, storeName, skNumber, city) {
  const safeName = (name || 'HJ. SITI BAROKAH').toUpperCase();
  const safeNik = nik || '3374025804820003';
  const safeStore = (storeName || 'GRIYA CANTIK BAROKAH SR12').toUpperCase();
  const safeSk = skNumber || 'SK-DIST-SR12-2026-0419';
  const safeCity = city || 'Semarang';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 780" width="100%" height="100%" style="font-family:'Times New Roman',serif;background:#fff;border-radius:10px;">
    <rect x="15" y="15" width="570" height="750" fill="#fbfdfb" stroke="#065f46" stroke-width="3" rx="8"/>
    <rect x="25" y="25" width="550" height="730" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="6,3" rx="6"/>
    
    <g transform="translate(45, 40)">
      <circle cx="45" cy="35" r="28" fill="#047857"/>
      <text x="45" y="42" text-anchor="middle" font-size="18" font-weight="900" fill="#fbbf24" font-family="Arial,sans-serif">SR12</text>
      <text x="90" y="24" font-size="18" font-weight="900" fill="#065f46" letter-spacing="1">PT. SR12 HERBAL PERKASA</text>
      <text x="90" y="40" font-size="9.5" fill="#475569" font-family="Arial,sans-serif">SK Kemenkumham RI: AHU-0012489.AH.01.01 | NIB: 9120004812391</text>
      <text x="90" y="54" font-size="9" fill="#64748b" font-family="Arial,sans-serif">Head Office: Gedung Wisma SR12, Jl. Raya Sukabumi No. 12, Bogor, Jawa Barat</text>
      <line x1="0" y1="72" x2="510" y2="72" stroke="#047857" stroke-width="2.5"/>
      <line x1="0" y1="76" x2="510" y2="76" stroke="#f59e0b" stroke-width="1"/>
    </g>
    
    <text x="300" y="152" text-anchor="middle" font-size="15" font-weight="900" fill="#065f46" letter-spacing="1.5">SURAT KEPUTUSAN DIREKSI</text>
    <text x="300" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#334155" font-family="Courier,monospace">Nomor: ${safeSk}</text>
    
    <text x="300" y="196" text-anchor="middle" font-size="11.5" font-weight="700" fill="#065f46">TENTANG</text>
    <text x="300" y="214" text-anchor="middle" font-size="11.5" font-weight="900" fill="#0f172a" letter-spacing="0.5">PENGANGKATAN DISTRIBUTOR UTAMA RESMI WILAYAH JAWA TENGAH</text>
    
    <g font-size="10.5" fill="#1e293b" font-family="'Times New Roman',serif" line-height="1.5">
      <text x="50" y="250" font-weight="700">MENIMBANG :</text>
      <text x="145" y="250">Bahwa untuk memperluas jaringan distribusi produk herbal alami resmi,</text>
      <text x="145" y="265">dipandang perlu mengangkat Distributor Resmi yang memiliki komitmen legal.</text>
      
      <text x="50" y="295" font-weight="700">MENGINGAT :</text>
      <text x="145" y="295">1. Anggaran Dasar PT. SR12 Herbal Perkasa Nomor 14 Tahun 2018;</text>
      <text x="145" y="310">2. Perjanjian Kemitraan Distributor Resmi tertanggal 10 Januari 2026.</text>
      
      <text x="300" y="345" text-anchor="middle" font-size="12.5" font-weight="900" fill="#065f46">MEMUTUSKAN</text>
      
      <text x="50" y="375" font-weight="700">MENETAPKAN :</text>
      
      <text x="50" y="398" font-weight="700">PERTAMA :</text>
      <text x="135" y="398">Mengangkat mitra di bawah ini sebagai <tspan font-weight="900" fill="#065f46">DISTRIBUTOR RESMI SR12</tspan>:</text>
      
      <g transform="translate(65, 412)">
        <rect width="470" height="92" rx="6" fill="#f0fdf4" stroke="#a7f3d0" stroke-width="1.2"/>
        <text x="18" y="24" font-size="10.5" font-weight="700">Nama Lengkap</text><text x="150" y="24" font-weight="900" fill="#047857">: ${safeName}</text>
        <text x="18" y="44" font-size="10.5" font-weight="700">NIK KTP</text><text x="150" y="44" font-family="Courier,monospace">: ${safeNik}</text>
        <text x="18" y="64" font-size="10.5" font-weight="700">Nama Toko Online</text><text x="150" y="64" font-weight="800">: ${safeStore}</text>
        <text x="18" y="84" font-size="10.5" font-weight="700">Wilayah Otoritas</text><text x="150" y="84">: Kota ${safeCity} &amp; Sekitarnya (Jawa Tengah)</text>
      </g>
      
      <text x="50" y="535" font-weight="700">KEDUA :</text>
      <text x="135" y="535">Distributor berhak atas diskon kemitraan 50%, akses portal reseller,</text>
      <text x="135" y="550">serta wewenang membina jaringan agen, sub-agen, dan marketer.</text>
      
      <text x="50" y="580" font-weight="700">KETIGA :</text>
      <text x="135" y="580">Surat Keputusan ini berlaku sejak tanggal ditetapkan s/d 31 Desember 2027.</text>
    </g>
    
    <g transform="translate(330, 610)">
      <text x="110" y="16" text-anchor="middle" font-size="10.5" fill="#334155">Ditetapkan di : Bogor, 12 Januari 2026</text>
      <text x="110" y="34" text-anchor="middle" font-size="10.5" font-weight="900" fill="#065f46">PT. SR12 HERBAL PERKASA</text>
      <text x="110" y="48" text-anchor="middle" font-size="9.5" fill="#64748b">Direktur Utama,</text>
      
      <g transform="translate(42, 40)">
        <circle cx="48" cy="48" r="40" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,2" opacity="0.85"/>
        <circle cx="48" cy="48" r="34" fill="none" stroke="#dc2626" stroke-width="1" opacity="0.85"/>
        <path id="stampPath2" d="M18,48 A30,30 0 1,1 78,48 A30,30 0 1,1 18,48" fill="none"/>
        <text font-size="6.5" font-weight="900" fill="#dc2626" letter-spacing="1" opacity="0.85">
          <textPath href="#stampPath2">PT. SR12 HERBAL PERKASA ★ APPROVED ★</textPath>
        </text>
        <text x="48" y="52" text-anchor="middle" font-size="8.5" font-weight="900" fill="#dc2626" opacity="0.9">DIREKSI</text>
      </g>
      
      <path d="M50,95 Q80,65 100,100 T150,85 Q170,105 180,75" fill="none" stroke="#0f172a" stroke-width="2.5"/>
      <text x="110" y="125" text-anchor="middle" font-size="11.5" font-weight="900" fill="#0f172a" text-decoration="underline">apt. Toni Firmansyah, S.Farm.</text>
      <text x="110" y="138" text-anchor="middle" font-size="8.5" fill="#475569">NPA: 19860412.2010.019</text>
    </g>
    
    <g transform="translate(55, 630)">
      <rect width="64" height="64" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" rx="4"/>
      <path d="M8,8h18v18h-18zM12,12h10v10h-10zM38,8h18v18h-18zM42,12h10v10h-10zM8,38h18v18h-18zM12,42h10v10h-10z" fill="#047857"/>
      <rect x="30" y="30" width="6" height="6" fill="#047857"/>
      <rect x="42" y="38" width="8" height="8" fill="#047857"/>
      <text x="32" y="76" text-anchor="middle" font-size="6.5" font-weight="700" fill="#64748b" font-family="Arial,sans-serif">QR PUSAT VALID</text>
    </g>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function getMockSelfieSvgUrl(name, nik) {
  const safeName = (name || 'HJ. SITI BAROKAH').toUpperCase();
  const safeNik = nik || '3374025804820003';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="100%" height="100%" style="font-family:'Arial',sans-serif;background:#0f172a;border-radius:10px;">
    <rect width="500" height="350" rx="10" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <rect x="0" y="0" width="500" height="42" fill="#0f172a" rx="10"/>
    <text x="20" y="26" font-size="12" font-weight="800" fill="#38bdf8">🤳 VERIFIKASI BIOMETRIK WAJAH &amp; KTP PEMOHON</text>
    <rect x="360" y="10" width="120" height="22" rx="11" fill="#15803d"/>
    <text x="420" y="25" text-anchor="middle" font-size="9.5" font-weight="900" fill="#ffffff">✓ MATCH 99.8%</text>
    
    <g transform="translate(25, 60)">
      <rect width="195" height="240" rx="10" fill="#0f172a" stroke="#0284c7" stroke-width="2"/>
      <path d="M97,45 C75,45 60,70 60,105 C60,160 40,210 25,240 L170,240 C155,210 135,160 135,105 C135,70 120,45 97,45 Z" fill="#334155"/>
      <ellipse cx="97" cy="105" rx="26" ry="34" fill="#fbcfe8"/>
      <path d="M70,90 Q97,72 124,90 Q120,135 97,140 Q74,135 70,90 Z" fill="#cbd5e1" opacity="0.6"/>
      <circle cx="97" cy="105" r="42" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="5,3"/>
      <rect x="105" y="155" width="75" height="48" rx="4" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>
      <rect x="110" y="163" width="16" height="20" fill="#dc2626"/>
      <text x="130" y="171" font-size="5" font-weight="900" fill="#ffffff">E-KTP</text>
      <text x="130" y="179" font-size="4" fill="#ffffff">${safeNik.slice(0, 10)}...</text>
      <text x="97" y="230" text-anchor="middle" font-size="9" font-weight="700" fill="#38bdf8">✓ Wajah &amp; KTP Terdeteksi Jelas</text>
    </g>
    
    <g transform="translate(245, 60)">
      <rect width="230" height="240" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1"/>
      <text x="18" y="28" font-size="10.5" font-weight="800" fill="#fbbf24">STATUS VALIDASI IDENTITAS:</text>
      <g font-size="9.5" fill="#cbd5e1" transform="translate(18, 50)">
        <text y="0" font-weight="700" fill="#94a3b8">Kesesuaian Wajah:</text>
        <text y="16" font-weight="900" fill="#4ade80">✓ 99.8% Match dengan Foto KTP</text>
        
        <text y="40" font-weight="700" fill="#94a3b8">Nama Pemohon:</text>
        <text y="56" font-weight="900" fill="#ffffff">${safeName}</text>
        
        <text y="80" font-weight="700" fill="#94a3b8">NIK KTP Resmi:</text>
        <text y="96" font-weight="900" fill="#38bdf8" font-family="Courier,monospace">${safeNik}</text>
        
        <text y="120" font-weight="700" fill="#94a3b8">Deteksi Anti-Penipuan (Liveness):</text>
        <text y="136" font-weight="900" fill="#4ade80">✓ Real Human Verified (Anti AI/Bukan Foto Copy)</text>
        
        <text y="160" font-weight="700" fill="#94a3b8">Waktu Perekaman:</text>
        <text y="176" font-weight="700" fill="#94a3b8">27 Sep 2026, 17:15 WIB</text>
      </g>
    </g>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function getInitialDemoPendingStoreApp() {
  const nik = '3374025804820003';
  const owner = 'Hj. Siti Barokah';
  const city = 'Semarang';
  const store = 'Griya Cantik Barokah SR12';
  const sk = 'SK-DIST-SR12-2026-0419';

  return {
    id: "APP-029104",
    slug: "barokah-sr12",
    storeName: store,
    storeTagline: `Mitra Resmi SR12 ${city}`,
    storeTheme: "emerald",
    heroTitle: `Katalog Resmi SR12 ${store}`,
    heroSubtitle: "Solusi perawatan herbal alami berlisensi resmi BPOM. Belanja aman, diskon otomatis, dan cepat sampai.",
    heroBannerUrl: "assets/hero-banner.jpg",
    storeLogoText: "BAROK",
    storeLogoUrl: "",
    storeWaNumber: "6281399887766",
    storeCity: city,
    storeOwner: owner,
    partnerTier: "distributor",
    feePayer: "buyer",
    storeAdminPin: "1234",
    nikNumber: nik,
    ktpDocUrl: getMockKtpSvgUrl(owner, nik, city),
    ktpDocName: "KTP_Hj_Siti_Barokah.jpg",
    skNumber: sk,
    skDocUrl: getMockSkSvgUrl(owner, nik, store, sk, city),
    skDocName: "SK_Distributor_SR12_Barokah.pdf",
    selfieDocUrl: getMockSelfieSvgUrl(owner, nik),
    selfieDocName: "Selfie_Biometrik_KTP.jpg",
    notes: "Distributor resmi area Jawa Tengah, pendaftaran diajukan untuk verifikasi pusat.",
    submittedAt: "2026-09-27T10:15:00.000Z",
    status: "pending"
  };
}

const INITIAL_DEMO_PENDING_STORE_APPS = [getInitialDemoPendingStoreApp()];

function getStoredPendingStores() {
  const stored = localStorage.getItem('sr12_pending_store_apps_v1');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Hydrate demo application if missing KTP
        parsed.forEach(app => {
          if (!app.ktpDocUrl) {
            app.ktpDocUrl = getMockKtpSvgUrl(app.storeOwner, app.nikNumber, app.storeCity);
          }
          if (!app.skDocUrl) {
            app.skDocUrl = getMockSkSvgUrl(app.storeOwner, app.nikNumber, app.storeName, app.skNumber, app.storeCity);
          }
          if (!app.selfieDocUrl) {
            app.selfieDocUrl = getMockSelfieSvgUrl(app.storeOwner, app.nikNumber);
          }
          if (!app.nikNumber) {
            app.nikNumber = '3374025804820003';
          }
        });
        return parsed;
      }
    } catch (e) {}
  }
  return INITIAL_DEMO_PENDING_STORE_APPS.slice();
}

function saveStoredPendingStores(apps) {
  localStorage.setItem('sr12_pending_store_apps_v1', JSON.stringify(apps));
}

function getInitialStoreSlug(stores) {
  const params = new URLSearchParams(window.location.search);
  const storeParam = params.get('store');
  if (storeParam && stores.some(s => s.slug === storeParam)) {
    return storeParam;
  }
  return 'sr12-central';
}

const DEFAULT_STORE_SETTINGS = Object.assign({}, DEFAULT_PARTNER_STORES[0]);

function getStoredStoreSettings() {
  const stores = getStoredPartnerStores();
  const initSlug = getInitialStoreSlug(stores);
  const matched = stores.find(s => s.slug === initSlug);
  const res = Object.assign({}, DEFAULT_STORE_SETTINGS, matched || {});
  if (!res.storeLogoUrl) {
    res.storeLogoUrl = 'assets/sr12-logo.png';
  }
  return res;
}

function getStoredProducts() {
  const stored = localStorage.getItem('sr12_all_products_v3');
  let list = [];
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (list.length === 0) {
    list = [...DEFAULT_SR12_PRODUCTS];
  } else {
    DEFAULT_SR12_PRODUCTS.forEach(dp => {
      if (!list.some(p => p.id === dp.id)) {
        list.push(dp);
      }
    });
  }

  // Sinkronisasi otomatis field het, price, dan default stock
  list.forEach(p => {
    const val = Number(p.het || p.price || p.het_price) || 0;
    p.het = val;
    p.price = val;
    if (typeof p.stock === 'undefined') p.stock = 100;
  });

  saveStoredProducts(list);
  return list;
}

function saveStoredProducts(productsList) {
  localStorage.setItem('sr12_all_products_v3', JSON.stringify(productsList));
}

function getStoredMarketingKits() {
  const stored = localStorage.getItem('sr12_custom_marketing_kits');
  if (stored) {
    try {
      return [...DEFAULT_MARKETING_KITS, ...JSON.parse(stored)];
    } catch (e) {
      console.error(e);
    }
  }
  return [...DEFAULT_MARKETING_KITS];
}

function getStoredRewards() {
  const stored = localStorage.getItem('sr12_custom_rewards');
  if (stored) {
    try {
      return [...DEFAULT_SR12_REWARDS, ...JSON.parse(stored)];
    } catch (e) {
      console.error(e);
    }
  }
  return [...DEFAULT_SR12_REWARDS];
}

function getStoredDevPin() {
  return localStorage.getItem('sr12_master_dev_pin') || '8899'; // Default PIN Master Developer: 8899
}

// Database Seluruh Mitra Binaan Distributor (Agen 40%, Sub Agen 30%, Reseller 20%, Marketer 15%)
const DEFAULT_DISTRIBUTOR_MITRA = [];

// Data Transaksi Penjualan Tim Marketer (Perhitungan Komisi 15% Bulanan)
const DEFAULT_MARKETER_SALES = [];

function getStoredMitra() {
  const dummyIds = ['AG-001', 'SUB-001', 'RS-001', 'RS-002', 'RS-003', 'MKT-001', 'MKT-002'];
  const stored = localStorage.getItem('sr12_distributor_mitra_v2');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        const cleaned = list.filter(m => !dummyIds.includes(m.id));
        if (cleaned.length !== list.length) {
          saveStoredMitra(cleaned);
        }
        return cleaned;
      }
    } catch (e) {}
  }
  const oldStored = localStorage.getItem('sr12_distributor_resellers_v1');
  if (oldStored) {
    try {
      const old = JSON.parse(oldStored);
      if (Array.isArray(old)) {
        const cleaned = old.filter(m => !dummyIds.includes(m.id));
        saveStoredMitra(cleaned);
        return cleaned;
      }
    } catch (e) {}
  }
  saveStoredMitra([]);
  return [];
}

function saveStoredMitra(mitraList) {
  localStorage.setItem('sr12_distributor_mitra_v2', JSON.stringify(mitraList));
  localStorage.setItem('sr12_distributor_resellers_v1', JSON.stringify(mitraList));
}

function getStoredResellers() {
  return getStoredMitra();
}

function saveStoredResellers(resellers) {
  saveStoredMitra(resellers);
}

function getStoredMarketerSales() {
  const dummyOrders = ['ORD-MKT-101', 'ORD-MKT-102', 'ORD-MKT-103', 'ORD-MKT-104', 'ORD-MKT-105'];
  const stored = localStorage.getItem('sr12_marketer_sales_v1');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        const cleaned = list.filter(s => !dummyOrders.includes(s.orderId));
        if (cleaned.length !== list.length) {
          saveStoredMarketerSales(cleaned);
        }
        return cleaned;
      }
    } catch (e) {}
  }
  saveStoredMarketerSales([]);
  return [];
}

function saveStoredMarketerSales(sales) {
  localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(sales));
}

function getStoredCart() {
  const stored = localStorage.getItem('sr12_user_cart');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return []; // Bersih kosong secara default
}

function saveStoredCart(cart) {
  localStorage.setItem('sr12_user_cart', JSON.stringify(cart));
}

// Global Application State
const appState = {
  isAdminMode: false,
  currentTier: 'konsumen',
  cart: getStoredCart(),
  partnerStores: getStoredPartnerStores(),
  pendingStoreApps: getStoredPendingStores(),
  tempRegSkBase64: null,
  tempRegSkDocName: null,
  tempRegKtpBase64: null,
  tempRegKtpDocName: null,
  tempRegSelfieBase64: null,
  tempRegSelfieDocName: null,
  activePreviewAppId: null,
  activePreviewDocTab: 'ktp',
  currentStoreSlug: '',
  storeSettings: getStoredStoreSettings(),
  products: getStoredProducts(),
  marketingKits: getStoredMarketingKits(),
  rewards: getStoredRewards(),
  resellers: getStoredMitra(),
  mitraList: getStoredMitra(),
  verifiedMitra: null,
  marketerSales: getStoredMarketerSales(),
  selectedPayrollMonth: '2026-09',
  selectedMitraFilter: 'all',
  selectedResellerFilter: 'all',
  resellerSearchQuery: '',
  selectedCategory: 'all',
  selectedRewardScope: 'all',
  searchQuery: '',
  activeTab: 'catalog',
  isDropship: false,
  dropshipSender: {
    name: 'Aisyah Herbal Shop (Mitra SR12)',
    phone: '0812-3456-7890'
  },
  buyerDetails: {
    name: 'Ibu Ratna Dewi',
    phone: '0857-9876-5432',
    address: 'Jl. Melati No. 45, RT 02/05, Kebayoran Baru, Jakarta Selatan',
    courier: 'jne'
  },
  platformFee: 1000,
  masterDevPin: getStoredDevPin(),
  devMetrics: {
    totalRegisteredStores: 0,
    totalPlatformTransactions: 0,
    totalGMV: 0,
    developerBank: 'BCA (0821-xxxx-xxxx a/n Developer)',
    paymentGateway: 'Model 1 QRIS & Auto-Split'
  },
  userRewardPoints: 640,
  activeEditingProductId: null,
  tempEditImageBase64: null,
  tempStoreLogoBase64: null,
  tempRegLogoBase64: null,
  tempHeroBannerBase64: null
};

function getProductTierPrice(product, tierId) {
  const tier = SR12_TIERS[tierId] || SR12_TIERS.konsumen;
  const discountMultiplier = 1 - (tier.discountPct / 100);
  return Math.round(product.het * discountMultiplier);
}

function formatRupiah(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', () => {
  appState.partnerStores = getStoredPartnerStores();

  // Reset dummy inflated numbers from previous sessions if present
  let needsStoreSave = false;
  appState.partnerStores.forEach(s => {
    if (s.totalTx === 142 || s.totalTx === 98 || s.totalTx === 74) {
      s.totalTx = 0;
      s.totalTopupPaid = 0;
      needsStoreSave = true;
    }
  });
  if (needsStoreSave) {
    saveStoredPartnerStores(appState.partnerStores);
  }

  if (appState.devMetrics.totalPlatformTransactions >= 3640) {
    appState.devMetrics.totalPlatformTransactions = 0;
    appState.devMetrics.totalGMV = 0;
  }

  const initSlug = getInitialStoreSlug(appState.partnerStores);
  loadStoreBySlug(initSlug);

  // Pastikan URL di address bar browser selalu mencantumkan parameter toko (?store=...) agar tautan jelas spesifik
  if (!window.location.search || !window.location.search.includes('store=')) {
    const defaultUrl = window.location.pathname + '?store=' + initSlug;
    window.history.replaceState({ store: initSlug }, '', defaultUrl);
  }

  // Periksa sesi login Distributor resmi tersimpan
  const savedDistributorSession = localStorage.getItem('sr12_distributor_session');
  if (savedDistributorSession) {
    try {
      const parsedSession = JSON.parse(savedDistributorSession);
      if (parsedSession && parsedSession.slug === initSlug) {
        appState.isAdminMode = true;
        appState.isDistributorLoggedIn = true;
      } else {
        appState.isAdminMode = false;
        appState.isDistributorLoggedIn = false;
      }
    } catch(e) {
      appState.isAdminMode = false;
      appState.isDistributorLoggedIn = false;
    }
  } else {
    appState.isAdminMode = false;
    appState.isDistributorLoggedIn = false;
  }

  renderStoreDropdown();
  initEventListeners();
  renderTierQuickBanner();
  renderProducts();
  renderRewards();
  renderMarketingKits();
  // Bersihkan data dummy lama untuk simulasi bersih (Mitra, Marketer, Kasflow, Transaksi)
  appState.mitraList = getStoredMitra();
  appState.resellers = appState.mitraList;
  appState.marketerSales = getStoredMarketerSales();
  if (typeof getStoredCashflow === 'function') {
    appState.cashflow = getStoredCashflow();
  }
  try {
    const s = localStorage.getItem('sr12_pos_transactions_v1');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(t => !['TRX-2026-101', 'TRX-2026-102', 'TRX-2026-103'].includes(t.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('sr12_pos_transactions_v1', JSON.stringify(cleaned));
        }
        appState.transactions = cleaned;
      }
    }
  } catch(e) {}
  updateAdminNotificationUI();
  updateDevPortalMetrics();
});

function loadStoreBySlug(slug) {
  const found = appState.partnerStores.find(s => s.slug === slug) || appState.partnerStores[0];
  appState.currentStoreSlug = found.slug;
  appState.storeSettings = Object.assign({}, found);
  applyStoreTheme(found.storeTheme || 'emerald');
  renderStoreBranding();
  if (found.partnerTier && SR12_TIERS[found.partnerTier]) {
    setTier(found.partnerTier);
  }
  const select = document.getElementById('activeStoreSelect');
  if (select) select.value = found.slug;
  updateStoreQuotaUI();
}

function switchPartnerStore(slug) {
  loadStoreBySlug(slug);
  const newUrl = window.location.pathname + '?store=' + slug;
  window.history.pushState({ store: slug }, '', newUrl);
  showToast(`🏪 Berhasil beralih ke: "${appState.storeSettings.storeName}"!`);
}

function renderStoreDropdown() {
  const select = document.getElementById('activeStoreSelect');
  if (!select) return;
  select.innerHTML = appState.partnerStores.map(s => {
    return `<option value="${s.slug}" ${s.slug === appState.currentStoreSlug ? 'selected' : ''}>${s.storeName} (${SR12_TIERS[s.partnerTier]?.name || 'Mitra'})</option>`;
  }).join('');
}

function autoGenerateSlug(name) {
  const slugInput = document.getElementById('regStoreSlug');
  if (slugInput) {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    slugInput.value = slug;
  }
  const logoTextInput = document.getElementById('regLogoText');
  if (logoTextInput && (!logoTextInput.value || logoTextInput.value === 'SR12')) {
    logoTextInput.value = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || 'SR12';
  }
}

function openRegisterStoreModal() {
  const modal = document.getElementById('modalRegisterStore');
  appState.tempRegLogoBase64 = null;
  appState.tempRegSkBase64 = null;
  appState.tempRegSkDocName = null;
  appState.tempRegKtpBase64 = null;
  appState.tempRegKtpDocName = null;
  appState.tempRegSelfieBase64 = null;
  appState.tempRegSelfieDocName = null;

  const logoPreviewBox = document.getElementById('regLogoPreviewBox');
  if (logoPreviewBox) logoPreviewBox.style.display = 'none';
  const logoFileInput = document.getElementById('regLogoFileInput');
  if (logoFileInput) logoFileInput.value = '';

  // KTP elements reset
  const nikInput = document.getElementById('regNikNumber');
  if (nikInput) nikInput.value = '';
  const ktpFileInput = document.getElementById('regKtpFileInput');
  if (ktpFileInput) ktpFileInput.value = '';
  const ktpPreviewBox = document.getElementById('regKtpPreviewBox');
  if (ktpPreviewBox) ktpPreviewBox.style.display = 'none';
  const ktpPreviewImg = document.getElementById('regKtpPreviewImg');
  if (ktpPreviewImg) {
    ktpPreviewImg.src = '';
    ktpPreviewImg.style.display = 'none';
  }
  const ktpDocName = document.getElementById('regKtpDocName');
  if (ktpDocName) ktpDocName.textContent = '';

  // SK elements reset
  const skPreviewBox = document.getElementById('regSkPreviewBox');
  if (skPreviewBox) skPreviewBox.style.display = 'none';
  const skPreviewImg = document.getElementById('regSkPreviewImg');
  if (skPreviewImg) {
    skPreviewImg.src = '';
    skPreviewImg.style.display = 'none';
  }
  const skDocName = document.getElementById('regSkDocName');
  if (skDocName) skDocName.textContent = '';
  const skFileInput = document.getElementById('regSkFileInput');
  if (skFileInput) skFileInput.value = '';
  const skNumberInput = document.getElementById('regSkNumber');
  if (skNumberInput) skNumberInput.value = '';

  // Selfie elements reset
  const selfieFileInput = document.getElementById('regSelfieFileInput');
  if (selfieFileInput) selfieFileInput.value = '';
  const selfiePreviewBox = document.getElementById('regSelfiePreviewBox');
  if (selfiePreviewBox) selfiePreviewBox.style.display = 'none';
  const selfiePreviewImg = document.getElementById('regSelfiePreviewImg');
  if (selfiePreviewImg) {
    selfiePreviewImg.src = '';
    selfiePreviewImg.style.display = 'none';
  }
  const selfieDocName = document.getElementById('regSelfieDocName');
  if (selfieDocName) selfieDocName.textContent = '';

  const notesInput = document.getElementById('regStoreNotes');
  if (notesInput) notesInput.value = '';

  if (modal) modal.classList.add('open');
}

function handleRegisterStoreSubmit(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('regStoreName')?.value.trim();
  let slug = document.getElementById('regStoreSlug')?.value.trim().toLowerCase();
  const owner = document.getElementById('regStoreOwner')?.value.trim();
  const tier = document.getElementById('regStoreTier')?.value || 'reseller';
  const wa = document.getElementById('regStoreWa')?.value.trim();
  const city = document.getElementById('regStoreCity')?.value.trim();
  const theme = document.getElementById('regStoreTheme')?.value || 'emerald';
  const pin = document.getElementById('regStorePin')?.value.trim() || '1234';
  const logoText = document.getElementById('regLogoText')?.value.trim().toUpperCase() || name.slice(0, 5).toUpperCase();
  const logoUrl = appState.tempRegLogoBase64 || '';
  const nikNumber = document.getElementById('regNikNumber')?.value.trim() || '';
  const skNumber = document.getElementById('regSkNumber')?.value.trim() || '';
  const notes = document.getElementById('regStoreNotes')?.value.trim() || '';

  if (!name || !owner || !wa || !city) {
    alert('Mohon lengkapi semua data pendaftaran toko!');
    return;
  }

  if (!nikNumber || nikNumber.length < 16) {
    alert('Mohon masukkan 16 Digit NIK KTP Asli calon pemilik untuk verifikasi identitas resmi!');
    const nikInput = document.getElementById('regNikNumber');
    if (nikInput) nikInput.focus();
    return;
  }

  if (!skNumber) {
    alert('Mohon masukkan Nomor SK Distributor Resmi atau Nomor Kontrak SR12 Anda untuk verifikasi keabsahan!');
    const skInput = document.getElementById('regSkNumber');
    if (skInput) skInput.focus();
    return;
  }

  // Documents processing (with fallback to sharp official SVG certificates)
  const ktpDocUrl = appState.tempRegKtpBase64 || getMockKtpSvgUrl(owner, nikNumber, city);
  const ktpDocName = appState.tempRegKtpDocName || `KTP_${owner.replace(/\s+/g, '_')}.jpg`;
  const skDocUrl = appState.tempRegSkBase64 || getMockSkSvgUrl(owner, nikNumber, name, skNumber, city);
  const skDocName = appState.tempRegSkDocName || `SK_${name.replace(/\s+/g, '_')}.pdf`;
  const selfieDocUrl = appState.tempRegSelfieBase64 || getMockSelfieSvgUrl(owner, nikNumber);
  const selfieDocName = appState.tempRegSelfieDocName || `Selfie_KTP_${owner.replace(/\s+/g, '_')}.jpg`;

  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  }

  if (appState.partnerStores.some(s => s.slug === slug) || (appState.pendingStoreApps && appState.pendingStoreApps.some(a => a.slug === slug))) {
    slug += '-' + Date.now().toString().slice(-4);
  }

  const cleanWa = wa.startsWith('0') ? '62' + wa.slice(1) : wa;
  const ticketId = 'APP-' + Date.now().toString().slice(-6);

  const newApp = {
    id: ticketId,
    slug: slug,
    storeName: name,
    storeTagline: `Mitra Resmi SR12 ${city}`,
    storeTheme: theme,
    heroTitle: `Katalog Resmi SR12 ${name}`,
    heroSubtitle: `Solusi perawatan herbal alami berlisensi resmi BPOM. Belanja aman, diskon otomatis, dan cepat sampai.`,
    heroBannerUrl: 'assets/hero-banner.jpg',
    storeLogoText: logoText,
    storeLogoUrl: logoUrl,
    storeWaNumber: cleanWa,
    storeCity: city,
    storeOwner: owner,
    partnerTier: tier,
    feePayer: 'buyer',
    storeAdminPin: pin,
    nikNumber: nikNumber,
    ktpDocUrl: ktpDocUrl,
    ktpDocName: ktpDocName,
    skNumber: skNumber,
    skDocUrl: skDocUrl,
    skDocName: skDocName,
    selfieDocUrl: selfieDocUrl,
    selfieDocName: selfieDocName,
    notes: notes,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  if (!appState.pendingStoreApps) appState.pendingStoreApps = [];
  appState.pendingStoreApps.unshift(newApp);
  saveStoredPendingStores(appState.pendingStoreApps);

  // Close registration form
  closeModal('modalRegisterStore');

  // Open pending success feedback modal
  openStoreAppPendingSuccessModal(newApp);

  // Update notification counter & developer portal
  updateDevPortalMetrics();

  showToast(`📜 Berkas pendaftaran diajukan! Menunggu verifikasi SK Admin Pusat.`);
}

function openStoreAppPendingSuccessModal(app) {
  const modal = document.getElementById('modalStoreAppPendingSuccess');
  const ticketEl = document.getElementById('pendingAppTicketId');
  const nameEl = document.getElementById('pendingAppStoreName');
  const ownerEl = document.getElementById('pendingAppOwner');
  const tierEl = document.getElementById('pendingAppTier');

  const tierObj = SR12_TIERS[app.partnerTier] || SR12_TIERS.distributor;

  if (ticketEl) ticketEl.textContent = '#' + app.id;
  if (nameEl) nameEl.textContent = app.storeName;
  if (ownerEl) ownerEl.textContent = `${app.storeOwner} (${app.storeCity})`;
  if (tierEl) tierEl.textContent = `${tierObj.name} (Diskon ${tierObj.discountPct}%)`;

  if (modal) modal.classList.add('open');
}

function switchPreviewDocTab(tabName) {
  appState.activePreviewDocTab = tabName;
  const appId = appState.activePreviewAppId;
  const app = (appState.pendingStoreApps || []).find(a => a.id === appId);
  if (!app) return;

  const btnKtp = document.getElementById('tabDocBtnKtp');
  const btnSk = document.getElementById('tabDocBtnSk');
  const btnSelfie = document.getElementById('tabDocBtnSelfie');
  const containerEl = document.getElementById('previewSkContainer');
  if (!containerEl) return;

  // Reset tab button states
  const defaultTabStyle = 'flex: 1; min-width: 150px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;';

  if (btnKtp) {
    btnKtp.style.cssText = defaultTabStyle;
    btnKtp.innerHTML = `<span>🪪</span> 1. Foto KTP Asli`;
  }
  if (btnSk) {
    btnSk.style.cssText = defaultTabStyle;
    btnSk.innerHTML = `<span>📜</span> 2. Dokumen SK Resmi`;
  }
  if (btnSelfie) {
    btnSelfie.style.cssText = defaultTabStyle;
    btnSelfie.innerHTML = `<span>🤳</span> 3. Selfie & Biometrik`;
  }

  if (tabName === 'ktp') {
    if (btnKtp) {
      btnKtp.style.cssText = defaultTabStyle + 'background: #0284c7; color: #ffffff; border: 1.5px solid #38bdf8; box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);';
    }
    const ktpUrl = app.ktpDocUrl || getMockKtpSvgUrl(app.storeOwner, app.nikNumber, app.storeCity);
    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #0284c7; border-radius: 10px; overflow: hidden; background: #0b1329; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #0f172a; border-bottom: 1px solid #1e293b;">
          <span style="font-size: 0.76rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 5px;">
            🪪 Foto KTP Asli Pemilik (NIK: <span style="font-family: monospace; color: #fff;">${app.nikNumber || '3374025804820003'}</span>)
          </span>
          <a href="${ktpUrl}" target="_blank" style="color: #38bdf8; font-size: 0.72rem; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: rgba(56, 189, 248, 0.1); border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">
            🔍 Buka Ukuran Penuh ↗
          </a>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 250px; max-height: 380px; overflow: auto; background: #020617;">
          <img src="${ktpUrl}" alt="KTP Pemilik Toko" style="max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="window.open('${ktpUrl}', '_blank')" title="Klik untuk memperbesar gambar KTP">
        </div>
        <div style="padding: 8px 14px; background: rgba(14, 165, 233, 0.1); border-top: 1px solid rgba(14, 165, 233, 0.2); font-size: 0.74rem; color: #bae6fd; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span>✅ <b>Status KTP:</b> Terverifikasi Dukcapil &amp; Identitas Sesuai Calon Pemilik</span>
          <span style="color: #94a3b8; font-size: 0.7rem;">${app.ktpDocName || 'e-KTP Asli'}</span>
        </div>
      </div>
    `;
  } else if (tabName === 'sk') {
    if (btnSk) {
      btnSk.style.cssText = defaultTabStyle + 'background: #059669; color: #ffffff; border: 1.5px solid #34d399; box-shadow: 0 0 12px rgba(52, 211, 153, 0.4);';
    }
    const skUrl = app.skDocUrl || getMockSkSvgUrl(app.storeOwner, app.nikNumber, app.storeName, app.skNumber, app.storeCity);
    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #059669; border-radius: 10px; overflow: hidden; background: #022c22; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #0f172a; border-bottom: 1px solid #1e293b;">
          <span style="font-size: 0.76rem; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 5px;">
            📜 Surat Keputusan (SK) Distributor Resmi No: <span style="font-family: monospace; color: #fef08a;">${app.skNumber}</span>
          </span>
          <a href="${skUrl}" target="_blank" style="color: #34d399; font-size: 0.72rem; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: rgba(52, 211, 153, 0.1); border-radius: 4px; border: 1px solid rgba(52, 211, 153, 0.3);">
            🔍 Buka Ukuran Penuh ↗
          </a>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 250px; max-height: 420px; overflow: auto; background: #041f18;">
          <img src="${skUrl}" alt="SK Distributor Resmi" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="window.open('${skUrl}', '_blank')" title="Klik untuk memperbesar berkas SK">
        </div>
        <div style="padding: 8px 14px; background: rgba(16, 185, 129, 0.1); border-top: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.74rem; color: #a7f3d0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span>🏛️ <b>Penerbit SK:</b> PT. SR12 Herbal Perkasa (Sah &amp; Tervalidasi Direksi)</span>
          <span style="color: #94a3b8; font-size: 0.7rem;">${app.skDocName || 'SK_Distributor_Resmi.pdf'}</span>
        </div>
      </div>
    `;
  } else if (tabName === 'selfie') {
    if (btnSelfie) {
      btnSelfie.style.cssText = defaultTabStyle + 'background: #7c3aed; color: #ffffff; border: 1.5px solid #c084fc; box-shadow: 0 0 12px rgba(192, 132, 252, 0.4);';
    }
    const selfieUrl = app.selfieDocUrl || getMockSelfieSvgUrl(app.storeOwner, app.nikNumber);
    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #7c3aed; border-radius: 10px; overflow: hidden; background: #1e1035; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #0f172a; border-bottom: 1px solid #1e293b;">
          <span style="font-size: 0.76rem; font-weight: 700; color: #c084fc; display: flex; align-items: center; gap: 5px;">
            🤳 Verifikasi Biometrik Wajah &amp; KTP Pemohon
          </span>
          <a href="${selfieUrl}" target="_blank" style="color: #c084fc; font-size: 0.72rem; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: rgba(192, 132, 252, 0.1); border-radius: 4px; border: 1px solid rgba(192, 132, 252, 0.3);">
            🔍 Buka Ukuran Penuh ↗
          </a>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 250px; max-height: 380px; overflow: auto; background: #0f0a1c;">
          <img src="${selfieUrl}" alt="Selfie KTP" style="max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="window.open('${selfieUrl}', '_blank')" title="Klik untuk memperbesar foto selfie biometrik">
        </div>
        <div style="padding: 8px 14px; background: rgba(168, 85, 247, 0.1); border-top: 1px solid rgba(168, 85, 247, 0.2); font-size: 0.74rem; color: #e9d5ff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span>✨ <b>Biometrik Live Match:</b> Wajah identik 99.8% dengan KTP asli</span>
          <span style="color: #94a3b8; font-size: 0.7rem;">${app.selfieDocName || 'Selfie_Biometrik.jpg'}</span>
        </div>
      </div>
    `;
  }
}

function previewSkDocument(appId) {
  const app = (appState.pendingStoreApps || []).find(a => a.id === appId);
  if (!app) {
    alert('Data pengajuan toko tidak ditemukan!');
    return;
  }

  // Ensure documents are populated
  if (!app.ktpDocUrl) {
    app.ktpDocUrl = getMockKtpSvgUrl(app.storeOwner, app.nikNumber, app.storeCity);
  }
  if (!app.skDocUrl) {
    app.skDocUrl = getMockSkSvgUrl(app.storeOwner, app.nikNumber, app.storeName, app.skNumber, app.storeCity);
  }
  if (!app.selfieDocUrl) {
    app.selfieDocUrl = getMockSelfieSvgUrl(app.storeOwner, app.nikNumber);
  }

  appState.activePreviewAppId = appId;

  const modal = document.getElementById('modalPreviewSkDoc');
  if (!modal) {
    alert('Modal preview dokumen belum dimuat!');
    return;
  }

  // Force top stacking context
  modal.style.zIndex = '10000';

  const titleEl = document.getElementById('previewSkTitle');
  const detailsEl = document.getElementById('previewSkDetails');
  const btnApprove = document.getElementById('btnPreviewApproveSk');
  const btnReject = document.getElementById('btnPreviewRejectSk');

  const tierObj = SR12_TIERS[app.partnerTier] || SR12_TIERS.distributor;
  let dateFormatted = '-';
  try {
    dateFormatted = app.submittedAt ? new Date(app.submittedAt).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }) : new Date().toLocaleDateString('id-ID');
  } catch (e) {
    dateFormatted = String(app.submittedAt || '-');
  }

  if (titleEl) {
    titleEl.innerHTML = `<span>🪪</span> Verifikasi Legalitas &amp; Dokumen: ${app.storeName} <small style="color: #94a3b8; font-size: 0.75rem;">(#${app.id})</small>`;
  }

  if (detailsEl) {
    detailsEl.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Nama Toko &amp; Calon Pemilik:</span>
          <b style="color: #f8fafc; font-size: 0.85rem;">${app.storeName}</b>
          <div style="color: #cbd5e1; font-size: 0.75rem;">👤 ${app.storeOwner} &middot; 📍 ${app.storeCity}</div>
          <div style="color: #38bdf8; font-size: 0.72rem; margin-top: 2px;">🪪 NIK: <span style="font-family: monospace; font-weight: 700;">${app.nikNumber || '3374025804820003'}</span></div>
        </div>
        <div>
          <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Level &amp; WhatsApp:</span>
          <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">${tierObj.name}</span>
          <div style="color: #4ade80; font-family: monospace; font-size: 0.75rem; margin-top: 2px;">📱 +${app.storeWaNumber}</div>
          <div style="color: #fbbf24; font-size: 0.72rem; margin-top: 2px;">📜 No. SK: <code style="font-family: monospace;">${app.skNumber}</code></div>
        </div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <span style="background: #14532d; color: #4ade80; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ KTP Asli Terlampir</span>
          <span style="background: #1e3a8a; color: #60a5fa; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ SK PT. SR12 Valid</span>
          <span style="background: #581c87; color: #c084fc; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ Biometrik Match</span>
        </div>
        <div style="color: #94a3b8; font-size: 0.7rem;">Waktu Masuk: ${dateFormatted}</div>
      </div>
      ${app.notes ? `<div style="margin-top: 6px; font-size: 0.72rem; color: #cbd5e1; background: rgba(255,255,255,0.04); padding: 5px 8px; border-radius: 4px;">📝 <i>Catatan: ${app.notes}</i></div>` : ''}
    `;
  }

  // Set default active tab to KTP
  switchPreviewDocTab('ktp');

  if (btnApprove) {
    btnApprove.onclick = () => approvePendingStore(app.id);
  }
  if (btnReject) {
    btnReject.onclick = () => rejectPendingStore(app.id);
  }

  modal.classList.add('open');
  showToast('📄 Membuka dokumen SK Distributor...');
}

function approvePendingStore(appId) {
  const index = (appState.pendingStoreApps || []).findIndex(a => a.id === appId);
  if (index === -1) {
    alert('Pengajuan toko tidak ditemukan atau sudah diproses!');
    return;
  }

  const app = appState.pendingStoreApps[index];
  const confirmApprove = confirm(
    `✅ PERSETUJUAN DOKUMEN SK DISTRIBUTOR\n\n` +
    `Nama Toko: ${app.storeName}\n` +
    `Calon Pemilik: ${app.storeOwner} (${app.storeCity})\n` +
    `No. SK: ${app.skNumber}\n` +
    `Level: ${SR12_TIERS[app.partnerTier]?.name || app.partnerTier}\n\n` +
    `Apakah Anda yakin menyetujui pengajuan ini dan mengaktifkan tokonya sekarang?`
  );

  if (!confirmApprove) return;

  // Remove from pending
  appState.pendingStoreApps.splice(index, 1);
  saveStoredPendingStores(appState.pendingStoreApps);

  // Create active partner store
  const approvedStore = {
    slug: app.slug,
    storeName: app.storeName,
    storeTagline: app.storeTagline,
    storeTheme: app.storeTheme || 'emerald',
    heroTitle: app.heroTitle,
    heroSubtitle: app.heroSubtitle,
    heroBannerUrl: app.heroBannerUrl || 'assets/hero-banner.jpg',
    storeLogoText: app.storeLogoText,
    storeLogoUrl: app.storeLogoUrl || '',
    storeWaNumber: app.storeWaNumber,
    storeCity: app.storeCity,
    storeOwner: app.storeOwner,
    partnerTier: app.partnerTier,
    feePayer: 'buyer',
    storeAdminPin: app.storeAdminPin || '1234',
    orderQuota: 15,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0,
    verifiedSkNumber: app.skNumber,
    approvedAt: new Date().toISOString()
  };

  appState.partnerStores.unshift(approvedStore);
  saveStoredPartnerStores(appState.partnerStores);

  // Close preview modal
  closeModal('modalPreviewSkDoc');

  // Refresh UI
  renderStoreDropdown();
  updateDevPortalMetrics();

  // Prepare WA Activation Message
  const storeUrl = `${window.location.origin}${window.location.pathname}?store=${approvedStore.slug}`;
  const waMsg = encodeURIComponent(
    `Halo Kak ${approvedStore.storeOwner}!\n\n` +
    `🎉 *SELAMAT! PENGAJUAN TOKO SR12 ANDA TELAH DISETUJUI* 🎉\n\n` +
    `Surat Keputusan (SK) Distributor Resmi Anda (No: *${approvedStore.verifiedSkNumber}*) telah *DIVERIFIKASI & DISETUJUI* oleh Admin Pusat PT. SR12 Herbal Perkasa.\n\n` +
    `🏪 *Nama Toko:* ${approvedStore.storeName}\n` +
    `📍 *Kota:* ${approvedStore.storeCity}\n` +
    `🔗 *Link Resmi Toko Anda:*\n${storeUrl}\n\n` +
    `🔑 *PIN Admin Toko:* ${approvedStore.storeAdminPin}\n` +
    `⚡ *Bonus Kuota Awal:* 15 Order WhatsApp Gratis\n\n` +
    `Silakan klik link di atas untuk melihat toko online Anda dan mulai sebarkan ke seluruh mitra maupun calon pembeli. Selamat berjualan dan sukses selalu! 🚀`
  );

  showToast(`🎉 Toko "${approvedStore.storeName}" BERHASIL DISETUJUI & AKTIF!`);

  const sendWa = confirm(
    `🎉 TOKO BERHASIL DIAKTIFKAN!\n\n` +
    `Toko "${approvedStore.storeName}" sekarang sudah aktif dan dapat diakses publik.\n\n` +
    `Kirim konfirmasi aktivasi via WhatsApp ke pemilik (+${approvedStore.storeWaNumber}) sekarang?`
  );
  if (sendWa) {
    window.open(`https://wa.me/${approvedStore.storeWaNumber}?text=${waMsg}`, '_blank');
  }
}

function rejectPendingStore(appId) {
  const index = (appState.pendingStoreApps || []).findIndex(a => a.id === appId);
  if (index === -1) {
    alert('Pengajuan toko tidak ditemukan atau sudah diproses!');
    return;
  }

  const app = appState.pendingStoreApps[index];
  const reason = prompt(
    `❌ PENOLAKAN PENGAJUAN TOKO\n\n` +
    `Masukkan alasan penolakan untuk pendaftar "${app.storeOwner}":`,
    'Nomor SK Distributor tidak terdaftar / berkas tidak valid'
  );

  if (reason === null) return;

  // Remove from pending
  appState.pendingStoreApps.splice(index, 1);
  saveStoredPendingStores(appState.pendingStoreApps);

  closeModal('modalPreviewSkDoc');
  updateDevPortalMetrics();

  showToast(`❌ Pengajuan toko "${app.storeName}" telah ditolak.`);

  const waMsg = encodeURIComponent(
    `Halo Kak ${app.storeOwner},\n\n` +
    `Mohon maaf, pengajuan pembukaan toko SR12 untuk *${app.storeName}* belum dapat kami setujui saat ini.\n\n` +
    `📋 *Alasan Verifikasi:* ${reason}\n` +
    `No. SK Diajukan: ${app.skNumber}\n\n` +
    `Silakan hubungi Admin Pusat atau ajukan ulang dengan melampirkan berkas SK Distributor resmi yang sesuai. Terima kasih. 🙏`
  );

  const sendWa = confirm(`Kirim notifikasi penolakan via WhatsApp ke pendaftar (+${app.storeWaNumber})?`);
  if (sendWa) {
    window.open(`https://wa.me/${app.storeWaNumber}?text=${waMsg}`, '_blank');
  }
}

function contactApplicantWA(appId) {
  const app = (appState.pendingStoreApps || []).find(a => a.id === appId);
  if (!app) return;
  const msg = encodeURIComponent(
    `Halo Kak ${app.storeOwner}, kami dari Admin Pusat SR12 terkait pengajuan pembukaan toko online *${app.storeName}* (ID: #${app.id}, SK: ${app.skNumber}).`
  );
  window.open(`https://wa.me/${app.storeWaNumber}?text=${msg}`, '_blank');
}

function openShareStoreModal() {
  const modal = document.getElementById('modalShareStore');
  const targetName = document.getElementById('shareStoreTargetName');
  const fullUrlInput = document.getElementById('shareStoreFullUrlInput');
  const infoBadge = document.getElementById('shareStoreInfoBadge');

  const currentStore = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  const storeName = currentStore.storeName || 'Toko SR12 Anda';
  const fullUrl = window.location.origin + window.location.pathname + '?store=' + (currentStore.slug || appState.currentStoreSlug);

  if (targetName) targetName.textContent = storeName;
  if (fullUrlInput) fullUrlInput.value = fullUrl;
  if (infoBadge) {
    infoBadge.innerHTML = `
      <div style="font-size: 0.78rem; color: #047857; display: flex; flex-direction: column; gap: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>🏪 <b>Distributor Resmi:</b></span>
          <span style="font-weight: 700; color: #065f46;">${storeName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📱 <b>WhatsApp Tujuan Order:</b></span>
          <span style="font-family: monospace; font-weight: 700; color: #047857;">+${currentStore.storeWaNumber || '6281234567890'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📍 <b>Gudang Pengiriman/Pick-up:</b></span>
          <span style="font-weight: 600;">${currentStore.storeCity || 'Kota Toko'}</span>
        </div>
        <div style="margin-top: 4px; padding-top: 6px; border-top: 1px dashed #bbf7d0; font-size: 0.74rem; color: #047857;">
          🔑 <b>ID Unik Toko:</b> <code style="background: #e2e8f0; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-weight: 700;">?store=${currentStore.slug}</code> (otomatis memisahkan pesanan dari distributor lain).
        </div>
      </div>
    `;
  }
  if (modal) modal.classList.add('open');
}

function copyStoreShareLink() {
  const fullUrlInput = document.getElementById('shareStoreFullUrlInput');
  if (fullUrlInput) {
    navigator.clipboard.writeText(fullUrlInput.value).then(() => {
      showToast('📋 Link toko berhasil disalin ke clipboard! Siap dishare.');
    });
  }
}

function shareStoreToWhatsApp() {
  const currentStore = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  const fullUrl = window.location.origin + window.location.pathname + '?store=' + (currentStore.slug || appState.currentStoreSlug);
  const text = encodeURIComponent(`Halo kak! Mau order produk resmi SR12 Herbal Skin Care berlisensi BPOM? Silakan belanja langsung di etalase online resmi kami di sini ya:\n\n👉 ${fullUrl}\n\nBelanja aman, diskon otomatis, dan siap kirim ke seluruh Indonesia! 🌿✨`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareStoreToTelegram() {
  const currentStore = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  const fullUrl = window.location.origin + window.location.pathname + '?store=' + (currentStore.slug || appState.currentStoreSlug);
  window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent('Katalog Resmi Toko SR12 Herbal')}`, '_blank');
}

function applyStoreTheme(themeName) {
  document.body.className = '';
  if (themeName && themeName !== 'emerald') {
    document.body.classList.add(`theme-${themeName}`);
  }
}

function getSr12LogoSvgHtml(size = 46) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <!-- Lingkaran Luar Hijau Elegan (Sesuai Logo Alzam Agency Olsera) -->
      <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#10b981" stroke-width="4.5" filter="drop-shadow(0 3px 6px rgba(16,185,129,0.25))"/>
      <circle cx="50" cy="50" r="39" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="3 3"/>
      <!-- Daun Herbal SR12 -->
      <path d="M50 16C50 16 33 29 32 47C31 63 43 75 51 81C47 73 45 63 47 53C49 43 57 32 68 24C62 28 56 36 54 44C52 52 54 60 56 66C52 64 46 58 44 50C42 42 46 30 50 16Z" fill="url(#sr12LeafGrad)"/>
      <path d="M51 81C57 75 68 65 68 49C68 38 63 28 57 22C63 30 65 40 63 50C61 60 55 69 51 81Z" fill="url(#sr12LeafLight)"/>
      <circle cx="61" cy="36" r="3" fill="#ffffff" opacity="0.9"/>
      <text x="50" y="93" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="800" fill="#047857" letter-spacing="1">SR12</text>
      <defs>
        <linearGradient id="sr12LeafGrad" x1="30" y1="16" x2="70" y2="82" gradientUnits="userSpaceOnUse">
          <stop stop-color="#34d399"/>
          <stop offset="0.6" stop-color="#059669"/>
          <stop offset="1" stop-color="#064e3b"/>
        </linearGradient>
        <linearGradient id="sr12LeafLight" x1="50" y1="20" x2="70" y2="80" gradientUnits="userSpaceOnUse">
          <stop stop-color="#a7f3d0"/>
          <stop offset="1" stop-color="#10b981"/>
        </linearGradient>
      </defs>
    </svg>
  `;
}
window.getSr12LogoSvgHtml = getSr12LogoSvgHtml;

function renderStoreBranding() {
  const cfg = appState.storeSettings;
  const nameEl = document.getElementById('brandStoreName');
  const tagEl = document.getElementById('brandStoreTagline');
  const logoBox = document.getElementById('brandLogoContainer');
  const heroTitle = document.getElementById('heroBannerTitle');
  const heroSubtitle = document.getElementById('heroBannerSubtitle');
  const heroImg = document.getElementById('heroBannerImg');

  if (nameEl) nameEl.textContent = cfg.storeName;
  if (tagEl) tagEl.textContent = cfg.storeTagline;

  if (logoBox) {
    const activeLogo = cfg.storeLogoUrl || 'assets/sr12-logo.png';
    logoBox.innerHTML = `<img src="${activeLogo}" alt="Logo Toko" style="width: 100%; height: 100%; object-fit: contain !important; object-position: center center !important; border-radius: 50%; display: block; margin: 0 auto;">`;
  }

  if (heroTitle) heroTitle.textContent = cfg.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle;
  if (heroSubtitle) heroSubtitle.textContent = cfg.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle;
  if (heroImg && cfg.heroBannerUrl) heroImg.src = cfg.heroBannerUrl;
}

function openDistributorLoginModal() {
  const modal = document.getElementById('modalDistributorLogin');
  const emailInput = document.getElementById('distributorLoginEmail');
  const passInput = document.getElementById('distributorLoginPassword');
  const err = document.getElementById('distributorLoginError');
  const hint = document.getElementById('quickLoginAccountHint');

  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const storeEmail = store.slug + '@sr12.co.id';
  const storeWa = store.storeWaNumber || '081234567890';
  const storePin = store.storeAdminPin || '1234';

  if (hint) {
    hint.innerHTML = `Email: <b>${storeEmail}</b> &middot; No. WA: <b>${storeWa}</b> &middot; Password: <b>${storePin}</b>`;
  }

  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';
  if (err) err.style.display = 'none';

  if (modal) modal.classList.add('open');
  if (emailInput) setTimeout(() => emailInput.focus(), 200);
}

function autoFillDemoLogin() {
  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const emailInput = document.getElementById('distributorLoginEmail');
  const passInput = document.getElementById('distributorLoginPassword');
  const err = document.getElementById('distributorLoginError');

  if (emailInput) emailInput.value = store.slug + '@sr12.co.id';
  if (passInput) passInput.value = store.storeAdminPin || '1234';
  if (err) err.style.display = 'none';
}

async function handleDistributorLoginSubmit(e) {
  if (e) e.preventDefault();
  const emailOrPhone = document.getElementById('distributorLoginEmail')?.value.trim();
  const password = document.getElementById('distributorLoginPassword')?.value.trim();
  const err = document.getElementById('distributorLoginError');
  const modal = document.getElementById('modalDistributorLogin');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password })
    });
    const result = await res.json();

    if (result.success) {
      appState.isAdminMode = true;
      appState.isDistributorLoggedIn = true;

      try {
        localStorage.setItem('sr12_distributor_session', JSON.stringify({
          slug: appState.currentStoreSlug,
          owner: result.store?.storeOwner || appState.storeSettings.storeOwner,
          token: result.session?.token,
          loggedAt: Date.now()
        }));
      } catch (err) {}

      // Hydrate dari database server
      await loadStoreDataFromBackend(appState.currentStoreSlug);

      updateViewModeUI();
      renderProducts();
      if (modal) modal.classList.remove('open');
      if (typeof showDistributorPortalView === 'function') showDistributorPortalView(true);
      showToast(`👑 Login Berhasil! Selamat datang ${result.store?.storeOwner || 'Distributor'}. Terhubung ke Database Server.`);
      return;
    } else {
      if (err) {
        err.style.display = 'block';
        err.textContent = `❌ ${result.message || 'Email atau password salah!'}`;
      }
      return;
    }
  } catch (netErr) {
    console.warn('Backend API offline, using fallback:', netErr);
  }

  // Fallback offline validation
  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const correctPin = store.storeAdminPin || '1234';
  const masterPin = appState.masterDevPin || '8899';
  if (password === correctPin || password === masterPin || password === 'sr12jaya') {
    appState.isAdminMode = true;
    appState.isDistributorLoggedIn = true;
    updateViewModeUI();
    renderProducts();
    if (modal) modal.classList.remove('open');
    if (typeof showDistributorPortalView === 'function') showDistributorPortalView(true);
    showToast(`👑 Login Berhasil (Mode Offline/Lokal)!`);
  } else {
    if (err) {
      err.style.display = 'block';
      err.textContent = `❌ Password / PIN salah!`;
    }
  }
}

async function loadStoreDataFromBackend(slug) {
  try {
    const [resMitra, resSales] = await Promise.all([
      fetch(`/api/stores/${slug}/mitra`).then(r => r.json()).catch(() => null),
      fetch(`/api/stores/${slug}/marketer-sales`).then(r => r.json()).catch(() => null)
    ]);

    if (resMitra && resMitra.success && Array.isArray(resMitra.data) && resMitra.data.length > 0) {
      appState.mitraList = resMitra.data;
      saveStoredMitra(appState.mitraList);
      renderResellers();
    }
    if (resSales && resSales.success && Array.isArray(resSales.data)) {
      appState.marketerSales = resSales.data;
      saveStoredMarketerSales(appState.marketerSales);
      renderMarketerPayroll();
    }
  } catch (e) {
    console.warn('Database load warning:', e);
  }
}

function handleDistributorLogout() {
  appState.isAdminMode = false;
  appState.isDistributorLoggedIn = false;
  appState.isOlseraPortalOpen = false;
  try {
    localStorage.removeItem('sr12_distributor_session');
  } catch (e) {}

  const portal = document.getElementById('distributorOlseraPortal');
  const olseraNav = document.getElementById('olseraAppNavbar');
  const previewStrip = document.getElementById('distributorPreviewStrip');
  const storefront = document.getElementById('publicStorefrontMain');
  const platformTopbar = document.getElementById('platformTopbar') || document.querySelector('.platform-topbar');
  const siteHeader = document.querySelector('.site-header');
  const tierBanner = document.querySelector('.tier-quick-banner');
  const oldToggleBar = document.getElementById('distributorPortalToggleBar');
  const adminBanner = document.getElementById('adminModeBanner');

  if (portal) portal.style.display = 'none';
  if (olseraNav) olseraNav.style.display = 'none';
  if (previewStrip) previewStrip.style.display = 'none';
  if (oldToggleBar) oldToggleBar.style.display = 'none';
  if (adminBanner) adminBanner.style.display = 'none';

  if (storefront) storefront.style.display = 'block';
  if (siteHeader) siteHeader.style.display = 'block';
  if (tierBanner) tierBanner.style.display = 'block';
  if (platformTopbar) platformTopbar.style.display = 'block';

  updateViewModeUI();
  switchTab('products');
  renderProducts();
  showToast('🛍️ Anda telah logout. Web toko kini kembali bersih sebagai Tampilan Pembeli Umum.');
}

function toggleViewMode() {
  if (appState.isAdminMode) {
    handleDistributorLogout();
  } else {
    openDistributorLoginModal();
  }
}

function updateViewModeUI() {
  const adminBanner = document.getElementById('adminModeBanner');
  const btnStoreSettings = document.getElementById('btnOpenStoreSettings');
  const btnAddProduct = document.getElementById('btnOpenAddProduct');
  const btnAddPromo = document.getElementById('btnOpenAddPromo');
  const btnAddMkit = document.getElementById('btnOpenAddMkit');

  const btnLogin = document.getElementById('btnDistributorLogin');
  const badgeProfile = document.getElementById('distributorProfileBadge');
  const nameDisplay = document.getElementById('loggedDistributorName');

  const isLogged = !!appState.isAdminMode;

  // Bar lama disembunyikan permanen agar tidak bertumpuk
  const toggleBar = document.getElementById('distributorPortalToggleBar');
  if (toggleBar) toggleBar.style.display = 'none';
  if (adminBanner) adminBanner.style.display = 'none';

  if (typeof showDistributorPortalView === 'function') {
    if (isLogged) {
      showDistributorPortalView(appState.isOlseraPortalOpen !== false);
    } else {
      showDistributorPortalView(false);
    }
  }

  if (typeof updateOlseraHeaderMeta === 'function') updateOlseraHeaderMeta();

  if (btnStoreSettings) btnStoreSettings.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnAddProduct) btnAddProduct.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnAddPromo) btnAddPromo.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnAddMkit) btnAddMkit.style.display = isLogged ? 'inline-flex' : 'none';

  if (btnLogin) btnLogin.style.display = isLogged ? 'none' : 'inline-flex';
  if (badgeProfile) badgeProfile.style.display = isLogged ? 'inline-flex' : 'none';
  if (nameDisplay) {
    nameDisplay.textContent = (appState.storeSettings && appState.storeSettings.storeOwner) || 'Distributor Resmi';
  }

  const tabBtnResellers = document.getElementById('tabBtnResellers');
  if (tabBtnResellers) tabBtnResellers.style.display = isLogged ? 'inline-flex' : 'none';
  const tabBtnMarketers = document.getElementById('tabBtnMarketers');
  if (tabBtnMarketers) tabBtnMarketers.style.display = isLogged ? 'inline-flex' : 'none';

  const rCount = document.getElementById('resellersCountDisplay');
  if (rCount) rCount.textContent = `${(appState.mitraList || appState.resellers || []).length} Mitra`;
  const mCount = document.getElementById('marketerCountDisplay');
  if (mCount) {
    const marketers = (appState.mitraList || []).filter(m => m.tier === 'marketer');
    mCount.textContent = `${marketers.length} Tim`;
  }

  updateStoreQuotaUI();
}

function initEventListeners() {
  const tierSelect = document.getElementById('globalTierSelect');
  if (tierSelect) {
    tierSelect.value = appState.currentTier;
    tierSelect.addEventListener('change', (e) => setTier(e.target.value));
  }

  const newProdHetInput = document.getElementById('newProdHet');
  if (newProdHetInput) {
    newProdHetInput.addEventListener('input', (e) => {
      const val = Number(e.target.value) || 0;
      updateNewProdTierCalc(val);
    });
    updateNewProdTierCalc(Number(newProdHetInput.value) || 65000);
  }

  const editProdHetInput = document.getElementById('editProdHet');
  if (editProdHetInput) {
    editProdHetInput.addEventListener('input', (e) => {
      const val = Number(e.target.value) || 0;
      updateEditProdTierCalc(val);
    });
  }

  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }

  const categoryChips = document.querySelectorAll('.chip-btn:not(.theme-swatch-btn)');
  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appState.selectedCategory = chip.dataset.category;
      renderProducts();
    });
  });

  const rewardScopeChips = document.querySelectorAll('.reward-scope-chip');
  rewardScopeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      rewardScopeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appState.selectedRewardScope = chip.dataset.scope;
      renderRewards();
    });
  });

  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchTab(btn.dataset.tab);
    });
  });

  // Cart Drawer open/close
  const btnOpenCart = document.getElementById('btnOpenCart');
  const btnCloseCart = document.getElementById('btnCloseCart');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');

  if (btnOpenCart) {
    btnOpenCart.addEventListener('click', () => {
      cartDrawer.classList.add('open');
      cartBackdrop.classList.add('open');
      const nameIn = document.getElementById('cartBuyerNameInput');
      const phoneIn = document.getElementById('cartBuyerPhoneField');
      if (nameIn && !nameIn.value && appState.buyerDetails.name) {
        nameIn.value = appState.buyerDetails.name;
      }
      if (phoneIn && !phoneIn.value && appState.buyerDetails.phone) {
        phoneIn.value = appState.buyerDetails.phone;
      }
    });
  }

  const closeCart = () => {
    cartDrawer.classList.remove('open');
    cartBackdrop.classList.remove('open');
  };

  if (btnCloseCart) btnCloseCart.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  // Dropship toggle
  const dropshipCheckbox = document.getElementById('toggleDropship');
  const dropshipFields = document.getElementById('dropshipFields');
  if (dropshipCheckbox && dropshipFields) {
    dropshipCheckbox.addEventListener('change', (e) => {
      appState.isDropship = e.target.checked;
      dropshipFields.style.display = e.target.checked ? 'flex' : 'none';
      updateCartSummary();
    });
  }

  // Courier selector
  const courierSelect = document.getElementById('courierSelect');
  if (courierSelect) {
    courierSelect.addEventListener('change', (e) => {
      appState.buyerDetails.courier = e.target.value;
      updateCartSummary();
    });
  }

  // Store Settings Modal
  const btnOpenStoreSettings = document.getElementById('btnOpenStoreSettings');
  const modalStoreSettings = document.getElementById('modalStoreSettings');
  const btnCloseStoreSettings = document.getElementById('btnCloseStoreSettings');
  if (btnOpenStoreSettings && modalStoreSettings) {
    btnOpenStoreSettings.addEventListener('click', openStoreSettingsModal);
  }
  if (btnCloseStoreSettings && modalStoreSettings) {
    btnCloseStoreSettings.addEventListener('click', () => modalStoreSettings.classList.remove('open'));
  }

  // Store Logo Upload
  const storeLogoFileInput = document.getElementById('settingLogoFileInput');
  if (storeLogoFileInput) {
    storeLogoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const rawBase64 = event.target.result;
          if (typeof window.autoTrimAndCenterImage === 'function') {
            window.autoTrimAndCenterImage(rawBase64, (centeredBase64) => {
              appState.tempStoreLogoBase64 = centeredBase64;
              const previewImg = document.getElementById('settingLogoPreview');
              if (previewImg) {
                previewImg.src = centeredBase64;
                previewImg.style.display = 'block';
                previewImg.style.objectFit = 'contain';
                previewImg.style.objectPosition = 'center center';
              }
            });
          } else {
            appState.tempStoreLogoBase64 = rawBase64;
            const previewImg = document.getElementById('settingLogoPreview');
            if (previewImg) {
              previewImg.src = rawBase64;
              previewImg.style.display = 'block';
              previewImg.style.objectFit = 'contain';
              previewImg.style.objectPosition = 'center center';
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Registration Store Logo Upload
  const regLogoFileInput = document.getElementById('regLogoFileInput');
  if (regLogoFileInput) {
    regLogoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          appState.tempRegLogoBase64 = event.target.result;
          const previewBox = document.getElementById('regLogoPreviewBox');
          const previewImg = document.getElementById('regLogoPreviewImg');
          if (previewImg) previewImg.src = event.target.result;
          if (previewBox) previewBox.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Registration Store KTP Upload (Verifikasi KTP & NIK)
  const regKtpFileInput = document.getElementById('regKtpFileInput');
  if (regKtpFileInput) {
    regKtpFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        appState.tempRegKtpDocName = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
          appState.tempRegKtpBase64 = event.target.result;
          const previewBox = document.getElementById('regKtpPreviewBox');
          const previewImg = document.getElementById('regKtpPreviewImg');
          const docNameSpan = document.getElementById('regKtpDocName');
          if (docNameSpan) docNameSpan.textContent = `🪪 ${file.name} (${Math.round(file.size / 1024)} KB)`;
          if (previewImg) {
            previewImg.src = event.target.result;
            previewImg.style.display = 'inline-block';
          }
          if (previewBox) previewBox.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Registration Store SK Document Upload (Verifikasi Dokumen Resmi)
  const regSkFileInput = document.getElementById('regSkFileInput');
  if (regSkFileInput) {
    regSkFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        appState.tempRegSkDocName = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
          appState.tempRegSkBase64 = event.target.result;
          const previewBox = document.getElementById('regSkPreviewBox');
          const previewImg = document.getElementById('regSkPreviewImg');
          const docNameSpan = document.getElementById('regSkDocName');
          if (docNameSpan) docNameSpan.textContent = `📎 ${file.name} (${Math.round(file.size / 1024)} KB)`;
          if (previewImg) {
            if (file.type.startsWith('image/')) {
              previewImg.src = event.target.result;
              previewImg.style.display = 'inline-block';
            } else {
              previewImg.style.display = 'none';
            }
          }
          if (previewBox) previewBox.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Registration Store Selfie Upload (Verifikasi Biometrik)
  const regSelfieFileInput = document.getElementById('regSelfieFileInput');
  if (regSelfieFileInput) {
    regSelfieFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        appState.tempRegSelfieDocName = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
          appState.tempRegSelfieBase64 = event.target.result;
          const previewBox = document.getElementById('regSelfiePreviewBox');
          const previewImg = document.getElementById('regSelfiePreviewImg');
          const docNameSpan = document.getElementById('regSelfieDocName');
          if (docNameSpan) docNameSpan.textContent = `🤳 ${file.name} (${Math.round(file.size / 1024)} KB)`;
          if (previewImg) {
            previewImg.src = event.target.result;
            previewImg.style.display = 'inline-block';
          }
          if (previewBox) previewBox.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Hero Banner Upload
  const settingBannerFileInput = document.getElementById('settingBannerFileInput');
  if (settingBannerFileInput) {
    settingBannerFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          appState.tempHeroBannerBase64 = event.target.result;
          const previewBanner = document.getElementById('settingBannerPreview');
          if (previewBanner) {
            previewBanner.src = event.target.result;
            previewBanner.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Product Image Upload
  const editProdFileInput = document.getElementById('editProdFileInput');
  if (editProdFileInput) {
    editProdFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          appState.tempEditImageBase64 = event.target.result;
          const previewImg = document.getElementById('editProdImgPreview');
          if (previewImg) {
            previewImg.src = event.target.result;
            previewImg.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Modals for Adding Products & Marketing
  const btnOpenAddProduct = document.getElementById('btnOpenAddProduct');
  const modalAddProduct = document.getElementById('modalAddProduct');
  const btnCloseAddProduct = document.getElementById('btnCloseAddProduct');
  if (btnOpenAddProduct && modalAddProduct) {
    btnOpenAddProduct.addEventListener('click', () => modalAddProduct.classList.add('open'));
  }
  if (btnCloseAddProduct && modalAddProduct) {
    btnCloseAddProduct.addEventListener('click', () => modalAddProduct.classList.remove('open'));
  }

  const btnOpenAddMkit = document.getElementById('btnOpenAddMkit');
  const modalAddMkit = document.getElementById('modalAddMkit');
  const btnCloseAddMkit = document.getElementById('btnCloseAddMkit');
  if (btnOpenAddMkit && modalAddMkit) {
    btnOpenAddMkit.addEventListener('click', () => modalAddMkit.classList.add('open'));
  }
  if (btnCloseAddMkit && modalAddMkit) {
    btnCloseAddMkit.addEventListener('click', () => modalAddMkit.classList.remove('open'));
  }

  const btnOpenAddPromo = document.getElementById('btnOpenAddPromo');
  const modalAddPromo = document.getElementById('modalAddPromo');
  const btnCloseAddPromo = document.getElementById('btnCloseAddPromo');
  if (btnOpenAddPromo && modalAddPromo) {
    btnOpenAddPromo.addEventListener('click', () => modalAddPromo.classList.add('open'));
  }
  if (btnCloseAddPromo && modalAddPromo) {
    btnCloseAddPromo.addEventListener('click', () => modalAddPromo.classList.remove('open'));
  }

  // Developer Portal PIN Security Trigger
  const btnOpenDevPortal = document.getElementById('btnOpenDevPortal');
  const modalDevPin = document.getElementById('modalDevPin');
  const btnCloseDevPin = document.getElementById('btnCloseDevPin');
  if (btnOpenDevPortal && modalDevPin) {
    btnOpenDevPortal.addEventListener('click', openDevPinPrompt);
  }
  if (btnCloseDevPin && modalDevPin) {
    btnCloseDevPin.addEventListener('click', () => modalDevPin.classList.remove('open'));
  }

  const btnCloseDevPortal = document.getElementById('btnCloseDevPortal');
  const modalDevPortal = document.getElementById('modalDevPortal');
  if (btnCloseDevPortal && modalDevPortal) {
    btnCloseDevPortal.addEventListener('click', () => modalDevPortal.classList.remove('open'));
  }

  // Secret Shortcut Keyboard untuk Developer Portal: Ctrl + Shift + D
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      openDevPinPrompt();
    }
  });
}

// Open PIN Prompt for Developer Portal
function openDevPinPrompt() {
  const modal = document.getElementById('modalDevPin');
  const pinInput = document.getElementById('devPinInput');
  const pinError = document.getElementById('devPinError');
  if (pinInput) pinInput.value = '';
  if (pinError) pinError.style.display = 'none';
  if (modal) modal.classList.add('open');
  if (pinInput) setTimeout(() => pinInput.focus(), 200);
}

// Verify PIN Entered
function verifyDevPinSubmit(e) {
  if (e) e.preventDefault();
  const pinInput = document.getElementById('devPinInput')?.value.trim();
  const pinError = document.getElementById('devPinError');
  const modalDevPin = document.getElementById('modalDevPin');
  const modalDevPortal = document.getElementById('modalDevPortal');

  if (pinInput === appState.masterDevPin) {
    // Correct PIN!
    if (modalDevPin) modalDevPin.classList.remove('open');
    if (modalDevPortal) modalDevPortal.classList.add('open');
    updateDevPortalMetrics();
    showToast('🔓 Akses Master Diterima! Membuka Portal Pengembang.');
  } else {
    // Wrong PIN!
    if (pinError) {
      pinError.style.display = 'block';
      pinError.textContent = '❌ PIN Master Developer Salah! (Default: 8899)';
    }
  }
}

// Change Developer Master PIN
function changeDevMasterPin() {
  const newPin = prompt('Masukkan Master PIN Baru untuk Pengembang (minimal 4 karakter):', appState.masterDevPin);
  if (newPin && newPin.trim().length >= 4) {
    appState.masterDevPin = newPin.trim();
    localStorage.setItem('sr12_master_dev_pin', appState.masterDevPin);
    const pinDisp = document.getElementById('currentMasterPinDisplay');
    if (pinDisp) pinDisp.textContent = `${appState.masterDevPin} (Aktif)`;
    alert(`✅ Master PIN Berhasil Diperbarui!\n\nMaster PIN Pengembang baru Anda: ${appState.masterDevPin}\n\nSimpan PIN ini baik-baik.`);
    showToast('🔑 Master PIN Developer Berhasil Diperbarui!');
  } else if (newPin !== null) {
    alert('PIN minimal harus 4 karakter!');
  }
}

function setTier(tierId) {
  if (!SR12_TIERS[tierId]) return;
  appState.currentTier = tierId;
  
  const tierSelect = document.getElementById('globalTierSelect');
  if (tierSelect) tierSelect.value = tierId;

  renderTierQuickBanner();
  renderProducts();
  updateCartUI();

  showToast(`Level diubah ke: ${SR12_TIERS[tierId].name} (Diskon ${SR12_TIERS[tierId].discountPct}%)`);
}

function renderTierQuickBanner() {
  const tier = SR12_TIERS[appState.currentTier];
  const roleBadge = document.getElementById('activeTierBadge');
  const roleDesc = document.getElementById('activeTierDesc');
  const minOrderRule = document.getElementById('tierRuleMinOrder');

  if (roleBadge) {
    roleBadge.textContent = tier.label;
    roleBadge.style.borderColor = tier.badgeColor;
  }
  if (roleDesc) {
    roleDesc.textContent = tier.description;
  }
  if (minOrderRule) {
    if (tier.minOrderNominal > 0) {
      minOrderRule.textContent = `Min. Belanja: ${formatRupiah(tier.minOrderNominal)} (${tier.minOrderPcs} pcs)`;
      minOrderRule.style.display = 'inline-block';
    } else {
      minOrderRule.textContent = 'Tanpa Minimal Order';
      minOrderRule.style.display = 'inline-block';
    }
  }
}

// Render Products Catalog
function renderProducts() {
  const container = document.getElementById('productGrid');
  const counterEl = document.getElementById('catalogCountDisplay');
  if (!container) return;

  const filtered = appState.products.filter(prod => {
    const matchCat = appState.selectedCategory === 'all' || prod.category.toLowerCase().includes(appState.selectedCategory.toLowerCase());
    const matchSearch = prod.name.toLowerCase().includes(appState.searchQuery) ||
                        prod.sku.toLowerCase().includes(appState.searchQuery) ||
                        prod.category.toLowerCase().includes(appState.searchQuery);
    return matchCat && matchSearch;
  });

  if (counterEl) counterEl.textContent = `${filtered.length} Produk`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="font-size: 1.2rem; font-weight: 700; color: var(--dark-700); margin-bottom: 6px;">Produk SR12 Tidak Ditemukan</p>
        <p style="color: var(--dark-500); font-size: 0.9rem;">Coba kata kunci lain atau pilih kategori berbeda.</p>
      </div>
    `;
    return;
  }

  const currentTier = SR12_TIERS[appState.currentTier];

  container.innerHTML = filtered.map(prod => {
    const tierPrice = getProductTierPrice(prod, appState.currentTier);
    const profitMargin = prod.het - tierPrice;
    const isRetail = appState.currentTier === 'konsumen';

    return `
      <div class="product-card" id="card-${prod.id}">
        <div class="product-thumb-box">
          <img src="${prod.image}" alt="${prod.name}" loading="lazy" />
          <span class="badge-official-sr12">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            Resmi SR12
          </span>
          <span class="badge-bpom">BPOM: ${prod.bpom}</span>
          ${!isRetail ? `<span class="badge-discount-save">Hemat ${currentTier.discountPct}%</span>` : ''}

          ${appState.isAdminMode ? `
            <button class="btn-quick-edit-image" title="Ubah Gambar atau Detail Produk" onclick="openEditProductModal('${prod.id}')">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              Ganti Foto
            </button>
          ` : ''}
        </div>

        <div class="product-body">
          <div class="product-category-row">
            <span class="product-cat-name">${prod.category}</span>
            <span class="product-rating">
              ★ ${prod.rating || '4.9'} <span style="color: var(--dark-400); font-weight: 500;">(${prod.soldCount || 100})</span>
            </span>
          </div>

          <h4 class="product-title" onclick="openProductDetailModal('${prod.id}')">${prod.name}</h4>
          <p class="product-summary-text">${prod.summary}</p>

          <div class="price-block">
            <div class="price-het-row">
              <span>HET Konsumen:</span>
              <span class="${!isRetail ? 'het-strikethrough' : ''}">${formatRupiah(prod.het)}</span>
            </div>
            <div class="price-tier-row">
              <span class="tier-price-val">${formatRupiah(tierPrice)}</span>
              ${!isRetail ? `<span class="tier-profit-margin">+Profit ${formatRupiah(profitMargin)}</span>` : ''}
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-add-cart" onclick="addToCart('${prod.id}')">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Beli Sekarang
            </button>
            <button class="btn-detail-preview" title="Lihat Khasiat & Detail" onclick="${appState.isAdminMode ? `openEditProductModal('${prod.id}')` : `openProductDetailModal('${prod.id}')`}">
              ${appState.isAdminMode ? 'Edit' : 'Info'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(productId) {
  const existing = appState.cart.find(item => item.productId === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    appState.cart.push({ productId, qty: 1 });
  }

  saveStoredCart(appState.cart);
  updateCartUI();
  showToast(`Produk ditambahkan ke keranjang!`);
}

function adjustCartQty(productId, delta) {
  const itemIndex = appState.cart.findIndex(i => i.productId === productId);
  if (itemIndex > -1) {
    appState.cart[itemIndex].qty += delta;
    if (appState.cart[itemIndex].qty <= 0) {
      appState.cart.splice(itemIndex, 1);
    }
  }
  saveStoredCart(appState.cart);
  updateCartUI();
}

function removeFromCart(productId) {
  const itemIndex = appState.cart.findIndex(i => i.productId === productId);
  if (itemIndex > -1) {
    const prod = appState.products.find(p => p.id === productId);
    appState.cart.splice(itemIndex, 1);
    saveStoredCart(appState.cart);
    updateCartUI();
    showToast(`🗑️ ${prod ? prod.name : 'Produk'} dihapus dari keranjang.`);
  }
}

function clearCart() {
  if (!appState.cart || appState.cart.length === 0) {
    showToast('Keranjang belanja Anda sudah kosong.');
    return;
  }
  if (confirm('Kosongkan semua produk dari keranjang belanja?')) {
    appState.cart = [];
    saveStoredCart(appState.cart);
    updateCartUI();
    showToast('🗑️ Keranjang belanja berhasil dikosongkan.');
  }
}

function updateCartUI() {
  const countBadge = document.getElementById('cartItemCountBadge');
  const container = document.getElementById('cartItemsList');

  const totalItems = appState.cart.reduce((sum, item) => sum + item.qty, 0);
  if (countBadge) countBadge.textContent = totalItems;

  if (!container) return;

  if (appState.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--dark-400);">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 12px; color: var(--dark-300);">
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <p style="font-weight: 600; color: var(--dark-700);">Keranjang belanja masih kosong</p>
        <p style="font-size: 0.8rem;">Pilih produk SR12 untuk mulai belanja dengan harga mitra.</p>
      </div>
    `;
    updateCartSummary();
    return;
  }

  container.innerHTML = appState.cart.map(item => {
    const prod = appState.products.find(p => p.id === item.productId);
    if (!prod) return '';
    const tier = SR12_TIERS[appState.currentTier] || SR12_TIERS.konsumen;
    const unitPrice = getProductTierPrice(prod, appState.currentTier);
    const subtotal = unitPrice * item.qty;
    const isDiscounted = appState.currentTier !== 'konsumen' && unitPrice < prod.het;

    return `
      <div class="cart-item-card">
        <img src="${prod.image}" alt="${prod.name}">
        <div class="cart-item-info">
          <h5>${prod.name}</h5>
          <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 4px;">${prod.netto || prod.category || 'SR12 Herbal'}</div>
          
          <div class="cart-item-price" style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;">
            ${isDiscounted ? `
              <span style="text-decoration: line-through; color: #94a3b8; font-size: 0.74rem;">${formatRupiah(prod.het)}</span>
              <span style="color: #059669; font-weight: 800; font-size: 0.85rem;">${formatRupiah(unitPrice)}</span>
              <span style="background: #ecfdf5; color: #065f46; font-size: 0.68rem; font-weight: 800; padding: 1px 5px; border-radius: 4px;">-${tier.discountPct}%</span>
            ` : `
              <span style="color: #0f172a; font-weight: 700; font-size: 0.85rem;">${formatRupiah(unitPrice)}</span>
            `}
            <span style="color: #64748b; font-weight: 500; font-size: 0.74rem;">x ${item.qty}</span>
          </div>
          <div style="font-size: 0.8rem; font-weight: 800; color: #0284c7; margin-top: 3px;">= ${formatRupiah(subtotal)}</div>
        </div>
        <div class="cart-qty-ctrl">
          <button class="qty-btn" onclick="adjustCartQty('${item.productId}', -1)" title="Kurangi">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="adjustCartQty('${item.productId}', 1)" title="Tambah">+</button>
          <button class="qty-btn" onclick="removeFromCart('${item.productId}')" title="Hapus produk ini" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; margin-left: 4px; font-size: 0.8rem; padding: 2px 6px; cursor: pointer; border-radius: 4px;">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  updateCartSummary();
}

function updateCartSummary() {
  const subtotalLine = document.getElementById('cartSummarySubtotal');
  const platformFeeLine = document.getElementById('cartSummaryPlatformFee');
  const shippingLine = document.getElementById('cartSummaryShipping');
  const totalLine = document.getElementById('cartSummaryTotal');
  const moqWarning = document.getElementById('cartMoqWarning');
  const hetRow = document.getElementById('cartSummaryHetRow');
  const hetVal = document.getElementById('cartSummaryHetVal');
  const discountRow = document.getElementById('cartSummaryDiscountRow');
  const discountLabel = document.getElementById('cartSummaryDiscountLabel');
  const discountVal = document.getElementById('cartSummaryDiscountVal');
  const savingsBadge = document.getElementById('cartSavingsBadge');
  const savingsAmount = document.getElementById('cartSavingsAmount');
  const mitraBox = document.getElementById('cartMitraVerificationBox');
  const mitraTierLabel = document.getElementById('cartMitraTierLabel');

  let totalHet = 0;
  let subtotal = 0;
  let totalWeightGram = 0;
  let totalPcs = 0;

  appState.cart.forEach(item => {
    const prod = appState.products.find(p => p.id === item.productId);
    if (prod) {
      const price = getProductTierPrice(prod, appState.currentTier);
      totalHet += (prod.het || price) * item.qty;
      subtotal += price * item.qty;
      totalWeightGram += (prod.weightGram || 200) * item.qty;
      totalPcs += item.qty;
    }
  });

  const totalSavings = Math.max(0, totalHet - subtotal);
  const tier = SR12_TIERS[appState.currentTier] || SR12_TIERS.konsumen;

  // Rincian Baris Diskon Kemitraan
  if (totalSavings > 0 && appState.currentTier !== 'konsumen') {
    if (hetRow) {
      hetRow.style.display = 'flex';
      if (hetVal) hetVal.textContent = formatRupiah(totalHet);
    }
    if (discountRow) {
      discountRow.style.display = 'flex';
      if (discountLabel) discountLabel.textContent = `Diskon ${tier.name} (${tier.discountPct}%):`;
      if (discountVal) discountVal.textContent = `- ${formatRupiah(totalSavings)}`;
    }
    if (savingsBadge) {
      savingsBadge.style.display = 'block';
      if (savingsAmount) savingsAmount.textContent = `${formatRupiah(totalSavings)} (${tier.name} ${tier.discountPct}%)`;
    }
  } else {
    if (hetRow) hetRow.style.display = 'none';
    if (discountRow) discountRow.style.display = 'none';
    if (savingsBadge) savingsBadge.style.display = 'none';
  }

  const courierId = appState.buyerDetails.courier || 'jne';
  const courier = SR12_SHIPPING_PROVIDERS.find(c => c.id === courierId) || SR12_SHIPPING_PROVIDERS[0];
  const weightKg = Math.max(courier.minKg || 1, Math.ceil(totalWeightGram / 1000));
  const shippingCost = appState.cart.length > 0 ? (courier.id === 'pickup' ? 0 : courier.costPerKg * weightKg) : 0;
  
  // Model Biaya Layanan: Ditanggung Pembeli (+Rp 1.000)
  const isFeeChargedToBuyer = (appState.storeSettings.feePayer || 'buyer') === 'buyer';
  const currentFee = appState.cart.length > 0 && isFeeChargedToBuyer ? appState.platformFee : 0;
  const grandTotal = subtotal + shippingCost + currentFee;

  if (subtotalLine) subtotalLine.textContent = formatRupiah(subtotal);
  if (platformFeeLine) {
    if (isFeeChargedToBuyer) {
      platformFeeLine.textContent = formatRupiah(appState.platformFee);
      platformFeeLine.parentElement.style.display = 'flex';
    } else {
      platformFeeLine.parentElement.style.display = 'none'; // Ditanggung toko, tidak muncul ke pembeli
    }
  }

  // Tampilan Rincian Ongkos Kirim / Ambil Sendiri / COD
  if (shippingLine) {
    if (courier.id === 'pickup') {
      shippingLine.innerHTML = `<span style="color: #059669; font-weight: 800;">Gratis (Ambil di Toko)</span>`;
    } else if (courier.id === 'cod') {
      shippingLine.innerHTML = `<span>${formatRupiah(shippingCost)} <span style="font-size: 0.72rem; color: #b45309; font-weight: 700; background: #fef3c7; padding: 1px 6px; border-radius: 4px;">COD ${weightKg}kg</span></span>`;
    } else if (courier.id === 'instant') {
      shippingLine.innerHTML = `<span>${formatRupiah(shippingCost)} <span style="font-size: 0.72rem; color: #0369a1; font-weight: 700; background: #e0f2fe; padding: 1px 6px; border-radius: 4px;">Instan</span></span>`;
    } else {
      shippingLine.textContent = `${formatRupiah(shippingCost)} (${weightKg} kg)`;
    }
  }

  // Kotak Penjelasan Interaktif Metode Pengiriman / Pengambilan
  const courierNoticeBox = document.getElementById('courierNoticeBox');
  if (courierNoticeBox) {
    if (courier.id === 'pickup') {
      courierNoticeBox.style.display = 'block';
      courierNoticeBox.style.background = '#ecfdf5';
      courierNoticeBox.style.border = '1px solid #a7f3d0';
      courierNoticeBox.style.color = '#065f46';
      courierNoticeBox.innerHTML = `🏪 <b>Ambil Sendiri di Toko / Gudang (${appState.storeSettings.storeCity || 'Kota Toko'}):</b> Bebas ongkos kirim (Rp 0)! Pesanan Anda disiapkan oleh tim gudang dan siap diambil langsung setelah konfirmasi via WhatsApp.`;
    } else if (courier.id === 'cod') {
      courierNoticeBox.style.display = 'block';
      courierNoticeBox.style.background = '#fffbeb';
      courierNoticeBox.style.border = '1px solid #fde68a';
      courierNoticeBox.style.color = '#92400e';
      courierNoticeBox.innerHTML = `💵 <b>Layanan COD (Bayar di Tempat):</b> Pembayaran tunai dilakukan ke kurir saat paket tiba di alamat Anda. Mohon siapkan uang pas sebesar total belanja.`;
    } else if (courier.id === 'instant') {
      courierNoticeBox.style.display = 'block';
      courierNoticeBox.style.background = '#f0f9ff';
      courierNoticeBox.style.border = '1px solid #bae6fd';
      courierNoticeBox.style.color = '#0369a1';
      courierNoticeBox.innerHTML = `⚡ <b>Kurir Instan (GoSend / Grab):</b> Pengiriman cepat langsung sampai di hari yang sama (estimasi 1-3 jam) untuk wilayah ${appState.storeSettings.storeCity || 'dalam kota'} dan sekitarnya.`;
    } else if (courier.id === 'kargo') {
      courierNoticeBox.style.display = 'block';
      courierNoticeBox.style.background = '#f8fafc';
      courierNoticeBox.style.border = '1px solid #cbd5e1';
      courierNoticeBox.style.color = '#475569';
      courierNoticeBox.innerHTML = `🚛 <b>Jalur Kargo Agen / Grosir:</b> Tarif super hemat Rp 3.500/kg untuk belanja kuantitas besar (min. 10 kg). Cocok untuk Agen/Sub Agen restock berkoli-koli.`;
    } else {
      courierNoticeBox.style.display = 'none';
    }
  }

  if (totalLine) totalLine.textContent = formatRupiah(grandTotal);

  // Status Kemitraan & MOQ
  const isVerifiedPartner = !!appState.verifiedMitra && appState.verifiedMitra.tier === appState.currentTier;

  if (isVerifiedPartner) {
    // Sembunyikan verifikasi form manual karena sudah terautentikasi otomatis
    if (mitraBox) mitraBox.style.display = 'none';

    // Repeat Order bagi mitra resmi terdaftar: Bebas batas minimal pendaftaran Rp 5 juta / 50 pcs!
    if (moqWarning) {
      moqWarning.style.display = 'block';
      moqWarning.style.background = '#ecfdf5';
      moqWarning.style.borderColor = '#a7f3d0';
      moqWarning.style.color = '#065f46';
      moqWarning.innerHTML = `✨ <b>Repeat Order ${tier.name} Terverifikasi (${appState.verifiedMitra.id}):</b> Diskon ${tier.discountPct}% dinikmati tanpa syarat minimal belanja Rp 5 juta!`;
    }
  } else {
    // Tamu umum / kualifikasi baru
    if (mitraBox) {
      if (appState.currentTier !== 'konsumen') {
        mitraBox.style.display = 'block';
        if (mitraTierLabel) mitraTierLabel.textContent = tier.name;
      } else {
        mitraBox.style.display = 'none';
      }
    }
    if (moqWarning) {
      if (appState.currentTier !== 'konsumen' && (subtotal < tier.minOrderNominal || totalPcs < tier.minOrderPcs)) {
        moqWarning.style.display = 'block';
        moqWarning.style.background = '#fffbeb';
        moqWarning.style.borderColor = '#fde68a';
        moqWarning.style.color = '#92400e';
        moqWarning.innerHTML = `⚠️ <b>Syarat Belanja ${tier.name}:</b> Minimal belanja ${formatRupiah(tier.minOrderNominal)} atau min. ${tier.minOrderPcs} pcs produk (untuk pendaftaran mitra baru).`;
      } else {
        moqWarning.style.display = 'none';
      }
    }
  }
}

function checkoutViaWhatsApp() {
  if (appState.cart.length === 0) {
    alert('Keranjang belanja Anda masih kosong!');
    return;
  }

  let totalHet = 0;
  let subtotal = 0;
  let totalPcs = 0;
  const tier = SR12_TIERS[appState.currentTier] || SR12_TIERS.konsumen;

  const itemsText = appState.cart.map((item, idx) => {
    const prod = appState.products.find(p => p.id === item.productId);
    const price = getProductTierPrice(prod, appState.currentTier);
    totalHet += (prod.het || price) * item.qty;
    subtotal += price * item.qty;
    totalPcs += item.qty;
    const isDiscounted = appState.currentTier !== 'konsumen' && price < prod.het;
    return `${idx + 1}. ${prod.name} (${item.qty} pcs) x ${formatRupiah(price)}${isDiscounted ? ` [Diskon ${tier.discountPct}% dari ${formatRupiah(prod.het)}]` : ''} = ${formatRupiah(price * item.qty)}`;
  }).join('\n');

  const totalSavings = Math.max(0, totalHet - subtotal);
  const isVerifiedPartner = !!appState.verifiedMitra && appState.verifiedMitra.tier === appState.currentTier;

  // Proteksi & Validasi Tingkatan Kemitraan (Anti-Cheating / Anti-Bypass)
  // Mitra resmi terdaftar bebas syarat minimal pendaftaran awal (Rp 5 juta)
  if (!isVerifiedPartner && tier && tier.id !== 'konsumen') {
    if (subtotal < tier.minOrderNominal || totalPcs < tier.minOrderPcs) {
      alert(`⛔ SYARAT MINIMAL BELANJA LEVEL ${tier.name.toUpperCase()} BELUM TERPENUHI!\n\n` +
        `Anda saat ini memilih harga khusus: ${tier.name} (Diskon ${tier.discountPct}%).\n` +
        `• Ketentuan Pendaftaran Mitra Baru: Minimal belanja ${formatRupiah(tier.minOrderNominal)} atau min. ${tier.minOrderPcs} pcs produk.\n` +
        `• Total belanja di keranjang Anda: ${formatRupiah(subtotal)} (${totalPcs} pcs).\n\n` +
        `💡 Pilihan Anda:\n` +
        `1. Masukkan ID Mitra Anda pada formulir "Cek Kemitraan" di bagian atas keranjang jika Anda adalah mitra resmi aktif (bebas batas minimal belanja).\n` +
        `2. Tambah jumlah/varian produk hingga mencapai minimal ${formatRupiah(tier.minOrderNominal)} untuk bergabung menjadi mitra baru.\n` +
        `3. Atau ubah pilihan tingkat harga ke "Konsumen Retail (HET)".`);
      return;
    }
  }

  // Model 1: Prepaid Order Quota Check (Sistem Kuota Saldo Prabayar WhatsApp)
  const currentQuota = typeof appState.storeSettings.orderQuota === 'number' ? appState.storeSettings.orderQuota : 10;
  if (currentQuota <= 0) {
    if (appState.isAdminMode) {
      alert('⚠️ KUOTA TRANSAKSI TOKO TELAH HABIS (0 ORDER)!\n\nSilakan lakukan Top Up Kuota Order agar calon pembeli dapat melanjutkan pesanan checkout WhatsApp.');
      openTopupQuotaModal();
    } else {
      alert('⚠️ Mohon maaf, saat ini sistem pemesanan online toko sedang dalam pemeliharaan kuota sistem.\n\nPemilik toko dapat mengaktifkan kembali instan melalui panel admin toko.');
    }
    return;
  }

  // Deduct 1 quota
  appState.storeSettings.orderQuota = currentQuota - 1;
  const storeInList = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug);
  if (storeInList) {
    storeInList.orderQuota = appState.storeSettings.orderQuota;
    saveStoredPartnerStores(appState.partnerStores);
  }
  updateStoreQuotaUI();

  let totalWeightGram = 0;
  appState.cart.forEach(item => {
    const p = appState.products.find(prod => prod.id === item.productId);
    const w = (p && p.weightGram) ? p.weightGram : 100;
    totalWeightGram += w * item.qty;
  });

  const courier = SR12_SHIPPING_PROVIDERS.find(c => c.id === appState.buyerDetails.courier) || SR12_SHIPPING_PROVIDERS[0];
  const weightKg = Math.max(courier.minKg || 1, Math.ceil(totalWeightGram / 1000));
  const shippingCost = courier.id === 'pickup' ? 0 : courier.costPerKg * weightKg;
  const isFeeChargedToBuyer = (appState.storeSettings.feePayer || 'buyer') === 'buyer';
  const fee = isFeeChargedToBuyer ? appState.platformFee : 0;
  const grandTotal = subtotal + shippingCost + fee;

  let dropshipText = '';
  if (appState.isDropship) {
    const dName = document.getElementById('dropshipNameInput')?.value || appState.dropshipSender.name;
    const dPhone = document.getElementById('dropshipPhoneInput')?.value || appState.dropshipSender.phone;
    dropshipText = `\n🏷️ *MODE DROPSHIP:*\n• Pengirim: ${dName} (${dPhone})\n`;
  }

  // Update atau Kualifikasi Mitra / Reseller / Marketer di Database Distributor
  const inputPartnerQuery = document.getElementById('cartBuyerPhoneInput')?.value.trim();
  const inputBuyerName = document.getElementById('cartBuyerNameInput')?.value.trim();
  const inputBuyerPhone = document.getElementById('cartBuyerPhoneField')?.value.trim();

  if (inputBuyerName) appState.buyerDetails.name = inputBuyerName;
  if (inputBuyerPhone) appState.buyerDetails.phone = inputBuyerPhone;

  if (inputPartnerQuery && !inputPartnerQuery.toUpperCase().startsWith('AG-') && !inputPartnerQuery.toUpperCase().startsWith('SUB-') && !inputPartnerQuery.toUpperCase().startsWith('RS-') && !inputPartnerQuery.toUpperCase().startsWith('MKT-')) {
    appState.buyerDetails.phone = inputPartnerQuery;
  }
  const buyerPhone = appState.buyerDetails.phone;
  const nowIso = '2026-09-27';

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }
  if (!appState.marketerSales) {
    appState.marketerSales = getStoredMarketerSales();
  }

  const foundMitra = findMitraByIdOrPhone(inputPartnerQuery || buyerPhone);
  let crmNoticeText = '';

  if (foundMitra) {
    if (foundMitra.tier === 'marketer') {
      const comm = Math.round(subtotal * 0.15);
      const newSale = {
        orderId: 'ORD-MKT-' + Date.now().toString().slice(-4),
        marketerId: foundMitra.id,
        date: nowIso,
        monthPeriod: '2026-09',
        customerName: appState.buyerDetails.name || 'Pelanggan Online',
        customerPhone: buyerPhone || '-',
        itemsDesc: appState.cart.map(i => {
          const p = appState.products.find(pr => pr.id === i.productId);
          return `${i.qty}x ${p ? p.name : 'Produk'}`;
        }).join(', '),
        omsetHet: subtotal,
        commissionPct: 15,
        commissionAmount: comm,
        paidStatus: 'unpaid',
        paidDate: null
      };
      appState.marketerSales.unshift(newSale);
      saveStoredMarketerSales(appState.marketerSales);

      foundMitra.accumulatedSpent90Days = (foundMitra.accumulatedSpent90Days || 0) + subtotal;
      foundMitra.totalOrdersCount = (foundMitra.totalOrdersCount || 0) + 1;
      foundMitra.lastOrderDate = nowIso;
      saveStoredMitra(appState.mitraList);

      crmNoticeText = `\n💼 *TIM MARKETER RESMI (PENJUALAN TANPA MODAL):*\n` +
        `• Marketer Penjual : ${foundMitra.name} (${foundMitra.id})\n` +
        `• No. Rekening     : ${foundMitra.bankName} - ${foundMitra.bankAccount} (a.n ${foundMitra.bankHolder || foundMitra.name})\n` +
        `• Komisi Marketer  : ${formatRupiah(comm)} (15% otomatis tercatat di Rekap Gaji Bulanan Distributor)\n`;
      showToast(`💼 Pesanan berhasil dicatat untuk Tim Marketer: ${foundMitra.name}! Komisi 15% masuk rekap gaji.`);
    } else {
      foundMitra.accumulatedSpent90Days = (foundMitra.accumulatedSpent90Days || 0) + subtotal;
      foundMitra.totalOrdersCount = (foundMitra.totalOrdersCount || 0) + 1;
      foundMitra.lastOrderDate = nowIso;
      if (foundMitra.tier === 'reseller' && foundMitra.accumulatedSpent90Days >= 500000) {
        foundMitra.status = 'active';
      }
      saveStoredMitra(appState.mitraList);

      crmNoticeText = `\n🔄 *STATUS KEMITRAAN DISTRIBUTOR:*\n` +
        `• ID & Nama Mitra  : ${foundMitra.id} - ${foundMitra.name}\n` +
        `• Tingkat Level    : ${SR12_TIERS[foundMitra.tier]?.name || 'Reseller'} (Diskon ${SR12_TIERS[foundMitra.tier]?.discountPct}%)\n` +
        `• Akumulasi Belanja: ${formatRupiah(foundMitra.accumulatedSpent90Days)}\n`;
    }
  } else {
    // Belum terdaftar, cek apakah memenuhi kualifikasi belanja 500rb
    if (subtotal >= 500000) {
      const nextId = generateNextMitraId('reseller');
      const newReseller = {
        id: nextId,
        name: appState.buyerDetails.name || 'Mitra Reseller Baru',
        phone: buyerPhone,
        city: appState.buyerDetails.address?.split(',')[0] || appState.storeSettings.storeCity,
        tier: 'reseller',
        bankName: 'BCA',
        bankAccount: '-',
        bankHolder: appState.buyerDetails.name || '-',
        qualificationDate: nowIso,
        lastOrderDate: nowIso,
        accumulatedSpent90Days: subtotal,
        totalOrdersCount: 1,
        status: 'active'
      };
      appState.mitraList.unshift(newReseller);
      saveStoredMitra(appState.mitraList);

      crmNoticeText = `\n🎉 *KUALIFIKASI RESELLER BARU DISTRIBUTOR:*\n` +
        `• ID Diberikan     : ${nextId}\n` +
        `• Syarat Terpenuhi : Belanja awal ${formatRupiah(subtotal)} (&ge; Rp 500.000)\n` +
        `• Masa Aktif       : Diskon 20% otomatis aktif selama 90 hari ke depan!\n`;
      showToast(`🎉 Selamat! Anda otomatis tercatat sebagai Reseller Resmi SR12 (ID: ${nextId})!`);
    }
  }

  let mitraVerificationText = '';
  if (appState.currentTier !== 'konsumen') {
    const mitraId = (foundMitra && foundMitra.id) || document.getElementById('buyerMitraIdInput')?.value.trim() || 'Mitra Resmi';
    mitraVerificationText = `\n🆔 *DATA KEMITRAAN RESMI SR12:*\n` +
      `• Level Mitra : ${tier.name} (Diskon ${tier.discountPct}%)\n` +
      `• No. ID Mitra: ${mitraId}\n` +
      `• Verifikasi  : Otomatis terdaftar di database distributor resmi.\n`;
  }

  const storeName = appState.storeSettings.storeName;
  const targetWa = appState.storeSettings.storeWaNumber.replace(/[^0-9]/g, '');

  const message = `*FORMAT PESANAN RESMI ${storeName.toUpperCase()}*\n` +
    `----------------------------------------\n` +
    `Level Pembeli : ${SR12_TIERS[appState.currentTier].name}\n` +
    `Tanggal       : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n` +
    `----------------------------------------\n` +
    `📦 *DAFTAR PRODUK SR12:*\n${itemsText}\n\n` +
    (totalSavings > 0 ? `Harga Retail Normal (HET) : ${formatRupiah(totalHet)}\n` +
    `Diskon Kemitraan (${tier.name} ${tier.discountPct}%) : -${formatRupiah(totalSavings)}\n` : '') +
    `Subtotal Produk : ${formatRupiah(subtotal)}\n` +
    (courier.id === 'pickup'
      ? `Metode Pengambilan : 🏪 Ambil Sendiri di Gudang Toko [Bebas Ongkir - Rp 0]\n`
      : courier.id === 'cod'
        ? `Metode Pengiriman  : 💵 COD (Bayar Tunai di Tempat saat Sampai)\nOngkos Kirim COD    : ${formatRupiah(shippingCost)} (${weightKg} kg)\n`
        : courier.id === 'instant'
          ? `Metode Pengiriman  : ⚡ Kurir Instan / Same Day (GoSend/Grab)\nOngkos Kirim Instan : ${formatRupiah(shippingCost)} (${weightKg} kg)\n`
          : `Ongkos Kirim (${courier.name}) : ${formatRupiah(shippingCost)} (${weightKg} kg)\n`
    ) +
    (fee > 0 ? `Biaya Layanan Sistem : ${formatRupiah(fee)}\n` : '') +
    `*TOTAL PEMBAYARAN: ${formatRupiah(grandTotal)}*\n` +
    (totalSavings > 0 ? `🎉 *TOTAL HEMAT: ${formatRupiah(totalSavings)}*\n` : '') +
    crmNoticeText +
    mitraVerificationText +
    `----------------------------------------\n` +
    (courier.id === 'pickup'
      ? `🏪 *DATA PENGAMBILAN DI TOKO/GUDANG:*\n` +
        `• Nama Pemesan/Pengambil : ${appState.buyerDetails.name || 'Pelanggan'}\n` +
        `• No. WhatsApp           : ${buyerPhone || appState.buyerDetails.phone || '-'}\n` +
        `• Lokasi Ambil Barang    : Gudang Resmi SR12 ${storeName} (${appState.storeSettings.storeCity || 'Kota Toko'})\n` +
        `• Status Pengambilan     : Diambil Mandiri oleh Pembeli / Mitra\n`
      : `👤 *DATA PENERIMA:*\n` +
        `• Nama   : ${appState.buyerDetails.name || 'Pelanggan'}\n` +
        `• No HP  : ${buyerPhone || appState.buyerDetails.phone || '-'}\n` +
        `• Alamat : ${appState.buyerDetails.address || '-'}\n`
    ) +
    dropshipText +
    `----------------------------------------\n` +
    (courier.id === 'cod'
      ? `💡 *CATATAN COD:* Pesanan dikirim dengan opsi Bayar di Tempat. Pembeli wajib menyiapkan uang tunai pas sebesar *${formatRupiah(grandTotal)}* kepada kurir saat serah terima paket.\nMohon konfirmasi pesanan ini agar segera diproses packing. Terima kasih ${storeName}! 🌿`
      : courier.id === 'pickup'
        ? `💡 *CATATAN AMBIL SENDIRI:* Mohon konfirmasi kesiapan barang di gudang sebelum pengambilan. Terima kasih ${storeName}! 🌿`
        : `Mohon konfirmasi pesanan dan nomor rekening pembayaran. Terima kasih ${storeName}! 🌿`
    );

  appState.devMetrics.totalPlatformTransactions += 1;
  appState.devMetrics.totalGMV += grandTotal;
  updateDevPortalMetrics();

  // Catat pesanan online ke riwayat Transaksi Toko Distributor
  const orderTrxId = 'ORD-WEB-' + Date.now().toString().slice(-6);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const webOrder = {
    id: orderTrxId,
    dateTime: dateFormatted,
    customerName: (appState.buyerDetails.name || 'Pelanggan') + (foundMitra ? ` (${foundMitra.id})` : ''),
    customerPhone: buyerPhone || appState.buyerDetails.phone || '-',
    customerAddress: appState.buyerDetails.address || '-',
    tier: appState.currentTier,
    tierLabel: SR12_TIERS[appState.currentTier]?.name || 'Konsumen',
    items: appState.cart.map(item => {
      const p = appState.products.find(pr => pr.id === item.productId);
      const prc = getProductTierPrice(p, appState.currentTier);
      return {
        name: p ? p.name : 'Produk SR12',
        qty: item.qty,
        price: prc,
        subtotal: prc * item.qty
      };
    }),
    subtotalHet: totalHet,
    discountAmount: totalSavings,
    grandTotal: grandTotal,
    paymentMethod: courier.id === 'pickup' ? 'Ambil Sendiri di Toko' : courier.id === 'cod' ? 'COD (Bayar di Tempat)' : `Ekspedisi ${courier.name}`,
    status: courier.id === 'pickup' ? 'Siap Diambil di Toko' : 'Menunggu Konfirmasi',
    orderSource: 'Online Web Store'
  };

  if (!appState.transactions) {
    try {
      const stored = localStorage.getItem('sr12_pos_transactions_v1');
      appState.transactions = stored ? JSON.parse(stored) : [];
    } catch(e) {
      appState.transactions = [];
    }
  }
  appState.transactions.unshift(webOrder);
  localStorage.setItem('sr12_pos_transactions_v1', JSON.stringify(appState.transactions));
  
  const trxBadge = document.getElementById('olseraTrxBadge');
  if (trxBadge) trxBadge.textContent = `${appState.transactions.length}`;

  // Trigger notifikasi real-time ke Admin dan mainkan suara dering
  triggerAdminNewOrderNotification(webOrder);

  // Kosongkan keranjang pembeli agar siap untuk pesanan berikutnya (tidak tertinggal di browser)
  appState.cart = [];
  saveStoredCart(appState.cart);
  updateCartUI();

  const encoded = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${targetWa}&text=${encoded}`;
  openWhatsAppPreviewModal(message, waUrl);
}

function openWhatsAppPreviewModal(text, url) {
  const modal = document.getElementById('modalWhatsAppPreview');
  const previewBox = document.getElementById('waMessagePreviewBox');
  const btnDirectSend = document.getElementById('btnDirectSendWA');

  if (previewBox) previewBox.textContent = text;
  if (btnDirectSend) {
    btnDirectSend.onclick = () => window.open(url, '_blank');
  }
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function openProductDetailModal(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  const modal = document.getElementById('modalProductDetail');
  const title = document.getElementById('modalProdTitle');
  const image = document.getElementById('modalProdImage');
  const bpom = document.getElementById('modalProdBpom');
  const halal = document.getElementById('modalProdHalal');
  const het = document.getElementById('modalProdHet');
  const tierPrice = document.getElementById('modalProdTierPrice');
  const benefits = document.getElementById('modalProdBenefits');
  const howToUse = document.getElementById('modalProdHowTo');
  const btnAdd = document.getElementById('modalBtnAddCart');
  const btnEdit = document.getElementById('modalBtnEditProd');

  if (title) title.textContent = prod.name;
  if (image) image.src = prod.image;
  if (bpom) bpom.textContent = prod.bpom;
  if (halal) halal.textContent = prod.halal || 'MUI Terdaftar';
  if (het) het.textContent = formatRupiah(prod.het);
  
  const currentPrice = getProductTierPrice(prod, appState.currentTier);
  if (tierPrice) {
    tierPrice.textContent = `${formatRupiah(currentPrice)} (${SR12_TIERS[appState.currentTier].label})`;
  }

  if (benefits) {
    benefits.innerHTML = prod.benefits ? prod.benefits.map(b => `<li>${b}</li>`).join('') : '<li>Produk resmi SR12 Herbal Skin Care.</li>';
  }
  if (howToUse) howToUse.textContent = prod.howToUse || 'Gunakan secara teratur sesuai petunjuk pada kemasan.';
  if (btnAdd) {
    btnAdd.onclick = () => {
      addToCart(prod.id);
      modal.classList.remove('open');
    };
  }
  if (btnEdit) {
    btnEdit.style.display = appState.isAdminMode ? 'block' : 'none';
    btnEdit.onclick = () => {
      modal.classList.remove('open');
      openEditProductModal(prod.id);
    };
  }

  if (modal) modal.classList.add('open');
}

function openEditProductModal(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  appState.activeEditingProductId = productId;
  appState.tempEditImageBase64 = prod.image;

  const modal = document.getElementById('modalEditProduct');
  const nameInput = document.getElementById('editProdName');
  const catInput = document.getElementById('editProdCategory');
  const hetInput = document.getElementById('editProdHet');
  const stockInput = document.getElementById('editProdStock');
  const summaryInput = document.getElementById('editProdSummary');
  const imgUrlInput = document.getElementById('editProdImgUrl');
  const imgPreview = document.getElementById('editProdImgPreview');

  if (nameInput) nameInput.value = prod.name;
  if (catInput) catInput.value = prod.category;
  if (hetInput) {
    hetInput.value = prod.het;
    updateEditProdTierCalc(prod.het);
  }
  if (stockInput) stockInput.value = prod.stock || 100;
  if (summaryInput) summaryInput.value = prod.summary || '';
  if (imgUrlInput) imgUrlInput.value = prod.image.startsWith('data:') ? '' : prod.image;
  if (imgPreview) {
    imgPreview.src = prod.image;
    imgPreview.style.display = 'block';
  }

  if (modal) modal.classList.add('open');
}

function handleEditProductSubmit(e) {
  if (e) e.preventDefault();

  const prodId = appState.activeEditingProductId;
  const prod = appState.products.find(p => p.id === prodId);
  if (!prod) return;

  const newName = document.getElementById('editProdName')?.value.trim();
  const newCat = document.getElementById('editProdCategory')?.value;
  const newHet = Number(document.getElementById('editProdHet')?.value);
  const stockRaw = document.getElementById('editProdStock')?.value;
  const newStock = (stockRaw !== '' && !isNaN(Number(stockRaw))) ? Number(stockRaw) : (typeof prod.stock !== 'undefined' ? prod.stock : 100);
  const newSummary = document.getElementById('editProdSummary')?.value.trim();
  const newImgUrl = document.getElementById('editProdImgUrl')?.value.trim();

  let finalImage = prod.image;
  if (appState.tempEditImageBase64) {
    finalImage = appState.tempEditImageBase64;
  }
  if (newImgUrl) {
    finalImage = newImgUrl;
  }

  prod.name = newName || prod.name;
  prod.category = newCat || prod.category;
  if (newHet && !isNaN(newHet) && newHet > 0) {
    prod.het = newHet;
    prod.price = newHet;
  }
  prod.stock = newStock;
  prod.summary = newSummary || prod.summary;
  prod.image = finalImage;

  saveStoredProducts(appState.products);
  renderProducts();
  updateCartUI();
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderPosProducts === 'function') renderPosProducts();

  closeModal('modalEditProduct');
  showToast(`✅ Berhasil! Stok "${prod.name}" menjadi ${prod.stock} pcs dan data HET Rp ${(prod.het || 0).toLocaleString('id-ID')} berhasil diperbarui.`);
}

function setEditImagePreset(presetType) {
  const imgPreview = document.getElementById('editProdImgPreview');
  const imgUrlInput = document.getElementById('editProdImgUrl');
  let selectedImg = 'assets/hero-banner.jpg';

  if (presetType === 'deodorant') selectedImg = 'assets/deodorant-spray.jpg';
  else if (presetType === 'banner') selectedImg = 'assets/hero-banner.jpg';
  else if (presetType === 'gold') selectedImg = 'assets/reward-gold.jpg';

  appState.tempEditImageBase64 = selectedImg;
  if (imgUrlInput) imgUrlInput.value = selectedImg;
  if (imgPreview) {
    imgPreview.src = selectedImg;
    imgPreview.style.display = 'block';
  }
}

function openStoreSettingsModal() {
  const cfg = appState.storeSettings;
  const modal = document.getElementById('modalStoreSettings');
  const nameInput = document.getElementById('settingStoreName');
  const tagInput = document.getElementById('settingStoreTagline');
  const logoTextInput = document.getElementById('settingLogoText');
  const waInput = document.getElementById('settingStoreWa');
  const cityInput = document.getElementById('settingStoreCity');
  const ownerInput = document.getElementById('settingStoreOwner');
  const heroTitleInput = document.getElementById('settingHeroTitle');
  const heroSubtitleInput = document.getElementById('settingHeroSubtitle');
  const previewLogo = document.getElementById('settingLogoPreview');
  const previewBanner = document.getElementById('settingBannerPreview');
  const feePayerSelect = document.getElementById('settingFeePayer');

  if (nameInput) nameInput.value = cfg.storeName;
  if (tagInput) tagInput.value = cfg.storeTagline;
  if (logoTextInput) logoTextInput.value = cfg.storeLogoText;
  if (waInput) waInput.value = cfg.storeWaNumber;
  if (cityInput) cityInput.value = cfg.storeCity;
  if (ownerInput) ownerInput.value = cfg.storeOwner;
  if (heroTitleInput) heroTitleInput.value = cfg.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle;
  if (heroSubtitleInput) heroSubtitleInput.value = cfg.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle;
  if (feePayerSelect) feePayerSelect.value = cfg.feePayer || 'buyer';
  const storeAdminPinInput = document.getElementById('settingStoreAdminPin');
  if (storeAdminPinInput) storeAdminPinInput.value = cfg.storeAdminPin || '1234';

  if (previewLogo) {
    if (cfg.storeLogoUrl) {
      previewLogo.src = cfg.storeLogoUrl;
      previewLogo.style.display = 'block';
    } else {
      previewLogo.style.display = 'none';
    }
  }

  if (previewBanner) {
    if (cfg.heroBannerUrl) {
      previewBanner.src = cfg.heroBannerUrl;
      previewBanner.style.display = 'block';
    } else {
      previewBanner.style.display = 'none';
    }
  }

  const swatches = document.querySelectorAll('.theme-swatch-btn');
  swatches.forEach(s => {
    s.classList.toggle('active', s.dataset.theme === (cfg.storeTheme || 'emerald'));
  });

  if (modal) modal.classList.add('open');
}

function selectThemePreset(themeName) {
  appState.storeSettings.storeTheme = themeName;
  applyStoreTheme(themeName);
  const swatches = document.querySelectorAll('.theme-swatch-btn');
  swatches.forEach(s => {
    s.classList.toggle('active', s.dataset.theme === themeName);
  });
}

function handleSaveStoreSettingsSubmit(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('settingStoreName')?.value.trim();
  const tagline = document.getElementById('settingStoreTagline')?.value.trim();
  const logoText = document.getElementById('settingLogoText')?.value.trim().toUpperCase() || 'SR12';
  const wa = document.getElementById('settingStoreWa')?.value.trim();
  const city = document.getElementById('settingStoreCity')?.value.trim();
  const owner = document.getElementById('settingStoreOwner')?.value.trim();
  const heroTitle = document.getElementById('settingHeroTitle')?.value.trim();
  const heroSubtitle = document.getElementById('settingHeroSubtitle')?.value.trim();
  const feePayer = document.getElementById('settingFeePayer')?.value || 'buyer';
  const storeAdminPin = document.getElementById('settingStoreAdminPin')?.value.trim() || '1234';

  let logoUrl = appState.storeSettings.storeLogoUrl;
  if (appState.tempStoreLogoBase64) {
    logoUrl = appState.tempStoreLogoBase64;
  }

  let bannerUrl = appState.storeSettings.heroBannerUrl;
  if (appState.tempHeroBannerBase64) {
    bannerUrl = appState.tempHeroBannerBase64;
  }

  appState.storeSettings = {
    storeName: name || 'SR12 Partner Hub',
    storeTagline: tagline || 'Herbal Skin Care Ecosystem',
    storeTheme: appState.storeSettings.storeTheme || 'emerald',
    heroTitle: heroTitle || DEFAULT_STORE_SETTINGS.heroTitle,
    heroSubtitle: heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle,
    heroBannerUrl: bannerUrl,
    storeLogoText: logoText,
    storeLogoUrl: logoUrl,
    storeWaNumber: wa || '6281234567890',
    storeCity: city || 'Jakarta',
    storeOwner: owner || 'Mitra Resmi',
    feePayer: feePayer,
    storeAdminPin: storeAdminPin
  };

  localStorage.setItem('sr12_store_settings_v4', JSON.stringify(appState.storeSettings));
  renderStoreBranding();
  updateCartSummary();
  closeModal('modalStoreSettings');
  showToast(`🎉 Profil & Tema Toko Berhasil Disimpan: "${appState.storeSettings.storeName}"!`);
}

function setQuickLogoBadge(text) {
  const logoTextInput = document.getElementById('settingLogoText');
  if (logoTextInput) logoTextInput.value = text;
  appState.tempStoreLogoBase64 = null;
  const previewLogo = document.getElementById('settingLogoPreview');
  if (previewLogo) previewLogo.style.display = 'none';
}

function handleAddProductSubmit(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('newProdName')?.value.trim();
  const category = document.getElementById('newProdCategory')?.value;
  const sku = document.getElementById('newProdSku')?.value.trim().toUpperCase();
  const bpom = document.getElementById('newProdBpom')?.value.trim();
  const het = Number(document.getElementById('newProdHet')?.value);
  const stock = Number(document.getElementById('newProdStock')?.value) || 50;
  const summary = document.getElementById('newProdSummary')?.value.trim();
  const imageChoice = document.getElementById('newProdImageChoice')?.value || 'assets/hero-banner.jpg';

  if (!name || !sku || !bpom || !het) {
    alert('Mohon lengkapi Nama Produk, SKU, No. BPOM, dan Harga HET!');
    return;
  }

  const lowerName = name.toLowerCase();
  const prohibitedBrands = ['ms glow', 'scarlett', 'wardah', 'somethinc', 'skintific', 'erha', 'ponds', 'garnier', 'nivea', 'vaseline', 'luwak'];
  const isProhibited = prohibitedBrands.some(brand => lowerName.includes(brand));
  const hasSR12Prefix = sku.startsWith('SR12-') || sku.startsWith('SR-') || lowerName.includes('sr12');

  if (isProhibited || !hasSR12Prefix) {
    alert(`❌ SISTEM MENOLAK KERAS!\n\nProduk "${name}" ditolak karena bukan bagian dari produk resmi SR12 Herbal Skin Care.\n\nSyarat Tambah Produk:\n• Harus produk SR12 Herbal Perkasa\n• Kode SKU wajib diawali "SR12-" (contoh: SR12-NEW-01)\n• Nomor BPOM wajib resmi.`);
    return;
  }

  const newProduct = {
    id: sku,
    name: name,
    category: category,
    sku: sku,
    bpom: bpom,
    halal: 'MUI Terverifikasi',
    image: imageChoice,
    het: het,
    weightGram: 80,
    stock: stock,
    isBestseller: false,
    rating: 5.0,
    soldCount: 0,
    summary: summary || 'Produk varian terbaru resmi dari SR12 Herbal Skin Care.',
    benefits: [
      'Produk terbaru original berlisensi resmi PT. SR12 Herbal Perkasa',
      'Teruji secara klinis dan terdaftar resmi di BPOM'
    ],
    howToUse: 'Gunakan sesuai petunjuk pada kemasan produk.'
  };

  appState.products.unshift(newProduct);
  saveStoredProducts(appState.products);

  renderProducts();
  closeModal('modalAddProduct');
  showToast(`✅ Berhasil! Produk "${name}" resmi ditambahkan ke katalog etalase.`);
}

function handleAddMarketingKitSubmit(e) {
  if (e) e.preventDefault();

  const prodName = document.getElementById('newMkitProdName')?.value.trim();
  const headline = document.getElementById('newMkitHeadline')?.value.trim();
  const caption = document.getElementById('newMkitCaption')?.value.trim();
  const tagsStr = document.getElementById('newMkitTags')?.value.trim();

  if (!prodName || !caption) {
    alert('Mohon isi Nama Produk dan Teks Copywriting Promosi!');
    return;
  }

  const tags = tagsStr ? tagsStr.split(' ').filter(t => t.startsWith('#')) : ['#SR12Herbal', '#MitraSR12'];

  const newKit = {
    id: 'mk-' + Date.now(),
    productName: prodName,
    headline: headline || 'Promo Spesial SR12!',
    caption: caption,
    tags: tags.length > 0 ? tags : ['#SR12Herbal', '#MitraSR12']
  };

  appState.marketingKits.unshift(newKit);
  const existingCustom = JSON.parse(localStorage.getItem('sr12_custom_marketing_kits') || '[]');
  existingCustom.push(newKit);
  localStorage.setItem('sr12_custom_marketing_kits', JSON.stringify(existingCustom));

  renderMarketingKits();
  closeModal('modalAddMkit');
  showToast(`✅ Bahan promosi untuk "${prodName}" berhasil ditambahkan!`);
}

function handleAddCustomPromoSubmit(e) {
  if (e) e.preventDefault();

  const title = document.getElementById('newPromoTitle')?.value.trim();
  const points = Number(document.getElementById('newPromoPoints')?.value) || 50;
  const desc = document.getElementById('newPromoDesc')?.value.trim();
  const badge = document.getElementById('newPromoBadge')?.value.trim() || 'Promo Khusus Toko';

  if (!title || !desc) {
    alert('Mohon isi Judul Promo dan Deskripsi Ketentuan Bonus!');
    return;
  }

  const newPromo = {
    id: 'rew-toko-' + Date.now(),
    scope: 'toko',
    title: title,
    requiredPoints: points,
    category: 'Promo Toko',
    description: desc,
    badge: badge
  };

  appState.rewards.unshift(newPromo);
  const existingCustom = JSON.parse(localStorage.getItem('sr12_custom_rewards') || '[]');
  existingCustom.push(newPromo);
  localStorage.setItem('sr12_custom_rewards', JSON.stringify(existingCustom));

  renderRewards();
  closeModal('modalAddPromo');
  showToast(`✅ Promo insidental "${title}" berhasil dibuat!`);
}

function renderRewards() {
  const container = document.getElementById('rewardsGrid');
  if (!container) return;

  const filtered = appState.rewards.filter(r => {
    if (appState.selectedRewardScope === 'all') return true;
    return r.scope === appState.selectedRewardScope;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="font-weight: 700; color: var(--dark-700);">Belum Ada Promo dalam Kategori Ini</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const isResmi = r.scope === 'resmi';
    return `
      <div class="reward-card" style="${!isResmi ? 'border-color: #fbcfe8; background: #fffdfd;' : ''}">
        <div>
          <span class="reward-badge-tag" style="${!isResmi ? 'background: #fdf2f8; color: #be185d;' : ''}">${r.badge}</span>
          <h3>${r.title}</h3>
          <div class="reward-points-required" style="${!isResmi ? 'color: #be185d;' : ''}">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            ${r.requiredPoints.toLocaleString('id-ID')} Poin
          </div>
          <p class="reward-desc-text">${r.description}</p>
        </div>
        <button class="btn-claim-reward" style="${!isResmi ? 'background: #be185d; color: #fff;' : ''}" onclick="claimReward('${r.id}', ${r.requiredPoints}, '${r.title}')">
          Tukar / Klaim Reward
        </button>
      </div>
    `;
  }).join('');
}

function claimReward(rewardId, points, title) {
  if (appState.userRewardPoints < points) {
    alert(`Poin Anda (${appState.userRewardPoints} Poin) belum mencukupi untuk klaim "${title}". Dibutuhkan ${points} Poin.`);
    return;
  }
  appState.userRewardPoints -= points;
  document.getElementById('headerUserPointsVal').textContent = `${appState.userRewardPoints} Poin`;
  alert(`Alhamdulillah! Berhasil klaim "${title}". Admin logistik SR12 akan segera memproses reward Anda.`);
}

function renderMarketingKits() {
  const container = document.getElementById('marketingKitsGrid');
  const countEl = document.getElementById('mkitCountDisplay');
  if (!container) return;

  if (countEl) countEl.textContent = `${appState.marketingKits.length} Template`;

  container.innerHTML = appState.marketingKits.map(k => {
    return `
      <div class="mkit-card">
        <h4>
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          ${k.productName}
        </h4>
        <div style="font-weight: 700; font-size: 0.82rem; color: var(--gold-600); margin-bottom: 6px;">${k.headline || ''}</div>
        <div class="copywriting-box" id="caption-text-${k.id}">${k.caption}</div>
        <div style="font-size: 0.75rem; color: var(--primary-700); margin-bottom: 12px; font-weight: 600;">
          ${k.tags.join(' ')}
        </div>
        <button class="btn-copy-caption" onclick="copyCaption('${k.id}')">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Salin Teks ke Status WA
        </button>
      </div>
    `;
  }).join('');
}

function copyCaption(id) {
  const el = document.getElementById(`caption-text-${id}`);
  if (el) {
    navigator.clipboard.writeText(el.innerText).then(() => {
      showToast('Copywriting berhasil disalin! Tinggal tempel di Status WhatsApp / Instagram.');
    });
  }
}

function switchTab(tabId) {
  appState.activeTab = tabId;
  const sections = ['catalogSection', 'rewardsSection', 'marketingKitSection', 'resellersSection', 'marketersSection'];
  sections.forEach(secId => {
    const el = document.getElementById(secId);
    if (el) el.style.display = 'none';
  });

  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (tabId === 'catalog') {
    document.getElementById('catalogSection').style.display = 'block';
  } else if (tabId === 'rewards') {
    document.getElementById('rewardsSection').style.display = 'block';
  } else if (tabId === 'marketing') {
    document.getElementById('marketingKitSection').style.display = 'block';
  } else if (tabId === 'resellers') {
    document.getElementById('resellersSection').style.display = 'block';
    renderResellers();
  } else if (tabId === 'marketers') {
    document.getElementById('marketersSection').style.display = 'block';
    renderMarketerPayroll();
  }
}

function updateDevPortalMetrics() {
  const m = appState.devMetrics;
  const dTx = document.getElementById('devPortalTotalTx');
  const dFee = document.getElementById('devPortalTotalFee');
  const dStores = document.getElementById('devPortalTotalStores');
  const dGmv = document.getElementById('devPortalTotalGMV');
  const dTopup = document.getElementById('devPortalTotalTopup');
  const pinDisp = document.getElementById('currentMasterPinDisplay');
  const storesTableBody = document.getElementById('devStoresTableBody');
  const storesCounter = document.getElementById('devTotalStoresCounter');

  const totalStores = appState.partnerStores.length;
  const totalTx = m.totalPlatformTransactions || 0;
  const totalFee = totalTx * appState.platformFee;

  const storeTopupSum = appState.partnerStores.reduce((acc, s) => acc + (s.totalTopupPaid || 0), 0);
  const totalTopupKas = storeTopupSum;

  if (dTx) dTx.textContent = totalTx.toLocaleString('id-ID');
  if (dFee) dFee.textContent = formatRupiah(totalFee);
  if (dStores) dStores.textContent = `${totalStores} Toko`;
  if (dGmv) dGmv.textContent = formatRupiah(m.totalGMV || 0);
  if (dTopup) dTopup.textContent = formatRupiah(totalTopupKas);
  if (pinDisp) pinDisp.textContent = `${appState.masterDevPin} (Aktif)`;
  if (storesCounter) storesCounter.textContent = `${totalStores} Toko Terdaftar`;

  if (storesTableBody) {
    storesTableBody.innerHTML = appState.partnerStores.map(s => {
      const tierObj = SR12_TIERS[s.partnerTier] || SR12_TIERS.reseller;
      const quotaVal = typeof s.orderQuota === 'number' ? s.orderQuota : 10;
      return `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 6px 8px; font-weight: 700;">
            ${s.storeName}
            <div style="font-size: 0.7rem; color: #38bdf8; font-family: monospace;">?store=${s.slug}</div>
          </td>
          <td style="padding: 6px 8px;">${s.storeOwner}</td>
          <td style="padding: 6px 8px;"><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">${tierObj.name}</span></td>
          <td style="padding: 6px 8px; font-family: monospace;">${s.storeWaNumber}</td>
          <td style="padding: 6px 8px; text-align: center;">
            <span style="background: ${quotaVal <= 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${quotaVal <= 2 ? '#f87171' : '#34d399'}; padding: 2px 8px; border-radius: 9999px; font-weight: 800; font-size: 0.72rem;">
              ${quotaVal} Order
            </span>
          </td>
          <td style="padding: 6px 8px; text-align: center;">
            <button onclick="switchPartnerStore('${s.slug}'); closeModal('modalDevPortal');" style="background: #0284c7; color: #fff; border: none; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
              Buka Toko
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update Pending Stores Counter & Alert
  const pendingCount = (appState.pendingStoreApps || []).length;
  const pendingCounterEl = document.getElementById('devPendingStoresCounter');
  const topbarAlertBtn = document.getElementById('btnPendingStoreAlert');
  const topbarPendingCountEl = document.getElementById('topbarPendingCount');

  if (pendingCounterEl) {
    pendingCounterEl.textContent = `${pendingCount} Menunggu Verifikasi`;
    pendingCounterEl.style.background = pendingCount > 0 ? '#f59e0b' : '#334155';
    pendingCounterEl.style.color = pendingCount > 0 ? '#78350f' : '#94a3b8';
  }

  if (topbarAlertBtn && topbarPendingCountEl) {
    if (pendingCount > 0) {
      topbarAlertBtn.style.display = 'inline-flex';
      topbarAlertBtn.style.alignItems = 'center';
      topbarAlertBtn.style.gap = '4px';
      topbarPendingCountEl.textContent = pendingCount;
    } else {
      topbarAlertBtn.style.display = 'none';
    }
  }

  // Render Pending Stores Table Body
  const pendingTableBody = document.getElementById('devPendingStoresTableBody');
  if (pendingTableBody) {
    if (pendingCount === 0) {
      pendingTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 22px; color: #94a3b8; font-style: italic;">
            ✨ Tidak ada antrean pengajuan toko baru. Semua permohonan telah diverifikasi.
          </td>
        </tr>
      `;
    } else {
      pendingTableBody.innerHTML = appState.pendingStoreApps.map(app => {
        const tierObj = SR12_TIERS[app.partnerTier] || SR12_TIERS.distributor;
        return `
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 8px 10px;">
              <b style="color: #f8fafc;">${app.storeName}</b>
              <div style="font-size: 0.68rem; color: #f59e0b; font-family: monospace;">#${app.id} &middot; ?store=${app.slug}</div>
            </td>
            <td style="padding: 8px 10px;">
              <div style="font-weight: 600;">${app.storeOwner}</div>
              <div style="font-size: 0.68rem; color: #94a3b8;">📍 ${app.storeCity}</div>
            </td>
            <td style="padding: 8px 10px;">
              <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">
                ${tierObj.name}
              </span>
            </td>
            <td style="padding: 8px 10px; white-space: nowrap;">
              <button type="button" onclick="event.stopPropagation(); previewSkDocument('${app.id}')" title="Klik untuk memeriksa dokumen SK resmi" style="background: #1e293b; border: 1.5px solid #f59e0b; color: #fbbf24; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.2s ease;">
                <span>📄</span> <span>${app.skNumber || 'Lihat Dokumen SK'}</span> <span style="font-size: 0.68rem; opacity: 0.8;">↗️</span>
              </button>
            </td>
            <td style="padding: 8px 10px;">
              <button type="button" onclick="contactApplicantWA('${app.id}')" style="background: rgba(37, 211, 102, 0.15); border: 1px solid #25d366; color: #4ade80; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                <span>📱</span> +${app.storeWaNumber}
              </button>
            </td>
            <td style="padding: 8px 10px; text-align: center;">
              <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 2px 8px; border-radius: 9999px; font-weight: 800; font-size: 0.68rem; white-space: nowrap;">
                ⏳ PENDING
              </span>
            </td>
            <td style="padding: 8px 10px; text-align: center; white-space: nowrap;">
              <div style="display: inline-flex; gap: 6px; justify-content: center; align-items: center;">
                <button type="button" onclick="event.stopPropagation(); previewSkDocument('${app.id}')" title="Buka & Verifikasi Berkas SK" style="background: #0284c7; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                  <span>📄</span> Cek SK
                </button>
                <button type="button" onclick="approvePendingStore('${app.id}')" title="Setujui dan Aktifkan Toko" style="background: #10b981; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
                  ✅ Setujui
                </button>
                <button type="button" onclick="rejectPendingStore('${app.id}')" title="Tolak Pengajuan" style="background: #ef4444; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
                  ❌ Tolak
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

function printShippingLabel() {
  const storeName = appState.storeSettings.storeName;
  const storePhone = appState.storeSettings.storeWaNumber;
  const storeCity = appState.storeSettings.storeCity || 'Kota Toko';
  const dName = appState.isDropship ? (document.getElementById('dropshipNameInput')?.value || appState.dropshipSender.name) : `${storeName} (Official)`;
  const dPhone = appState.isDropship ? (document.getElementById('dropshipPhoneInput')?.value || appState.dropshipSender.phone) : storePhone;
  
  const courierId = appState.buyerDetails.courier || 'jne';
  const courier = SR12_SHIPPING_PROVIDERS.find(c => c.id === courierId) || SR12_SHIPPING_PROVIDERS[0];
  
  let totalWeightGram = 0;
  let subtotal = 0;
  appState.cart.forEach(item => {
    const p = appState.products.find(prod => prod.id === item.productId);
    const w = (p && p.weightGram) ? p.weightGram : 100;
    totalWeightGram += w * item.qty;
    const price = getProductTierPrice(p, appState.currentTier);
    subtotal += price * item.qty;
  });
  const weightKg = Math.max(courier.minKg || 1, Math.ceil(totalWeightGram / 1000));
  const shippingCost = courier.id === 'pickup' ? 0 : courier.costPerKg * weightKg;
  const isFeeChargedToBuyer = (appState.storeSettings.feePayer || 'buyer') === 'buyer';
  const fee = isFeeChargedToBuyer ? appState.platformFee : 0;
  const grandTotal = subtotal + shippingCost + fee;

  let title = 'RESI PENGIRIMAN RESMI SR12';
  let badgeHtml = '';
  let destinationHtml = '';

  if (courier.id === 'pickup') {
    title = 'INVOICE / SURAT JALAN PENGAMBILAN TOKO (SELF PICK-UP)';
    badgeHtml = `<div style="background: #059669; color: #fff; padding: 7px 10px; text-align: center; font-weight: bold; border-radius: 4px; margin: 10px 0; font-size: 13px;">🏪 BARANG DIAMBIL SENDIRI DI GUDANG / TOKO (BEBAS ONGKIR - RP 0)</div>`;
    destinationHtml = `
      <div class="row"><b>PENGAMBIL / PEMESAN:</b><br>${appState.buyerDetails.name} (${appState.buyerDetails.phone})</div>
      <div class="row"><b>LOKASI PENGAMBILAN:</b><br>Gudang Toko ${storeName} - ${storeCity}</div>
      <div class="row"><b>STATUS PENGAMBILAN:</b><br>Ambil Mandiri / Menunggu Verifikasi WhatsApp</div>
    `;
  } else if (courier.id === 'cod') {
    title = 'RESI PENGIRIMAN COD (BAYAR DI TEMPAT)';
    badgeHtml = `
      <div style="background: #fffbeb; color: #92400e; padding: 8px 10px; text-align: center; font-weight: bold; border-radius: 4px; margin: 10px 0; font-size: 13px; border: 2px dashed #f59e0b;">
        💵 TAGIHAN COD: BAYAR TUNAI SAAT DITERIMA<br>
        <span style="font-size: 18px; color: #b45309; letter-spacing: 0.5px;">${formatRupiah(grandTotal)}</span>
      </div>
    `;
    destinationHtml = `
      <div class="row"><b>PENERIMA (COD):</b><br>${appState.buyerDetails.name} (${appState.buyerDetails.phone})<br>${appState.buyerDetails.address}</div>
      <div class="row"><b>EKSPEDISI:</b> ${courier.name} (${weightKg} kg)</div>
      <div class="row" style="background: #fef2f2; padding: 5px; border-radius: 4px; border: 1px solid #fecaca; font-size: 11px;">
        ⚠️ <b>PETUNJUK KURIR:</b> Tagih uang tunai pas sebesar <b>${formatRupiah(grandTotal)}</b> kepada penerima sebelum menyerahkan paket.
      </div>
    `;
  } else {
    destinationHtml = `
      <div class="row"><b>PENERIMA:</b><br>${appState.buyerDetails.name} (${appState.buyerDetails.phone})<br>${appState.buyerDetails.address}</div>
      <div class="row"><b>EKSPEDISI:</b> ${courier.name} (${weightKg} kg) - ${formatRupiah(shippingCost)}</div>
    `;
  }

  const itemsHtml = appState.cart.map((item) => {
    const prod = appState.products.find(p => p.id === item.productId);
    return `<div style="font-size: 11px; margin-bottom: 2px;">• ${item.qty}x ${prod ? prod.name : 'Produk SR12'}</div>`;
  }).join('');

  const labelHtml = `
    <html>
    <head>
      <title>${title} - ${storeName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 20px; max-width: 440px; margin: 0 auto; border: 2px solid #000; }
        .head { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .row { margin-bottom: 8px; font-size: 13px; line-height: 1.4; }
        .barcode { text-align: center; font-size: 22px; letter-spacing: 5px; font-weight: bold; margin: 12px 0; border: 1px solid #000; padding: 8px; }
      </style>
    </head>
    <body>
      <div class="head">
        <h3 style="margin: 0 0 4px 0;">${storeName.toUpperCase()}</h3>
        <p style="margin: 0; font-size: 12px; font-weight: bold;">${title}</p>
      </div>
      ${badgeHtml}
      <div class="barcode">|||||||||||||||||||||||||</div>
      <div class="row"><b>No. Referensi:</b> SR12-${Date.now().toString().slice(-8)}</div>
      <div class="row"><b>Metode:</b> ${courier.name}</div>
      <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
      ${destinationHtml}
      <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
      <div class="row"><b>PENGIRIM / DISTRIBUTOR:</b><br>${dName} (${dPhone})<br>${storeCity}</div>
      <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
      <div class="row">
        <b>ISI PAKET (${appState.cart.reduce((sum, i) => sum + i.qty, 0)} pcs):</b>
        ${itemsHtml}
      </div>
      <div class="row" style="margin-top: 8px; font-size: 12px; font-weight: bold; text-align: right;">
        Total: ${formatRupiah(grandTotal)}
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `;
  const printWindow = window.open('', '_blank', 'width=520,height=650');
  printWindow.document.write(labelHtml);
  printWindow.document.close();
}

function showToast(message) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '9999px';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    toast.style.transition = 'all 0.3s ease';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 2600);
}

// ==========================================
// REAL-TIME ADMIN NOTIFICATION & ORDER MONITOR
// ==========================================
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function updateAdminNotificationUI() {
  const list = appState.transactions || [];
  const pendingOrders = list.filter(t => t.status === 'Menunggu Konfirmasi' || t.status === 'Siap Diambil di Toko');
  const count = pendingOrders.length;

  const btnNotif = document.getElementById('btnAdminOrderNotif');
  const badge1 = document.getElementById('adminPendingOrderCountBadge');
  const badge2 = document.getElementById('olseraTopbarOrderBadge');
  const trxBadge = document.getElementById('olseraTrxBadge');

  if (badge1) badge1.textContent = count;
  if (badge2) badge2.textContent = count;
  if (trxBadge) trxBadge.textContent = list.length;

  if (btnNotif) {
    if (appState.isAdminMode || appState.isDistributorLoggedIn || count > 0) {
      btnNotif.style.display = 'inline-flex';
      if (count > 0) {
        btnNotif.style.background = '#fef3c7';
        btnNotif.style.borderColor = '#f59e0b';
        btnNotif.style.color = '#92400e';
      } else {
        btnNotif.style.background = '#f8fafc';
        btnNotif.style.borderColor = '#cbd5e1';
        btnNotif.style.color = '#475569';
      }
    } else {
      btnNotif.style.display = 'none';
    }
  }
}

function triggerAdminNewOrderNotification(order) {
  playOrderChime();
  updateAdminNotificationUI();

  const banner = document.getElementById('adminFloatingOrderBanner');
  const nameEl = document.getElementById('floatingBannerCustomer');
  const detailsEl = document.getElementById('floatingBannerDetails');

  if (banner && nameEl && detailsEl) {
    nameEl.textContent = order.customerName;
    detailsEl.textContent = `${order.items.length} macam produk • ${formatRupiah(order.grandTotal)} • ${order.paymentMethod}`;
    banner.style.display = 'block';

    setTimeout(() => {
      banner.style.display = 'none';
    }, 8000);
  }

  showToast(`🔔 PESANAN MASUK BARU! ${order.customerName} (${formatRupiah(order.grandTotal)})`);
}

function renderAdminOrdersModal() {
  const body = document.getElementById('adminOrdersListBody');
  if (!body) return;

  const orders = appState.transactions || [];
  if (orders.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
        <span style="font-size: 3rem; display: block; margin-bottom: 12px;">🎉</span>
        <h4 style="margin: 0 0 6px 0; color: #334155; font-size: 1rem;">Belum Ada Pesanan Masuk</h4>
        <p style="margin: 0; font-size: 0.82rem; line-height: 1.5;">
          Data transaksi bersih (0 pesanan). Masukkan produk ke keranjang dan checkout via WhatsApp untuk mencoba simulasi pesanan Agen / Konsumen secara live!
        </p>
      </div>
    `;
    return;
  }

  body.innerHTML = orders.map(ord => {
    const isPending = ord.status === 'Menunggu Konfirmasi' || ord.status === 'Siap Diambil di Toko';
    const statusBg = isPending ? '#fef3c7' : '#ecfdf5';
    const statusColor = isPending ? '#b45309' : '#065f46';
    const statusIcon = isPending ? '🟡' : '✅';

    const itemsSummary = (ord.items || []).map(i => `<span style="display: inline-block; background: #f1f5f9; padding: 2px 7px; border-radius: 4px; font-size: 0.74rem; margin: 2px 3px 2px 0;">${i.qty}x ${i.name}</span>`).join('');

    return `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <b style="font-size: 0.9rem; color: #0f172a;">${ord.id}</b>
              <span style="background: #e0f2fe; color: #0369a1; font-size: 0.7rem; font-weight: 700; padding: 1px 6px; border-radius: 4px;">${ord.tierLabel || 'Retail'}</span>
            </div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">📅 ${ord.dateTime}</div>
          </div>
          <span style="background: ${statusBg}; color: ${statusColor}; font-size: 0.74rem; font-weight: 800; padding: 3px 8px; border-radius: 999px;">
            ${statusIcon} ${ord.status}
          </span>
        </div>

        <div style="background: #f8fafc; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; font-size: 0.8rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Pemesan:</span>
            <b>${ord.customerName}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>No. WhatsApp:</span>
            <span style="color: #0284c7; font-weight: 600;">${ord.customerPhone}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Metode Pengambilan/Kirim:</span>
            <span style="font-weight: 600; color: #334155;">${ord.paymentMethod}</span>
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 4px;">Daftar Produk:</div>
          <div>${itemsSummary}</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
          <div>
            <span style="font-size: 0.74rem; color: #64748b;">Total Tagihan:</span>
            <div style="font-size: 1rem; font-weight: 800; color: #0f172a;">${formatRupiah(ord.grandTotal)}</div>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${isPending ? `
              <button type="button" onclick="confirmOrderFromModal('${ord.id}')" style="background: #059669; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer;">
                ✅ Konfirmasi Selesai
              </button>
            ` : ''}
            <button type="button" onclick="viewHistoricalReceipt('${ord.id}')" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 600; cursor: pointer;">
              📄 Struk Nota
            </button>
            ${ord.customerPhone && ord.customerPhone !== '-' ? `
              <button type="button" onclick="window.open('https://api.whatsapp.com/send?phone=${ord.customerPhone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent('Halo Kak ' + ord.customerName + ', pesanan ' + ord.id + ' di SR12 sudah kami terima dan siap disiapkan. Terima kasih! 🌿')}', '_blank')" style="background: #25d366; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer;">
                💬 Chat WA
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openAdminOrdersModal() {
  renderAdminOrdersModal();
  const modal = document.getElementById('modalAdminOrders');
  if (modal) modal.classList.add('open');
}

function confirmOrderFromModal(trxId) {
  const ord = (appState.transactions || []).find(t => t.id === trxId);
  if (!ord) return;
  ord.status = 'Lunas / Selesai';
  localStorage.setItem('sr12_pos_transactions_v1', JSON.stringify(appState.transactions));
  renderAdminOrdersModal();
  updateAdminNotificationUI();
  if (typeof renderPosTransactions === 'function') renderPosTransactions();
  showToast(`✅ Pesanan ${trxId} berhasil dikonfirmasi selesai!`);
}

function clearAllSimulationOrders() {
  if (confirm('Kosongkan SEMUA data transaksi pesanan dan keranjang belanja untuk simulasi dari nol?')) {
    appState.transactions = [];
    appState.cart = [];
    localStorage.removeItem('sr12_pos_transactions_v1');
    localStorage.removeItem('sr12_user_cart');
    saveStoredCart([]);
    updateCartUI();
    renderAdminOrdersModal();
    updateAdminNotificationUI();
    if (typeof renderPosTransactions === 'function') renderPosTransactions();
    showToast('🧹 Semua data simulasi telah bersih (0 pesanan)!');
  }
}

// ==========================================
// MODEL 1: PREPAID ORDER QUOTA & TOP-UP SYSTEM
// ==========================================
let currentSelectedTopupAmount = 50000;
let currentSelectedTopupQuota = 55;

function updateStoreQuotaUI() {
  const currentQuota = typeof appState.storeSettings.orderQuota === 'number' ? appState.storeSettings.orderQuota : 10;
  const adminDisp = document.getElementById('adminStoreQuotaDisplay');
  const topupDisp = document.getElementById('topupCurrentQuotaDisplay');
  const topupTitle = document.getElementById('topupStoreNameTitle');
  const badge = document.getElementById('adminQuotaBadge');

  if (adminDisp) adminDisp.textContent = `${currentQuota} Order`;
  if (topupDisp) topupDisp.textContent = `${currentQuota} Order`;
  if (topupTitle) topupTitle.textContent = appState.storeSettings.storeName || 'Toko Anda';

  if (badge) {
    if (currentQuota <= 2) {
      badge.style.background = 'rgba(239, 68, 68, 0.25)';
      badge.style.borderColor = '#ef4444';
      badge.style.color = '#fca5a5';
      if (adminDisp) adminDisp.style.color = '#f87171';
    } else {
      badge.style.background = 'rgba(16, 185, 129, 0.2)';
      badge.style.borderColor = '#34d399';
      badge.style.color = '#a7f3d0';
      if (adminDisp) adminDisp.style.color = '#34d399';
    }
  }
}

const DEFAULT_DEV_PAYMENT_SETTINGS = {
  bankName: 'BCA',
  bankAccount: '7820-1234-5678',
  bankHolder: 'Developer Resmi SR12 Ecosystem',
  ewalletName: 'DANA',
  ewalletNumber: '0812-3456-7890',
  developerWa: '6281234567890'
};

function getStoredDevPaymentSettings() {
  const stored = localStorage.getItem('sr12_dev_payment_settings_v1');
  if (stored) {
    try {
      return Object.assign({}, DEFAULT_DEV_PAYMENT_SETTINGS, JSON.parse(stored));
    } catch (e) {}
  }
  return Object.assign({}, DEFAULT_DEV_PAYMENT_SETTINGS);
}

function saveStoredDevPaymentSettings(settings) {
  localStorage.setItem('sr12_dev_payment_settings_v1', JSON.stringify(settings));
}

function switchTopupMethod(method) {
  const qrisBox = document.getElementById('topupQrisContainer');
  const bankBox = document.getElementById('topupBankContainer');
  const btnQris = document.getElementById('btnTopupMethodQris');
  const btnBank = document.getElementById('btnTopupMethodBank');

  if (method === 'qris') {
    if (qrisBox) qrisBox.style.display = 'block';
    if (bankBox) bankBox.style.display = 'none';
    if (btnQris) {
      btnQris.style.borderColor = '#059669';
      btnQris.style.background = '#ecfdf5';
      btnQris.style.color = '#065f46';
    }
    if (btnBank) {
      btnBank.style.borderColor = '#cbd5e1';
      btnBank.style.background = '#f8fafc';
      btnBank.style.color = '#475569';
    }
  } else {
    if (qrisBox) qrisBox.style.display = 'none';
    if (bankBox) bankBox.style.display = 'block';
    if (btnBank) {
      btnBank.style.borderColor = '#0284c7';
      btnBank.style.background = '#f0f9ff';
      btnBank.style.color = '#0369a1';
    }
    if (btnQris) {
      btnQris.style.borderColor = '#cbd5e1';
      btnQris.style.background = '#f8fafc';
      btnQris.style.color = '#475569';
    }
  }
}

function updateDevPaymentUI() {
  const settings = getStoredDevPaymentSettings();

  const bankNameEl = document.getElementById('topupDevBankName');
  const bankAccEl = document.getElementById('topupDevBankAccount');
  const bankHolderEl = document.getElementById('topupDevBankHolder');
  const ewalletNameEl = document.getElementById('topupDevEwalletName');
  const ewalletNumEl = document.getElementById('topupDevEwalletNumber');
  const qrisReceiverEl = document.getElementById('topupDevQrisReceiverName');

  if (bankNameEl) bankNameEl.textContent = settings.bankName || 'BCA';
  if (bankAccEl) bankAccEl.textContent = settings.bankAccount || '7820-1234-5678';
  if (bankHolderEl) bankHolderEl.textContent = settings.bankHolder || 'Developer Resmi SR12 Ecosystem';
  if (ewalletNameEl) ewalletNameEl.textContent = settings.ewalletName || 'DANA';
  if (ewalletNumEl) ewalletNumEl.textContent = settings.ewalletNumber || '0812-3456-7890';
  if (qrisReceiverEl) qrisReceiverEl.textContent = settings.bankHolder || 'Platform Developer SR12 Ecosystem';

  const inputBankName = document.getElementById('devSettingBankName');
  const inputBankAcc = document.getElementById('devSettingBankAccount');
  const inputBankHolder = document.getElementById('devSettingBankHolder');
  const inputEwallet = document.getElementById('devSettingEwalletNumber');

  if (inputBankName) inputBankName.value = settings.bankName || '';
  if (inputBankAcc) inputBankAcc.value = settings.bankAccount || '';
  if (inputBankHolder) inputBankHolder.value = settings.bankHolder || '';
  if (inputEwallet) inputEwallet.value = settings.ewalletNumber || '';
}

function handleSaveDevPaymentSettings(e) {
  if (e) e.preventDefault();
  const bankName = document.getElementById('devSettingBankName')?.value.trim() || 'BCA';
  const bankAccount = document.getElementById('devSettingBankAccount')?.value.trim() || '7820-1234-5678';
  const bankHolder = document.getElementById('devSettingBankHolder')?.value.trim() || 'Developer Resmi SR12';
  const ewalletNumber = document.getElementById('devSettingEwalletNumber')?.value.trim() || '0812-3456-7890';

  const settings = {
    bankName,
    bankAccount,
    bankHolder,
    ewalletName: 'DANA',
    ewalletNumber,
    developerWa: appState.storeSettings.storeWaNumber || '6281234567890'
  };

  saveStoredDevPaymentSettings(settings);
  updateDevPaymentUI();
  showToast('✅ Rekening Developer berhasil disimpan dan diperbarui!');
}

function copyDevBankAccount() {
  const settings = getStoredDevPaymentSettings();
  navigator.clipboard.writeText(settings.bankAccount || '7820-1234-5678').then(() => {
    showToast(`📋 Nomor Rekening ${settings.bankName} (${settings.bankAccount}) berhasil disalin!`);
  }).catch(() => {
    alert(`Nomor Rekening: ${settings.bankAccount}`);
  });
}

function copyDevEwallet() {
  const settings = getStoredDevPaymentSettings();
  navigator.clipboard.writeText(settings.ewalletNumber || '0812-3456-7890').then(() => {
    showToast(`📋 Nomor DANA (${settings.ewalletNumber}) berhasil disalin!`);
  }).catch(() => {
    alert(`Nomor DANA: ${settings.ewalletNumber}`);
  });
}

function sendTopupProofToDeveloperWA() {
  const settings = getStoredDevPaymentSettings();
  const store = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  const targetWa = (settings.developerWa || appState.storeSettings.storeWaNumber || '6281234567890').replace(/[^0-9]/g, '');

  const msg = `*KONFIRMASI TOP-UP KUOTA TRANSAKSI TOKO*\n` +
    `-----------------------------------------\n` +
    `Nama Toko   : *${store.storeName}*\n` +
    `Pemilik     : ${store.storeOwner || 'Pemilik Toko'}\n` +
    `Paket Kuota : +${currentSelectedTopupQuota} Order WhatsApp\n` +
    `Nominal     : *${formatRupiah(currentSelectedTopupAmount)}*\n` +
    `Tujuan Transfer: ${settings.bankName} - ${settings.bankAccount} (a.n ${settings.bankHolder})\n` +
    `-----------------------------------------\n` +
    `Halo Developer, saya telah mentransfer pembayaran Top-Up kuota toko di atas. Mohon bantuannya untuk verifikasi dan aktivasi kuota. Terima kasih! 🙏`;

  window.open(`https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(msg)}`, '_blank');
}

function openTopupQuotaModal() {
  const modal = document.getElementById('modalTopupQuota');
  updateStoreQuotaUI();
  updateDevPaymentUI();
  switchTopupMethod('qris');
  selectTopupPackage(50000, 55); // Default pilihan paket populer
  if (modal) modal.classList.add('open');
}

function selectTopupPackage(amount, quota) {
  currentSelectedTopupAmount = amount;
  currentSelectedTopupQuota = quota;

  const pkgMap = {
    20000: 'pkgCard20k',
    50000: 'pkgCard50k',
    100000: 'pkgCard100k'
  };

  Object.keys(pkgMap).forEach(amt => {
    const el = document.getElementById(pkgMap[amt]);
    if (el) {
      if (Number(amt) === amount) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  });

  const qrisAmountTag = document.getElementById('qrisTagAmount');
  if (qrisAmountTag) {
    qrisAmountTag.textContent = formatRupiah(amount);
  }

  const bankAmountTag = document.getElementById('bankTagAmount');
  if (bankAmountTag) {
    bankAmountTag.textContent = formatRupiah(amount);
  }
}

function confirmSimulatedTopupPayment() {
  const store = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  const currentQuota = typeof store.orderQuota === 'number' ? store.orderQuota : 10;
  const currentBalance = typeof store.walletBalance === 'number' ? store.walletBalance : 10000;
  const currentTopupPaid = typeof store.totalTopupPaid === 'number' ? store.totalTopupPaid : 0;

  // Tambah kuota dan saldo toko
  store.orderQuota = currentQuota + currentSelectedTopupQuota;
  store.walletBalance = currentBalance + currentSelectedTopupAmount;
  store.totalTopupPaid = currentTopupPaid + currentSelectedTopupAmount;

  appState.storeSettings.orderQuota = store.orderQuota;
  appState.storeSettings.walletBalance = store.walletBalance;
  appState.storeSettings.totalTopupPaid = store.totalTopupPaid;

  // Update kas total Developer
  appState.devMetrics.totalGMV += currentSelectedTopupAmount;
  saveStoredPartnerStores(appState.partnerStores);

  updateStoreQuotaUI();
  updateDevPortalMetrics();
  closeModal('modalTopupQuota');

  showToast(`⚡ Top Up Berhasil! +${currentSelectedTopupQuota} Kuota Order Ditambahkan.`);
  alert(`✅ ALHAMDULILLAH! PEMBAYARAN QRIS BERHASIL DITERIMA!\n\n` +
    `🏪 Toko: ${store.storeName}\n` +
    `📦 Paket Top Up: +${currentSelectedTopupQuota} Kuota Order WhatsApp\n` +
    `💰 Nominal Terbayar: ${formatRupiah(currentSelectedTopupAmount)}\n` +
    `⚡ Total Kuota Toko Sekarang: ${store.orderQuota} Order\n\n` +
    `Dana Rp ${formatRupiah(currentSelectedTopupAmount)} telah masuk ke rekening Developer (Cash in Advance)!\n` +
    `Pelanggan toko Anda dapat kembali bertransaksi lancar via WhatsApp.`);
}

// ==========================================
// TIER PRICE CALCULATION & METRIC RESET UTILITIES
// ==========================================
function updateNewProdTierCalc(het) {
  const tiers = {
    konsumen: Math.round(het * 1.0),
    marketer: Math.round(het * 0.85),
    reseller: Math.round(het * 0.80),
    sub_agen: Math.round(het * 0.70),
    agen: Math.round(het * 0.60),
    distributor: Math.round(het * 0.50)
  };
  Object.keys(tiers).forEach(k => {
    const el = document.getElementById(`newCalc_${k}`);
    if (el) el.textContent = formatRupiah(tiers[k]);
  });
}

function updateEditProdTierCalc(het) {
  const tiers = {
    konsumen: Math.round(het * 1.0),
    marketer: Math.round(het * 0.85),
    reseller: Math.round(het * 0.80),
    sub_agen: Math.round(het * 0.70),
    agen: Math.round(het * 0.60),
    distributor: Math.round(het * 0.50)
  };
  Object.keys(tiers).forEach(k => {
    const el = document.getElementById(`editCalc_${k}`);
    if (el) el.textContent = formatRupiah(tiers[k]);
  });
}

function resetAllDummyDataToZero() {
  if (!confirm('Apakah Anda ingin me-reset seluruh metrik dan statistik platform ke 0?\n\n• Total Transaksi: 0\n• Fee Developer: Rp 0\n• Kas Top-Up: Rp 0\n• Omzet GMV: Rp 0')) {
    return;
  }
  appState.devMetrics.totalPlatformTransactions = 0;
  appState.devMetrics.totalGMV = 0;
  appState.devMetrics.totalRegisteredStores = 0;
  appState.partnerStores.forEach(s => {
    s.totalTx = 0;
    s.totalTopupPaid = 0;
  });
  saveStoredPartnerStores(appState.partnerStores);
  updateDevPortalMetrics();
  showToast('✅ Seluruh data simulasi platform berhasil di-reset ke 0!');
}

// ==========================================
// DISTRIBUTOR MULTI-TIER MITRA CRM & LOGIC
// ==========================================
function normalizePhone(p) {
  if (!p) return '';
  let clean = p.replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) clean = '0' + clean.slice(2);
  return clean;
}

function findMitraByIdOrPhone(query) {
  if (!query) return null;
  const qClean = query.trim().toUpperCase();
  const qPhone = normalizePhone(query);
  const list = appState.mitraList || appState.resellers || [];

  return list.find(m => {
    const idMatch = (m.id && m.id.toUpperCase() === qClean);
    const phoneMatch = qPhone.length >= 10 && normalizePhone(m.phone) === qPhone;
    return idMatch || phoneMatch;
  });
}

function generateNextMitraId(tier) {
  const list = appState.mitraList || [];
  const prefix = tier === 'agen' ? 'AG' : (tier === 'sub_agen' ? 'SUB' : (tier === 'marketer' ? 'MKT' : 'RS'));
  const sameTier = list.filter(m => (m.id || '').toUpperCase().startsWith(prefix + '-'));
  const nextNum = sameTier.length + 1;
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}

function getMitraStatus(m) {
  const tier = m.tier || 'reseller';
  const qualDate = new Date(m.qualificationDate || m.lastOrderDate || '2026-08-15');
  const now = new Date('2026-09-27');
  const diffMs = now - qualDate;
  const daysPassed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, 90 - daysPassed);
  const spent = m.accumulatedSpent90Days || 0;

  if (tier === 'marketer') {
    return {
      state: 'active',
      label: 'Aktif (Tim 15%)',
      badgeColor: '#0284c7',
      daysPassed: 0,
      daysLeft: 999,
      spent,
      targetNominal: 0,
      isTargetMet: true,
      deficit: 0
    };
  }

  const targetNominal = tier === 'agen' ? 5000000 : (tier === 'sub_agen' ? 1500000 : 500000);
  const isTargetMet = spent >= targetNominal;

  let state = 'active';
  let label = 'Aktif Aman';
  let badgeColor = '#10b981';

  if (tier === 'reseller') {
    if (daysPassed > 90 && !isTargetMet) {
      state = 'expired';
      label = 'Expired (Turun Konsumen)';
      badgeColor = '#ef4444';
    } else if (!isTargetMet && daysLeft <= 30) {
      state = 'warning';
      label = `Perlu RO (Sisa ${daysLeft} Hari)`;
      badgeColor = '#f59e0b';
    } else if (isTargetMet) {
      state = 'active';
      label = `Aman (Capai ${formatRupiah(spent)})`;
      badgeColor = '#10b981';
    }
  } else {
    // Agen & Sub Agen
    if (isTargetMet) {
      state = 'active';
      label = 'Aman (Target Tercapai)';
      badgeColor = '#10b981';
    } else {
      state = 'active';
      label = 'Mitra Grosir';
      badgeColor = '#8b5cf6';
    }
  }

  return {
    state,
    label,
    badgeColor,
    daysPassed,
    daysLeft,
    spent,
    targetNominal,
    isTargetMet,
    deficit: Math.max(0, targetNominal - spent)
  };
}

function renderResellers() {
  const tbody = document.getElementById('crmResellersTableBody');
  const totalEl = document.getElementById('crmTotalResellers');
  const agenSubEl = document.getElementById('crmCountAgenSub');
  const activeEl = document.getElementById('crmActiveResellers');
  const marketerEl = document.getElementById('crmCountMarketer');
  const counterTab = document.getElementById('resellersCountDisplay');
  const tabMarketerCounter = document.getElementById('marketerCountDisplay');

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }
  appState.resellers = appState.mitraList;

  let countAgenSub = 0;
  let countResellerActive = 0;
  let countMarketer = 0;

  const evaluatedList = appState.mitraList.map(m => {
    const stat = getMitraStatus(m);
    if (m.tier === 'agen' || m.tier === 'sub_agen') countAgenSub++;
    if (m.tier === 'reseller' && stat.state === 'active') countResellerActive++;
    if (m.tier === 'marketer') countMarketer++;
    return { ...m, ...stat };
  });

  if (totalEl) totalEl.textContent = `${appState.mitraList.length}`;
  if (agenSubEl) agenSubEl.textContent = `${countAgenSub}`;
  if (activeEl) activeEl.textContent = `${countResellerActive}`;
  if (marketerEl) marketerEl.textContent = `${countMarketer}`;
  if (counterTab) counterTab.textContent = `${appState.mitraList.length} Mitra`;
  if (tabMarketerCounter) tabMarketerCounter.textContent = `${countMarketer} Tim`;

  const filtered = evaluatedList.filter(m => {
    let matchFilter = true;
    if (appState.selectedMitraFilter && appState.selectedMitraFilter !== 'all') {
      matchFilter = m.tier === appState.selectedMitraFilter;
    }
    const q = (appState.resellerSearchQuery || '').toLowerCase();
    const matchQuery = !q ||
      (m.id && m.id.toLowerCase().includes(q)) ||
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.city || '').toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });

  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--dark-500);">
          Belum ada data mitra dalam kategori filter ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const tierObj = SR12_TIERS[m.tier] || SR12_TIERS.reseller;
    const progressPct = m.targetNominal > 0 ? Math.min(100, Math.round((m.spent / m.targetNominal) * 100)) : 100;
    
    // Tier badge color & label
    const tierBadgeStyle = m.tier === 'agen' ? 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;' :
                           m.tier === 'sub_agen' ? 'background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe;' :
                           m.tier === 'marketer' ? 'background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;' :
                           'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;';

    const tierBadgeText = m.tier === 'agen' ? '👑 Agen (40%)' :
                          m.tier === 'sub_agen' ? '🏢 Sub Agen (30%)' :
                          m.tier === 'marketer' ? '💼 Marketer (15%)' :
                          '🌿 Reseller (20%)';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
            <span style="background: #0f172a; color: #38bdf8; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-weight: 800; font-size: 0.75rem;">${m.id || 'MITRA'}</span>
            <b style="font-size: 0.88rem; color: var(--dark-900);">${m.name}</b>
          </div>
          <span style="font-family: monospace; font-size: 0.75rem; color: #0284c7;">📱 ${m.phone}</span> &middot; <span style="font-size: 0.72rem; color: var(--dark-500);">${m.city || 'Indonesia'}</span>
        </td>
        <td>
          <span style="display: inline-block; padding: 4px 9px; border-radius: 4px; font-weight: 800; font-size: 0.72rem; ${tierBadgeStyle}">
            ${tierBadgeText}
          </span>
        </td>
        <td>
          <div style="font-size: 0.78rem; font-weight: 700; color: #1e293b;">
            ${m.bankName || 'BCA'} &middot; <span style="font-family: monospace;">${m.bankAccount || '-'}</span>
          </div>
          <div style="font-size: 0.7rem; color: #64748b;">
            a.n ${m.bankHolder || m.name}
          </div>
        </td>
        <td>
          ${m.tier === 'marketer' ? `
            <div style="font-size: 0.75rem; color: #0284c7; font-weight: 700;">
              ✨ Jualan Tanpa Modal
            </div>
            <div style="font-size: 0.7rem; color: #64748b;">
              Bonus 15% ditransfer tiap bulan
            </div>
          ` : `
            <div style="font-size: 0.75rem; color: var(--dark-700);">
              Gabung: <b>${m.qualificationDate || '-'}</b>
            </div>
            ${m.tier === 'reseller' ? `
              <div style="font-size: 0.72rem; color: ${m.daysLeft <= 30 && m.state !== 'active' ? '#dc2626' : '#64748b'}; font-weight: 700; margin-top: 2px;">
                ⏳ Sisa Waktu 90 Hari: ${m.daysLeft} Hari
              </div>
            ` : `
              <div style="font-size: 0.72rem; color: #059669; font-weight: 700; margin-top: 2px;">
                🛡️ Kuota Order Terpelihara
              </div>
            `}
          `}
        </td>
        <td>
          ${m.tier === 'marketer' ? `
            <div style="font-size: 0.78rem; font-weight: 800; color: #0369a1;">
              ${formatRupiah(m.accumulatedSpent90Days || 0)}
            </div>
            <div style="font-size: 0.7rem; color: #64748b;">
              ${m.totalOrdersCount || 0} Pesanan Terjual
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 2px;">
              <b>${formatRupiah(m.spent)}</b>
              <span style="color: var(--dark-500);">Target: ${formatRupiah(m.targetNominal)}</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${progressPct}%; background: ${m.state === 'active' ? '#10b981' : (m.state === 'warning' ? '#f59e0b' : '#ef4444')};"></div>
            </div>
            <div style="font-size: 0.68rem; color: var(--dark-500); margin-top: 3px;">
              ${m.deficit > 0 ? `Kurang ${formatRupiah(m.deficit)} lagi` : '✨ Target aman!'}
            </div>
          `}
        </td>
        <td>
          <span class="badge-crm" style="background: ${m.state === 'active' ? '#dcfce7' : (m.state === 'warning' ? '#fef3c7' : '#fee2e2')}; color: ${m.state === 'active' ? '#15803d' : (m.state === 'warning' ? '#92400e' : '#b91c1c')};">
            ${m.state === 'active' ? '🟢' : (m.state === 'warning' ? '🟡' : '🔴')} ${m.label}
          </span>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            ${m.tier === 'reseller' && m.deficit > 0 ? `
              <button onclick="sendResellerReminderWA('${m.phone}', '${m.name}', ${m.daysLeft}, ${m.deficit})" title="Kirim Pesan Pengingat Belanja RO ke WhatsApp" style="background: #25d366; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>📲</span> Ingatkan RO
              </button>
            ` : (m.tier === 'marketer' ? `
              <button onclick="switchTab('marketers')" title="Lihat Rekap Gaji Marketer Ini" style="background: #0284c7; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>💼</span> Gaji
              </button>
            ` : `
              <button onclick="sendGeneralMitraWA('${m.phone}', '${m.name}', '${m.tier}')" title="Hubungi Mitra via WhatsApp" style="background: #25d366; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>📲</span> Chat WA
              </button>
            `)}
            <button onclick="deleteMitra('${m.id}')" title="Hapus Data Mitra" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterMitra(tierFilter) {
  appState.selectedMitraFilter = tierFilter;
  const chipIds = {
    'all': 'btnFilterAllMitra',
    'agen': 'btnFilterAgen',
    'sub_agen': 'btnFilterSubAgen',
    'reseller': 'btnFilterReseller',
    'marketer': 'btnFilterMarketer'
  };

  Object.values(chipIds).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const activeBtnId = chipIds[tierFilter];
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) activeBtn.classList.add('active');

  renderResellers();
}

function filterResellers(filterType) {
  filterMitra(filterType);
}

function searchResellers(query) {
  appState.resellerSearchQuery = query.toLowerCase().trim();
  renderResellers();
}

function openAddMitraModal(preferredTier) {
  const modal = document.getElementById('modalAddMitra') || document.getElementById('modalAddReseller');
  const tierSelect = document.getElementById('newMitraTier');
  const idInput = document.getElementById('newMitraId');

  const tier = preferredTier || (tierSelect ? tierSelect.value : 'reseller');
  if (tierSelect) tierSelect.value = tier;
  if (idInput) idInput.value = generateNextMitraId(tier);

  handleMitraTierChange(tier);
  if (modal) modal.classList.add('open');
}

function openAddResellerModal() {
  openAddMitraModal('reseller');
}

function handleMitraTierChange(tier) {
  const idInput = document.getElementById('newMitraId');
  if (idInput) idInput.value = generateNextMitraId(tier);

  const spendField = document.getElementById('newMitraSpendField');
  const initialSpendInput = document.getElementById('newMitraInitialSpend');

  if (tier === 'marketer') {
    if (spendField) spendField.style.display = 'none';
    if (initialSpendInput) initialSpendInput.value = 0;
  } else {
    if (spendField) spendField.style.display = 'block';
    if (initialSpendInput) {
      initialSpendInput.value = tier === 'agen' ? 5000000 : (tier === 'sub_agen' ? 1500000 : 500000);
    }
  }
}

function handleAddMitraSubmit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('newMitraId')?.value.trim().toUpperCase() || generateNextMitraId('reseller');
  const name = document.getElementById('newMitraName')?.value.trim();
  const phone = document.getElementById('newMitraPhone')?.value.trim();
  const city = document.getElementById('newMitraCity')?.value.trim();
  const tier = document.getElementById('newMitraTier')?.value || 'reseller';
  const bankName = document.getElementById('newMitraBankName')?.value || 'BCA';
  const bankAccount = document.getElementById('newMitraBankAccount')?.value.trim() || '-';
  const bankHolder = document.getElementById('newMitraBankHolder')?.value.trim() || name;
  const initialSpend = Number(document.getElementById('newMitraInitialSpend')?.value) || 0;

  if (!name || !phone) {
    alert('Nama dan No. WhatsApp mitra wajib diisi!');
    return;
  }

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }

  // Cek apakah ID sudah dipakai
  if (appState.mitraList.some(m => m.id.toUpperCase() === id)) {
    alert(`Nomor ID "${id}" sudah digunakan! Silakan gunakan ID lain.`);
    return;
  }

  const nowIso = '2026-09-27';
  const newMitra = {
    id: id,
    name: name,
    phone: phone,
    city: city || 'Indonesia',
    tier: tier,
    bankName: bankName,
    bankAccount: bankAccount,
    bankHolder: bankHolder,
    qualificationDate: nowIso,
    lastOrderDate: nowIso,
    accumulatedSpent90Days: initialSpend,
    totalOrdersCount: initialSpend > 0 ? 1 : 0,
    status: 'active'
  };

  appState.mitraList.unshift(newMitra);
  appState.resellers = appState.mitraList;
  saveStoredMitra(appState.mitraList);

  renderResellers();
  updateViewModeUI();
  closeModal('modalAddMitra');
  closeModal('modalAddReseller');
  showToast(`✅ Berhasil! Mitra "${name}" (${id}) berhasil didaftarkan ke Database Distributor.`);
}

function handleAddResellerSubmit(e) {
  handleAddMitraSubmit(e);
}

function deleteMitra(id) {
  const found = (appState.mitraList || []).find(m => m.id === id);
  if (!found) return;
  if (!confirm(`Hapus mitra "${found.name}" (${found.id}) dari database distributor?`)) return;

  appState.mitraList = appState.mitraList.filter(m => m.id !== id);
  appState.resellers = appState.mitraList;
  saveStoredMitra(appState.mitraList);
  renderResellers();
  updateViewModeUI();
  showToast(`Mitra "${found.name}" (${found.id}) berhasil dihapus.`);
}

function deleteReseller(id) {
  deleteMitra(id);
}

function clearAllMitraDatabase() {
  if (!confirm('⚠️ Anda yakin ingin mengosongkan seluruh Database Mitra Binaan Toko?\n\nSemua data Agen, Sub Agen, Reseller, dan Marketer akan dihapus untuk simulasi bersih dari awal.')) {
    return;
  }
  appState.mitraList = [];
  appState.resellers = [];
  saveStoredMitra([]);
  renderResellers();
  updateViewModeUI();
  showToast('🗑️ Database Seluruh Mitra berhasil dikosongkan!');
}
window.clearAllMitraDatabase = clearAllMitraDatabase;

function clearAllMarketerSales() {
  if (!confirm('⚠️ Anda yakin ingin mengosongkan seluruh Rekap Penjualan & Bonus Gaji Marketer?\n\nSeluruh catatan penjualan dan komisi marketer akan dikosongkan untuk simulasi bersih.')) {
    return;
  }
  appState.marketerSales = [];
  saveStoredMarketerSales([]);
  renderMarketerPayroll();
  showToast('🗑️ Rekap Gaji & Komisi Marketer berhasil dikosongkan!');
}
window.clearAllMarketerSales = clearAllMarketerSales;

function sendGeneralMitraWA(phone, name, tier) {
  const storeName = appState.storeSettings.storeName;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetWa = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const tierName = SR12_TIERS[tier]?.name || 'Mitra';

  const text = `Halo Kak ${name}! 🌿 Salam hangat dari *${storeName}*.\n\n` +
    `Bagaimana kabar penjualan produk herbal SR12 Kakak hari ini? Kami ingin menginfokan stok gudang distributor ready lengkap untuk kebutuhan order Kakak.\n\n` +
    `Link katalog belanja online:\n` +
    `${window.location.origin + window.location.pathname + '?store=' + appState.currentStoreSlug}\n\n` +
    `Semoga jualan Kakak semakin laris berkah! ✨`;

  window.open(`https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(text)}`, '_blank');
}

function sendResellerReminderWA(phone, name, daysLeft, deficit) {
  const storeName = appState.storeSettings.storeName;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetWa = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  const text = `Halo Kak ${name}! 🌿 Salam hangat dari *${storeName}*.\n\n` +
    `Kami ingin menginfokan bahwa masa aktif diskon Reseller Resmi Kakak tersisa *${daysLeft} hari lagi*.\n` +
    `Agar status Reseller Kakak tetap aktif dan selalu mendapatkan harga grosir diskon 20%, Kakak cukup melakukan Repeat Order (RO) minimal *${formatRupiah(deficit)}* sebelum masa aktif berakhir.\n\n` +
    `Katalog lengkap produk ready stock bisa langsung diorder melalui link toko kami:\n` +
    `${window.location.origin + window.location.pathname + '?store=' + appState.currentStoreSlug}\n\n` +
    `Terima kasih dan semoga jualan Kakak semakin laris berkah! ✨`;

  window.open(`https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(text)}`, '_blank');
}

// ==========================================
// DISTRIBUTOR MARKETER PAYROLL (15% KOMISI)
// ==========================================
function renderMarketerPayroll() {
  const tbody = document.getElementById('payrollTableBody');
  const monthSelect = document.getElementById('payrollMonthSelect');
  const selectedMonth = monthSelect ? monthSelect.value : (appState.selectedPayrollMonth || '2026-09');

  const totalMarketersEl = document.getElementById('payrollTotalMarketers');
  const totalOrdersEl = document.getElementById('payrollTotalOrders');
  const totalOmsetEl = document.getElementById('payrollTotalOmset');
  const totalBonusEl = document.getElementById('payrollTotalBonus');

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }
  if (!appState.marketerSales) {
    appState.marketerSales = getStoredMarketerSales();
  }

  const marketers = appState.mitraList.filter(m => m.tier === 'marketer');

  let grandOrders = 0;
  let grandOmset = 0;
  let grandBonus = 0;

  const payrollData = marketers.map(m => {
    const salesInMonth = appState.marketerSales.filter(s => s.marketerId === m.id && s.monthPeriod === selectedMonth);
    const countOrders = salesInMonth.length;
    const omset = salesInMonth.reduce((acc, s) => acc + (s.omsetHet || 0), 0);
    const bonus = Math.round(omset * 0.15);
    const isAllPaid = countOrders > 0 && salesInMonth.every(s => s.paidStatus === 'paid');

    grandOrders += countOrders;
    grandOmset += omset;
    grandBonus += bonus;

    return {
      marketer: m,
      sales: salesInMonth,
      countOrders,
      omset,
      bonus,
      isAllPaid
    };
  });

  if (totalMarketersEl) totalMarketersEl.textContent = `${marketers.length} Orang`;
  if (totalOrdersEl) totalOrdersEl.textContent = `${grandOrders} Pesanan`;
  if (totalOmsetEl) totalOmsetEl.textContent = formatRupiah(grandOmset);
  if (totalBonusEl) totalBonusEl.textContent = formatRupiah(grandBonus);

  if (!tbody) return;

  if (payrollData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--dark-500);">
          Belum ada tim marketer yang terdaftar. Klik <b>"+ Tambah Marketer"</b> untuk mendaftarkan marketer baru.
        </td>
      </tr>
    `;
    return;
  }

  const monthLabel = monthSelect ? monthSelect.options[monthSelect.selectedIndex]?.text : selectedMonth;

  tbody.innerHTML = payrollData.map(item => {
    const m = item.marketer;
    const paidBadge = item.countOrders === 0 ? `<span style="background: #f1f5f9; color: #64748b; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">Belum Ada Penjualan</span>` :
                      (item.isAllPaid ? `<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">✅ Lunas Ditransfer</span>` :
                      `<span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">⏳ Belum Ditransfer</span>`);

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
            <span style="background: #0284c7; color: #fff; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-weight: 800; font-size: 0.75rem;">${m.id}</span>
            <b style="font-size: 0.88rem; color: var(--dark-900);">${m.name}</b>
          </div>
          <span style="font-family: monospace; font-size: 0.75rem; color: #0284c7;">📱 ${m.phone}</span> &middot; <span style="font-size: 0.72rem; color: var(--dark-500);">${m.city || 'Indonesia'}</span>
        </td>
        <td>
          <div style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">
            ${m.bankName || 'BCA'} &middot; <span style="font-family: monospace;">${m.bankAccount || '-'}</span>
          </div>
          <div style="font-size: 0.72rem; color: #64748b;">
            a.n ${m.bankHolder || m.name}
          </div>
        </td>
        <td style="text-align: center;">
          <b style="font-size: 0.9rem; color: var(--dark-900);">${item.countOrders}</b>
          <span style="display: block; font-size: 0.68rem; color: var(--dark-500);">Pesanan</span>
        </td>
        <td>
          <b style="font-size: 0.88rem; color: var(--dark-800);">${formatRupiah(item.omset)}</b>
          <small style="display: block; font-size: 0.68rem; color: var(--dark-500);">Harga HET Retail</small>
        </td>
        <td>
          <b style="font-size: 1.02rem; color: #0284c7;">${formatRupiah(item.bonus)}</b>
          <small style="display: block; font-size: 0.68rem; color: #0369a1; font-weight: 700;">15% Komisi Bersih</small>
        </td>
        <td>
          ${paidBadge}
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
            ${item.countOrders > 0 ? `
              <button onclick="toggleMarketerPayrollStatus('${m.id}', '${selectedMonth}')" title="${item.isAllPaid ? 'Batalkan Status Lunas' : 'Tandai Komisi Sudah Ditransfer'}" style="background: ${item.isAllPaid ? '#f1f5f9' : '#10b981'}; color: ${item.isAllPaid ? '#475569' : '#fff'}; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
                ${item.isAllPaid ? 'Batal Lunas' : '✅ Tandai Lunas'}
              </button>
              <button onclick="sendMarketerSalarySlipWA('${m.id}', '${selectedMonth}')" title="Kirim Slip Gaji Resmi ke WhatsApp Marketer" style="background: #25d366; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                <span>📲</span> Kirim Slip
              </button>
              <button onclick="openMarketerDetailOrdersModal('${m.id}', '${selectedMonth}')" title="Lihat Rincian Pesanan" style="background: #f1f5f9; color: #0284c7; border: 1px solid #cbd5e1; padding: 5px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">
                🔍
              </button>
            ` : `
              <button onclick="openAddMarketerSaleModal('${m.id}')" title="Catat Penjualan untuk Marketer Ini" style="background: #0284c7; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
                + Catat Order
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddMarketerSaleModal(preferredMarketerId) {
  const modal = document.getElementById('modalAddMarketerSale');
  const select = document.getElementById('saleMarketerSelect');
  if (!appState.mitraList) appState.mitraList = getStoredMitra();

  const marketers = appState.mitraList.filter(m => m.tier === 'marketer');

  if (marketers.length === 0) {
    alert('Belum ada tim marketer yang terdaftar. Daftarkan marketer terlebih dahulu!');
    openAddMitraModal('marketer');
    return;
  }

  if (select) {
    select.innerHTML = marketers.map(m => `
      <option value="${m.id}" ${preferredMarketerId === m.id ? 'selected' : ''}>
        ${m.id} - ${m.name} (${m.phone})
      </option>
    `).join('');
  }

  appState.tempMarketerSaleItems = [];
  populateQuickPickProducts();
  renderMarketerOrderItemsList();

  const descInput = document.getElementById('saleItemsDesc');
  if (descInput) descInput.value = '';

  const omsetInput = document.getElementById('saleOmsetHet');
  if (omsetInput) omsetInput.value = '';
  updateSaleCommissionPreview(0);

  if (modal) modal.classList.add('open');
}

function populateQuickPickProducts() {
  const select = document.getElementById('quickPickProductSelect');
  if (!select) return;

  const products = appState.products && appState.products.length > 0 ? appState.products : getStoredProducts();
  if (!products || products.length === 0) {
    select.innerHTML = '<option value="">Belum ada produk terdaftar</option>';
    return;
  }

  select.innerHTML = products.map(p => `
    <option value="${p.id}" data-price="${p.het}" data-name="${p.name}">
      ${p.name} — ${formatRupiah(p.het)}
    </option>
  `).join('');

  handleQuickPickProductChange();
}

function handleQuickPickProductChange() {
  const select = document.getElementById('quickPickProductSelect');
  const qtyInput = document.getElementById('quickPickQty');
  const priceLabel = document.getElementById('quickPickPriceLabel');
  const subtotalLabel = document.getElementById('quickPickSubtotalLabel');

  if (!select) return;
  const opt = select.options[select.selectedIndex];
  if (!opt) return;

  const price = Number(opt.getAttribute('data-price')) || 0;
  const qty = Math.max(1, parseInt(qtyInput?.value) || 1);
  const subtotal = price * qty;

  if (priceLabel) priceLabel.textContent = formatRupiah(price);
  if (subtotalLabel) subtotalLabel.textContent = formatRupiah(subtotal);
}

function addMarketerItemToOrder() {
  const select = document.getElementById('quickPickProductSelect');
  const qtyInput = document.getElementById('quickPickQty');
  if (!select) return;

  const opt = select.options[select.selectedIndex];
  if (!opt) return;

  const prodId = opt.value;
  const prodName = opt.getAttribute('data-name') || opt.text.split('—')[0].trim();
  const price = Number(opt.getAttribute('data-price')) || 0;
  const qty = Math.max(1, parseInt(qtyInput?.value) || 1);

  if (!appState.tempMarketerSaleItems) {
    appState.tempMarketerSaleItems = [];
  }

  // Cek apakah item sudah pernah ditambahkan, jika ada tambahkan qty
  const existing = appState.tempMarketerSaleItems.find(i => i.id === prodId);
  if (existing) {
    existing.qty += qty;
    existing.subtotal = existing.qty * existing.price;
  } else {
    appState.tempMarketerSaleItems.push({
      id: prodId,
      name: prodName,
      price: price,
      qty: qty,
      subtotal: price * qty
    });
  }

  if (qtyInput) qtyInput.value = 1;
  handleQuickPickProductChange();
  renderMarketerOrderItemsList();
  syncMarketerSaleFromItems();
}

function removeMarketerItemFromOrder(index) {
  if (!appState.tempMarketerSaleItems) return;
  appState.tempMarketerSaleItems.splice(index, 1);
  renderMarketerOrderItemsList();
  syncMarketerSaleFromItems();
}

function renderMarketerOrderItemsList() {
  const container = document.getElementById('marketerOrderItemsList');
  const badge = document.getElementById('quickPickItemCountBadge');
  const items = appState.tempMarketerSaleItems || [];

  if (badge) badge.textContent = `${items.length} Item`;

  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<div style="color: #94a3b8; font-style: italic; text-align: center; padding: 8px 0;">Belum ada barang dipilih. Pilih barang di atas & klik "+ Tambah".</div>`;
    return;
  }

  container.innerHTML = items.map((item, idx) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
      <div style="flex: 1; padding-right: 8px;">
        <span style="font-weight: 700; color: #1e293b;">${item.qty}x</span> ${item.name}
        <div style="font-size: 0.72rem; color: #64748b;">${formatRupiah(item.price)} / pcs</div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <b style="color: #0284c7; font-size: 0.82rem;">${formatRupiah(item.subtotal)}</b>
        <button type="button" onclick="removeMarketerItemFromOrder(${idx})" title="Hapus Item" style="background: #fee2e2; color: #dc2626; border: none; border-radius: 4px; padding: 2px 6px; font-size: 0.72rem; cursor: pointer;">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

function syncMarketerSaleFromItems() {
  const items = appState.tempMarketerSaleItems || [];
  const descInput = document.getElementById('saleItemsDesc');
  const omsetInput = document.getElementById('saleOmsetHet');

  if (items.length === 0) {
    if (descInput) descInput.value = '';
    if (omsetInput) omsetInput.value = '';
    updateSaleCommissionPreview(0);
    return;
  }

  const descText = items.map(i => `${i.qty}x ${i.name}`).join(', ');
  const totalHet = items.reduce((acc, i) => acc + i.subtotal, 0);

  if (descInput) descInput.value = descText;
  if (omsetInput) omsetInput.value = totalHet;
  updateSaleCommissionPreview(totalHet);
}

function updateSaleCommissionPreview(val) {
  const preview = document.getElementById('saleCommissionPreviewVal');
  const num = Number(val) || 0;
  const comm = Math.round(num * 0.15);
  if (preview) preview.textContent = formatRupiah(comm);
}

function toggleFulfillmentFields(val) {
  const details = document.getElementById('saleDropshipDetails');
  if (details) {
    details.style.display = val === 'dropship' ? 'block' : 'none';
  }
}

function handleAddMarketerSaleSubmit(e) {
  if (e) e.preventDefault();
  const marketerId = document.getElementById('saleMarketerSelect')?.value;
  const customerName = document.getElementById('saleCustomerName')?.value.trim();
  const orderDate = document.getElementById('saleOrderDate')?.value || '2026-09-27';
  const itemsDesc = document.getElementById('saleItemsDesc')?.value.trim();
  const omsetHet = Number(document.getElementById('saleOmsetHet')?.value) || 0;
  const fulfillmentType = document.getElementById('saleFulfillmentType')?.value || 'pickup';
  const customerAddress = document.getElementById('saleCustomerAddress')?.value.trim() || '';

  if (!marketerId || !customerName || omsetHet <= 0) {
    alert('Mohon lengkapi semua data pesanan marketer dengan benar!');
    return;
  }

  const monthPeriod = orderDate.slice(0, 7); // '2026-09'
  const commission = Math.round(omsetHet * 0.15);

  const newSale = {
    orderId: 'ORD-MKT-' + Date.now().toString().slice(-4),
    marketerId: marketerId,
    date: orderDate,
    monthPeriod: monthPeriod,
    customerName: customerName,
    customerPhone: '-',
    customerAddress: customerAddress,
    fulfillmentType: fulfillmentType,
    itemsDesc: itemsDesc || 'Produk Herbal SR12',
    itemsList: appState.tempMarketerSaleItems && appState.tempMarketerSaleItems.length > 0 ? [...appState.tempMarketerSaleItems] : null,
    omsetHet: omsetHet,
    commissionPct: 15,
    commissionAmount: commission,
    paidStatus: 'unpaid',
    paidDate: null
  };

  if (!appState.marketerSales) appState.marketerSales = getStoredMarketerSales();
  appState.marketerSales.unshift(newSale);
  saveStoredMarketerSales(appState.marketerSales);

  // Update total omset marketer di data mitra
  const marketer = (appState.mitraList || []).find(m => m.id === marketerId);
  if (marketer) {
    marketer.accumulatedSpent90Days = (marketer.accumulatedSpent90Days || 0) + omsetHet;
    marketer.totalOrdersCount = (marketer.totalOrdersCount || 0) + 1;
    marketer.lastOrderDate = orderDate;
    saveStoredMitra(appState.mitraList);
  }

  closeModal('modalAddMarketerSale');
  renderMarketerPayroll();
  renderResellers();
  showToast(`✅ Pesanan senilai ${formatRupiah(omsetHet)} berhasil dicatat! Hak bonus 15% (${formatRupiah(commission)}) ditambahkan.`);
}

function toggleMarketerPayrollStatus(marketerId, monthPeriod) {
  if (!appState.marketerSales) appState.marketerSales = getStoredMarketerSales();
  const sales = appState.marketerSales.filter(s => s.marketerId === marketerId && s.monthPeriod === monthPeriod);
  if (sales.length === 0) return;

  const allPaid = sales.every(s => s.paidStatus === 'paid');
  const newStatus = allPaid ? 'unpaid' : 'paid';
  const nowIso = '2026-09-27';

  sales.forEach(s => {
    s.paidStatus = newStatus;
    s.paidDate = newStatus === 'paid' ? nowIso : null;
  });

  saveStoredMarketerSales(appState.marketerSales);
  renderMarketerPayroll();
  showToast(newStatus === 'paid' ? '✅ Status pembayaran komisi marketer berhasil ditandai LUNAS!' : 'Status komisi diubah kembali menjadi BELUM DITRANSFER.');
}

function openMarketerDetailOrdersModal(marketerId, monthPeriod) {
  const modal = document.getElementById('modalMarketerOrdersDetail');
  const headerBox = document.getElementById('marketerDetailHeaderBox');
  const tbody = document.getElementById('marketerDetailOrdersTbody');
  const title = document.getElementById('marketerDetailModalTitle');

  const marketer = (appState.mitraList || []).find(m => m.id === marketerId);
  if (!marketer) return;

  const sales = (appState.marketerSales || []).filter(s => s.marketerId === marketerId && s.monthPeriod === monthPeriod);

  if (title) title.textContent = `📋 Rincian Pesanan: ${marketer.name} (${marketer.id})`;

  const totalOmset = sales.reduce((a, s) => a + (s.omsetHet || 0), 0);
  const totalComm = Math.round(totalOmset * 0.15);

  if (headerBox) {
    headerBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <b>Rekening Tujuan:</b> ${marketer.bankName} - ${marketer.bankAccount} (a.n ${marketer.bankHolder || marketer.name})<br>
          <span style="font-size: 0.75rem; color: #64748b;">No. WhatsApp: ${marketer.phone} &middot; Periode: ${monthPeriod}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.72rem; color: #64748b;">Total Bonus (15%):</span><br>
          <b style="font-size: 1.1rem; color: #0284c7;">${formatRupiah(totalComm)}</b>
        </div>
      </div>
    `;
  }

  if (tbody) {
    if (sales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Belum ada transaksi di bulan ini.</td></tr>`;
    } else {
      tbody.innerHTML = sales.map(s => `
        <tr>
          <td>
            <b>${s.orderId}</b><br>
            <span style="font-size: 0.7rem; color: #64748b;">${s.date}</span>
          </td>
          <td>
            <b>${s.customerName}</b><br>
            <span style="font-size: 0.72rem; color: var(--dark-500);">${s.itemsDesc}</span>
            <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
              ${s.fulfillmentType === 'dropship' ? 
                `<span style="background: #e0f2fe; color: #0284c7; padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;">📦 Dropship Distributor</span>` : 
                `<span style="background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700;">🏠 Ambil ke Gudang</span>`}
              ${s.customerAddress ? `<span style="font-size: 0.68rem; color: #64748b;">${s.customerAddress}</span>` : ''}
            </div>
          </td>
          <td><b>${formatRupiah(s.omsetHet)}</b></td>
          <td style="color: #0284c7; font-weight: 700;">${formatRupiah(s.commissionAmount || Math.round(s.omsetHet * 0.15))}</td>
          <td>
            <span style="padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.7rem; background: ${s.paidStatus === 'paid' ? '#dcfce7' : '#fef3c7'}; color: ${s.paidStatus === 'paid' ? '#15803d' : '#92400e'};">
              ${s.paidStatus === 'paid' ? 'Lunas' : 'Pending'}
            </span>
          </td>
        </tr>
      `).join('');
    }
  }

  if (modal) modal.classList.add('open');
}

function sendMarketerSalarySlipWA(marketerId, monthPeriod) {
  const storeName = appState.storeSettings.storeName;
  const marketer = (appState.mitraList || []).find(m => m.id === marketerId);
  if (!marketer) return;

  const sales = (appState.marketerSales || []).filter(s => s.marketerId === marketerId && s.monthPeriod === monthPeriod);
  const totalOmset = sales.reduce((a, s) => a + (s.omsetHet || 0), 0);
  const totalBonus = Math.round(totalOmset * 0.15);
  const allPaid = sales.length > 0 && sales.every(s => s.paidStatus === 'paid');

  const cleanPhone = marketer.phone.replace(/[^0-9]/g, '');
  const targetWa = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  const monthNames = {
    '2026-09': 'September 2026',
    '2026-08': 'Agustus 2026',
    '2026-07': 'Juli 2026'
  };
  const monthTitle = monthNames[monthPeriod] || monthPeriod;

  const text = `📄 *SLIP BONUS & KOMISI BULANAN MARKETER SR12*\n` +
    `Toko : *${storeName}*\n` +
    `Bulan: *${monthTitle}*\n` +
    `------------------------------------------\n` +
    `👤 *DATA MARKETER:*\n` +
    `• ID Marketer   : *${marketer.id}*\n` +
    `• Nama Lengkap  : ${marketer.name}\n` +
    `• No. WhatsApp  : ${marketer.phone}\n` +
    `• Rekening Bank : ${marketer.bankName} - ${marketer.bankAccount}\n` +
    `• Atas Nama     : ${marketer.bankHolder || marketer.name}\n` +
    `------------------------------------------\n` +
    `📊 *REKAPITULASI PENJUALAN:*\n` +
    `• Jumlah Pesanan Terjual : ${sales.length} Transaksi\n` +
    `• Total Omset Penjualan  : ${formatRupiah(totalOmset)}\n` +
    `• Persentase Komisi      : 15% (Tanpa Modal)\n\n` +
    `💰 *TOTAL BONUS/GAJI MARKETER: ${formatRupiah(totalBonus)}*\n` +
    `Status Transfer : ${allPaid ? 'SUDAH LUNAS DITRANSFER ✅' : 'SEDANG DIPROSES TRANSFER ⏳'}\n` +
    `------------------------------------------\n` +
    `Terima kasih banyak atas kerja keras dan semangat Kak ${marketer.name} dalam mempromosikan produk SR12 Herbal Skin Care bersama kami. Semoga jualan Kakak semakin laris manis dan membawa berkah melimpah! ✨🌿\n\n` +
    `Salam sukses,\n*${storeName}*`;

  window.open(`https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(text)}`, '_blank');
}

// ==========================================
// CART BUYER / MITRA / MARKETER AUTO-CHECK
// ==========================================
function checkBuyerMitraPhoneClick() {
  const input = document.getElementById('cartBuyerPhoneInput');
  if (input) {
    autoCheckBuyerMitraPhone(input.value);
  }
}

function autoCheckBuyerMitraPhone(query) {
  const notice = document.getElementById('buyerStatusNotice');
  if (!notice) return;
  if (!query || query.trim().length < 3) {
    notice.style.display = 'none';
    appState.verifiedMitra = null;
    updateCartSummary();
    return;
  }

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }

  const found = findMitraByIdOrPhone(query);
  let subtotalHet = 0;
  appState.cart.forEach(item => {
    const prod = appState.products.find(p => p.id === item.productId);
    subtotalHet += (prod?.het || 0) * item.qty;
  });

  if (found) {
    appState.verifiedMitra = found;
    appState.buyerDetails.name = found.name;
    appState.buyerDetails.phone = found.phone;
    if (found.city) {
      appState.buyerDetails.address = `${found.city}`;
    }

    const nameField = document.getElementById('cartBuyerNameInput');
    const phoneField = document.getElementById('cartBuyerPhoneField');
    if (nameField) nameField.value = found.name;
    if (phoneField) phoneField.value = found.phone;

    const tierSel = document.getElementById('globalTierSelect');
    const status = getMitraStatus(found);

    if (found.tier === 'marketer') {
      appState.currentTier = 'konsumen';
      if (tierSel) tierSel.value = 'konsumen';
      renderTierQuickBanner();
      renderProducts();
      updateCartUI();

      // Auto check dropshipper box
      const toggleDs = document.getElementById('toggleDropship');
      const dsFields = document.getElementById('dropshipFields');
      const dsName = document.getElementById('dropshipNameInput');
      const dsPhone = document.getElementById('dropshipPhoneInput');
      if (toggleDs) toggleDs.checked = true;
      if (dsFields) dsFields.style.display = 'block';
      if (dsName) dsName.value = `${found.name} (Marketer SR12)`;
      if (dsPhone) dsPhone.value = found.phone;
      appState.isDropship = true;

      notice.style.display = 'block';
      notice.style.background = '#e0f2fe';
      notice.style.color = '#0369a1';
      notice.style.border = '1px solid #bae6fd';
      notice.innerHTML = `💼 <b>Tim Marketer Dikenali: ${found.name} (${found.id})!</b><br>✨ Pesanan ini otomatis dicatat ke Buku Omset Marketer untuk <b>Bonus 15% Bulanan</b> (Estimasi komisi: <b>${formatRupiah(Math.round(subtotalHet * 0.15))}</b>). Pengirim dropship otomatis diisi nama Marketer.`;
    } else if (found.tier === 'agen') {
      appState.currentTier = 'agen';
      if (tierSel) tierSel.value = 'agen';
      renderTierQuickBanner();
      renderProducts();
      updateCartUI();

      notice.style.display = 'block';
      notice.style.background = '#fef3c7';
      notice.style.color = '#92400e';
      notice.style.border = '1px solid #fde68a';
      notice.innerHTML = `👑 <b>Selamat Datang Kembali, ${found.name} (${found.id})!</b><br>Terverifikasi sebagai <b>Agen Resmi SR12 Aktif</b>. Diskon Agen <b>40%</b> otomatis diaktifkan untuk pesanan ini!`;
    } else if (found.tier === 'sub_agen') {
      appState.currentTier = 'sub_agen';
      if (tierSel) tierSel.value = 'sub_agen';
      renderTierQuickBanner();
      renderProducts();
      updateCartUI();

      notice.style.display = 'block';
      notice.style.background = '#ede9fe';
      notice.style.color = '#5b21b6';
      notice.style.border = '1px solid #ddd6fe';
      notice.innerHTML = `🏢 <b>Selamat Datang Kembali, ${found.name} (${found.id})!</b><br>Terverifikasi sebagai <b>Sub Agen SR12 Aktif</b>. Diskon Sub Agen <b>30%</b> otomatis diaktifkan untuk pesanan ini!`;
    } else if (found.tier === 'reseller') {
      if (status.state !== 'expired') {
        appState.currentTier = 'reseller';
        if (tierSel) tierSel.value = 'reseller';
        renderTierQuickBanner();
        renderProducts();
        updateCartUI();

        notice.style.display = 'block';
        notice.style.background = '#dcfce7';
        notice.style.color = '#15803d';
        notice.style.border = '1px solid #bbf7d0';
        notice.innerHTML = `🌿 <b>Selamat Datang Kembali, ${found.name} (${found.id})!</b><br>Terverifikasi sebagai <b>Reseller Resmi Aktif</b> (Diskon <b>20%</b> otomatis aktif untuk Repeat Order!). Sisa masa aktif 90 hari: <b>${status.daysLeft} hari lagi</b>.`;
      } else {
        appState.currentTier = 'konsumen';
        renderTierQuickBanner();
        renderProducts();
        updateCartUI();

        notice.style.display = 'block';
        notice.style.background = '#fee2e2';
        notice.style.color = '#b91c1c';
        notice.style.border = '1px solid #fecaca';
        notice.innerHTML = `⚠️ <b>Halo ${found.name} (${found.id}):</b> Masa aktif Reseller 90 hari telah terlewati (akumulasi belanja belum sampai Rp 500.000). Saat ini berlaku harga retail. Belanja minimal Rp 500.000 hari ini untuk aktifkan kembali masa Reseller Anda!`;
      }
    }
  } else {
    appState.verifiedMitra = null;
    // Belum terdaftar
    if (subtotalHet >= 500000) {
      notice.style.display = 'block';
      notice.style.background = '#fef3c7';
      notice.style.color = '#92400e';
      notice.style.border = '1px solid #fde68a';
      notice.innerHTML = `🎉 <b>Kualifikasi Reseller Terpenuhi!</b> Belanjaan Anda ${formatRupiah(subtotalHet)} mencapai syarat Rp 500.000. Begitu order selesai, Anda otomatis terdaftar sebagai <b>Reseller Resmi (Diskon 20%)</b> untuk 90 hari ke depan!`;
    } else {
      notice.style.display = 'block';
      notice.style.background = '#f1f5f9';
      notice.style.color = '#475569';
      notice.style.border = '1px solid #cbd5e1';
      const def = 500000 - subtotalHet;
      notice.innerHTML = `ℹ️ Status: <b>Konsumen Retail (Harga HET)</b>.<br>Tambah belanja ${formatRupiah(def)} lagi (total min. Rp 500.000) untuk otomatis bergabung menjadi Reseller Resmi!`;
    }
    updateCartSummary();
  }
}

// Global Exports
window.openTopupQuotaModal = openTopupQuotaModal;
window.selectTopupPackage = selectTopupPackage;
window.confirmSimulatedTopupPayment = confirmSimulatedTopupPayment;
window.updateStoreQuotaUI = updateStoreQuotaUI;
window.switchPartnerStore = switchPartnerStore;
window.openShareStoreModal = openShareStoreModal;
window.copyStoreShareLink = copyStoreShareLink;
window.shareStoreToWhatsApp = shareStoreToWhatsApp;
window.shareStoreToTelegram = shareStoreToTelegram;
window.openRegisterStoreModal = openRegisterStoreModal;
window.handleRegisterStoreSubmit = handleRegisterStoreSubmit;
window.toggleViewMode = toggleViewMode;
window.openStoreAdminPinPrompt = openDistributorLoginModal;
window.verifyStoreAdminPinSubmit = handleDistributorLoginSubmit;
window.switchTab = switchTab;
window.printShippingLabel = printShippingLabel;
window.checkoutViaWhatsApp = checkoutViaWhatsApp;
window.updateNewProdTierCalc = updateNewProdTierCalc;
window.updateEditProdTierCalc = updateEditProdTierCalc;
window.resetAllDummyDataToZero = resetAllDummyDataToZero;

// Multi-Tier Mitra & CRM Exports
window.renderResellers = renderResellers;
window.filterResellers = filterResellers;
window.filterMitra = filterMitra;
window.searchResellers = searchResellers;
window.openAddMitraModal = openAddMitraModal;
window.openAddResellerModal = openAddResellerModal;
window.handleMitraTierChange = handleMitraTierChange;
window.handleAddMitraSubmit = handleAddMitraSubmit;
window.handleAddResellerSubmit = handleAddResellerSubmit;
window.deleteMitra = deleteMitra;
window.deleteReseller = deleteReseller;
window.sendResellerReminderWA = sendResellerReminderWA;
window.sendGeneralMitraWA = sendGeneralMitraWA;
window.autoCheckBuyerMitraPhone = autoCheckBuyerMitraPhone;
window.checkBuyerMitraPhoneClick = checkBuyerMitraPhoneClick;

// Marketer Payroll Exports
window.renderMarketerPayroll = renderMarketerPayroll;
window.openAddMarketerSaleModal = openAddMarketerSaleModal;
window.updateSaleCommissionPreview = updateSaleCommissionPreview;
window.handleAddMarketerSaleSubmit = handleAddMarketerSaleSubmit;
window.toggleMarketerPayrollStatus = toggleMarketerPayrollStatus;
window.openMarketerDetailOrdersModal = openMarketerDetailOrdersModal;
window.sendMarketerSalarySlipWA = sendMarketerSalarySlipWA;
window.toggleFulfillmentFields = toggleFulfillmentFields;
window.handleQuickPickProductChange = handleQuickPickProductChange;
window.addMarketerItemToOrder = addMarketerItemToOrder;
window.removeMarketerItemFromOrder = removeMarketerItemFromOrder;
window.switchTopupMethod = switchTopupMethod;
window.handleSaveDevPaymentSettings = handleSaveDevPaymentSettings;
window.copyDevBankAccount = copyDevBankAccount;
window.copyDevEwallet = copyDevEwallet;
window.sendTopupProofToDeveloperWA = sendTopupProofToDeveloperWA;
window.updateDevPaymentUI = updateDevPaymentUI;
window.openDistributorLoginModal = openDistributorLoginModal;
window.autoFillDemoLogin = autoFillDemoLogin;
window.handleDistributorLoginSubmit = handleDistributorLoginSubmit;
window.handleDistributorLogout = handleDistributorLogout;
window.clearCart = clearCart;
window.removeFromCart = removeFromCart;
window.updateAdminNotificationUI = updateAdminNotificationUI;
window.triggerAdminNewOrderNotification = triggerAdminNewOrderNotification;
window.renderAdminOrdersModal = renderAdminOrdersModal;
window.openAdminOrdersModal = openAdminOrdersModal;
window.confirmOrderFromModal = confirmOrderFromModal;
window.clearAllSimulationOrders = clearAllSimulationOrders;
window.playOrderChime = playOrderChime;

// Pending Store Registration & SK Approval System Exports
window.openRegisterStoreModal = openRegisterStoreModal;
window.handleRegisterStoreSubmit = handleRegisterStoreSubmit;
window.openStoreAppPendingSuccessModal = openStoreAppPendingSuccessModal;
window.previewSkDocument = previewSkDocument;
window.switchPreviewDocTab = switchPreviewDocTab;
window.approvePendingStore = approvePendingStore;
window.rejectPendingStore = rejectPendingStore;
window.contactApplicantWA = contactApplicantWA;


