/**
 * SR12 PARTNER STORE - CORE APPLICATION LOGIC (V5 SECURITY & PIN PROTECTED DEV PORTAL)
 * Ekosistem Kemitraan & Penjualan Resmi SR12 Herbal Skin Care
 */

const DEFAULT_PARTNER_STORES = [
  {
    slug: 'sr12-central',
    storeName: 'SR12-Ku Pro',
    storeTagline: 'SR12 Official Central Hub • Direktori Kemitraan & Pasokan Resmi',
    storeTheme: 'emerald',
    heroTitle: 'SR12-Ku Pro',
    heroSubtitle: 'SR12 Official Central Hub • Pusat pasokan resmi dan direktori jaringan Toko Distributor & Agen berlisensi BPOM & Halal MUI se-Indonesia.',
    heroBannerUrl: 'assets/hero-banner.jpg',
    storeLogoText: 'SR12',
    storeLogoUrl: '',
    storeWaNumber: '6281200001212',
    storeCity: 'SR12 Official Central Hub',
    storeOwner: 'SR12 Official Central Hub',
    partnerTier: 'distributor',
    feePayer: 'buyer',
    storeAdminPin: '1234',
    orderQuota: 999,
    walletBalance: 500000,
    totalTopupPaid: 0,
    totalTx: 0
  }
];

function getDeletedStoreSlugs() {
  try {
    const raw = localStorage.getItem('sr12_deleted_store_slugs');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) {
    return [];
  }
}

function getStoredPartnerStores() {
  const stored = localStorage.getItem('sr12_partner_stores_v2');
  const deletedSlugs = getDeletedStoreSlugs();
  let stores = [];
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stores = parsed.filter(s => s && s.slug && s.slug !== 'toko-supa-distributor' && !s.slug.startsWith('deleted_') && !s.slug.includes('toko-supa') && !deletedSlugs.includes(s.slug));
      }
    } catch (e) {
      console.error('Error parsing stored partner stores:', e);
    }
  }

  // Jika belum ada data tersimpan, gunakan template default (hanya sr12-central sebagai platform hub)
  if (stores.length === 0) {
    stores = DEFAULT_PARTNER_STORES.map(s => Object.assign({}, s));
    saveStoredPartnerStores(stores);
    return stores;
  }

  // Pastikan SR12-Ku Pro (sr12-central) selalu ada di index 0 sebagai platform hub
  let centralIdx = stores.findIndex(s => s.slug === 'sr12-central');
  if (centralIdx === -1) {
    stores.unshift(Object.assign({}, DEFAULT_PARTNER_STORES[0]));
  } else {
    stores[centralIdx] = Object.assign({}, DEFAULT_PARTNER_STORES[0], stores[centralIdx], {
      slug: 'sr12-central',
      storeName: 'SR12-Ku Pro',
      heroTitle: 'SR12-Ku Pro',
      storeTagline: 'SR12 Official Central Hub • Direktori Kemitraan & Pasokan Resmi',
      storeOwner: 'SR12 Official Central Hub',
      storeCity: 'SR12 Official Central Hub',
      partnerTier: 'distributor'
    });
    if (centralIdx !== 0) {
      const central = stores.splice(centralIdx, 1)[0];
      stores.unshift(central);
    }
  }

  saveStoredPartnerStores(stores);
  return stores;
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
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
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
  return [];
}

function saveStoredPendingStores(apps) {
  localStorage.setItem('sr12_pending_store_apps_v1', JSON.stringify(apps));
}

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '3000') return '';
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return `${window.location.protocol}//${host}:3000`;
    }
    // Di lingkungan serverless/hosting seperti Vercel, jangan panggil port 3000 untuk mencegah network timeout 10 detik
    return null;
  }
  return 'http://127.0.0.1:3000';
}

async function syncStoresWithServer() {
  let changed = false;
  const deletedSlugs = getDeletedStoreSlugs();

  // Bersihkan data toko test/dummy dan toko yang sudah dihapus dari memori lokal
  const cleanLocal = (appState.partnerStores || []).filter(s => s && s.slug && s.slug !== 'toko-supa-distributor' && !s.slug.startsWith('deleted_') && !s.slug.includes('toko-supa') && !deletedSlugs.includes(s.slug));
  if (cleanLocal.length !== appState.partnerStores.length) {
    appState.partnerStores = cleanLocal;
    saveStoredPartnerStores(appState.partnerStores);
    changed = true;
  }

  // 1. Sinkronisasi dari Supabase Cloud (jika aktif)
  if (typeof syncStoresFromSupabase === 'function') {
    try {
      const supaStores = await syncStoresFromSupabase();
      if (Array.isArray(supaStores)) {
        const cloudSlugs = new Set(supaStores.map(s => s.slug));

        // A. Filter toko mitra: Hapus toko yang tidak ada di Supabase Cloud (kecuali sr12-central) atau yang ada di daftar hapus
        const prevCount = (appState.partnerStores || []).length;
        appState.partnerStores = (appState.partnerStores || []).filter(localStore => {
          if (!localStore || !localStore.slug) return false;
          if (localStore.slug === 'sr12-central') return true;
          if (deletedSlugs.includes(localStore.slug)) return false;
          // Pastikan hanya toko yang terdaftar resmi di Supabase Cloud yang dipertahankan
          if (!cloudSlugs.has(localStore.slug)) return false;
          return true;
        });

        if (appState.partnerStores.length !== prevCount) {
          changed = true;
          if (appState.currentStoreSlug && !cloudSlugs.has(appState.currentStoreSlug) && appState.currentStoreSlug !== 'sr12-central') {
            switchPartnerStore('sr12-central');
          }
        }

        // B. Update atau tambahkan toko yang ada di Cloud ke memori lokal
        supaStores.forEach(apiStore => {
          if (!apiStore || !apiStore.slug || apiStore.slug === 'sr12-central' || apiStore.slug === 'toko-supa-distributor' || apiStore.slug.startsWith('deleted_') || apiStore.slug.includes('toko-supa') || deletedSlugs.includes(apiStore.slug)) return;
          const idx = appState.partnerStores.findIndex(s => s.slug === apiStore.slug);
          if (idx >= 0) {
            appState.partnerStores[idx] = Object.assign({}, appState.partnerStores[idx], apiStore);
          } else {
            appState.partnerStores.push(apiStore);
            changed = true;
          }
        });
      }
    } catch (e) {
      console.warn('Supabase store sync warning:', e);
    }
  }

  // 2. Sinkronisasi dari Local REST Server API (/api/stores - hanya jika berjalan lokal)
  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    try {
      const res = await fetch(apiBase + '/api/stores');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          data.data.forEach(apiStore => {
            if (!apiStore || !apiStore.slug || apiStore.slug === 'sr12-central' || apiStore.slug === 'toko-supa-distributor' || apiStore.slug.startsWith('deleted_') || apiStore.slug.includes('toko-supa') || deletedSlugs.includes(apiStore.slug)) return;
            const idx = appState.partnerStores.findIndex(s => s.slug === apiStore.slug);
            if (idx >= 0) {
              appState.partnerStores[idx] = Object.assign({}, appState.partnerStores[idx], apiStore);
            } else {
              appState.partnerStores.push(apiStore);
              changed = true;
            }
          });
        }
      }
    } catch (err) {}
  }

  if (changed) {
    saveStoredPartnerStores(appState.partnerStores);
    renderStoreDropdown();
    updateDevPortalMetrics();
  }

  // Selalu pastikan direktori di Official Central Hub ter-refresh sesuai database terbaru
  if (appState.storeSettings?.slug === 'sr12-central' || appState.currentStoreSlug === 'sr12-central') {
    renderOfficialDistributorDirectory();
  }

  // Auto-switch jika URL meminta toko spesifik (?store=...) tetapi saat awal render belum selesai terunduh dari Cloud
  const currentUrlParams = new URLSearchParams(window.location.search);
  const targetUrlStore = currentUrlParams.get('store');
  if (targetUrlStore && targetUrlStore !== 'sr12-central' && appState.currentStoreSlug !== targetUrlStore) {
    const matchedStore = appState.partnerStores.find(s => s.slug === targetUrlStore);
    if (matchedStore) {
      console.log('🏪 [Auto-Switch URL] Membuka toko mitra sesuai parameter URL:', targetUrlStore);
      loadStoreBySlug(targetUrlStore);
      if (typeof handleDirectProductDeepLink === 'function') {
        handleDirectProductDeepLink();
      }
    }
  }
}

async function syncPendingStoresWithServer() {
  let changed = false;
  if (!appState.pendingStoreApps) appState.pendingStoreApps = [];

  // 1. Sinkronisasi antrean dari Supabase Cloud
  if (typeof syncPendingStoresFromSupabase === 'function') {
    try {
      const supaPending = await syncPendingStoresFromSupabase();
      if (Array.isArray(supaPending)) {
        const activeSlugs = new Set((appState.partnerStores || []).map(s => s.slug));
        
        supaPending.forEach(apiApp => {
          if (!apiApp || !apiApp.id) return;
          if (activeSlugs.has(apiApp.slug) || apiApp.status === 'approved') {
            if (typeof deletePendingStoreFromSupabase === 'function') {
              deletePendingStoreFromSupabase(apiApp.id);
            }
            return;
          }
          const idx = appState.pendingStoreApps.findIndex(a => a.id === apiApp.id);
          if (idx >= 0) {
            appState.pendingStoreApps[idx] = Object.assign({}, appState.pendingStoreApps[idx], apiApp);
          } else {
            appState.pendingStoreApps.push(apiApp);
            changed = true;
          }
        });

        const oldLen = appState.pendingStoreApps.length;
        appState.pendingStoreApps = appState.pendingStoreApps.filter(a => !activeSlugs.has(a.slug) && a.status !== 'approved');
        if (appState.pendingStoreApps.length !== oldLen) changed = true;

        if (typeof savePendingStoreToSupabase === 'function') {
          const toUpload = appState.pendingStoreApps.filter(localApp => {
            if (!localApp || !localApp.id) return false;
            if (activeSlugs.has(localApp.slug) || localApp.status === 'approved') return false;
            return !supaPending.some(s => s.id === localApp.id);
          });
          for (const a of toUpload) {
            await savePendingStoreToSupabase(a);
          }
        }
      }
    } catch (e) {
      console.warn('Supabase pending store sync warning:', e);
    }
  }

  // 2. Sinkronisasi antrean dari Local REST Server API (/api/pending-stores - hanya jika berjalan lokal)
  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    try {
      const res = await fetch(apiBase + '/api/pending-stores');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          data.data.forEach(apiApp => {
            if (!apiApp || !apiApp.id) return;
            const idx = appState.pendingStoreApps.findIndex(a => a.id === apiApp.id);
            if (idx >= 0) {
              appState.pendingStoreApps[idx] = Object.assign({}, appState.pendingStoreApps[idx], apiApp);
            } else {
              appState.pendingStoreApps.push(apiApp);
              changed = true;
            }
          });

          const localAppsToUpload = appState.pendingStoreApps.filter(localApp => {
            if (!localApp || !localApp.id) return false;
            return !data.data.some(serverApp => serverApp.id === localApp.id);
          });

          for (const appToUpload of localAppsToUpload) {
            try {
              await fetch(apiBase + '/api/pending-stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appToUpload)
              });
            } catch (upErr) {}
          }
        }
      }
    } catch (err) {}
  }

  if (changed) {
    saveStoredPendingStores(appState.pendingStoreApps);
    updateDevPortalMetrics();
  }
  updateDistributorPendingBadges();
}

function quickApproveFromPendingModal() {
  const appId = appState.lastSubmittedPendingAppId || (appState.pendingStoreApps && appState.pendingStoreApps[0] && appState.pendingStoreApps[0].id);
  if (!appId) {
    closeModal('modalStoreAppPendingSuccess');
    return;
  }
  closeModal('modalStoreAppPendingSuccess');
  approvePendingStore(appId);
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

// Satu kali pembersihan otomatis seluruh data simulasi lama untuk transisi ke 44 produk resmi
(function autoPurgeOldDataOnVersionUpgrade() {
  if (!localStorage.getItem('sr12_cleaned_v4')) {
    localStorage.removeItem('sr12_all_products_v3');
    localStorage.removeItem('sr12_pos_transactions_v1');
    localStorage.removeItem('sr12_customer_orders');
    localStorage.removeItem('sr12_cashflow_records_v1');
    localStorage.removeItem('sr12_stock_mutations_v1');
    localStorage.removeItem('sr12_cashier_attendance_v1');
    localStorage.removeItem('sr12_active_cashier_shift_v1');
    localStorage.removeItem('sr12_cart');
    localStorage.setItem('sr12_cleaned_v4', 'true');
    // CATATAN: JANGAN pernah menimpa sr12_all_products_v4 dengan data dummy jika pengguna sudah punya data produk!
  }
})();

// ==========================================
// INDEXEDDB ENGINE UNTUK PENYIMPANAN FOTO & MASTER PRODUK
// Kapasitas besar (ratusan MB / GB), bebas dari batas 5MB LocalStorage browser
// ==========================================
const SR12_DB_NAME = 'sr12_partner_store_db';
const SR12_DB_VERSION = 2;
const SR12_STORE_PRODUCTS = 'products_master';
const SR12_STORE_MITRA = 'mitra_master';
const SR12_STORE_MARKETER_SALES = 'marketer_sales_master';

function openSR12IndexedDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const req = window.indexedDB.open(SR12_DB_NAME, SR12_DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(SR12_STORE_PRODUCTS)) {
          db.createObjectStore(SR12_STORE_PRODUCTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SR12_STORE_MITRA)) {
          db.createObjectStore(SR12_STORE_MITRA, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SR12_STORE_MARKETER_SALES)) {
          db.createObjectStore(SR12_STORE_MARKETER_SALES, { keyPath: 'orderId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = (err) => {
        console.warn('IndexedDB open error:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('Exception saat membuka IndexedDB:', e);
      resolve(null);
    }
  });
}

async function dbSaveProduct(product) {
  if (!product || !product.id) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_PRODUCTS], 'readwrite');
      const store = tx.objectStore(SR12_STORE_PRODUCTS);
      store.put(product);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      console.warn('Gagal simpan produk ke IndexedDB:', e);
      resolve(false);
    }
  });
}

async function dbSaveAllProducts(productsList) {
  if (!Array.isArray(productsList) || productsList.length === 0) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_PRODUCTS], 'readwrite');
      const store = tx.objectStore(SR12_STORE_PRODUCTS);
      productsList.forEach(p => store.put(p));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      console.warn('Gagal simpan semua produk ke IndexedDB:', e);
      resolve(false);
    }
  });
}

async function dbGetAllProducts() {
  const db = await openSR12IndexedDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_PRODUCTS], 'readonly');
      const store = tx.objectStore(SR12_STORE_PRODUCTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      console.warn('Gagal ambil produk dari IndexedDB:', e);
      resolve([]);
    }
  });
}

async function dbDeleteProduct(productId) {
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_PRODUCTS], 'readwrite');
      const store = tx.objectStore(SR12_STORE_PRODUCTS);
      store.delete(productId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

// ------------------------------------------
// INDEXEDDB: MITRA BINAAN (AGEN, SUB AGEN, RESELLER, MARKETER)
// ------------------------------------------
async function dbSaveMitra(mitra) {
  if (!mitra || !mitra.id) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_MITRA], 'readwrite');
      const store = tx.objectStore(SR12_STORE_MITRA);
      store.put(mitra);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      console.warn('Gagal simpan mitra ke IndexedDB:', e);
      resolve(false);
    }
  });
}

async function dbSaveAllMitra(mitraList) {
  if (!Array.isArray(mitraList)) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_MITRA], 'readwrite');
      const store = tx.objectStore(SR12_STORE_MITRA);
      store.clear();
      mitraList.forEach(m => store.put(m));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      console.warn('Gagal simpan semua mitra ke IndexedDB:', e);
      resolve(false);
    }
  });
}

async function dbGetAllMitra() {
  const db = await openSR12IndexedDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_MITRA], 'readonly');
      const store = tx.objectStore(SR12_STORE_MITRA);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      console.warn('Gagal ambil mitra dari IndexedDB:', e);
      resolve([]);
    }
  });
}

async function dbDeleteMitra(id) {
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_MITRA], 'readwrite');
      const store = tx.objectStore(SR12_STORE_MITRA);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

// ------------------------------------------
// INDEXEDDB: REKAP PENJUALAN MARKETER (KOMISI 15%)
// ------------------------------------------
async function dbSaveAllMarketerSales(salesList) {
  if (!Array.isArray(salesList)) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_MARKETER_SALES], 'readwrite');
      const store = tx.objectStore(SR12_STORE_MARKETER_SALES);
      store.clear();
      salesList.forEach(s => store.put(s));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      console.warn('Gagal simpan marketer sales ke IndexedDB:', e);
      resolve(false);
    }
  });
}

async function dbGetAllMarketerSales() {
  const db = await openSR12IndexedDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_MARKETER_SALES], 'readonly');
      const store = tx.objectStore(SR12_STORE_MARKETER_SALES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      console.warn('Gagal ambil marketer sales dari IndexedDB:', e);
      resolve([]);
    }
  });
}

// Sinkronisasi otomatis data produk & foto asli dari IndexedDB saat aplikasi dimuat
async function syncProductsWithIndexedDB() {
  try {
    const idbProducts = await dbGetAllProducts();
    if (idbProducts && idbProducts.length > 0) {
      let hasChanges = false;
      const idbMap = new Map();
      idbProducts.forEach(p => idbMap.set(p.id, p));

      if (typeof appState !== 'undefined' && Array.isArray(appState.products)) {
        appState.products = appState.products.map(p => {
          if (idbMap.has(p.id)) {
            const fromDb = idbMap.get(p.id);
            idbMap.delete(p.id);
            hasChanges = true;
            return { ...p, ...fromDb };
          }
          return p;
        });

        // Masukkan produk baru yang ada di IndexedDB
        idbMap.forEach(newP => {
          appState.products.push(newP);
          hasChanges = true;
        });

        if (hasChanges) {
          if (typeof renderProducts === 'function') renderProducts();
          if (typeof renderInventoryTable === 'function') renderInventoryTable();
          if (typeof renderPosProducts === 'function') renderPosProducts();
          if (typeof updateCartUI === 'function') updateCartUI();
          // Update cache LocalStorage secara aman tanpa menimpa IndexedDB
          saveStoredProducts(appState.products, false);
        }
      }
    } else if (typeof appState !== 'undefined' && Array.isArray(appState.products) && appState.products.length > 0) {
      // Inisialisasi awal IndexedDB dari data saat ini
      dbSaveAllProducts(appState.products);
    }

    // 2. Sinkronkan dengan Supabase Cloud (memulihkan katalog & foto meskipun browser di-clear history)
    if (typeof syncProductsFromSupabase === 'function') {
      const cloudProducts = await syncProductsFromSupabase(appState.storeSettings?.slug);
      if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        let hasCloudUpdates = false;
        const currentMap = new Map((appState.products || []).map(p => [p.id, p]));
        cloudProducts.forEach(cp => {
          if (!currentMap.has(cp.id) || cp.customEdited) {
            currentMap.set(cp.id, { ...(currentMap.get(cp.id) || {}), ...cp });
            hasCloudUpdates = true;
          }
        });
        if (hasCloudUpdates) {
          appState.products = Array.from(currentMap.values());
          saveStoredProducts(appState.products, true);
          if (typeof renderProducts === 'function') renderProducts();
          if (typeof renderInventoryTable === 'function') renderInventoryTable();
          if (typeof renderPosProducts === 'function') renderPosProducts();
          if (typeof updateCartUI === 'function') updateCartUI();
        }
      }
    }
  } catch (err) {
    console.warn('Sync IndexedDB / Cloud produk info:', err);
  }
}
window.syncProductsWithIndexedDB = syncProductsWithIndexedDB;

// Sinkronisasi otomatis data mitra binaan & rekap gaji marketer dari IndexedDB saat aplikasi dimuat
async function syncMitraWithIndexedDB() {
  try {
    // 1. Sinkronkan Mitra Binaan (Agen, Sub Agen, Reseller, Marketer)
    const idbMitra = await dbGetAllMitra();
    if (idbMitra && idbMitra.length > 0) {
      if (typeof appState !== 'undefined') {
        const mitraMap = new Map((appState.mitraList || []).map(m => [m.id, m]));
        idbMitra.forEach(m => {
          if (!mitraMap.has(m.id)) {
            mitraMap.set(m.id, m);
          }
        });
        appState.mitraList = Array.from(mitraMap.values());
        appState.resellers = appState.mitraList;
        localStorage.setItem('sr12_distributor_mitra_v2', JSON.stringify(appState.mitraList));
        localStorage.setItem('sr12_distributor_resellers_v1', JSON.stringify(appState.mitraList));
        if (typeof renderResellers === 'function') renderResellers();
        if (typeof updateViewModeUI === 'function') updateViewModeUI();
      }
    } else if (typeof appState !== 'undefined' && Array.isArray(appState.mitraList) && appState.mitraList.length > 0) {
      await dbSaveAllMitra(appState.mitraList);
    }

    // 2. Sinkronkan Rekap Penjualan Marketer
    const idbSales = await dbGetAllMarketerSales();
    if (idbSales && idbSales.length > 0) {
      if (typeof appState !== 'undefined') {
        const salesMap = new Map((appState.marketerSales || []).map(s => [s.orderId, s]));
        idbSales.forEach(s => {
          if (!salesMap.has(s.orderId)) salesMap.set(s.orderId, s);
        });
        appState.marketerSales = Array.from(salesMap.values());
        localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(appState.marketerSales));
        if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
      }
    } else if (typeof appState !== 'undefined' && Array.isArray(appState.marketerSales) && appState.marketerSales.length > 0) {
      await dbSaveAllMarketerSales(appState.marketerSales);
    }

    // 3. Sinkronkan dari Supabase Cloud jika online
    if (typeof syncMitraFromSupabase === 'function' && typeof appState !== 'undefined') {
      const slug = (appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
      const cloudMitra = await syncMitraFromSupabase(slug);
      if (cloudMitra && cloudMitra.length > 0) {
        const curMap = new Map((appState.mitraList || []).map(m => [m.id, m]));
        let cloudAdded = false;
        cloudMitra.forEach(cm => {
          if (!curMap.has(cm.id)) {
            curMap.set(cm.id, cm);
            cloudAdded = true;
          }
        });
        if (cloudAdded) {
          appState.mitraList = Array.from(curMap.values());
          appState.resellers = appState.mitraList;
          saveStoredMitra(appState.mitraList, false);
          if (typeof renderResellers === 'function') renderResellers();
          if (typeof updateViewModeUI === 'function') updateViewModeUI();
        }
      }
    }
  } catch (err) {
    console.warn('Sync IndexedDB mitra info:', err);
  }
}
window.syncMitraWithIndexedDB = syncMitraWithIndexedDB;


function getStoredProducts() {
  const stored = localStorage.getItem('sr12_all_products_v4');
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
  if (list.length === 0 && typeof DEFAULT_SR12_PRODUCTS !== 'undefined') {
    list = [...DEFAULT_SR12_PRODUCTS];
  }

  // Sinkronisasi otomatis field het, price, dan default stock
  list.forEach(p => {
    const val = Number(p.het || p.price || p.het_price) || 0;
    p.het = val;
    p.price = val;
    if (typeof p.stock === 'undefined') p.stock = 50;
  });

  // Segera sinkronkan foto asli dari IndexedDB di latar belakang
  setTimeout(() => {
    syncProductsWithIndexedDB();
  }, 100);

  return list;
}

/**
 * Kompresi gambar client-side otomatis ke WebP/JPEG max 500x500 px (kualitas 0.76)
 * Menghasilkan file sangat ramping (~20KB - 30KB) namun tetap sangat tajam di katalog HP & PC
 */
function compressImageSource(srcOrFile, maxDim = 500, quality = 0.76) {
  return new Promise((resolve) => {
    const processImage = (img) => {
      let width = img.naturalWidth || img.width || 500;
      let height = img.naturalHeight || img.height || 500;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (e) {
        resolve(typeof srcOrFile === 'string' ? srcOrFile : img.src);
      }
    };

    if (typeof srcOrFile === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => processImage(img);
      img.onerror = () => resolve(srcOrFile);
      img.src = srcOrFile;
    } else if (srcOrFile instanceof Blob || srcOrFile instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(srcOrFile);
    } else {
      resolve(srcOrFile);
    }
  });
}
window.compressImageSource = compressImageSource;

function saveStoredProducts(productsList, syncToIdb = true) {
  if (!Array.isArray(productsList)) return;

  // 1. Simpan ke IndexedDB (Kapasitas Besar & Gambar Asli 100% Aman)
  if (syncToIdb) {
    dbSaveAllProducts(productsList);
  }

  // 2. Simpan ke LocalStorage sebagai fast-boot cache
  try {
    localStorage.setItem('sr12_all_products_v4', JSON.stringify(productsList));
  } catch (err) {
    console.warn('LocalStorage quota penuh saat menyimpan produk, menggunakan cache aman (IndexedDB tetap menyimpan gambar asli)...', err);
    try {
      // Simpan versi lean di LocalStorage tanpa merusak string base64
      const leanProducts = productsList.map(p => {
        if (p.image && typeof p.image === 'string' && p.image.startsWith('data:') && p.image.length > 30000) {
          return { ...p, image: 'assets/hero-banner.jpg', _hasIdbImage: true };
        }
        return p;
      });
      localStorage.setItem('sr12_all_products_v4', JSON.stringify(leanProducts));
    } catch (e2) {
      console.warn('LocalStorage penuh, foto produk tetap aman di IndexedDB.');
    }
  }
}
window.saveStoredProducts = saveStoredProducts;

function openAddProductModal() {
  const m = document.getElementById('modalAddProduct');
  if (m) {
    document.body.classList.add('modal-open');
    m.classList.add('open');
    const nameInput = document.getElementById('newProdName');
    if (nameInput) setTimeout(() => nameInput.focus(), 200);
  }
}
window.openAddProductModal = openAddProductModal;

function deleteProduct(productId) {
  if (typeof appState === 'undefined') return;
  const prod = (appState.products || []).find(p => p.id === productId);
  if (!prod) return;
  if (!confirm(`⚠️ Hapus produk "${prod.name}" dari inventori toko?\n\nProduk ini akan dihapus dari etalase toko online dan kasir POS.`)) {
    return;
  }
  appState.products = appState.products.filter(p => p.id !== productId);
  dbDeleteProduct(productId);
  saveStoredProducts(appState.products);
  if (typeof renderProducts === 'function') renderProducts();
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderPosProducts === 'function') renderPosProducts();
  if (typeof updateCartUI === 'function') updateCartUI();
  if (typeof showToast === 'function') showToast(`🗑️ Produk "${prod.name}" berhasil dihapus dari inventori.`);
}
window.deleteProduct = deleteProduct;

// Fitur Backup & Restore Katalog Produk (Untuk Keamanan Cadangan Data Pengguna)
function exportProductCatalogBackup() {
  try {
    const list = (typeof appState !== 'undefined' && appState.products) ? appState.products : [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(list, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `katalog_produk_sr12_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    showToast('💾 Berhasil mendownload backup katalog & foto produk!');
  } catch (e) {
    alert('Gagal mendownload file backup: ' + e.message);
  }
}
window.exportProductCatalogBackup = exportProductCatalogBackup;

function importProductCatalogBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!confirm(`Pulihkan ${parsed.length} produk dari file backup? Foto dan data produk akan diperbarui.`)) {
          return;
        }
        appState.products = parsed;
        await dbSaveAllProducts(parsed);
        saveStoredProducts(parsed);
        renderProducts();
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
        if (typeof renderPosProducts === 'function') renderPosProducts();
        updateCartUI();
        showToast(`✅ Berhasil memulihkan ${parsed.length} produk dari file backup!`);
      } else {
        alert('File backup tidak valid atau kosong.');
      }
    } catch (err) {
      alert('Gagal membaca file backup: ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}
window.importProductCatalogBackup = importProductCatalogBackup;

function resetAllSimulationTransactions() {
  if (!confirm('⚠️ Anda yakin ingin mengosongkan seluruh riwayat pesanan & kas simulasi?\n\n• Riwayat transaksi kasir dan mutasi kas akan dibersihkan\n• Foto dan data produk toko Anda TETAP AMAN dan TIDAK AKAN DIHAPUS.')) {
    return;
  }
  localStorage.removeItem('sr12_pos_transactions_v1');
  localStorage.removeItem('sr12_customer_orders');
  localStorage.removeItem('sr12_cashflow_records_v1');
  localStorage.removeItem('sr12_stock_mutations_v1');
  localStorage.removeItem('sr12_cart');
  if (typeof appState !== 'undefined') {
    appState.transactions = [];
    appState.cashflow = [];
    appState.cart = [];
    appState.posCart = [];
  }
  if (typeof renderPosTransactions === 'function') renderPosTransactions();
  if (typeof renderCashflowTable === 'function') renderCashflowTable();
  if (typeof updateCartUI === 'function') updateCartUI();
  if (typeof renderAdminOrdersModal === 'function') renderAdminOrdersModal();
  if (typeof updateAdminNotificationUI === 'function') updateAdminNotificationUI();
  showToast('🗑️ Riwayat transaksi simulasi berhasil dikosongkan. Foto produk tetap aman!');
}
window.resetAllSimulationTransactions = resetAllSimulationTransactions;

function resetAllAppData(confirmFirst = true) {
  if (confirmFirst && !confirm('⚠️ PERINGATAN: Kosongkan data transaksi dan sesi toko demo?\n\n• Toko demo akan dibersihkan kembali ke toko utama\n• Riwayat transaksi kasir dan kas masuk-keluar akan dikosongkan\n• KATALOG PRODUK & FOTO KEMASAN TETAP AMAN (TIDAK AKAN DIHAPUS).')) {
    return;
  }
  localStorage.removeItem('sr12_pos_transactions_v1');
  localStorage.removeItem('sr12_customer_orders');
  localStorage.removeItem('sr12_cashflow_records_v1');
  localStorage.removeItem('sr12_stock_mutations_v1');
  localStorage.removeItem('sr12_cashier_attendance_v1');
  localStorage.removeItem('sr12_active_cashier_shift_v1');
  localStorage.removeItem('sr12_active_cashier');
  localStorage.removeItem('sr12_distributor_session');
  localStorage.removeItem('sr12_cart');
  localStorage.removeItem('sr12_pending_store_apps_v2');
  
  // Reset daftar toko: Hanya tersisa platform pusat sr12-central (0 toko mitra aktif)
  const freshCentralStore = Object.assign({}, DEFAULT_PARTNER_STORES[0]);
  localStorage.setItem('sr12_partner_stores_v2', JSON.stringify([freshCentralStore]));
  // JANGAN PERNAH menimpa data produk atau menghapus foto hasil edit pengguna di sini!
  
  if (typeof appState !== 'undefined') {
    appState.transactions = [];
    appState.cashflow = [];
    appState.cart = [];
    appState.posCart = [];
    appState.pendingStoreApps = [];
    appState.partnerStores = [freshCentralStore];
    appState.storeSettings = Object.assign({}, freshCentralStore);
    appState.currentStoreSlug = 'sr12-central';
    // appState.products tetap aman!
    appState.activeCashier = {
      name: 'Administrator Pusat',
      storeSlug: 'sr12-central',
      shift: 'Shift Pagi (08:00 - 15:00)',
      clockInTime: '08:00 WIB',
      openingCash: 100000,
      trxCount: 0,
      totalSales: 0,
      cashSales: 0,
      nonCashSales: 0,
      status: 'Aktif'
    };
    appState.isAdminMode = false;
    appState.isDistributorLoggedIn = false;
  }

  if (typeof loadStoreBySlug === 'function') loadStoreBySlug('sr12-central');
  if (typeof updateOlseraHeaderMeta === 'function') updateOlseraHeaderMeta();
  if (typeof renderProducts === 'function') renderProducts();
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderPosProducts === 'function') renderPosProducts();
  if (typeof renderPosTransactions === 'function') renderPosTransactions();
  if (typeof renderCashflowTable === 'function') renderCashflowTable();
  if (typeof renderReportsView === 'function') renderReportsView();
  if (typeof renderStoreDropdown === 'function') renderStoreDropdown();
  if (typeof updateCartUI === 'function') updateCartUI();
  if (typeof showToast === 'function') showToast('✨ Data simulasi transaksi berhasil dikosongkan! Foto & katalog produk tetap aman.');
}
window.resetAllAppData = resetAllAppData;

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
  const stored = localStorage.getItem('sr12_distributor_mitra_v2');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        return list;
      }
    } catch (e) {}
  }
  const oldStored = localStorage.getItem('sr12_distributor_resellers_v1');
  if (oldStored) {
    try {
      const old = JSON.parse(oldStored);
      if (Array.isArray(old)) {
        saveStoredMitra(old, false);
        return old;
      }
    } catch (e) {}
  }
  return [];
}

function saveStoredMitra(mitraList, syncCloud = true) {
  if (!Array.isArray(mitraList)) return;
  // 1. Simpan ke LocalStorage
  try {
    localStorage.setItem('sr12_distributor_mitra_v2', JSON.stringify(mitraList));
    localStorage.setItem('sr12_distributor_resellers_v1', JSON.stringify(mitraList));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  // 2. Simpan permanen ke IndexedDB (Anti-Reset & Kapasitas Besar)
  if (typeof dbSaveAllMitra === 'function') {
    dbSaveAllMitra(mitraList);
  }

  // 3. Sinkronisasi otomatis ke Supabase Cloud jika online
  if (syncCloud && typeof saveMitraToSupabase === 'function') {
    const slug = (typeof appState !== 'undefined' && appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
    mitraList.forEach(m => {
      saveMitraToSupabase(m, slug);
    });
  }
}

function getStoredResellers() {
  return getStoredMitra();
}

function saveStoredResellers(resellers) {
  saveStoredMitra(resellers);
}

function getStoredMarketerSales() {
  const stored = localStorage.getItem('sr12_marketer_sales_v1');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        return list;
      }
    } catch (e) {}
  }
  return [];
}

function saveStoredMarketerSales(sales, syncCloud = true) {
  if (!Array.isArray(sales)) return;
  // 1. Simpan ke LocalStorage
  try {
    localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify(sales));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  // 2. Simpan permanen ke IndexedDB
  if (typeof dbSaveAllMarketerSales === 'function') {
    dbSaveAllMarketerSales(sales);
  }

  // 3. Sinkronisasi otomatis ke Supabase Cloud jika online
  if (syncCloud && typeof saveMarketerSaleToSupabase === 'function') {
    const slug = (typeof appState !== 'undefined' && appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
    sales.forEach(s => {
      saveMarketerSaleToSupabase(s, slug);
    });
  }
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
  isDistributorLoggedIn: false,
  isDevMasterLoggedIn: false,
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
  return 'Rp\u00A0' + Number(amount || 0).toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Sesi Simulasi Bersih Baru: hanya bersihkan jika belum pernah diinisialisasi DAN belum ada toko buatan user
  if (localStorage.getItem('sr12_clean_slate_sim_v5') !== 'ready') {
    const customStores = getStoredPartnerStores().filter(s => s.slug !== 'sr12-central');
    if (customStores.length === 0) {
      clearAllDummyData(true);
    }
    localStorage.setItem('sr12_clean_slate_sim_v5', 'ready');
  }
  appState.partnerStores = getStoredPartnerStores().filter(s => s && s.slug && s.slug !== 'toko-supa-distributor' && !s.slug.startsWith('deleted_') && !s.slug.includes('toko-supa'));
  saveStoredPartnerStores(appState.partnerStores);

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

  // SINKRONISASI RESMI DARI SUPABASE CLOUD SEBELUM PENENTUAN TOKO & RENDER DIREKTORI:
  // Memastikan semua toko mitra resmi yang aktif (seperti Alzam Agency) langsung terdaftar di Direktori Central Hub sejak render awal!
  if (typeof syncStoresFromSupabase === 'function') {
    try {
      const cloudStores = await syncStoresFromSupabase();
      if (Array.isArray(cloudStores)) {
        const deletedSlugs = getDeletedStoreSlugs();
        const cloudSlugs = new Set(cloudStores.map(s => s.slug));

        // Bersihkan toko lokal usang/sampah yang tidak ada di Supabase Cloud (agar Laptop & HP sinkron 100%)
        appState.partnerStores = (appState.partnerStores || []).filter(localStore => {
          if (!localStore || !localStore.slug) return false;
          if (localStore.slug === 'sr12-central') return true;
          if (deletedSlugs.includes(localStore.slug)) return false;
          return cloudSlugs.has(localStore.slug);
        });

        cloudStores.forEach(apiStore => {
          if (!apiStore || !apiStore.slug || apiStore.slug === 'sr12-central' || apiStore.slug === 'toko-supa-distributor' || apiStore.slug.startsWith('deleted_') || apiStore.slug.includes('toko-supa') || deletedSlugs.includes(apiStore.slug)) return;
          const idx = appState.partnerStores.findIndex(s => s.slug === apiStore.slug);
          if (idx >= 0) {
            appState.partnerStores[idx] = Object.assign({}, appState.partnerStores[idx], apiStore);
          } else {
            appState.partnerStores.push(apiStore);
          }
        });
        saveStoredPartnerStores(appState.partnerStores);
      }
    } catch(bootFetchErr) {
      console.warn('Boot store fetch warning:', bootFetchErr);
    }
  }

  const initSlug = getInitialStoreSlug(appState.partnerStores);
  loadStoreBySlug(initSlug);

  // Pastikan URL di address bar browser selalu mencantumkan parameter toko (?store=...) tanpa menghapus parameter produk (?product=...) di toko mitra
  const bootParams = new URLSearchParams(window.location.search);
  let bootParamsChanged = false;
  if (!bootParams.has('store')) {
    bootParams.set('store', initSlug);
    bootParamsChanged = true;
  }
  if (initSlug === 'sr12-central') {
    if (bootParams.has('product') || bootParams.has('p') || bootParams.has('prod') || bootParams.has('id')) {
      bootParams.delete('product');
      bootParams.delete('p');
      bootParams.delete('prod');
      bootParams.delete('id');
      bootParamsChanged = true;
    }
  }
  if (bootParamsChanged) {
    window.history.replaceState({ store: initSlug }, '', window.location.pathname + '?' + bootParams.toString());
  }

  // DEFAULT: Selalu mulai dari MODE PEMBELI UMUM (BERSIH) saat membuka tautan toko!
  // Mode Pemilik Toko hanya aktif jika pemilik secara eksplisit login di tab ini (sessionStorage)
  // atau secara eksplisit meminta mode admin lewat ?admin=1
  const urlParamsCheck = new URLSearchParams(window.location.search);
  const wantsAdmin = urlParamsCheck.get('admin') === '1' || urlParamsCheck.get('mode') === 'admin';
  const savedDistributorSession = sessionStorage.getItem('sr12_distributor_session') || localStorage.getItem('sr12_distributor_session');

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
  updateViewModeUI();

  // Sinkronisasi otomatis dua arah (Client <-> Server API)
  syncStoresWithServer();
  syncPendingStoresWithServer();

  // Real-time synchronization interval (tiap 3 detik) & saat tab browser difokuskan
  setInterval(() => {
    syncStoresWithServer();
    syncPendingStoresWithServer();
  }, 3000);

  window.addEventListener('focus', () => {
    syncStoresWithServer();
    syncPendingStoresWithServer();
  });

  // Listener WebSocket Cloud Instan: Ketika ada perubahan toko/antrean di HP/Laptop lain, langsung sinkron seketika
  if (typeof subscribeToStoreChanges === 'function') {
    try {
      subscribeToStoreChanges(() => {
        syncStoresWithServer();
        syncPendingStoresWithServer();
      });
    } catch(subErr) {
      console.warn('Realtime subscription trigger error:', subErr);
    }
  }
  renderTierQuickBanner();
  renderProducts();
  if (typeof syncProductsWithIndexedDB === 'function') {
    syncProductsWithIndexedDB();
  }
  handleDirectProductDeepLink();
  renderRewards();
  renderMarketingKits();
  // Memuat data tersimpan Mitra & Marketer (LocalStorage + IndexedDB permanen)
  appState.mitraList = getStoredMitra();
  appState.resellers = appState.mitraList;
  appState.marketerSales = getStoredMarketerSales();
  if (typeof syncMitraWithIndexedDB === 'function') {
    syncMitraWithIndexedDB();
  }
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

  // Pulihkan sesi Developer Super Admin jika sebelumnya aktif
  try {
    const devSession = localStorage.getItem('sr12_dev_session');
    if (devSession === 'active' && window.innerWidth > 768) {
      appState.isDevMasterLoggedIn = true;
      const devStrip = document.getElementById('devPreviewStrip');
      if (devStrip) {
        devStrip.style.display = 'flex';
        const stripName = document.getElementById('devStripStoreName');
        const stripQuota = document.getElementById('devStripOrderQuota');
        if (stripName) stripName.textContent = (appState.storeSettings && appState.storeSettings.storeName) || 'Toko Aktif';
        if (stripQuota) stripQuota.textContent = typeof appState.storeSettings?.orderQuota === 'number' ? appState.storeSettings.orderQuota : 10;
      }
      const devFab = document.getElementById('devFloatingFab');
      if (devFab) devFab.style.display = 'flex';
    }
  } catch(e) {}

  // Pulihkan tampilan aktif (Portal Olsera vs Storefront Pembeli) saat refresh
  const savedViewMode = localStorage.getItem('sr12_active_view_mode');
  const validOlseraTabs = ['pos', 'transactions', 'inventory', 'cashflow', 'reports', 'mitra', 'pending', 'marketer', 'settings'];
  const hashTab = window.location.hash ? window.location.hash.replace('#', '').toLowerCase() : '';
  const isOlseraHash = validOlseraTabs.includes(hashTab);
  const savedOlseraTab = localStorage.getItem('sr12_active_olsera_tab');
  const targetOlseraTab = isOlseraHash ? hashTab : (validOlseraTabs.includes(savedOlseraTab) ? savedOlseraTab : 'pos');

  const shouldOpenPortal = (appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn) && 
    (savedViewMode === 'portal' || isOlseraHash || wantsAdmin);

  if (shouldOpenPortal) {
    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(true);
      if (typeof switchOlseraTab === 'function') {
        switchOlseraTab(targetOlseraTab);
      }
    }
  } else {
    if (!appState.isAdminMode && !appState.isDevMasterLoggedIn) {
      if (typeof showDistributorPortalView === 'function') {
        showDistributorPortalView(false);
      }
    }
  }

  // Inisialisasi pengontrol gestur geser & penahan scroll latar belakang untuk seluruh modal
  if (typeof initUniversalModalGestures === 'function') {
    initUniversalModalGestures();
  }
  if (typeof initGlobalEdgeSwipeBackGesture === 'function') {
    initGlobalEdgeSwipeBackGesture();
  }
});

function loadStoreBySlug(slug) {
  const found = appState.partnerStores.find(s => s.slug === slug) || appState.partnerStores[0];
  appState.currentStoreSlug = found.slug;
  appState.storeSettings = Object.assign({}, found);
  applyStoreTheme(found.storeTheme || 'emerald');
  renderStoreBranding();
  // Default standar tampilan harga untuk pembeli/katalog toko selalu Konsumen (HET)
  setTier('konsumen', true);
  const select = document.getElementById('activeStoreSelect');
  if (select) select.value = found.slug;
  const devSelect = document.getElementById('devStoreSelect');
  if (devSelect) devSelect.value = found.slug;
  renderStoreDropdown();
  updateStoreQuotaUI();
  updateViewModeUI();
  if (typeof updateOlseraHeaderMeta === 'function') {
    updateOlseraHeaderMeta();
  }
  if (found.slug !== 'sr12-central' && typeof handleDirectProductDeepLink === 'function') {
    handleDirectProductDeepLink();
  }
}

function switchPartnerStore(slug) {
  // Re-evaluasi sesi distributor saat berpindah toko:
  // Hanya aktifkan admin jika toko tujuan benar-benar memiliki sesi login yang valid
  const savedDistributorSession = localStorage.getItem('sr12_distributor_session');
  if (savedDistributorSession) {
    try {
      const parsedSession = JSON.parse(savedDistributorSession);
      if (parsedSession && parsedSession.slug === slug) {
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

  // Tutup semua modal dan buka kunci scroll jika berpindah toko
  document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  if (typeof ensureScrollUnlocked === 'function') ensureScrollUnlocked();

  loadStoreBySlug(slug);
  const switchParams = new URLSearchParams(window.location.search);
  switchParams.set('store', slug);
  if (slug === 'sr12-central') {
    switchParams.delete('product');
    switchParams.delete('p');
    switchParams.delete('prod');
    switchParams.delete('id');
  }
  const newUrl = window.location.pathname + '?' + switchParams.toString();
  window.history.pushState({ store: slug }, '', newUrl);
  if (typeof updateDistributorPendingBadges === 'function') {
    updateDistributorPendingBadges();
  }
  showToast(`🏪 Berhasil beralih ke: "${appState.storeSettings.storeName}"!`);
}

function renderStoreDropdown() {
  const curStore = appState.storeSettings || {};
  const tierObj = SR12_TIERS[curStore.partnerTier] || SR12_TIERS.distributor;

  // Update public exclusive store badge
  const publicBadge = document.getElementById('activeStorePublicBadge');
  if (publicBadge) {
    const cleanCity = (curStore.storeCity || 'Mitra').split('(')[0].trim();
    publicBadge.innerHTML = `<span style="color: #38bdf8; font-weight: 800;">${curStore.storeName || 'SR12 Store'}</span> <span style="color: #94a3b8; font-size: 0.7rem; font-weight: 600;">(${cleanCity})</span>`;
  }

  // Update Dev Portal Store Switcher
  const devSelect = document.getElementById('devStoreSelect');
  if (devSelect) {
    devSelect.innerHTML = appState.partnerStores.map(s => {
      const t = SR12_TIERS[s.partnerTier]?.name || 'Mitra';
      return `<option value="${s.slug}" ${s.slug === appState.currentStoreSlug ? 'selected' : ''}>${s.storeName} (${t} - ${s.storeCity})</option>`;
    }).join('');
  }

  // Update Dev Workspace Store Switcher
  const devSelectWs = document.getElementById('devStoreSelect_ws');
  if (devSelectWs) {
    devSelectWs.innerHTML = appState.partnerStores.map(s => {
      const t = SR12_TIERS[s.partnerTier]?.name || 'Mitra';
      return `<option value="${s.slug}" ${s.slug === appState.currentStoreSlug ? 'selected' : ''}>${s.storeName} (${t} - ${s.storeCity})</option>`;
    }).join('');
  }

  // Update legacy activeStoreSelect if present
  const select = document.getElementById('activeStoreSelect');
  if (select) {
    select.innerHTML = appState.partnerStores.map(s => {
      return `<option value="${s.slug}" ${s.slug === appState.currentStoreSlug ? 'selected' : ''}>${s.storeName} (${SR12_TIERS[s.partnerTier]?.name || 'Mitra'})</option>`;
    }).join('');
  }
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


function getMockRecommendationSvgUrl(applicantName, distributorName, recCode, storeName) {
  const safeApp = (applicantName || 'CALON MITRA').toUpperCase();
  const safeDist = (distributorName || 'DISTRIBUTOR RESMI').toUpperCase();
  const safeCode = recCode || 'REK-DIST-2026-001';
  const safeStore = (storeName || 'TOKO RESMI').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="100%" height="100%" style="font-family:'Arial',sans-serif;background:#fff;border-radius:10px;">
    <rect width="100%" height="100%" fill="#ffffff" stroke="#2563eb" stroke-width="8" rx="10"/>
    <rect x="15" y="15" width="570" height="390" fill="none" stroke="#93c5fd" stroke-width="2" stroke-dasharray="6 4" rx="8"/>
    
    <text x="300" y="52" text-anchor="middle" font-size="16" font-weight="900" fill="#1e3a8a" letter-spacing="1">SURAT REKOMENDASI KEMITRAAN RESMI</text>
    <text x="300" y="70" text-anchor="middle" font-size="9.5" font-weight="700" fill="#64748b">JARINGAN DISTRIBUTOR RESMI PT. SR12 HERBAL PERKASA</text>
    <line x1="60" y1="84" x2="540" y2="84" stroke="#cbd5e1" stroke-width="1.5"/>

    <text x="300" y="108" text-anchor="middle" font-size="10" font-weight="800" fill="#2563eb">Nomor Surat Rekomendasi: ${safeCode}</text>

    <text x="60" y="140" font-size="10.5" fill="#475569">Yang bertanda tangan di bawah ini:</text>
    <text x="60" y="160" font-size="11" font-weight="800" fill="#0f172a">Distributor Pemberi Rekomendasi : <tspan fill="#1e40af">${safeDist}</tspan></text>
    
    <text x="60" y="195" font-size="10.5" fill="#475569">Dengan ini memberikan REKOMENDASI RESMI &amp; PENUH kepada:</text>
    <text x="60" y="218" font-size="11" font-weight="800" fill="#0f172a">Nama Calon Pemilik : <tspan fill="#059669">${safeApp}</tspan></text>
    <text x="60" y="238" font-size="11" font-weight="800" fill="#0f172a">Nama Toko Mitra    : <tspan fill="#059669">${safeStore}</tspan></text>

    <text x="60" y="272" font-size="10" fill="#334155">Untuk diangkat dan disetujui pembukaan toko resmi di aplikasi SR12-Ku Pro.</text>
    <text x="60" y="288" font-size="10" fill="#334155">Seluruh pemenuhan stok &amp; pembinaan produk akan dinaungi oleh Distributor tersebut.</text>

    <rect x="60" y="315" width="480" height="38" rx="6" fill="#eff6ff" stroke="#bfdbfe"/>
    <text x="300" y="339" text-anchor="middle" font-size="10" font-weight="900" fill="#1e40af">STATUS: REKOMENDASI TERVERIFIKASI SAH OLEH DISTRIBUTOR RESMI</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
window.getMockRecommendationSvgUrl = getMockRecommendationSvgUrl;

function populateRecommenderDistributors() {
  const select = document.getElementById('regRecommenderDistributorSelect');
  if (!select) return;

  const activeDistributors = (appState.partnerStores || []).filter(s => s.slug !== 'sr12-central' && s.partnerTier === 'distributor');

  let html = '';
  if (activeDistributors.length > 0) {
    html += '<option value="" disabled selected>-- Pilih Toko Distributor Resmi Terdaftar --</option>';
    activeDistributors.forEach(dist => {
      const city = (dist.storeCity || 'Indonesia').split('(')[0].trim();
      html += `<option value="${dist.slug}">👑 ${dist.storeName} (${city} - ${dist.storeOwner})</option>`;
    });
    html += '<option value="manual">➕ Distributor Lain (Input Manual Nama &amp; No. WA)</option>';
  } else {
    html += '<option value="manual" selected>Distributor Belum Terdaftar di Web (Input Manual Nama &amp; WA)</option>';
  }
  select.innerHTML = html;
  handleRecommenderDistributorChange(select.value);
}

function handleRecommenderDistributorChange(val) {
  const manualFields = document.getElementById('regRecommenderManualFields');
  if (manualFields) {
    manualFields.style.display = (val === 'manual') ? 'block' : 'none';
  }
}

function handleRegStoreTierChange(tier) {
  const recSection = document.getElementById('regDistributorRecommendationSection');
  const skTitle = document.getElementById('regSkSectionTitle');
  const skInput = document.getElementById('regSkNumber');

  if (tier === 'distributor') {
    if (recSection) recSection.style.display = 'none';
    if (skTitle) skTitle.innerHTML = '<span>📜</span> 2. Dokumen SK Distributor Resmi (Dari Kantor Pusat SR12):';
    if (skInput) skInput.placeholder = 'Contoh: SK-DIST-SR12-2026-001';
  } else {
    if (recSection) recSection.style.display = 'block';
    populateRecommenderDistributors();
    const tierName = tier === 'agen' ? 'Agen Resmi' : (tier === 'sub_agen' ? 'Sub Agen' : (tier === 'marketer' ? 'Marketer' : 'Reseller Resmi'));
    if (skTitle) skTitle.innerHTML = `<span>📜</span> 2. Dokumen SK / Kontrak ${tierName} SR12:`;
    if (skInput) skInput.placeholder = `Contoh: SK-${tier.toUpperCase()}-SR12-2026-001`;
  }
}
window.populateRecommenderDistributors = populateRecommenderDistributors;
window.handleRecommenderDistributorChange = handleRecommenderDistributorChange;
window.handleRegStoreTierChange = handleRegStoreTierChange;

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

  // Recommendation fields reset
  appState.tempRegRecBase64 = null;
  appState.tempRegRecDocName = null;
  const recFileInput = document.getElementById('regRecommendationFileInput');
  if (recFileInput) recFileInput.value = '';
  const recCodeInput = document.getElementById('regRecommendationCode');
  if (recCodeInput) recCodeInput.value = '';
  const recManualName = document.getElementById('regRecommenderManualName');
  if (recManualName) recManualName.value = '';
  const recManualWa = document.getElementById('regRecommenderManualWa');
  if (recManualWa) recManualWa.value = '';
  const recPreviewBox = document.getElementById('regRecommendationPreviewBox');
  if (recPreviewBox) recPreviewBox.style.display = 'none';

  const tierSelect = document.getElementById('regStoreTier');
  if (tierSelect) {
    tierSelect.value = 'distributor';
    handleRegStoreTierChange('distributor');
  }

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
    alert('Mohon masukkan Nomor SK Resmi atau Nomor Kontrak SR12 Anda untuk verifikasi keabsahan!');
    const skInput = document.getElementById('regSkNumber');
    if (skInput) skInput.focus();
    return;
  }

  // Validasi Wajib Rekomendasi Distributor untuk Agen dan Kemitraan di Bawahnya
  const recSelect = document.getElementById('regRecommenderDistributorSelect');
  const recCode = document.getElementById('regRecommendationCode')?.value.trim() || '';
  const recManualName = document.getElementById('regRecommenderManualName')?.value.trim() || '';
  const recManualWa = document.getElementById('regRecommenderManualWa')?.value.trim() || '';

  let recommenderDistributor = '';
  let recommenderWa = '';
  let recommenderSlug = '';

  if (tier !== 'distributor') {
    if (recSelect && recSelect.value && recSelect.value !== 'manual') {
      const foundDist = (appState.partnerStores || []).find(s => s.slug === recSelect.value);
      if (foundDist) {
        recommenderDistributor = foundDist.storeName;
        recommenderWa = foundDist.storeWaNumber;
        recommenderSlug = foundDist.slug;
      }
    } else {
      if (!recManualName || !recManualWa) {
        alert('⚠️ PERHATIAN:\n\nUntuk pembukaan toko tingkat Agen, Sub Agen, atau Reseller, Anda WAJIB menyertakan Nama & Nomor WhatsApp Distributor Resmi SR12 pemberi rekomendasi!');
        if (document.getElementById('regRecommenderManualName')) document.getElementById('regRecommenderManualName').focus();
        return;
      }
      recommenderDistributor = recManualName;
      recommenderWa = recManualWa;
      recommenderSlug = 'manual';
    }

    if (!recCode) {
      alert('Mohon masukkan Nomor atau Kode Surat Rekomendasi dari Distributor Anda!');
      const codeInput = document.getElementById('regRecommendationCode');
      if (codeInput) codeInput.focus();
      return;
    }
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
    recommenderDistributor: recommenderDistributor,
    recommenderWa: recommenderWa,
    recommenderSlug: recommenderSlug,
    recommendationCode: recCode,
    recommendationDocUrl: appState.tempRegRecBase64 || '',
    recommendationDocName: appState.tempRegRecDocName || (recCode ? `Surat_Rekomendasi_${recCode}.pdf` : ''),
    notes: notes,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  if (!appState.pendingStoreApps) appState.pendingStoreApps = [];
  appState.pendingStoreApps.unshift(newApp);
  saveStoredPendingStores(appState.pendingStoreApps);

  // Sinkronisasi otomatis ke server database API (jika lokal) & Supabase Cloud
  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    fetch(apiBase + '/api/pending-stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    }).catch(e => console.warn('Could not POST /api/pending-stores:', e));
  }

  if (typeof savePendingStoreToSupabase === 'function') {
    savePendingStoreToSupabase(newApp);
  }

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

  appState.lastSubmittedPendingAppId = app.id;

  if (modal) modal.classList.add('open');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let currentDocZoomScale = 1.0;
let currentActiveDocUrl = '';
let currentActiveDocName = '';

function openDocumentFullscreenViewer(docUrl, title, fileName) {
  if (!docUrl) return;
  currentActiveDocUrl = docUrl;
  currentActiveDocName = fileName || 'Dokumen_SK_SR12.svg';
  currentDocZoomScale = 1.0;

  const modal = document.getElementById('modalDocFullscreenViewer');
  const titleEl = document.getElementById('docFullscreenTitle');
  const subEl = document.getElementById('docFullscreenSubtitle');
  const bodyEl = document.getElementById('docFullscreenBody');
  const downloadBtn = document.getElementById('btnDocFullscreenDownload');

  if (titleEl) titleEl.textContent = title || 'Pratinjau Dokumen Resmi';
  if (subEl) subEl.textContent = currentActiveDocName;

  if (downloadBtn) {
    downloadBtn.onclick = () => downloadDocumentDirectly(currentActiveDocUrl, currentActiveDocName);
  }

  const isPdf = (typeof docUrl === 'string' && (docUrl.startsWith('data:application/pdf') || docUrl.toLowerCase().includes('.pdf'))) || 
                (currentActiveDocName && currentActiveDocName.toLowerCase().endsWith('.pdf'));

  if (bodyEl) {
    if (isPdf) {
      bodyEl.innerHTML = `
        <div style="width: 100%; height: 100%; min-height: 480px; display: flex; flex-direction: column;">
          <iframe src="${docUrl}" style="width: 100%; height: 100%; min-height: 480px; border: none; border-radius: 8px; background: #fff;" title="Pratinjau Dokumen PDF"></iframe>
        </div>
      `;
    } else {
      bodyEl.innerHTML = `
        <div id="docZoomWrapper" style="display: flex; justify-content: center; align-items: center; width: 100%; min-height: 100%; transition: transform 0.15s ease; transform-origin: top center;">
          <img id="docFullscreenImage" src="${docUrl}" alt="Dokumen Resmi" style="max-width: 100%; max-height: 82vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); background: #ffffff;">
        </div>
      `;
    }
  }

  if (modal) {
    modal.classList.add('open');
  }
}
window.openDocumentFullscreenViewer = openDocumentFullscreenViewer;

function zoomDocFullscreen(delta) {
  const wrapper = document.getElementById('docZoomWrapper');
  if (!wrapper) return;
  if (delta === 0) {
    currentDocZoomScale = 1.0;
  } else {
    currentDocZoomScale = Math.max(0.5, Math.min(3.0, currentDocZoomScale + delta));
  }
  wrapper.style.transform = `scale(${currentDocZoomScale})`;
}
window.zoomDocFullscreen = zoomDocFullscreen;

function downloadDocumentDirectly(docUrl, fileName) {
  if (!docUrl) return;
  try {
    if (docUrl.startsWith('data:')) {
      const parts = docUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/svg+xml';
      let blob;
      if (parts[0].includes('base64')) {
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        const decoded = decodeURIComponent(parts[1]);
        blob = new Blob([decoded], { type: mimeType });
      }
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || (mimeType.includes('pdf') ? 'Dokumen_SK_SR12.pdf' : 'Dokumen_SK_SR12.svg');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      showToast('📥 Berkas dokumen berhasil diunduh!');
      return;
    }
    const a = document.createElement('a');
    a.href = docUrl;
    a.download = fileName || 'Dokumen_SK_SR12.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error('Download error:', e);
    showToast('⚠️ Gagal mengunduh dokumen.');
  }
}
window.downloadDocumentDirectly = downloadDocumentDirectly;

function renderSinglePreviewSkDocument(app) {
  const containerEl = document.getElementById('previewSkContainer');
  if (!containerEl || !app) return;

  const docUrl = app.skDocUrl || app.ktpDocUrl || getMockSkSvgUrl(app.storeOwner, app.nikNumber, app.storeName, app.skNumber, app.storeCity);
  const docName = app.skDocName || `Dokumen_Kemitraan_${(app.storeName || 'SR12').replace(/\s+/g, '_')}.pdf`;
  const isPdf = (typeof docUrl === 'string' && (docUrl.startsWith('data:application/pdf') || docUrl.toLowerCase().includes('.pdf'))) || 
                (docName && docName.toLowerCase().endsWith('.pdf'));

  window.__activePreviewDocUrl = docUrl;
  window.__activePreviewDocName = docName;
  window.__activePreviewDocTitle = `Dokumen Kemitraan: ${app.storeName || 'SR12'}`;

  if (isPdf) {
    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #0284c7; border-radius: 10px; overflow: hidden; background: #0b1329; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
            <span>📄</span>
            <span>Berkas PDF Terpadu: <b style="color: #fff; font-family: monospace;">${escapeHtml(docName)}</b></span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" style="color: #fff; background: #0284c7; border: none; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);">
              <span>🔍</span> Buka Layar Penuh
            </button>
            <button type="button" onclick="downloadDocumentDirectly(window.__activePreviewDocUrl, window.__activePreviewDocName)" style="color: #bae6fd; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
              <span>📥</span> Download
            </button>
          </div>
        </div>
        <div style="padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; max-height: 440px; background: #020617;">
          <iframe src="${docUrl}" style="width: 100%; height: 340px; border: 1px solid #334155; border-radius: 6px; background: #ffffff;" title="Pratinjau Dokumen PDF Resmi"></iframe>
          <div style="margin-top: 8px; font-size: 0.73rem; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
            <span>💡 <i>Gunakan tombol <b>Buka Layar Penuh</b> untuk melihat tampilan besar dan zoom in/out.</i></span>
          </div>
        </div>
        <div style="padding: 10px 14px; background: rgba(14, 165, 233, 0.1); border-top: 1px solid rgba(14, 165, 233, 0.2); font-size: 0.75rem; color: #bae6fd; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span>🏛️ <b>Status Dokumen:</b> 1 Bundel PDF Resmi (SK No: <code style="color: #fef08a;">${escapeHtml(app.skNumber || '-')}</code> &middot; NIK: <code style="color: #fff;">${escapeHtml(app.nikNumber || '-')}</code>)</span>
          <span style="background: #0369a1; color: #e0f2fe; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.7rem;">✓ File Terverifikasi</span>
        </div>
      </div>
    `;
  } else {
    // Gambar / Mock SVG
    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #059669; border-radius: 10px; overflow: hidden; background: #022c22; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 6px;">
            📜 Berkas Legalitas Resmi PT. SR12 &middot; <span style="font-family: monospace; color: #fef08a;">${escapeHtml(app.skNumber || '-')}</span>
          </span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" style="color: #34d399; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 6px; cursor: pointer;">
              🔍 Buka Layar Penuh
            </button>
            <button type="button" onclick="downloadDocumentDirectly(window.__activePreviewDocUrl, window.__activePreviewDocName)" style="color: #fff; background: #059669; border: none; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
              📥 Download
            </button>
          </div>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 260px; max-height: 420px; overflow: auto; background: #041f18;">
          <img src="${docUrl}" alt="Berkas SK Resmi" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" title="Klik untuk membuka layar penuh">
        </div>
        <div style="padding: 10px 14px; background: rgba(16, 185, 129, 0.1); border-top: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.75rem; color: #a7f3d0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span>🏛️ <b>Penerbit SK:</b> PT. SR12 Herbal Perkasa (Sah &amp; Tervalidasi Direksi)</span>
          <span style="color: #cbd5e1; font-size: 0.72rem; font-family: monospace;">${escapeHtml(docName)}</span>
        </div>
      </div>
    `;
  }
}

function switchPreviewDocTab(tabName) {
  const appId = appState.activePreviewAppId;
  const app = (appState.pendingStoreApps || []).find(a => a.id === appId);
  if (app) {
    renderSinglePreviewSkDocument(app);
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
    titleEl.innerHTML = `<span>📄</span> Verifikasi Dokumen Kemitraan: ${escapeHtml(app.storeName)} <small style="color: #94a3b8; font-size: 0.75rem;">(#${escapeHtml(app.id)})</small>`;
  }

  if (detailsEl) {
    detailsEl.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Nama Toko &amp; Calon Pemilik:</span>
          <b style="color: #f8fafc; font-size: 0.85rem;">${escapeHtml(app.storeName)}</b>
          <div style="color: #cbd5e1; font-size: 0.75rem;">👤 ${escapeHtml(app.storeOwner)} &middot; 📍 ${escapeHtml(app.storeCity)}</div>
          <div style="color: #38bdf8; font-size: 0.72rem; margin-top: 2px;">🪪 NIK: <span style="font-family: monospace; font-weight: 700;">${escapeHtml(app.nikNumber || '3374025804820003')}</span></div>
        </div>
        <div>
          <span style="color: #94a3b8; font-size: 0.72rem; display: block;">Level &amp; WhatsApp:</span>
          <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">${escapeHtml(tierObj.name)}</span>
          <div style="color: #4ade80; font-family: monospace; font-size: 0.75rem; margin-top: 2px;">📱 +${escapeHtml(app.storeWaNumber)}</div>
          <div style="color: #fbbf24; font-size: 0.72rem; margin-top: 2px;">📜 No. SK: <code style="font-family: monospace;">${escapeHtml(app.skNumber)}</code></div>
        </div>
      </div>
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <span style="background: #14532d; color: #4ade80; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ KTP Asli Terlampir</span>
          <span style="background: #1e3a8a; color: #60a5fa; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ SK PT. SR12 Valid</span>
          <span style="background: #0369a1; color: #e0f2fe; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ 1 Bundel PDF Lengkap</span>
        </div>
        <div style="color: #94a3b8; font-size: 0.7rem;">Waktu Masuk: ${dateFormatted}</div>
      </div>
      ${(app.recommenderDistributor) ? `
        <div style="margin-top: 8px; padding: 8px 10px; background: rgba(37, 99, 235, 0.15); border: 1.5px solid #3b82f6; border-radius: 6px; font-size: 0.76rem; color: #93c5fd;">
          👑 <b>Rekomendasi Distributor Resmi:</b> <span style="color: #fff; font-weight: 800;">${escapeHtml(app.recommenderDistributor)}</span> 
          &middot; Kode/No: <code style="color: #fbbf24; font-weight: 700;">${escapeHtml(app.recommendationCode || '-')}</code> 
          &middot; WA: <span style="color: #4ade80;">+${escapeHtml(app.recommenderWa || '-')}</span>
        </div>` : (app.partnerTier === 'distributor' ? '<div style="margin-top: 6px; font-size: 0.72rem; color: #94a3b8;">👑 <i>Level Distributor Utama: Verifikasi Langsung oleh Kantor Pusat SR12.</i></div>' : '')}
      ${app.notes ? `<div style="margin-top: 6px; font-size: 0.72rem; color: #cbd5e1; background: rgba(255,255,255,0.04); padding: 5px 8px; border-radius: 4px;">📝 <i>Catatan: ${escapeHtml(app.notes)}</i></div>` : ''}
    `;
  }

  // Tampilkan pratinjau dokumen berkas tunggal (PDF / sertifikat resmi)
  renderSinglePreviewSkDocument(app);

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
    recommenderDistributor: app.recommenderDistributor || '',
    recommenderWa: app.recommenderWa || '',
    recommenderSlug: app.recommenderSlug || '',
    recommendationCode: app.recommendationCode || '',
    feePayer: 'buyer',
    storeAdminPin: app.storeAdminPin || '1234',
    orderQuota: 15,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0,
    verifiedSkNumber: app.skNumber,
    approvedAt: new Date().toISOString()
  };

  appState.partnerStores.push(approvedStore);
  saveStoredPartnerStores(appState.partnerStores);

  // Sinkronisasi otomatis ke server database API & Supabase Cloud
  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    fetch(apiBase + '/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvedStore)
    }).catch(e => console.warn('Could not POST /api/stores:', e));

    fetch(apiBase + `/api/pending-stores/${appId}`, {
      method: 'DELETE'
    }).catch(e => console.warn('Could not DELETE /api/pending-stores:', e));
  }

  if (typeof saveStoreToSupabase === 'function') {
    saveStoreToSupabase(approvedStore);
  }
  if (typeof deletePendingStoreFromSupabase === 'function') {
    deletePendingStoreFromSupabase(appId);
  }

  // Jika merupakan toko Agen/Sub Agen di bawah Distributor aktif, otomatis daftarkan ke buku mitra distributor
  if (app.recommenderSlug && app.recommenderSlug !== 'manual') {
    const newMitra = {
      id: generateNextMitraId(app.partnerTier),
      store_slug: app.recommenderSlug,
      name: app.storeOwner,
      phone: app.storeWaNumber,
      city: app.storeCity,
      tier: app.partnerTier,
      status: 'active',
      qualificationDate: new Date().toISOString().slice(0, 10),
      lastOrderDate: new Date().toISOString().slice(0, 10),
      accumulatedSpent90Days: 0,
      totalOrdersCount: 0
    };
    if (!appState.mitraList) appState.mitraList = [];
    appState.mitraList.push(newMitra);
    saveStoredMitra(appState.mitraList);
  }

  // Close preview modal
  closeModal('modalPreviewSkDoc');

  // Refresh UI
  renderStoreDropdown();
  updateDevPortalMetrics();
  renderOfficialDistributorDirectory();
  if (typeof renderSwitchStoreModal === 'function') {
    renderSwitchStoreModal();
  }

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

  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    fetch(apiBase + `/api/pending-stores/${appId}`, {
      method: 'DELETE'
    }).catch(e => console.warn('Could not DELETE /api/pending-stores:', e));
  }

  if (typeof deletePendingStoreFromSupabase === 'function') {
    deletePendingStoreFromSupabase(appId);
  }

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

function updateDistributorPendingBadges() {
  const alertBox = document.getElementById('distributorPendingAlert');
  const alertCount = document.getElementById('distPendingAlertCount');
  const olseraBadge = document.getElementById('olseraPendingBadge');

  const curStore = appState.storeSettings || {};
  const currentSlug = curStore.slug || appState.currentStoreSlug || 'sr12-central';
  const isDistributor = curStore.partnerTier === 'distributor';

  // Toko yang sudah aktif di partnerStores tidak boleh dihitung lagi
  const activeSlugs = new Set((appState.partnerStores || []).map(s => s.slug));
  const unapprovedApps = (appState.pendingStoreApps || []).filter(a => {
    return !activeSlugs.has(a.slug) && a.status !== 'approved';
  });

  // HANYA MUNCUL JIKA:
  // 1. Toko yang sedang aktif dibuka adalah Toko DISTRIBUTOR (Bukan Toko Agen seperti Iyoutique!)
  // 2. Calon agen memilih toko distributor ini sebagai pembina (recommenderSlug === currentSlug)
  // 3. Hanya muncul jika sedang mode Admin / Distributor login / Developer
  const isAuthorized = appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn;

  const relevantApps = unapprovedApps.filter(a => {
    if (!isDistributor && !appState.isDevMasterLoggedIn) return false;
    return a.recommenderSlug === currentSlug || (currentSlug === 'alzam-agency' && (a.recommenderDistributor || '').toLowerCase().includes('alzam'));
  });

  if (alertBox) {
    if (isAuthorized && isDistributor && relevantApps.length > 0) {
      alertBox.style.display = 'block';
      if (alertCount) alertCount.textContent = relevantApps.length;
    } else {
      alertBox.style.display = 'none';
    }
  }

  if (olseraBadge) {
    if (isAuthorized && isDistributor && relevantApps.length > 0) {
      olseraBadge.style.display = 'inline-block';
      olseraBadge.textContent = `${relevantApps.length} Baru`;
    } else {
      olseraBadge.style.display = 'none';
    }
  }
}
window.updateDistributorPendingBadges = updateDistributorPendingBadges;

function openDistributorPendingStoresModal() {
  const modal = document.getElementById('modalDistributorPendingStores');
  const mount = document.getElementById('distributorPendingStoresContainer');
  if (!modal || !mount) return;

  const curStore = appState.storeSettings || {};
  const currentSlug = curStore.slug || appState.currentStoreSlug || 'sr12-central';
  const isDistributor = curStore.partnerTier === 'distributor';

  const activeSlugs = new Set((appState.partnerStores || []).map(s => s.slug));
  const unapprovedApps = (appState.pendingStoreApps || []).filter(a => {
    return !activeSlugs.has(a.slug) && a.status !== 'approved';
  });

  const apps = unapprovedApps.filter(a => {
    if (!isDistributor && !appState.isDevMasterLoggedIn) return false;
    return a.recommenderSlug === currentSlug || (currentSlug === 'alzam-agency' && (a.recommenderDistributor || '').toLowerCase().includes('alzam'));
  });

  if (apps.length === 0) {
    mount.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; color: #64748b;">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">✨</span>
        <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 1rem; font-weight: 800;">Tidak Ada Pengajuan Menunggu</h4>
        <p style="margin: 0; font-size: 0.82rem;">Semua permohonan pembukaan toko Agen untuk toko Anda telah diverifikasi &amp; disetujui.</p>
      </div>
    `;
  } else {
    mount.innerHTML = apps.map(app => {
      const tierObj = SR12_TIERS[app.partnerTier] || SR12_TIERS.agen || SR12_TIERS.distributor;
      return `
        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 18px; margin-bottom: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h4 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">${app.storeName}</h4>
                <span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 800;">
                  👑 ${tierObj.name.toUpperCase()} (DISKON 40%)
                </span>
                <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; font-weight: 800;">
                  ⏳ Menunggu Persetujuan Anda
                </span>
              </div>
              <div style="font-size: 0.8rem; color: #475569; margin-top: 6px;">
                👤 Calon Pemilik: <b>${app.storeOwner}</b> &bull; 📍 Wilayah: <b>${app.storeCity}</b>
              </div>
              <div style="font-size: 0.78rem; color: #059669; font-weight: 700; margin-top: 2px;">
                📱 WhatsApp: +${app.storeWaNumber}
              </div>
              ${app.skNumber ? `<div style="font-size: 0.76rem; color: #0369a1; font-family: monospace; font-weight: 700; margin-top: 4px;">📜 No. SK / Kontrak: ${app.skNumber}</div>` : ''}
              ${app.notes ? `<div style="font-size: 0.76rem; color: #475569; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 6px 10px; margin-top: 8px;">💬 Catatan Pemohon: <i>"${app.notes}"</i></div>` : ''}
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" onclick="contactApplicantWA('${app.id}')" style="background: #25d366; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.25);">
                <span>💬</span> Chat WhatsApp
              </button>
              <button type="button" onclick="previewSkDocument('${app.id}')" style="background: #0284c7; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);">
                <span>📄</span> Cek Dokumen SK
              </button>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px; flex-wrap: wrap;">
            <button type="button" onclick="rejectPendingStore('${app.id}'); openDistributorPendingStoresModal(); updateDistributorPendingBadges();" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
              ❌ Tolak Pengajuan
            </button>
            <button type="button" onclick="approvePendingStore('${app.id}'); closeModal('modalDistributorPendingStores'); updateDistributorPendingBadges();" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 9px 22px; border-radius: 8px; font-weight: 800; font-size: 0.84rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
              <span>✅</span> Setujui &amp; Aktifkan Toko Agen Ini
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  document.body.classList.add('modal-open');
  modal.classList.add('open');
}
window.openDistributorPendingStoresModal = openDistributorPendingStoresModal;

function openShareStoreModal() {
  if (!appState.isDistributorLoggedIn && !appState.isAdminMode) {
    showToast('🔒 Fitur Link Khusus Mitra: Silakan login sebagai Pemilik Toko.');
    openDistributorLoginModal();
    return;
  }
  const modal = document.getElementById('modalShareStore');
  const targetName = document.getElementById('shareStoreTargetName');
  const fullUrlInput = document.getElementById('shareStoreFullUrlInput');
  const infoBadge = document.getElementById('shareStoreInfoBadge');

  const currentStore = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  const isCentral = (currentStore.slug || appState.currentStoreSlug) === 'sr12-central';
  const storeName = isCentral ? 'SR12-Ku Pro (SR12 Official Central Hub)' : (currentStore.storeName || 'Toko SR12 Anda');
  const fullUrl = window.location.origin + window.location.pathname + '?store=' + (currentStore.slug || appState.currentStoreSlug);

  if (targetName) targetName.textContent = storeName;
  if (fullUrlInput) fullUrlInput.value = fullUrl;
  if (infoBadge) {
    if (isCentral) {
      infoBadge.innerHTML = `
        <div style="font-size: 0.78rem; color: #047857; display: flex; flex-direction: column; gap: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>🏛️ <b>Platform Resmi:</b></span>
            <span style="font-weight: 700; color: #065f46;">SR12-Ku Pro (SR12 Official Central Hub)</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>📱 <b>Customer Care Resmi:</b></span>
            <span style="font-family: monospace; font-weight: 700; color: #047857;">+${currentStore.storeWaNumber || '6281200001212'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>📍 <b>Jaringan Pasokan:</b></span>
            <span style="font-weight: 600;">SR12 Official Central Hub (Nasional)</span>
          </div>
          <div style="margin-top: 4px; padding-top: 6px; border-top: 1px dashed #bbf7d0; font-size: 0.74rem; color: #047857;">
            🔑 <b>ID Mode:</b> <code style="background: #e2e8f0; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-weight: 700;">?store=sr12-central</code> (Direktori Distributor & Agen Resmi).
          </div>
        </div>
      `;
    } else {
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

// GENERATOR LOGO EMBLEM TOKO DISTRIBUTOR & CENTRAL HUB (BERSIH, TAJAM, & SPESIFIK TIAP TOKO)
function getStoreEmblemSvgUrl(store) {
  if (store.storeLogoUrl && store.storeLogoUrl !== 'assets/sr12-logo.png' && !store.storeLogoUrl.startsWith('data:image/svg+xml')) {
    return store.storeLogoUrl;
  }
  const name = store.storeName || 'Toko Resmi';
  const monogram = (store.storeLogoText || name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5)).toUpperCase();
  const isCentral = store.slug === 'sr12-central';
  const tierName = (SR12_TIERS[store.partnerTier]?.name || 'MITRA').toUpperCase();
  
  // Custom Color Themes
  let mainColor = '#059669';
  let accentColor = '#10b981';
  let badgeColor = '#064e3b';
  let badgeText = tierName;

  if (isCentral) {
    mainColor = '#064e3b';
    accentColor = '#f59e0b';
    badgeColor = '#92400e';
    badgeText = 'CENTRAL HUB';
  } else if (store.slug === 'alzam-agency') {
    mainColor = '#047857';
    accentColor = '#fbbf24';
    badgeColor = '#065f46';
    badgeText = 'ALZAM DISTRIBUTOR';
  } else if (store.slug === 'aisyah-herbal') {
    mainColor = '#059669';
    accentColor = '#34d399';
    badgeColor = '#065f46';
    badgeText = 'AISYAH DISTRIBUTOR';
  } else if (store.slug === 'griya-cantik') {
    mainColor = '#be123c';
    accentColor = '#f43f5e';
    badgeColor = '#881337';
    badgeText = 'GRIYA AGEN';
  } else if (store.slug === 'berkah-herbal') {
    mainColor = '#0369a1';
    accentColor = '#38bdf8';
    badgeColor = '#075985';
    badgeText = 'BERKAH SUB AGEN';
  }

  const cleanSlug = (store.slug || 'store').replace(/[^a-zA-Z0-9]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
      <linearGradient id="emblemGrad_${cleanSlug}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <linearGradient id="ringGrad_${cleanSlug}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}"/>
        <stop offset="100%" stop-color="${mainColor}"/>
      </linearGradient>
    </defs>
    <!-- Outer Ring -->
    <circle cx="100" cy="100" r="95" fill="url(#emblemGrad_${cleanSlug})" stroke="url(#ringGrad_${cleanSlug})" stroke-width="6"/>
    <circle cx="100" cy="100" r="85" fill="none" stroke="${accentColor}" stroke-width="1.8" stroke-dasharray="4 3" opacity="0.8"/>
    
    <!-- SR12 Botanical Leaf Icon -->
    <g transform="translate(68, 25) scale(0.65)">
      <path d="M50 8C50 8 33 21 32 39C31 55 43 67 51 73C47 65 45 55 47 45C49 35 57 24 68 16C62 20 56 28 54 36C52 44 54 52 56 58C52 56 46 50 44 42C42 34 46 22 50 8Z" fill="${mainColor}"/>
      <path d="M51 73C57 67 68 57 68 41C68 30 63 20 57 14C63 22 65 32 63 42C61 52 55 61 51 73Z" fill="${accentColor}"/>
      <circle cx="61" cy="28" r="3.5" fill="#ffffff" opacity="0.9"/>
    </g>

    <!-- Monogram / Store Acronym -->
    <text x="100" y="118" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="23" font-weight="900" fill="${mainColor}" letter-spacing="1.5">${isCentral ? 'SR12' : monogram}</text>
    <text x="100" y="135" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="8.5" font-weight="800" fill="#64748b" letter-spacing="1.8">${isCentral ? 'SR12-KU PRO' : 'SR12 HERBAL'}</text>

    <!-- Bottom Ribbon Pill -->
    <rect x="25" y="152" width="150" height="26" rx="13" fill="${badgeColor}"/>
    <text x="100" y="169" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="900" fill="#ffffff" letter-spacing="0.8">${badgeText}</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
window.getStoreEmblemSvgUrl = getStoreEmblemSvgUrl;

// DIREKTORI RESMI DISTRIBUTOR & AGEN SE-INDONESIA (KHUSUS MODE OFFICIAL CENTRAL HUB)
let currentDirectoryFilter = 'all';
let currentDirectorySearch = '';

function renderOfficialDistributorDirectory(filter = currentDirectoryFilter, searchQuery = currentDirectorySearch) {
  currentDirectoryFilter = filter;
  currentDirectorySearch = (searchQuery || '').toLowerCase().trim();

  const grid = document.getElementById('officialDistributorsGrid');
  const countAllEl = document.getElementById('dirCountAll');
  if (!grid) return;

  // Hanya tampilkan Toko Distributor & Agen resmi (sr12-central adalah pusatnya)
  const partnerList = (appState.partnerStores || []).filter(s => s && s.slug && s.slug !== 'sr12-central');
  if (countAllEl) countAllEl.textContent = partnerList.length;

  const filtered = partnerList.filter(s => {
    let matchTier = false;
    if (filter === 'all') {
      matchTier = true;
    } else if (filter === 'distributor') {
      matchTier = s.partnerTier === 'distributor';
    } else if (filter === 'agen') {
      matchTier = s.partnerTier === 'agen' || (s.storeName && s.storeName.toLowerCase().includes('agen'));
    } else if (filter === 'sub_agen') {
      matchTier = s.partnerTier === 'sub_agen';
    } else {
      matchTier = s.partnerTier === filter;
    }

    const matchSearch = !searchQuery || 
      (s.storeName && s.storeName.toLowerCase().includes(searchQuery)) ||
      (s.storeCity && s.storeCity.toLowerCase().includes(searchQuery)) ||
      (s.storeOwner && s.storeOwner.toLowerCase().includes(searchQuery));
    return matchTier && matchSearch;
  });

  if (filtered.length === 0) {
    if (partnerList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 2px dashed #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🏪</div>
          <h3 style="font-weight: 900; font-size: 1.25rem; color: #0f172a; margin-bottom: 6px;">Belum Ada Toko Mitra Terdaftar</h3>
          <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 18px; max-width: 520px; margin-left: auto; margin-right: auto; line-height: 1.5;">
            Seluruh data simulasi awal telah dikosongkan. Silakan mulai simulasi mandiri dengan membuka <b>Toko Distributor Utama</b> pertama, lalu tambahkan toko <b>Agen Resmi</b> di bawah rekomendasi Distributor tersebut!
          </p>
          <button type="button" onclick="openRegisterStoreModal()" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 12px 24px; border-radius: 9999px; font-weight: 800; font-size: 0.88rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            <span>➕</span> Buka Toko Mitra Pertama Sekarang
          </button>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: #fff; border-radius: 14px; border: 1.5px dashed #cbd5e1;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
          <p style="font-weight: 800; font-size: 1rem; color: #1e293b; margin-bottom: 4px;">Tidak Ditemukan Toko di Kategori Ini</p>
          <p style="font-size: 0.82rem; color: #64748b; margin-bottom: 14px;">Silakan coba kata kunci lain atau pilih tab Semua Mitra.</p>
          <button type="button" onclick="filterDirectoryTier('all'); const input = document.getElementById('directorySearchInput'); if (input) input.value='';" style="background: #10b981; color: #fff; border: none; padding: 8px 18px; border-radius: 9999px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
            Tampilkan Semua Mitra
          </button>
        </div>
      `;
    }
    return;
  }

  grid.innerHTML = filtered.map(store => {
    const tierObj = SR12_TIERS[store.partnerTier] || SR12_TIERS.distributor;
    const logoUrl = getStoreEmblemSvgUrl(store);
    const cleanCity = (store.storeCity || 'Indonesia').split('(')[0].trim();
    const coverUrl = store.heroBannerUrl || 'assets/hero-banner.jpg';
    const cleanWa = (store.storeWaNumber || '6281234567890').replace(/[^0-9]/g, '');

    return `
      <div class="distributor-card">
        <!-- Mini Cover Banner Toko di Card Direktori -->
        <div class="dist-card-cover-wrap">
          <img src="${coverUrl}" alt="Cover ${store.storeName}" class="dist-card-cover-img">
          <div class="dist-card-cover-overlay"></div>
          <span class="dist-card-tier-pill tier-${store.partnerTier || 'distributor'}" style="position: absolute; top: 10px; right: 10px; margin: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            👑 ${tierObj.name.toUpperCase()} RESMI
          </span>
        </div>

        <div class="dist-card-body">
          <!-- 1. Logo / Foto Profil Toko di Tengah Card (Overlap Mini Cover) -->
          <div class="dist-card-logo-box">
            <img src="${logoUrl}" alt="${store.storeName}">
          </div>

          <!-- 2. Nama Toko Tepat di Bawah Logo -->
          <h3 class="dist-card-name">
            <span>${store.storeName}</span>
            <span class="badge-verified-tick" style="width: 18px; height: 18px; font-size: 0.65rem;" title="Toko Mitra Terverifikasi Resmi SR12">✓</span>
          </h3>

          <!-- 4. Info Detail Pemilik & Wilayah -->
          <div class="dist-card-info-box">
            <div>👤 <b>Pemilik:</b> ${store.storeOwner}</div>
            <div>📍 <b>Wilayah:</b> ${cleanCity}</div>
            <div>📱 <b>WhatsApp:</b> +${cleanWa}</div>
            ${(store.recommenderDistributor) ? `<div style="font-size: 0.73rem; color: #1e40af; background: #eff6ff; padding: 3px 8px; border-radius: 4px; margin-top: 4px; border: 1px solid #bfdbfe;">👑 <b>Rekomendasi:</b> ${store.recommenderDistributor}</div>` : ''}
          </div>

          <div class="dist-card-stock-status">
            <span>🟢</span> Stok Ready &bull; Pengiriman Cepat
          </div>

          <!-- 5. Tombol Aksi Masuk Toko / Kontak -->
          <div class="dist-card-actions">
            <button type="button" onclick="switchPartnerStore('${store.slug}'); window.scrollTo({top: 0, behavior: 'smooth'});" class="btn-card-enter-store">
              <span>🛍️</span> Belanja di Toko Ini
            </button>
            <div class="dist-card-sub-actions">
              <a href="https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo ${store.storeName}, saya melihat toko resmi Anda di direktori Pusat SR12...`)}" target="_blank" class="btn-card-sub btn-card-sub-wa" title="Hubungi Toko via WhatsApp" aria-label="WhatsApp">
                <span>💬</span>
              </a>
              <button type="button" onclick="showSpecificStoreSk('${store.slug}')" class="btn-card-sub btn-card-sub-sk" title="Periksa Dokumen SK Resmi Distributor" aria-label="SK Resmi">
                <span>📜</span>
              </button>
              <button type="button" onclick="switchPartnerStore('${store.slug}'); openStoreSettingsModal();" class="btn-card-sub btn-card-sub-settings" title="Pengaturan & Kustomisasi Toko Ini" aria-label="Atur Toko">
                <span>⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderOfficialDistributorDirectory = renderOfficialDistributorDirectory;

function filterDirectoryTier(tier) {
  document.querySelectorAll('.directory-tab-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === tier);
  });
  renderOfficialDistributorDirectory(tier, currentDirectorySearch);
}
window.filterDirectoryTier = filterDirectoryTier;

function handleDirectorySearch(query) {
  renderOfficialDistributorDirectory(currentDirectoryFilter, query);
}
window.handleDirectorySearch = handleDirectorySearch;

function showSpecificStoreSk(slug) {
  const store = appState.partnerStores.find(s => s.slug === slug) || appState.storeSettings;
  const skNum = store.skNumber || `SK-DIST-SR12-2026-${(store.slug || 'mitra').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)}`;
  const owner = store.storeOwner || 'Mitra Resmi';
  const nik = store.nikNumber || '3374025804820003';
  const city = (store.storeCity || 'Indonesia').split('(')[0].trim();
  const storeName = store.storeName || 'Toko Resmi SR12';

  const modal = document.getElementById('modalPreviewSkDoc');
  if (!modal) return;

  const titleEl = document.getElementById('previewSkTitle');
  const detailsEl = document.getElementById('previewSkDetails');
  const frameEl = document.getElementById('previewSkFrame');
  const btnApprove = document.getElementById('btnPreviewApproveSk');
  const btnReject = document.getElementById('btnPreviewRejectSk');

  if (titleEl) {
    titleEl.innerHTML = `<span>📜</span> Dokumen Surat Keputusan (SK) Resmi: ${escapeHtml(storeName)}`;
  }
  if (detailsEl) {
    detailsEl.innerHTML = `
      Pemilik: <b>${escapeHtml(owner)}</b> &middot; No. SK: <b style="color: #38bdf8;">${escapeHtml(skNum)}</b> &middot; Wilayah: <b>${escapeHtml(city)}</b> &middot; Status: <span style="background: #10b981; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">TERVERIFIKASI RESMI</span>
    `;
  }
  const containerEl = document.getElementById('previewSkContainer');
  if (containerEl) {
    const skSvg = getMockSkSvgUrl(owner, nik, storeName, skNum, city);
    window.__activePreviewDocUrl = skSvg;
    window.__activePreviewDocName = `SK_${skNum}.svg`;
    window.__activePreviewDocTitle = `Dokumen SK Resmi: ${storeName}`;

    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #059669; border-radius: 10px; overflow: hidden; background: #022c22; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #34d399;">
            📜 SK Resmi Kemitraan: <span style="font-family: monospace; color: #fef08a;">${escapeHtml(skNum)}</span>
          </span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" style="color: #34d399; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 6px; cursor: pointer;">
              🔍 Buka Layar Penuh
            </button>
            <button type="button" onclick="downloadDocumentDirectly(window.__activePreviewDocUrl, window.__activePreviewDocName)" style="color: #fff; background: #059669; border: none; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
              📥 Download
            </button>
          </div>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 260px; max-height: 420px; overflow: auto; background: #041f18;">
          <img src="${skSvg}" alt="SK Resmi" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" title="Klik untuk membuka layar penuh">
        </div>
        <div style="padding: 10px 14px; background: rgba(16, 185, 129, 0.1); border-top: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.75rem; color: #a7f3d0; display: flex; justify-content: space-between; align-items: center;">
          <span>🏛️ <b>Penerbit SK:</b> PT. SR12 Herbal Perkasa (Legalitas Sah)</span>
          <span style="color: #cbd5e1; font-size: 0.72rem;">✓ SK Terdaftar</span>
        </div>
      </div>
    `;
  }
  if (btnApprove) btnApprove.style.display = 'none';
  if (btnReject) btnReject.style.display = 'none';

  modal.classList.add('open');
}
window.showSpecificStoreSk = showSpecificStoreSk;

function renderStoreBranding() {
  const cfg = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const isCentralHub = cfg.slug === 'sr12-central';
  const tierObj = SR12_TIERS[cfg.partnerTier] || SR12_TIERS.distributor;
  const storeLogo = getStoreEmblemSvgUrl(cfg);
  let cleanTierName = (tierObj.name || '').toUpperCase().replace(/RESMI SR12/g, '').replace(/SR12/g, '').trim();
  if (!cleanTierName) cleanTierName = 'DISTRIBUTOR';
  const cleanCity = (cfg.storeCity || 'Indonesia').split('(')[0].trim();
  const cleanWa = (cfg.storeWaNumber || '081234567890').replace(/[^0-9]/g, '');

  // 1. Update Header Brand & Actions (Navbar Publik Konsisten)
  const nameEl = document.getElementById('brandStoreName');
  const tagEl = document.getElementById('brandStoreTagline');
  const logoBox = document.getElementById('brandLogoContainer');
  const brandPill = document.getElementById('brandModePill');
  const btnBackCentral = document.getElementById('btnHeaderBackToCentral');
  const headerTierBox = document.querySelector('.header-tier-box');
  const cartBtn = document.getElementById('btnOpenCart');
  const navChatWa = document.getElementById('btnHeaderChatWa');
  const tierQuickBanner = document.querySelector('.tier-quick-banner');
  const siteHeader = document.querySelector('.site-header');
  const platformTopbar = document.getElementById('platformTopbar') || document.querySelector('.platform-topbar');

  // Bersihkan topbar & site-header di Toko Mitra (Hanya tampil di Central Hub)
  document.body.classList.toggle('is-central-hub', isCentralHub);
  document.body.classList.toggle('is-partner-store', !isCentralHub);

  if (siteHeader) {
    siteHeader.style.display = isCentralHub ? 'block' : 'none';
  }
  if (platformTopbar) {
    platformTopbar.style.display = isCentralHub ? 'block' : 'none';
  }
  if (tierQuickBanner) {
    tierQuickBanner.style.display = 'none';
  }

  if (nameEl) {
    nameEl.innerHTML = isCentralHub 
      ? 'SR12-Ku Pro' 
      : `${cfg.storeName} <span class="badge-verified-tick" style="width: 17px; height: 17px; font-size: 0.65rem;" title="Terverifikasi Resmi">✓</span>`;
  }
  if (tagEl) {
    tagEl.textContent = isCentralHub 
      ? 'SR12 Official Central Hub • Direktori Kemitraan & Pasokan Resmi' 
      : (cfg.storeTagline || `Distributor Resmi SR12 • ${cleanCity}`);
  }
  if (brandPill) {
    if (isCentralHub) {
      brandPill.textContent = '🏛️ SR12 OFFICIAL CENTRAL HUB';
      brandPill.style.background = '#fef3c7';
      brandPill.style.color = '#92400e';
      brandPill.style.borderColor = '#fcd34d';
    } else {
      brandPill.textContent = `🏪 TOKO ${cleanTierName} RESMI`;
      brandPill.style.background = '#ecfdf5';
      brandPill.style.color = '#065f46';
      brandPill.style.borderColor = '#a7f3d0';
    }
  }

  // Tombol Kembali ke Pusat di Header
  if (btnBackCentral) {
    btnBackCentral.style.display = isCentralHub ? 'none' : 'inline-flex';
    btnBackCentral.innerHTML = '<span>🏛️</span> <span class="hide-on-mobile">Belanja di Pusat</span>';
  }

  // Tombol WhatsApp di Navbar
  if (navChatWa) {
    navChatWa.href = `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo ${cfg.storeName}, saya ingin konsultasi produk SR12...`)}`;
    navChatWa.style.display = isCentralHub ? 'none' : 'inline-flex';
  }

  // Logo di Header
  if (logoBox) {
    logoBox.innerHTML = `<img src="${storeLogo}" alt="Logo ${cfg.storeName}" style="width: 100%; height: 100%; object-fit: contain !important; object-position: center center !important; border-radius: 50%; display: block; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
  }

  // Sembunyikan Selector Harga & Keranjang di Central Hub jika direktori
  if (headerTierBox) {
    headerTierBox.style.display = isCentralHub ? 'none' : 'flex';
  }
  const btnStoreSettings = document.getElementById('btnOpenStoreSettings');
  if (btnStoreSettings) {
    btnStoreSettings.style.display = isCentralHub ? 'none' : 'inline-flex';
  }
  if (cartBtn) {
    cartBtn.style.display = isCentralHub ? 'none' : 'inline-flex';
  }

  // 2. Tampilkan Mode 1 (Official Central Hub) vs Mode 2 (Toko Distributor)
  const centralHero = document.getElementById('officialCentralHubHero');
  const directorySection = document.getElementById('officialDistributorDirectorySection');
  const distHero = document.getElementById('distributorStoreHeroCard');
  const genericHero = document.getElementById('genericStoreHeroBanner') || document.querySelector('.hero-single-banner');
  const commerceWrapper = document.getElementById('distributorCommerceWrapper');

  if (isCentralHub) {
    // ==========================================
    // MODE 1: SR12-KU PRO (SR12 OFFICIAL CENTRAL HUB)
    // ==========================================
    // Official Central Hub MURNI Direktori Toko & Kemitraan se-Indonesia (TIDAK BERISI PRODUK RITEL / KERANJANG)
    if (centralHero) centralHero.style.display = 'block';
    if (directorySection) directorySection.style.display = 'block';
    if (distHero) distHero.style.display = 'none';
    if (genericHero) genericHero.style.display = 'none';
    if (commerceWrapper) commerceWrapper.style.display = 'none';
    const catSec = document.getElementById('catalogSection');
    if (catSec) catSec.style.display = 'none';
    const distCartFab = document.getElementById('distributorFloatingCart');
    if (distCartFab) distCartFab.style.display = 'none';

    const cTitle = document.getElementById('centralHubTitleDisplay');
    const cSub = document.getElementById('centralHubSubtitleDisplay');
    if (cTitle) cTitle.textContent = 'SR12-Ku Pro';
    if (cSub) cSub.textContent = 'SR12 Official Central Hub • Pusat pasokan & jaringan kemitraan resmi produk SR12 Herbal Skin Care se-Indonesia. Silakan pilih Toko Distributor atau Agen terdekat di kota Anda untuk berbelanja produk asli SR12.';

    renderOfficialDistributorDirectory();
  } else {
    // ==========================================
    // MODE 2: TOKO DISTRIBUTOR
    // ==========================================
    if (centralHero) centralHero.style.display = 'none';
    if (directorySection) directorySection.style.display = 'none';
    if (distHero) distHero.style.display = 'block';
    if (genericHero) genericHero.style.display = 'none';
    if (commerceWrapper) commerceWrapper.style.display = 'block';
    const catSec = document.getElementById('catalogSection');
    if (catSec) catSec.style.display = 'block';

    // A. Identitas di Dalam Banner (Cover Overlay Text)
    const bannerTier = document.getElementById('bannerStoreTierBadge');
    const bannerName = document.getElementById('bannerStoreName');
    const bannerTagline = document.getElementById('bannerStoreTagline');
    if (bannerTier) bannerTier.textContent = `👑 ${cleanTierName} RESMI`;
    if (bannerName) bannerName.textContent = cfg.storeName;
    if (bannerTagline) bannerTagline.textContent = cfg.storeTagline || (`Distributor Resmi SR12 Wilayah ${cleanCity} • 100% Produk Original BPOM`);

    // B. Identitas di Bawah Foto Profil (Avatar Card)
    const distLogo = document.getElementById('distHeroLogoImg');
    const distName = document.getElementById('distHeroStoreName');
    const distTier = document.getElementById('distHeroTierBadge');
    const distTagline = document.getElementById('distHeroTagline');
    const distOwner = document.getElementById('distHeroOwner');
    const distCity = document.getElementById('distHeroCity');
    const distWa = document.getElementById('distHeroWa');
    const distChatBtn = document.getElementById('btnDistChatWa');

    const distCover = document.getElementById('distHeroCoverImg');
    const btnEditCover = document.getElementById('btnEditStoreCover');
    const btnEditLogo = document.getElementById('btnEditStoreLogo');
    const btnDistSettingsHero = document.getElementById('btnDistSettingsHero');

    if (distCover) {
      distCover.src = cfg.heroBannerUrl || 'assets/hero-banner.jpg';
    }
    if (distLogo) distLogo.src = storeLogo;
    if (distName) distName.textContent = cfg.storeName;
    if (distTier) distTier.textContent = `👑 ${cleanTierName} RESMI`;
    if (distTagline) distTagline.textContent = cfg.storeTagline || (`Distributor Resmi SR12 Wilayah ${cleanCity} • Melayani Grosir & Eceran`);
    if (distOwner) distOwner.textContent = cfg.storeOwner || 'Mitra Resmi';
    if (distCity) distCity.textContent = cleanCity;
    if (distWa) distWa.textContent = '+' + cleanWa;
    if (distChatBtn) {
      distChatBtn.href = `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo ${cfg.storeName}, saya ingin bertanya seputar produk SR12...`)}`;
    }

    if (btnEditCover) btnEditCover.style.display = 'inline-flex';
    if (btnEditLogo) btnEditLogo.style.display = 'flex';
    if (btnDistSettingsHero) btnDistSettingsHero.style.display = 'inline-flex';
  }

  // 3. SINKRONISASI IDENTITAS RESMI DI FOOTER (KONSISTEN 100%)
  const footerEmblem = document.getElementById('footerStoreEmblemBox');
  const footerTier = document.getElementById('footerStoreTierBadge');
  const footerName = document.getElementById('footerStoreName');
  const footerTagline = document.getElementById('footerStoreTagline');
  const footerOwner = document.getElementById('footerStoreOwner');
  const footerCity = document.getElementById('footerStoreCity');
  const footerWaNum = document.getElementById('footerStoreWaNumber');
  const footerWaLink = document.getElementById('footerStoreWaLink');
  const footerLegal = document.getElementById('footerStoreNameLegal');
  const footerBtnSettings = document.getElementById('btnFooterStoreSettings');
  const footerBtnWa = document.getElementById('btnFooterChatWa');

  if (footerEmblem) {
    footerEmblem.innerHTML = `<img src="${storeLogo}" alt="Logo ${cfg.storeName}" style="width: 100%; height: 100%; object-fit: contain;">`;
  }
  if (footerTier) {
    footerTier.textContent = isCentralHub ? '🏛️ SR12 OFFICIAL CENTRAL HUB' : `🏪 TOKO ${cleanTierName} RESMI`;
  }
  if (footerName) {
    footerName.textContent = isCentralHub ? 'SR12-Ku Pro' : cfg.storeName;
  }
  if (footerTagline) {
    footerTagline.textContent = isCentralHub 
      ? 'Pusat Pasokan & Jaringan Kemitraan Resmi SR12 Herbal Skin Care se-Indonesia'
      : (cfg.storeTagline || `Toko Mitra Resmi SR12 Herbal Skin Care Wilayah ${cleanCity}`);
  }
  if (footerOwner) {
    footerOwner.textContent = isCentralHub ? 'Administrator Pusat' : (cfg.storeOwner || 'Mitra Resmi');
  }
  if (footerCity) {
    footerCity.textContent = isCentralHub ? 'Seluruh Indonesia' : cleanCity;
  }
  if (footerWaNum) {
    footerWaNum.textContent = '+' + cleanWa;
  }
  if (footerWaLink) {
    footerWaLink.href = `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo ${cfg.storeName}, saya ingin konsultasi produk SR12...`)}`;
  }
  if (footerLegal) {
    footerLegal.textContent = isCentralHub ? 'SR12 Official Central Hub' : cfg.storeName;
  }
  if (footerBtnSettings) {
    footerBtnSettings.style.display = isCentralHub ? 'none' : 'inline-flex';
  }
  if (footerBtnWa) {
    footerBtnWa.style.display = isCentralHub ? 'none' : 'inline-flex';
  }

  // 4. Sinkronisasi Preview Strip (Jika Mode Developer sedang meninjau)
  const devPreviewStoreDisplay = document.getElementById('devPreviewStoreNameDisplay');
  if (devPreviewStoreDisplay) {
    const typeLabel = isCentralHub ? '🏛️ SR12 Official Central Hub' : '🏪 Toko Distributor';
    const displayName = isCentralHub ? 'SR12-Ku Pro' : cfg.storeName;
    devPreviewStoreDisplay.innerHTML = `${displayName} <span style="font-size: 0.72rem; color: #a5f3fc; font-weight: normal;">(${typeLabel})</span>`;
  }

  // Fallback update untuk elemen generic bila diperlukan
  const heroTitle = document.getElementById('heroBannerTitle');
  const heroSubtitle = document.getElementById('heroBannerSubtitle');
  const heroImg = document.getElementById('heroBannerImg');
  if (heroTitle) heroTitle.textContent = cfg.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle;
  if (heroSubtitle) heroSubtitle.textContent = cfg.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle;
  if (heroImg && cfg.heroBannerUrl) heroImg.src = cfg.heroBannerUrl;
}

function showCurrentStoreSk() {
  if (!appState.isDistributorLoggedIn && !appState.isAdminMode) {
    showToast('🔒 Dokumen SK Rahasia Distributor: Silakan login sebagai Pemilik Toko.');
    openDistributorLoginModal();
    return;
  }
  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const skNum = store.skNumber || `SK-DIST-SR12-2026-${(store.slug || 'mitra').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)}`;
  const owner = store.storeOwner || 'Mitra Resmi';
  const nik = store.nikNumber || '3374025804820003';
  const city = (store.storeCity || 'Indonesia').split('(')[0].trim();
  const storeName = store.storeName || 'Toko Resmi SR12';

  const modal = document.getElementById('modalPreviewSkDoc');
  if (!modal) return;

  const titleEl = document.getElementById('previewSkTitle');
  const detailsEl = document.getElementById('previewSkDetails');
  const frameEl = document.getElementById('previewSkFrame');
  const btnApprove = document.getElementById('btnPreviewApproveSk');
  const btnReject = document.getElementById('btnPreviewRejectSk');

  if (titleEl) {
    titleEl.innerHTML = `<span>📜</span> Dokumen Surat Keputusan (SK) Resmi: ${escapeHtml(storeName)}`;
  }
  if (detailsEl) {
    detailsEl.innerHTML = `
      Pemilik: <b>${escapeHtml(owner)}</b> &middot; No. SK: <b style="color: #38bdf8;">${escapeHtml(skNum)}</b> &middot; Wilayah: <b>${escapeHtml(city)}</b> &middot; Status: <span style="background: #10b981; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">TERVERIFIKASI RESMI</span>
    `;
  }
  const containerEl = document.getElementById('previewSkContainer');
  if (containerEl) {
    const skSvg = getMockSkSvgUrl(owner, nik, storeName, skNum, city);
    window.__activePreviewDocUrl = skSvg;
    window.__activePreviewDocName = `SK_${skNum}.svg`;
    window.__activePreviewDocTitle = `Dokumen SK Resmi: ${storeName}`;

    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #059669; border-radius: 10px; overflow: hidden; background: #022c22; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #34d399;">
            📜 SK Resmi Kemitraan: <span style="font-family: monospace; color: #fef08a;">${escapeHtml(skNum)}</span>
          </span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" style="color: #34d399; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 6px; cursor: pointer;">
              🔍 Buka Layar Penuh
            </button>
            <button type="button" onclick="downloadDocumentDirectly(window.__activePreviewDocUrl, window.__activePreviewDocName)" style="color: #fff; background: #059669; border: none; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
              📥 Download
            </button>
          </div>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 260px; max-height: 420px; overflow: auto; background: #041f18;">
          <img src="${skSvg}" alt="SK Resmi" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" title="Klik untuk membuka layar penuh">
        </div>
        <div style="padding: 10px 14px; background: rgba(16, 185, 129, 0.1); border-top: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.75rem; color: #a7f3d0; display: flex; justify-content: space-between; align-items: center;">
          <span>🏛️ <b>Penerbit SK:</b> PT. SR12 Herbal Perkasa (Legalitas Sah)</span>
          <span style="color: #cbd5e1; font-size: 0.72rem;">✓ SK Terdaftar</span>
        </div>
      </div>
    `;
  }
  if (btnApprove) btnApprove.style.display = 'none';
  if (btnReject) btnReject.style.display = 'none';

  modal.classList.add('open');
}
window.showCurrentStoreSk = showCurrentStoreSk;

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
    hint.innerHTML = `Toko: <b>${store.storeName}</b> &middot; Pemilik: <b>${store.storeOwner}</b> &middot; PIN Toko: <b>${storePin}</b>`;
  }

  if (emailInput) emailInput.value = storeEmail;
  if (passInput) passInput.value = '';
  if (err) err.style.display = 'none';

  if (modal) modal.classList.add('open');
  if (passInput) setTimeout(() => passInput.focus(), 200);
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
        const sessionPayload = JSON.stringify({
          slug: appState.currentStoreSlug,
          owner: result.store?.storeOwner || appState.storeSettings.storeOwner,
          token: result.session?.token,
          loggedAt: Date.now()
        });
        sessionStorage.setItem('sr12_distributor_session', sessionPayload);
        localStorage.setItem('sr12_distributor_session', sessionPayload);
      } catch (err) {}

      // Hydrate dari database server
      await loadStoreDataFromBackend(appState.currentStoreSlug);

      updateViewModeUI();
      renderProducts();
      if (modal) modal.classList.remove('open');
      appState.pendingPosOpen = false;
      appState.isOlseraPortalOpen = true;
      if (typeof showDistributorPortalView === 'function') {
        showDistributorPortalView(true);
        if (typeof openOlseraSidebarDrawer === 'function') {
          openOlseraSidebarDrawer();
        }
      }
      showToast(`👑 Login Berhasil! Selamat datang ${result.store?.storeOwner || 'Distributor'}. Masuk ke Dashboard Admin.`);
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
    try {
      const fallbackPayload = JSON.stringify({
        slug: appState.currentStoreSlug,
        owner: store.storeOwner,
        loggedAt: Date.now()
      });
      sessionStorage.setItem('sr12_distributor_session', fallbackPayload);
      localStorage.setItem('sr12_distributor_session', fallbackPayload);
    } catch (e) {}

    updateViewModeUI();
    renderProducts();
    if (modal) modal.classList.remove('open');
    appState.pendingPosOpen = false;
    appState.isOlseraPortalOpen = true;
    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(true);
      if (typeof openOlseraSidebarDrawer === 'function') {
        openOlseraSidebarDrawer();
      }
    }
    showToast(`👑 Login Berhasil! Selamat datang ${store.storeOwner}. Masuk ke Dashboard Admin.`);
  } else {
    if (err) {
      err.style.display = 'block';
      err.textContent = `❌ Password / PIN Toko salah! (Gunakan PIN Toko Anda atau PIN Master: 8899)`;
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
    sessionStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_distributor_session');
    localStorage.setItem('sr12_active_view_mode', 'storefront');
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (e) {}

  // 1. Tutup drawer Olsera dan backdrop
  if (typeof closeOlseraSidebarDrawer === 'function') {
    closeOlseraSidebarDrawer();
  } else {
    document.getElementById('olseraSidebar')?.classList.remove('open');
    document.getElementById('olseraDrawerBackdrop')?.classList.remove('open');
  }

  // 2. Tutup semua modal yang masih terbuka
  document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));

  // 3. Pastikan kunci scroll dilepas sepenuhnya dari body dan html
  document.body.classList.remove('olsera-drawer-open');
  document.body.classList.remove('modal-open');
  if (document.documentElement) {
    document.documentElement.classList.remove('olsera-drawer-open');
    document.documentElement.classList.remove('modal-open');
  }
  if (typeof ensureScrollUnlocked === 'function') {
    ensureScrollUnlocked();
  }
  document.body.style.overflow = '';
  document.body.style.overflowY = '';
  document.body.style.height = '';
  document.body.style.touchAction = '';
  if (document.documentElement) {
    document.documentElement.style.overflow = '';
    document.documentElement.style.overflowY = '';
    document.documentElement.style.height = '';
    document.documentElement.style.touchAction = '';
  }

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

  const isCentral = !appState.storeSettings?.slug || appState.storeSettings.slug === 'sr12-central';
  document.body.classList.remove('olsera-portal-active');
  document.body.classList.toggle('is-central-hub', isCentral);
  document.body.classList.toggle('is-partner-store', !isCentral);

  if (storefront) storefront.style.display = 'block';
  if (siteHeader) siteHeader.style.display = isCentral ? 'block' : 'none';
  if (tierBanner) tierBanner.style.display = 'none';
  if (platformTopbar) platformTopbar.style.display = isCentral ? 'block' : 'none';

  updateViewModeUI();
  if (isCentral) {
    renderStoreBranding();
    renderOfficialDistributorDirectory();
  } else {
    switchTab('products');
    renderProducts();
  }
  showToast('🛍️ Anda telah logout. Web toko kini kembali bersih sebagai Tampilan Pembeli Umum.');
}
window.handleDistributorLogout = handleDistributorLogout;
window.logoutDistributor = handleDistributorLogout;

function toggleViewMode() {
  if (appState.isAdminMode) {
    handleDistributorLogout();
  } else {
    openDistributorLoginModal();
  }
}

function updateViewModeUI() {
  const isLogged = !!appState.isAdminMode && !!appState.isDistributorLoggedIn;
  const isCentral = appState.storeSettings?.slug === 'sr12-central';

  // Bar lama disembunyikan permanen agar tidak bertumpuk
  const toggleBar = document.getElementById('distributorPortalToggleBar');
  const adminBanner = document.getElementById('adminModeBanner');
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

  // 1. KONTROL HERO SECTION TOKO (SEPARASI TOTAL PUBLIK vs ADMIN DISTRIBUTOR)
  // 1. KONTROL HERO SECTION TOKO: HANYA 3 TOMBOL RESMI (WhatsApp, Cabang, Login)
  const adminActiveBadge = document.getElementById('distributorAdminActiveBadge');
  const btnDistLogin = document.getElementById('btnDistLoginHero');
  const btnDistOpenDrawer = document.getElementById('btnDistOpenDrawerHero');
  const btnEditCover = document.getElementById('btnEditStoreCover');
  const btnEditLogo = document.getElementById('btnEditStoreLogo');
  const distPendingAlert = document.getElementById('distributorPendingAlert');

  if (adminActiveBadge) adminActiveBadge.style.display = 'none';
  if (btnDistOpenDrawer) btnDistOpenDrawer.style.display = 'none';
  if (btnEditCover) btnEditCover.style.display = 'none';
  if (btnEditLogo) btnEditLogo.style.display = 'none';
  if (distPendingAlert) distPendingAlert.style.display = 'none';
  
  const distHeroLoginLabel = document.getElementById('distHeroLoginLabel');
  if (btnDistLogin) {
    btnDistLogin.style.display = isCentral ? 'none' : 'inline-flex';
    if (isLogged) {
      btnDistLogin.title = "Buka Dashboard Admin & Kasir (Olsera)";
      btnDistLogin.setAttribute('aria-label', 'Dashboard Admin');
      if (distHeroLoginLabel) {
        distHeroLoginLabel.textContent = "";
        distHeroLoginLabel.style.display = "none";
      }
      btnDistLogin.onclick = function() {
        showDistributorPortalView(true);
        if (typeof openOlseraSidebarDrawer === 'function') {
          openOlseraSidebarDrawer();
        }
      };
    } else {
      btnDistLogin.title = "Masuk ke Dashboard Admin Distributor";
      btnDistLogin.setAttribute('aria-label', 'Login Dashboard Admin');
      if (distHeroLoginLabel) {
        distHeroLoginLabel.textContent = "";
        distHeroLoginLabel.style.display = "none";
      }
      btnDistLogin.onclick = function() {
        openDistributorLoginModal();
      };
    }
  }

  // 2. KONTROL TOPBAR KEMITRAAN (PLATFORM TOPBAR)
  const topbarBtnOlseraPos = document.getElementById('topbarBtnOlseraPos');
  const topbarBtnShareStore = document.getElementById('topbarBtnShareStore');
  const topbarBtnDistLogin = document.getElementById('topbarBtnDistLogin');
  const topbarBtnDistLogout = document.getElementById('topbarBtnDistLogout');

  if (topbarBtnOlseraPos) topbarBtnOlseraPos.style.display = isLogged ? 'inline-flex' : 'none';
  if (topbarBtnShareStore) topbarBtnShareStore.style.display = isLogged ? 'inline-flex' : 'none';
  if (topbarBtnDistLogin) topbarBtnDistLogin.style.display = isLogged ? 'none' : 'inline-flex';
  if (topbarBtnDistLogout) topbarBtnDistLogout.style.display = isLogged ? 'inline-flex' : 'none';

  // 3. KONTROL TOMBOL TAMBAH PRODUK, MENU TOKO & PENGATURAN TOKO DI INTERFACE RETAIL
  const btnStoreSettings = document.getElementById('btnOpenStoreSettings');
  const btnHeaderAdminMenu = document.getElementById('btnHeaderAdminMenu');
  const btnCatalogAdminMenu = document.getElementById('btnOpenDashboardFromCatalog');
  const btnFloatingAdminMenu = document.getElementById('btnFloatingAdminMenu');
  const btnAddProduct = document.getElementById('btnOpenAddProduct');
  const btnAddPromo = document.getElementById('btnOpenAddPromo');
  const btnAddMkit = document.getElementById('btnOpenAddMkit');

  if (btnStoreSettings) btnStoreSettings.style.display = (isLogged && !isCentral) ? 'inline-flex' : 'none';
  if (btnHeaderAdminMenu) btnHeaderAdminMenu.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnCatalogAdminMenu) btnCatalogAdminMenu.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnFloatingAdminMenu) {
    const isPortalOpen = (typeof appState !== 'undefined') && !!appState.isOlseraPortalOpen;
    btnFloatingAdminMenu.style.display = (isLogged && !isPortalOpen) ? 'inline-flex' : 'none';
  }
  if (btnAddProduct) btnAddProduct.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnAddPromo) btnAddPromo.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnAddMkit) btnAddMkit.style.display = isLogged ? 'inline-flex' : 'none';

  const btnLogin = document.getElementById('btnDistributorLogin');
  const badgeProfile = document.getElementById('distributorProfileBadge');
  const nameDisplay = document.getElementById('loggedDistributorName');
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

  window.openCartDrawer = function() {
    if (cartDrawer) {
      cartDrawer.classList.add('open');
      document.body.classList.add('modal-open');
    }
    if (cartBackdrop) cartBackdrop.classList.add('open');
    const nameIn = document.getElementById('cartBuyerNameInput');
    const phoneIn = document.getElementById('cartBuyerPhoneField');
    if (nameIn && !nameIn.value && appState.buyerDetails?.name) {
      nameIn.value = appState.buyerDetails.name;
    }
    if (phoneIn && !phoneIn.value && appState.buyerDetails?.phone) {
      phoneIn.value = appState.buyerDetails.phone;
    }
    if (typeof updateCartUI === 'function') updateCartUI();
  };

  if (btnOpenCart) {
    btnOpenCart.addEventListener('click', window.openCartDrawer);
  }

  const closeCart = () => {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartBackdrop) cartBackdrop.classList.remove('open');
    document.body.classList.remove('modal-open');
  };
  window.closeCartDrawer = closeCart;

  if (btnCloseCart) btnCloseCart.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  // Tutup keranjang saat tombol Escape ditekan
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('open')) {
      closeCart();
    }
  });

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

  // Product Image Upload dengan kompresi client-side otomatis
  const editProdFileInput = document.getElementById('editProdFileInput');
  if (editProdFileInput) {
    editProdFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast('⏳ Memproses & mengoptimasi foto produk...');
        try {
          const compressed = await compressImageSource(file, 500, 0.76);
          if (compressed) {
            appState.tempEditImageBase64 = compressed;
            const previewImg = document.getElementById('editProdImgPreview');
            if (previewImg) {
              previewImg.src = compressed;
              previewImg.style.display = 'block';
            }
            const urlInput = document.getElementById('editProdImgUrl');
            if (urlInput) urlInput.value = '';
            showToast(`📷 Foto produk siap! Ukuran dioptimasi hemat memori.`);
          }
        } catch (err) {
          console.error('Gagal kompres foto:', err);
        }
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

  // Developer Portal PIN Security Triggers
  const modalDevPin = document.getElementById('modalDevPin');
  const btnCloseDevPin = document.getElementById('btnCloseDevPin');
  if (btnCloseDevPin && modalDevPin) {
    btnCloseDevPin.addEventListener('click', () => modalDevPin.classList.remove('open'));
  }

  const btnCloseDevPortal = document.getElementById('btnCloseDevPortal');
  const modalDevPortal = document.getElementById('modalDevPortal');
  if (btnCloseDevPortal && modalDevPortal) {
    btnCloseDevPortal.addEventListener('click', () => modalDevPortal.classList.remove('open'));
  }

  // 1. Secret Shortcut Keyboard untuk Desktop: Ctrl + Shift + D
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      openDevPinPrompt();
    }
  });

  // 2. Secret Mobile Triple-Tap pada Footer Copyright (Untuk akses aman via Smartphone tanpa keyboard)
  const footerArea = document.querySelector('footer');
  if (footerArea) {
    let tapCount = 0;
    let tapTimeout = null;
    footerArea.addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimeout);
      if (tapCount >= 3) {
        tapCount = 0;
        openDevPinPrompt();
      } else {
        tapTimeout = setTimeout(() => { tapCount = 0; }, 500);
      }
    });
  }

  // 3. Akses Rahasia via URL Parameter: ?dev=1
  const urlCheck = new URLSearchParams(window.location.search);
  if (urlCheck.get('dev') === '1' || urlCheck.get('admin') === 'dev') {
    setTimeout(openDevPinPrompt, 400);
  }
}

// Open PIN Prompt for Developer Portal
function openDevPinPrompt() {
  if (appState.isDevMasterLoggedIn) {
    showDeveloperWorkspaceView(true);
    return;
  }
  const pinInput = document.getElementById('devPinInput');
  const pinError = document.getElementById('devPinError');
  if (pinInput) pinInput.value = '';
  if (pinError) pinError.style.display = 'none';
  if (typeof openModal === 'function') {
    openModal('modalDevPin');
  } else {
    const modal = document.getElementById('modalDevPin');
    if (modal) modal.classList.add('open');
  }
  if (pinInput) setTimeout(() => pinInput.focus(), 200);
}

// Switch Tabs inside Developer Super Admin Portal (Workspace & Modal)
function switchDevPortalTab(tabName) {
  const tabs = ['overview', 'stores', 'pending', 'networkMitra', 'payment'];
  tabs.forEach(t => {
    // 1. Workspace Panes & Buttons (Dedicated Full-Screen Console)
    const paneWs = document.getElementById(`devTabPane_ws_${t}`);
    const btnWs = document.getElementById(`devTabBtn_ws_${t}`);
    if (paneWs) paneWs.style.display = (t === tabName) ? 'block' : 'none';
    if (btnWs) {
      if (t === tabName) {
        btnWs.classList.add('active');
        btnWs.style.background = '#0284c7';
        btnWs.style.color = '#ffffff';
        btnWs.style.borderColor = '#38bdf8';
      } else {
        btnWs.classList.remove('active');
        btnWs.style.background = '#1e293b';
        btnWs.style.color = '#94a3b8';
        btnWs.style.borderColor = '#334155';
      }
    }

    // 2. Modal Panes & Buttons (Floating Modal Dialog)
    const paneModal = document.getElementById(`devTabPane_${t}`);
    const btnModal = document.getElementById(`devTabBtn_${t}`);
    if (paneModal) paneModal.style.display = (t === tabName) ? 'block' : 'none';
    if (btnModal) {
      if (t === tabName) {
        btnModal.classList.add('active');
        btnModal.style.background = '#0284c7';
        btnModal.style.color = '#ffffff';
        btnModal.style.borderColor = '#38bdf8';
      } else {
        btnModal.classList.remove('active');
        btnModal.style.background = '#1e293b';
        btnModal.style.color = '#94a3b8';
        btnModal.style.borderColor = '#334155';
      }
    }
  });
}

// Verify PIN Entered
function verifyDevPinSubmit(e) {
  if (e) e.preventDefault();
  const pinInput = document.getElementById('devPinInput')?.value.trim();
  const pinError = document.getElementById('devPinError');

  if (pinInput === appState.masterDevPin) {
    // Correct PIN! Tutup modal PIN dengan bersih & buka Console Developer Layar Penuh
    if (typeof closeModal === 'function') {
      closeModal('modalDevPin');
    } else {
      const modalDevPin = document.getElementById('modalDevPin');
      if (modalDevPin) modalDevPin.classList.remove('open');
    }
    showDeveloperWorkspaceView(true);
    showToast('🔓 Akses Master Diterima! Membuka Console Developer.');
  } else {
    // Wrong PIN!
    if (pinError) {
      pinError.style.display = 'block';
      pinError.textContent = '❌ PIN Master Developer Salah! (Default: 8899)';
    }
  }
}

// Toggle Developer Dedicated Super Admin Workspace vs Preview Storefront
function showDeveloperWorkspaceView(showWorkspace) {
  const devWorkspace = document.getElementById('devSuperAdminWorkspace');
  const devNav = document.getElementById('devSuperAdminNavbar');
  const devPreviewStrip = document.getElementById('devPreviewStrip');
  const devFab = document.getElementById('devFloatingFab');
  const storefront = document.getElementById('publicStorefrontMain');
  const platformTopbar = document.getElementById('platformTopbar') || document.querySelector('.platform-topbar');
  const siteHeader = document.querySelector('.site-header');
  const tierBanner = document.querySelector('.tier-quick-banner');
  const olseraNav = document.getElementById('olseraAppNavbar');
  const olseraPortal = document.getElementById('distributorOlseraPortal');
  const distStrip = document.getElementById('distributorPreviewStrip');
  const modalDevPortal = document.getElementById('modalDevPortal');
  const modalDevPin = document.getElementById('modalDevPin');

  if (showWorkspace) {
    appState.isDevMasterLoggedIn = true;
    try {
      localStorage.setItem('sr12_dev_session', 'active');
    } catch(e) {}

    // 1. Bersihkan seluruh backdrop modal & BUKA KUNCI SCROLL LAYAR SECARA TOTAL
    if (modalDevPortal) modalDevPortal.classList.remove('open');
    if (modalDevPin) modalDevPin.classList.remove('open');
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    
    document.body.classList.remove('modal-open');
    if (document.documentElement) document.documentElement.classList.remove('modal-open');
    document.body.classList.add('dev-mode-active');
    if (document.documentElement) document.documentElement.classList.add('dev-mode-active');

    // Reset inline styling overflow & touch-action agar layar dapat digulir bebas
    document.body.style.overflow = '';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.touchAction = 'auto';
    if (document.documentElement) {
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = 'auto';
      document.documentElement.style.height = 'auto';
      document.documentElement.style.touchAction = 'auto';
    }

    // 2. Sembunyikan Storefront & Distributor Olsera
    if (storefront) storefront.style.display = 'none';
    if (platformTopbar) platformTopbar.style.display = 'none';
    if (siteHeader) siteHeader.style.display = 'none';
    if (tierBanner) tierBanner.style.display = 'none';
    if (distStrip) distStrip.style.display = 'none';
    if (olseraNav) olseraNav.style.display = 'none';
    if (olseraPortal) olseraPortal.style.display = 'none';
    if (devPreviewStrip) devPreviewStrip.style.display = 'none';
    if (devFab) devFab.style.display = 'none';

    // 3. Tampilkan Developer Super Admin Workspace
    if (devNav) devNav.style.display = 'flex';
    if (devWorkspace) {
      devWorkspace.style.display = 'block';
      devWorkspace.style.overflowY = 'visible';
      devWorkspace.style.touchAction = 'auto';
    }

    const consolePin = document.getElementById('devConsoleMasterPin');
    if (consolePin) consolePin.textContent = appState.masterDevPin || '8899';

    updateDevPortalMetrics();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Mode Tinjau Etalase Toko (Storefront Preview) dengan Developer Preview Strip
    document.body.classList.remove('dev-mode-active');
    if (document.documentElement) document.documentElement.classList.remove('dev-mode-active');
    document.body.style.overflowY = '';
    if (document.documentElement) document.documentElement.style.overflowY = '';

    if (devWorkspace) devWorkspace.style.display = 'none';
    if (devNav) devNav.style.display = 'none';
    if (olseraNav) olseraNav.style.display = 'none';
    if (olseraPortal) olseraPortal.style.display = 'none';
    if (distStrip) distStrip.style.display = 'none';

    if (storefront) storefront.style.display = 'block';
    if (platformTopbar) platformTopbar.style.display = 'none';
    if (siteHeader) siteHeader.style.display = 'block';
    if (tierBanner) tierBanner.style.display = 'block';

    if (appState.isDevMasterLoggedIn) {
      if (devPreviewStrip) {
        const isCentral = appState.storeSettings?.slug === 'sr12-central';
        const sName = isCentral ? 'SR12-Ku Pro' : ((appState.storeSettings && appState.storeSettings.storeName) || 'SR12-Ku Pro');
        const typeLabel = isCentral ? '🏛️ SR12 Official Central Hub' : '🏪 Toko Distributor';
        const previewDisplay = document.getElementById('devPreviewStoreNameDisplay');
        if (previewDisplay) {
          previewDisplay.innerHTML = `${sName} <span style="font-size: 0.72rem; color: #a5f3fc; font-weight: normal; margin-left: 4px;">(${typeLabel})</span>`;
        }
        const stripName = document.getElementById('devStripStoreName');
        const stripQuota = document.getElementById('devStripOrderQuota');
        if (stripName) {
          stripName.innerHTML = `${sName} <span style="font-size: 0.72rem; color: #a5f3fc; font-weight: normal; margin-left: 4px;">(${typeLabel})</span>`;
        }
        if (stripQuota) stripQuota.textContent = typeof appState.storeSettings?.orderQuota === 'number' ? appState.storeSettings.orderQuota : 10;
      }
      if (devFab) devFab.style.display = 'flex';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Logout Developer
function handleDeveloperLogout() {
  appState.isDevMasterLoggedIn = false;
  try {
    localStorage.removeItem('sr12_dev_session');
  } catch(e) {}

  document.body.classList.remove('dev-mode-active');
  if (document.documentElement) document.documentElement.classList.remove('dev-mode-active');
  document.body.style.overflowY = '';
  if (document.documentElement) document.documentElement.style.overflowY = '';

  const devWorkspace = document.getElementById('devSuperAdminWorkspace');
  const devNav = document.getElementById('devSuperAdminNavbar');
  const devPreviewStrip = document.getElementById('devPreviewStrip');
  const devFab = document.getElementById('devFloatingFab');
  const storefront = document.getElementById('publicStorefrontMain');
  const platformTopbar = document.getElementById('platformTopbar') || document.querySelector('.platform-topbar');
  const siteHeader = document.querySelector('.site-header');
  const tierBanner = document.querySelector('.tier-quick-banner');
  const modalDevPortal = document.getElementById('modalDevPortal');

  if (modalDevPortal) modalDevPortal.classList.remove('open');
  if (devWorkspace) devWorkspace.style.display = 'none';
  if (devNav) devNav.style.display = 'none';
  if (devPreviewStrip) devPreviewStrip.style.display = 'none';
  if (devFab) devFab.style.display = 'none';

  if (storefront) storefront.style.display = 'block';
  if (platformTopbar) platformTopbar.style.display = 'none';
  if (siteHeader) siteHeader.style.display = 'block';
  if (tierBanner) tierBanner.style.display = 'block';

  showToast('🔒 Sesi Developer Super Admin Telah Berakhir.');
}

// Buka Backoffice Olsera Toko Mana Saja dengan Akses Super Admin Developer
function openDevStoreAdminBackoffice(targetSlug) {
  if (targetSlug && targetSlug !== appState.currentStoreSlug) {
    loadStoreBySlug(targetSlug);
  }

  appState.isAdminMode = true;
  appState.isDistributorLoggedIn = true;

  // Sembunyikan Developer Workspace
  const devWorkspace = document.getElementById('devSuperAdminWorkspace');
  const devNav = document.getElementById('devSuperAdminNavbar');
  const devPreviewStrip = document.getElementById('devPreviewStrip');
  if (devWorkspace) devWorkspace.style.display = 'none';
  if (devNav) devNav.style.display = 'none';
  if (devPreviewStrip) devPreviewStrip.style.display = 'none';

  // Buka Olsera Backoffice
  if (typeof showDistributorPortalView === 'function') {
    showDistributorPortalView(true);
  }

  // Tampilkan banner Super Admin Developer
  const superAdminBanner = document.getElementById('olseraSuperAdminBanner');
  const superAdminStoreName = document.getElementById('olseraSuperAdminStoreName');
  if (superAdminBanner) superAdminBanner.style.display = 'flex';
  if (superAdminStoreName) superAdminStoreName.textContent = (appState.storeSettings && appState.storeSettings.storeName) || 'Toko Mitra';

  const backToDevBtn = document.getElementById('btnOlseraBackToDevConsole');
  if (backToDevBtn) backToDevBtn.style.display = 'inline-flex';

  showToast(`👑 Akses Super Admin: Masuk ke Backoffice "${appState.storeSettings?.storeName || 'Toko Mitra'}"!`);
}

function openDevCurrentStoreBackoffice() {
  openDevStoreAdminBackoffice(appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'sr12-central');
}

function contactMitraWA(phone, name) {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Halo ${name}, kami dari Tim Developer & Manajemen SR12...`)}`;
  window.open(url, '_blank');
}

// Change Developer Master PIN
function changeDevMasterPin() {
  const newPin = prompt('Masukkan Master PIN Baru untuk Pengembang (minimal 4 karakter):', appState.masterDevPin);
  if (newPin && newPin.trim().length >= 4) {
    appState.masterDevPin = newPin.trim();
    localStorage.setItem('sr12_master_dev_pin', appState.masterDevPin);
    const pinDisp = document.getElementById('currentMasterPinDisplay');
    const pinDispWs = document.getElementById('currentMasterPinDisplay_ws');
    if (pinDisp) pinDisp.textContent = `${appState.masterDevPin} (Aktif)`;
    if (pinDispWs) pinDispWs.textContent = `${appState.masterDevPin} (Aktif)`;
    alert(`✅ Master PIN Berhasil Diperbarui!\n\nMaster PIN Pengembang baru Anda: ${appState.masterDevPin}\n\nSimpan PIN ini baik-baik.`);
    showToast('🔑 Master PIN Developer Berhasil Diperbarui!');
  } else if (newPin !== null) {
    alert('PIN minimal harus 4 karakter!');
  }
}

function setTier(tierId, silent = false) {
  if (!SR12_TIERS[tierId]) return;
  appState.currentTier = tierId;
  
  const tierSelect = document.getElementById('globalTierSelect');
  if (tierSelect) tierSelect.value = tierId;
  const catTierSelect = document.getElementById('catalogTierSelect');
  if (catTierSelect) catTierSelect.value = tierId;

  renderTierQuickBanner();
  renderProducts();
  updateCartUI();

  if (!silent) {
    showToast(`Level diubah ke: ${SR12_TIERS[tierId].name} (Diskon ${SR12_TIERS[tierId].discountPct}%)`);
  }
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
          <img src="${prod.image || 'assets/hero-banner.jpg'}" alt="${prod.name}" loading="lazy" onerror="this.onerror=null; this.src='assets/hero-banner.jpg';" />
          <span class="badge-bpom-clean">🌿 BPOM</span>
          ${!isRetail ? `<span class="badge-disc-clean">-${currentTier.discountPct}%</span>` : ''}
          <span class="badge-stock-clean ${(prod.stock ?? 85) <= 15 ? 'low' : ''}">Stok: ${prod.stock ?? 85}</span>

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
            <span class="product-rating">★ ${prod.rating || '4.9'}</span>
          </div>

          <h4 class="product-title" onclick="openProductDetailModal('${prod.id}')">${prod.name}</h4>
          <p class="product-summary-text">${prod.summary}</p>

          <div class="price-block">
            <div class="price-main-row">
              <span class="tier-price-val">${formatRupiah(tierPrice)}</span>
              ${!isRetail ? `<span class="badge-mini-disc">-${currentTier.discountPct}%</span>` : ''}
            </div>
            <div class="price-sub-row">
              ${!isRetail ? `
                <span class="het-text">HET: <del>${formatRupiah(prod.het)}</del></span>
                <span class="tier-profit-margin">+Profit ${formatRupiah(profitMargin)}</span>
              ` : `
                <span class="het-text-plain">HET Resmi</span>
              `}
            </div>
          </div>

          <div class="card-actions">
            <button type="button" class="btn-product-capsule btn-product-capsule-cart" onclick="addToCart('${prod.id}')" title="Tambah ${prod.name} ke Keranjang" aria-label="Beli">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </button>
            <button type="button" class="btn-product-capsule btn-product-capsule-detail" onclick="${appState.isAdminMode ? `openEditProductModal('${prod.id}')` : `openProductDetailModal('${prod.id}')`}" title="${appState.isAdminMode ? 'Ubah Detail / Foto Produk' : 'Lihat Detail Produk'}" aria-label="Detail">
              ${appState.isAdminMode ? `
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              ` : `
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              `}
            </button>
            <button type="button" class="btn-product-capsule btn-product-capsule-share" onclick="openProductPromoShareModal('${prod.id}')" title="Bagikan &amp; Promosikan Produk Ini" aria-label="Bagikan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 8l5 4-5 4"/>
                <path d="M20 12H9a5 5 0 0 0-5 5v2"/>
              </svg>
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

  const countBadge = document.getElementById('cartCountBadge');
  if (countBadge) countBadge.textContent = totalPcs;
  const heroBadge = document.getElementById('distHeroCartBadge');
  if (heroBadge) heroBadge.textContent = totalPcs;
  const fabBadge = document.getElementById('fabCartBadge');
  if (fabBadge) fabBadge.textContent = totalPcs;

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

  const printActionText = document.getElementById('cartPrintActionText');
  if (printActionText) {
    printActionText.textContent = appState.isDropship ? '🖨️ Cetak Resi Dropship' : '📄 Cetak / Simpan Nota Pesanan';
  }

  // Update floating cart pill on distributor store mode
  const distCartFab = document.getElementById('distributorFloatingCart');
  const distCartCount = document.getElementById('distributorFloatingCartCount');
  const distCartTotal = document.getElementById('distributorFloatingCartTotal');
  if (distCartFab) {
    const isCentral = appState.storeSettings?.slug === 'sr12-central';
    const totalQty = appState.cart.reduce((sum, item) => sum + item.qty, 0);
    if (!isCentral && totalQty > 0) {
      distCartFab.style.display = 'block';
      if (distCartCount) distCartCount.textContent = totalQty;
      if (distCartTotal) distCartTotal.textContent = formatRupiah(subtotal);
    } else {
      distCartFab.style.display = 'none';
    }
  }

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

function formatWaNumber(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}
window.formatWaNumber = formatWaNumber;

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
  const rawTargetWa = appState.storeSettings.storeWaNumber || '6281234567890';
  const targetWa = formatWaNumber(rawTargetWa);

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

  // Pengurangan Stok Otomatis saat Pesanan Masuk
  if (Array.isArray(appState.products) && appState.cart.length > 0) {
    appState.cart.forEach(item => {
      const p = appState.products.find(pr => pr.id === item.productId);
      if (p) {
        const oldStock = Number(p.stock) || 0;
        const qtySold = Number(item.qty) || 0;
        const newStock = Math.max(0, oldStock - qtySold);
        p.stock = newStock;
        p.sold = (Number(p.sold) || 0) + qtySold;
        if (typeof recordStockMutation === 'function') {
          recordStockMutation({
            date: dateFormatted,
            productId: p.id,
            productName: p.name,
            type: 'OUT_ONLINE',
            typeLabel: 'Order Toko Online',
            qty: -qtySold,
            stockBefore: oldStock,
            stockAfter: newStock,
            refNo: webOrder.id,
            notes: `Order web dari ${appState.buyerDetails.name || 'Pelanggan'}`
          });
        }
      }
    });
    saveStoredProducts(appState.products);
    renderProducts();
    if (typeof renderInventoryTable === 'function') renderInventoryTable();
  }

  // Kosongkan keranjang pembeli agar siap untuk pesanan berikutnya (tidak tertinggal di browser)
  appState.cart = [];
  saveStoredCart(appState.cart);
  updateCartUI();

  // 1. Langsung tutup Keranjang Belanja agar layar bersih
  closeCartDrawer();

  // 2. Format Tautan WhatsApp Resmi
  const encoded = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${targetWa}&text=${encoded}`;

  showToast('🚀 Mengalihkan pesanan langsung ke WhatsApp...');

  // 3. Langsung buka WhatsApp tanpa menahan pengguna di jendela preview
  const waWin = window.open(waUrl, '_blank');
  if (!waWin || waWin.closed || typeof waWin.closed === 'undefined') {
    window.location.href = waUrl;
  }
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

// ========================================================
// SISTEM KONTROL GESTUR & PENGUNCI SCROLL LATAR MODAL
// ========================================================
let isModalHistoryPushed = false;

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  document.body.classList.add('modal-open');
  modal.classList.add('open');

  const dialog = modal.querySelector('.modal-dialog');
  if (dialog) {
    dialog.style.transform = '';
    dialog.style.opacity = '';
    dialog.style.transition = '';
  }

  // Daftarkan ke History Browser agar gestur geser tepi layar (back gesture bawaan HP) otomatis menutup modal
  try {
    if (!history.state || history.state.openModalId !== modalId) {
      history.pushState({ openModalId: modalId, isModal: true }, '');
      isModalHistoryPushed = true;
    }
  } catch(e) {}
}
window.openModal = openModal;

function ensureScrollUnlocked() {
  const remainingModals = document.querySelectorAll('.modal-backdrop.open');
  if (remainingModals.length === 0) {
    document.body.classList.remove('modal-open');
    if (document.documentElement) document.documentElement.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.overflowY = '';
    document.body.style.height = '';
    document.body.style.touchAction = '';
    if (document.documentElement) {
      document.documentElement.style.overflow = '';
      document.documentElement.style.overflowY = '';
      document.documentElement.style.height = '';
      document.documentElement.style.touchAction = '';
    }
  }
}
window.ensureScrollUnlocked = ensureScrollUnlocked;

function closeModal(modalId, isFromPopstate = false) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    const dialog = modal.querySelector('.modal-dialog');
    if (dialog) {
      dialog.style.transform = '';
      dialog.style.opacity = '';
      dialog.style.transition = '';
    }
  }

  // Jika ditutup bukan via popstate dan history state tercatat modal, kembalikan history agar bersih
  if (!isFromPopstate && isModalHistoryPushed && history.state && history.state.isModal) {
    try {
      history.back();
      isModalHistoryPushed = false;
    } catch(e) {}
  }

  const remainingModals = document.querySelectorAll('.modal-backdrop.open');
  if (remainingModals.length === 0) {
    ensureScrollUnlocked();
    isModalHistoryPushed = false;
    if (typeof appState !== 'undefined' && appState.activeOlseraTab === 'pos' && appState.posCart && appState.posCart.length > 0) {
      const bBar = document.getElementById('posMobileBottomBar');
      if (bBar) {
        bBar.classList.add('active');
        bBar.style.display = 'flex';
      }
    }
  }
}
window.closeModal = closeModal;

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    ensureScrollUnlocked();
  }
});

// Tangkap gestur Back bawaan HP (geser tepi layar kiri/kanan di Android / iOS)
window.addEventListener('popstate', (e) => {
  const openModals = Array.from(document.querySelectorAll('.modal-backdrop.open'));
  if (openModals.length > 0) {
    const topModal = openModals[openModals.length - 1];
    closeModal(topModal.id, true);
  }
});

function initUniversalModalGestures() {
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => {
    // 1. Ketuk area gelap di luar kotak modal untuk langsung menutup
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
    });

    // 2. Kunci total touchmove pada area gelap backdrop agar halaman di belakang TIDAK PERNAH bergerak
    backdrop.addEventListener('touchmove', (e) => {
      if (e.target === backdrop) {
        e.preventDefault();
      }
    }, { passive: false });

    // 3. Deteksi Gestur Geser Sentuhan Layar (Swipe to Dismiss)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isEdgeSwipe = false;
    let isPullDown = false;
    let isSwiping = false;
    let activeDialog = null;

    backdrop.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      activeDialog = backdrop.querySelector('.modal-dialog');
      if (!activeDialog) return;

      const screenWidth = window.innerWidth;
      // Sentuhan dari dekat tepi layar (<= 65px dari tepi kiri atau kanan)
      isEdgeSwipe = (touchStartX <= 65 || touchStartX >= screenWidth - 65);
      
      // Sentuhan di bagian atas modal ketika belum di-scroll
      const scrollTop = activeDialog.scrollTop || 0;
      isPullDown = (scrollTop <= 5 && touchStartY - activeDialog.getBoundingClientRect().top < 90);
      isSwiping = false;
    }, { passive: true });

    backdrop.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1 || !activeDialog) return;
      const touch = e.touches[0];
      const diffX = touch.clientX - touchStartX;
      const diffY = touch.clientY - touchStartY;
      const screenWidth = window.innerWidth;

      // Kasus A: Geser dari tepi layar ke tengah (Edge swipe inward)
      if (isEdgeSwipe) {
        const isSwipingInward = (touchStartX <= 65 && diffX > 15) || (touchStartX >= screenWidth - 65 && diffX < -15);
        if (isSwipingInward && Math.abs(diffX) > Math.abs(diffY)) {
          isSwiping = true;
          const moveAmount = touchStartX <= 65 ? Math.min(diffX, 150) : Math.max(diffX, -150);
          activeDialog.style.transition = 'none';
          activeDialog.style.transform = `translateX(${moveAmount}px)`;
          activeDialog.style.opacity = `${Math.max(0.4, 1 - Math.abs(diffX) / 300)}`;
          e.preventDefault(); // Kunci scroll halaman saat sedang swipe
          return;
        }
      }

      // Kasus B: Geser ke bawah (Pull down to dismiss)
      if (isPullDown && diffY > 15 && Math.abs(diffY) > Math.abs(diffX)) {
        isSwiping = true;
        activeDialog.style.transition = 'none';
        activeDialog.style.transform = `translateY(${Math.min(diffY, 160)}px)`;
        activeDialog.style.opacity = `${Math.max(0.4, 1 - diffY / 350)}`;
        e.preventDefault(); // Kunci scroll agar modal tidak tertarik ke background
        return;
      }
    }, { passive: false });

    backdrop.addEventListener('touchend', (e) => {
      if (!activeDialog || !isSwiping) {
        isEdgeSwipe = false;
        isPullDown = false;
        isSwiping = false;
        activeDialog = null;
        return;
      }

      const touch = e.changedTouches[0];
      const diffX = touch.clientX - touchStartX;
      const diffY = touch.clientY - touchStartY;
      const screenWidth = window.innerWidth;

      let shouldClose = false;

      // Kondisi tutup 1: Edge swipe melebihi 50px
      if (isEdgeSwipe) {
        if (touchStartX <= 65 && diffX > 50) shouldClose = true;
        if (touchStartX >= screenWidth - 65 && diffX < -50) shouldClose = true;
      }

      // Kondisi tutup 2: Pull down melebihi 65px
      if (isPullDown && diffY > 65) {
        shouldClose = true;
      }

      if (shouldClose) {
        activeDialog.style.transition = 'transform 0.22s ease-out, opacity 0.22s ease-out';
        if (isPullDown && diffY > 60) {
          activeDialog.style.transform = 'translateY(100%)';
        } else {
          activeDialog.style.transform = diffX > 0 ? 'translateX(100%)' : 'translateX(-100%)';
        }
        activeDialog.style.opacity = '0';
        setTimeout(() => {
          closeModal(backdrop.id);
          activeDialog.style.transition = '';
          activeDialog.style.transform = '';
          activeDialog.style.opacity = '';
        }, 190);
      } else {
        activeDialog.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease';
        activeDialog.style.transform = '';
        activeDialog.style.opacity = '';
        setTimeout(() => {
          if (activeDialog) activeDialog.style.transition = '';
        }, 220);
      }

      isEdgeSwipe = false;
      isPullDown = false;
      isSwiping = false;
      activeDialog = null;
    }, { passive: true });
  });

  // Pasang MutationObserver agar jika ada modal yang dibuka via classList.add('open'), otomatis terdaftar
  const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('modal-backdrop')) {
          if (target.classList.contains('open')) {
            document.body.classList.add('modal-open');
            try {
              if (!history.state || history.state.openModalId !== target.id) {
                history.pushState({ openModalId: target.id, isModal: true }, '');
                isModalHistoryPushed = true;
              }
            } catch(e) {}
          }
        }
      }
    });
  });

  backdrops.forEach(b => {
    modalObserver.observe(b, { attributes: true, attributeFilter: ['class'] });
  });
}
window.initUniversalModalGestures = initUniversalModalGestures;

// ========================================================
// GESTUR GESER LAYAR TEPI KE TENGAH DI HP (PREDICTIVE BACK)
// Kembali ke halaman sebelumnya, tutup modal/drawer, atau keluar
// ========================================================
function initGlobalEdgeSwipeBackGesture() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isTrackingEdgeSwipe = false;
  const indicator = document.getElementById('edgeSwipeBackIndicator');
  const textEl = document.getElementById('edgeSwipeBackText');

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();

    // Hanya aktif jika sentuhan dimulai dari area dekat tepi kiri layar (<= 45px)
    isTrackingEdgeSwipe = touchStartX <= 45;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isTrackingEdgeSwipe || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    // Gerakan harus dominan ke kanan (horizontal)
    if (diffX > 15 && diffX > Math.abs(diffY) * 1.2) {
      if (indicator) {
        indicator.classList.add('active');
        const progress = Math.min(1, diffX / 75);
        indicator.style.opacity = `${0.35 + (progress * 0.65)}`;
        if (textEl) {
          textEl.textContent = diffX >= 70 ? 'Lepas untuk Kembali' : 'Kembali';
        }
      }
    } else if (diffY > Math.abs(diffX) && diffY > 20) {
      // Jika ternyata gerakan scroll vertikal, batalkan
      isTrackingEdgeSwipe = false;
      if (indicator) indicator.classList.remove('active');
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isTrackingEdgeSwipe) return;
    isTrackingEdgeSwipe = false;

    if (indicator) {
      indicator.classList.remove('active');
    }

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    const elapsed = Date.now() - touchStartTime;

    // Trigger jika tarikan mencapai >= 65px dan dominan horizontal dalam waktu < 800ms
    if (diffX >= 65 && diffX > Math.abs(diffY) * 1.2 && elapsed < 800) {
      handleGlobalBackNavigation();
    }
  }, { passive: true });
}

function handleGlobalBackNavigation() {
  // 1. Jika ada modal aktif yang terbuka, tutup modal teratas
  const openModals = Array.from(document.querySelectorAll('.modal-backdrop.open'));
  if (openModals.length > 0) {
    const topModal = openModals[openModals.length - 1];
    closeModal(topModal.id);
    return;
  }

  // 2. Jika Olsera sidebar drawer terbuka, tutup drawer
  const sidebar = document.getElementById('olseraSidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    if (typeof closeOlseraSidebarDrawer === 'function') {
      closeOlseraSidebarDrawer();
    }
    return;
  }

  // 3. Jika Keranjang Belanja (cart drawer) terbuka, tutup keranjang
  const cartDrawer = document.getElementById('cartDrawer');
  if (cartDrawer && cartDrawer.classList.contains('open')) {
    if (typeof closeCartDrawer === 'function') {
      closeCartDrawer();
    }
    return;
  }

  // 4. Jika di dalam Portal Olsera Kasir/Gudang
  if (document.body.classList.contains('olsera-portal-active')) {
    const currentTab = (typeof appState !== 'undefined' && appState.activeOlseraTab) || 'pos';
    if (currentTab !== 'pos') {
      // Kembali ke kasir POS
      if (typeof switchOlseraTab === 'function') {
        switchOlseraTab('pos');
        showToast('🔙 Kembali ke Kasir Point of Sale');
      }
    } else {
      // Jika sudah di POS, kembali ke Tinjau Etalase Toko
      if (typeof showDistributorPortalView === 'function') {
        showDistributorPortalView(false);
        showToast('🏠 Kembali ke Tinjau Toko Online');
      }
    }
    return;
  }

  // 5. Jika di etalase toko pembeli
  if (window.history.length > 1) {
    window.history.back();
  } else {
    showToast('👋 Tekan kembali sekali lagi atau tombol Home untuk keluar');
  }
}
window.initGlobalEdgeSwipeBackGesture = initGlobalEdgeSwipeBackGesture;
window.handleGlobalBackNavigation = handleGlobalBackNavigation;

function openProductDetailModal(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  const bBar = document.getElementById('posMobileBottomBar');
  if (bBar) {
    bBar.classList.remove('active');
    bBar.style.display = 'none';
  }
  document.body.classList.add('modal-open');

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
  const stockEl = document.getElementById('modalProdStock');
  if (stockEl) stockEl.textContent = `${typeof prod.stock !== 'undefined' ? prod.stock : 85} pcs`;
  
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

  if (typeof openModal === 'function') {
    openModal('modalProductDetail');
  } else if (modal) {
    modal.classList.add('open');
  }
}

function openEditProductModal(productId) {
  const prod = appState.products.find(p => p.id === productId);
  if (!prod) return;

  const bBar = document.getElementById('posMobileBottomBar');
  if (bBar) {
    bBar.classList.remove('active');
    bBar.style.display = 'none';
  }
  document.body.classList.add('modal-open');

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
  const fileInput = document.getElementById('editProdFileInput');

  if (fileInput) fileInput.value = '';
  if (nameInput) nameInput.value = prod.name;
  if (catInput) catInput.value = prod.category;
  if (hetInput) {
    hetInput.value = prod.het;
    updateEditProdTierCalc(prod.het);
  }
  if (stockInput) stockInput.value = (typeof prod.stock !== 'undefined') ? prod.stock : 85;
  if (summaryInput) summaryInput.value = prod.summary || '';
  if (imgUrlInput) imgUrlInput.value = prod.image && !prod.image.startsWith('data:') ? prod.image : '';
  if (imgPreview) {
    imgPreview.src = prod.image || 'assets/hero-banner.jpg';
    imgPreview.style.display = 'block';
  }

  if (modal) modal.classList.add('open');
}

async function handleEditProductSubmit(e) {
  if (e) e.preventDefault();

  const prodId = appState.activeEditingProductId;
  const prod = appState.products.find(p => p.id === prodId);
  if (!prod) return;

  const btnSubmit = document.getElementById('btnSubmitEditProduct');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Menyimpan ke Database...';
  }

  try {
    const newName = document.getElementById('editProdName')?.value.trim();
    const newCat = document.getElementById('editProdCategory')?.value;
    const newHet = Number(document.getElementById('editProdHet')?.value);
    const stockRaw = document.getElementById('editProdStock')?.value;
    const newStock = (stockRaw !== '' && !isNaN(Number(stockRaw))) ? Math.max(0, parseInt(stockRaw, 10)) : (typeof prod.stock !== 'undefined' ? prod.stock : 85);
    const newSummary = document.getElementById('editProdSummary')?.value.trim();
    const newImgUrl = document.getElementById('editProdImgUrl')?.value.trim();

    // Pilih gambar baru jika ada unggahan/preset atau jika input URL diisi baru
    let finalImage = prod.image;
    if (appState.tempEditImageBase64 && appState.tempEditImageBase64 !== prod.image) {
      // Pastikan foto terkompresi sebelum disimpan agar ringan & cepat
      if (appState.tempEditImageBase64.startsWith('data:') && appState.tempEditImageBase64.length > 30000) {
        finalImage = await compressImageSource(appState.tempEditImageBase64, 500, 0.76);
      } else {
        finalImage = appState.tempEditImageBase64;
      }
    } else if (newImgUrl && newImgUrl !== prod.image) {
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
    prod.customEdited = true;

    // Simpan langsung ke IndexedDB (Permanen, kapasitas ratusan MB)
    if (typeof dbSaveProduct === 'function') {
      await dbSaveProduct(prod);
    }

    // Simpan ke LocalStorage sebagai fast-cache
    saveStoredProducts(appState.products);

    renderProducts();
    updateCartUI();
    if (typeof renderInventoryTable === 'function') renderInventoryTable();
    if (typeof renderPosProducts === 'function') renderPosProducts();

    // Simpan juga ke Supabase Cloud agar aman dari clear history browser
    if (typeof saveProductToSupabase === 'function') {
      saveProductToSupabase(prod, appState.storeSettings?.slug);
    }

    closeModal('modalEditProduct');
    showToast(`✅ Berhasil! Foto & data produk "${prod.name}" tersimpan permanen.`);
  } catch (err) {
    console.error('Error saat menyimpan produk:', err);
    alert('Terjadi kendala saat menyimpan produk: ' + err.message);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = '💾 Simpan Perubahan Produk';
    }
  }
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
  showToast(`🖼️ Foto kemasan produk dipilih: ${presetType}`);
}

function openStoreSettingsModal() {
  if (!appState.isDistributorLoggedIn && !appState.isAdminMode) {
    showToast('🔒 Pengaturan Toko Terkunci. Khusus Pemilik Toko, silakan login.');
    openDistributorLoginModal();
    return;
  }
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

  const dangerZone = document.getElementById('dangerZoneDeleteStore');
  if (dangerZone) {
    dangerZone.style.display = cfg.slug === 'sr12-central' ? 'none' : 'block';
  }

  if (modal) modal.classList.add('open');
}

/**
 * Hapus Toko Mitra Secara Permanen
 */
async function deletePartnerStore(slug) {
  if (!slug) return;
  if (slug === 'sr12-central') {
    alert('⚠️ Toko Utama Pusat (SR12-Ku Pro) adalah fondasi platform pusat dan tidak dapat dihapus.');
    return;
  }

  const targetStore = (appState.partnerStores || []).find(s => s.slug === slug);
  const storeName = targetStore ? targetStore.storeName : slug;

  const confirmed = confirm(
    `⚠️ KONFIRMASI HAPUS TOKO PERMANEN\n\n` +
    `Apakah Anda yakin ingin MENGHAPUS toko mitra:\n` +
    `"${storeName}" (Slug: ${slug})?\n\n` +
    `• Toko ini akan dihapus dari daftar toko aktif, database lokal, dan cloud server.\n` +
    `• Seluruh pengaturan identitas toko, tema, dan etalase khusus akan dihapus permanen.\n` +
    `• Tindakan ini TIDAK DAPAT dibatalkan.\n\n` +
    `Lanjutkan penghapusan?`
  );

  if (!confirmed) return;

  // 1. Simpan slug ke daftar tombstone (blacklist) agar sinkronisasi cloud tidak memunculkannya lagi
  try {
    const rawDeleted = localStorage.getItem('sr12_deleted_store_slugs');
    let deletedSlugs = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!Array.isArray(deletedSlugs)) deletedSlugs = [];
    if (!deletedSlugs.includes(slug)) {
      deletedSlugs.push(slug);
      localStorage.setItem('sr12_deleted_store_slugs', JSON.stringify(deletedSlugs));
    }
  } catch (e) {
    console.warn('Gagal menyimpan tombstone toko terhapus:', e);
  }

  // 2. Hapus dari appState.partnerStores
  appState.partnerStores = (appState.partnerStores || []).filter(s => s.slug !== slug);
  saveStoredPartnerStores(appState.partnerStores);

  // 3. Hapus juga dari antrean pending jika ada
  if (Array.isArray(appState.pendingStoreApps)) {
    appState.pendingStoreApps = appState.pendingStoreApps.filter(a => a.slug !== slug);
    saveStoredPendingStoreApps(appState.pendingStoreApps);
  }

  // 4. Hapus sesi distributor lokal jika sedang login di toko yang dihapus
  try {
    const savedSess = localStorage.getItem('sr12_distributor_session');
    if (savedSess) {
      const parsed = JSON.parse(savedSess);
      if (parsed && parsed.slug === slug) {
        localStorage.removeItem('sr12_distributor_session');
        appState.isDistributorLoggedIn = false;
        appState.isAdminMode = false;
      }
    }
  } catch (e) {}

  // 5. Hapus dari Supabase Cloud (jika Supabase aktif)
  if (typeof deleteStoreFromSupabase === 'function') {
    try {
      await deleteStoreFromSupabase(slug);
    } catch (supaErr) {
      console.warn('Error deleting from Supabase:', supaErr);
    }
  }

  // 6. Hapus dari Local REST Server (jika aktif secara lokal)
  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    try {
      await fetch(apiBase + '/api/stores/' + slug, { method: 'DELETE' });
    } catch (apiErr) {}
  }

  // 7. Jika toko yang dihapus adalah toko yang sedang aktif dibuka, beralih ke sr12-central
  if (appState.currentStoreSlug === slug) {
    switchPartnerStore('sr12-central');
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', window.location.pathname);
    }
  } else {
    renderStoreDropdown();
    renderStoreBranding();
  }

  // 8. Tutup modal pengaturan jika terbuka
  if (typeof closeModal === 'function') {
    closeModal('modalStoreSettings');
  }

  // 9. Perbarui metrik Developer Workspace, Olsera headers, dan modal switcher
  if (typeof updateDeveloperMetricsUI === 'function') {
    updateDeveloperMetricsUI();
  }
  if (typeof renderDistributorNetworkMitraTable === 'function') {
    renderDistributorNetworkMitraTable();
  }
  if (typeof checkDistributorPendingStoreRegistrations === 'function') {
    checkDistributorPendingStoreRegistrations();
  }
  if (typeof updateOlseraHeaderMeta === 'function') {
    updateOlseraHeaderMeta();
  }
  if (typeof renderSwitchStoreModal === 'function') {
    renderSwitchStoreModal();
  }

  showToast(`🗑️ Toko "${storeName}" berhasil dihapus secara permanen.`);
}

function deleteCurrentActiveStore() {
  if (!appState.storeSettings || !appState.storeSettings.slug) return;
  deletePartnerStore(appState.storeSettings.slug);
}

window.deletePartnerStore = deletePartnerStore;
window.deleteCurrentActiveStore = deleteCurrentActiveStore;

function chatActiveStoreWa() {
  const cfg = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const cleanWa = (cfg.storeWaNumber || '081234567890').replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo ${cfg.storeName}, saya ingin konsultasi produk SR12...`)}`, '_blank');
}
window.chatActiveStoreWa = chatActiveStoreWa;

/**
 * MODAL: Ganti & Kelola Toko Mitra
 */
function openStoreSwitchModal() {
  // Hanya dapat diakses oleh Developer / Super Admin
  if (!appState.isDevMasterLoggedIn) {
    if (typeof openDevPinPrompt === 'function') {
      openDevPinPrompt(() => {
        const modal = document.getElementById('modalSwitchStore');
        if (!modal) return;
        renderSwitchStoreModal();
        modal.classList.add('open');
      });
      return;
    }
  }
  const modal = document.getElementById('modalSwitchStore');
  if (!modal) return;
  renderSwitchStoreModal();
  modal.classList.add('open');
}
window.openStoreSwitchModal = openStoreSwitchModal;

function renderSwitchStoreModal(filterText = '') {
  const container = document.getElementById('switchStoreCardsContainer');
  if (!container) return;

  const q = (filterText || '').trim().toLowerCase();
  const currentStore = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const currentSlug = currentStore.slug || 'alzam-agency';
  const currentOwner = (currentStore.storeOwner || '').trim().toLowerCase();
  const currentName = (currentStore.storeName || '').trim().toLowerCase();

  // FILTER KEPEMILIKAN TOKO KETAT:
  // Hanya tampilkan toko miliknya sendiri atau cabang binaannya
  const isMasterDev = !!appState.isDevMasterLoggedIn;
  const authorizedStores = (appState.partnerStores || []).filter(s => {
    if (!s || !s.slug) return false;
    if (isMasterDev) return true;

    // 1. Toko yang sedang aktif
    if (s.slug === currentSlug) return true;

    // 2. Pemilik yang sama persis
    if (s.storeOwner && s.storeOwner.trim().toLowerCase() === currentOwner) return true;

    // 3. Toko cabang / binaan yang memilih distributor ini sebagai pembina
    if (s.recommenderSlug === currentSlug) return true;

    // 4. Afiliasi agensi yang sama (misal sama-sama naungan Alzam Agency)
    if (currentName.includes('alzam') && (s.storeName?.toLowerCase().includes('alzam') || s.storeOwner?.toLowerCase().includes('alzam'))) return true;
    if (s.recommenderDistributor && s.recommenderDistributor.toLowerCase().includes(currentName)) return true;

    // Toko milik distributor lain di luar agensi ini tidak diizinkan masuk
    return false;
  });

  const stores = authorizedStores.filter(s => {
    if (!q) return true;
    return (s.storeName && s.storeName.toLowerCase().includes(q)) ||
           (s.storeOwner && s.storeOwner.toLowerCase().includes(q)) ||
           (s.storeCity && s.storeCity.toLowerCase().includes(q)) ||
           (s.slug && s.slug.toLowerCase().includes(q));
  });

  const totalStoresBadge = document.getElementById('switchStoreTotalBadge');
  if (totalStoresBadge) {
    totalStoresBadge.textContent = `${authorizedStores.length} Toko Anda`;
  }

  if (stores.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px 10px; color: #94a3b8;">
        <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🔍</span>
        <div style="font-weight: 700; font-size: 0.9rem;">Tidak ada cabang toko lain yang cocok</div>
        <p style="font-size: 0.76rem; margin: 4px 0 0 0;">Hanya toko &amp; cabang resmi di bawah naungan ${currentStore.storeName || 'Alzam Agency'} yang ditampilkan di sini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = stores.map(s => {
    const isCurrent = s.slug === appState.currentStoreSlug;
    const isCentral = s.slug === 'sr12-central';
    const tierObj = SR12_TIERS[s.partnerTier] || SR12_TIERS.reseller;
    const initial = (s.storeName || 'SR').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();

    return `
      <div style="background: ${isCurrent ? '#f0fdf4' : '#ffffff'}; border: 1.5px solid ${isCurrent ? '#10b981' : '#e2e8f0'}; border-radius: 12px; padding: 12px 16px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 200px; flex: 1;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: ${isCentral ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #0284c7, #0369a1)'}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">
            ${s.storeLogoUrl ? `<img src="${s.storeLogoUrl}" alt="${s.storeName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : initial}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-weight: 800; font-size: 0.92rem; color: #0f172a;">${s.storeName}</span>
              ${isCurrent ? `<span style="background: #dcfce7; color: #15803d; font-size: 0.66rem; font-weight: 800; padding: 2px 7px; border-radius: 999px; border: 1px solid #86efac;">🟢 Sedang Aktif</span>` : ''}
              <span style="background: rgba(56, 189, 248, 0.12); color: #0284c7; font-size: 0.66rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${tierObj.name}</span>
            </div>
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px; display: flex; gap: 8px; flex-wrap: wrap;">
              <span>👤 ${s.storeOwner || '-'}</span>
              <span>📍 ${s.storeCity || '-'}</span>
              <span>📱 +${s.storeWaNumber || '-'}</span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace; margin-top: 2px;">?store=${s.slug}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
          ${!isCurrent ? `
            <button type="button" onclick="switchPartnerStore('${s.slug}'); closeModal('modalSwitchStore');" style="background: #0284c7; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.76rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 5px rgba(2, 132, 199, 0.25);">
              🏪 Buka
            </button>
          ` : `
            <button type="button" disabled style="background: #e2e8f0; color: #64748b; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.76rem; cursor: default;">
              ✓ Aktif
            </button>
          `}
          ${(!isCentral && appState.isDevMasterLoggedIn) ? `
            <button type="button" onclick="deletePartnerStore('${s.slug}')" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 0.76rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;" title="Hapus Toko Permanen">
              🗑️ Hapus
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function filterSwitchStoreModalList(text) {
  renderSwitchStoreModal(text);
}

window.openStoreSwitchModal = openStoreSwitchModal;
window.renderSwitchStoreModal = renderSwitchStoreModal;
window.filterSwitchStoreModalList = filterSwitchStoreModalList;

function openStoreSettingsModalWithFocus(target) {
  openStoreSettingsModal();
  setTimeout(() => {
    if (target === 'banner') {
      const bannerInput = document.getElementById('settingBannerFileInput');
      if (bannerInput) {
        bannerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        bannerInput.click();
      }
    } else if (target === 'logo') {
      const logoInput = document.getElementById('settingLogoFileInput');
      if (logoInput) {
        logoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        logoInput.click();
      }
    }
  }, 200);
}
window.openStoreSettingsModalWithFocus = openStoreSettingsModalWithFocus;

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
    ...appState.storeSettings,
    storeName: name || 'SR12 Partner Hub',
    storeTagline: tagline || 'Herbal Skin Care Ecosystem',
    storeTheme: appState.storeSettings.storeTheme || 'emerald',
    heroTitle: heroTitle || DEFAULT_STORE_SETTINGS.heroTitle,
    heroSubtitle: heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle,
    heroBannerUrl: bannerUrl,
    storeLogoText: logoText,
    storeLogoUrl: logoUrl,
    storeWaNumber: wa || (appState.storeSettings && appState.storeSettings.storeWaNumber) || '6281234567890',
    storeCity: city || (appState.storeSettings && appState.storeSettings.storeCity) || 'Jakarta',
    storeOwner: owner || (appState.storeSettings && appState.storeSettings.storeOwner) || 'Mitra Resmi',
    feePayer: feePayer,
    storeAdminPin: storeAdminPin
  };

  // Sinkronkan ke daftar partnerStores agar direktori pusat terupdate seketika
  const currentIdx = (appState.partnerStores || []).findIndex(s => s.slug === appState.currentStoreSlug);
  if (currentIdx > -1) {
    appState.partnerStores[currentIdx] = {
      ...appState.partnerStores[currentIdx],
      ...appState.storeSettings
    };
    saveStoredPartnerStores(appState.partnerStores);
  }

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
  if (typeof dbSaveProduct === 'function') {
    dbSaveProduct(newProduct);
  }
  saveStoredProducts(appState.products);

  renderProducts();
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderPosProducts === 'function') renderPosProducts();
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
  if (tabId === 'products') tabId = 'catalog';
  appState.activeTab = tabId;
  const sections = ['catalogSection', 'rewardsSection', 'marketingKitSection', 'resellersSection', 'marketersSection'];
  sections.forEach(secId => {
    const el = document.getElementById(secId);
    if (el) el.style.display = 'none';
  });

  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tabId || (tabId === 'catalog' && btn.dataset.tab === 'products')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (tabId === 'catalog') {
    const cSec = document.getElementById('catalogSection');
    if (cSec) cSec.style.display = 'block';
  } else if (tabId === 'rewards') {
    const rSec = document.getElementById('rewardsSection');
    if (rSec) rSec.style.display = 'block';
  } else if (tabId === 'marketing') {
    const mSec = document.getElementById('marketingKitSection');
    if (mSec) mSec.style.display = 'block';
  } else if (tabId === 'resellers') {
    const resSec = document.getElementById('resellersSection');
    if (resSec) resSec.style.display = 'block';
    renderResellers();
  } else if (tabId === 'marketers') {
    const mrkSec = document.getElementById('marketersSection');
    if (mrkSec) mrkSec.style.display = 'block';
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

  // Workspace Elements (Dedicated Full-Screen Console)
  const wsTx = document.getElementById('devWsTotalTx');
  const wsFee = document.getElementById('devWsTotalFee');
  const wsStores = document.getElementById('devWsTotalStores');
  const wsTopup = document.getElementById('devWsTotalTopup');
  const wsGmv = document.getElementById('devWsTotalGMV');
  const wsPin = document.getElementById('currentMasterPinDisplay_ws');
  const navStores = document.getElementById('devNavStoresCount');
  const navFee = document.getElementById('devNavFeeCount');
  const navPendingBtn = document.getElementById('devNavPendingBtn');
  const navPendingBadge = document.getElementById('devNavPendingBadge');
  const wsPendingBadge = document.getElementById('devPendingCountBadge_ws');
  const storesTableBody_ws = document.getElementById('devStoresTableBody_ws');
  const pendingTableBody_ws = document.getElementById('devPendingStoresTableBody_ws');
  const networkMitraTableBody = document.getElementById('devNetworkMitraTableBody_ws');

  const totalStores = appState.partnerStores.length;
  const totalTx = m.totalPlatformTransactions || 0;
  const totalFee = totalTx * appState.platformFee;

  const storeTopupSum = appState.partnerStores.reduce((acc, s) => acc + (s.totalTopupPaid || 0), 0);
  const totalTopupKas = storeTopupSum;

  // Sync Modal Numbers
  if (dTx) dTx.textContent = totalTx.toLocaleString('id-ID');
  if (dFee) dFee.textContent = formatRupiah(totalFee);
  if (dStores) dStores.textContent = `${totalStores} Toko`;
  if (dGmv) dGmv.textContent = formatRupiah(m.totalGMV || 0);
  if (dTopup) dTopup.textContent = formatRupiah(totalTopupKas);
  if (pinDisp) pinDisp.textContent = `${appState.masterDevPin} (Aktif)`;
  if (storesCounter) storesCounter.textContent = `${totalStores} Toko Terdaftar`;

  // Sync Workspace Console Numbers
  if (wsTx) wsTx.textContent = totalTx.toLocaleString('id-ID');
  if (wsFee) wsFee.textContent = formatRupiah(totalFee);
  if (wsStores) wsStores.textContent = `${totalStores} Toko`;
  if (wsTopup) wsTopup.textContent = formatRupiah(totalTopupKas);
  if (wsGmv) wsGmv.textContent = formatRupiah(m.totalGMV || 0);
  if (wsPin) wsPin.textContent = `${appState.masterDevPin} (Aktif)`;
  if (navStores) navStores.textContent = `${totalStores} Toko`;
  if (navFee) navFee.textContent = formatRupiah(totalFee);

  // Sync Strip Preview Topbar & Master PIN
  const stripName = document.getElementById('devStripStoreName');
  const stripQuota = document.getElementById('devStripOrderQuota');
  const consolePin = document.getElementById('devConsoleMasterPin');
  const isCentral = appState.storeSettings?.slug === 'sr12-central';
  const sName = isCentral ? 'SR12-Ku Pro' : ((appState.storeSettings && appState.storeSettings.storeName) || 'Toko Aktif');
  const typeLabel = isCentral ? '🏛️ SR12 Official Central Hub' : '🏪 Toko Distributor';

  if (stripName) {
    stripName.innerHTML = `${sName} <span style="font-size: 0.72rem; color: #a5f3fc; font-weight: normal; margin-left: 4px;">(${typeLabel})</span>`;
  }
  if (stripQuota) stripQuota.textContent = typeof appState.storeSettings?.orderQuota === 'number' ? appState.storeSettings.orderQuota : 10;
  if (consolePin) consolePin.textContent = appState.masterDevPin || '8899';

  // 1. Render Modal Stores Table
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
            <div style="display: inline-flex; gap: 4px; justify-content: center; align-items: center;">
              <button onclick="switchPartnerStore('${s.slug}'); closeModal('modalDevPortal');" style="background: #0284c7; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                Buka
              </button>
              ${s.slug !== 'sr12-central' ? `
              <button onclick="deletePartnerStore('${s.slug}')" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;" title="Hapus Toko Permanen">
                🗑️
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Workspace Stores Table (with Storefront Preview & Instant Backoffice access)
  if (storesTableBody_ws) {
    storesTableBody_ws.innerHTML = appState.partnerStores.map(s => {
      const tierObj = SR12_TIERS[s.partnerTier] || SR12_TIERS.reseller;
      const quotaVal = typeof s.orderQuota === 'number' ? s.orderQuota : 10;
      return `
        <tr style="border-bottom: 1px solid #334155;">
          <td data-label="Nama Toko" style="padding: 10px 12px; font-weight: 700;">
            <div style="font-size: 0.9rem; color: #f8fafc;">${s.storeName}</div>
            <div style="font-size: 0.72rem; color: #38bdf8; font-family: monospace;">?store=${s.slug}</div>
          </td>
          <td data-label="Pemilik & Kota" style="padding: 10px 12px;">
            <div style="font-weight: 600; color: #f1f5f9;">${s.storeOwner}</div>
            <div style="font-size: 0.7rem; color: #94a3b8;">📍 ${s.storeCity || '-'}</div>
          </td>
          <td data-label="Level" style="padding: 10px 12px;"><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">${tierObj.name}</span></td>
          <td data-label="WhatsApp" style="padding: 10px 12px; font-family: monospace; color: #cbd5e1;">+${s.storeWaNumber}</td>
          <td data-label="Sisa Kuota" style="padding: 10px 12px; text-align: center;">
            <span style="background: ${quotaVal <= 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${quotaVal <= 2 ? '#f87171' : '#34d399'}; padding: 3px 10px; border-radius: 9999px; font-weight: 800; font-size: 0.75rem;">
              ${quotaVal} Order
            </span>
          </td>
          <td data-label="Aksi" style="padding: 10px 12px; text-align: center; white-space: nowrap;">
            <div style="display: inline-flex; gap: 8px; align-items: center; width: 100%; justify-content: flex-end; flex-wrap: wrap;">
              <button type="button" onclick="switchPartnerStore('${s.slug}'); showDeveloperWorkspaceView(false);" style="background: #0284c7; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                👁️ Tinjau Etalase
              </button>
              <button type="button" onclick="openDevStoreAdminBackoffice('${s.slug}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);">
                👑 Masuk Backoffice
              </button>
              ${s.slug !== 'sr12-central' ? `
              <button type="button" onclick="deletePartnerStore('${s.slug}')" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);" title="Hapus Toko Permanen">
                🗑️ Hapus Toko
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update Pending Stores Counter & Alert
  const pendingCount = (appState.pendingStoreApps || []).length;
  const pendingCounterEl = document.getElementById('devPendingStoresCounter');
  const topbarAlertBtn = document.getElementById('btnPendingStoreAlert');

  if (pendingCounterEl) {
    pendingCounterEl.textContent = `${pendingCount} Menunggu Verifikasi`;
    pendingCounterEl.style.background = pendingCount > 0 ? '#f59e0b' : '#334155';
    pendingCounterEl.style.color = pendingCount > 0 ? '#78350f' : '#94a3b8';
  }

  const footerPendingBadge = document.getElementById('footerDevPendingBadge');
  if (footerPendingBadge) {
    if (pendingCount > 0) {
      footerPendingBadge.style.display = 'inline-block';
      footerPendingBadge.textContent = `${pendingCount} Pengajuan Baru`;
    } else {
      footerPendingBadge.style.display = 'none';
    }
  }

  const pendingTabBadge = document.getElementById('devPendingTabBadge');
  if (pendingTabBadge) {
    if (pendingCount > 0) {
      pendingTabBadge.style.display = 'inline-block';
      pendingTabBadge.textContent = pendingCount;
    } else {
      pendingTabBadge.style.display = 'none';
    }
  }

  // Update Workspace Nav & Tab Pending Badges
  if (wsPendingBadge) {
    if (pendingCount > 0) {
      wsPendingBadge.style.display = 'inline-block';
      wsPendingBadge.textContent = pendingCount;
    } else {
      wsPendingBadge.style.display = 'none';
    }
  }

  if (navPendingBtn) {
    if (pendingCount > 0) {
      navPendingBtn.style.display = 'inline-flex';
      if (navPendingBadge) navPendingBadge.textContent = pendingCount;
    } else {
      navPendingBtn.style.display = 'none';
    }
  }

  if (topbarAlertBtn) {
    topbarAlertBtn.style.display = 'none';
  }

  // 3. Render Pending Stores Table Body (Modal)
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

  // 4. Render Pending Stores Table Body (Workspace Dedicated)
  if (pendingTableBody_ws) {
    if (pendingCount === 0) {
      pendingTableBody_ws.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 28px; color: #94a3b8; font-style: italic;">
            ✨ Tidak ada antrean pengajuan toko baru. Semua permohonan telah diverifikasi & disetujui.
          </td>
        </tr>
      `;
    } else {
      pendingTableBody_ws.innerHTML = appState.pendingStoreApps.map(app => {
        const tierObj = SR12_TIERS[app.partnerTier] || SR12_TIERS.distributor;
        return `
          <tr style="border-bottom: 1px solid #334155;">
            <td data-label="Toko & ID" style="padding: 10px 12px;">
              <b style="color: #f8fafc; font-size: 0.88rem;">${app.storeName}</b>
              <div style="font-size: 0.7rem; color: #f59e0b; font-family: monospace;">#${app.id} &middot; ?store=${app.slug}</div>
            </td>
            <td data-label="Calon Pemilik" style="padding: 10px 12px;">
              <div style="font-weight: 600; color: #f1f5f9;">${app.storeOwner}</div>
              <div style="font-size: 0.7rem; color: #94a3b8;">📍 ${app.storeCity}</div>
            </td>
            <td data-label="Level" style="padding: 10px 12px;">
              <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">
                ${tierObj.name}
              </span>
            </td>
            <td data-label="Dokumen SK" style="padding: 10px 12px; white-space: nowrap;">
              <button type="button" onclick="event.stopPropagation(); previewSkDocument('${app.id}')" title="Klik untuk memeriksa dokumen SK resmi" style="background: #0f172a; border: 1.5px solid #f59e0b; color: #fbbf24; padding: 6px 12px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
                <span>📄</span> <span>${app.skNumber || 'Lihat Dokumen SK'}</span> <span style="font-size: 0.7rem; opacity: 0.8;">↗️</span>
              </button>
            </td>
            <td data-label="WhatsApp" style="padding: 10px 12px;">
              <button type="button" onclick="contactApplicantWA('${app.id}')" style="background: rgba(37, 211, 102, 0.15); border: 1px solid #25d366; color: #4ade80; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                <span>📱</span> +${app.storeWaNumber}
              </button>
            </td>
            <td data-label="Status" style="padding: 10px 12px; text-align: center;">
              <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 3px 10px; border-radius: 9999px; font-weight: 800; font-size: 0.7rem; white-space: nowrap;">
                ⏳ PENDING
              </span>
            </td>
            <td data-label="Aksi" style="padding: 10px 12px; text-align: center; white-space: nowrap;">
              <div style="display: inline-flex; gap: 6px; justify-content: flex-end; align-items: center; width: 100%; flex-wrap: wrap;">
                <button type="button" onclick="event.stopPropagation(); previewSkDocument('${app.id}')" title="Buka & Verifikasi Berkas SK" style="background: #0284c7; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                  <span>📄</span> Cek SK
                </button>
                <button type="button" onclick="approvePendingStore('${app.id}')" title="Setujui dan Aktifkan Toko" style="background: #10b981; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                  ✅ Setujui
                </button>
                <button type="button" onclick="rejectPendingStore('${app.id}')" title="Tolak Pengajuan" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                  ❌ Tolak
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 5. Render Database Seluruh Mitra Jaringan (Workspace Dedicated)
  if (networkMitraTableBody) {
    const list = appState.mitraList || [];
    if (list.length === 0) {
      networkMitraTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: #94a3b8; font-style: italic;">
            Belum ada data mitra jaringan yang tercatat.
          </td>
        </tr>
      `;
    } else {
      networkMitraTableBody.innerHTML = list.map(m => {
        const tierName = m.role || m.tier || 'Reseller';
        return `
          <tr style="border-bottom: 1px solid #334155;">
            <td data-label="Nama Mitra" style="padding: 10px 12px; font-weight: 600; color: #f1f5f9;">${m.name || '-'}</td>
            <td data-label="ID Mitra" style="padding: 10px 12px; font-family: monospace; color: #38bdf8;">${m.id || '-'}</td>
            <td data-label="Level" style="padding: 10px 12px;"><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">${tierName}</span></td>
            <td data-label="WhatsApp" style="padding: 10px 12px; font-family: monospace; color: #cbd5e1;">${m.phone || '-'}</td>
            <td data-label="Poin" style="padding: 10px 12px; font-weight: 700; color: #fbbf24;">${m.points || 0} Poin</td>
            <td data-label="Aksi" style="padding: 10px 12px; text-align: center;">
              <button type="button" onclick="contactMitraWA('${m.phone || ''}', '${m.name || ''}')" style="background: rgba(37, 211, 102, 0.15); border: 1px solid #25d366; color: #4ade80; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                Hubungi WA
              </button>
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

  let title = appState.isDropship ? 'LABEL RESI PENGIRIMAN DROPSHIP RESMI' : 'NOTA & RINCIAN PESANAN RESMI SR12';
  let badgeHtml = '';
  let destinationHtml = '';

  if (courier.id === 'pickup') {
    title = 'NOTA / BUKTI PENGAMBILAN TOKO (SELF PICK-UP)';
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
  const drawerOrderBadge = document.getElementById('olseraDrawerOrderBadge');
  const staticMenuBadge = document.getElementById('olseraStaticMenuOrderBadge');
  const trxBadge = document.getElementById('olseraTrxBadge');

  if (badge1) badge1.textContent = count;
  if (badge2) badge2.textContent = count;

  if (drawerOrderBadge) {
    drawerOrderBadge.textContent = count;
    drawerOrderBadge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  if (staticMenuBadge) {
    staticMenuBadge.textContent = count;
    staticMenuBadge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

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

function chatCustomerWa(phone, customerName, orderId) {
  const cleanPhone = formatWaNumber(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    alert('Nomor WhatsApp pemesan (' + (phone || '-') + ') tidak valid atau tidak lengkap!');
    return;
  }
  const msg = `Halo Kak ${customerName || ''}, pesanan ${orderId || ''} di SR12 sudah kami terima dan siap disiapkan. Terima kasih! 🌿`;
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
  try {
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (e) {
    window.location.href = url;
  }
}
window.chatCustomerWa = chatCustomerWa;

function renderAdminOrdersModal() {
  const body = document.getElementById('adminOrdersListBody');
  if (!body) return;

  const orders = appState.transactions || [];
  if (orders.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: #64748b;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf5; border: 2px dashed #10b981; display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 14px;">
          📭
        </div>
        <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 1.05rem; font-weight: 800;">Belum Ada Pesanan Masuk</h4>
        <p style="margin: 0 auto; max-width: 440px; font-size: 0.84rem; line-height: 1.5; color: #64748b;">
          Daftar pesanan saat ini masih bersih. Setiap transaksi yang dibuat dari Keranjang Toko atau WhatsApp akan otomatis terpantau di sini secara real-time!
        </p>
      </div>
    `;
    return;
  }

  body.innerHTML = orders.map(ord => {
    const isPending = ord.status === 'Menunggu Konfirmasi' || ord.status === 'Siap Diambil di Toko';
    const statusBg = isPending ? '#fffbeb' : '#ecfdf5';
    const statusBorder = isPending ? '#fde68a' : '#a7f3d0';
    const statusColor = isPending ? '#b45309' : '#047857';
    const statusIcon = isPending ? '⏳' : '✅';

    const itemsSummary = (ord.items || []).map(i => `
      <span style="display: inline-flex; align-items: center; gap: 4px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 6px; font-size: 0.76rem; font-weight: 600; color: #334155; margin: 2px 4px 2px 0;">
        <b style="color: #059669;">${i.qty}x</b> ${i.name}
      </span>
    `).join('');

    return `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; box-shadow: 0 2px 8px -2px rgba(15,23,42,0.05); transition: box-shadow 0.2s ease;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 10px; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.95rem; font-weight: 800; color: #0f172a; font-family: monospace;">${ord.id}</span>
              <span style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
                ${ord.tierLabel || 'Retail'}
              </span>
            </div>
            <div style="font-size: 0.76rem; color: #64748b; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
              <span>📅</span> <span>${ord.dateTime}</span>
            </div>
          </div>
          <span style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; font-size: 0.74rem; font-weight: 800; padding: 4px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 5px;">
            ${statusIcon} ${ord.status}
          </span>
        </div>

        <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; font-size: 0.82rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
            <div>
              <span style="color: #64748b; font-size: 0.73rem; display: block;">👤 Pemesan / Pelanggan:</span>
              <b style="color: #0f172a; font-size: 0.88rem;">${ord.customerName || 'Pelanggan Toko'}</b>
            </div>
            <div>
              <span style="color: #64748b; font-size: 0.73rem; display: block;">📱 WhatsApp:</span>
              <span style="color: #0284c7; font-weight: 700; font-family: monospace;">${ord.customerPhone || '-'}</span>
            </div>
            <div>
              <span style="color: #64748b; font-size: 0.73rem; display: block;">📦 Pengambilan / Pengiriman:</span>
              <span style="font-weight: 700; color: #334155;">${ord.paymentMethod || 'Ambil di Toko'}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 0.73rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 5px;">
            Daftar Produk:
          </div>
          <div style="display: flex; flex-wrap: wrap;">${itemsSummary}</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #e2e8f0; padding-top: 12px; gap: 10px; flex-wrap: wrap;">
          <div>
            <span style="font-size: 0.73rem; color: #64748b; display: block;">Total Tagihan:</span>
            <div style="font-size: 1.12rem; font-weight: 900; color: #065f46;">${formatRupiah(ord.grandTotal)}</div>
          </div>
          <div style="display: flex; gap: 7px; flex-wrap: wrap; align-items: center;">
            ${isPending ? `
              <button type="button" onclick="confirmOrderFromModal('${ord.id}')" style="background: linear-gradient(135deg, #059669, #047857); color: #ffffff; border: none; padding: 7px 13px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(5,150,105,0.25);" title="Klik setelah pesanan selesai diproses/dikirim">
                ✅ Selesai
              </button>
            ` : ''}
            <button type="button" onclick="viewHistoricalReceipt('${ord.id}')" style="background: #ffffff; color: #334155; border: 1.5px solid #cbd5e1; padding: 7px 11px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Cetak struk nota belanja">
              📄 Struk
            </button>
            <button type="button" onclick="printOrderShippingLabel('${ord.id}')" style="background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; padding: 7px 11px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Cetak label resi untuk paket pengiriman">
              🖨️ Resi
            </button>
            ${ord.customerPhone && ord.customerPhone !== '-' ? `
              <button type="button" onclick="chatCustomerWa('${ord.customerPhone}', '${(ord.customerName || '').replace(/'/g, "\\'")}', '${ord.id}')" style="background: #25d366; color: #ffffff; border: none; padding: 7px 12px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(37,211,102,0.25);" title="Kirim chat WhatsApp ke pemesan">
                💬 Chat WA
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function printOrderShippingLabel(trxId) {
  const ord = (appState.transactions || []).find(t => t.id === trxId);
  if (!ord) return;
  const storeName = (appState.storeSettings && appState.storeSettings.storeName) || 'SR12 Official';
  const storePhone = (appState.storeSettings && appState.storeSettings.storeWaNumber) || '-';
  const storeCity = (appState.storeSettings && appState.storeSettings.storeCity) || 'Kota Toko';

  const itemsHtml = (ord.items || []).map(i => `<div style="font-size: 11px; margin-bottom: 2px;">• ${i.qty}x ${i.name}</div>`).join('');
  const labelHtml = `
    <html>
    <head>
      <title>RESI PENGIRIMAN - ${ord.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 20px; max-width: 440px; margin: 0 auto; border: 2px solid #000; }
        .head { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .row { margin-bottom: 8px; font-size: 13px; line-height: 1.4; }
        .barcode { text-align: center; font-size: 18px; letter-spacing: 3px; font-weight: bold; margin: 12px 0; border: 1px solid #000; padding: 8px; background: #fafafa; }
      </style>
    </head>
    <body>
      <div class="head">
        <h3 style="margin: 0 0 4px 0;">${storeName.toUpperCase()}</h3>
        <p style="margin: 0; font-size: 12px; font-weight: bold;">LABEL RESI PENGIRIMAN RESMI</p>
      </div>
      <div class="barcode">||| ${ord.id} |||</div>
      <div class="row"><b>DARI PENGIRIM:</b><br>${storeName}<br>WhatsApp: ${storePhone}<br>Kota: ${storeCity}</div>
      <hr style="border: none; border-top: 1px dashed #ccc; margin: 8px 0;">
      <div class="row"><b>KEPADA PENERIMA:</b><br><b>${ord.customerName}</b> (${ord.customerPhone})<br>${ord.customerAddress || 'Alamat Penerima'}</div>
      <div class="row"><b>LAYANAN PENGIRIMAN:</b> ${ord.paymentMethod || 'Reguler'}</div>
      <hr style="border: none; border-top: 1px dashed #ccc; margin: 8px 0;">
      <div class="row"><b>ISI PAKET:</b><br>${itemsHtml}</div>
      <div class="row" style="text-align: right; font-weight: bold; font-size: 14px; margin-top: 10px;">
        TOTAL TAGIHAN: ${formatRupiah(ord.grandTotal)}
      </div>
      <div style="font-size: 10px; text-align: center; color: #555; margin-top: 15px; border-top: 1px dotted #aaa; padding-top: 6px;">
        Terima kasih telah berbelanja di ${storeName} 🌿
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;
  const win = window.open('', '_blank', 'width=500,height=700');
  if (win) {
    win.document.write(labelHtml);
    win.document.close();
  }
}
window.printOrderShippingLabel = printOrderShippingLabel;

function openAdminOrdersModal() {
  if (typeof closeOlseraSidebarDrawer === 'function') {
    closeOlseraSidebarDrawer();
  } else {
    document.getElementById('olseraSidebar')?.classList.remove('open');
    document.getElementById('olseraDrawerBackdrop')?.classList.remove('open');
  }

  // Bersihkan teks subtitle panjang jika masih tertinggal di cache DOM browser
  const modalEl = document.getElementById('modalAdminOrders');
  if (modalEl) {
    const subtitleEls = modalEl.querySelectorAll('.modal-header p');
    subtitleEls.forEach(el => el.remove());
  }

  renderAdminOrdersModal();
  openModal('modalAdminOrders');
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
  if (confirm('Kosongkan seluruh daftar pesanan masuk?')) {
    appState.transactions = [];
    localStorage.removeItem('sr12_pos_transactions_v1');
    renderAdminOrdersModal();
    updateAdminNotificationUI();
    if (typeof renderPosTransactions === 'function') renderPosTransactions();
    showToast('🗑️ Daftar pesanan berhasil dikosongkan.');
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
  bankAccount: '',
  bankHolder: '',
  ewalletName: 'DANA',
  ewalletNumber: '',
  developerWa: ''
};

function getStoredDevPaymentSettings() {
  const stored = localStorage.getItem('sr12_dev_payment_settings_v1');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return Object.assign({}, DEFAULT_DEV_PAYMENT_SETTINGS, parsed);
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
  if (bankAccEl) bankAccEl.textContent = settings.bankAccount || '(Belum diatur)';
  if (bankHolderEl) bankHolderEl.textContent = settings.bankHolder || 'Developer Platform SR12';
  if (ewalletNameEl) ewalletNameEl.textContent = settings.ewalletName || 'DANA';
  if (ewalletNumEl) ewalletNumEl.textContent = settings.ewalletNumber || '(Belum diatur)';
  if (qrisReceiverEl) qrisReceiverEl.textContent = settings.bankHolder || 'Platform Developer SR12 Ecosystem';

  const inputBankName = document.getElementById('devSettingBankName');
  const inputBankAcc = document.getElementById('devSettingBankAccount');
  const inputBankHolder = document.getElementById('devSettingBankHolder');
  const inputEwallet = document.getElementById('devSettingEwalletNumber');

  if (inputBankName) inputBankName.value = settings.bankName || '';
  if (inputBankAcc) inputBankAcc.value = settings.bankAccount || '';
  if (inputBankHolder) inputBankHolder.value = settings.bankHolder || '';
  if (inputEwallet) inputEwallet.value = settings.ewalletNumber || '';

  // Workspace Inputs (Dedicated Console)
  const inputBankName_ws = document.getElementById('devSettingBankName_ws');
  const inputBankAcc_ws = document.getElementById('devSettingBankAccount_ws');
  const inputBankHolder_ws = document.getElementById('devSettingBankHolder_ws');
  const inputEwallet_ws = document.getElementById('devSettingEwalletNumber_ws');

  if (inputBankName_ws) inputBankName_ws.value = settings.bankName || '';
  if (inputBankAcc_ws) inputBankAcc_ws.value = settings.bankAccount || '';
  if (inputBankHolder_ws) inputBankHolder_ws.value = settings.bankHolder || '';
  if (inputEwallet_ws) inputEwallet_ws.value = settings.ewalletNumber || '';
}

function handleSaveDevPaymentSettings(e) {
  if (e) e.preventDefault();
  const bankName = document.getElementById('devSettingBankName_ws')?.value.trim() || document.getElementById('devSettingBankName')?.value.trim() || 'BCA';
  const bankAccount = document.getElementById('devSettingBankAccount_ws')?.value.trim() || document.getElementById('devSettingBankAccount')?.value.trim() || '';
  const bankHolder = document.getElementById('devSettingBankHolder_ws')?.value.trim() || document.getElementById('devSettingBankHolder')?.value.trim() || '';
  const ewalletNumber = document.getElementById('devSettingEwalletNumber_ws')?.value.trim() || document.getElementById('devSettingEwalletNumber')?.value.trim() || '';

  const settings = {
    bankName,
    bankAccount,
    bankHolder,
    ewalletName: 'DANA',
    ewalletNumber,
    developerWa: appState.storeSettings.storeWaNumber || ''
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


function clearAllDummyData(silent = false) {
  // 1. Reset partner stores ke HANYA sr12-central (0 toko mitra)
  appState.partnerStores = [Object.assign({}, DEFAULT_PARTNER_STORES[0])];
  saveStoredPartnerStores(appState.partnerStores);

  // 2. Bersihkan transaksi
  appState.transactions = [];
  localStorage.setItem('sr12_pos_transactions_v1', JSON.stringify([]));

  // 3. Bersihkan mitra & reseller
  appState.mitraList = [];
  appState.resellers = [];
  localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify([]));
  localStorage.setItem('sr12_resellers_v2', JSON.stringify([]));

  // 4. Bersihkan marketer sales
  appState.marketerSales = [];
  localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify([]));

  // 5. Bersihkan cashflow
  appState.cashflow = [];
  localStorage.setItem('sr12_cashflow_entries_v1', JSON.stringify([]));

  // 6. Bersihkan antrean pengajuan toko
  appState.pendingStoreApps = [];
  saveStoredPendingStores([]);

  // 7. Bersihkan sesi login & shift kasir
  localStorage.removeItem('sr12_distributor_session');
  localStorage.removeItem('sr12_active_cashier_shift_v1');
  appState.isAdminMode = false;
  appState.isDistributorLoggedIn = false;

  // 8. Reset metrik developer
  appState.devMetrics.totalPlatformTransactions = 0;
  appState.devMetrics.totalGMV = 0;
  appState.devMetrics.totalRegisteredStores = 0;

  // 9. Muat sr12-central sebagai default
  loadStoreBySlug('sr12-central');
  renderStoreDropdown();
  updateDevPortalMetrics();
  renderOfficialDistributorDirectory();

  if (!silent) {
    showToast('✨ Seluruh data dummy telah dikosongkan! Kanvas bersih siap disimulasikan.');
  }
}
window.clearAllDummyData = clearAllDummyData;

function resetAllDummyDataToZero() {
  if (!confirm('Apakah Anda ingin mengosongkan seluruh data dummy toko & platform?\n\n• Seluruh toko dummy akan dihapus (tersisa hanya Kantor Pusat SR12-Ku Pro)\n• Seluruh transaksi, mitra, dan riwayat akan di-reset ke 0\n• Anda dapat mensimulasikan pembuatan toko baru dari awal.')) {
    return;
  }
  clearAllDummyData(false);
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
        <td data-label="ID & Nama Mitra">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="background: #0f172a; color: #38bdf8; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-weight: 800; font-size: 0.74rem;">${m.id || 'MITRA'}</span>
              <b style="font-size: 0.92rem; color: #0f172a;">${m.name}</b>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 0.7rem; ${tierBadgeStyle}">
                ${tierBadgeText}
              </span>
              <span class="badge-crm" style="background: ${m.state === 'active' ? '#dcfce7' : (m.state === 'warning' ? '#fef3c7' : '#fee2e2')}; color: ${m.state === 'active' ? '#15803d' : (m.state === 'warning' ? '#92400e' : '#b91c1c')}; padding: 2px 7px; font-size: 0.7rem;">
                ${m.state === 'active' ? '🟢' : (m.state === 'warning' ? '🟡' : '🔴')} ${m.label}
              </span>
            </div>
          </div>
          <div style="font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span><a href="https://wa.me/${m.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 700; font-family: monospace;">📱 ${m.phone}</a></span>
            <span>&bull;</span>
            <span>📍 ${m.city || 'Indonesia'}</span>
          </div>
        </td>
        <td data-label="Tingkat">
          <span style="display: inline-block; padding: 4px 9px; border-radius: 4px; font-weight: 800; font-size: 0.72rem; ${tierBadgeStyle}">
            ${tierBadgeText}
          </span>
        </td>
        <td data-label="Rekening Bank">
          <div style="font-size: 0.8rem; font-weight: 800; color: #0f172a;">
            🏦 ${m.bankName || 'BCA'} &bull; <span style="font-family: monospace; letter-spacing: 0.02em;">${m.bankAccount || '-'}</span>
          </div>
          <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
            a.n <span style="font-weight: 600; color: #334155;">${m.bankHolder || m.name}</span>
          </div>
        </td>
        <td data-label="Masa Aktif">
          ${m.tier === 'marketer' ? `
            <div style="font-size: 0.78rem; color: #0284c7; font-weight: 800;">
              ✨ Jualan Tanpa Modal
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
              Komisi 15% bulanan
            </div>
          ` : `
            <div style="font-size: 0.75rem; color: #334155;">
              Gabung: <b>${m.qualificationDate || '-'}</b>
            </div>
            ${m.tier === 'reseller' ? `
              <div style="font-size: 0.72rem; color: ${m.daysLeft <= 30 && m.state !== 'active' ? '#dc2626' : '#059669'}; font-weight: 800; margin-top: 2px;">
                ⏳ Sisa ${m.daysLeft} Hari (90 Hari)
              </div>
            ` : `
              <div style="font-size: 0.72rem; color: #059669; font-weight: 700; margin-top: 2px;">
                🛡️ Kuota Order Aktif
              </div>
            `}
          `}
        </td>
        <td data-label="Akumulasi Belanja">
          ${m.tier === 'marketer' ? `
            <div style="font-size: 0.82rem; font-weight: 800; color: #0369a1;">
              ${formatRupiah(m.accumulatedSpent90Days || 0)}
            </div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
              ${m.totalOrdersCount || 0} Pesanan Terjual
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem; margin-bottom: 3px; gap: 6px;">
              <b style="color: #0f172a;">${formatRupiah(m.spent)}</b>
              <span style="color: #64748b; font-size: 0.7rem;">Target: ${formatRupiah(m.targetNominal)}</span>
            </div>
            <div style="background: #e2e8f0; border-radius: 999px; height: 6px; width: 100%; min-width: 90px; overflow: hidden;">
              <div style="width: ${progressPct}%; height: 100%; background: ${m.state === 'active' ? '#10b981' : (m.state === 'warning' ? '#f59e0b' : '#ef4444')}; border-radius: 999px;"></div>
            </div>
            <div style="font-size: 0.68rem; color: ${m.deficit > 0 ? '#b45309' : '#059669'}; margin-top: 3px; font-weight: 700;">
              ${m.deficit > 0 ? `Kurang ${formatRupiah(m.deficit)}` : '✨ Target RO Tercapai!'}
            </div>
          `}
        </td>
        <td data-label="Status">
          <span class="badge-crm" style="background: ${m.state === 'active' ? '#dcfce7' : (m.state === 'warning' ? '#fef3c7' : '#fee2e2')}; color: ${m.state === 'active' ? '#15803d' : (m.state === 'warning' ? '#92400e' : '#b91c1c')};">
            ${m.state === 'active' ? '🟢' : (m.state === 'warning' ? '🟡' : '🔴')} ${m.label}
          </span>
        </td>
        <td data-label="Aksi" style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            ${m.tier === 'reseller' && m.deficit > 0 ? `
              <button onclick="sendResellerReminderWA('${m.phone}', '${m.name}', ${m.daysLeft}, ${m.deficit})" title="Kirim Pengingat RO ke WhatsApp" style="background: #25d366; color: #fff; border: none; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>📲</span> Ingatkan RO
              </button>
            ` : (m.tier === 'marketer' ? `
              <button onclick="switchTab('marketers')" title="Lihat Rekap Gaji Marketer" style="background: #0284c7; color: #fff; border: none; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>💼</span> Gaji
              </button>
            ` : `
              <button onclick="sendGeneralMitraWA('${m.phone}', '${m.name}', '${m.tier}')" title="Hubungi Mitra via WhatsApp" style="background: #25d366; color: #fff; border: none; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>📲</span> Chat WA
              </button>
            `)}
            <button onclick="deleteMitra('${m.id}')" title="Hapus Data Mitra" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 8px; border-radius: 6px; font-size: 0.72rem; cursor: pointer;">
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
  if (typeof dbDeleteMitra === 'function') {
    dbDeleteMitra(id);
  }
  if (typeof deleteMitraFromSupabase === 'function' && appState.storeSettings) {
    deleteMitraFromSupabase(id, appState.storeSettings.slug || 'sr12-central');
  }
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
  if (typeof dbSaveAllMitra === 'function') {
    dbSaveAllMitra([]);
  }
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
  if (typeof dbSaveAllMarketerSales === 'function') {
    dbSaveAllMarketerSales([]);
  }
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
        <td data-label="ID & Nama Marketer">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="background: #0284c7; color: #fff; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-weight: 800; font-size: 0.74rem;">${m.id}</span>
              <b style="font-size: 0.92rem; color: #0f172a;">${m.name}</b>
            </div>
            <span style="font-size: 0.7rem; color: #64748b; background: #e2e8f0; padding: 1px 7px; border-radius: 999px;">${m.city || 'Indonesia'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-family: monospace; font-size: 0.75rem; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 8px; border-radius: 6px; border: 1px solid #bae6fd; max-width: 100%; word-break: break-all;">
              <span>📱</span> <span>${m.phone}</span>
            </span>
          </div>
        </td>
        <td data-label="Rekening Transfer">
          <div style="text-align: right;">
            <div style="font-size: 0.82rem; font-weight: 800; color: #1e293b; display: inline-flex; align-items: center; gap: 5px;">
              <span style="background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 0.72rem; color: #475569;">${m.bankName || 'BCA'}</span>
              <span style="font-family: monospace;">${m.bankAccount || '-'}</span>
            </div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
              a.n ${m.bankHolder || m.name}
            </div>
          </div>
        </td>
        <td data-label="Pesanan Terjual" style="text-align: center;">
          <div style="display: inline-flex; align-items: center; gap: 4px;">
            <b style="font-size: 0.92rem; color: #0f172a;">${item.countOrders}</b>
            <span style="font-size: 0.72rem; color: #64748b;">Pesanan</span>
          </div>
        </td>
        <td data-label="Total Omset (HET)">
          <div style="text-align: right;">
            <b style="font-size: 0.9rem; color: #334155;">${formatRupiah(item.omset)}</b>
          </div>
        </td>
        <td data-label="Bonus Marketer (15%)">
          <div style="text-align: right;">
            <b style="font-size: 1.05rem; font-weight: 900; color: #0284c7;">${formatRupiah(item.bonus)}</b>
            <small style="display: block; font-size: 0.68rem; color: #0369a1; font-weight: 700;">15% Komisi Bersih</small>
          </div>
        </td>
        <td data-label="Status Pembayaran">
          ${paidBadge}
        </td>
        <td data-label="Aksi Distributor" style="text-align: center;">
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
window.switchDevPortalTab = switchDevPortalTab;
window.openDevPinPrompt = openDevPinPrompt;
window.showDeveloperWorkspaceView = showDeveloperWorkspaceView;
window.handleDeveloperLogout = handleDeveloperLogout;
window.openDevStoreAdminBackoffice = openDevStoreAdminBackoffice;
window.openDevCurrentStoreBackoffice = openDevCurrentStoreBackoffice;
window.contactMitraWA = contactMitraWA;

function openOlseraPosDirect() {
  if (!appState.isDistributorLoggedIn && !appState.isAdminMode) {
    showToast('🔒 Akses Kasir Gudang Terkunci. Khusus Pemilik Toko, silakan masukkan Password / PIN.');
    openDistributorLoginModal();
    return;
  }
  if (typeof showDistributorPortalView === 'function') {
    showDistributorPortalView(true);
  }
  if (typeof switchOlseraTab === 'function') {
    switchOlseraTab('pos');
  }
  showToast(`🛒 Point of Sale & Kasir Gudang: ${appState.storeSettings.storeName}`);
}
window.openOlseraPosDirect = openOlseraPosDirect;
window.quickApproveFromPendingModal = quickApproveFromPendingModal;
window.syncStoresWithServer = syncStoresWithServer;
window.syncPendingStoresWithServer = syncPendingStoresWithServer;

// ==========================================
// PROMOSI RESMI PRODUK (LINK KHUSUS & KARTU PREVIEW)
// ==========================================
let currentPromoShareData = null;

function openProductPromoShareModal(productId) {
  const prod = (appState.products || []).find(p => p.id === productId);
  if (!prod) return;

  const curStore = appState.storeSettings || {};
  const storeName = curStore.storeName || 'SR12 Official Store';
  const cleanSlug = curStore.slug || 'sr12-central';
  const tierPrice = getProductTierPrice(prod, appState.currentTier);
  const isPromo = prod.het > tierPrice;
  // Link langsung khusus produk di toko mitra bersangkutan
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname;
  const productUrl = isLocalHost
    ? `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(cleanSlug)}&product=${encodeURIComponent(prod.id)}`
    : `${window.location.origin}/p?product=${encodeURIComponent(prod.id)}&store=${encodeURIComponent(cleanSlug)}`;
  const storeUrl = `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(cleanSlug)}`;

  currentPromoShareData = {
    prod,
    storeName,
    tierPrice,
    productUrl,
    storeUrl
  };

  const imgEl = document.getElementById('promoShareImage');
  const catEl = document.getElementById('promoShareCategory');
  const titleEl = document.getElementById('promoShareTitle');
  const priceEl = document.getElementById('promoSharePrice');
  const hetEl = document.getElementById('promoShareHet');
  const descEl = document.getElementById('promoShareDesc');
  const linkEl = document.getElementById('promoShareDirectLink');
  const textEl = document.getElementById('promoShareCopywritingText');

  if (imgEl) imgEl.src = prod.image;
  if (catEl) catEl.textContent = prod.category;
  if (titleEl) titleEl.textContent = prod.name;
  if (priceEl) priceEl.textContent = formatRupiah(tierPrice);
  if (hetEl) {
    if (isPromo) {
      hetEl.style.display = 'inline';
      hetEl.textContent = formatRupiah(prod.het);
    } else {
      hetEl.style.display = 'none';
    }
  }
  if (descEl) descEl.textContent = prod.summary || (prod.benefits && prod.benefits[0]) || '';
  if (linkEl) {
    linkEl.textContent = productUrl;
    linkEl.title = productUrl;
  }

  const benefitsText = (prod.benefits && prod.benefits.length > 0)
    ? prod.benefits.slice(0, 3).map(b => `✅ ${b}`).join('\n')
    : `✅ 100% Produk Herbal Terdaftar BPOM\n✅ Formulasi Lembut & Aman Digunakan Tiap Hari\n✅ Garansi Keaslian Resmi Pabrik SR12`;

  const copyText = 
`✨ *PROMO SPESIAL: ${prod.name.toUpperCase()}* ✨
${prod.summary || 'Produk perawatan herbal berkualitas resmi SR12 teruji klinis dan BPOM.'} 🌿

⭐ *Rating Pembeli:* 4.9 / 5.0 (Terbukti Berkhasiat)
🛡️ *Izin Edar Resmi:* 100% Terverifikasi BPOM & Halal MUI

🔥 *Keunggulan Produk:*
${benefitsText}

💰 *Harga Spesial:* ${formatRupiah(tierPrice)}${isPromo ? ` (Harga Normal: ~${formatRupiah(prod.het)}~)` : ''}
🚚 *Pengiriman Cepat, Aman & Garansi Original!*

👇 *Beli & Lihat Detail Produk Langsung di Toko Resmi (${storeName}):*
${productUrl}

Silakan klik tautan di atas untuk melihat detail lengkap & pemesanan resmi via WhatsApp! 🌸`;

  if (textEl) textEl.value = copyText;

  openModal('modalProductPromoShare');
}
window.openProductPromoShareModal = openProductPromoShareModal;

function copyProductDirectLink() {
  if (!currentPromoShareData || !currentPromoShareData.productUrl) return;
  navigator.clipboard.writeText(currentPromoShareData.productUrl).then(() => {
    showToast('🔗 Link khusus produk (preview bergambar) berhasil disalin!');
  }).catch(() => {
    showToast('Link khusus produk disalin!');
  });
}
window.copyProductDirectLink = copyProductDirectLink;

async function getImageFileFromUrlOrData(imageUrl, filename = 'produk-sr12') {
  try {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:')) {
      const parts = imageUrl.split(',');
      const mimeMatch = (parts[0] || '').match(/:(.*?);/);
      const mime = (mimeMatch && mimeMatch[1]) || 'image/jpeg';
      const bstr = atob(parts[1] || '');
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
      return new File([u8arr], `${filename}.${ext}`, { type: mime });
    }
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const mime = blob.type || (imageUrl.includes('.png') ? 'image/png' : 'image/jpeg');
    const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
    return new File([blob], `${filename}.${ext}`, { type: mime });
  } catch (e) {
    console.warn('Gagal mengonversi gambar ke File:', e);
    return null;
  }
}

async function sharePromoToWhatsApp() {
  if (!currentPromoShareData) return;
  const textEl = document.getElementById('promoShareCopywritingText');
  const text = textEl ? textEl.value : '';
  const prod = currentPromoShareData.prod;

  // Di HP, jika navigator.share mendukung kirim file gambar, gunakan native share agar foto ikut terlampir langsung ke WhatsApp!
  if (navigator.share && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
    try {
      let file = null;
      if (prod && prod.image) {
        file = await getImageFileFromUrlOrData(prod.image, (prod.name || 'produk-sr12').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase());
      }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: prod.name,
          text: text,
          files: [file]
        });
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  // Fallback standar: buka WhatsApp langsung dengan teks
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
window.sharePromoToWhatsApp = sharePromoToWhatsApp;

function copyPromoCopywriting() {
  const textEl = document.getElementById('promoShareCopywritingText');
  if (!textEl) return;
  textEl.select();
  navigator.clipboard.writeText(textEl.value).then(() => {
    showToast('📋 Teks iklan & link khusus produk berhasil disalin!');
  }).catch(() => {
    showToast('Teks iklan disalin!');
  });
}
window.copyPromoCopywriting = copyPromoCopywriting;

async function sharePromoNative() {
  if (!currentPromoShareData) return;
  const textEl = document.getElementById('promoShareCopywritingText');
  const text = textEl ? textEl.value : '';
  const prod = currentPromoShareData.prod;

  if (navigator.share) {
    try {
      showToast('⏳ Menyiapkan foto & teks produk...');
      let file = null;
      if (prod && prod.image) {
        file = await getImageFileFromUrlOrData(prod.image, (prod.name || 'produk-sr12').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase());
      }

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: prod.name,
          text: text,
          files: [file]
        });
        showToast('✅ Produk berhasil dibagikan beserta foto!');
        return;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native file share failed/skipped, fallback to text/url:', err);
      } else {
        return;
      }
    }

    // Fallback standard share (jika browser tidak mendukung lampiran file langsung)
    try {
      await navigator.share({
        title: currentPromoShareData.prod.name,
        text: text,
        url: currentPromoShareData.productUrl
      });
      return;
    } catch (e) {}
  }

  // Jika di browser tanpa Web Share API:
  copyPromoCopywriting();
  downloadProductPromoImage();
  showToast('📋 Teks disalin & foto produk otomatis diunduh! Silakan kirim di chat/status.');
}
window.sharePromoNative = sharePromoNative;

function downloadProductPromoImage() {
  if (!currentPromoShareData || !currentPromoShareData.prod) return;
  const prod = currentPromoShareData.prod;
  if (!prod.image) return;

  if (prod.image.startsWith('data:image/svg+xml')) {
    const a = document.createElement('a');
    a.href = prod.image;
    a.download = `${prod.id || 'produk-sr12'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('📥 Gambar produk berhasil diunduh!');
    return;
  }

  fetch(prod.image)
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = prod.image.endsWith('.png') ? 'png' : 'jpg';
      a.download = `${prod.id || 'produk-sr12'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('📥 Foto produk berhasil disimpan ke galeri HP!');
    })
    .catch(() => {
      window.open(prod.image, '_blank');
    });
}
window.downloadProductPromoImage = downloadProductPromoImage;

// ==========================================
// DEEP-LINKING PRODUK SPESIFIK (?product=...)
// ==========================================
function handleDirectProductDeepLink() {
  const isCentral = !appState.storeSettings?.slug || appState.storeSettings?.slug === 'sr12-central';
  if (isCentral) {
    // Official Central Hub murni direktori toko & kemitraan nasional (TIDAK ADA PRODUK / DEEP LINK)
    const params = new URLSearchParams(window.location.search);
    if (params.has('product') || params.has('p') || params.has('prod') || params.has('id')) {
      params.delete('product');
      params.delete('p');
      params.delete('prod');
      params.delete('id');
      const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', cleanUrl);
    }
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const rawParam = params.get('product') || params.get('p') || params.get('prod') || params.get('id');
  if (!rawParam) return;

  const cleanParam = rawParam.toLowerCase().trim();
  const cleanKey = cleanParam.replace(/[^a-z0-9]/g, '');

  // 1. Pencarian produk yang sangat fleksibel & komprehensif
  let prod = (appState.products || []).find(p => 
    p.id.toLowerCase() === cleanParam ||
    (p.sku && p.sku.toLowerCase() === cleanParam) ||
    (p.slug && p.slug.toLowerCase() === cleanParam) ||
    p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey ||
    p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey ||
    p.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanKey) ||
    cleanKey.includes(p.id.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  // 2. Fallback pencarian kata kunci jika slug terpotong atau bervariasi
  if (!prod) {
    const words = cleanParam.replace(/^sr12-?/i, '').split(/[-_\s]+/).filter(w => w.length > 2);
    if (words.length > 0) {
      prod = (appState.products || []).find(p => {
        const text = (p.id + ' ' + p.name + ' ' + (p.sku || '')).toLowerCase();
        return words.every(w => text.includes(w));
      });
    }
  }

  // Jika produk tidak ditemukan, batalkan deep-link (JANGAN fallback ke Lightening Body Lotion)
  if (!prod) {
    console.warn('⚠️ [Deep-Link Produk] Produk tidak ditemukan:', rawParam);
    return;
  }

  if (prod) {
    console.log('🎯 [Deep-Link Produk] Membuka produk spesifik:', prod.name, `(${prod.id})`);
    
    // Perbarui judul tab browser dan meta tag Open Graph sesuai produk
    const pageTitle = document.getElementById('pageTitleMeta') || document.querySelector('title');
    const ogTitle = document.getElementById('ogTitleMeta');
    const ogDesc = document.getElementById('ogDescMeta');
    const ogImage = document.getElementById('ogImageMeta');
    const storeName = appState.storeSettings?.storeName || 'SR12 Official';

    if (pageTitle) pageTitle.textContent = `${prod.name} | ${storeName}`;
    if (ogTitle) ogTitle.content = `${prod.name} - ${storeName}`;
    if (ogDesc) ogDesc.content = prod.summary || `Beli ${prod.name} resmi BPOM di ${storeName}.`;
    if (ogImage && prod.image) ogImage.content = prod.image;

    // Pastikan wrapper katalog produk aktif & ditampilkan
    const commerceWrapper = document.getElementById('distributorCommerceWrapper');
    if (commerceWrapper) {
      commerceWrapper.style.display = 'block';
    }
    const catalogSection = document.getElementById('catalogSection');
    if (catalogSection) {
      catalogSection.style.display = 'block';
    }

    // Pastikan filter kategori dan pencarian dinetralkan agar kartu produk pasti ada di DOM
    if (appState.selectedCategory !== 'all' || appState.searchQuery) {
      appState.selectedCategory = 'all';
      appState.searchQuery = '';
      renderProducts();
    }

    // Pastikan kartu produk ada di DOM
    let card = document.getElementById(`card-${prod.id}`);
    if (!card) {
      renderProducts();
      card = document.getElementById(`card-${prod.id}`);
    }

    // Gulir halus ke kartu produk dan berikan efek sorotan
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('product-card-highlighted');
      setTimeout(() => card.classList.remove('product-card-highlighted'), 3500);
    }

    // Buka modal detail produk langsung
    openProductDetailModal(prod.id);

    // Safeguard ganda (jika render asynchronous browser membutuhkan waktu tambahan)
    setTimeout(() => {
      const modal = document.getElementById('modalProductDetail');
      if (modal && !modal.classList.contains('open')) {
        openProductDetailModal(prod.id);
      }
      const c = document.getElementById(`card-${prod.id}`);
      if (c) {
        c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
}
window.handleDirectProductDeepLink = handleDirectProductDeepLink;


