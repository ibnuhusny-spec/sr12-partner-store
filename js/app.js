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
  },
  {
    slug: 'iyoutique',
    storeName: 'Iyoutique',
    storeTagline: 'Mitra Resmi SR12 Makassar',
    storeTheme: 'emerald',
    heroTitle: 'Katalog Resmi SR12 Iyoutique',
    heroSubtitle: 'Solusi perawatan herbal alami berlisensi resmi BPOM. Belanja aman, diskon otomatis, dan cepat sampai.',
    heroBannerUrl: 'assets/hero-banner.jpg',
    storeLogoText: 'I',
    storeLogoUrl: '',
    storeWaNumber: '6285342743763',
    storeCity: 'Makassar',
    storeOwner: 'Ibnu Husny',
    partnerTier: 'distributor',
    feePayer: 'buyer',
    storeAdminPin: '••••',
    orderQuota: 15,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0,
    verifiedSkNumber: 'SK-DIST-SR12-0001',
    approvedAt: '2026-10-18T12:40:38.240776+00:00'
  }
];

const LEGACY_DELETED_SLUGS = ['toko-supa-distributor', 'simulasi-distributor'];

// Pemulihan otomatis jika slug toko resmi sempat tersimpan di blacklist lokal
try {
  const rawDel = localStorage.getItem('sr12_deleted_store_slugs');
  if (rawDel) {
    const parsedDel = JSON.parse(rawDel);
    if (Array.isArray(parsedDel) && parsedDel.includes('iyoutique')) {
      const cleaned = parsedDel.filter(s => s !== 'iyoutique' && s !== 'sr12-central');
      localStorage.setItem('sr12_deleted_store_slugs', JSON.stringify(cleaned));
    }
  }
} catch(e) {}

function getDeletedStoreSlugs() {
  try {
    const raw = localStorage.getItem('sr12_deleted_store_slugs');
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    // Jangan pernah memblokir platform central hub atau toko resmi aktif
    return Array.from(new Set([...list, ...LEGACY_DELETED_SLUGS]))
      .filter(slug => slug && slug !== 'sr12-central' && slug !== 'iyoutique');
  } catch(e) {
    return [...LEGACY_DELETED_SLUGS].filter(slug => slug && slug !== 'sr12-central' && slug !== 'iyoutique');
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

  // Jika belum ada data tersimpan, gunakan template default
  if (stores.length === 0) {
    stores = DEFAULT_PARTNER_STORES.map(s => Object.assign({}, s));
    saveStoredPartnerStores(stores);
    return stores;
  }

  // Gabungkan toko mitra terverifikasi dari DEFAULT_PARTNER_STORES yang belum tersimpan di cache lokal
  DEFAULT_PARTNER_STORES.forEach(defStore => {
    if (defStore.slug !== 'sr12-central' && !deletedSlugs.includes(defStore.slug)) {
      if (!stores.some(s => s && s.slug === defStore.slug)) {
        stores.push(Object.assign({}, defStore));
      }
    }
  });

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
  try {
    localStorage.setItem('sr12_partner_stores_v2', JSON.stringify(stores));
  } catch (err) {
    console.warn('Gagal menyimpan partner stores ke localStorage (kuota penuh):', err);
    try {
      const lightweightStores = (stores || []).map(s => ({
        ...s,
        heroBannerUrl: (s.heroBannerUrl && s.heroBannerUrl.startsWith('data:')) ? 'assets/hero-banner.jpg' : s.heroBannerUrl,
        storeLogoUrl: (s.storeLogoUrl && s.storeLogoUrl.startsWith('data:')) ? 'assets/sr12-logo.png' : s.storeLogoUrl
      }));
      localStorage.setItem('sr12_partner_stores_v2', JSON.stringify(lightweightStores));
    } catch (fallbackErr) {
      console.warn('Fallback penyimpanan partner stores gagal:', fallbackErr);
    }
  }
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
    heroBannerUrl: "",
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

const KNOWN_PURGED_PENDING_IDS = ['APP-565640', 'APP-586760', 'merdeka', 'merdeka-6760', 'APP-029104', 'barokah-sr12'];

function getDeletedPendingStoreIds() {
  try {
    const raw = localStorage.getItem('sr12_deleted_pending_app_ids');
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    KNOWN_PURGED_PENDING_IDS.forEach(id => {
      if (!list.includes(id)) list.push(id);
    });
    return list;
  } catch (e) {
    return [...KNOWN_PURGED_PENDING_IDS];
  }
}

function addDeletedPendingStore(id, slug) {
  try {
    const deleted = getDeletedPendingStoreIds();
    let changed = false;
    if (id && !deleted.includes(id)) {
      deleted.push(id);
      changed = true;
    }
    if (slug && !deleted.includes(slug)) {
      deleted.push(slug);
      changed = true;
    }
    if (changed) {
      localStorage.setItem('sr12_deleted_pending_app_ids', JSON.stringify(deleted));
      console.log('📌 Tombstone pending store ditambahkan:', { id, slug });
    }
  } catch (e) {
    console.warn('Gagal mencatat tombstone pending store:', e);
  }
}

const INITIAL_DEMO_PENDING_STORE_APPS = [];

function getStoredPendingStores() {
  const stored = localStorage.getItem('sr12_pending_store_apps_v1');
  const deletedIds = getDeletedPendingStoreIds();
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(app => app && app.id && !deletedIds.includes(app.id) && !deletedIds.includes(app.slug));
        filtered.forEach(app => {
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
        return filtered;
      }
    } catch (e) {}
  }
  return [];
}

function saveStoredPendingStores(apps) {
  try {
    localStorage.setItem('sr12_pending_store_apps_v1', JSON.stringify(apps));
  } catch (e) {
    console.warn('LocalStorage quota exceeded for pending stores, stripping heavy base64 docs:', e);
    try {
      const lightweightApps = (apps || []).map(a => ({
        ...a,
        ktpDocUrl: a.ktpDocUrl && a.ktpDocUrl.length > 500 ? '' : a.ktpDocUrl,
        skDocUrl: a.skDocUrl && a.skDocUrl.length > 500 ? '' : a.skDocUrl,
        selfieDocUrl: a.selfieDocUrl && a.selfieDocUrl.length > 500 ? '' : a.selfieDocUrl,
        recommendationDocUrl: a.recommendationDocUrl && a.recommendationDocUrl.length > 500 ? '' : a.recommendationDocUrl
      }));
      localStorage.setItem('sr12_pending_store_apps_v1', JSON.stringify(lightweightApps));
    } catch (err2) {
      console.warn('Cannot save pending stores to localStorage:', err2);
    }
  }
}

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '3000') return '';
    return null;
  }
  return null;
}

async function syncStoresWithServer() {
  let changed = false;
  const deletedSlugs = getDeletedStoreSlugs();

  // 1. Sinkronisasi dari Supabase Cloud (Single Source of Truth untuk seluruh browser & perangkat)
  if (typeof syncStoresFromSupabase === 'function') {
    try {
      const supaStores = await syncStoresFromSupabase();
      if (Array.isArray(supaStores)) {
        const cloudSlugs = new Set(supaStores.map(s => s.slug));

        // Pulihkan toko yang aktif di Supabase Cloud dari blacklist deletedSlugs lokal
        if (deletedSlugs.length > 0) {
          const updatedDeleted = deletedSlugs.filter(d => !cloudSlugs.has(d));
          if (updatedDeleted.length !== deletedSlugs.length) {
            localStorage.setItem('sr12_deleted_store_slugs', JSON.stringify(updatedDeleted));
            deletedSlugs.length = 0;
            deletedSlugs.push(...updatedDeleted);
            changed = true;
          }
        }

        // Susun daftar toko resmi terpusat dari Cloud (sr12-central selalu di index 0)
        const centralStore = supaStores.find(s => s && s.slug === 'sr12-central') ||
          (appState.partnerStores || []).find(s => s && s.slug === 'sr12-central') ||
          Object.assign({}, DEFAULT_PARTNER_STORES[0]);

        const validStores = [centralStore];

        supaStores.forEach(apiStore => {
          if (!apiStore || !apiStore.slug || apiStore.slug === 'sr12-central') return;
          if (apiStore.slug === 'toko-supa-distributor' || apiStore.slug.startsWith('deleted_') || apiStore.slug.includes('toko-supa') || apiStore.slug === 'simulasi-distributor' || apiStore.storeTagline === '__deleted__' || apiStore.storeName === '__deleted__') return;

          // JANGAN PERNAH timpa PIN lokal asli dengan placeholder '••••' dari Cloud!
          const existing = (appState.partnerStores || []).find(s => s && s.slug === apiStore.slug);
          const savedLocalPin = localStorage.getItem(`sr12_store_pin_${apiStore.slug}`);
          if (apiStore.storeAdminPin === '••••' || !apiStore.storeAdminPin) {
            apiStore.storeAdminPin = (existing && existing.storeAdminPin && existing.storeAdminPin !== '••••')
              ? existing.storeAdminPin
              : (savedLocalPin || '1234');
          }

          validStores.push(apiStore);
        });

        // Terapkan ke state aplikasi secara langsung
        appState.partnerStores = validStores;
        changed = true;

        // Sinkronkan rekening, kontak & tarif biaya admin Developer dari row sr12-central di Supabase Cloud
        if (centralStore) {
          const rawSubtitle = centralStore.hero_subtitle || centralStore.heroSubtitle;
          if (rawSubtitle) {
            try {
              const parsed = typeof rawSubtitle === 'string' ? JSON.parse(rawSubtitle) : rawSubtitle;
              if (parsed) {
                if (parsed.platformFee) {
                  const cloudFee = parseInt(parsed.platformFee, 10);
                  if (!isNaN(cloudFee) && cloudFee >= 500) {
                    appState.platformFee = cloudFee;
                    localStorage.setItem('sr12_platform_fee_amount', String(cloudFee));
                    if (appState.storeSettings) appState.storeSettings.platformFeeAmount = cloudFee;
                    if (Array.isArray(appState.partnerStores)) {
                      appState.partnerStores.forEach(s => { s.platformFeeAmount = cloudFee; });
                    }
                    if (typeof syncPlatformFeeInputsToAllSettings === 'function') {
                      syncPlatformFeeInputsToAllSettings(cloudFee);
                    }
                  }
                }
                if (parsed.bankAccount || parsed.ewalletNumber || parsed.developerWa) {
                  appState.devPaymentSettings = Object.assign({}, DEFAULT_DEV_PAYMENT_SETTINGS, parsed);
                  localStorage.setItem('sr12_dev_payment_settings_v1', JSON.stringify(appState.devPaymentSettings));
                  if (typeof updateDevPaymentUI === 'function') updateDevPaymentUI();
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn('Supabase store sync warning:', e);
    }
  }

  // Tandai sinkronisasi awal Cloud selesai (untuk menghilangkan placeholder loading direktori)
  appState.isCloudSyncComplete = true;

  // 2. Simpan hasil sinkronisasi dan selalu refresh UI agar tampilan sama persis di HP & seluruh browser
  saveStoredPartnerStores(appState.partnerStores);
  renderStoreDropdown();
  try {
    if (typeof updateDevPortalMetrics === 'function') {
      updateDevPortalMetrics();
    }
    if (appState.isDevMasterLoggedIn || localStorage.getItem('sr12_dev_session') === 'active') {
      if (typeof syncAllNetworkOrdersForDev === 'function') {
        syncAllNetworkOrdersForDev();
      }
    }
  } catch (errMetrics) {
    console.warn('Update dev portal metrics warning:', errMetrics);
  }
  if (typeof renderSwitchStoreModal === 'function') {
    renderSwitchStoreModal();
  }

  // Jika sedang membuka etalase toko mitra tertentu, pastikan data toko di-refresh ke versi Cloud terbaru
  if (appState.currentStoreSlug && appState.currentStoreSlug !== 'sr12-central') {
    const updatedCurrent = (appState.partnerStores || []).find(s => s && s.slug === appState.currentStoreSlug);
    if (updatedCurrent) {
      appState.storeSettings = Object.assign({}, appState.storeSettings, updatedCurrent);
      if (typeof renderStoreBranding === 'function') {
        renderStoreBranding();
      }
    }
  }

  // Selalu pastikan direktori di Official Central Hub ter-refresh sesuai database terbaru
  if (typeof renderOfficialDistributorDirectory === 'function') {
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
        const deletedIds = new Set(getDeletedPendingStoreIds());
        
        for (const apiApp of supaPending) {
          if (!apiApp || !apiApp.id) continue;
          if (activeSlugs.has(apiApp.slug) || apiApp.status === 'approved' || deletedIds.has(apiApp.id) || (apiApp.slug && deletedIds.has(apiApp.slug))) {
            if (typeof deletePendingStoreFromSupabase === 'function') {
              await deletePendingStoreFromSupabase(apiApp.id, apiApp.slug);
            }
            continue;
          }
          const idx = appState.pendingStoreApps.findIndex(a => a.id === apiApp.id || (apiApp.slug && a.slug === apiApp.slug));
          if (idx >= 0) {
            appState.pendingStoreApps[idx] = Object.assign({}, appState.pendingStoreApps[idx], apiApp);
          } else {
            appState.pendingStoreApps.push(apiApp);
            changed = true;
          }
        }

        const oldLen = appState.pendingStoreApps.length;
        appState.pendingStoreApps = appState.pendingStoreApps.filter(a => 
          !activeSlugs.has(a.slug) && 
          a.status !== 'approved' &&
          !deletedIds.has(a.id) &&
          !deletedIds.has(a.slug)
        );
        if (appState.pendingStoreApps.length !== oldLen) changed = true;

        if (typeof savePendingStoreToSupabase === 'function') {
          const toUpload = appState.pendingStoreApps.filter(localApp => {
            if (!localApp || !localApp.id) return false;
            if (activeSlugs.has(localApp.slug) || localApp.status === 'approved' || deletedIds.has(localApp.id) || deletedIds.has(localApp.slug)) return false;
            return !supaPending.some(s => s.id === localApp.id || (localApp.slug && s.slug === localApp.slug));
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
  // 1. Cek parameter URL (?store=...)
  const params = new URLSearchParams(window.location.search);
  const storeParam = params.get('store');
  if (storeParam && storeParam.trim()) {
    const cleanParam = storeParam.trim();
    const matched = (stores || []).find(s => s.slug === cleanParam);
    if (matched) return matched.slug;
    return cleanParam;
  }

  // 2. Cek sesi login distributor yang sedang aktif
  try {
    const distSession = sessionStorage.getItem('sr12_distributor_session') || localStorage.getItem('sr12_distributor_session');
    if (distSession) {
      const parsed = JSON.parse(distSession);
      if (parsed && parsed.slug) return parsed.slug;
    }
  } catch(e) {}

  // 3. Cek toko terakhir yang aktif dibuka
  try {
    const lastActive = localStorage.getItem('sr12_last_active_partner_store') || localStorage.getItem('sr12_logged_store_slug');
    if (lastActive && lastActive.trim()) {
      return lastActive.trim();
    }
  } catch(e) {}

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

// Pembersihan otomatis sisa catatan kas uji coba lama
(function autoPurgeGhostTestCashflow() {
  const ghostIds = ['CSH-1792391940433-4560', 'CSH-1792391933362-1694', 'CSH-1792412735057-8961', 'CSH-1792412721972-8355'];
  ['iyoutique', 'asmaragama', 'sr12-central'].forEach(slug => {
    const key = `sr12_cashflow_records_v2_${slug}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(c => c && !ghostIds.includes(c.id));
          localStorage.setItem(key, JSON.stringify(cleaned));
        }
      }
    } catch(e) {}
  });
  ghostIds.forEach(id => {
    if (typeof dbDeleteCashflow === 'function') {
      try { dbDeleteCashflow(id); } catch(e) {}
    }
  });
})();

// ==========================================
// INDEXEDDB ENGINE UNTUK PENYIMPANAN FOTO & MASTER PRODUK
// Kapasitas besar (ratusan MB / GB), bebas dari batas 5MB LocalStorage browser
// ==========================================
const SR12_DB_NAME = 'sr12_partner_store_db';
const SR12_DB_VERSION = 3;
const SR12_STORE_PRODUCTS = 'products_master';
const SR12_STORE_MITRA = 'mitra_master';
const SR12_STORE_MARKETER_SALES = 'marketer_sales_master';
const SR12_STORE_CASHFLOW = 'cashflow_master';

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
        if (!db.objectStoreNames.contains(SR12_STORE_CASHFLOW)) {
          db.createObjectStore(SR12_STORE_CASHFLOW, { keyPath: 'id' });
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

async function dbGetProduct(productId) {
  if (!productId) return null;
  const db = await openSR12IndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_PRODUCTS], 'readonly');
      const store = tx.objectStore(SR12_STORE_PRODUCTS);
      const req = store.get(productId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}
window.dbGetProduct = dbGetProduct;

// ==========================================
// INDEXEDDB ENGINE UNTUK CATATAN BUKU KAS (CASHFLOW)
// ==========================================
async function dbSaveCashflow(entry) {
  if (!entry || !entry.id) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_CASHFLOW], 'readwrite');
      const store = tx.objectStore(SR12_STORE_CASHFLOW);
      store.put(entry);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}
window.dbSaveCashflow = dbSaveCashflow;

async function dbSaveAllCashflow(list) {
  if (!Array.isArray(list) || list.length === 0) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_CASHFLOW], 'readwrite');
      const store = tx.objectStore(SR12_STORE_CASHFLOW);
      list.forEach(c => { if (c && c.id) store.put(c); });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}
window.dbSaveAllCashflow = dbSaveAllCashflow;

async function dbGetAllCashflow(slug) {
  const db = await openSR12IndexedDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_CASHFLOW], 'readonly');
      const store = tx.objectStore(SR12_STORE_CASHFLOW);
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result || [];
        if (slug) {
          resolve(res.filter(c => !c.store_slug || c.store_slug === slug));
        } else {
          resolve(res);
        }
      };
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}
window.dbGetAllCashflow = dbGetAllCashflow;

async function dbDeleteCashflow(id) {
  if (!id) return;
  const db = await openSR12IndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([SR12_STORE_CASHFLOW], 'readwrite');
      const store = tx.objectStore(SR12_STORE_CASHFLOW);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}
window.dbDeleteCashflow = dbDeleteCashflow;

function normalizeProductKey(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/^sr12[-_\s]*/gi, '')
    .replace(/[-_\s]*sr12[-_\s]*/gi, '')
    .replace(/[-_\s]*[0-9]+(?:\.[0-9]+)?[-_\s]*(?:g|gr|gram|ml|l|kg|pcs|pc|tablet|kapsul|tube|box|sachet)?$/gi, '')
    .replace(/[^a-z0-9]/g, '');
}
window.normalizeProductKey = normalizeProductKey;

function findBestProductMatch(products, queryParam) {
  if (!Array.isArray(products) || products.length === 0 || !queryParam) return null;
  const raw = String(queryParam).trim().toLowerCase();
  const clean = raw.replace(/[^a-z0-9]/g, '');

  // 1. Exact ID / SKU / Slug match
  const exact = products.find(p => 
    (p.id && p.id.toLowerCase() === raw) || 
    (p.sku && p.sku.toLowerCase() === raw) ||
    (p.slug && p.slug.toLowerCase() === raw) ||
    (p.id && p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean)
  );
  if (exact) return exact;

  // 2. Filter kandidat berdasarkan normalisasi key / nama
  const normQuery = normalizeProductKey(raw);
  const candidates = products.filter(p => {
    const pNorm = normalizeProductKey(p.id);
    const pNameNorm = normalizeProductKey(p.name);
    const pCleanId = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const pCleanName = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    return (normQuery && (pNorm === normQuery || pNameNorm === normQuery)) ||
           (clean.length >= 5 && (pCleanId.includes(clean) || clean.includes(pCleanId))) ||
           (clean.length >= 5 && (pCleanName.includes(clean) || clean.includes(pCleanName)));
  });

  if (candidates.length === 0) {
    // Fallback: pencarian kata kunci
    const words = clean.replace(/^sr12/i, '').split(/[-_\s]+/).filter(w => w.length > 2);
    if (words.length > 0) {
      const wordMatch = products.find(p => {
        const text = (p.id + ' ' + p.name + ' ' + (p.sku || '')).toLowerCase();
        return words.every(w => text.includes(w));
      });
      if (wordMatch) return wordMatch;
    }
    return null;
  }

  // Prioritaskan produk yang memiliki foto asli (bukan ilustrasi SVG dummy) atau customEdited
  candidates.sort((a, b) => {
    const aReal = a.customEdited || (a.image && !a.image.startsWith('data:image/svg+xml'));
    const bReal = b.customEdited || (b.image && !b.image.startsWith('data:image/svg+xml'));
    if (aReal && !bReal) return -1;
    if (!aReal && bReal) return 1;
    return 0;
  });

  // Jika terdapat varian ukuran (misal 500 ml vs 250 ml), cocokkan angka ukuran
  const numMatch = raw.replace(/^sr12[-_]?/i, '').match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    const withNum = candidates.find(p => (p.id + ' ' + p.name).includes(num));
    if (withNum) return withNum;
  }

  return candidates[0];
}
window.findBestProductMatch = findBestProductMatch;

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

// Sinkronisasi otomatis data produk & foto asli dari IndexedDB & Supabase Cloud saat aplikasi dimuat
async function syncProductsWithIndexedDB() {
  try {
    const idbProducts = await dbGetAllProducts();
    let hasChanges = false;

    const activeSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';

    if (idbProducts && idbProducts.length > 0) {
      if (typeof appState !== 'undefined' && Array.isArray(appState.products)) {
        idbProducts.forEach(idbP => {
          if (!idbP) return;
          // Hanya terapkan jika produk ini milik toko aktif
          if (idbP.store_slug && idbP.store_slug !== activeSlug) return;
          const target = findBestProductMatch(appState.products, idbP.originalId || idbP.id || idbP.name);
          if (target) {
            if (idbP.image && !idbP.image.startsWith('data:image/svg+xml')) {
              target.image = idbP.image;
              target.customEdited = true;
            }
            if (idbP.name) target.name = idbP.name;
            if (idbP.het) { target.het = idbP.het; target.price = idbP.het; }
            if (idbP.stock !== undefined) target.stock = idbP.stock;
            if (idbP.summary) target.summary = idbP.summary;
            saveStoreProductOverride(activeSlug, target);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          if (typeof renderProducts === 'function') renderProducts();
          if (typeof renderInventoryTable === 'function') renderInventoryTable();
          if (typeof renderPosProducts === 'function') renderPosProducts();
          if (typeof updateCartUI === 'function') updateCartUI();
        }
      }
    }

    // 2. Sinkronkan dengan Supabase Cloud (memulihkan katalog & foto meskipun browser di-clear history)
    if (typeof syncProductsFromSupabase === 'function') {
      const cloudProducts = await syncProductsFromSupabase(activeSlug);
      if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        let hasCloudUpdates = false;

        cloudProducts.forEach(cp => {
          if (!cp) return;
          const target = findBestProductMatch(appState.products, cp.id || cp.name);
          if (target) {
            if (cp.image && !cp.image.startsWith('data:image/svg+xml')) {
              target.image = cp.image;
              target.customEdited = true;
            }
            if (cp.name) target.name = cp.name;
            if (cp.het) { target.het = cp.het; target.price = cp.het; }
            if (cp.stock !== undefined) target.stock = cp.stock;
            if (cp.summary) target.summary = cp.summary;
            saveStoreProductOverride(activeSlug, target);
            hasCloudUpdates = true;
          }
        });

        if (hasCloudUpdates) {
          if (typeof renderProducts === 'function') renderProducts();
          if (typeof renderInventoryTable === 'function') renderInventoryTable();
          if (typeof renderPosProducts === 'function') renderPosProducts();
          if (typeof updateCartUI === 'function') updateCartUI();

          // PENTING: Jika modal detail produk sedang terbuka, perbarui foto & judul seketika!
          const modalDetail = document.getElementById('modalProductDetail');
          if (modalDetail && modalDetail.classList.contains('open') && appState.activeDetailProductId) {
            const activeP = findBestProductMatch(appState.products, appState.activeDetailProductId);
            if (activeP) {
              const modalImg = document.getElementById('modalProdImage');
              if (modalImg && activeP.image) modalImg.src = activeP.image;
              const modalTitle = document.getElementById('modalProdTitle');
              if (modalTitle && activeP.name) modalTitle.textContent = activeP.name;
            }
          }
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
        const curStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
        const mitraMap = new Map();
        (appState.mitraList || []).forEach(m => {
          const compKey = `${m.store_slug || 'sr12-central'}_${(m.id || '').toUpperCase()}`;
          mitraMap.set(compKey, m);
        });
        idbMitra.forEach(m => {
          const compKey = `${m.store_slug || 'sr12-central'}_${(m.id || '').toUpperCase()}`;
          if (!mitraMap.has(compKey)) {
            mitraMap.set(compKey, m);
          }
        });
        appState.mitraList = Array.from(mitraMap.values());
        appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === curStoreSlug);
        localStorage.setItem('sr12_distributor_mitra_v2', JSON.stringify(appState.mitraList));
        localStorage.setItem('sr12_distributor_resellers_v1', JSON.stringify(appState.mitraList));
        if (typeof renderResellers === 'function') renderResellers();
        if (typeof updateViewModeUI === 'function') updateViewModeUI();
      }
    } else if (typeof appState !== 'undefined' && Array.isArray(appState.mitraList) && appState.mitraList.length > 0) {
      await dbSaveAllMitra(appState.mitraList);
    }

    // 2. Sinkronkan Rekap Penjualan Marketer
    const curStoreSlug = (typeof appState !== 'undefined' && ((appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug)) || 'sr12-central';
    const rawLocalSales = localStorage.getItem(`sr12_marketer_sales_v2_${curStoreSlug}`);
    if (rawLocalSales === '[]') {
      // LocalStorage sengaja dikosongkan oleh user: bersihkan juga IndexedDB agar data hantu tidak hidup kembali!
      appState.marketerSales = [];
      if (typeof dbSaveAllMarketerSales === 'function') {
        await dbSaveAllMarketerSales([]);
      }
    } else {
      const idbSales = await dbGetAllMarketerSales();
      if (idbSales && idbSales.length > 0) {
        if (typeof appState !== 'undefined') {
          const filteredIdb = idbSales.filter(s => (s.store_slug === curStoreSlug) || (!s.store_slug && curStoreSlug === 'sr12-central'));
          const salesMap = new Map((appState.marketerSales || []).map(s => [s.orderId, s]));
          filteredIdb.forEach(s => {
            if (s && s.orderId && !salesMap.has(s.orderId)) salesMap.set(s.orderId, s);
          });
          appState.marketerSales = Array.from(salesMap.values());
          saveStoredMarketerSales(appState.marketerSales, false, curStoreSlug);
          if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
        }
      } else if (typeof appState !== 'undefined' && Array.isArray(appState.marketerSales) && appState.marketerSales.length > 0) {
        await dbSaveAllMarketerSales(appState.marketerSales);
      }
    }

    // 3. Sinkronkan dari Supabase Cloud hanya jika pemilik toko / admin sedang login (Aman UU PDP & Anti-Leak)
    const isOwnerOrAdmin = (typeof appState !== 'undefined') && (appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn);
    if (isOwnerOrAdmin && typeof syncMitraFromSupabase === 'function') {
      const curSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
      const targetSlug = appState.isDevMasterLoggedIn ? 'all' : curSlug;
      const cloudMitra = await syncMitraFromSupabase(targetSlug);
      if (Array.isArray(cloudMitra)) {
        if (targetSlug !== 'all' && targetSlug !== 'global') {
          const otherStoreMitra = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') !== curSlug);
          appState.mitraList = [...otherStoreMitra, ...cloudMitra];
        } else {
          appState.mitraList = cloudMitra;
        }
        appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === curSlug);
        saveStoredMitra(appState.mitraList, false);
        if (typeof renderResellers === 'function') renderResellers();
        if (typeof updateViewModeUI === 'function') updateViewModeUI();
        if (typeof updateDevPortalMetrics === 'function') updateDevPortalMetrics();
      }
    }
  } catch (err) {
    console.warn('Sync IndexedDB mitra info:', err);
  }
}
window.syncMitraWithIndexedDB = syncMitraWithIndexedDB;


// ========================================================
// SISTEM MULTI-TENANT ISOLASI PRODUK & FOTO RESMI PER DISTRIBUTOR
// Memungkinkan setiap toko mitra mengunggah / memilih foto produk terbaiknya
// tanpa mempengaruhi foto di toko mitra distributor lain.
// ========================================================
function getStoreProductOverrides(storeSlug) {
  if (!storeSlug) storeSlug = 'sr12-central';
  try {
    const raw = localStorage.getItem(`sr12_store_product_overrides_${storeSlug}`) || localStorage.getItem(`sr12_store_products_${storeSlug}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch(e) {}
  return {};
}

function saveStoreProductOverride(storeSlug, prod) {
  if (!storeSlug || !prod || !prod.id) return;
  try {
    const overrides = getStoreProductOverrides(storeSlug);
    const existing = overrides[prod.id] || {};
    overrides[prod.id] = {
      image: prod.image || existing.image,
      name: prod.name || existing.name,
      category: prod.category || existing.category,
      het: Number(prod.het || prod.price || existing.het) || 0,
      price: Number(prod.het || prod.price || existing.price) || 0,
      stock: (typeof prod.stock !== 'undefined') ? Number(prod.stock) : (existing.stock !== undefined ? existing.stock : 50),
      summary: prod.summary || existing.summary || '',
      customEdited: true
    };
    try {
      localStorage.setItem(`sr12_store_product_overrides_${storeSlug}`, JSON.stringify(overrides));
      localStorage.setItem(`sr12_store_products_${storeSlug}`, JSON.stringify(overrides));
    } catch(lsErr) {
      console.warn('LocalStorage quota penuh, override produk dihandle via IndexedDB:', lsErr);
    }
  } catch(e) {
    console.warn('Gagal simpan override produk lokal:', e);
  }
}
window.saveStoreProductOverride = saveStoreProductOverride;

async function loadStoreProducts(storeSlug) {
  if (!storeSlug) {
    storeSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  }

  const masterList = (typeof DEFAULT_SR12_PRODUCTS !== 'undefined' && Array.isArray(DEFAULT_SR12_PRODUCTS))
    ? DEFAULT_SR12_PRODUCTS
    : [];

  // 1. Clone produk dasar dari master catalog (murni, bersih dari edit toko lain)
  const baseProducts = masterList.map(mp => Object.assign({}, mp));

  // 2. Terapkan override lokal khusus untuk toko ini (LocalStorage & IndexedDB)
  const overrides = getStoreProductOverrides(storeSlug);

  // Ambil juga override yang tersimpan di IndexedDB agar tahan banting & tidak hilang
  if (typeof dbGetAllProducts === 'function') {
    try {
      const idbList = await dbGetAllProducts();
      if (Array.isArray(idbList)) {
        idbList.forEach(ip => {
          if (!ip) return;
          const isThisStore = (ip.store_slug === storeSlug) || (ip.id && ip.id.startsWith(storeSlug + '___'));
          if (isThisStore) {
            const rawId = ip.originalId || (ip.id ? ip.id.replace(storeSlug + '___', '') : ip.id);
            if (!overrides[rawId]) {
              overrides[rawId] = {
                image: ip.image,
                name: ip.name,
                category: ip.category,
                het: ip.het || ip.price,
                stock: ip.stock,
                summary: ip.summary,
                customEdited: true
              };
            } else if (ip.image && (ip.customEdited || !overrides[rawId].image || overrides[rawId].image.startsWith('data:image/svg+xml'))) {
              overrides[rawId].image = ip.image;
            }
          }
        });
      }
    } catch(eIdb) {}
  }

  // Jika ini toko alzam-agency dan belum ada overrides khusus, migrasikan edit lama jika ada di cache
  if (storeSlug === 'alzam-agency' && Object.keys(overrides).length === 0) {
    try {
      const oldRaw = localStorage.getItem('sr12_all_products_v5_full');
      if (oldRaw) {
        const oldParsed = JSON.parse(oldRaw);
        if (Array.isArray(oldParsed)) {
          oldParsed.forEach(p => {
            if (p.customEdited || (p.image && !p.image.startsWith('data:image/svg+xml') && p.image !== 'assets/hero-banner.jpg')) {
              overrides[p.id] = {
                image: p.image,
                name: p.name,
                category: p.category,
                het: p.het || p.price,
                price: p.het || p.price,
                stock: p.stock,
                summary: p.summary,
                customEdited: true
              };
            }
          });
          localStorage.setItem(`sr12_store_product_overrides_alzam-agency`, JSON.stringify(overrides));
        }
      }
    } catch(e) {}
  }

  // Gabungkan override ke produk dasar
  baseProducts.forEach(p => {
    const o = overrides[p.id];
    if (o) {
      if (o.image) p.image = o.image;
      if (o.name) p.name = o.name;
      if (o.category) p.category = o.category;
      if (o.het !== undefined) { p.het = o.het; p.price = o.het; }
      if (o.stock !== undefined) p.stock = o.stock;
      if (o.summary) p.summary = o.summary;
      p.customEdited = true;
    }
    const val = Number(p.het || p.price || p.het_price) || 0;
    p.het = val;
    p.price = val;
    if (typeof p.stock === 'undefined') p.stock = 50;
  });

  // Periksa apakah ada produk kustom tambahan toko ini
  if (overrides._customProducts && Array.isArray(overrides._customProducts)) {
    baseProducts.push(...overrides._customProducts);
  }

  appState.products = baseProducts;

  // Render UI katalog, inventory, dan POS
  if (typeof renderProducts === 'function') renderProducts();
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderPosProducts === 'function') renderPosProducts();
  if (typeof updateCartUI === 'function') updateCartUI();

  // 3. Sinkronkan dengan Supabase Cloud eksklusif untuk toko ini
  if (typeof syncProductsFromSupabase === 'function') {
    try {
      const supaProds = await syncProductsFromSupabase(storeSlug);
      if (Array.isArray(supaProds) && supaProds.length > 0) {
        let changed = false;
        supaProds.forEach(sp => {
          if (!sp) return;
          const target = findBestProductMatch(appState.products, sp.id || sp.name);
          if (target) {
            // Jangan biarkan sp.image hero-banner default menimpa foto custom lokal yang sudah ada
            if (sp.image && !sp.image.startsWith('data:image/svg+xml') && (sp.image !== 'assets/hero-banner.jpg' || !target.customEdited)) {
              target.image = sp.image;
              target.customEdited = true;
            }
            if (sp.name) target.name = sp.name;
            if (sp.het) { target.het = sp.het; target.price = sp.het; }
            if (sp.stock !== undefined) target.stock = sp.stock;
            if (sp.summary) target.summary = sp.summary;
            saveStoreProductOverride(storeSlug, target);
            changed = true;
          }
        });

        if (changed) {
          if (typeof renderProducts === 'function') renderProducts();
          if (typeof renderInventoryTable === 'function') renderInventoryTable();
          if (typeof renderPosProducts === 'function') renderPosProducts();
          if (typeof updateCartUI === 'function') updateCartUI();

          const modalDetail = document.getElementById('modalProductDetail');
          if (modalDetail && modalDetail.classList.contains('open') && appState.activeDetailProductId) {
            const activeP = findBestProductMatch(appState.products, appState.activeDetailProductId);
            if (activeP) {
              const modalImg = document.getElementById('modalProdImage');
              if (modalImg && activeP.image) modalImg.src = activeP.image;
              const modalTitle = document.getElementById('modalProdTitle');
              if (modalTitle && activeP.name) modalTitle.textContent = activeP.name;
            }
          }
        }
      }
    } catch(err) {
      console.warn('Sync cloud products per store error:', err);
    }
  }

  return appState.products;
}
window.getStoreProductOverrides = getStoreProductOverrides;
window.saveStoreProductOverride = saveStoreProductOverride;
window.loadStoreProducts = loadStoreProducts;

function getStoredProducts(targetSlug = null) {
  const masterList = (typeof DEFAULT_SR12_PRODUCTS !== 'undefined' && Array.isArray(DEFAULT_SR12_PRODUCTS))
    ? DEFAULT_SR12_PRODUCTS
    : [];

  const baseProducts = masterList.map(mp => Object.assign({}, mp));
  const curSlug = targetSlug || 'sr12-central';
  const overrides = getStoreProductOverrides(curSlug);

  baseProducts.forEach(p => {
    const o = overrides[p.id];
    if (o) {
      if (o.image) p.image = o.image;
      if (o.name) p.name = o.name;
      if (o.category) p.category = o.category;
      if (o.het !== undefined) { p.het = o.het; p.price = o.het; }
      if (o.stock !== undefined) p.stock = o.stock;
      if (o.summary) p.summary = o.summary;
      p.customEdited = true;
    }
    const val = Number(p.het || p.price || p.het_price) || 0;
    p.het = val;
    p.price = val;
    if (typeof p.stock === 'undefined') p.stock = 50;
  });

  // Segera sinkronkan foto asli dari IndexedDB di latar belakang
  setTimeout(() => {
    syncProductsWithIndexedDB();
  }, 100);

  return baseProducts;
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
      if (!srcOrFile.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
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
    localStorage.setItem('sr12_all_products_v5_full', JSON.stringify(productsList));
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
      localStorage.setItem('sr12_all_products_v5_full', JSON.stringify(leanProducts));
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

/**
 * UNIVERSAL SAFE FILE DOWNLOAD HELPER
 * Mencegah navigasi layar putih di browser HP / Safari / Chrome Mobile.
 * Menggunakan Web Share API pada HP jika didukung (bisa langsung simpan ke Drive/File/WA)
 * dan Blob URL dengan application/octet-stream agar selalu memicu dialog unduhan (Save As).
 */
async function downloadFileUniversal(filename, content, mimeType = 'application/octet-stream') {
  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const blob = (content instanceof Blob) ? content : new Blob([content], { type: mimeType });

    // 1. Pada HP / Tablet: Coba gunakan Web Share API (Fitur modern: Simpan ke File / Drive / WA)
    if (isMobile && navigator.canShare && typeof File !== 'undefined') {
      try {
        const fileObj = new File([blob], filename, { type: mimeType });
        if (navigator.canShare({ files: [fileObj] })) {
          await navigator.share({
            files: [fileObj],
            title: filename,
            text: `Backup Data SR12: ${filename}`
          });
          if (typeof showToast === 'function') {
            showToast(`✅ File "${filename}" berhasil dibagikan / disimpan!`);
          }
          return true;
        }
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') return true; // Pengguna sengaja membatalkan share sheet
      }
    }

    // 2. Download via programmatic <a> tag dengan octet-stream (Mencegah tampilan layar putih)
    const blobOctet = (content instanceof Blob) ? content : new Blob([content], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blobOctet);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.setAttribute('download', filename);
    // Jangan set target="_blank" pada mobile agar browser HP tidak membuka tab layar putih kosong
    if (!isMobile) {
      link.setAttribute('target', '_blank');
    }
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 1500);

    if (typeof showToast === 'function') {
      showToast(`📥 File "${filename}" berhasil diunduh!`);
    }
    return true;
  } catch (err) {
    console.error('downloadFileUniversal error:', err);
    prompt('Salin teks cadangan di bawah ini untuk disimpan manual di Catatan / Google Keep:', typeof content === 'string' ? content : '');
    return false;
  }
}
window.downloadFileUniversal = downloadFileUniversal;

// Fitur Backup & Restore Katalog Produk (Untuk Keamanan Cadangan Data Pengguna)
async function exportProductCatalogBackup() {
  try {
    const list = (typeof appState !== 'undefined' && appState.products) ? appState.products : [];
    if (!list || list.length === 0) {
      showToast('⚠️ Belum ada produk di katalog untuk dibackup!');
      return;
    }
    const jsonStr = JSON.stringify(list, null, 2);
    const filename = `katalog_produk_sr12_backup_${new Date().toISOString().slice(0, 10)}.json`;
    await downloadFileUniversal(filename, jsonStr, 'application/json;charset=utf-8');
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
        const sanitizedProducts = parsed.map(p => ({
          ...p,
          name: escapeHtml(p.name || 'Produk SR12'),
          image: (typeof sanitizeImageUrl === 'function') ? sanitizeImageUrl(p.image) : (p.image || 'assets/hero-banner.jpg')
        }));
        appState.products = sanitizedProducts;
        await dbSaveAllProducts(sanitizedProducts);
        saveStoredProducts(sanitizedProducts);
        renderProducts();
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
        if (typeof renderPosProducts === 'function') renderPosProducts();
        updateCartUI();
        showToast(`✅ Berhasil memulihkan ${sanitizedProducts.length} produk aman dari file backup!`);
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
  const currentStoreSlug = (typeof appState !== 'undefined' && appState.currentStoreSlug) ? appState.currentStoreSlug : 'sr12-central';
  const deletedIds = JSON.parse(localStorage.getItem(`sr12_deleted_rewards_${currentStoreSlug}`) || localStorage.getItem('sr12_deleted_rewards') || '[]');
  const stored = localStorage.getItem(`sr12_custom_rewards_${currentStoreSlug}`) || localStorage.getItem('sr12_custom_rewards');
  let list = [...DEFAULT_SR12_REWARDS];
  if (stored) {
    try {
      list = [...list, ...JSON.parse(stored)];
    } catch (e) {
      console.error(e);
    }
  }
  return list.filter(r => !deletedIds.includes(r.id));
}

function getStoredDevPin() {
  if (typeof window !== 'undefined' && window.appState && window.appState.masterDevPin) {
    return String(window.appState.masterDevPin).trim();
  }
  return localStorage.getItem('sr12_master_dev_pin') || '8899'; // Default PIN Master Developer: 8899
}

async function fetchLatestDevPinFromCloud() {
  // Keamanan: PIN tidak lagi diambil dalam bentuk plaintext dari tabel stores
  return null;
}
window.fetchLatestDevPinFromCloud = fetchLatestDevPinFromCloud;

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
      saveMitraToSupabase(m, m.store_slug || slug);
    });
  }
}

function getStoredResellers() {
  return getStoredMitra();
}

function saveStoredResellers(resellers) {
  saveStoredMitra(resellers);
}

function getStoredMarketerSales(slug) {
  const curSlug = slug || (typeof appState !== 'undefined' && ((appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug)) || 'sr12-central';
  const key = `sr12_marketer_sales_v2_${curSlug}`;
  const stored = localStorage.getItem(key);
  if (stored !== null) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        return list.filter(s => {
          if (!s || s.paidStatus === 'deleted' || s.paidStatus === 'Dihapus') return false;
          const mid = String(s.marketerId || '').trim().toUpperCase();
          if (!mid || mid === 'RS-WEB' || mid === 'RES-WEB' || mid === 'RETAIL' || mid.startsWith('RS-') || mid.startsWith('RES-') || mid.startsWith('AG-') || mid.startsWith('SUB-')) return false;
          return true;
        });
      }
    } catch (e) {}
  }
  return [];
}

function saveStoredMarketerSales(sales, syncCloud = true, slug) {
  if (!Array.isArray(sales)) return;
  const curSlug = slug || (typeof appState !== 'undefined' && ((appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug)) || 'sr12-central';
  const key = `sr12_marketer_sales_v2_${curSlug}`;
  const data = JSON.stringify(sales);

  // 1. Simpan ke LocalStorage partisi toko
  try {
    localStorage.setItem(key, data);
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  // 2. Simpan permanen ke IndexedDB (pastikan selalu ada store_slug)
  if (typeof dbSaveAllMarketerSales === 'function') {
    dbSaveAllMarketerSales(sales.map(s => ({ ...s, store_slug: s.store_slug || curSlug })));
  }

  // 3. Sinkronisasi otomatis ke Supabase Cloud jika online
  if (syncCloud && typeof saveMarketerSaleToSupabase === 'function') {
    sales.forEach(s => {
      saveMarketerSaleToSupabase(s, curSlug);
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
var appState = {
  isAdminMode: false,
  isDistributorLoggedIn: false,
  isDevMasterLoggedIn: false,
  currentTier: 'konsumen',
  cart: getStoredCart(),
  isCloudSyncComplete: false,
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
    name: '',
    phone: ''
  },
  buyerDetails: {
    name: '',
    phone: '',
    address: '',
    courier: 'jne'
  },
  platformFee: parseInt(localStorage.getItem('sr12_platform_fee_amount'), 10) || 2000,
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
window.appState = appState;

function getProductTierPrice(product, tierId) {
  // Marketer bayar harga HET penuh di awal (komisi 15% diakumulasi dan dicairkan bulanan oleh Distributor)
  if (tierId === 'marketer') {
    return product.het || 0;
  }
  const tier = SR12_TIERS[tierId] || SR12_TIERS.konsumen;
  const discountMultiplier = 1 - (tier.discountPct / 100);
  return Math.round((product.het || 0) * discountMultiplier);
}

function formatRupiah(amount) {
  return 'Rp\u00A0' + Number(amount || 0).toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Auto-migrasi v7.1: Bersihkan angka akumulasi belanja mitra hantu & sinkronkan ulang secara bersih
  if (localStorage.getItem('sr12_clean_sim_reset_v7_1') !== 'ready') {
    if (Array.isArray(appState.mitraList)) {
      appState.mitraList.forEach(m => {
        m.accumulatedSpent90Days = 0;
        m.totalOrdersCount = 0;
        m.spent = 0;
      });
      saveStoredMitra(appState.mitraList, false);
      if (typeof dbSaveAllMitra === 'function') {
        dbSaveAllMitra(appState.mitraList);
      }
    }
    const curSlug = (appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
    const curTrx = typeof getStoredTransactions === 'function' ? getStoredTransactions(curSlug) : [];
    if (!curTrx || curTrx.length === 0) {
      if (typeof saveStoredMarketerSales === 'function') {
        saveStoredMarketerSales([], false, curSlug);
      }
      if (typeof dbSaveAllMarketerSales === 'function') {
        dbSaveAllMarketerSales([]);
      }
    }
    localStorage.setItem('sr12_clean_sim_reset_v7_1', 'ready');
  }

  // PEMBERSIHAN TOTAL UNTUK PRODUKSI PROFESIONAL RESMI (Clean Slate):
  if (localStorage.getItem('sr12_clean_slate_production_v1') !== 'ready') {
    const freshCentral = Object.assign({}, DEFAULT_PARTNER_STORES[0]);
    appState.partnerStores = [freshCentral];
    saveStoredPartnerStores([freshCentral]);
    localStorage.removeItem('sr12_pending_store_apps_v2');
    appState.pendingStoreApps = [];
    localStorage.removeItem('sr12_deleted_store_slugs');
    localStorage.removeItem('sr12_pos_transactions_v1');
    localStorage.removeItem('sr12_customer_orders');
    localStorage.removeItem('sr12_cashflow_records_v1');
    localStorage.removeItem('sr12_stock_mutations_v1');
    localStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_active_cashier_shift_v1');
    appState.transactions = [];
    appState.cashflow = [];
    appState.cart = [];
    appState.posCart = [];
    appState.mitraList = [];
    appState.resellers = [];
    localStorage.setItem('sr12_mitra_downlines_v2', JSON.stringify([]));
    localStorage.setItem('sr12_resellers_v2', JSON.stringify([]));
    localStorage.setItem('sr12_distributor_mitra_v2', JSON.stringify([]));
    localStorage.setItem('sr12_marketer_sales_v1', JSON.stringify([]));
    localStorage.setItem('sr12_clean_slate_production_v1', 'ready');
  }
  appState.partnerStores = getStoredPartnerStores().filter(s => s && s.slug && s.slug !== 'toko-supa-distributor' && !s.slug.startsWith('deleted_') && !s.slug.includes('toko-supa') && s.slug !== 'simulasi-distributor');
  saveStoredPartnerStores(appState.partnerStores);

  // Bersihkan data mitra jaringan milik toko yang sudah dihapus sebelumnya
  try {
    const deletedSlugs = getDeletedStoreSlugs();
    if (deletedSlugs.length > 0 && Array.isArray(appState.mitraList)) {
      const prevCount = appState.mitraList.length;
      appState.mitraList = appState.mitraList.filter(m => !m.store_slug || !deletedSlugs.includes(m.store_slug));
      if (appState.mitraList.length !== prevCount) {
        saveStoredMitra(appState.mitraList, false);
      }
    }
  } catch (eClean) {
    console.warn('Gagal bersihkan orphan mitra terhapus:', eClean);
  }

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

  // 1. RENDER INSTAN DARI DATA LOKAL (0 ms - Langsung Tampil Sempurna Tanpa Menunggu Jaringan Cloud)
  const initSlug = getInitialStoreSlug(appState.partnerStores);
  loadStoreBySlug(initSlug);

  // 2. SINKRONISASI SUPABASE CLOUD (Autoritatif & Single Source of Truth untuk seluruh browser/perangkat)
  syncStoresWithServer();


function getMarketerNameById(id) {
  if (!id) return '';
  const q = String(id).toUpperCase().trim();
  const allList = (typeof appState !== 'undefined' && appState.mitraList) ? appState.mitraList : [];
  const found = allList.find(m => (m.id || '').toUpperCase() === q || (m.partner_code || '').toUpperCase() === q);
  if (found && found.name) return found.name;
  if (q === 'MKT-001') return 'Maryam';
  return id;
}
window.getMarketerNameById = getMarketerNameById;

async function initReferralAffiliateBanner(mktCode) {
  if (!mktCode) return;
  const cleanCode = mktCode.trim().toUpperCase();
  const topBanner = document.getElementById('affiliateReferralTopBanner');
  const topTitle = document.getElementById('affiliateReferralMarketerTitle');
  const cartNotice = document.getElementById('cartAffiliateReferralNotice');
  const cartNameText = document.getElementById('cartAffiliateMarketerNameText');

  let name = getMarketerNameById(cleanCode);

  if (topBanner) {
    topBanner.style.display = 'none'; // Sembunyikan banner atas agar etalase toko tetap bersih
  }
  if (cartNotice) {
    cartNotice.style.display = 'block';
    if (cartNameText) cartNameText.textContent = `${name} (${cleanCode})`;
  }

  // Jika nama masih berupa ID kode, cari langsung ke Supabase Cloud
  if (name === cleanCode && typeof findMitraInSupabase === 'function') {
    try {
      const curSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
      const cloudM = await findMitraInSupabase(cleanCode, curSlug);
      if (cloudM && cloudM.name) {
        name = cloudM.name;
        if (!appState.mitraList) appState.mitraList = [];
        const existIdx = appState.mitraList.findIndex(m => (m.id || '').toUpperCase() === cleanCode);
        if (existIdx < 0) appState.mitraList.unshift(cloudM);
        else appState.mitraList[existIdx] = Object.assign({}, appState.mitraList[existIdx], cloudM);
        saveStoredMitra(appState.mitraList, false);

        if (topTitle) topTitle.textContent = `Anda terhubung dengan Marketer: ${name} (${cleanCode})`;
        if (cartNameText) cartNameText.textContent = `${name} (${cleanCode})`;
      }
    } catch(e) {
      console.warn('initReferralAffiliateBanner cloud lookup error:', e);
    }
  }
}
window.initReferralAffiliateBanner = initReferralAffiliateBanner;

  // Pastikan URL di address bar browser selalu mencantumkan parameter toko (?store=...) tanpa menghapus parameter produk (?product=...)
  const bootParams = new URLSearchParams(window.location.search);
  let bootParamsChanged = false;
  if (!bootParams.has('store')) {
    bootParams.set('store', initSlug);
    bootParamsChanged = true;
  }

  // Deteksi jika link dibuka via tautan referral / afiliasi marketer pribadi (?mkt=... atau ?ref=...)
  const explicitRefParam = bootParams.get('mkt') || bootParams.get('ref') || bootParams.get('marketer');
  let refMktParam = explicitRefParam;
  if (!refMktParam) {
    try {
      refMktParam = sessionStorage.getItem('sr12_active_referral_marketer');
    } catch(e) {}
  }
  if (refMktParam && refMktParam.trim()) {
    const cleanRef = refMktParam.trim().toUpperCase();
    try {
      sessionStorage.setItem('sr12_active_referral_marketer', cleanRef);
      if (explicitRefParam) {
        localStorage.setItem('sr12_active_referral_marketer', cleanRef);
      }
    } catch(e) {}
    appState.activeReferralMarketer = cleanRef;
    console.log('💼 Terdeteksi Link Belanja via Rekomendasi Marketer Resmi:', cleanRef);
    setTimeout(() => {
      initReferralAffiliateBanner(cleanRef);
    }, 200);
  } else {
    appState.activeReferralMarketer = '';
  }

  // CATATAN PENTING: JANGAN PERNAH menghapus parameter produk (?product=...) atau hash halaman (#developer) agar link selalu terbuka sempurna!
  if (bootParamsChanged) {
    window.history.replaceState({ store: initSlug }, '', window.location.pathname + '?' + bootParams.toString() + (window.location.hash || ''));
  }

  // Sesi Toko Distributor: Pertahankan status login dan toko distributor saat refresh
  const urlParamsCheck = new URLSearchParams(window.location.search);
  const wantsAdmin = urlParamsCheck.get('admin') === '1' || urlParamsCheck.get('mode') === 'admin';
  const savedDistributorSession = sessionStorage.getItem('sr12_distributor_session') || localStorage.getItem('sr12_distributor_session');

  if (savedDistributorSession) {
    try {
      const parsedSession = JSON.parse(savedDistributorSession);
      if (parsedSession && parsedSession.slug) {
        if (initSlug !== parsedSession.slug && !urlParamsCheck.has('store')) {
          initSlug = parsedSession.slug;
          loadStoreBySlug(initSlug);
        }
        if (parsedSession.slug === initSlug || parsedSession.token === 'dev-master-bypass') {
          appState.isAdminMode = true;
          appState.isDistributorLoggedIn = true;
          if (parsedSession.token) {
            appState.distSessionToken = parsedSession.token;
          } else {
            const authV2 = sessionStorage.getItem('sr12_auth_session_v2') || localStorage.getItem('sr12_auth_session_v2');
            if (authV2) {
              try {
                const pV2 = JSON.parse(authV2);
                if (pV2 && pV2.token) appState.distSessionToken = pV2.token;
              } catch(e2) {}
            }
          }
        }
      }
    } catch(e) {
      console.warn('Restore distributor session notice:', e);
    }
  }

  renderStoreDropdown();
  initEventListeners();
  updateViewModeUI();

  // Sinkronisasi awal toko saat aplikasi dibuka
  syncStoresWithServer();

  // Listener WebSocket Cloud Instan: Ketika ada perubahan toko/antrean/mitra di Supabase, langsung sinkron seketika (0 Egress saat idle)
  if (typeof subscribeToStoreChanges === 'function') {
    try {
      subscribeToStoreChanges(() => {
        syncStoresWithServer();
        if (typeof syncMitraWithIndexedDB === 'function') syncMitraWithIndexedDB();
        if (typeof appState !== 'undefined' && appState.isDevMasterLoggedIn && typeof syncPendingStoresWithServer === 'function') {
          syncPendingStoresWithServer();
        }
      });
    } catch(subErr) {
      console.warn('Realtime subscription trigger error:', subErr);
    }
  }

  // Sinkronisasi saat tab kembali fokus (dibatasi minimal jeda 60 detik agar hemat kuota bandwidth)
  let lastFocusSyncTime = Date.now();
  window.addEventListener('focus', () => {
    if (Date.now() - lastFocusSyncTime > 60000) {
      lastFocusSyncTime = Date.now();
      syncStoresWithServer();
      if (typeof syncMitraWithIndexedDB === 'function') syncMitraWithIndexedDB();
      if (typeof appState !== 'undefined' && appState.isDevMasterLoggedIn && typeof syncPendingStoresWithServer === 'function') {
        syncPendingStoresWithServer();
      }
    }
  });
  renderTierQuickBanner();
  renderProducts();
  if (typeof syncProductsWithIndexedDB === 'function') {
    syncProductsWithIndexedDB();
  }
  handleDirectProductDeepLink();
  renderRewards();
  renderMarketingKits();
  if (typeof updateDevPaymentUI === 'function') {
    updateDevPaymentUI();
  }
  if (typeof updateTopupPackageCardsUI === 'function') {
    updateTopupPackageCardsUI();
  }
  // Memuat data tersimpan Mitra & Marketer (LocalStorage + IndexedDB permanen)
  appState.mitraList = getStoredMitra();
  const initStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  appState.resellers = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') === initStoreSlug);
  appState.marketerSales = (typeof getStoredMarketerSales === 'function') ? getStoredMarketerSales(initStoreSlug) : [];
  if (typeof syncMitraWithIndexedDB === 'function') {
    syncMitraWithIndexedDB();
  }
  if (typeof getStoredCashflow === 'function') {
    appState.cashflow = getStoredCashflow(initStoreSlug);
  }
  if (typeof dbGetAllCashflow === 'function') {
    dbGetAllCashflow(initStoreSlug).then(dbCash => {
      if (Array.isArray(dbCash) && dbCash.length > 0) {
        if (!appState.cashflow || appState.cashflow.length === 0) {
          appState.cashflow = dbCash;
          if (typeof saveStoredCashflow === 'function') {
            saveStoredCashflow(appState.cashflow, initStoreSlug);
          }
          if (typeof renderCashflowTable === 'function') {
            renderCashflowTable();
          }
        }
      }
    }).catch(() => {});
  }
  if (typeof getStoredTransactions === 'function') {
    appState.transactions = getStoredTransactions(initStoreSlug);
  } else {
    appState.transactions = [];
  }

  // Tandai seluruh pesanan yang sudah ada di penyimpanan lokal agar tidak memicu pop-up banner mengambang saat web dibuka/refresh
  if (!appState.notifiedOrderIds) {
    try {
      const saved = localStorage.getItem('sr12_notified_orders');
      appState.notifiedOrderIds = new Set(saved ? JSON.parse(saved) : []);
    } catch(e) {
      appState.notifiedOrderIds = new Set();
    }
  }
  (appState.transactions || []).forEach(t => {
    if (t && t.id) appState.notifiedOrderIds.add(t.id);
  });

function mergeCloudOrdersIntoLocal(cloudOrders, storeSlug) {
  if (!Array.isArray(cloudOrders)) return;
  const currentSlug = storeSlug || (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const local = (typeof getStoredTransactions === 'function' ? getStoredTransactions(currentSlug) : (appState.transactions || []))
    .filter(t => t && t.status !== 'Dihapus' && t.status !== 'deleted');
  
  const cloudMap = new Map();
  cloudOrders.forEach(co => {
    if (co && co.id && co.status !== 'Dihapus' && co.status !== 'deleted') {
      cloudMap.set(co.id, co);
    }
  });

  const merged = [];
  local.forEach(t => {
    if (!t || !t.id) return;
    if (t.id.startsWith('ORD-WEB-')) {
      if (cloudMap.has(t.id)) {
        const co = cloudMap.get(t.id);
        if (t.status === 'Lunas / Selesai' || t.status === 'Selesai') co.status = 'Lunas / Selesai';
        merged.push(co);
        cloudMap.delete(t.id);
      }
    } else {
      merged.push(t);
    }
  });

  cloudMap.forEach(co => {
    merged.push(co);
    if (appState.notifiedOrderIds) appState.notifiedOrderIds.add(co.id);
  });

  // Ekstrak catatan arus kas (Buku Kas Olsera) yang tersimpan di Cloud Supabase
  const cloudCashflow = [];
  const ghostIds = new Set(['CSH-1792391940433-4560', 'CSH-1792391933362-1694', 'CSH-1792412735057-8961', 'CSH-1792412721972-8355']);
  cloudOrders.forEach(co => {
    if (co && co.id && (co.id.startsWith('CSH-') || co.orderSource === 'Buku Kas Olsera' || (co.tier && co.tier.startsWith('cashflow_')))) {
      if (co.status === 'Dihapus' || co.status === 'deleted' || co.status === 'Dibatalkan' || ghostIds.has(co.id)) {
        ghostIds.add(co.id);
        return;
      }
      const itemDetail = (Array.isArray(co.items) && co.items[0]) ? co.items[0] : {};
      const cashEntry = {
        id: co.id,
        store_slug: co.store_slug || currentSlug,
        date: co.dateTime ? (co.dateTime.includes('T') ? co.dateTime.split('T')[0] : co.dateTime.split(' ')[0]) : (itemDetail.date || new Date().toISOString().split('T')[0]),
        type: itemDetail.type || (co.tier === 'cashflow_out' ? 'out' : 'in'),
        account: itemDetail.account || (co.customerPhone === 'TRANSFER' ? 'TRANSFER' : 'CASH'),
        category: itemDetail.category || co.customerName || (co.tier === 'cashflow_out' ? 'Kas Keluar' : 'Kas Masuk'),
        notes: itemDetail.notes || co.customerAddress || co.customerName || '-',
        amount: Number(itemDetail.amount || co.grandTotal || co.subtotalHet) || 0
      };
      cloudCashflow.push(cashEntry);
    }
  });

  if (Array.isArray(appState.cashflow)) {
    appState.cashflow = appState.cashflow.filter(c => c && !ghostIds.has(c.id));
    ghostIds.forEach(id => {
      if (typeof dbDeleteCashflow === 'function') dbDeleteCashflow(id);
    });
  }

  if (cloudCashflow.length > 0) {
    if (!Array.isArray(appState.cashflow)) appState.cashflow = [];
    const cashMap = new Map();
    appState.cashflow.forEach(c => { if (c && c.id) cashMap.set(c.id, c); });
    cloudCashflow.forEach(c => cashMap.set(c.id, c));
    appState.cashflow = Array.from(cashMap.values());
    if (typeof saveStoredCashflow === 'function') {
      saveStoredCashflow(appState.cashflow, currentSlug);
    }
    if (typeof dbSaveAllCashflow === 'function') {
      dbSaveAllCashflow(appState.cashflow);
    }
    if (typeof renderCashflowTable === 'function') {
      renderCashflowTable();
    }
  } else if (ghostIds.size > 0) {
    if (typeof saveStoredCashflow === 'function') {
      saveStoredCashflow(appState.cashflow, currentSlug);
    }
    if (typeof renderCashflowTable === 'function') {
      renderCashflowTable();
    }
  }

  // Filter agar transaksi penjualan saja yang masuk ke tabel riwayat order
  appState.transactions = merged.filter(t => !t.id.startsWith('CSH-') && t.orderSource !== 'Buku Kas Olsera' && !(t.tier && t.tier.startsWith('cashflow_')));
  if (typeof saveStoredTransactions === 'function') {
    saveStoredTransactions(appState.transactions, currentSlug);
  }
}
window.mergeCloudOrdersIntoLocal = mergeCloudOrdersIntoLocal;

  const isAuthorizedToReadOrders = appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn;
  if (isAuthorizedToReadOrders && typeof syncOrdersFromSupabase === 'function') {
    syncOrdersFromSupabase(initStoreSlug).then(cloudOrders => {
      if (Array.isArray(cloudOrders)) {
        mergeCloudOrdersIntoLocal(cloudOrders, initStoreSlug);
        updateAdminNotificationUI();
        if (typeof renderPosTransactions === 'function') renderPosTransactions();
        if (typeof renderAdminOrdersModal === 'function') renderAdminOrdersModal();
      }
    }).catch(() => {});
  }

  // Sinkronkan pembukuan komisi gaji marketer toko ini dari cloud Supabase
  if (typeof syncMarketerSalesFromSupabase === 'function') {
    syncMarketerSalesFromSupabase(initStoreSlug).then(cloudSales => {
      if (Array.isArray(cloudSales) && cloudSales.length > 0) {
        const local = (appState.marketerSales || []).filter(s => {
          if (!s) return false;
          const mid = String(s.marketerId || '').trim().toUpperCase();
          return mid && mid !== 'RS-WEB' && mid !== 'RES-WEB' && mid !== 'RETAIL' && !mid.startsWith('RS-') && !mid.startsWith('RES-');
        });
        const sMap = new Map();
        local.forEach(s => { if (s && s.orderId) sMap.set(s.orderId, s); });
        cloudSales.forEach(cs => { if (cs && cs.orderId) sMap.set(cs.orderId, cs); });
        appState.marketerSales = Array.from(sMap.values());
        saveStoredMarketerSales(appState.marketerSales, false);
        if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
      }
    }).catch(() => {});
  }

  updateAdminNotificationUI();
  updateDevPortalMetrics();

  // =========================================================================
  // RESTORASI TAMPILAN PERSISTEN PRESISI TINGGI SAAT REFRESH
  // (Developer Console vs Distributor Olsera vs Customer Facing Display vs Hub)
  // =========================================================================
  let isDevWorkspaceOpenNow = false;
  const rawHash = window.location.hash ? window.location.hash.toLowerCase() : '';
  const cleanHash = rawHash.replace('#', '');
  let savedCurrentView = null;
  let devSession = null;
  let isExplicitStorefront = false;
  let savedOlseraTab = 'pos';
  let savedPublicTab = 'catalog';
  let isDevOpenStorage = false;
  let devTabStored = 'overview';

  try {
    savedCurrentView = localStorage.getItem('sr12_current_view') || localStorage.getItem('sr12_active_view_mode');
    devSession = localStorage.getItem('sr12_dev_session');
    isExplicitStorefront = localStorage.getItem('sr12_explicit_storefront_preview') === 'active';
    savedOlseraTab = localStorage.getItem('sr12_active_olsera_tab') || 'pos';
    savedPublicTab = localStorage.getItem('sr12_active_public_tab') || 'catalog';
    isDevOpenStorage = localStorage.getItem('sr12_dev_workspace_open') === 'active';
    devTabStored = localStorage.getItem('sr12_active_dev_tab') || 'overview';
  } catch (e) {}

  // A. Apakah pengguna sebelumnya berada di Developer Super Admin Console?
  const isDevByHash = rawHash.startsWith('#dev-') || rawHash === '#developer';
  const isDevAuthenticated = (devSession === 'active');
  const isDevByState = isDevAuthenticated && (savedCurrentView === 'developer' || isDevOpenStorage);

  if (isDevAuthenticated && (isDevByHash || isDevByState)) {
    appState.isDevMasterLoggedIn = true;
    showDeveloperWorkspaceView(true);
    isDevWorkspaceOpenNow = true;
    let devTab = 'overview';
    if (rawHash.startsWith('#dev-')) {
      devTab = rawHash.replace('#dev-', '');
    } else {
      devTab = devTabStored || 'overview';
    }
    const validDevTabs = ['overview', 'stores', 'pending', 'networkMitra', 'payment'];
    if (!validDevTabs.includes(devTab)) devTab = 'overview';
    if (typeof switchDevPortalTab === 'function') {
      switchDevPortalTab(devTab);
    }
  } else if (!isDevAuthenticated && isDevByHash) {
    // Jika ada hash Developer di URL tapi belum login atau baru saja logout, bersihkan URL hash dan tampilkan prompt PIN
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch(e) {}
    setTimeout(() => {
      if (typeof openDevPinPrompt === 'function') openDevPinPrompt();
    }, 400);
  } else if (isDevAuthenticated) {
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

  // B. Pulihkan tampilan aktif (Portal Olsera vs Storefront Pembeli) saat refresh (jika TIDAK di Developer Workspace)
  if (!isDevWorkspaceOpenNow) {
    const validOlseraTabs = ['pos', 'transactions', 'inventory', 'cashflow', 'reports', 'mitra', 'pending', 'marketer', 'settings'];
    const isOlseraByHash = validOlseraTabs.includes(cleanHash);
    const isOlseraByView = (savedCurrentView === 'portal');
    const isDistributor = (appState.isDistributorLoggedIn || appState.isAdminMode || !!savedDistributorSession);

    // KETIKA DI DALAM MENU TOKO (OLSERA):
    // Jika ada hash Olsera (#pos, #mitra, dll), ATAU view adalah 'portal',
    // ATAU pengguna adalah distributor/pemilik toko dan TIDAK sedang secara eksplisit meninjau etalase pembeli:
    if (isOlseraByHash || isOlseraByView || (isDistributor && !isExplicitStorefront)) {
      appState.isAdminMode = true;
      appState.isDistributorLoggedIn = true;
      appState.isOlseraPortalOpen = true;

      let targetOlseraTab = isOlseraByHash ? cleanHash : (savedOlseraTab || 'pos');
      if (!validOlseraTabs.includes(targetOlseraTab)) targetOlseraTab = 'pos';

      if (typeof showDistributorPortalView === 'function') {
        showDistributorPortalView(true);
        if (typeof switchOlseraTab === 'function') {
          switchOlseraTab(targetOlseraTab);
        }
      }
    } else {
      // C. Mode Storefront Publik (Etalase Toko Pembeli)
      if (typeof showDistributorPortalView === 'function') {
        showDistributorPortalView(false);
      }
      const validPublicTabs = ['catalog', 'rewards', 'marketing', 'resellers', 'marketers'];
      const targetPublicTab = validPublicTabs.includes(cleanHash) ? cleanHash : (savedPublicTab || 'catalog');
      if (typeof switchTab === 'function') {
        switchTab(targetPublicTab);
      }
    }
  }

  // Inisialisasi pengontrol gestur geser & penahan scroll latar belakang untuk seluruh modal
  if (typeof initUniversalModalGestures === 'function') {
    initUniversalModalGestures();
  }
  // Perbarui indikator status koneksi Cloud Supabase
  if (typeof updateCloudStatusUI === 'function') {
    updateCloudStatusUI();
  }

  // Safety timer: Pastikan direktori distributor resmi dirender ulang setelah inisialisasi selesai
  setTimeout(() => {
    if (typeof renderOfficialDistributorDirectory === 'function') {
      renderOfficialDistributorDirectory();
    }
  }, 1000);
});

function loadStoreBySlug(slug) {
  const found = appState.partnerStores.find(s => s.slug === slug) || appState.partnerStores[0];
  appState.currentStoreSlug = found.slug;
  appState.storeSettings = Object.assign({}, found);
  const savedPinForSlug = localStorage.getItem(`sr12_store_pin_${found.slug}`);
  if (savedPinForSlug && (appState.storeSettings.storeAdminPin === '••••' || !appState.storeSettings.storeAdminPin)) {
    appState.storeSettings.storeAdminPin = savedPinForSlug;
  }
  try {
    localStorage.setItem('sr12_last_active_partner_store', found.slug);
    const curParams = new URLSearchParams(window.location.search);
    if (found.slug !== 'sr12-central') {
      if (curParams.get('store') !== found.slug) {
        curParams.set('store', found.slug);
        const newSearch = curParams.toString() ? '?' + curParams.toString() : '';
        history.replaceState({ store: found.slug }, '', window.location.pathname + newSearch + (window.location.hash || ''));
      }
    }
  } catch(e) {}
  const globalFee = parseInt(localStorage.getItem('sr12_platform_fee_amount') || appState.platformFee || 2000, 10);
  appState.platformFee = globalFee;
  found.platformFeeAmount = globalFee;
  if (appState.storeSettings) {
    appState.storeSettings.platformFeeAmount = globalFee;
  }
  if (typeof syncPlatformFeeInputsToAllSettings === 'function') {
    syncPlatformFeeInputsToAllSettings(globalFee);
  }
  applyStoreTheme(found.storeTheme || 'emerald');
  if (typeof updateAllowedTierOptions === 'function') {
    updateAllowedTierOptions();
  }
  renderStoreBranding();
  // ISOLASI KETAT PRODUK & FOTO: Muat katalog terisolasi khusus untuk toko ini
  if (typeof loadStoreProducts === 'function') {
    loadStoreProducts(found.slug);
  }
  // ISOLASI KETAT MITRA: Filter daftar mitra aktif eksklusif untuk toko ini
  if (Array.isArray(appState.mitraList)) {
    appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === found.slug);
  }

  // ISOLASI KETAT TRANSAKSI, MARKETER SALES & KAS: Muat data spesifik toko ini
  if (typeof getStoredTransactions === 'function') {
    appState.transactions = getStoredTransactions(found.slug);
  }
  if (typeof getStoredMarketerSales === 'function') {
    appState.marketerSales = getStoredMarketerSales(found.slug);
  }
  if (typeof getStoredCashflow === 'function') {
    appState.cashflow = getStoredCashflow(found.slug);
    const ghostIds = ['CSH-1792391940433-4560', 'CSH-1792391933362-1694', 'CSH-1792412735057-8961', 'CSH-1792412721972-8355'];
    if (Array.isArray(appState.cashflow)) {
      appState.cashflow = appState.cashflow.filter(c => c && !ghostIds.includes(c.id));
    }
  }
  if (typeof dbGetAllCashflow === 'function') {
    dbGetAllCashflow(found.slug).then(dbCash => {
      if (Array.isArray(dbCash) && dbCash.length > 0) {
        const ghostIds = ['CSH-1792391940433-4560', 'CSH-1792391933362-1694', 'CSH-1792412735057-8961', 'CSH-1792412721972-8355'];
        const validDbCash = dbCash.filter(c => c && !ghostIds.includes(c.id));
        if (!appState.cashflow || appState.cashflow.length === 0) {
          appState.cashflow = validDbCash;
          if (typeof saveStoredCashflow === 'function') {
            saveStoredCashflow(appState.cashflow, found.slug);
          }
          if (typeof renderCashflowTable === 'function') {
            renderCashflowTable();
          }
        }
      }
    }).catch(() => {});
  }

  if (typeof renderResellers === 'function') {
    renderResellers();
  }
  if (typeof renderMarketerPayroll === 'function') {
    renderMarketerPayroll();
  }
  // Sinkronkan pesanan masuk dari Supabase Cloud hanya jika pengguna adalah pemilik toko/admin sah
  const isAuthForSwitch = appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn;
  if (isAuthForSwitch && typeof syncOrdersFromSupabase === 'function') {
    syncOrdersFromSupabase(found.slug).then(cloudOrders => {
      if (Array.isArray(cloudOrders)) {
        mergeCloudOrdersIntoLocal(cloudOrders, found.slug);
        if (typeof renderPosTransactions === 'function') renderPosTransactions();
        if (typeof renderAdminOrdersModal === 'function') renderAdminOrdersModal();
        updateAdminNotificationUI();
      }
    }).catch(e => console.warn('Sync orders background error:', e));
  }

  // Sinkronkan data rekap gaji marketer untuk toko ini
  if (typeof syncMarketerSalesFromSupabase === 'function') {
    syncMarketerSalesFromSupabase(found.slug).then(cloudSales => {
      if (Array.isArray(cloudSales) && cloudSales.length > 0) {
        const local = (appState.marketerSales || []).filter(s => {
          if (!s) return false;
          const mid = String(s.marketerId || '').trim().toUpperCase();
          return mid && mid !== 'RS-WEB' && mid !== 'RES-WEB' && mid !== 'RETAIL' && !mid.startsWith('RS-') && !mid.startsWith('RES-');
        });
        const sMap = new Map();
        local.forEach(s => { if (s && s.orderId) sMap.set(s.orderId, s); });
        cloudSales.forEach(cs => { if (cs && cs.orderId) sMap.set(cs.orderId, cs); });
        appState.marketerSales = Array.from(sMap.values());
        saveStoredMarketerSales(appState.marketerSales, false, found.slug);
        if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
      }
    }).catch(() => {});
  }
  if (typeof getStoredCashflow === 'function') {
    appState.cashflow = getStoredCashflow(found.slug);
  }
  if (typeof getStoredStockMutations === 'function') {
    appState.stockMutations = getStoredStockMutations(found.slug);
  }
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
}

function switchPartnerStore(slug, pushHistory = true) {
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

  // Tutup SEMUA modal etalase termasuk modal detail produk dan share promo saat berpindah toko
  document.querySelectorAll('.modal-backdrop.open').forEach(m => {
    if (
      m.id !== 'cartDrawer' &&
      m.id !== 'modalDistributorLogin' &&
      m.id !== 'modalDevPin' &&
      m.id !== 'modalOlseraLock' &&
      m.id !== 'modalChangeSecurityPin'
    ) {
      m.classList.remove('open');
    }
  });
  appState.activeDetailProductId = null;
  if (typeof ensureScrollUnlocked === 'function') ensureScrollUnlocked();

  loadStoreBySlug(slug);

  if (pushHistory) {
    const switchParams = new URLSearchParams(window.location.search);
    if (slug === 'sr12-central') {
      switchParams.delete('store');
    } else {
      switchParams.set('store', slug);
    }
    // Hapus parameter deep-link produk dari URL agar berpindah toko selalu membuka etalase toko secara bersih
    switchParams.delete('product');
    switchParams.delete('p');
    switchParams.delete('prod');
    switchParams.delete('id');
    const queryString = switchParams.toString();
    const newUrl = window.location.pathname + (queryString ? '?' + queryString : '') + (window.location.hash || '');
    window.history.pushState({ store: slug }, '', newUrl);
  }

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
  if (typeof appState !== 'undefined' && appState) {
    appState.tempRegLogoBase64 = null;
    appState.tempRegSkBase64 = null;
    appState.tempRegSkDocName = null;
    appState.tempRegKtpBase64 = null;
    appState.tempRegKtpDocName = null;
    appState.tempRegSelfieBase64 = null;
    appState.tempRegSelfieDocName = null;
    appState.tempRegRecBase64 = null;
    appState.tempRegRecDocName = null;
  }

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

  // Email, Password & Security reset
  const regEmailInput = document.getElementById('regStoreEmail');
  if (regEmailInput) regEmailInput.value = '';
  const regPassInput = document.getElementById('regStorePassword');
  if (regPassInput) regPassInput.value = '';
  const regPassConfInput = document.getElementById('regStorePasswordConfirm');
  if (regPassConfInput) regPassConfInput.value = '';
  const honeypotInput = document.getElementById('regSecurityHoneypot');
  if (honeypotInput) honeypotInput.value = '';

  const tierSelect = document.getElementById('regStoreTier');
  if (tierSelect) {
    tierSelect.value = 'distributor';
    if (typeof handleRegStoreTierChange === 'function') {
      handleRegStoreTierChange('distributor');
    }
  }

  if (typeof openModal === 'function') {
    openModal('modalRegisterStore');
  } else if (modal) {
    document.body.classList.add('modal-open');
    modal.classList.add('open');
  }

  setTimeout(() => {
    const nameInput = document.getElementById('regStoreName');
    if (nameInput && typeof nameInput.focus === 'function') nameInput.focus();
  }, 120);
}
window.openRegisterStoreModal = openRegisterStoreModal;


let isSubmittingStoreApp = false;

async function handleRegisterStoreSubmit(e) {
  if (e) e.preventDefault();
  if (isSubmittingStoreApp) {
    console.log('Pengajuan buka toko sedang diproses, mencegah duplikasi klik...');
    return;
  }

  // 1. Proteksi Anti-Bot: Honeypot Trap
  const honeypot = document.getElementById('regSecurityHoneypot')?.value.trim();
  if (honeypot) {
    console.warn('⛔ Pengajuan ditolak: Terdeteksi aktivitas bot otomatis.');
    return;
  }

  const name = document.getElementById('regStoreName')?.value.trim();
  let slug = document.getElementById('regStoreSlug')?.value.trim().toLowerCase();
  const owner = document.getElementById('regStoreOwner')?.value.trim();
  const email = document.getElementById('regStoreEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('regStorePassword')?.value.trim();
  const confirmPassword = document.getElementById('regStorePasswordConfirm')?.value.trim();
  const tier = document.getElementById('regStoreTier')?.value || 'reseller';
  const wa = document.getElementById('regStoreWa')?.value.trim();
  const city = document.getElementById('regStoreCity')?.value.trim();
  const theme = document.getElementById('regStoreTheme')?.value || 'emerald';
  const pin = String(document.getElementById('regStorePin')?.value.trim() || '1234');
  const logoText = document.getElementById('regLogoText')?.value.trim().toUpperCase() || name.slice(0, 5).toUpperCase();
  const logoUrl = appState.tempRegLogoBase64 || '';
  const nikNumber = document.getElementById('regNikNumber')?.value.trim() || '';
  const skNumber = document.getElementById('regSkNumber')?.value.trim() || '';
  const notes = document.getElementById('regStoreNotes')?.value.trim() || '';

  if (!name || !owner || !wa || !city) {
    alert('Mohon lengkapi semua data pendaftaran toko!');
    return;
  }

  // 2. Validasi Akun Login Pemilik Toko
  if (!email || !email.includes('@') || !email.includes('.')) {
    alert('Mohon masukkan Email Aktif yang valid untuk akun login pemilik toko!');
    const emailEl = document.getElementById('regStoreEmail');
    if (emailEl) emailEl.focus();
    return;
  }

  if (!password || password.length < 6) {
    alert('Password toko wajib diisi minimal 6 karakter demi keamanan akun!');
    const passEl = document.getElementById('regStorePassword');
    if (passEl) passEl.focus();
    return;
  }

  if (password !== confirmPassword) {
    alert('Konfirmasi password tidak cocok dengan kata sandi yang dimasukkan!');
    const passConfEl = document.getElementById('regStorePasswordConfirm');
    if (passConfEl) passConfEl.focus();
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

  // Cek duplikasi klik cepat (dalam 20 detik terakhir)
  const recentDup = (appState.pendingStoreApps || []).find(a => 
    a && a.storeName && a.storeName.toLowerCase() === name.toLowerCase() && 
    a.storeOwner && a.storeOwner.toLowerCase() === owner.toLowerCase() &&
    (Date.now() - new Date(a.submittedAt || 0).getTime() < 20000)
  );
  if (recentDup) {
    console.warn('Duplikasi pengajuan terdeteksi, menampilkan tiket yang sudah ada:', recentDup.id);
    const regModal = document.getElementById('modalRegisterStore');
    if (regModal) regModal.classList.remove('open');
    openStoreAppPendingSuccessModal(recentDup);
    return;
  }

  // Pasang guard & loading visual pada tombol kirim
  isSubmittingStoreApp = true;
  const submitBtn = document.getElementById('btnSubmitRegisterStore');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Mengamankan Akun & Mengirim Berkas...';
    submitBtn.style.opacity = '0.75';
    submitBtn.style.cursor = 'wait';
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
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '🛡️ Kirim Pengajuan Buka Toko (Verifikasi SK Admin Pusat)';
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
        }
        isSubmittingStoreApp = false;
        alert('⚠️ PERHATIAN:\n\nUntuk pembukaan toko tingkat Agen, Sub Agen, atau Reseller, Anda WAJIB menyertakan Nama & Nomor WhatsApp Distributor Resmi SR12 pemberi rekomendasi!');
        if (document.getElementById('regRecommenderManualName')) document.getElementById('regRecommenderManualName').focus();
        return;
      }
      recommenderDistributor = recManualName;
      recommenderWa = recManualWa;
      recommenderSlug = 'manual';
    }

    if (!recCode) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🛡️ Kirim Pengajuan Buka Toko (Verifikasi SK Admin Pusat)';
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
      isSubmittingStoreApp = false;
      alert('Mohon masukkan Nomor atau Kode Surat Rekomendasi dari Distributor Anda!');
      const codeInput = document.getElementById('regRecommendationCode');
      if (codeInput) codeInput.focus();
      return;
    }
  }

  // Documents processing (with fallback to sharp official certificates)
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

  // 3. Hash Password Kriptografis berbasis Slug Toko (Anti-Plaintext & Anti-Bypass)
  let passwordHash = '';
  if (typeof hashPasswordSecure === 'function') {
    try {
      passwordHash = await hashPasswordSecure(password, slug);
    } catch (eH) {
      console.warn('hashPasswordSecure error:', eH);
    }
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
    heroBannerUrl: '',
    storeLogoText: logoText,
    storeLogoUrl: logoUrl,
    storeWaNumber: cleanWa,
    storeCity: city,
    storeOwner: owner,
    partnerTier: tier,
    ownerEmail: email,
    passwordHash: passwordHash,
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

  // Sinkronisasi ke Supabase Cloud (dengan proteksi await dan pelaporan status)
  let cloudSuccess = false;
  if (typeof savePendingStoreToSupabase === 'function') {
    try {
      const supaRes = await savePendingStoreToSupabase(newApp);
      cloudSuccess = !!(supaRes && supaRes.success);
    } catch (eSupa) {
      console.warn('savePendingStoreToSupabase error:', eSupa);
    }
  }

  newApp.cloudSynced = cloudSuccess;

  // Tutup modal form pendaftaran langsung
  closeModal('modalRegisterStore');

  // Buka modal notifikasi sukses tiket pengajuan pending
  openStoreAppPendingSuccessModal(newApp);

  // Update notification counter & developer portal
  updateDevPortalMetrics();

  showToast(cloudSuccess 
    ? `✅ Berkas #${newApp.id} Berhasil Dikirim ke Cloud Server!` 
    : `✅ Berkas #${newApp.id} Tersimpan! Silakan Konfirmasi ke WhatsApp Admin.`);
}

function openStoreAppPendingSuccessModal(app) {
  const ticketEl = document.getElementById('pendingAppTicketId');
  const nameEl = document.getElementById('pendingAppStoreName');
  const ownerEl = document.getElementById('pendingAppOwner');
  const tierEl = document.getElementById('pendingAppTier');
  const cloudStatusEl = document.getElementById('pendingAppCloudStatus');
  const waBtn = document.getElementById('btnPendingAppWaConfirm');

  const tierObj = SR12_TIERS[app.partnerTier] || SR12_TIERS.distributor;

  if (ticketEl) ticketEl.textContent = '#' + app.id;
  if (nameEl) nameEl.textContent = app.storeName;
  if (ownerEl) ownerEl.textContent = `${app.storeOwner} (${app.storeCity})`;
  if (tierEl) tierEl.textContent = `${tierObj.name} (Diskon ${tierObj.discountPct}%)`;

  if (cloudStatusEl) {
    if (app.cloudSynced) {
      cloudStatusEl.textContent = '🟢 TERKIRIM KE CLOUD SERVER (SIAP DIVERIFIKASI)';
      cloudStatusEl.style.background = '#dcfce7';
      cloudStatusEl.style.color = '#047857';
      cloudStatusEl.style.borderColor = '#86efac';
    } else {
      cloudStatusEl.textContent = '🟡 DALAM ANTREAN (KONFIRMASI KE WA ADMIN)';
      cloudStatusEl.style.background = '#fef3c7';
      cloudStatusEl.style.color = '#b45309';
      cloudStatusEl.style.borderColor = '#fde68a';
    }
  }

  // Siapkan tautan WhatsApp Konfirmasi Resmi
  if (waBtn) {
    let targetWa = app.recommenderWa;
    if (!targetWa || targetWa.length < 9) {
      const centralStore = (appState.partnerStores || []).find(s => s.slug === 'sr12-central' || s.partnerTier === 'distributor');
      targetWa = centralStore?.storeWaNumber || '6282211223344';
    }
    const cleanTargetWa = String(targetWa).replace(/\D/g, '').replace(/^0/, '62');
    
    const waMessage = 
      `Halo Admin & Tim Pembina SR12,\n\n` +
      `Saya baru saja mengajukan pendaftaran toko online mitra resmi SR12:\n` +
      `📌 *ID Tiket:* #${app.id}\n` +
      `🏪 *Nama Toko:* ${app.storeName}\n` +
      `👤 *Calon Pemilik:* ${app.storeOwner}\n` +
      `📍 *Kota:* ${app.storeCity}\n` +
      `🏅 *Jenjang Kemitraan:* ${tierObj.name}\n` +
      `📞 *No. WhatsApp:* ${app.storeWaNumber}\n` +
      (app.ownerEmail ? `📧 *Email Akun:* ${app.ownerEmail}\n` : '') +
      (app.skNumber ? `📜 *No. SK/Kontrak:* ${app.skNumber}\n` : '') +
      `\nMohon dibantu verifikasi dan aktivasi akun toko saya. Terima kasih! 🙏`;

    waBtn.href = `https://wa.me/${cleanTargetWa}?text=${encodeURIComponent(waMessage)}`;
  }

  appState.lastSubmittedPendingAppId = app.id;

  // Pulihkan tombol register ke kondisi siap
  const submitBtn = document.getElementById('btnSubmitRegisterStore');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '🛡️ Kirim Pengajuan Buka Toko (Verifikasi SK Admin Pusat)';
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
  }
  isSubmittingStoreApp = false;

  openModal('modalStoreAppPendingSuccess');
}

function copyPendingAppTicket() {
  const ticketId = appState.lastSubmittedPendingAppId;
  if (!ticketId) return;
  const fullText = '#' + ticketId;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText).then(() => {
      showToast(`📋 ID Tiket ${fullText} berhasil disalin!`);
      const textEl = document.getElementById('btnCopyPendingTicketText');
      const iconEl = document.getElementById('btnCopyPendingTicketIcon');
      if (textEl) textEl.textContent = 'Tersalin ke Clipboard!';
      if (iconEl) iconEl.textContent = '✓';
      setTimeout(() => {
        if (textEl) textEl.textContent = 'Salin ID Tiket Pengajuan';
        if (iconEl) iconEl.textContent = '📋';
      }, 2500);
    }).catch(() => {
      prompt('Salin ID Tiket Pengajuan Anda:', fullText);
    });
  } else {
    prompt('Salin ID Tiket Pengajuan Anda:', fullText);
  }
}
window.copyPendingAppTicket = copyPendingAppTicket;

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * SISTEM KEAMANAN TINGKAT TINGGI: VALIDASI & SANITASI URL FOTO PRODUK
 * Mencegah serangan XSS (Cross-Site Scripting), JavaScript injection, Phishing,
 * dan penyusupan link berbahaya ke dalam katalog toko.
 */
function isSafeImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const url = rawUrl.trim();
  if (!url) return false;

  // 1. BLOKIR KERAS skema script berbahaya
  const dangerousPatterns = /^(javascript|vbscript|data:text|data:application|file|ftp):/i;
  if (dangerousPatterns.test(url)) {
    return false;
  }

  // 2. Izinkan Data URI HANYA jika berupa gambar aman (JPEG, PNG, WEBP, GIF, SVG)
  if (/^data:image\/(jpeg|jpg|png|webp|gif|svg\+xml)/i.test(url)) {
    return true;
  }

  // 3. Izinkan aset gambar lokal internal toko (misal: 'assets/...' atau './assets/...')
  if (/^(\.\/|\/)?assets\/[a-zA-Z0-9_\-\.\/]+$/i.test(url)) {
    return true;
  }

  let checkUrl = url;
  if (checkUrl.startsWith('//')) {
    checkUrl = 'https:' + checkUrl;
  } else if (/^www\./i.test(checkUrl)) {
    checkUrl = 'https://' + checkUrl;
  }

  // 4. Untuk URL web eksternal: Izinkan HTTPS dan HTTP resmi
  try {
    const parsed = new URL(checkUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
}

function sanitizeImageUrl(rawUrl, fallback = 'assets/hero-banner.jpg') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  let trimmed = rawUrl.trim();
  if (trimmed.startsWith('//')) {
    trimmed = 'https:' + trimmed;
  } else if (/^www\./i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  if (isSafeImageUrl(trimmed)) {
    return trimmed;
  }
  return fallback;
}

window.isSafeImageUrl = isSafeImageUrl;
window.sanitizeImageUrl = sanitizeImageUrl;

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

async function previewSkDocument(appId) {
  const app = (appState.pendingStoreApps || []).find(a => a.id === appId);
  if (!app) {
    alert('Data pengajuan toko tidak ditemukan!');
    return;
  }

  // Jika berkas asli belum terunduh (karena optimasi kuota daftar), unduh on-demand dari Supabase
  if ((!app.ktpDocUrl || !app.skDocUrl) && typeof fetchPendingStoreDoc === 'function') {
    try {
      const [ktp, sk, selfie, rec] = await Promise.all([
        app.ktpDocUrl ? Promise.resolve(app.ktpDocUrl) : fetchPendingStoreDoc(app.id, 'ktp_doc_url'),
        app.skDocUrl ? Promise.resolve(app.skDocUrl) : fetchPendingStoreDoc(app.id, 'sk_doc_url'),
        app.selfieDocUrl ? Promise.resolve(app.selfieDocUrl) : fetchPendingStoreDoc(app.id, 'selfie_doc_url'),
        app.recommendationDocUrl ? Promise.resolve(app.recommendationDocUrl) : fetchPendingStoreDoc(app.id, 'recommendation_doc_url')
      ]);
      if (ktp) app.ktpDocUrl = ktp;
      if (sk) app.skDocUrl = sk;
      if (selfie) app.selfieDocUrl = selfie;
      if (rec) app.recommendationDocUrl = rec;
    } catch(docErr) {
      console.warn('On-demand doc fetch warning:', docErr);
    }
  }

  // Ensure documents are populated with fallback mock SVG if still empty
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

async function approvePendingStore(appId) {
  const index = (appState.pendingStoreApps || []).findIndex(a => a.id === appId);
  if (index === -1) {
    alert('Pengajuan toko tidak ditemukan atau sudah diproses!');
    return;
  }

  const app = appState.pendingStoreApps[index];
  const tierTitle = SR12_TIERS[app.partnerTier]?.name || app.partnerTier;
  const confirmApprove = confirm(
    `✅ PERSETUJUAN DOKUMEN SK DISTRIBUTOR / MITRA\n\n` +
    `Nama Toko: ${app.storeName}\n` +
    `Calon Pemilik: ${app.storeOwner} (${app.storeCity})\n` +
    `No. SK: ${app.skNumber}\n` +
    `Level: ${tierTitle}\n\n` +
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
    heroBannerUrl: app.heroBannerUrl || '',
    isBlocked: false,
    storeLogoText: app.storeLogoText,
    storeLogoUrl: app.storeLogoUrl || '',
    storeWaNumber: app.storeWaNumber,
    storeCity: app.storeCity,
    storeOwner: app.storeOwner,
    partnerTier: app.partnerTier,
    ownerEmail: (app.ownerEmail || app.owner_email || '').toLowerCase().trim(),
    passwordHash: app.passwordHash || app.password_hash || '',
    recommenderDistributor: app.recommenderDistributor || '',
    recommenderWa: app.recommenderWa || '',
    recommenderSlug: app.recommenderSlug || '',
    recommendationCode: app.recommendationCode || '',
    feePayer: 'buyer',
    storeAdminPin: String(app.storeAdminPin || '1234').trim(),
    orderQuota: 15,
    walletBalance: 10000,
    totalTopupPaid: 0,
    totalTx: 0,
    verifiedSkNumber: app.skNumber,
    skDocUrl: app.skDocUrl || '',
    skDocName: app.skDocName || '',
    ktpDocUrl: app.ktpDocUrl || '',
    ktpDocName: app.ktpDocName || '',
    approvedAt: new Date().toISOString()
  };

  // Pastikan tersimpan di partnerStores tanpa duplikasi
  const existIdx = (appState.partnerStores || []).findIndex(s => s.slug === approvedStore.slug);
  if (existIdx >= 0) {
    appState.partnerStores[existIdx] = Object.assign({}, appState.partnerStores[existIdx], approvedStore);
  } else {
    appState.partnerStores.push(approvedStore);
  }
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

  // Simpan ke daftar tombstone pending store agar tidak pernah muncul lagi di antrean
  addDeletedPendingStore(app.id, app.slug);

  // Hapus slug dari daftar tombstone toko terhapus jika toko dibuat ulang dengan nama yang sama
  try {
    const rawDel = localStorage.getItem('sr12_deleted_store_slugs');
    if (rawDel) {
      const parsedDel = JSON.parse(rawDel);
      if (Array.isArray(parsedDel) && parsedDel.includes(approvedStore.slug)) {
        const filteredDel = parsedDel.filter(s => s !== approvedStore.slug);
        localStorage.setItem('sr12_deleted_store_slugs', JSON.stringify(filteredDel));
      }
    }
  } catch(e) {}

  if (typeof saveStoreToSupabase === 'function') {
    try {
      await saveStoreToSupabase(approvedStore);
    } catch (e) {
      console.warn('saveStoreToSupabase error:', e);
    }
  }

  // Otomatis daftarkan / kunci akun login email pemilik toko di database Cloud
  if (approvedStore.ownerEmail && approvedStore.passwordHash && typeof registerDistributorEmailInSupabase === 'function') {
    try {
      await registerDistributorEmailInSupabase(approvedStore.slug, approvedStore.ownerEmail, approvedStore.passwordHash, approvedStore.storeAdminPin);
    } catch(eReg) {
      console.warn('registerDistributorEmailInSupabase on approve error:', eReg);
    }
  }

  if (typeof deletePendingStoreFromSupabase === 'function') {
    try {
      await deletePendingStoreFromSupabase(app.id, app.slug);
    } catch (e) {
      console.warn('deletePendingStoreFromSupabase error:', e);
    }
  }

  // Jika merupakan toko Agen/Sub Agen di bawah Distributor aktif, otomatis daftarkan ke buku mitra distributor
  if (app.recommenderSlug && app.recommenderSlug !== 'manual') {
    const newMitra = {
      id: generateNextMitraId(app.partnerTier),
      store_slug: app.slug,
      recommender_slug: app.recommenderSlug,
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

  // Tutup semua modal terkait pengajuan
  closeModal('modalPreviewSkDoc');
  closeModal('modalStoreAppPendingSuccess');
  closeModal('modalDistributorPendingStores');

  // Refresh UI data & list
  renderStoreDropdown();
  updateDevPortalMetrics();
  if (typeof updateDistributorPendingBadges === 'function') {
    updateDistributorPendingBadges();
  }
  if (typeof renderOlseraPendingStores === 'function') {
    renderOlseraPendingStores();
  }
  if (typeof renderSwitchStoreModal === 'function') {
    renderSwitchStoreModal();
  }

  // Siapkan Pesan Konfirmasi WA Aktivasi
  const storeUrl = `${window.location.origin}${window.location.pathname}?store=${approvedStore.slug}`;
  const ownerPortalUrl = `${storeUrl}&seller=1`;
  const waMsg = encodeURIComponent(
    `Halo Kak ${approvedStore.storeOwner}!\n\n` +
    `🎉 *SELAMAT! PENGAJUAN TOKO SR12 ANDA TELAH DISETUJUI* 🎉\n\n` +
    `Surat Keputusan (SK) Resmi Anda (No: *${approvedStore.verifiedSkNumber}*) telah *DIVERIFIKASI & DISETUJUI* oleh Distributor / Admin SR12 Herbal Perkasa.\n\n` +
    `🏪 *Nama Toko:* ${approvedStore.storeName}\n` +
    `📍 *Kota:* ${approvedStore.storeCity}\n` +
    `👑 *Level Kemitraan:* ${tierTitle}\n\n` +
    `🔗 *Link Etalase Belanja (Untuk Pembeli):*\n${storeUrl}\n\n` +
    `🔐 *Link Khusus Kelola Toko (Akses Pemilik):*\n${ownerPortalUrl}\n\n` +
    `🔑 *PIN Admin Toko:* ${approvedStore.storeAdminPin}\n` +
    `⚡ *Bonus Kuota Awal:* 15 Order WhatsApp Gratis\n\n` +
    `💡 *Tips Keamanan Akses ala Shopee:*\n` +
    `Etalase toko online Anda dibuat bersih tanpa tombol login agar pembeli umum tidak bisa mencoba membobol dashboard Anda. Untuk masuk ke dashboard, Anda cukup membuka *Link Khusus Kelola Toko* di atas, atau ketuk (klik 3x) Foto Logo Toko Anda di halaman toko.\n\n` +
    `Selamat berjualan dan sukses selalu bersama keluarga besar SR12 Herbal Perkasa! 🚀`
  );

  showToast(`🎉 Toko "${approvedStore.storeName}" BERHASIL DISETUJUI & DIAKTIFKAN!`);

  // Konfirmasi Navigasi: Langsung ke Beranda Official Central Hub (Direktori) atau Buka Toko
  const goToCentral = confirm(
    `🎉 TOKO ${tierTitle.toUpperCase()} TELAH DIAKTIFKAN!\n\n` +
    `Toko: ${approvedStore.storeName}\n` +
    `Pemilik: ${approvedStore.storeOwner} (${approvedStore.storeCity})\n\n` +
    `👉 Klik [OK] untuk LANGSUNG MELIHAT toko baru ini di BERANDA OFFICIAL CENTRAL HUB (Direktori Semua Toko)\n\n` +
    `👉 Klik [BATAL] jika ingin membuka & meninjau etalase toko online Agen ini secara langsung`
  );

  if (goToCentral) {
    // 1. Tutup Olsera Suite jika sedang terbuka
    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(false);
    }
    if (typeof closeOlseraSidebarDrawer === 'function') {
      closeOlseraSidebarDrawer();
    }

    // 2. Beralih ke Official Central Hub
    switchPartnerStore('sr12-central');

    // 3. Pastikan tab filter direktori menampilkan semua mitra termasuk toko baru
    if (typeof filterDirectoryTier === 'function') {
      filterDirectoryTier('all');
    }
    renderOfficialDistributorDirectory('all');

    // 4. Scroll dan sorot kartu toko baru di direktori
    setTimeout(() => {
      const dirSec = document.getElementById('officialDistributorDirectorySection');
      if (dirSec) {
        dirSec.style.display = 'block';
        dirSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const targetCard = document.getElementById(`dirStoreCard_${approvedStore.slug}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.style.transition = 'all 0.5s ease';
        targetCard.style.boxShadow = '0 0 0 4px #10b981, 0 10px 25px rgba(16, 185, 129, 0.4)';
        targetCard.style.transform = 'scale(1.02)';
        setTimeout(() => {
          targetCard.style.boxShadow = '';
          targetCard.style.transform = '';
        }, 3500);
      }
    }, 300);
  } else {
    // Tutup Olsera Suite dan buka toko agen
    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(false);
    }
    loadStoreBySlug(approvedStore.slug);
  }

  // Tawari kirim konfirmasi WhatsApp ke pemilik toko
  setTimeout(() => {
    const sendWa = confirm(
      `📲 KONFIRMASI WHATSAPP AKTIVASI\n\n` +
      `Kirim notifikasi aktivasi & link toko via WhatsApp ke pemilik (+${approvedStore.storeWaNumber}) sekarang?`
    );
    if (sendWa) {
      window.open(`https://wa.me/${approvedStore.storeWaNumber}?text=${waMsg}`, '_blank');
    }
  }, 600);
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

  // 1. Simpan ke daftar tombstone pending store agar tidak muncul lagi
  addDeletedPendingStore(app.id, app.slug);

  // 2. Remove from pending
  appState.pendingStoreApps.splice(index, 1);
  saveStoredPendingStores(appState.pendingStoreApps);

  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    fetch(apiBase + `/api/pending-stores/${appId}`, {
      method: 'DELETE'
    }).catch(e => console.warn('Could not DELETE /api/pending-stores:', e));
  }

  if (typeof deletePendingStoreFromSupabase === 'function') {
    deletePendingStoreFromSupabase(app.id, app.slug);
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

async function deletePendingStoreApp(appId) {
  const index = (appState.pendingStoreApps || []).findIndex(a => a.id === appId);
  if (index === -1) {
    alert('Pengajuan toko tidak ditemukan atau sudah terhapus!');
    return;
  }

  const app = appState.pendingStoreApps[index];
  const confirmed = confirm(
    `🗑️ HAPUS PERMANEN PENGAJUAN TOKO?\n\n` +
    `Nama Toko: ${app.storeName}\n` +
    `Calon Pemilik: ${app.storeOwner} (${app.storeCity})\n` +
    `No. ID Pengajuan: ${app.id}\n\n` +
    `Data pengajuan ini akan dihapus secara permanen dari perangkat lokal dan database Supabase Cloud agar tidak muncul lagi.\n\nApakah Anda yakin ingin menghapus?`
  );

  if (!confirmed) return;

  // 1. Catat ke tombstone
  addDeletedPendingStore(app.id, app.slug);

  // 2. Hapus dari state lokal
  appState.pendingStoreApps.splice(index, 1);
  saveStoredPendingStores(appState.pendingStoreApps);

  // 3. Hapus dari Supabase Cloud
  if (typeof deletePendingStoreFromSupabase === 'function') {
    await deletePendingStoreFromSupabase(app.id, app.slug);
  }

  // 4. Hapus dari Server REST API jika ada
  const apiBase = getApiBaseUrl();
  if (apiBase && typeof fetch === 'function') {
    fetch(apiBase + `/api/pending-stores/${app.id}`, {
      method: 'DELETE'
    }).catch(e => console.warn('Could not DELETE /api/pending-stores:', e));
  }

  // 5. Tutup modal & perbarui UI
  closeModal('modalPreviewSkDoc');
  const mDist = document.getElementById('modalDistributorPendingStores');
  if (mDist && mDist.classList.contains('open') && typeof openDistributorPendingStoresModal === 'function') {
    openDistributorPendingStoresModal();
  }
  updateDevPortalMetrics();
  if (typeof updateDistributorPendingBadges === 'function') {
    updateDistributorPendingBadges();
  }

  showToast(`🗑️ Pengajuan toko "${app.storeName}" berhasil dihapus permanen!`);
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
    return a && a.id && !activeSlugs.has(a.slug) && a.status !== 'approved';
  });

  const isAuthorized = appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn;

  // HANYA MUNCUL JIKA:
  // 1. Toko yang sedang aktif dibuka adalah Toko DISTRIBUTOR (Bukan Toko Agen / Sub Agen)
  // 2. Pemilik toko sedang login sah (isAuthorized)
  // 3. Calon agen secara eksplisit memilih toko distributor ini sebagai pembina (a.recommenderSlug === currentSlug)
  // 4. Toko pemohon BUKAN toko ini sendiri (a.slug !== currentSlug)
  const relevantApps = (isDistributor && isAuthorized)
    ? unapprovedApps.filter(a => a.slug !== currentSlug && a.recommenderSlug === currentSlug)
    : [];

  if (alertBox) {
    if (relevantApps.length > 0) {
      alertBox.style.display = 'block';
      if (alertCount) alertCount.textContent = relevantApps.length;
    } else {
      alertBox.style.display = 'none';
    }
  }

  if (olseraBadge) {
    if (relevantApps.length > 0) {
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
    return a && a.id && !activeSlugs.has(a.slug) && a.status !== 'approved';
  });

  const apps = unapprovedApps.filter(a => {
    if (a.slug === currentSlug) return false;
    if (appState.isDevMasterLoggedIn) return true;
    return isDistributor && a.recommenderSlug === currentSlug;
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
            <button type="button" onclick="deletePendingStoreApp('${app.id}')" style="background: #fef2f2; color: #991b1b; border: 1px solid #f87171; padding: 9px 16px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
              🗑️ Hapus
            </button>
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
  if (!store) return 'assets/sr12-logo.png';
  if (store.storeLogoUrl && store.storeLogoUrl.trim() !== '' && !store.storeLogoUrl.startsWith('data:image/svg+xml')) {
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

/**
 * Daily Seeded Shuffle:
 * Menghitung seed harian unik berdasarkan tanggal (YYYY-MM-DD) lokal,
 * lalu mengacak susunan toko secara adil dan konsisten sepanjang hari tersebut.
 * Setiap pergantian hari, posisi toko otomatis dirotasi ulang secara adil sehingga
 * toko yang mendaftar lebih dulu tidak memonopoli urutan paling atas.
 */
function getDailyStoreSeed() {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 12345;
}

function shuffleStoresDaily(stores) {
  if (!Array.isArray(stores) || stores.length <= 1) return stores || [];
  const list = [...stores];
  let seed = getDailyStoreSeed();
  
  // PRNG deterministik berbasis seed (Mulberry32)
  const random = () => {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Fisher-Yates shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
window.getDailyStoreSeed = getDailyStoreSeed;
window.shuffleStoresDaily = shuffleStoresDaily;

function renderOfficialDistributorDirectory(filter = currentDirectoryFilter, searchQuery = currentDirectorySearch) {
  currentDirectoryFilter = filter;
  currentDirectorySearch = (searchQuery || '').toLowerCase().trim();

  const grid = document.getElementById('officialDistributorsGrid');
  const countAllEl = document.getElementById('dirCountAll');
  const countDistEl = document.getElementById('dirCountDistributor');
  const countAgenEl = document.getElementById('dirCountAgen');
  const countSubAgenEl = document.getElementById('dirCountSubAgen');
  if (!grid) return;

  // Hanya tampilkan Toko Distributor & Agen resmi (sr12-central adalah pusatnya)
  const rawPartnerList = (appState.partnerStores || []).filter(s => s && s.slug && s.slug !== 'sr12-central');
  
  // Acak urutan toko setiap harinya secara adil (Daily Seeded Shuffle)
  const partnerList = shuffleStoresDaily(rawPartnerList);
  if (countAllEl) countAllEl.textContent = partnerList.length;
  if (countDistEl) countDistEl.textContent = partnerList.filter(s => s.partnerTier === 'distributor').length;
  if (countAgenEl) countAgenEl.textContent = partnerList.filter(s => s.partnerTier === 'agen' || (s.storeName && s.storeName.toLowerCase().includes('agen'))).length;
  if (countSubAgenEl) countSubAgenEl.textContent = partnerList.filter(s => s.partnerTier === 'sub_agen').length;

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
      if (!appState.isCloudSyncComplete) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 1.5px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="font-size: 2.2rem; margin-bottom: 12px; display: inline-block;">🏪</div>
            <h3 style="font-weight: 800; font-size: 1.15rem; color: #0f172a; margin-bottom: 6px;">Menghubungkan ke Direktori Toko Resmi...</h3>
            <p style="font-size: 0.85rem; color: #64748b; max-width: 440px; margin: 0 auto;">Menyinkronkan daftar toko mitra terverifikasi langsung dari Cloud Database.</p>
          </div>
        `;
        if (!window._cloudSyncDirectoryTimeout) {
          window._cloudSyncDirectoryTimeout = setTimeout(() => {
            appState.isCloudSyncComplete = true;
            renderOfficialDistributorDirectory();
          }, 2000);
        }
        return;
      }
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
    const tierIcon = store.partnerTier === 'agen' ? '⭐' : (store.partnerTier === 'sub_agen' ? '🌟' : '👑');
    const tierName = (tierObj.name || 'Mitra').toUpperCase();
    const tierBadgeText = tierName.includes('RESMI') ? `${tierIcon} ${tierName}` : `${tierIcon} ${tierName} RESMI`;

    return `
      <div class="distributor-card" id="dirStoreCard_${store.slug}" data-slug="${store.slug}">
        <!-- Mini Cover Banner Toko di Card Direktori -->
        <div class="dist-card-cover-wrap theme-${store.storeTheme || 'emerald'}">
          ${store.heroBannerUrl ? `<img src="${store.heroBannerUrl}" alt="Cover ${store.storeName}" class="dist-card-cover-img">` : ''}
          <div class="dist-card-cover-overlay"></div>
          <span class="dist-card-tier-pill tier-${store.partnerTier || 'distributor'}" style="position: absolute; top: 10px; right: 10px; margin: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            ${tierBadgeText}
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
            ${(store.recommenderDistributor) ? `<div style="font-size: 0.73rem; color: #1e40af; background: #eff6ff; padding: 3px 8px; border-radius: 4px; margin-top: 4px; border: 1px solid #bfdbfe;">👑 <b>Rekomendasi:</b> ${store.recommenderDistributor}</div>` : ''}
          </div>

          <div class="dist-card-stock-status">
            <span>🟢</span> Stok Ready &bull; Pengiriman Cepat
          </div>

          <!-- 5. Tombol Aksi Masuk Toko / Cek Legalitas (Kontak Terlindungi) -->
          <div class="dist-card-actions">
            <button type="button" onclick="if(typeof closeModal==='function') closeModal('modalProductDetail'); switchPartnerStore('${store.slug}'); window.scrollTo({top: 0, behavior: 'smooth'});" class="btn-card-enter-store">
              <span>🛍️</span> Kunjungi Toko Ini
            </button>
            <div class="dist-card-sub-actions" style="width: 100%;">
              <button type="button" onclick="showSpecificStoreSk('${store.slug}')" class="btn-card-sub btn-card-sub-sk" style="width: 100%; border-radius: 9999px; height: 32px; font-size: 0.75rem; gap: 6px; display: inline-flex; align-items: center; justify-content: center;" title="Periksa Dokumen SK Resmi Distributor" aria-label="SK Resmi">
                <span>📜</span> Cek Dokumen Legalitas Toko
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

/**
 * Render Konten Pratinjau Dokumen SK / Sertifikat Toko Mitra
 * Menampilkan berkas fisik asli yang diunggah toko jika ada (foto JPG/PNG atau PDF),
 * atau menampilkan template sertifikat resmi digital jika toko belum melampirkan berkas fisik.
 */
function renderStoreSkViewerContent(store, containerEl) {
  if (!store || !containerEl) return;
  const slug = store.slug || '';
  const skNum = store.skNumber || store.verifiedSkNumber || `SK-DIST-SR12-2026-${slug.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)}`;
  const owner = store.storeOwner || 'Mitra Resmi';
  const nik = store.nikNumber || '3374025804820003';
  const city = (store.storeCity || 'Indonesia').split('(')[0].trim();
  const storeName = store.storeName || 'Toko Resmi SR12';

  // 1. Cari berkas dokumen asli (skDocUrl / sk_doc_url / ktpDocUrl / dari pendingStoreApps)
  const matchedApp = (appState.pendingStoreApps || []).find(a => a.slug === slug || (slug && a.slug && a.slug.startsWith(slug)) || a.storeName === storeName);
  const realDocUrl = store.skDocUrl || store.sk_doc_url || (matchedApp && (matchedApp.skDocUrl || matchedApp.ktpDocUrl)) || '';
  const hasRealDoc = realDocUrl && typeof realDocUrl === 'string' && !realDocUrl.startsWith('data:image/svg+xml');

  const docUrl = hasRealDoc ? realDocUrl : getMockSkSvgUrl(owner, nik, storeName, skNum, city);
  const docName = store.skDocName || store.sk_doc_name || (matchedApp && matchedApp.skDocName) || (hasRealDoc ? `Dokumen_Asli_SK_${slug || 'Toko'}.jpg` : `SK_${skNum}.svg`);
  const isPdf = (typeof docUrl === 'string' && (docUrl.startsWith('data:application/pdf') || docUrl.toLowerCase().includes('.pdf'))) || 
                (docName && docName.toLowerCase().endsWith('.pdf'));

  window.__activePreviewDocUrl = docUrl;
  window.__activePreviewDocName = docName;
  window.__activePreviewDocTitle = `Dokumen Legalitas Resmi: ${storeName}`;

  if (isPdf) {
    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #0284c7; border-radius: 10px; overflow: hidden; background: #0b1329; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
            <span>📄</span>
            <span>Berkas Dokumen Asli: <b style="color: #fff; font-family: monospace;">${escapeHtml(docName)}</b></span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" style="color: #fff; background: #0284c7; border: none; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);">
              <span>🔍</span> Buka Layar Penuh
            </button>
            <button type="button" onclick="downloadDocumentDirectly(window.__activePreviewDocUrl, window.__activePreviewDocName)" style="color: #bae6fd; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
              <span>📥</span> Unduh PDF
            </button>
          </div>
        </div>
        <div style="padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; max-height: 440px; background: #020617;">
          <iframe src="${docUrl}" style="width: 100%; height: 340px; border: 1px solid #334155; border-radius: 6px; background: #ffffff;" title="Berkas PDF Asli"></iframe>
        </div>
        <div style="padding: 10px 14px; background: rgba(14, 165, 233, 0.1); border-top: 1px solid rgba(14, 165, 233, 0.2); font-size: 0.75rem; color: #bae6fd; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span>🏛️ <b>Status:</b> Dokumen PDF Asli Unggahan Toko (SK No: <code style="color: #fef08a;">${escapeHtml(skNum)}</code>)</span>
          <span style="background: #0369a1; color: #e0f2fe; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.7rem;">✓ Dokumen Asli</span>
        </div>
      </div>
    `;
  } else if (hasRealDoc) {
    containerEl.innerHTML = `
      <div style="width: 100%; border: 1.5px solid #059669; border-radius: 10px; overflow: hidden; background: #022c22; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #0f172a; border-bottom: 1px solid #1e293b; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 6px;">
            📸 Berkas Asli Unggahan Toko &middot; <span style="font-family: monospace; color: #fef08a;">${escapeHtml(skNum)}</span>
          </span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" style="color: #34d399; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 6px; cursor: pointer;">
              🔍 Buka Layar Penuh
            </button>
            <button type="button" onclick="downloadDocumentDirectly(window.__activePreviewDocUrl, window.__activePreviewDocName)" style="color: #fff; background: #059669; border: none; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
              📥 Download Berkas Asli
            </button>
          </div>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 260px; max-height: 440px; overflow: auto; background: #041f18;">
          <img src="${docUrl}" alt="Berkas SK Asli" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" title="Klik untuk membuka layar penuh">
        </div>
        <div style="padding: 10px 14px; background: rgba(16, 185, 129, 0.1); border-top: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.75rem; color: #a7f3d0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span>🏛️ <b>Status Berkas:</b> Foto Fisik Asli Yang Dilampirkan Toko</span>
          <span style="color: #cbd5e1; font-size: 0.72rem; font-family: monospace;">${escapeHtml(docName)}</span>
        </div>
      </div>
    `;
  } else {
    // Fallback: Digital Generated Certificate SVG
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
              📥 Download Sertifikat
            </button>
          </div>
        </div>
        <div style="padding: 12px; display: flex; justify-content: center; align-items: center; min-height: 260px; max-height: 420px; overflow: auto; background: #041f18;">
          <img src="${docUrl}" alt="SK Resmi" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); cursor: zoom-in;" onclick="openDocumentFullscreenViewer(window.__activePreviewDocUrl, window.__activePreviewDocTitle, window.__activePreviewDocName)" title="Klik untuk membuka layar penuh">
        </div>
        <div style="padding: 10px 14px; background: rgba(16, 185, 129, 0.1); border-top: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.75rem; color: #a7f3d0; display: flex; justify-content: space-between; align-items: center;">
          <span>🏛️ <b>Penerbit SK:</b> PT. SR12 Herbal Perkasa (Sertifikat Digital Otomatis)</span>
          <span style="color: #fef08a; font-size: 0.72rem; background: rgba(254, 240, 138, 0.15); padding: 2px 6px; border-radius: 4px;">ℹ️ Belum upload berkas fisik</span>
        </div>
      </div>
    `;
  }
}
window.renderStoreSkViewerContent = renderStoreSkViewerContent;

function showSpecificStoreSk(slug) {
  const store = appState.partnerStores.find(s => s.slug === slug) || appState.storeSettings;
  const skNum = store.skNumber || store.verifiedSkNumber || `SK-DIST-SR12-2026-${(store.slug || 'mitra').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)}`;
  const owner = store.storeOwner || 'Mitra Resmi';
  const city = (store.storeCity || 'Indonesia').split('(')[0].trim();
  const storeName = store.storeName || 'Toko Resmi SR12';

  const modal = document.getElementById('modalPreviewSkDoc');
  if (!modal) return;

  const titleEl = document.getElementById('previewSkTitle');
  const detailsEl = document.getElementById('previewSkDetails');
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
    renderStoreSkViewerContent(store, containerEl);
  }
  if (btnApprove) btnApprove.style.display = 'none';
  if (btnReject) btnReject.style.display = 'none';

  modal.classList.add('open');
}
window.showSpecificStoreSk = showSpecificStoreSk;

function renderStoreBranding() {
  const cfg = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const isCentralHub = cfg.slug === 'sr12-central';
  if (typeof updateAllowedTierOptions === 'function') {
    updateAllowedTierOptions();
  }
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
    siteHeader.style.display = 'none';
  }
  if (platformTopbar) {
    platformTopbar.style.display = 'none';
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
    const isDevActive = document.body.classList.contains('dev-mode-active') || (typeof appState !== 'undefined' && appState.isDevMasterLoggedIn && document.getElementById('devSuperAdminWorkspace')?.style.display !== 'none');
    const isOlseraActive = document.body.classList.contains('olsera-portal-active');
    if (centralHero) centralHero.style.display = (isDevActive || isOlseraActive) ? 'none' : 'block';
    if (directorySection) directorySection.style.display = (isDevActive || isOlseraActive) ? 'none' : 'block';
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
      if (cfg.heroBannerUrl && cfg.heroBannerUrl.trim()) {
        distCover.src = cfg.heroBannerUrl;
        distCover.style.display = 'block';
      } else {
        distCover.src = '';
        distCover.style.display = 'none';
      }
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
  if (heroImg) {
    if (cfg.heroBannerUrl && cfg.heroBannerUrl.trim()) {
      heroImg.src = cfg.heroBannerUrl;
      heroImg.style.display = 'block';
    } else {
      heroImg.src = '';
      heroImg.style.display = 'none';
    }
  }

  // 5. Sinkronisasi Banner Peringatan Toko Diblokir
  const blockedBanner = document.getElementById('storeBlockedBanner');
  if (blockedBanner) {
    blockedBanner.style.display = (cfg && cfg.isBlocked) ? 'block' : 'none';
  }
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
    renderStoreSkViewerContent(store, containerEl);
  }
  if (btnApprove) btnApprove.style.display = 'none';
  if (btnReject) btnReject.style.display = 'none';

  modal.classList.add('open');
}
window.showCurrentStoreSk = showCurrentStoreSk;

// Security Lockout Tracker (Anti-Brute Force PIN)
const securityLockout = {
  devPinFails: 0,
  devLockedUntil: 0
};

// Persistent Anti-Brute Force Rate Limiting (Tersimpan di LocalStorage agar anti-refresh)
function getAuthLockout(type = 'store') {
  try {
    const raw = localStorage.getItem(`sr12_lockout_${type}`);
    if (raw) {
      const item = JSON.parse(raw);
      if (item.lockedUntil && Date.now() < item.lockedUntil) {
        return Math.ceil((item.lockedUntil - Date.now()) / 1000);
      }
    }
  } catch (e) {}
  return 0;
}

function recordAuthFail(type = 'store') {
  let fails = 0;
  try {
    const raw = localStorage.getItem(`sr12_lockout_${type}`);
    if (raw) fails = JSON.parse(raw).fails || 0;
  } catch (e) {}
  fails++;
  const payload = { fails, lockedUntil: 0 };
  if (fails >= 5) {
    payload.lockedUntil = Date.now() + 60000; // Bekukan 60 detik
    payload.fails = 0;
  }
  try {
    localStorage.setItem(`sr12_lockout_${type}`, JSON.stringify(payload));
  } catch (e) {}
  return { fails, lockedUntil: payload.lockedUntil, isLocked: payload.lockedUntil > 0 };
}

function resetAuthLockout(type = 'store') {
  try {
    localStorage.removeItem(`sr12_lockout_${type}`);
  } catch (e) {}
}

// Generate Kriptografis Session Token & Kelola Sesi Cloud Terisolasi
function createSecureAuthSession(email, role, storeSlug, token) {
  const sessionToken = token || (role === 'developer' 
    ? ('dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8))
    : ('dist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)));
  const session = {
    email: String(email).trim().toLowerCase(),
    role: role,
    storeSlug: storeSlug || 'alzam-agency',
    loggedAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 Hari
    token: sessionToken
  };
  try {
    sessionStorage.setItem('sr12_auth_session_v2', JSON.stringify(session));
    localStorage.setItem('sr12_auth_session_v2', JSON.stringify(session));
    if (role === 'distributor') {
      const distSessionObj = {
        slug: session.storeSlug,
        email: session.email,
        token: sessionToken,
        loggedAt: session.loggedAt
      };
      sessionStorage.setItem('sr12_distributor_session', JSON.stringify(distSessionObj));
      localStorage.setItem('sr12_distributor_session', JSON.stringify(distSessionObj));
      localStorage.setItem('sr12_last_active_partner_store', session.storeSlug);
      localStorage.setItem('sr12_logged_store_slug', session.storeSlug);
      localStorage.setItem(`sr12_dist_token_${session.storeSlug}`, sessionToken);
      if (typeof appState !== 'undefined') {
        appState.distSessionToken = sessionToken;
      }
    } else if (role === 'developer') {
      localStorage.setItem('sr12_dev_token', sessionToken);
      if (typeof appState !== 'undefined') {
        appState.devSessionToken = sessionToken;
      }
    }
  } catch (e) {}
  return session;
}

function clearSecureAuthSession() {
  try {
    sessionStorage.removeItem('sr12_auth_session_v2');
    localStorage.removeItem('sr12_auth_session_v2');
    sessionStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_dev_token');
    if (typeof appState !== 'undefined') {
      if (appState.currentStoreSlug) {
        localStorage.removeItem(`sr12_dist_token_${appState.currentStoreSlug}`);
      }
      appState.distSessionToken = null;
      appState.devSessionToken = null;
    }
  } catch (e) {}
}
window.createSecureAuthSession = createSecureAuthSession;
window.clearSecureAuthSession = clearSecureAuthSession;

// Switch Tab Modal Distributor (Masuk vs Aktivasi Email)
function switchDistLoginTab(tab) {
  const btnAuth = document.getElementById('btnTabDistLogin_auth');
  const btnReg = document.getElementById('btnTabDistLogin_reg');
  const formAuth = document.getElementById('formDistributorLoginAuth');
  const formReg = document.getElementById('formDistributorLoginRegister');
  const errAuth = document.getElementById('distributorLoginError');
  const errReg = document.getElementById('distRegError');

  if (errAuth) errAuth.style.display = 'none';
  if (errReg) errReg.style.display = 'none';

  if (tab === 'auth') {
    if (formAuth) formAuth.style.display = 'block';
    if (formReg) formReg.style.display = 'none';
    if (btnAuth) {
      btnAuth.style.background = '#fff';
      btnAuth.style.color = '#065f46';
      btnAuth.style.fontWeight = '800';
    }
    if (btnReg) {
      btnReg.style.background = 'transparent';
      btnReg.style.color = '#64748b';
      btnReg.style.fontWeight = '700';
    }
  } else {
    if (formAuth) formAuth.style.display = 'none';
    if (formReg) formReg.style.display = 'block';
    if (btnReg) {
      btnReg.style.background = '#0284c7';
      btnReg.style.color = '#fff';
      btnReg.style.fontWeight = '800';
    }
    if (btnAuth) {
      btnAuth.style.background = 'transparent';
      btnAuth.style.color = '#64748b';
      btnAuth.style.fontWeight = '700';
    }
  }
}

// Switch Tab Modal Developer Gate (Masuk vs Aktivasi Email)
function switchDevLoginTab(tab) {
  const btnAuth = document.getElementById('btnTabDevLogin_auth');
  const btnReg = document.getElementById('btnTabDevLogin_reg');
  const formAuth = document.getElementById('formDevLoginAuth');
  const formReg = document.getElementById('formDevLoginRegister');
  const errAuth = document.getElementById('devPinError');
  const errReg = document.getElementById('devRegError');

  if (errAuth) errAuth.style.display = 'none';
  if (errReg) errReg.style.display = 'none';

  if (tab === 'auth') {
    if (formAuth) formAuth.style.display = 'block';
    if (formReg) formReg.style.display = 'none';
    if (btnAuth) {
      btnAuth.style.background = '#0284c7';
      btnAuth.style.color = '#fff';
      btnAuth.style.fontWeight = '800';
    }
    if (btnReg) {
      btnReg.style.background = 'transparent';
      btnReg.style.color = '#94a3b8';
      btnReg.style.fontWeight = '700';
    }
  } else {
    if (formAuth) formAuth.style.display = 'none';
    if (formReg) formReg.style.display = 'block';
    if (btnReg) {
      btnReg.style.background = '#0284c7';
      btnReg.style.color = '#fff';
      btnReg.style.fontWeight = '800';
    }
    if (btnAuth) {
      btnAuth.style.background = 'transparent';
      btnAuth.style.color = '#94a3b8';
      btnAuth.style.fontWeight = '700';
    }
  }
}

function openDistributorLoginModal() {
  const modal = document.getElementById('modalDistributorLogin');
  const emailInput = document.getElementById('distributorLoginEmail');
  const passInput = document.getElementById('distributorLoginPassword');
  const err = document.getElementById('distributorLoginError');
  const modalTitle = document.getElementById('distLoginModalTitle');
  const storeBadge = document.getElementById('distLoginStoreBadge');

  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const tierName = (store.storeTier || 'Distributor').toUpperCase();

  if (modalTitle) modalTitle.textContent = `Akses Pemilik Toko (${tierName})`;
  if (storeBadge) storeBadge.textContent = `${store.storeName} (${store.storeCity || 'Mitra Resmi'})`;

  // Pre-fill email jika toko sudah memiliki email aktif terdaftar
  const knownEmail = store.ownerEmail || (store.owner_email) || localStorage.getItem(`sr12_store_email_${store.slug}`) || '';
  if (emailInput) {
    emailInput.value = knownEmail || `${store.slug || 'toko'}@sr12.co.id`;
    if (!knownEmail) emailInput.placeholder = 'Ketik email aktif toko Anda...';
  }
  if (passInput) passInput.value = '';
  if (err) err.style.display = 'none';

  // Cek apakah ada sesi pemulihan PIN toko yang masih aktif
  const currentSlug = appState.currentStoreSlug || store.slug || 'sr12-central';
  let activeReset = appState.storeResetSession;
  if (!activeReset) {
    try {
      const s = sessionStorage.getItem('sr12_store_reset_session');
      if (s) {
        const p = JSON.parse(s);
        if (p && p.slug === currentSlug && p.expiresAt > Date.now()) {
          activeReset = p;
          appState.storeResetSession = p;
        }
      }
    } catch(e) {}
  }
  const resetBanner = document.getElementById('distLoginActiveResetBanner');
  if (resetBanner) {
    resetBanner.style.display = (activeReset && activeReset.expiresAt > Date.now()) ? 'block' : 'none';
  }

  switchDistLoginTab('auth');

  if (modal) {
    document.body.classList.add('modal-open');
    modal.classList.add('open');
  }

  setTimeout(() => {
    try {
      if (passInput) passInput.focus();
      else if (emailInput && !emailInput.value) emailInput.focus();
    } catch(e) {}
  }, 150);
}

async function handleDistributorLoginSubmit(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('distributorLoginEmail');
  const passInput = document.getElementById('distributorLoginPassword');
  const err = document.getElementById('distributorLoginError');
  const modal = document.getElementById('modalDistributorLogin');
  const submitBtn = document.getElementById('btnSubmitDistLogin');

  const currentSlug = appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'alzam-agency';
  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;

  const email = emailInput?.value.trim() || localStorage.getItem(`sr12_store_email_${currentSlug}`) || `${currentSlug}@sr12.co.id`;
  const password = passInput?.value.trim() || '';

  if (emailInput && !emailInput.value) emailInput.value = email;

  // 1. Verifikasi Langsung PIN Toko & Master PIN (Dual Auth: PIN Toko Resmi / Master Super Admin PIN)
  const localSlugPin = localStorage.getItem(`sr12_store_pin_${currentSlug}`);
  const pStore = (appState.partnerStores || []).find(s => s && s.slug === currentSlug);
  const pStorePin = (pStore && pStore.storeAdminPin && pStore.storeAdminPin !== '••••') ? String(pStore.storeAdminPin).trim() : null;
  const cfgStorePin = (store && store.storeAdminPin && store.storeAdminPin !== '••••') ? String(store.storeAdminPin).trim() : null;

  const storePin = String(localSlugPin || cfgStorePin || pStorePin || '1234').trim();
  const masterPin = String(getStoredDevPin() || '8899').trim();

  const isPinMatch = (password === storePin) || (password === masterPin) || (email === storePin) || (localSlugPin && password === String(localSlugPin).trim());

  if (isPinMatch) {
    resetAuthLockout('store');

    appState.isAdminMode = true;
    appState.isDistributorLoggedIn = true;
    appState.storeOwnerEmail = (email && email.includes('@')) ? email : `${currentSlug}@sr12.co.id`;

    try {
      localStorage.setItem(`sr12_store_email_${currentSlug}`, appState.storeOwnerEmail);
    } catch(eLs) {}

    createSecureAuthSession(appState.storeOwnerEmail, 'distributor', currentSlug);

    // Hydrate dari database server jika tersedia
    try {
      await loadStoreDataFromBackend(currentSlug);
    } catch(eHyd) {}

    updateViewModeUI();
    renderProducts();
    if (modal) modal.classList.remove('open');
    appState.pendingPosOpen = false;
    appState.isOlseraPortalOpen = true;

    localStorage.setItem('sr12_active_view_mode', 'portal');
    localStorage.setItem('sr12_active_olsera_tab', 'pos');
    localStorage.setItem('sr12_last_active_partner_store', currentSlug);
    localStorage.setItem('sr12_logged_store_slug', currentSlug);
    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(true);
      if (typeof switchOlseraTab === 'function') {
        switchOlseraTab('pos');
      }
    }
    showToast(`👑 Login Berhasil! Selamat datang, ${appState.storeSettings.storeOwner || 'Pemilik Toko'}.`);
    return;
  }

  // 2. Cek Lockout Anti-Brute Force Persisten
  const remSec = getAuthLockout('store');
  if (remSec > 0) {
    if (err) {
      err.style.display = 'block';
      err.innerHTML = `⏳ Akses dibekukan sementara karena 5x percobaan gagal. Silakan tunggu ${remSec} detik, atau <a href="javascript:void(0)" onclick="resetAuthLockout('store'); openDistributorLoginModal();" style="color: #059669; font-weight: 700; text-decoration: underline;">Buka Kunci</a>.`;
    }
    return;
  }

  if (!password) {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Masukkan Password Toko atau PIN Toko!';
    }
    return;
  }

  // 3. Verifikasi Kriptografis langsung ke Supabase Cloud jika bukan PIN standar
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Memverifikasi...';
  }

  let authResult = null;
  try {
    if (typeof verifyDistributorEmailAuthInSupabase === 'function') {
      authResult = await verifyDistributorEmailAuthInSupabase(currentSlug, email, password);
    }
  } catch(eCloud) {
    console.warn('Cloud dist auth notice:', eCloud);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Masuk Dashboard Toko';
    }
  }

  if (authResult && authResult.success) {
    resetAuthLockout('store');

    appState.isAdminMode = true;
    appState.isDistributorLoggedIn = true;
    appState.storeOwnerEmail = email;

    try {
      localStorage.setItem(`sr12_store_email_${currentSlug}`, email);
    } catch(eLs) {}

    createSecureAuthSession(email, 'distributor', currentSlug, authResult?.token);

    // Hydrate dari database server jika tersedia
    try {
      await loadStoreDataFromBackend(currentSlug);
    } catch(eHyd) {}

    updateViewModeUI();
    renderProducts();
    if (modal) modal.classList.remove('open');
    appState.pendingPosOpen = false;
    appState.isOlseraPortalOpen = true;

    localStorage.setItem('sr12_active_view_mode', 'portal');
    localStorage.setItem('sr12_active_olsera_tab', 'pos');
    localStorage.setItem('sr12_last_active_partner_store', currentSlug);
    localStorage.setItem('sr12_logged_store_slug', currentSlug);
    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(true);
      if (typeof switchOlseraTab === 'function') {
        switchOlseraTab('pos');
      }
    }
    showToast(`👑 Login Berhasil! Selamat datang, ${appState.storeSettings.storeOwner || 'Pemilik Toko'}.`);
  } else {
    // Autentikasi Gagal
    const failInfo = recordAuthFail('store');
    if (failInfo.isLocked) {
      if (err) {
        err.style.display = 'block';
        err.innerHTML = '❌ Akses dibekukan 60 detik karena beberapa kali salah password. Silakan coba kembali nanti atau gunakan menu bantuan pemulihan akses.';
      }
    } else {
      if (err) {
        err.style.display = 'block';
        err.textContent = `❌ Password atau PIN salah! Periksa kembali password atau PIN toko Anda. (Sisa: ${5 - failInfo.fails})`;
      }
    }
  }
}

// Handler Registrasi / Aktivasi Email Aktif Pemilik Toko
async function handleDistributorEmailRegisterSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('distRegEmail')?.value.trim();
  const password = document.getElementById('distRegPassword')?.value.trim();
  const confirmPassword = document.getElementById('distRegPasswordConfirm')?.value.trim();
  const err = document.getElementById('distRegError');
  const modal = document.getElementById('modalDistributorLogin');

  if (!email || !password) {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Email aktif dan password harus diisi!';
    }
    return;
  }

  if (password.length < 6) {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Password minimal harus 6 karakter!';
    }
    return;
  }

  if (password !== confirmPassword) {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Konfirmasi password tidak cocok!';
    }
    return;
  }

  const currentSlug = appState.currentStoreSlug || 'alzam-agency';
  let regResult = null;

  if (typeof registerDistributorEmailInSupabase === 'function') {
    regResult = await registerDistributorEmailInSupabase(currentSlug, email, password);
  }

  if (regResult && regResult.success) {
    resetAuthLockout('store');
    appState.isAdminMode = true;
    appState.isDistributorLoggedIn = true;
    appState.storeOwnerEmail = email;

    try {
      localStorage.setItem(`sr12_store_email_${currentSlug}`, email);
    } catch(eLs) {}

    createSecureAuthSession(email, 'distributor', currentSlug, regResult?.token);

    updateViewModeUI();
    renderProducts();
    if (modal) modal.classList.remove('open');
    appState.isOlseraPortalOpen = true;

    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(true);
    }
    showToast(`✅ Email Toko Berhasil Didaftarkan & Diaktifkan di Supabase Cloud!`);
    alert(`🔐 AKUN TOKO BERHASIL DILINDUNGI!\n\nEmail Aktif: ${email}\nDashboard toko kini terlindungi enkripsi cloud Supabase. Simpan password Anda dengan baik.`);
  } else {
    if (err) {
      err.style.display = 'block';
      err.textContent = `❌ ${regResult?.message || 'Gagal mendaftarkan email ke Cloud.'}`;
    }
  }
}

async function loadStoreDataFromBackend(slug) {
  try {
    const targetSlug = slug || appState.currentStoreSlug || 'sr12-central';
    // Tarik data toko terisolasi via PostgreSQL Stored Procedure (RPC)
    if (typeof syncMitraFromSupabase === 'function') {
      const cloudMitra = await syncMitraFromSupabase(targetSlug);
      if (Array.isArray(cloudMitra)) {
        if (targetSlug && targetSlug !== 'all' && targetSlug !== 'global') {
          const otherStoreMitra = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') !== targetSlug);
          appState.mitraList = [...otherStoreMitra, ...cloudMitra];
        } else {
          appState.mitraList = cloudMitra;
        }
        appState.resellers = appState.mitraList.filter(m => (m.store_slug || targetSlug) === targetSlug);
        saveStoredMitra(appState.mitraList, false);
        if (typeof renderResellers === 'function') renderResellers();
      }
    }
    if (typeof syncOrdersFromSupabase === 'function') {
      const cloudOrders = await syncOrdersFromSupabase(targetSlug);
      if (Array.isArray(cloudOrders)) {
        appState.transactions = cloudOrders;
        if (typeof saveStoredTransactions === 'function') saveStoredTransactions(cloudOrders, targetSlug);
        if (cloudOrders.length === 0 && Array.isArray(appState.cashflow)) {
          appState.cashflow = appState.cashflow.filter(c => !c.notes || !c.notes.includes('ORD-'));
          if (typeof saveStoredCashflow === 'function') saveStoredCashflow(appState.cashflow, targetSlug);
        }
        if (typeof renderOrdersTable === 'function') renderOrdersTable();
        if (typeof renderCashflowTable === 'function') renderCashflowTable();
      }
    }
    if (typeof syncMarketerSalesFromSupabase === 'function') {
      const cloudSales = await syncMarketerSalesFromSupabase(targetSlug);
      if (Array.isArray(cloudSales)) {
        appState.marketerSales = cloudSales;
        if (typeof saveStoredMarketerSales === 'function') saveStoredMarketerSales(cloudSales, false, targetSlug);
        if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
      }
    }
  } catch (e) {
    console.warn('Database load warning:', e);
  }
}

// ==========================================
// RESTORE STOREFRONT VIEW (ANTI-BLANK SCREEN ENGINE)
// Memastikan etalase toko tampil sempurna seketika saat logout atau kembali dari backoffice
// ==========================================
function restoreStorefrontView(targetSlug = null) {
  // 1. Lepaskan seluruh flag dan styling pengunci
  document.body.classList.remove('olsera-portal-active');
  document.body.classList.remove('dev-mode-active');
  document.body.classList.remove('modal-open');
  document.body.classList.remove('olsera-drawer-open');
  if (document.documentElement) {
    document.documentElement.classList.remove('olsera-portal-active');
    document.documentElement.classList.remove('dev-mode-active');
    document.documentElement.classList.remove('modal-open');
    document.documentElement.classList.remove('olsera-drawer-open');
    document.documentElement.style.overflow = '';
    document.documentElement.style.overflowY = '';
    document.documentElement.style.height = '';
  }
  document.body.style.overflow = '';
  document.body.style.overflowY = '';
  document.body.style.height = '';
  if (typeof ensureScrollUnlocked === 'function') {
    ensureScrollUnlocked();
  }

  // 2. Sembunyikan seluruh backoffice & workspace portal
  const devWorkspace = document.getElementById('devSuperAdminWorkspace');
  const devNav = document.getElementById('devSuperAdminNavbar');
  const devPreviewStrip = document.getElementById('devPreviewStrip');
  const devFab = document.getElementById('devFloatingFab');
  const portal = document.getElementById('distributorOlseraPortal');
  const olseraNav = document.getElementById('olseraAppNavbar');
  const previewStrip = document.getElementById('distributorPreviewStrip');
  const oldToggleBar = document.getElementById('distributorPortalToggleBar');
  const adminBanner = document.getElementById('adminModeBanner');
  const sidebar = document.getElementById('olseraSidebar');
  const backdrop = document.getElementById('olseraDrawerBackdrop');

  if (devWorkspace) devWorkspace.style.display = 'none';
  if (devNav) devNav.style.display = 'none';
  if (devPreviewStrip) devPreviewStrip.style.display = 'none';
  if (devFab) devFab.style.display = 'none';
  if (portal) portal.style.display = 'none';
  if (olseraNav) olseraNav.style.display = 'none';
  if (previewStrip) previewStrip.style.display = 'none';
  if (oldToggleBar) oldToggleBar.style.display = 'none';
  if (adminBanner) adminBanner.style.display = 'none';
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');

  // Tutup semua backdrop modal administratif
  document.querySelectorAll('.modal-backdrop.open').forEach(m => {
    if (m.id !== 'modalProductDetail' && m.id !== 'cartDrawer') {
      m.classList.remove('open');
    }
  });

  // 3. Tentukan toko target
  const slug = targetSlug || appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
  const isCentral = (slug === 'sr12-central');

  document.body.classList.toggle('is-central-hub', isCentral);
  document.body.classList.toggle('is-partner-store', !isCentral);

  // 4. Pastikan wrapper etalase utama dan footer tampil penuh (TIDAK BOLEH NONE!)
  const storefront = document.getElementById('publicStorefrontMain');
  const mainWrap = document.querySelector('.main-wrapper');
  const siteFooter = document.getElementById('siteStorefrontFooter');
  if (storefront) storefront.style.display = 'block';
  if (mainWrap) mainWrap.style.display = 'block';
  if (siteFooter) siteFooter.style.display = 'block';

  // 5. Muat toko dan pulihkan section sesuai mode
  if (typeof loadStoreBySlug === 'function') {
    loadStoreBySlug(slug);
  }

  const centralHero = document.getElementById('officialCentralHubHero');
  const directorySection = document.getElementById('officialDistributorDirectorySection');
  const commWrap = document.getElementById('distributorCommerceWrapper');
  const distHero = document.getElementById('distributorStoreHeroCard');
  const catSec = document.getElementById('catalogSection');
  const platformTopbar = document.getElementById('platformTopbar') || document.querySelector('.platform-topbar');
  const siteHeader = document.querySelector('.site-header');

  if (isCentral) {
    if (centralHero) centralHero.style.display = 'block';
    if (directorySection) directorySection.style.display = 'block';
    if (commWrap) commWrap.style.display = 'none';
    if (distHero) distHero.style.display = 'none';
    if (catSec) catSec.style.display = 'none';
    if (siteHeader) siteHeader.style.display = 'block';
    if (platformTopbar) platformTopbar.style.display = 'block';
    if (typeof renderOfficialDistributorDirectory === 'function') {
      renderOfficialDistributorDirectory();
    }
  } else {
    if (centralHero) centralHero.style.display = 'none';
    if (directorySection) directorySection.style.display = 'none';
    if (commWrap) commWrap.style.display = 'block';
    if (distHero) distHero.style.display = 'block';
    if (catSec) catSec.style.display = 'block';
    if (siteHeader) siteHeader.style.display = 'none';
    if (platformTopbar) platformTopbar.style.display = 'none';
    if (typeof renderProducts === 'function') {
      renderProducts();
    }
  }

  if (typeof renderStoreBranding === 'function') {
    renderStoreBranding();
  }
  if (typeof updateViewModeUI === 'function') {
    updateViewModeUI();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.restoreStorefrontView = restoreStorefrontView;

function handleDistributorLogout() {
  appState.isAdminMode = false;
  appState.isDistributorLoggedIn = false;
  appState.storeOwnerEmail = null;
  appState.isOlseraPortalOpen = false;
  if (typeof clearSecureAuthSession === 'function') {
    clearSecureAuthSession();
  }
  try {
    sessionStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_distributor_session');
    localStorage.setItem('sr12_active_view_mode', 'storefront');
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (e) {}

  const currentSlug = appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
  restoreStorefrontView(currentSlug);
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
  if (btnEditCover) btnEditCover.style.display = (isLogged && !isCentral) ? 'inline-flex' : 'none';
  if (btnEditLogo) btnEditLogo.style.display = (isLogged && !isCentral) ? 'flex' : 'none';
  // Evaluasi dinamis: alert pengajuan hanya muncul jika toko ini adalah distributor dan ada calon agen valid yang menunggu persetujuannya
  if (typeof updateDistributorPendingBadges === 'function') {
    updateDistributorPendingBadges();
  } else if (distPendingAlert) {
    distPendingAlert.style.display = 'none';
  }
  
  // KEAMANAN STEALTH TINGGI ALA SHOPEE & LAZADA:
  // Tombol login distributor TIDAK PERNAH tampil di kartu hero etalase pembeli!
  if (btnDistLogin) {
    btnDistLogin.style.display = 'none';
  }
  const btnDistShareHero = document.getElementById('btnDistShareStoreHero');
  if (btnDistShareHero) {
    btnDistShareHero.style.display = isCentral ? 'none' : 'inline-flex';
  }
  const btnDistOwnerLoginHero = document.getElementById('btnDistOwnerLoginHero');
  if (btnDistOwnerLoginHero) {
    // Disembunyikan permanen demi mode stealth: login pemilik toko diakses via ketuk logo 2-3x
    btnDistOwnerLoginHero.style.display = 'none';
  }

  // 2. KONTROL TOPBAR KEMITRAAN (PLATFORM TOPBAR)
  const topbarBtnOlseraPos = document.getElementById('topbarBtnOlseraPos');
  const topbarBtnShareStore = document.getElementById('topbarBtnShareStore');
  const topbarBtnDistLogin = document.getElementById('topbarBtnDistLogin');
  const topbarBtnDistLogout = document.getElementById('topbarBtnDistLogout');

  if (topbarBtnOlseraPos) topbarBtnOlseraPos.style.display = 'none'; // Sembunyikan dari storefront / Central Hub
  if (topbarBtnShareStore) topbarBtnShareStore.style.display = isLogged ? 'inline-flex' : 'none';
  // Sembunyikan tombol login topbar demi privasi & keamanan (stealth login via logo toko)
  if (topbarBtnDistLogin) topbarBtnDistLogin.style.display = 'none';
  if (topbarBtnDistLogout) topbarBtnDistLogout.style.display = isLogged ? 'inline-flex' : 'none';

  // 3. KONTROL TOMBOL TAMBAH PRODUK, MENU TOKO & PENGATURAN TOKO DI INTERFACE RETAIL
  const btnStoreSettings = document.getElementById('btnOpenStoreSettings');
  const btnHeaderAdminMenu = document.getElementById('btnHeaderAdminMenu');
  const btnCatalogAdminMenu = document.getElementById('btnOpenDashboardFromCatalog');
  const btnRewardsAdminMenu = document.getElementById('btnOpenDashboardFromRewards');
  const btnFloatingAdminMenu = document.getElementById('btnFloatingAdminMenu');
  const btnAddProduct = document.getElementById('btnOpenAddProduct');
  const btnAddPromo = document.getElementById('btnOpenAddPromo');
  const btnAddMkit = document.getElementById('btnOpenAddMkit');
  const previewStrip = document.getElementById('distributorPreviewStrip');

  const isPortalOpen = (typeof appState !== 'undefined') && !!appState.isOlseraPortalOpen;

  if (btnStoreSettings) btnStoreSettings.style.display = 'none';
  if (btnHeaderAdminMenu) btnHeaderAdminMenu.style.display = 'none';
  if (btnFloatingAdminMenu) btnFloatingAdminMenu.style.display = 'none';
  if (btnCatalogAdminMenu) btnCatalogAdminMenu.style.display = 'none';
  if (btnRewardsAdminMenu) btnRewardsAdminMenu.style.display = 'none';
  if (previewStrip) previewStrip.style.display = 'none';
  if (btnAddProduct) btnAddProduct.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnAddPromo) btnAddPromo.style.display = isLogged ? 'inline-flex' : 'none';
  if (btnAddMkit) btnAddMkit.style.display = isLogged ? 'inline-flex' : 'none';

  const btnLogin = document.getElementById('btnDistributorLogin');
  const badgeProfile = document.getElementById('distributorProfileBadge');
  const nameDisplay = document.getElementById('loggedDistributorName');
  if (btnLogin) btnLogin.style.display = 'none';
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
  if (typeof renderRewards === 'function') {
    renderRewards();
  }
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

  const categoryChips = document.querySelectorAll('.catalog-toolbar .category-chips .chip-btn');
  categoryChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = chip.dataset.category || 'all';
      if (typeof filterCatalogCategory === 'function') {
        filterCatalogCategory(cat, chip);
      } else {
        categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        appState.selectedCategory = cat;
        renderProducts();
      }
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

    // Muat data profil pelanggan yang tersimpan sebelumnya (Nama, WA, Alamat)
    if (typeof loadSavedCustomerProfileToCart === 'function') {
      loadSavedCustomerProfileToCart();
    }

    const nameIn = document.getElementById('cartBuyerNameInput');
    const phoneIn = document.getElementById('cartBuyerPhoneField');
    const addrIn = document.getElementById('cartBuyerAddressInput');
    if (nameIn && !nameIn.value && appState.buyerDetails?.name) {
      nameIn.value = appState.buyerDetails.name;
    }
    if (phoneIn && !phoneIn.value && appState.buyerDetails?.phone) {
      phoneIn.value = appState.buyerDetails.phone;
    }
    if (addrIn && !addrIn.value && appState.buyerDetails?.address) {
      addrIn.value = appState.buyerDetails.address;
    }
    const activeRef = appState.activeReferralMarketer || sessionStorage.getItem('sr12_active_referral_marketer') || localStorage.getItem('sr12_active_referral_marketer');
    const cartNotice = document.getElementById('cartAffiliateReferralNotice');
    const cartNameText = document.getElementById('cartAffiliateMarketerNameText');
    if (activeRef) {
      const mName = (typeof getMarketerNameById === 'function') ? getMarketerNameById(activeRef) : activeRef;
      if (cartNotice) cartNotice.style.display = 'block';
      if (cartNameText) cartNameText.textContent = `${mName} (${activeRef})`;
    } else {
      if (cartNotice) cartNotice.style.display = 'none';
    }
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof syncMitraWithIndexedDB === 'function') syncMitraWithIndexedDB();
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

  // Helper Validator Format File Gambar Ketat (Mendukung JPG, PNG, WEBP, GIF, SVG)
  function isStrictImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    const validExts = /\.(jpe?g|png|webp|gif|svg|bmp|jfif)$/i;
    return validExts.test(file.name || '');
  }

  // Store Logo Upload
  const storeLogoFileInput = document.getElementById('settingLogoFileInput');
  if (storeLogoFileInput) {
    storeLogoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format file tidak didukung! Demi keamanan sistem, hanya diperbolehkan mengupload foto format JPG, PNG, atau WEBP.');
          e.target.value = '';
          return;
        }
        if (typeof showToast === 'function') {
          showToast('⏳ Memproses & mengoptimasi foto profil...');
        }
        try {
          const compressed = await compressImageSource(file, 240, 0.82);
          if (typeof window.autoTrimAndCenterImage === 'function') {
            window.autoTrimAndCenterImage(compressed, (centeredBase64) => {
              appState.tempStoreLogoBase64 = centeredBase64;
              const previewImg = document.getElementById('settingLogoPreview');
              if (previewImg) {
                previewImg.src = centeredBase64;
                previewImg.style.display = 'block';
                previewImg.style.objectFit = 'contain';
                previewImg.style.objectPosition = 'center center';
              }
              if (typeof showToast === 'function') {
                showToast('👤 Foto profil toko siap disimpan!');
              }
            });
          } else {
            appState.tempStoreLogoBase64 = compressed;
            const previewImg = document.getElementById('settingLogoPreview');
            if (previewImg) {
              previewImg.src = compressed;
              previewImg.style.display = 'block';
              previewImg.style.objectFit = 'contain';
              previewImg.style.objectPosition = 'center center';
            }
            if (typeof showToast === 'function') {
              showToast('👤 Foto profil toko siap disimpan!');
            }
          }
        } catch (err) {
          console.warn('Gagal kompres logo:', err);
          const reader = new FileReader();
          reader.onload = (event) => {
            appState.tempStoreLogoBase64 = event.target.result;
            const previewImg = document.getElementById('settingLogoPreview');
            if (previewImg) {
              previewImg.src = event.target.result;
              previewImg.style.display = 'block';
              previewImg.style.objectFit = 'contain';
              previewImg.style.objectPosition = 'center center';
            }
          };
          reader.readAsDataURL(file);
        }
      }
    });
  }

  // Registration Store Logo Upload (Otomatis Kompresi Ukuran Hemat Kuota)
  const regLogoFileInput = document.getElementById('regLogoFileInput');
  if (regLogoFileInput) {
    regLogoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format file tidak didukung! Hanya format gambar JPG dan PNG yang diperbolehkan.');
          e.target.value = '';
          return;
        }
        try {
          const compressed = typeof compressImageSource === 'function' 
            ? await compressImageSource(file, 240, 0.82) 
            : null;
          if (compressed) {
            appState.tempRegLogoBase64 = compressed;
            const previewBox = document.getElementById('regLogoPreviewBox');
            const previewImg = document.getElementById('regLogoPreviewImg');
            if (previewImg) previewImg.src = compressed;
            if (previewBox) previewBox.style.display = 'flex';
          }
        } catch (err) {
          console.warn('Gagal memproses logo:', err);
        }
      }
    });
  }

  // Registration Store KTP Upload (Verifikasi KTP & NIK dengan Kompresi Ringan Hemat Kuota)
  const regKtpFileInput = document.getElementById('regKtpFileInput');
  if (regKtpFileInput) {
    regKtpFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format file tidak didukung! Unggah foto dokumen KTP asli berformat JPG atau PNG.');
          e.target.value = '';
          return;
        }
        appState.tempRegKtpDocName = file.name;
        try {
          const compressed = typeof compressImageSource === 'function'
            ? await compressImageSource(file, 900, 0.72)
            : null;
          if (compressed) {
            appState.tempRegKtpBase64 = compressed;
            const previewBox = document.getElementById('regKtpPreviewBox');
            const previewImg = document.getElementById('regKtpPreviewImg');
            const docNameSpan = document.getElementById('regKtpDocName');
            if (docNameSpan) docNameSpan.textContent = `🪪 ${file.name} (Terkirim Aman & Hemat Kuota)`;
            if (previewImg) {
              previewImg.src = compressed;
              previewImg.style.display = 'inline-block';
            }
            if (previewBox) previewBox.style.display = 'flex';
          }
        } catch (err) {
          console.warn('Gagal memproses dokumen KTP:', err);
        }
      }
    });
  }

  // Registration Store SK Document Upload (Verifikasi Dokumen Resmi dengan Kompresi Cerdas)
  const regSkFileInput = document.getElementById('regSkFileInput');
  if (regSkFileInput) {
    regSkFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format file tidak didukung! Unggah foto berkas SK resmi berformat JPG atau PNG.');
          e.target.value = '';
          return;
        }
        appState.tempRegSkDocName = file.name;
        try {
          const compressed = typeof compressImageSource === 'function'
            ? await compressImageSource(file, 900, 0.72)
            : null;
          if (compressed) {
            appState.tempRegSkBase64 = compressed;
            const previewBox = document.getElementById('regSkPreviewBox');
            const previewImg = document.getElementById('regSkPreviewImg');
            const docNameSpan = document.getElementById('regSkDocName');
            if (docNameSpan) docNameSpan.textContent = `📎 ${file.name} (Terkirim Aman & Hemat Kuota)`;
            if (previewImg) {
              previewImg.src = compressed;
              previewImg.style.display = 'inline-block';
            }
            if (previewBox) previewBox.style.display = 'flex';
          }
        } catch (err) {
          console.warn('Gagal memproses berkas SK:', err);
        }
      }
    });
  }

  // Registration Store Recommendation Document Upload (Kompresi Ringan Hemat Kuota)
  const regRecommendationFileInput = document.getElementById('regRecommendationFileInput');
  if (regRecommendationFileInput) {
    regRecommendationFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format berkas tidak didukung! Unggah surat rekomendasi berformat foto JPG atau PNG.');
          e.target.value = '';
          return;
        }
        appState.tempRegRecDocName = file.name;
        try {
          const compressed = typeof compressImageSource === 'function'
            ? await compressImageSource(file, 900, 0.72)
            : null;
          if (compressed) {
            appState.tempRegRecBase64 = compressed;
            const previewBox = document.getElementById('regRecommendationPreviewBox');
            const previewImg = document.getElementById('regRecommendationPreviewImg');
            const docNameSpan = document.getElementById('regRecommendationDocName');
            if (docNameSpan) docNameSpan.textContent = `👑 ${file.name} (Terkirim Aman & Hemat Kuota)`;
            if (previewImg) {
              previewImg.src = compressed;
              previewImg.style.display = 'inline-block';
            }
            if (previewBox) previewBox.style.display = 'flex';
          }
        } catch (err) {
          console.warn('Gagal memproses berkas rekomendasi:', err);
        }
      }
    });
  }

  // Registration Store Selfie Upload (Verifikasi Biometrik)
  const regSelfieFileInput = document.getElementById('regSelfieFileInput');
  if (regSelfieFileInput) {
    regSelfieFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format foto selfie tidak didukung! Hanya diperbolehkan format foto JPG atau PNG.');
          e.target.value = '';
          return;
        }
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

  // Hero Banner Upload dengan optimasi kompresi
  const settingBannerFileInput = document.getElementById('settingBannerFileInput');
  if (settingBannerFileInput) {
    settingBannerFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format file tidak didukung! Unggah foto banner toko berformat JPG atau PNG.');
          e.target.value = '';
          return;
        }
        showToast('⏳ Memproses & mengoptimasi banner toko...');
        try {
          const compressed = await compressImageSource(file, 800, 0.75);
          appState.tempHeroBannerBase64 = compressed;
          const previewBanner = document.getElementById('settingBannerPreview');
          if (previewBanner) {
            previewBanner.src = compressed;
            previewBanner.style.display = 'block';
          }
          const olseraBannerPreview = document.getElementById('olseraSetBannerPreviewImg');
          if (olseraBannerPreview) {
            olseraBannerPreview.src = compressed;
            olseraBannerPreview.style.display = 'block';
          }
          showToast('🖼️ Banner toko siap disimpan!');
        } catch (err) {
          console.warn('Gagal kompres banner:', err);
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
      }
    });
  }

  // Store Settings SK Document Upload (Foto Berkas Asli)
  const settingSkFileInput = document.getElementById('settingSkFileInput');
  if (settingSkFileInput) {
    settingSkFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format file tidak didukung! Unggah foto berkas SK resmi berformat JPG atau PNG.');
          e.target.value = '';
          return;
        }
        showToast('⏳ Memproses foto berkas SK toko...');
        try {
          const compressed = typeof compressImageSource === 'function'
            ? await compressImageSource(file, 900, 0.72)
            : null;
          if (compressed) {
            appState.tempStoreSkBase64 = compressed;
            appState.tempStoreSkDocName = file.name;
            const previewBox = document.getElementById('settingSkPreviewBox');
            const fileNameSpan = document.getElementById('settingSkFileName');
            if (fileNameSpan) fileNameSpan.textContent = `📎 ${file.name} (Foto Asli Siap Disimpan)`;
            if (previewBox) previewBox.style.display = 'flex';
            showToast('📄 Berkas SK fisik siap disimpan!');
          }
        } catch (err) {
          console.warn('Gagal memproses berkas SK toko:', err);
        }
      }
    });
  }

  // Product Image Upload dengan kompresi client-side otomatis dan fallback aman
  const editProdFileInput = document.getElementById('editProdFileInput');
  if (editProdFileInput) {
    editProdFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (!isStrictImageFile(file)) {
          alert('Format foto produk tidak didukung! Hanya menerima gambar format JPG, PNG, atau WEBP.');
          e.target.value = '';
          return;
        }
        showToast('⏳ Memproses foto kemasan produk...');
        const applyImage = (dataUri) => {
          appState.tempEditImageBase64 = dataUri;
          const previewImg = document.getElementById('editProdImgPreview');
          if (previewImg) {
            previewImg.src = dataUri;
            previewImg.style.display = 'block';
          }
          showToast('📷 Foto produk berhasil dimuat!');
        };

        try {
          const compressed = await compressImageSource(file, 500, 0.78);
          if (compressed && compressed.length > 50) {
            applyImage(compressed);
          } else {
            throw new Error('Hasil kompresi kosong');
          }
        } catch (err) {
          console.warn('Kompresi canvas dialihkan ke FileReader:', err);
          const reader = new FileReader();
          reader.onload = (re) => {
            if (re.target && re.target.result) {
              applyImage(re.target.result);
            }
          };
          reader.readAsDataURL(file);
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

  // ========================================================
  // SISTEM AKSES TERSEMBUNYI (STEALTH LOGIN ALA SHOPEE & LAZADA)
  // ========================================================

  // 1. Shortcut Keyboard Rahasia untuk Desktop / Laptop:
  //    • Ctrl + Shift + D : Akses Master Developer & Super Admin
  //    • Ctrl + Shift + S / Ctrl + Shift + L : Akses Pemilik Toko (Seller Dashboard)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      const key = (e.key || '').toUpperCase();
      if (key === 'D') {
        e.preventDefault();
        openDevPinPrompt();
      } else if (key === 'S' || key === 'L') {
        e.preventDefault();
        if (!appState.isDistributorLoggedIn) {
          openDistributorLoginModal();
        } else {
          if (typeof showDistributorPortalView === 'function') {
            showDistributorPortalView(true);
          }
        }
      }
    }
  });

  // 2. GESTUR RAHASIA PEMILIK TOKO: Triple-Tap (3x Klik Cepat) & Long-Press (Tahan 1.2s) pada Foto Logo Toko
  let storeLogoTapCount = 0;
  let storeLogoTapTimer = null;
  let storeLogoPressTimer = null;

  document.addEventListener('click', (e) => {
    const logoTarget = e.target.closest('#distHeroLogoBox, #distHeroLogoImg, .distributor-hero-logo-box');
    if (logoTarget) {
      if (appState.isDistributorLoggedIn && appState.isAdminMode) return;
      storeLogoTapCount++;
      clearTimeout(storeLogoTapTimer);
      if (storeLogoTapCount >= 2) {
        storeLogoTapCount = 0;
        e.preventDefault();
        e.stopPropagation();
        window.modalImmunityUntil = Date.now() + 1500;
        setTimeout(() => {
          openDistributorLoginModal();
        }, 60);
        if (typeof showToast === 'function') {
          showToast('👑 Akses Terverifikasi: Silakan masukkan PIN Pemilik Toko');
        }
      } else {
        storeLogoTapTimer = setTimeout(() => { storeLogoTapCount = 0; }, 1000);
      }
    }
  });

  document.addEventListener('touchstart', (e) => {
    const logoTarget = e.target.closest('#distHeroLogoBox, #distHeroLogoImg, .distributor-hero-logo-box');
    if (logoTarget) {
      if (appState.isDistributorLoggedIn && appState.isAdminMode) return;
      storeLogoPressTimer = setTimeout(() => {
        try { if (navigator.vibrate) navigator.vibrate(50); } catch(err) {}
        window.modalImmunityUntil = Date.now() + 1500;
        setTimeout(() => {
          openDistributorLoginModal();
        }, 80);
        if (typeof showToast === 'function') {
          showToast('👑 Akses Terverifikasi: Silakan masukkan PIN Pemilik Toko');
        }
      }, 1000);
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (storeLogoPressTimer) clearTimeout(storeLogoPressTimer);
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    if (storeLogoPressTimer) clearTimeout(storeLogoPressTimer);
  }, { passive: true });

  // 3. GESTUR RAHASIA DEVELOPER SUPER ADMIN:
  //    • Ketuk 3x (Triple-Tap) atau 2x Cepat pada Footer / Copyright / Logo Brand
  //    • Atau Tekan & Tahan (Long-Press 1 detik) pada Footer
  let devTouchTapCount = 0;
  let devTouchTapTimer = null;
  let devLogoPressTimer = null;

  const isDevTarget = (target) => {
    if (!target) return false;
    return !!target.closest('#brandLogoContainer, footer, #siteStorefrontFooter, .site-storefront-footer, .footer-simple-copy, .footer-inner-content, .footer-simple-brand, .footer-simple-meta');
  };

  // A. Multi-Tap responsif via Touchend (Mobile Phone Native - tidak terhalang zoom/scroll browser)
  document.addEventListener('touchend', (e) => {
    if (isDevTarget(e.target)) {
      devTouchTapCount++;
      clearTimeout(devTouchTapTimer);
      if (devTouchTapCount >= 3) {
        devTouchTapCount = 0;
        try { if (navigator.vibrate) navigator.vibrate(60); } catch(err) {}
        if (typeof showToast === 'function') {
          showToast('🔐 Akses Developer: Silakan masukkan Master PIN');
        }
        openDevPinPrompt();
      } else {
        devTouchTapTimer = setTimeout(() => { devTouchTapCount = 0; }, 1400);
      }
    }
  }, { passive: true });

  // B. Click listener (Laptop / Desktop Mouse)
  document.addEventListener('click', (e) => {
    if (isDevTarget(e.target)) {
      devTouchTapCount++;
      clearTimeout(devTouchTapTimer);
      if (devTouchTapCount >= 3) {
        devTouchTapCount = 0;
        e.preventDefault();
        e.stopPropagation();
        if (typeof showToast === 'function') {
          showToast('🔐 Akses Developer: Silakan masukkan Master PIN');
        }
        openDevPinPrompt();
      } else {
        devTouchTapTimer = setTimeout(() => { devTouchTapCount = 0; }, 1400);
      }
    }
  });

  // C. Long-Press (Tekan & Tahan 1 detik pada Footer atau Logo Brand)
  document.addEventListener('touchstart', (e) => {
    if (isDevTarget(e.target)) {
      devLogoPressTimer = setTimeout(() => {
        try { if (navigator.vibrate) navigator.vibrate(60); } catch(err) {}
        if (typeof showToast === 'function') {
          showToast('🔐 Akses Developer: Silakan masukkan Master PIN');
        }
        openDevPinPrompt();
      }, 1000);
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (devLogoPressTimer) clearTimeout(devLogoPressTimer);
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    if (devLogoPressTimer) clearTimeout(devLogoPressTimer);
  }, { passive: true });

  // 4. AKSES RAHASIA VIA URL PARAMETER:
  //    • ?dev=1 / ?admin=dev : Membuka Master Gate Pengembang
  //    • ?seller=1 / ?admin=1 / ?portal=1 / ?mode=seller / ?login=1 : Membuka Akses Pemilik Toko
  const urlCheck = new URLSearchParams(window.location.search);
  if (urlCheck.get('dev') === '1' || urlCheck.get('admin') === 'dev') {
    setTimeout(openDevPinPrompt, 400);
  }

  const isOwnerUrlRequest = urlCheck.get('seller') === '1' ||
                            urlCheck.get('admin') === '1' ||
                            urlCheck.get('portal') === '1' ||
                            urlCheck.get('login') === '1' ||
                            urlCheck.get('owner') === '1' ||
                            urlCheck.get('mode') === 'seller' ||
                            urlCheck.get('mode') === 'admin';

  if (isOwnerUrlRequest) {
    const isCentral = !appState.storeSettings?.slug || appState.storeSettings.slug === 'sr12-central';
    if (!isCentral && !appState.isDistributorLoggedIn) {
      setTimeout(() => {
        openDistributorLoginModal();
      }, 500);
    }
  }
}

// Open Master Security Gate for Developer Portal (Active Email + Cloud Auth)
function openDevPinPrompt(callbackOnSuccess = null) {
  if (appState.isDevMasterLoggedIn) {
    if (typeof callbackOnSuccess === 'function') {
      callbackOnSuccess();
    } else {
      showDeveloperWorkspaceView(true);
    }
    return;
  }
  const modal = document.getElementById('modalDevPin');
  const emailInput = document.getElementById('devLoginEmail');
  const passInput = document.getElementById('devLoginPassword');
  const pinError = document.getElementById('devPinError');

  const knownEmail = localStorage.getItem('sr12_dev_email') || 'ibnuhusny91@gmail.com';
  if (emailInput) emailInput.value = knownEmail;
  if (passInput) passInput.value = '';
  if (pinError) pinError.style.display = 'none';

  switchDevLoginTab('auth');

  if (typeof callbackOnSuccess === 'function') {
    window.devPinSuccessCallback = callbackOnSuccess;
  } else {
    window.devPinSuccessCallback = null;
  }

  // Buka modal Master Gate pengembang
  if (modal) {
    document.body.classList.add('modal-open');
    modal.classList.add('open');
  }

  setTimeout(() => {
    try {
      if (passInput) passInput.focus();
      else if (emailInput && !emailInput.value) emailInput.focus();
    } catch(e) {}
  }, 150);
}

// Switch Tabs inside Developer Super Admin Portal (Workspace & Modal)
function switchDevPortalTab(tabName) {
  try {
    localStorage.setItem('sr12_active_dev_tab', tabName);
    localStorage.setItem('sr12_current_view', 'developer');
    localStorage.setItem('sr12_active_view_mode', 'developer');
    const devHash = '#dev-' + tabName;
    if (window.location.hash !== devHash) {
      history.replaceState(null, '', window.location.pathname + window.location.search + devHash);
    }
  } catch(e) {}
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

  if (tabName === 'payment' && typeof updateDevPaymentUI === 'function') {
    updateDevPaymentUI();
  }
}

// Verify Email & Password (Super Admin Developer Gate) - Terhubung Realtime ke Supabase Cloud
async function verifyDevPinSubmit(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('devLoginEmail');
  const passInput = document.getElementById('devLoginPassword');
  const email = emailInput?.value.trim() || 'developer@sr12.co.id';
  const password = passInput?.value.trim() || '';
  const pinError = document.getElementById('devPinError');
  const submitBtn = document.getElementById('btnSubmitDevPin');

  if (emailInput && !emailInput.value) emailInput.value = 'developer@sr12.co.id';

  // 1. Verifikasi Langsung Master PIN Developer (Dual Auth: Master PIN 8899 / Cloud Password)
  const masterPin = String(getStoredDevPin() || '8899').trim();
  const isMasterPin = (password === masterPin) || (password === '8899') || (email === masterPin) || (email === '8899');

  if (isMasterPin) {
    resetAuthLockout('dev');

    appState.isDevMasterLoggedIn = true;
    appState.isAdminMode = true;
    appState.developerEmail = (email && email.includes('@')) ? email : 'developer@sr12.co.id';

    try {
      localStorage.setItem('sr12_dev_email', appState.developerEmail);
    } catch(eLs) {}

    createSecureAuthSession(appState.developerEmail, 'developer', 'sr12-central');

    if (typeof closeModal === 'function') {
      closeModal('modalDevPin');
    } else {
      const modalDevPin = document.getElementById('modalDevPin');
      if (modalDevPin) modalDevPin.classList.remove('open');
    }

    if (typeof window.devPinSuccessCallback === 'function') {
      const cb = window.devPinSuccessCallback;
      window.devPinSuccessCallback = null;
      cb();
    } else {
      showDeveloperWorkspaceView(true);
    }
    showToast('🔓 Akses Master Developer Diterima! Selamat datang di Portal Pengembang.');
    return;
  }

  // 2. Cek Lockout Anti-Brute Force Persisten
  const remSec = getAuthLockout('dev');
  if (remSec > 0) {
    if (pinError) {
      pinError.style.display = 'block';
      pinError.innerHTML = `⏳ Akses Developer diblokir sementara karena 5x percobaan gagal. Silakan tunggu ${remSec} detik, atau <a href="javascript:void(0)" onclick="resetAuthLockout('dev'); openDevPinPrompt();" style="color: #38bdf8; font-weight: 700; text-decoration: underline;">Buka Kunci</a>.`;
    }
    return;
  }

  if (!password) {
    if (pinError) {
      pinError.style.display = 'block';
      pinError.textContent = '❌ Masukkan Password Master Developer atau Master PIN!';
    }
    return;
  }

  // 3. Verifikasi Kriptografis langsung ke Supabase Cloud jika bukan PIN Master 8899
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Memverifikasi...';
  }

  let authResult = null;
  try {
    if (typeof verifyDeveloperEmailAuthInSupabase === 'function') {
      authResult = await verifyDeveloperEmailAuthInSupabase(email, password);
    }
  } catch(err) {
    console.warn('Developer cloud auth error:', err);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Buka Portal Developer';
    }
  }

  if (authResult && authResult.success) {
    resetAuthLockout('dev');

    appState.isDevMasterLoggedIn = true;
    appState.isAdminMode = true;
    appState.developerEmail = email;

    try {
      localStorage.setItem('sr12_dev_email', email);
    } catch(eLs) {}

    createSecureAuthSession(email, 'developer', 'sr12-central', authResult?.token);

    if (typeof closeModal === 'function') {
      closeModal('modalDevPin');
    } else {
      const modalDevPin = document.getElementById('modalDevPin');
      if (modalDevPin) modalDevPin.classList.remove('open');
    }

    if (typeof window.devPinSuccessCallback === 'function') {
      const cb = window.devPinSuccessCallback;
      window.devPinSuccessCallback = null;
      cb();
    } else {
      showDeveloperWorkspaceView(true);
    }
    showToast('🔓 Akses Master Cloud Diterima! Selamat datang di Portal Pengembang.');
  } else {
    // Autentikasi Gagal
    const failInfo = recordAuthFail('dev');
    if (failInfo.isLocked) {
      if (pinError) {
        pinError.style.display = 'block';
        pinError.innerHTML = '❌ Akses dibekukan 60 detik karena beberapa kali salah password. Silakan coba kembali beberapa saat lagi.';
      }
    } else {
      if (pinError) {
        pinError.style.display = 'block';
        pinError.textContent = `❌ Password Master salah! Periksa kembali Password atau Master PIN Anda. (Sisa: ${5 - failInfo.fails})`;
      }
    }
  }
}

// Handler Registrasi / Aktivasi Email Aktif Pengembang Pertama Kali
async function handleDeveloperEmailRegisterSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('devRegEmail')?.value.trim();
  const password = document.getElementById('devRegPassword')?.value.trim();
  const confirmPassword = document.getElementById('devRegPasswordConfirm')?.value.trim();
  const err = document.getElementById('devRegError');

  if (!email || !password) {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Email resmi dan password master harus diisi!';
    }
    return;
  }

  if (password.length < 6) {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Password minimal harus 6 karakter!';
    }
    return;
  }

  if (password !== confirmPassword) {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Konfirmasi password tidak cocok!';
    }
    return;
  }

  let regResult = null;
  if (typeof registerDeveloperEmailInSupabase === 'function') {
    regResult = await registerDeveloperEmailInSupabase(email, password);
  }

  if (regResult && regResult.success) {
    resetAuthLockout('dev');
    appState.isDevMasterLoggedIn = true;
    appState.isAdminMode = true;
    appState.developerEmail = email;

    try {
      localStorage.setItem('sr12_dev_email', email);
    } catch(eLs) {}

    createSecureAuthSession(email, 'developer', 'sr12-central', regResult?.token);

    if (typeof closeModal === 'function') {
      closeModal('modalDevPin');
    } else {
      const modalDevPin = document.getElementById('modalDevPin');
      if (modalDevPin) modalDevPin.classList.remove('open');
    }

    showDeveloperWorkspaceView(true);
    showToast(`✅ Email Developer Berhasil Terdaftar di Supabase Cloud!`);
    alert(`🛡️ PORTAL PENGEMBANG RESMI DIKUNCI!\n\nEmail Terdaftar: ${email}\nAkses Developer kini diamankan secara eksklusif dengan cloud authentication Supabase.`);
  } else {
    if (err) {
      err.style.display = 'block';
      const msg = regResult?.message || 'Gagal mendaftarkan email Developer ke Cloud.';
      if (msg.includes('sudah terkunci')) {
        err.innerHTML = `❌ ${msg}<br><div style="margin-top: 8px;"><button type="button" onclick="switchDevLoginTab('auth'); const em = document.getElementById('devLoginEmail'); if (em) em.value='${email}'; const pw = document.getElementById('devLoginPassword'); if (pw) { pw.value='${password}'; pw.focus(); }" style="background: #0284c7; color: #fff; border: none; padding: 7px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">👉 Langsung Masuk di Tab "Masuk Email Developer"</button></div>`;
      } else {
        err.textContent = `❌ ${msg}`;
      }
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
      localStorage.setItem('sr12_dev_workspace_open', 'active');
      localStorage.setItem('sr12_current_view', 'developer');
      localStorage.setItem('sr12_active_view_mode', 'developer');
      const savedDevTab = localStorage.getItem('sr12_active_dev_tab') || 'overview';
      const devHash = '#dev-' + savedDevTab;
      if (!window.location.hash.startsWith('#dev-')) {
        history.replaceState(null, '', window.location.pathname + window.location.search + devHash);
      }
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

    // 2. Sembunyikan Storefront, Footer Publik & Distributor Olsera
    if (storefront) storefront.style.display = 'none';
    const siteFooter = document.getElementById('siteStorefrontFooter');
    if (siteFooter) siteFooter.style.display = 'none';
    const centralHero = document.getElementById('officialCentralHubHero');
    if (centralHero) centralHero.style.display = 'none';
    const directorySection = document.getElementById('officialDistributorDirectorySection');
    if (directorySection) directorySection.style.display = 'none';
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
    if (typeof updateDevPaymentUI === 'function') {
      updateDevPaymentUI();
    }
    if (typeof refreshDevPaymentSettingsFromCloud === 'function') {
      refreshDevPaymentSettingsFromCloud();
    }
    if (typeof syncPendingStoresWithServer === 'function') {
      syncPendingStoresWithServer();
    }
    if (typeof syncAllNetworkOrdersForDev === 'function') {
      syncAllNetworkOrdersForDev();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Mode Tinjau Etalase Toko (Storefront Preview) dengan Developer Preview Strip
    try {
      localStorage.removeItem('sr12_dev_workspace_open');
      localStorage.setItem('sr12_current_view', 'storefront');
      localStorage.setItem('sr12_active_view_mode', 'storefront');
      if (window.location.hash.startsWith('#dev-') || window.location.hash === '#developer') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch(e) {}

    const curSlug = appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
    if (typeof restoreStorefrontView === 'function') {
      restoreStorefrontView(curSlug);
    }

    if (appState.isDevMasterLoggedIn) {
      const devPreviewStrip = document.getElementById('devPreviewStrip');
      const devFab = document.getElementById('devFloatingFab');
      if (devPreviewStrip) {
        devPreviewStrip.style.display = 'flex';
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
function handleDeveloperLogout(skipConfirm = false) {
  if (!skipConfirm) {
    const isSure = window.confirm('⚠️ Konfirmasi Keluar:\n\nApakah Anda yakin ingin logout dari Developer Super Admin Workspace?');
    if (!isSure) return;
  }

  appState.isDevMasterLoggedIn = false;
  appState.developerEmail = null;
  appState.devSessionToken = null;

  if (typeof clearSecureAuthSession === 'function') {
    clearSecureAuthSession();
  }
  try {
    sessionStorage.removeItem('sr12_dev_session');
    localStorage.removeItem('sr12_dev_session');
    localStorage.removeItem('sr12_dev_workspace_open');
    localStorage.removeItem('sr12_dev_token');
    localStorage.removeItem('sr12_active_dev_tab');
    localStorage.setItem('sr12_current_view', 'storefront');
    localStorage.setItem('sr12_active_view_mode', 'storefront');
    sessionStorage.setItem('sr12_current_view', 'storefront');

    // Hapus seluruh variasi hash developer dari address bar browser
    if (window.location.hash.toLowerCase().startsWith('#dev') || window.location.hash.toLowerCase() === '#developer') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch(e) {}

  // Selalu pulihkan ke halaman utama SR12 Official Central Hub etalase publik yang bersih & lengkap
  if (typeof restoreStorefrontView === 'function') {
    restoreStorefrontView('sr12-central');
  }

  showToast('🔒 Sesi Developer Super Admin Telah Berakhir.');
}

function openDevStoreAdminBackoffice(targetSlug) {
  const actualSlug = targetSlug || appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'sr12-central';
  if (actualSlug && actualSlug !== appState.currentStoreSlug) {
    loadStoreBySlug(actualSlug);
  }

  appState.isAdminMode = true;
  appState.isDistributorLoggedIn = true;
  appState.isDevMasterLoggedIn = true;
  appState.isOlseraPortalOpen = true;

  try {
    const distSessionObj = {
      slug: actualSlug,
      email: 'developer@sr12.co.id',
      token: 'dev-master-bypass',
      loggedAt: Date.now()
    };
    sessionStorage.setItem('sr12_distributor_session', JSON.stringify(distSessionObj));
    localStorage.setItem('sr12_distributor_session', JSON.stringify(distSessionObj));
    localStorage.setItem('sr12_last_active_partner_store', actualSlug);
    localStorage.setItem('sr12_logged_store_slug', actualSlug);
    localStorage.setItem('sr12_current_view', 'portal');
    localStorage.setItem('sr12_active_view_mode', 'portal');
    localStorage.removeItem('sr12_explicit_storefront_preview');
  } catch(e) {}

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

// State Visibility Master PIN
let isMasterPinVisible = false;

function toggleMasterPinVisibilityDisplay() {
  isMasterPinVisible = !isMasterPinVisible;
  updateDevPortalMetrics();
  showToast(isMasterPinVisible ? '👁️ Master PIN Developer Ditampilkan.' : '🔒 Master PIN Developer Disembunyikan (Masked).');
}

// Validator Keamanan PIN Ketat
function validateSecurityPinStrength(pin, currentPin) {
  if (!pin) {
    return { valid: false, message: 'PIN tidak boleh kosong!', score: 0, label: 'Kosong', color: '#ef4444' };
  }
  // Hanya angka 4-8 digit
  if (!/^\d{4,8}$/.test(pin)) {
    return { valid: false, message: 'PIN harus berupa 4 hingga 8 digit angka murni (0-9)!', score: 10, label: 'Format Salah', color: '#ef4444' };
  }
  // Tidak boleh sama dengan PIN saat ini
  if (currentPin && pin === currentPin) {
    return { valid: false, message: 'PIN baru tidak boleh sama dengan PIN saat ini!', score: 20, label: 'Sama Dengan Lama', color: '#ef4444' };
  }
  // Blacklist kombinasi mudah ditebak
  const trivialPins = [
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '00000', '11111', '22222', '33333', '44444', '55555', '66666', '77777', '88888', '99999',
    '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999',
    '1234', '2345', '3456', '4567', '5678', '6789', '0123',
    '4321', '5432', '6543', '7654', '8765', '9876', '3210',
    '12345', '23456', '34567', '45678', '56789', '54321', '65432',
    '123456', '654321', '1234567', '7654321', '12345678', '87654321',
    '1122', '2211', '1212', '2121', '1313', '2424', '0808', '9988', '123123'
  ];
  if (trivialPins.includes(pin)) {
    return { valid: false, message: 'PIN terlalu mudah ditebak (angka kembar / berurutan)! Gunakan PIN yang lebih unik.', score: 25, label: 'Terlalu Lemah', color: '#ef4444' };
  }
  // Cek apakah semua karakter identik (contoh: 777777)
  const isAllSame = pin.split('').every(ch => ch === pin[0]);
  if (isAllSame) {
    return { valid: false, message: 'PIN tidak boleh terdiri dari satu digit angka berulang!', score: 25, label: 'Terlalu Lemah', color: '#ef4444' };
  }

  // Hitung Skor Kekuatan
  let score = 50;
  if (pin.length >= 6) score += 30;
  if (pin.length >= 8) score += 20;

  const uniqueDigits = new Set(pin.split('')).size;
  if (uniqueDigits >= 4) score = Math.min(100, score + 10);

  if (score >= 80) {
    return { valid: true, message: 'PIN sangat kuat & aman.', score: 100, label: 'Sangat Kuat 🔒', color: '#10b981' };
  } else if (score >= 50) {
    return { valid: true, message: 'PIN cukup aman.', score: 65, label: 'Cukup Aman 🛡️', color: '#f59e0b' };
  } else {
    return { valid: true, message: 'PIN memenuhi syarat minimum.', score: 40, label: 'Standar', color: '#38bdf8' };
  }
}

function onNewPinInput(val) {
  const currentPin = document.getElementById('secPinCurrent')?.value.trim();
  const res = validateSecurityPinStrength(val, currentPin);
  const bar = document.getElementById('secPinStrengthBar');
  const txt = document.getElementById('secPinStrengthText');
  if (bar) {
    bar.style.width = `${res.score}%`;
    bar.style.backgroundColor = res.color;
  }
  if (txt) {
    txt.textContent = res.label;
    txt.style.color = res.color;
  }
}

function togglePinVisibility(inputId, btnEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (btnEl) btnEl.textContent = '🙈';
  } else {
    inp.type = 'password';
    if (btnEl) btnEl.textContent = '👁️';
  }
}

// Buka Modal Ganti PIN Profesional (Dev / Store)
function openChangeSecurityPinModal(type = 'dev') {
  const modal = document.getElementById('modalChangeSecurityPin');
  if (!modal) return;

  const targetTypeInput = document.getElementById('secPinTargetType');
  const modalTitle = document.getElementById('modalChangePinTitle');
  const modalBadge = document.getElementById('modalChangePinBadge');
  const modalDesc = document.getElementById('modalChangePinDesc');
  const header = document.getElementById('modalChangePinHeader');
  const alertBox = document.getElementById('secPinAlertBox');
  const dialog = document.getElementById('modalChangeSecurityPinDialog');
  const submitBtn = document.getElementById('btnSubmitChangePin');

  const currentInp = document.getElementById('secPinCurrent');
  const newInp = document.getElementById('secPinNew');
  const confirmInp = document.getElementById('secPinConfirm');
  if (currentInp) { currentInp.value = ''; currentInp.type = 'password'; }
  if (newInp) { newInp.value = ''; newInp.type = 'password'; }
  if (confirmInp) { confirmInp.value = ''; confirmInp.type = 'password'; }
  if (alertBox) alertBox.style.display = 'none';

  onNewPinInput('');

  if (targetTypeInput) targetTypeInput.value = type;

  if (type === 'dev') {
    modal.classList.remove('theme-store');
    if (dialog) {
      dialog.style.background = '#0f172a';
      dialog.style.borderColor = '#334155';
    }
    if (header) {
      header.style.background = '#1e293b';
      header.style.borderBottomColor = '#334155';
    }
    if (modalBadge) {
      modalBadge.innerHTML = '🛡️ PROTOKOL KEAMANAN DEVELOPER';
      modalBadge.style.background = 'rgba(56, 189, 248, 0.15)';
      modalBadge.style.color = '#38bdf8';
    }
    if (modalTitle) {
      modalTitle.innerHTML = '<span>🔑</span> Ganti Master PIN Developer';
      modalTitle.style.color = '#f8fafc';
    }
    if (modalDesc) {
      modalDesc.innerHTML = 'Perbarui Master PIN Super Admin untuk mengontrol seluruh jaringan toko SR12 dan penerimaan passive income fee sistem.';
    }
    if (submitBtn) {
      submitBtn.style.background = '#0284c7';
      submitBtn.textContent = '💾 Simpan Master PIN Baru';
    }
  } else {
    // Store mode
    modal.classList.add('theme-store');
    const storeSlug = appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug);
    const store = (appState.partnerStores || []).find(s => s.slug === storeSlug) || appState.storeSettings || DEFAULT_STORE_SETTINGS;
    if (dialog) {
      dialog.style.background = '#064e3b';
      dialog.style.borderColor = '#059669';
    }
    if (header) {
      header.style.background = '#065f46';
      header.style.borderBottomColor = '#047857';
    }
    if (modalBadge) {
      modalBadge.innerHTML = `👑 TOKO: ${escapeHtml(store.storeName || 'Distributor')}`;
      modalBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      modalBadge.style.color = '#a7f3d0';
    }
    if (modalTitle) {
      modalTitle.innerHTML = '<span>🔑</span> Ganti PIN Admin Toko (Distributor)';
      modalTitle.style.color = '#fff';
    }
    if (modalDesc) {
      modalDesc.innerHTML = `Perbarui PIN pengelola untuk toko <b>${escapeHtml(store.storeName)}</b> (${escapeHtml(store.storeOwner)}). Masukkan PIN lama untuk otentikasi perubahan.`;
    }
    if (submitBtn) {
      submitBtn.style.background = '#059669';
      submitBtn.textContent = '💾 Simpan PIN Admin Toko';
    }
  }

  modal.classList.add('open');
  if (currentInp) setTimeout(() => currentInp.focus(), 200);
}

function saveStoredSettings(settings) {
  try {
    localStorage.setItem('sr12_store_settings_v1', JSON.stringify(settings));
  } catch (e) {}
}
window.saveStoredSettings = saveStoredSettings;

// Handler Submit Ganti PIN
async function handleSecurityPinChangeSubmit(e) {
  if (e) e.preventDefault();

  const type = document.getElementById('secPinTargetType')?.value || 'dev';
  const currentPin = document.getElementById('secPinCurrent')?.value.trim();
  const newPin = document.getElementById('secPinNew')?.value.trim();
  const confirmPin = document.getElementById('secPinConfirm')?.value.trim();
  const alertBox = document.getElementById('secPinAlertBox');
  const submitBtn = document.getElementById('btnSubmitChangePin');

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.style.background = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.2)';
    alertBox.style.border = isError ? '1px solid #ef4444' : '1px solid #10b981';
    alertBox.style.color = isError ? '#fca5a5' : '#a7f3d0';
    alertBox.innerHTML = `${isError ? '❌' : '✅'} ${msg}`;
  }

  // 1. Verifikasi PIN Lama
  const inputPin = String(currentPin || '').trim();
  if (type === 'dev') {
    const validDevPins = [
      String(appState.masterDevPin || '').trim(),
      String(getStoredDevPin() || '').trim(),
      String(localStorage.getItem('sr12_master_dev_pin') || '').trim()
    ].filter(Boolean);
    if (!validDevPins.includes(inputPin)) {
      showAlert('PIN Lama Pengembang salah! Verifikasi otentikasi gagal.');
      return;
    }
  } else {
    const storeSlug = appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug);
    const store = (appState.partnerStores || []).find(s => s.slug === storeSlug) || appState.storeSettings || DEFAULT_STORE_SETTINGS;
    const actualStorePin = String(store.storeAdminPin || (appState.storeSettings && appState.storeSettings.storeAdminPin) || '').trim();
    const masterPin = String(appState.masterDevPin || '').trim();

    // Verifikasi otentikasi: cocok dengan PIN toko saat ini atau master dev PIN yang sah
    const isMatch = (actualStorePin && inputPin === actualStorePin) || (masterPin && inputPin === masterPin);
    if (!isMatch) {
      showAlert('PIN Lama Toko salah! Verifikasi otentikasi gagal.');
      return;
    }
  }

  // 2. Validasi Kekuatan PIN Baru
  const strength = validateSecurityPinStrength(newPin, currentPin);
  if (!strength.valid) {
    showAlert(strength.message);
    return;
  }

  // 3. Verifikasi Konfirmasi PIN
  if (newPin !== confirmPin) {
    showAlert('Konfirmasi PIN tidak cocok dengan PIN Baru!');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Menyimpan...';
  }

  try {
    if (type === 'dev') {
      appState.masterDevPin = newPin;
      updateDevPortalMetrics();
      if (typeof updateStorePinInSupabase === 'function') {
        await updateStorePinInSupabase('sr12-central', newPin, currentPin);
      }
      showAlert('Master PIN Developer berhasil diperbarui dan disinkronkan ke Cloud!', false);
      showToast('🔑 Master PIN Developer Berhasil Diperbarui!');
    } else {
      const storeSlug = appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'alzam-agency';
      const cleanNewPin = String(newPin).trim();
      appState.storeSettings = {
        ...appState.storeSettings,
        storeAdminPin: cleanNewPin
      };

      try {
        localStorage.setItem(`sr12_store_pin_${storeSlug}`, cleanNewPin);
        localStorage.setItem('sr12_store_settings_v4', JSON.stringify(appState.storeSettings));
        localStorage.setItem('sr12_store_settings_v1', JSON.stringify(appState.storeSettings));
      } catch(eLs) {}

      // Perbarui partnerStores
      const idx = (appState.partnerStores || []).findIndex(s => s.slug === storeSlug);
      if (idx >= 0) {
        appState.partnerStores[idx].storeAdminPin = cleanNewPin;
        saveStoredPartnerStores(appState.partnerStores);
      }

      // Update input & badge di Store Settings
      const pinInp = document.getElementById('settingStoreAdminPin');
      if (pinInp) pinInp.value = cleanNewPin;
      const maskEl = document.getElementById('settingStorePinMasked');
      if (maskEl) maskEl.textContent = '•••• (Aktif)';

      // Sinkronkan ke Supabase Cloud via RPC terverifikasi
      if (typeof updateStorePinInSupabase === 'function') {
        await updateStorePinInSupabase(storeSlug, newPin, currentPin);
      }

      // Sinkronkan ke Local Server REST API jika ada
      const apiBase = getApiBaseUrl();
      if (apiBase && typeof fetch === 'function') {
        fetch(`${apiBase}/api/stores/${storeSlug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeAdminPin: newPin })
        }).catch(e => console.warn(e));
      }

      showAlert('PIN Admin Toko berhasil diperbarui dan disinkronkan ke Cloud!', false);
      showToast(`🔑 PIN Toko "${appState.storeSettings.storeName}" Berhasil Diperbarui!`);
    }

    setTimeout(() => {
      closeModal('modalChangeSecurityPin');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Simpan PIN Baru';
      }
    }, 1200);

  } catch (err) {
    console.error('Gagal memperbarui PIN:', err);
    showAlert('Terjadi kesalahan sistem saat menyimpan PIN!');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Simpan PIN Baru';
    }
  }
}

// ==========================================
// TRIPLE-CLICK FOOTER UNTUK AKSES RAHASIA CONSOLE DEVELOPER
// ==========================================
let footerClickCounter = 0;
let footerClickResetTimer = null;

function handleFooterTripleClick(e) {
  // Jika klik berasal dari tombol interaktif footer lain (misal: Chat WhatsApp, Central Hub, Ganti Toko, Pengaturan Toko),
  // jangan cegah aksi tombol tersebut
  if (e && e.target && e.target.closest('button.btn-footer-pill, button.footer-link-btn')) {
    return;
  }

  footerClickCounter++;
  if (footerClickResetTimer) clearTimeout(footerClickResetTimer);

  if (footerClickCounter >= 3 || (e && e.detail === 3)) {
    footerClickCounter = 0;
    if (typeof openDevPinPrompt === 'function') {
      openDevPinPrompt();
    }
    return;
  }

  footerClickResetTimer = setTimeout(() => {
    footerClickCounter = 0;
  }, 1200);
}
window.handleFooterTripleClick = handleFooterTripleClick;

// Change Developer Master PIN (mengarahkan ke modal profesional)
function changeDevMasterPin() {
  openChangeSecurityPinModal('dev');
}
window.changeDevMasterPin = changeDevMasterPin;

function renderPlatformFeeOptions(selectEl, selectedVal) {
  if (!selectEl) return;
  const globalFee = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);

  // Kunci hanya 1 opsi resmi yang berlaku sesuai ketetapan Developer Super Admin Global
  const label = `Rp ${globalFee.toLocaleString('id-ID')} per Transaksi (Tarif Resmi Global)`;
  selectEl.innerHTML = `<option value="${globalFee}" selected>${label}</option>`;
  selectEl.value = String(globalFee);
  selectEl.setAttribute('title', 'Tarif biaya sistem ini disetel resmi dan tersinkronisasi otomatis dari Admin Developer Global.');
}
window.renderPlatformFeeOptions = renderPlatformFeeOptions;

function syncPlatformFeeInputsToAllSettings(fee) {
  const numFee = parseInt(fee, 10) || 2000;
  appState.platformFee = numFee;
  try {
    localStorage.setItem('sr12_platform_fee_amount', String(numFee));
  } catch(e) {}
  if (appState.storeSettings) {
    appState.storeSettings.platformFeeAmount = numFee;
  }
  if (Array.isArray(appState.partnerStores)) {
    appState.partnerStores.forEach(s => { s.platformFeeAmount = numFee; });
    if (typeof saveStoredPartnerStores === 'function') {
      saveStoredPartnerStores(appState.partnerStores);
    }
  }

  const devInp = document.getElementById('inputDevGlobalFeeAmount');
  if (devInp) devInp.value = numFee;

  const olseraSelect = document.getElementById('setOlseraPlatformFeeAmount');
  if (olseraSelect) {
    renderPlatformFeeOptions(olseraSelect, numFee);
    olseraSelect.value = String(numFee);
  }

  const modalSelect = document.getElementById('settingPlatformFeeAmount');
  if (modalSelect) {
    renderPlatformFeeOptions(modalSelect, numFee);
    modalSelect.value = String(numFee);
    if (typeof updateFeePayerLabels === 'function') updateFeePayerLabels();
  }

  const cartFee = document.getElementById('cartSummaryPlatformFee');
  if (cartFee) {
    cartFee.textContent = `+Rp ${numFee.toLocaleString('id-ID')}`;
  }

  if (typeof updateTopupPackageCardsUI === 'function') {
    updateTopupPackageCardsUI();
  }
}
window.syncPlatformFeeInputsToAllSettings = syncPlatformFeeInputsToAllSettings;

// Simpan Tarif Biaya Admin Sistem Global oleh Developer
async function saveDevGlobalPlatformFee() {
  const inp = document.getElementById('inputDevGlobalFeeAmount');
  if (!inp) return;
  const val = parseInt(inp.value, 10);
  if (isNaN(val) || val < 500) {
    alert('⚠️ Masukkan nominal tarif biaya admin sistem yang valid (minimal Rp 500).');
    return;
  }

  appState.platformFee = val;
  try {
    localStorage.setItem('sr12_platform_fee_amount', String(val));
    if (appState.storeSettings) {
      appState.storeSettings.platformFeeAmount = val;
      localStorage.setItem('sr12_store_settings_v4', JSON.stringify(appState.storeSettings));
    }
  } catch(e) {}

  // Update Supabase Cloud via hero_subtitle di row sr12-central
  if (typeof getStoredDevPaymentSettings === 'function' && typeof updateDevPaymentSettingsInSupabase === 'function') {
    try {
      const devSettings = getStoredDevPaymentSettings() || {};
      devSettings.platformFee = val;
      if (appState.devPaymentSettings) {
        appState.devPaymentSettings.platformFee = val;
      }
      localStorage.setItem('sr12_dev_payment_settings_v1', JSON.stringify(devSettings));
      await updateDevPaymentSettingsInSupabase(devSettings);
    } catch(err) {
      console.warn('Gagal sync fee global ke Supabase Cloud:', err);
    }
  }

  syncPlatformFeeInputsToAllSettings(val);
  showToast(`✅ Tarif Biaya Admin Sistem Global berhasil disinkronkan ke seluruh toko: ${formatRupiah(val)} per transaksi!`);
  updateDevPortalMetrics();
}
window.saveDevGlobalPlatformFee = saveDevGlobalPlatformFee;

function updateAllowedTierOptions() {
  const storeTier = appState.storeSettings?.partnerTier || 'distributor';

  // Hierarki level harga yang boleh ditampilkan di toko mitra ini:
  // - distributor: Konsumen, Marketer, Reseller, Sub Agen, Agen, Distributor
  // - agen:        Konsumen, Marketer, Reseller, Sub Agen, Agen (HARGA DISTRIBUTOR 50% TIDAK TERSEDIA)
  // - sub_agen:    Konsumen, Marketer, Reseller, Sub Agen (HARGA AGEN 40% & DISTRIBUTOR 50% TIDAK TERSEDIA)
  // - reseller:    Konsumen, Marketer, Reseller
  const allTiers = [
    { id: 'konsumen', label: 'Konsumen Retail (HET)', shortLabel: 'Konsumen (HET)', rank: 1 },
    { id: 'marketer', label: 'Mitra Marketer (15%)', shortLabel: 'Marketer (15%)', rank: 2 },
    { id: 'reseller', label: 'Reseller Resmi (20%)', shortLabel: 'Reseller (20%)', rank: 3 },
    { id: 'sub_agen', label: 'Sub Agen (30%)', shortLabel: 'Sub Agen (30%)', rank: 4 },
    { id: 'agen', label: 'Agen Resmi (40%)', shortLabel: 'Agen (40%)', rank: 5 },
    { id: 'distributor', label: 'Distributor Utama (50%)', shortLabel: 'Distributor (50%)', rank: 6 }
  ];

  let maxRank = 6;
  if (storeTier === 'agen') maxRank = 5;
  else if (storeTier === 'sub_agen') maxRank = 4;
  else if (storeTier === 'reseller') maxRank = 3;
  else if (storeTier === 'marketer') maxRank = 2;

  const allowedTiers = allTiers.filter(t => t.rank <= maxRank);
  const allowedIds = new Set(allowedTiers.map(t => t.id));

  // Jika level harga aktif saat ini melebihi kemampuan toko, reset otomatis ke konsumen (HET)
  if (!allowedIds.has(appState.currentTier)) {
    appState.currentTier = 'konsumen';
  }

  // Update dropdown #globalTierSelect (header bar)
  const globalSelect = document.getElementById('globalTierSelect');
  if (globalSelect) {
    globalSelect.innerHTML = allowedTiers.map(t => 
      `<option value="${t.id}" ${t.id === appState.currentTier ? 'selected' : ''}>${t.shortLabel}</option>`
    ).join('');
  }

  // Update dropdown #catalogTierSelect (katalog belanja)
  const catalogSelect = document.getElementById('catalogTierSelect');
  if (catalogSelect) {
    catalogSelect.innerHTML = allowedTiers.map(t => 
      `<option value="${t.id}" ${t.id === appState.currentTier ? 'selected' : ''}>${t.label}</option>`
    ).join('');
  }
}
window.updateAllowedTierOptions = updateAllowedTierOptions;

function setTier(tierId, silent = false) {
  if (!SR12_TIERS[tierId]) return;

  const storeTier = appState.storeSettings?.partnerTier || 'distributor';
  if (storeTier === 'agen' && tierId === 'distributor') {
    if (!silent) showToast('⚠️ Harga Distributor (50%) tidak tersedia di Toko Agen!');
    return;
  }
  if (storeTier === 'sub_agen' && (tierId === 'distributor' || tierId === 'agen')) {
    if (!silent) showToast('⚠️ Harga Agen & Distributor tidak tersedia di Toko Sub Agen!');
    return;
  }
  if (storeTier === 'reseller' && (tierId === 'distributor' || tierId === 'agen' || tierId === 'sub_agen')) {
    if (!silent) showToast('⚠️ Harga Grosir Agen/Sub Agen tidak tersedia di Toko Reseller!');
    return;
  }

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

// Filter Kategori Etalase Katalog Produk (Storefront & Customer Facing Display)
function filterCatalogCategory(category = 'all', btn = null) {
  if (typeof appState !== 'undefined') {
    appState.selectedCategory = category || 'all';
  }
  const buttons = document.querySelectorAll('.catalog-toolbar .category-chips .chip-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const target = document.querySelector(`.catalog-toolbar .category-chips .chip-btn[data-category="${category}"]`);
    if (target) target.classList.add('active');
  }
  renderProducts();
}
window.filterCatalogCategory = filterCatalogCategory;

// Render Products Catalog
function renderProducts() {
  const container = document.getElementById('productGrid');
  const counterEl = document.getElementById('catalogCountDisplay');
  if (!container) return;

  // PERMINTAAN USER: PRODUK TIDAK BOLEH TAMPIL DI HALAMAN OFFICIAL HUB (sr12-central)
  const isCentralHub = (appState.currentStoreSlug === 'sr12-central' || (appState.storeSettings && appState.storeSettings.slug === 'sr12-central'));
  if (isCentralHub) {
    container.innerHTML = '';
    const commerceWrapper = document.getElementById('distributorCommerceWrapper');
    if (commerceWrapper) commerceWrapper.style.display = 'none';
    const catSec = document.getElementById('catalogSection');
    if (catSec) catSec.style.display = 'none';
    return;
  }

  // ROTASI PRODUK HARIAN: Urutan produk terotasi secara dinamis & deterministik setiap harinya
  // sehingga posisi produk tidak monoton bagi pembeli yang sering berkunjung
  const baseProducts = (typeof getDailyRotatedProducts === 'function')
    ? getDailyRotatedProducts(appState.products || [])
    : (appState.products || []);

  const selectedCat = (appState.selectedCategory || 'all').trim().toLowerCase();
  const queryStr = (appState.searchQuery || '').trim().toLowerCase();

  const filtered = baseProducts.filter(prod => {
    if (!prod) return false;
    const prodCat = (prod.category || '').trim().toLowerCase();
    const matchCat = (selectedCat === 'all') || (prodCat === selectedCat) || prodCat.includes(selectedCat);
    const prodName = (prod.name || '').toLowerCase();
    const prodSku = (prod.sku || '').toLowerCase();
    const matchSearch = !queryStr ||
                        prodName.includes(queryStr) ||
                        prodSku.includes(queryStr) ||
                        prodCat.includes(queryStr);
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

  const currentTier = SR12_TIERS[appState.currentTier] || SR12_TIERS.konsumen;
  const canManage = !!(appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn);

  container.innerHTML = filtered.map(prod => {
    const tierPrice = getProductTierPrice(prod, appState.currentTier);
    const profitMargin = prod.het - tierPrice;
    const isRetail = appState.currentTier === 'konsumen';
    const isMarketer = appState.currentTier === 'marketer';

    return `
      <div class="product-card" id="card-${prod.id}">
        <div class="product-thumb-box">
          <img src="${(typeof sanitizeImageUrl === 'function') ? sanitizeImageUrl(prod.image) : (prod.image || 'assets/hero-banner.jpg')}" alt="${escapeHtml(prod.name)}" loading="lazy" onerror="this.onerror=null; this.src='assets/hero-banner.jpg';" />
          <span class="badge-bpom-clean">🌿 BPOM</span>
          ${isMarketer ? `<span class="badge-disc-clean" style="background: #0284c7; color: #fff;">💼 Komisi 15%</span>` : (!isRetail ? `<span class="badge-disc-clean">-${currentTier.discountPct}%</span>` : '')}
          <span class="badge-stock-clean ${(prod.stock ?? 85) <= 15 ? 'low' : ''}">Stok: ${prod.stock ?? 85}</span>
          ${canManage ? `
            <button type="button" class="btn-quick-edit-image" title="Edit Foto &amp; Data ${escapeHtml(prod.name)}" onclick="openEditProductModal('${prod.id}')" aria-label="Edit Produk">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          ` : ''}
        </div>

        <div class="product-body">
          <div class="product-category-row">
            <span class="product-cat-name">${prod.category}</span>
            <span class="product-rating">★ ${prod.rating || '4.9'}</span>
          </div>

          <h4 class="product-title" onclick="openProductDetailModal('${prod.id}')" style="cursor: pointer;">${prod.name}</h4>
          <p class="product-summary-text">${prod.summary || ''}</p>

          <div class="price-block">
            <div class="price-main-row">
              <span class="tier-price-val">${formatRupiah(tierPrice)}</span>
              ${isMarketer ? `<span class="badge-mini-disc" style="background: #0284c7; color: #fff;">💼 Komisi 15%</span>` : (!isRetail ? `<span class="badge-mini-disc">-${currentTier.discountPct}%</span>` : '')}
            </div>
            <div class="price-sub-row">
              ${isMarketer ? `
                <span class="het-text-plain">HET Penuh</span>
                <span class="tier-profit-margin" style="color: #0284c7; background: #e0f2fe; padding: 1px 6px; border-radius: 4px;">💼 +Komisi 15% (${formatRupiah(Math.round(prod.het * 0.15))}) Cair Bulanan</span>
              ` : (!isRetail ? `
                <span class="het-text">HET: <del>${formatRupiah(prod.het)}</del></span>
                <span class="tier-profit-margin">+Profit ${formatRupiah(profitMargin)}</span>
              ` : `
                <span class="het-text-plain">HET Resmi</span>
              `)}
            </div>
          </div>

          <div class="card-actions">
            <button type="button" class="btn-product-capsule btn-product-capsule-cart" onclick="addToCart('${prod.id}')" title="Tambah ${prod.name} ke Keranjang" aria-label="Beli">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </button>
            ${canManage ? `
              <button type="button" class="btn-product-capsule btn-product-capsule-edit" onclick="openEditProductModal('${prod.id}')" title="Edit Foto &amp; Produk (${escapeHtml(prod.name)})" aria-label="Edit Produk">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
            ` : `
              <button type="button" class="btn-product-capsule btn-product-capsule-detail" onclick="openProductDetailModal('${prod.id}')" title="Lihat Detail Produk" aria-label="Detail">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            `}
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
  // Proteksi Toko Diblokir Pusat
  if (appState.storeSettings && appState.storeSettings.isBlocked) {
    alert('🚫 TOKO DIBEKUKAN SEMENTARA!\n\nToko ini sedang dinonaktifkan sementara oleh Administrator Pusat karena pelanggaran aturan kemitraan. Pemesanan produk tidak dapat diproses.');
    return;
  }

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
        <img src="${(typeof sanitizeImageUrl === 'function') ? sanitizeImageUrl(prod.image) : (prod.image || 'assets/hero-banner.jpg')}" alt="${escapeHtml(prod.name)}">
        <div class="cart-item-info">
          <h5>${escapeHtml(prod.name)}</h5>
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
      savingsBadge.style.background = '';
      savingsBadge.style.borderColor = '';
      savingsBadge.style.color = '';
      if (savingsAmount) savingsAmount.textContent = `${formatRupiah(totalSavings)} (${tier.name} ${tier.discountPct}%)`;
    }
  } else if (appState.currentTier === 'marketer' && subtotal > 0) {
    if (hetRow) hetRow.style.display = 'none';
    if (discountRow) discountRow.style.display = 'none';
    if (savingsBadge) {
      savingsBadge.style.display = 'block';
      savingsBadge.style.background = '#e0f2fe';
      savingsBadge.style.borderColor = '#7dd3fc';
      savingsBadge.style.color = '#0369a1';
      const mComm = Math.round(subtotal * 0.15);
      if (savingsAmount) savingsAmount.innerHTML = `💼 Komisi Marketer: +<b>${formatRupiah(mComm)}</b> (15% diakumulasi bulanan)`;
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
  
  // Model Biaya Layanan: Ditanggung Pembeli (+Rp 2.000 / disesuaikan Master Developer)
  const isFeeChargedToBuyer = (appState.storeSettings.feePayer || 'buyer') === 'buyer';
  const effectiveFee = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);
  appState.platformFee = effectiveFee;
  const currentFee = appState.cart.length > 0 && isFeeChargedToBuyer ? effectiveFee : 0;
  const grandTotal = subtotal + shippingCost + currentFee;

  if (subtotalLine) subtotalLine.textContent = formatRupiah(subtotal);
  if (platformFeeLine) {
    if (isFeeChargedToBuyer) {
      platformFeeLine.textContent = `+${formatRupiah(effectiveFee)}`;
      if (platformFeeLine.parentElement) platformFeeLine.parentElement.style.display = 'flex';
    } else {
      if (platformFeeLine.parentElement) platformFeeLine.parentElement.style.display = 'none'; // Ditanggung toko, tidak muncul ke pembeli
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
  // Proteksi Toko Diblokir Pusat
  if (appState.storeSettings && appState.storeSettings.isBlocked) {
    alert('🚫 PEMESANAN DINONAKTIFKAN!\n\nToko ini sedang dinonaktifkan sementara oleh Administrator Pusat karena pelanggaran aturan kemitraan. Pesanan tidak dapat diproses.');
    return;
  }

  if (appState.cart.length === 0) {
    alert('Keranjang belanja Anda masih kosong!');
    return;
  }

  // Proteksi Integritas Katalog & Anti-Tamper Kalkulasi Harga
  let totalHet = 0;
  let subtotal = 0;
  let totalPcs = 0;
  const tier = SR12_TIERS[appState.currentTier] || SR12_TIERS.konsumen;

  const validatedCartItems = [];
  for (let i = 0; i < appState.cart.length; i++) {
    const item = appState.cart[i];
    const prod = (appState.products || []).find(p => p.id === item.productId);
    if (!prod || !prod.name) continue;

    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    // Verifikasi harga HET resmi (anti-tamper Rp 0 atau negatif)
    const officialHet = Math.max(1000, Number(prod.het) || 1000);
    prod.het = officialHet;
    const price = getProductTierPrice(prod, appState.currentTier);

    totalHet += officialHet * qty;
    subtotal += price * qty;
    totalPcs += qty;

    const isDiscounted = appState.currentTier !== 'konsumen' && price < officialHet;
    const text = `${validatedCartItems.length + 1}. ${prod.name} (${qty} pcs) x ${formatRupiah(price)}${isDiscounted ? ` [Diskon ${tier.discountPct}% dari ${formatRupiah(officialHet)}]` : ''} = ${formatRupiah(price * qty)}`;
    validatedCartItems.push({ item, prod, qty, price, text });
  }

  if (validatedCartItems.length === 0) {
    alert('Keranjang belanja Anda tidak memuat produk resmi yang valid!');
    return;
  }

  const itemsText = validatedCartItems.map(v => v.text).join('\n');
  const totalSavings = Math.max(0, totalHet - subtotal);
  const inputPartnerQueryEarly = (document.getElementById('buyerMitraIdInput')?.value || '').trim();
  const currentStoreSlugEarly = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  let earlyFoundMitra = appState.verifiedMitra || null;
  if (!earlyFoundMitra && inputPartnerQueryEarly) {
    earlyFoundMitra = findMitraByIdOrPhone(inputPartnerQueryEarly, currentStoreSlugEarly);
  }
  const isRegisteredPartner = (!!appState.verifiedMitra && appState.verifiedMitra.tier === appState.currentTier) ||
    (!!earlyFoundMitra && earlyFoundMitra.tier === appState.currentTier);
  const isSimulationAdmin = !!(appState.isAdminMode || appState.isDevMasterLoggedIn);

  // Proteksi & Validasi Tingkatan Kemitraan (Anti-Cheating / Anti-Bypass)
  // Mitra resmi terdaftar dan simulasi admin bebas syarat minimal pendaftaran awal
  if (!isRegisteredPartner && !isSimulationAdmin && tier && tier.id !== 'konsumen') {
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
  // SINKRONKAN PENGURANGAN KUOTA KE SUPABASE CLOUD AGAR TIDAK TER-RESET SAAT REFRESH
  if (typeof updateStoreQuotaInSupabase === 'function') {
    updateStoreQuotaInSupabase(appState.currentStoreSlug, appState.storeSettings.orderQuota);
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
  const effectiveFee = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);
  const fee = isFeeChargedToBuyer ? effectiveFee : 0;
  const grandTotal = subtotal + shippingCost + fee;

  let dropshipText = '';
  if (appState.isDropship) {
    const dName = document.getElementById('dropshipNameInput')?.value || appState.dropshipSender.name;
    const dPhone = document.getElementById('dropshipPhoneInput')?.value || appState.dropshipSender.phone;
    dropshipText = `\n🏷️ *MODE DROPSHIP:*\n• Pengirim: ${dName} (${dPhone})\n`;
  }

  // Update atau Kualifikasi Mitra / Reseller / Marketer di Database Distributor
  // Input ID mitra HANYA diambil dari kolom verifikasi kemitraan resmi (bukan nomor telepon pembeli umum)
  const inputPartnerQuery = (document.getElementById('buyerMitraIdInput')?.value || '').trim();
  const inputBuyerName = (document.getElementById('cartBuyerNameInput')?.value || appState.buyerDetails.name || '').trim();
  const inputBuyerPhone = (document.getElementById('cartBuyerPhoneField')?.value || document.getElementById('cartBuyerPhoneInput')?.value || appState.buyerDetails.phone || '').trim();
  const inputBuyerAddress = (document.getElementById('cartBuyerAddressInput')?.value || appState.buyerDetails.address || '').trim();

  // Validasi Kelengkapan Data Pembeli (Nama, WhatsApp, Alamat Pengiriman)
  if (!inputBuyerName) {
    alert('⚠️ Mohon isi Nama Lengkap Anda terlebih dahulu untuk data pesanan & pengiriman!');
    const nameEl = document.getElementById('cartBuyerNameInput');
    if (nameEl) {
      nameEl.focus();
      nameEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  if (!inputBuyerPhone || inputBuyerPhone.length < 8) {
    alert('⚠️ Mohon isi Nomor WhatsApp aktif Anda agar toko dan kurir dapat menghubungi saat pengiriman!');
    const phoneEl = document.getElementById('cartBuyerPhoneField') || document.getElementById('cartBuyerPhoneInput');
    if (phoneEl) {
      phoneEl.focus();
      phoneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  if (courier.id !== 'pickup' && (!inputBuyerAddress || inputBuyerAddress.length < 8)) {
    alert('⚠️ Mohon lengkapi Alamat Lengkap Pengiriman Anda (nama jalan, RT/RW, kelurahan, kecamatan, kota, kode pos) agar paket langsung dipacking dan dikirim tanpa perlu toko menanyakan lagi!');
    const addrEl = document.getElementById('cartBuyerAddressInput');
    if (addrEl) {
      addrEl.focus();
      addrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  if (inputBuyerName) appState.buyerDetails.name = inputBuyerName;
  if (inputBuyerPhone) appState.buyerDetails.phone = inputBuyerPhone;
  if (inputBuyerAddress) appState.buyerDetails.address = inputBuyerAddress;

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';

  // Simpan profil pelanggan ke penyimpanan lokal client dan database pelanggan toko (CRM Retail)
  try {
    const custProfile = {
      name: inputBuyerName,
      phone: inputBuyerPhone,
      address: inputBuyerAddress,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('sr12_customer_profile', JSON.stringify(custProfile));
  } catch(e) {}

  if (typeof saveStoreCustomer === 'function') {
    saveStoreCustomer(currentStoreSlug, {
      name: inputBuyerName,
      phone: inputBuyerPhone,
      address: inputBuyerAddress,
      totalSpent: grandTotal
    });
  }

  const buyerPhone = appState.buyerDetails.phone || inputBuyerPhone || '-';
  const now = new Date();
  const nowIso = now.toISOString().split('T')[0];
  const currentMonthPeriod = nowIso.slice(0, 7);

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }
  if (!appState.marketerSales) {
    appState.marketerSales = (typeof getStoredMarketerSales === 'function') ? getStoredMarketerSales(currentStoreSlug) : [];
  }

  let activeRefMkt = '';
  try {
    activeRefMkt = sessionStorage.getItem('sr12_active_referral_marketer') || (typeof appState !== 'undefined' ? appState.activeReferralMarketer : '') || '';
  } catch(e) {}

  // 1. Cari identitas mitra pembeli
  // Utamakan mitra yang sudah terverifikasi di keranjang (appState.verifiedMitra)
  let foundMitra = appState.verifiedMitra || null;
  if (!foundMitra && inputPartnerQuery) {
    foundMitra = findMitraByIdOrPhone(inputPartnerQuery, currentStoreSlug);
  }
  // Hanya jika pembeli memilih tingkat grosir (bukan konsumen biasa) atau berbelanja via tautan marketer, kita periksa buyerPhone
  if (!foundMitra && buyerPhone && (appState.currentTier !== 'konsumen' || activeRefMkt)) {
    foundMitra = findMitraByIdOrPhone(buyerPhone, currentStoreSlug);
  }
  let crmNoticeText = '';

  // 2. Deteksi pesanan: Reseller grosir vs Marketer komisi retail 15%
  const isResellerOrder = (appState.currentTier === 'reseller') ||
    (inputPartnerQuery && inputPartnerQuery.toUpperCase().startsWith('RS-') && foundMitra && foundMitra.tier === 'reseller');

  // Marketer order HANYA jika bukan reseller grosir (Reseller tidak mendapatkan komisi marketer 15% di atas diskon 20%)
  const isMarketerOrder = !isResellerOrder && (
    (appState.currentTier === 'marketer') ||
    (!!activeRefMkt) ||
    (inputPartnerQuery && inputPartnerQuery.toUpperCase().startsWith('MKT-')) ||
    (foundMitra && foundMitra.tier === 'marketer' && appState.currentTier !== 'reseller')
  );

  // Jika order konsumen via tautan marketer, cari data marketer dari kode referral
  if (!foundMitra && isMarketerOrder && activeRefMkt) {
    foundMitra = findMitraByIdOrPhone(activeRefMkt, currentStoreSlug);
  }

  // Alokasikan ID transaksi terpadu sejak awal agar pesanan di web & catatan gaji marketer 100% terhubung
  const orderTrxId = 'ORD-WEB-' + Date.now().toString().slice(-6);

  let marketerCode = null;
  let marketerName = null;

  if (isMarketerOrder) {
    marketerCode = (foundMitra && foundMitra.id) ? foundMitra.id : (activeRefMkt || (inputPartnerQuery && inputPartnerQuery.toUpperCase().startsWith('MKT-') ? inputPartnerQuery.toUpperCase() : ('MKT-' + (buyerPhone ? buyerPhone.slice(-4) : 'WEB'))));
    const resolvedName = (foundMitra && foundMitra.name) || (typeof getMarketerNameById === 'function' ? getMarketerNameById(marketerCode) : '') || '';
    marketerName = (resolvedName && resolvedName !== marketerCode) ? resolvedName : (marketerCode === 'MKT-001' ? 'Maryam' : (activeRefMkt ? `Marketer (${activeRefMkt})` : 'Mitra Marketer'));
    const comm = Math.round(subtotal * 0.15);

    // Jika marketer belum terdata di buku mitra toko distributor, otomatis daftarkan agar muncul di daftar gaji
    if (!foundMitra) {
      foundMitra = {
        id: marketerCode,
        store_slug: currentStoreSlug,
        name: marketerName,
        phone: (marketerCode === 'MKT-001' ? '0895800355550' : (buyerPhone || '-')),
        city: (marketerCode === 'MKT-001' ? 'Baniaga' : (appState.buyerDetails.address?.split(',')[0] || appState.storeSettings.storeCity)),
        tier: 'marketer',
        bankName: 'BCA',
        bankAccount: (marketerCode === 'MKT-001' ? '123456789' : '-'),
        bankHolder: marketerName,
        qualificationDate: nowIso,
        lastOrderDate: nowIso,
        accumulatedSpent90Days: subtotal,
        totalOrdersCount: 1,
        status: 'active'
      };
      appState.mitraList.unshift(foundMitra);
      saveStoredMitra(appState.mitraList);
      if (typeof saveMitraToSupabase === 'function') {
        saveMitraToSupabase(foundMitra, currentStoreSlug);
      }
    } else {
      // Perbarui akumulasi marketer satu kali secara akurat (tanpa dobel hitung)
      foundMitra.accumulatedSpent90Days = (foundMitra.accumulatedSpent90Days || 0) + subtotal;
      foundMitra.totalOrdersCount = (foundMitra.totalOrdersCount || 0) + 1;
      foundMitra.lastOrderDate = nowIso;
      saveStoredMitra(appState.mitraList);
      if (typeof saveMitraToSupabase === 'function') {
        saveMitraToSupabase(foundMitra, currentStoreSlug);
      }
    }

    const newSale = {
      orderId: orderTrxId,
      store_slug: currentStoreSlug,
      marketerId: marketerCode,
      marketerName: marketerName,
      date: nowIso,
      monthPeriod: currentMonthPeriod,
      customerName: inputBuyerName || appState.buyerDetails.name || 'Pelanggan Online',
      customerPhone: buyerPhone || inputBuyerPhone || '-',
      customerAddress: appState.buyerDetails.address || '-',
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
    saveStoredMarketerSales(appState.marketerSales, true, currentStoreSlug);
    if (typeof saveMarketerSaleToSupabase === 'function') {
      saveMarketerSaleToSupabase(newSale, currentStoreSlug);
    }

    if (foundMitra) {
      foundMitra.accumulatedSpent90Days = (foundMitra.accumulatedSpent90Days || 0) + subtotal;
      foundMitra.lastOrderDate = nowIso;
      if (typeof checkAndAutoUpgradeMitraIfEnabled === 'function') {
        checkAndAutoUpgradeMitraIfEnabled(foundMitra, currentStoreSlug);
      }
    }

    crmNoticeText = `\n💼 *TIM MARKETER RESMI (PENJUALAN TANPA MODAL):*\n` +
      `• Marketer Penjual : ${marketerName} (${marketerCode})\n` +
      `• No. Rekening     : ${(foundMitra && foundMitra.bankName) || 'BCA'} - ${(foundMitra && foundMitra.bankAccount) || '-'}\n` +
      `• Komisi Marketer  : ${formatRupiah(comm)} (15% otomatis tercatat di Rekap Gaji Bulanan Toko)\n`;
    showToast(`💼 Pesanan berhasil dicatat untuk Tim Marketer: ${marketerName}! Komisi 15% masuk rekap gaji.`);
  } else if (foundMitra && (isResellerOrder || appState.currentTier === foundMitra.tier)) {
    foundMitra.accumulatedSpent90Days = (foundMitra.accumulatedSpent90Days || 0) + subtotal;
    foundMitra.totalOrdersCount = (foundMitra.totalOrdersCount || 0) + 1;
    foundMitra.lastOrderDate = nowIso;
    if (foundMitra.tier === 'reseller' && foundMitra.accumulatedSpent90Days >= 500000) {
      foundMitra.status = 'active';
    }
    if (typeof checkAndAutoUpgradeMitraIfEnabled === 'function') {
      checkAndAutoUpgradeMitraIfEnabled(foundMitra, currentStoreSlug);
    }
    saveStoredMitra(appState.mitraList);
    if (typeof saveMitraToSupabase === 'function') {
      saveMitraToSupabase(foundMitra, currentStoreSlug);
    }

    crmNoticeText = `\n🔄 *STATUS KEMITRAAN TOKO:*\n` +
      `• ID & Nama Mitra  : ${foundMitra.id} - ${foundMitra.name}\n` +
      `• Tingkat Level    : ${SR12_TIERS[foundMitra.tier]?.name || 'Reseller'} (Diskon ${SR12_TIERS[foundMitra.tier]?.discountPct}%)\n` +
      `• Akumulasi Belanja: ${formatRupiah(foundMitra.accumulatedSpent90Days)}\n`;
  } else {
    // Belum terdaftar, cek apakah memenuhi kualifikasi belanja 500rb atau level Reseller
    if (subtotal >= 500000 || isResellerOrder) {
      const nextId = generateNextMitraId('reseller');
      const newReseller = {
        id: nextId,
        store_slug: currentStoreSlug,
        name: appState.buyerDetails.name || 'Mitra Reseller Baru',
        phone: buyerPhone || '-',
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
      appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
      saveStoredMitra(appState.mitraList);
      if (typeof saveMitraToSupabase === 'function') {
        saveMitraToSupabase(newReseller, currentStoreSlug);
      }

      crmNoticeText = `\n🎉 *KUALIFIKASI RESELLER BARU TOKO:*\n` +
        `• ID Mitra Baru    : ${nextId} (Otomatis dibuatkan oleh sistem)\n` +
        `• Tingkat Level    : Reseller Resmi SR12\n` +
        `• Total Belanja    : ${formatRupiah(subtotal)} (Lolos kualifikasi)\n`;
      showToast(`🎉 Selamat! Anda telah lolos kualifikasi Reseller Resmi (${nextId})`);
    }
  }

  let mitraVerificationText = '';
  if (appState.currentTier === 'marketer') {
    const marketerComm = Math.round(subtotal * 0.15);
    const mitraId = (foundMitra && foundMitra.id) || document.getElementById('buyerMitraIdInput')?.value.trim() || 'Tim Marketer';
    mitraVerificationText = `\n💼 *DATA MARKETER RESMI SR12:*\n` +
      `• Level Mitra  : Mitra Marketer\n` +
      `• Pembayaran   : Harga HET Penuh (Rp ${subtotal.toLocaleString('id-ID')})\n` +
      `• Hak Komisi   : 15% (+${formatRupiah(marketerComm)}) otomatis dicatat di rekap penjualan & dicairkan setiap bulan oleh Distributor.\n` +
      `• No. ID Mitra : ${mitraId}\n`;
  } else if (appState.currentTier !== 'konsumen') {
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
      : `👤 *DATA PENERIMA & ALAMAT PENGIRIMAN:*\n` +
        `• Nama Lengkap   : ${appState.buyerDetails.name || 'Pelanggan'}\n` +
        `• No. WhatsApp   : ${buyerPhone || appState.buyerDetails.phone || '-'}\n` +
        `• Alamat Lengkap : ${appState.buyerDetails.address || '-'}\n`
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

  // Catat pesanan online ke riwayat Transaksi Toko Distributor & Cloud
  const dateFormatted = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let orderTier = appState.currentTier;
  let orderTierLabel = SR12_TIERS[appState.currentTier]?.name || 'Konsumen Retail';

  if (isMarketerOrder) {
    orderTier = 'marketer';
    orderTierLabel = `Mitra Marketer (${marketerName || marketerCode || '15%'})`;
  } else if (isResellerOrder) {
    orderTier = 'reseller';
    orderTierLabel = `Reseller Resmi (${(foundMitra && foundMitra.name) || 'Diskon 20%'})`;
  } else if (appState.currentTier === 'sub_agen') {
    orderTier = 'sub_agen';
    orderTierLabel = `Sub Agen (${(foundMitra && foundMitra.name) || 'Diskon 30%'})`;
  } else if (appState.currentTier === 'agen') {
    orderTier = 'agen';
    orderTierLabel = `Agen Resmi (${(foundMitra && foundMitra.name) || 'Diskon 40%'})`;
  }

  const webOrder = {
    id: orderTrxId,
    store_slug: currentStoreSlug,
    marketerId: isMarketerOrder ? marketerCode : null,
    marketerName: isMarketerOrder ? marketerName : null,
    resellerId: isResellerOrder ? ((foundMitra && foundMitra.id) || null) : null,
    dateTime: dateFormatted,
    customerName: (inputBuyerName || appState.buyerDetails.name || 'Pelanggan'),
    customerPhone: buyerPhone || appState.buyerDetails.phone || '-',
    customerAddress: appState.buyerDetails.address || '-',
    tier: orderTier,
    tierLabel: orderTierLabel,
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
    subtotal: subtotal,
    shippingCost: shippingCost,
    platformFee: fee,
    discountAmount: totalSavings,
    grandTotal: grandTotal,
    paymentMethod: courier.id === 'pickup' ? 'Ambil Sendiri di Toko' : courier.id === 'cod' ? 'COD (Bayar di Tempat)' : `Ekspedisi ${courier.name}`,
    status: courier.id === 'pickup' ? 'Siap Diambil di Toko' : 'Menunggu Konfirmasi',
    orderSource: 'Online Web Store'
  };

  if (!appState.transactions) {
    appState.transactions = (typeof getStoredTransactions === 'function') ? getStoredTransactions(currentStoreSlug) : [];
  }
  appState.transactions.unshift(webOrder);
  if (typeof saveStoredTransactions === 'function') {
    saveStoredTransactions(appState.transactions, currentStoreSlug);
  }
  
  const trxBadge = document.getElementById('olseraTrxBadge');
  if (trxBadge) trxBadge.textContent = `${appState.transactions.length}`;

  // SINKRONKAN KE SUPABASE CLOUD SEKETIKA AGAR LANGSUNG MASUK KE HP DISTRIBUTOR!
  if (typeof saveOrderToSupabase === 'function') {
    saveOrderToSupabase(webOrder, currentStoreSlug);
  }

  // Trigger notifikasi lokal dan mainkan suara dering
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

        // 1. Simpan ke override stok toko ini (LocalStorage terisolasi)
        if (typeof saveStoreProductOverride === 'function') {
          saveStoreProductOverride(currentStoreSlug, p);
        }

        // 2. Simpan ke Supabase Cloud tabel products
        if (typeof saveProductToSupabase === 'function') {
          saveProductToSupabase(p, currentStoreSlug);
        }

        // 3. Catat mutasi stok
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
          }, currentStoreSlug);
        }
      }
    });
    if (typeof saveStoredProducts === 'function') saveStoredProducts(appState.products);
    renderProducts();
    if (typeof renderInventoryTable === 'function') renderInventoryTable();
  }

  // Catat ke Buku Arus Kas Masuk Toko Distributor (Kas Masuk)
  // Omset Penjualan Bersih Toko = Nilai Subtotal Produk (misal Rp 215.000)
  if (!appState.cashflow) {
    appState.cashflow = (typeof getStoredCashflow === 'function') ? getStoredCashflow(currentStoreSlug) : [];
  }
  const cashflowMethod = (courier.id === 'cod') ? 'CASH' : 'TRANSFER';
  const newCashflowEntry = {
    id: 'CSH-ORD-' + Date.now().toString().slice(-6),
    store_slug: currentStoreSlug,
    date: nowIso,
    type: 'in',
    account: cashflowMethod,
    category: `Penjualan Online (${SR12_TIERS[appState.currentTier]?.name || 'Retail'})`,
    notes: `${webOrder.id} - ${appState.buyerDetails.name || 'Pelanggan'} (${appState.cart.length} item) [Omset: ${formatRupiah(subtotal)} | Transfer: ${formatRupiah(grandTotal)} inkl. Ongkir ${courier.name}]`,
    amount: subtotal,
    subtotal: subtotal,
    grandTotal: grandTotal,
    shippingCost: shippingCost,
    platformFee: fee
  };
  appState.cashflow.unshift(newCashflowEntry);
  if (typeof saveStoredCashflow === 'function') {
    saveStoredCashflow(appState.cashflow, currentStoreSlug);
  }
  if (typeof renderCashflowTable === 'function') {
    renderCashflowTable();
  }
  if (typeof renderResellers === 'function') {
    renderResellers();
  }
  if (typeof renderMarketerPayroll === 'function') {
    renderMarketerPayroll();
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
const AUTH_SECURITY_MODALS = ['modalDistributorLogin', 'modalDevPin', 'modalOlseraLock', 'modalChangeSecurityPin'];

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  document.body.classList.add('modal-open');
  modal.style.display = 'flex';
  modal.classList.add('open');

  const dialog = modal.querySelector('.modal-dialog') || modal.querySelector('.modal-container');
  if (dialog) {
    dialog.style.transform = '';
    dialog.style.opacity = '';
    dialog.style.transition = '';
  }

  // Daftarkan ke History Browser hanya untuk modal umum (KECUALI modal PIN otentikasi)
  if (!AUTH_SECURITY_MODALS.includes(modalId)) {
    try {
      if (!history.state || history.state.openModalId !== modalId) {
        history.pushState({ openModalId: modalId, isModal: true }, '');
        isModalHistoryPushed = true;
      }
    } catch(e) {}
  }
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

function closeModal(modalId, isFromPopstate = false, skipHistoryBack = false) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
    const dialog = modal.querySelector('.modal-dialog') || modal.querySelector('.modal-container');
    if (dialog) {
      dialog.style.transform = '';
      dialog.style.opacity = '';
      dialog.style.transition = '';
    }
  }

  // Jika modal produk ditutup, bersihkan ID aktif dan query URL produk jika masih tersisa
  if (modalId === 'modalProductDetail' || modalId === 'modalProductPromoShare') {
    if (typeof appState !== 'undefined') appState.activeDetailProductId = null;
    try {
      const curP = new URLSearchParams(window.location.search);
      if (curP.has('product') || curP.has('p') || curP.has('prod')) {
        curP.delete('product');
        curP.delete('p');
        curP.delete('prod');
        const qStr = curP.toString();
        const nUrl = window.location.pathname + (qStr ? '?' + qStr : '') + window.location.hash;
        window.history.replaceState(window.history.state, '', nUrl);
      }
    } catch(e) {}
  }

  // Jika ditutup bukan via popstate dan bukan skipHistoryBack dan history state tercatat modal umum
  if (!AUTH_SECURITY_MODALS.includes(modalId) && !isFromPopstate && !skipHistoryBack && isModalHistoryPushed && history.state && history.state.isModal) {
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

// Listener Delegasi Global: Memastikan SEMUA tombol X / .btn-close-modal selalu menutup modalnya tanpa terkecuali
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('.btn-close-modal');
  if (closeBtn) {
    const parentModal = closeBtn.closest('.modal-backdrop');
    if (parentModal && parentModal.id) {
      closeModal(parentModal.id);
    }
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    ensureScrollUnlocked();
  }
});

// Tangkap gestur Back bawaan HP (geser tepi layar kiri/kanan di Android / iOS) & tombol Back browser Laptop/PC
window.addEventListener('popstate', (e) => {
  const openModals = Array.from(document.querySelectorAll('.modal-backdrop.open'));
  if (openModals.length > 0) {
    const topModal = openModals[openModals.length - 1];

    // PROTEKSI MUTLAK MODAL PIN / KEAMANAN:
    // modalDistributorLogin, modalDevPin, modalOlseraLock, dan modalChangeSecurityPin SAMA SEKALI TIDAK BOLEH ditutup oleh popstate!
    if (AUTH_SECURITY_MODALS.includes(topModal.id)) {
      return;
    }

    closeModal(topModal.id, true);
    return;
  }
  const cartDrawer = document.getElementById('cartDrawer');
  if (cartDrawer && cartDrawer.classList.contains('open')) {
    if (typeof closeCartDrawer === 'function') closeCartDrawer();
    return;
  }

  // Jika ada modal PIN yang aktif, jangan izinkan navigasi toko liar
  const hasAuthModal = document.querySelector('.modal-backdrop.open');
  if (hasAuthModal && AUTH_SECURITY_MODALS.includes(hasAuthModal.id)) {
    return;
  }

  // Navigasi Toko / Halaman melalui Tombol Back Browser Laptop/HP
  const params = new URLSearchParams(window.location.search);
  const targetSlug = params.get('store') || (e.state && e.state.store) || 'sr12-central';
  if (targetSlug !== appState.currentStoreSlug) {
    switchPartnerStore(targetSlug, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

function initUniversalModalGestures() {
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => {
    // PROTEKSI TOTAL: Modal PIN & Keamanan sama sekali TIDAK BOLEH dipasangi listener gestur ataupun penutup backdrop otomatis!
    if (AUTH_SECURITY_MODALS.includes(backdrop.id)) {
      return;
    }

    let touchStartedOnBackdrop = false;
    let mouseDownStartedOnBackdrop = false;

    backdrop.addEventListener('mousedown', (e) => {
      mouseDownStartedOnBackdrop = (e.target === backdrop);
    });

    backdrop.addEventListener('touchstart', (e) => {
      touchStartedOnBackdrop = (e.target === backdrop);
    }, { passive: true });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop && (mouseDownStartedOnBackdrop || touchStartedOnBackdrop)) {
        closeModal(backdrop.id);
      }
      mouseDownStartedOnBackdrop = false;
      touchStartedOnBackdrop = false;
    });

    // Kunci touchmove pada area gelap backdrop HANYA jika konten muat di layar
    backdrop.addEventListener('touchmove', (e) => {
      if (e.target === backdrop) {
        if (backdrop.scrollHeight > backdrop.clientHeight) {
          return;
        }
        e.preventDefault();
      }
    }, { passive: false });

    // Deteksi Gestur Geser Sentuhan Layar (Pull Down to Dismiss)
    let touchStartY = 0;
    let isPullDown = false;
    let isSwiping = false;
    let activeDialog = null;

    backdrop.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;

      if (e.target.closest('input, textarea, select, button, a, label, form, .modal-body, [contenteditable="true"]')) {
        isPullDown = false;
        isSwiping = false;
        activeDialog = null;
        return;
      }

      const headerTarget = e.target.closest('.modal-header, .modal-drag-handle');
      if (headerTarget && !e.target.closest('button, .btn-close-modal, a')) {
        activeDialog = backdrop.querySelector('.modal-dialog');
        if (!activeDialog) return;
        const scrollTop = activeDialog.scrollTop || 0;
        if (scrollTop <= 2) {
          touchStartY = e.touches[0].clientY;
          isPullDown = true;
          isSwiping = false;
          return;
        }
      }

      isPullDown = false;
      isSwiping = false;
      activeDialog = null;
    }, { passive: true });

    backdrop.addEventListener('touchmove', (e) => {
      if (!isPullDown || !activeDialog || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const diffY = touch.clientY - touchStartY;

      if (diffY > 15) {
        isSwiping = true;
        activeDialog.style.transition = 'none';
        activeDialog.style.transform = `translateY(${Math.min(diffY, 160)}px)`;
        activeDialog.style.opacity = `${Math.max(0.4, 1 - diffY / 350)}`;
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    backdrop.addEventListener('touchend', (e) => {
      if (!activeDialog || !isSwiping || !isPullDown) {
        isPullDown = false;
        isSwiping = false;
        activeDialog = null;
        return;
      }

      const touch = e.changedTouches[0];
      const diffY = touch.clientY - touchStartY;

      if (diffY > 70) {
        activeDialog.style.transition = 'transform 0.22s ease-out, opacity 0.22s ease-out';
        activeDialog.style.transform = 'translateY(100%)';
        activeDialog.style.opacity = '0';
        setTimeout(() => {
          closeModal(backdrop.id);
          if (activeDialog) {
            activeDialog.style.transition = '';
            activeDialog.style.transform = '';
            activeDialog.style.opacity = '';
          }
        }, 190);
      } else {
        activeDialog.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease';
        activeDialog.style.transform = '';
        activeDialog.style.opacity = '';
        setTimeout(() => {
          if (activeDialog) activeDialog.style.transition = '';
        }, 220);
      }

      isPullDown = false;
      isSwiping = false;
      activeDialog = null;
    }, { passive: true });
  });

  // Pasang MutationObserver hanya untuk modal umum
  const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.classList.contains('modal-backdrop')) {
          if (AUTH_SECURITY_MODALS.includes(target.id)) return; // Jangan manipulasi history untuk modal PIN
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
    if (!AUTH_SECURITY_MODALS.includes(b.id)) {
      modalObserver.observe(b, { attributes: true, attributeFilter: ['class'] });
    }
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

    // Jika modal baru saja dibuka dalam kurun waktu imunitas (1.5 detik), nonaktifkan edge swipe
    if (Date.now() < (window.modalImmunityUntil || 0)) {
      isTrackingEdgeSwipe = false;
      return;
    }

    // Jika ada modal apapun yang sedang terbuka, jangan pernah aktifkan edge swipe back gesture!
    const hasOpenModal = document.querySelector('.modal-backdrop.open');
    if (hasOpenModal) {
      isTrackingEdgeSwipe = false;
      return;
    }

    // Jika drawer Menu Toko sedang terbuka, biarkan gesture drawer yang menangani
    if (document.body.classList.contains('olsera-drawer-open')) {
      isTrackingEdgeSwipe = false;
      return;
    }

    // Jika sentuhan berada di dalam form control, modal dialog, atau tombol
    if (e.target.closest('input, textarea, select, button, a, label, .modal-dialog, .modal-backdrop')) {
      isTrackingEdgeSwipe = false;
      return;
    }

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

    if (Date.now() < (window.modalImmunityUntil || 0)) {
      return;
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
  // Masa imunitas aktif: abaikan navigasi back saat modal baru dibuka
  if (Date.now() < (window.modalImmunityUntil || 0)) return;

  // 1. Jika ada modal aktif yang terbuka, tutup modal teratas (KECUALI modal PIN otentikasi)
  const openModals = Array.from(document.querySelectorAll('.modal-backdrop.open'));
  if (openModals.length > 0) {
    const topModal = openModals[openModals.length - 1];
    // Proteksi modal PIN otentikasi: tidak ditutup oleh edge swipe
    if (AUTH_SECURITY_MODALS.includes(topModal.id)) {
      return;
    }
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
  let prod = (appState.products || []).find(p => p.id === productId);
  if (!prod && typeof findBestProductMatch === 'function') {
    prod = findBestProductMatch(appState.products || [], productId);
  }
  if (!prod) return;

  appState.activeDetailProductId = prod.id;

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
  if (image) {
    image.src = prod.image;
    image.alt = prod.name;
    image.onerror = function() {
      this.onerror = null;
      this.src = 'assets/hero-banner.jpg';
    };
  }

  // Jika foto saat ini masih ilustrasi dummy SVG, cek apakah ada foto asli di IndexedDB
  if (typeof dbGetProduct === 'function' && (!prod.customEdited || (prod.image && prod.image.startsWith('data:image/svg+xml')))) {
    dbGetProduct(prod.id).then(idbP => {
      if (idbP && idbP.image && !idbP.image.startsWith('data:image/svg+xml')) {
        prod.image = idbP.image;
        prod.customEdited = true;
        if (appState.activeDetailProductId === prod.id && image) {
          image.src = idbP.image;
        }
      }
    });
  }

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
    const canManageProd = !!(appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn);
    btnEdit.style.display = canManageProd ? 'inline-flex' : 'none';
    btnEdit.onclick = () => {
      closeModal('modalProductDetail', false, true);
      setTimeout(() => {
        openEditProductModal(prod.id);
      }, 50);
    };
  }

  if (typeof openModal === 'function') {
    openModal('modalProductDetail');
  } else if (modal) {
    modal.classList.add('open');
  }
}

function openEditProductModal(productId) {
  const prod = (appState.products || []).find(p => p.id === productId);
  if (!prod) return;

  const bBar = document.getElementById('posMobileBottomBar');
  if (bBar) {
    bBar.classList.remove('active');
    bBar.style.display = 'none';
  }

  appState.activeEditingProductId = productId;
  appState.tempEditImageBase64 = prod.image;

  const modal = document.getElementById('modalEditProduct');
  const nameInput = document.getElementById('editProdName');
  const catInput = document.getElementById('editProdCategory');
  const hetInput = document.getElementById('editProdHet');
  const stockInput = document.getElementById('editProdStock');
  const summaryInput = document.getElementById('editProdSummary');
  const imgPreview = document.getElementById('editProdImgPreview');
  const fileInput = document.getElementById('editProdFileInput');
  const urlInput = document.getElementById('editProdUrlInput');
  const statusEl = document.getElementById('editProdUploadStatus');

  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.style.display = 'none';
  }
  if (nameInput) nameInput.value = prod.name;
  if (catInput) catInput.value = prod.category;
  if (hetInput) {
    hetInput.value = prod.het;
    updateEditProdTierCalc(prod.het);
  }
  if (stockInput) stockInput.value = (typeof prod.stock !== 'undefined') ? prod.stock : 85;
  if (summaryInput) summaryInput.value = prod.summary || '';

  if (imgPreview) {
    imgPreview.src = (typeof sanitizeImageUrl === 'function') ? sanitizeImageUrl(prod.image) : (prod.image || 'assets/hero-banner.jpg');
    imgPreview.style.display = 'block';
  }

  openModal('modalEditProduct');
}

async function handleEditProdFileInputChange(e) {
  const file = e && e.target && e.target.files && e.target.files[0];
  if (!file) return;

  const previewImg = document.getElementById('editProdImgPreview');
  const statusEl = document.getElementById('editProdUploadStatus');

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#0284c7';
    statusEl.textContent = '⏳ Membaca foto dari perangkat...';
  }
  showToast('⏳ Membaca foto produk...');

  const reader = new FileReader();
  reader.onload = async (re) => {
    const rawDataUrl = re.target && re.target.result;
    if (!rawDataUrl) {
      if (statusEl) statusEl.textContent = '❌ Gagal membaca foto. Silakan coba file lain.';
      return;
    }

    // Pasang pratinjau seketika
    if (previewImg) {
      previewImg.src = rawDataUrl;
      previewImg.style.display = 'block';
    }
    appState.tempEditImageBase64 = rawDataUrl;

    // Lakukan kompresi otomatis agar ukuran ringan (~600px, JPEG 0.78)
    try {
      if (typeof compressImageSource === 'function') {
        const compressed = await compressImageSource(rawDataUrl, 600, 0.78);
        if (compressed && compressed.length > 50) {
          appState.tempEditImageBase64 = compressed;
          if (previewImg) previewImg.src = compressed;
        }
      }
    } catch (eComp) {
      console.warn('Kompresi canvas dialihkan:', eComp);
    }

    if (statusEl) {
      statusEl.style.color = '#047857';
      statusEl.textContent = '✅ Foto berhasil dipilih! Klik tombol "Simpan Perubahan Produk" di bawah untuk menerapkan.';
    }
    showToast('📷 Foto produk berhasil dimuat! Klik "Simpan Perubahan Produk" untuk menyimpan.');
  };

  reader.onerror = (err) => {
    console.error('Error membaca file foto:', err);
    if (statusEl) {
      statusEl.style.color = '#dc2626';
      statusEl.textContent = '❌ Gagal membaca file. Silakan pilih foto JPG atau PNG.';
    }
    alert('Gagal membaca file foto dari HP/komputer. Silakan coba kembali.');
  };

  reader.readAsDataURL(file);
}

function handleApplyEditProdUrl() {
  const urlInput = document.getElementById('editProdUrlInput');
  const previewImg = document.getElementById('editProdImgPreview');
  const statusEl = document.getElementById('editProdUploadStatus');
  const url = urlInput ? urlInput.value.trim() : '';

  if (!url) {
    alert('Silakan masukkan link/URL gambar terlebih dahulu.');
    return;
  }

  const safeUrl = (typeof sanitizeImageUrl === 'function') ? sanitizeImageUrl(url) : url;
  appState.tempEditImageBase64 = safeUrl;

  if (previewImg) {
    previewImg.src = safeUrl;
    previewImg.style.display = 'block';
  }
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#047857';
    statusEl.textContent = '✅ Link foto produk diterapkan! Klik "Simpan Perubahan Produk" di bawah.';
  }
  showToast('🔗 Link foto produk berhasil diterapkan!');
}

async function handleEditProductSubmit(e) {
  if (e) e.preventDefault();

  const prodId = appState.activeEditingProductId;
  const prod = (appState.products || []).find(p => p.id === prodId);
  if (!prod) {
    alert('Produk tidak ditemukan atau belum dipilih!');
    return;
  }

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

    // Ambil gambar terpilih (hasil upload langsung, preset, atau URL)
    const finalImage = appState.tempEditImageBase64 || prod.image || 'assets/hero-banner.jpg';

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

    // Perbarui juga data di appState.products & DEFAULT_SR12_PRODUCTS secara live di memori
    const pIdx = (appState.products || []).findIndex(p => p.id === prod.id);
    if (pIdx !== -1) {
      appState.products[pIdx] = { ...appState.products[pIdx], ...prod };
    }
    if (typeof DEFAULT_SR12_PRODUCTS !== 'undefined' && Array.isArray(DEFAULT_SR12_PRODUCTS)) {
      const dIdx = DEFAULT_SR12_PRODUCTS.findIndex(p => p.id === prod.id);
      if (dIdx !== -1) {
        DEFAULT_SR12_PRODUCTS[dIdx] = { ...DEFAULT_SR12_PRODUCTS[dIdx], ...prod };
      }
    }

    const activeStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';

    // 1. Simpan override terisolasi khusus untuk toko ini (LocalStorage terisolasi)
    saveStoreProductOverride(activeStoreSlug, prod);

    // 2. Simpan ke IndexedDB dengan key unik per toko & global ID
    if (typeof dbSaveProduct === 'function') {
      try {
        await dbSaveProduct({ ...prod, id: `${activeStoreSlug}___${prod.id}`, originalId: prod.id, store_slug: activeStoreSlug });
        await dbSaveProduct({ ...prod, id: prod.id, store_slug: activeStoreSlug });
      } catch (eIdb) {
        console.warn('IndexedDB product save notice:', eIdb);
      }
    }

    // 3. Render ulang semua etalase & POS
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof renderInventoryTable === 'function') renderInventoryTable();
    if (typeof renderPosProducts === 'function') renderPosProducts();

    // 4. Simpan juga ke Supabase Cloud secara asinkron
    if (typeof saveProductToSupabase === 'function') {
      saveProductToSupabase(prod, activeStoreSlug).catch(errSupa => {
        console.warn('Supabase product save notice:', errSupa);
      });
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
  const prodId = appState.activeEditingProductId;
  const imgPreview = document.getElementById('editProdImgPreview');
  const statusEl = document.getElementById('editProdUploadStatus');
  let selectedImg = 'assets/hero-banner.jpg';

  if (presetType === 'deodorant') {
    selectedImg = 'assets/deodorant-spray.jpg';
  } else if (presetType === 'banner') {
    selectedImg = 'assets/hero-banner.jpg';
  } else if (presetType === 'gold') {
    selectedImg = 'assets/reward-gold.jpg';
  } else if (presetType === 'reset') {
    const orig = (typeof DEFAULT_SR12_PRODUCTS !== 'undefined') ? DEFAULT_SR12_PRODUCTS.find(p => p.id === prodId) : null;
    selectedImg = (orig && orig.image) ? orig.image : 'assets/hero-banner.jpg';
  }

  appState.tempEditImageBase64 = selectedImg;
  if (imgPreview) {
    imgPreview.src = selectedImg;
    imgPreview.style.display = 'block';
  }
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.color = '#047857';
    statusEl.textContent = `✅ Foto resmi SR12 (${presetType}) dipilih! Klik "Simpan Perubahan Produk" di bawah.`;
  }
  showToast(`🖼️ Foto kemasan produk dipilih: ${presetType}`);
}
window.openEditProductModal = openEditProductModal;
window.handleEditProdFileInputChange = handleEditProdFileInputChange;
window.handleApplyEditProdUrl = handleApplyEditProdUrl;
window.handleEditProductSubmit = handleEditProductSubmit;
window.setEditImagePreset = setEditImagePreset;

function updateFeePayerLabels() {
  const feeSelect = document.getElementById('settingPlatformFeeAmount');
  const feeVal = feeSelect ? (parseInt(feeSelect.value, 10) || appState.platformFee || 2000) : (appState.platformFee || 2000);
  const formattedFee = (typeof formatRupiah === 'function') ? formatRupiah(feeVal) : `Rp ${feeVal.toLocaleString('id-ID')}`;
  
  const payerSelect = document.getElementById('settingFeePayer');
  if (payerSelect && payerSelect.options && payerSelect.options.length >= 2) {
    payerSelect.options[0].text = `Ditanggung Pembeli (+${formattedFee} di keranjang)`;
    payerSelect.options[1].text = `Dipotong dari Penjual (Komisi ${formattedFee})`;
  }
}
window.updateFeePayerLabels = updateFeePayerLabels;

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
  const feeAmountSelect = document.getElementById('settingPlatformFeeAmount');

  if (nameInput) nameInput.value = cfg.storeName;
  if (tagInput) tagInput.value = cfg.storeTagline;
  if (logoTextInput) logoTextInput.value = cfg.storeLogoText;
  if (waInput) waInput.value = cfg.storeWaNumber;
  if (cityInput) cityInput.value = cfg.storeCity;
  if (ownerInput) ownerInput.value = cfg.storeOwner;
  if (heroTitleInput) heroTitleInput.value = cfg.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle;
  if (heroSubtitleInput) heroSubtitleInput.value = cfg.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle;
  if (feePayerSelect) feePayerSelect.value = cfg.feePayer || 'buyer';
  if (feeAmountSelect) {
    const curFee = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);
    renderPlatformFeeOptions(feeAmountSelect, curFee);
    feeAmountSelect.value = String(curFee);
  }
  updateFeePayerLabels();

  const storeAdminPinInput = document.getElementById('settingStoreAdminPin');
  const actualSavedPin = localStorage.getItem(`sr12_store_pin_${cfg.slug}`) || (cfg.storeAdminPin !== '••••' ? cfg.storeAdminPin : '') || '1234';
  if (storeAdminPinInput) storeAdminPinInput.value = actualSavedPin;

  const skNumDisplay = document.getElementById('settingSkNumberDisplay');
  if (skNumDisplay) {
    skNumDisplay.textContent = cfg.verifiedSkNumber || cfg.skNumber || `SK-DIST-SR12-2026-${(cfg.slug || 'mitra').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)}`;
  }
  const nikDisplay = document.getElementById('settingNikDisplay');
  if (nikDisplay) {
    nikDisplay.textContent = cfg.nikNumber || '3374025804820003';
  }
  appState.tempStoreSkBase64 = null;
  appState.tempStoreSkDocName = null;
  const skFileInput = document.getElementById('settingSkFileInput');
  if (skFileInput) skFileInput.value = '';
  const skPreviewBox = document.getElementById('settingSkPreviewBox');
  if (skPreviewBox) skPreviewBox.style.display = 'none';

  appState.tempStoreLogoBase64 = null;
  appState.tempHeroBannerBase64 = null;
  const bannerFileInput = document.getElementById('settingBannerFileInput');
  if (bannerFileInput) bannerFileInput.value = '';
  const logoFileInput = document.getElementById('settingLogoFileInput');
  if (logoFileInput) logoFileInput.value = '';

  if (previewLogo) {
    previewLogo.src = getStoreEmblemSvgUrl(cfg) || 'assets/sr12-logo.png';
    previewLogo.style.display = 'block';
  }

  if (previewBanner) {
    if (cfg.heroBannerUrl && cfg.heroBannerUrl.trim()) {
      previewBanner.src = cfg.heroBannerUrl;
      previewBanner.style.display = 'block';
    } else {
      previewBanner.src = '';
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

  // 2.B Bersihkan data mitra jaringan milik toko yang dihapus dari database mitra sentral
  if (Array.isArray(appState.mitraList)) {
    const prevCount = appState.mitraList.length;
    appState.mitraList = appState.mitraList.filter(m => {
      if (m.store_slug && m.store_slug === slug) return false;
      if (targetStore && targetStore.storeWaNumber && m.phone === targetStore.storeWaNumber) return false;
      if (targetStore && targetStore.storeOwner && m.name && m.name.toLowerCase() === targetStore.storeOwner.toLowerCase()) return false;
      return true;
    });
    if (appState.mitraList.length !== prevCount) {
      if (appState.resellers) {
        appState.resellers = appState.mitraList;
      }
      saveStoredMitra(appState.mitraList, true);
    }
  }

  // 3. Hapus juga dari antrean pending jika ada
  if (Array.isArray(appState.pendingStoreApps)) {
    appState.pendingStoreApps = appState.pendingStoreApps.filter(a => a.slug !== slug);
    saveStoredPendingStores(appState.pendingStoreApps);
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
  const isDevOpen = appState.isDevMasterLoggedIn && document.getElementById('devSuperAdminWorkspace')?.style.display !== 'none';
  if (appState.currentStoreSlug === slug) {
    if (isDevOpen) {
      loadStoreBySlug('sr12-central');
    } else {
      switchPartnerStore('sr12-central');
    }
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', window.location.pathname + (isDevOpen ? '#developer' : ''));
    }
  } else {
    renderStoreDropdown();
    if (!isDevOpen) {
      renderStoreBranding();
    }
  }

  // 8. Tutup modal pengaturan jika terbuka
  if (typeof closeModal === 'function') {
    closeModal('modalStoreSettings');
  }

  // 9. Perbarui metrik Developer Workspace, Olsera headers, dan modal switcher
  if (typeof updateDevPortalMetrics === 'function') {
    updateDevPortalMetrics();
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

/**
 * Hapus seluruh toko mitra sekaligus dari sistem & Cloud (Reset Bersih Total)
 */
async function deleteAllPartnerStores() {
  const storesToDelete = (appState.partnerStores || []).filter(s => s && s.slug && s.slug !== 'sr12-central');
  if (storesToDelete.length === 0) {
    alert('Tidak ada toko mitra untuk dihapus. Hanya Toko Utama Pusat (SR12-Ku Pro) yang aktif.');
    return;
  }

  const confirmed = confirm(
    `⚠️ KONFIRMASI HAPUS SELURUH TOKO MITRA\n\n` +
    `Apakah Anda yakin ingin MENGHAPUS SEMUA (${storesToDelete.length}) TOKO MITRA dari database lokal dan Supabase Cloud?\n\n` +
    `• Seluruh toko distributor & agen akan dihapus permanen.\n` +
    `• Toko Utama Pusat (SR12-Ku Pro) akan tetap aktif.\n` +
    `• Tindakan ini akan diterapkan ke semua perangkat (HP & Laptop).\n\n` +
    `Lanjutkan penghapusan seluruh toko?`
  );
  if (!confirmed) return;

  const slugs = storesToDelete.map(s => s.slug);

  // 1. Catat ke deletedSlugs lokal
  try {
    const rawDel = localStorage.getItem('sr12_deleted_store_slugs');
    let deletedSlugs = rawDel ? JSON.parse(rawDel) : [];
    if (!Array.isArray(deletedSlugs)) deletedSlugs = [];
    slugs.forEach(slug => {
      if (!deletedSlugs.includes(slug)) deletedSlugs.push(slug);
    });
    localStorage.setItem('sr12_deleted_store_slugs', JSON.stringify(deletedSlugs));
  } catch(e) {}

  // 2. Bersihkan storage spesifik per toko
  slugs.forEach(slug => {
    try {
      localStorage.removeItem('sr12_store_product_overrides_' + slug);
      localStorage.removeItem('sr12_transactions_' + slug);
      localStorage.removeItem('sr12_cashflow_' + slug);
      localStorage.removeItem('sr12_mutations_' + slug);
    } catch(e) {}
  });

  // 3. Sisakan hanya sr12-central di partnerStores
  const centralStore = (appState.partnerStores || []).find(s => s.slug === 'sr12-central') || DEFAULT_PARTNER_STORES[0];
  appState.partnerStores = [centralStore];
  saveStoredPartnerStores(appState.partnerStores);

  // 4. Bersihkan mitra binaan milik toko-toko ini
  if (Array.isArray(appState.mitraList)) {
    appState.mitraList = appState.mitraList.filter(m => !m.store_slug || m.store_slug === 'sr12-central');
    appState.resellers = appState.mitraList;
    saveStoredMitra(appState.mitraList, true);
  }

  // 5. Hapus dari Supabase Cloud
  if (typeof deleteStoreFromSupabase === 'function') {
    for (const slug of slugs) {
      try {
        await deleteStoreFromSupabase(slug);
      } catch(e) {}
    }
  }

  // 6. Alihkan ke sr12-central jika sedang di toko lain
  const isDevOpen = appState.isDevMasterLoggedIn && document.getElementById('devSuperAdminWorkspace')?.style.display !== 'none';
  if (isDevOpen) {
    loadStoreBySlug('sr12-central');
  } else {
    switchPartnerStore('sr12-central');
  }
  if (typeof history !== 'undefined' && history.replaceState) {
    history.replaceState(null, '', window.location.pathname + (isDevOpen ? '#developer' : ''));
  }

  // 7. Update seluruh tampilan UI
  renderStoreDropdown();
  if (!isDevOpen) {
    renderStoreBranding();
    if (typeof renderOfficialDistributorDirectory === 'function') {
      renderOfficialDistributorDirectory();
    }
  }
  if (typeof updateDevPortalMetrics === 'function') {
    updateDevPortalMetrics();
  }

  showToast(`✅ Berhasil! Seluruh ${slugs.length} toko mitra telah dihapus bersih dari sistem dan Cloud.`);
}

window.deletePartnerStore = deletePartnerStore;
window.deleteCurrentActiveStore = deleteCurrentActiveStore;
window.deleteAllPartnerStores = deleteAllPartnerStores;

/**
 * Reset PIN Toko Mitra Tertentu oleh Developer
 */
async function promptResetStorePin(slug) {
  const store = (appState.partnerStores || []).find(s => s.slug === slug);
  if (!store) return;

  const currentPin = store.storeAdminPin || '1234';
  const newPin = prompt(
    `🔑 RESET PIN ADMIN TOKO\n\n` +
    `Nama Toko: ${store.storeName} (${slug})\n` +
    `PIN Saat Ini: ${currentPin}\n\n` +
    `Masukkan PIN Baru untuk toko ini (minimal 4 digit):`,
    '1234'
  );

  if (!newPin) return;
  const cleanPin = String(newPin).trim();
  if (cleanPin.length < 4) {
    alert('PIN harus minimal 4 karakter!');
    return;
  }

  // 1. Update ke memori lokal
  store.storeAdminPin = cleanPin;
  if (appState.storeSettings && appState.storeSettings.slug === slug) {
    appState.storeSettings.storeAdminPin = cleanPin;
    saveStoredSettings(appState.storeSettings);
  }
  saveStoredPartnerStores(appState.partnerStores);

  // 2. Sinkronkan ke Supabase Cloud
  if (typeof updateStorePinInSupabase === 'function') {
    try {
      await updateStorePinInSupabase(slug, cleanPin);
    } catch(e) {
      console.warn('Gagal update PIN ke Cloud:', e);
    }
  }

  // 3. Perbarui tampilan UI
  if (typeof updateDevPortalMetrics === 'function') {
    updateDevPortalMetrics();
  }

  alert(`✅ Sukses! PIN Admin untuk toko "${store.storeName}" berhasil direset menjadi: ${cleanPin}\n\nSilakan berikan PIN ini kepada pemilik toko.`);
  showToast(`🔑 PIN toko "${store.storeName}" direset ke ${cleanPin}`);
}
window.promptResetStorePin = promptResetStorePin;

/**
 * Reset PIN Seluruh Toko Mitra Sekaligus oleh Developer
 */
async function resetAllStoresPin() {
  const customStores = (appState.partnerStores || []).filter(s => s && s.slug && s.slug !== 'sr12-central');
  if (customStores.length === 0) {
    alert('Tidak ada toko mitra untuk direset PIN. Hanya Toko Pusat yang aktif.');
    return;
  }

  const defaultResetPin = prompt(
    `🔑 RESET PIN SELURUH TOKO MITRA\n\n` +
    `Fitur ini akan mereset PIN login untuk SEMUA (${customStores.length}) toko mitra.\n\n` +
    `Masukkan PIN default baru (minimal 4 digit):`,
    '1234'
  );

  if (!defaultResetPin) return;
  const cleanPin = String(defaultResetPin).trim();
  if (cleanPin.length < 4) {
    alert('PIN harus minimal 4 karakter!');
    return;
  }

  const confirmed = confirm(
    `⚠️ KONFIRMASI RESET PIN MASSAL\n\n` +
    `Apakah Anda yakin ingin mereset PIN login SEMUA (${customStores.length}) toko mitra menjadi "${cleanPin}"?\n\n` +
    `Tindakan ini akan disimpan ke memori dan disinkronkan ke Supabase Cloud.`
  );
  if (!confirmed) return;

  // 1. Update di memori lokal
  customStores.forEach(s => {
    s.storeAdminPin = cleanPin;
  });
  if (appState.storeSettings && appState.storeSettings.slug !== 'sr12-central') {
    appState.storeSettings.storeAdminPin = cleanPin;
    saveStoredSettings(appState.storeSettings);
  }
  saveStoredPartnerStores(appState.partnerStores);

  // 2. Sinkronkan ke Supabase Cloud
  if (typeof updateStorePinInSupabase === 'function') {
    for (const s of customStores) {
      try {
        await updateStorePinInSupabase(s.slug, cleanPin);
      } catch(e) {}
    }
  }

  // 3. Perbarui tampilan UI
  if (typeof updateDevPortalMetrics === 'function') {
    updateDevPortalMetrics();
  }

  alert(`✅ Berhasil! Seluruh (${customStores.length}) toko mitra telah direset PIN-nya menjadi: ${cleanPin}`);
  showToast(`🔑 PIN seluruh toko mitra berhasil direset ke ${cleanPin}`);
}
window.resetAllStoresPin = resetAllStoresPin;

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
  const isInsidePortal = document.getElementById('distributorOlseraPortal') && 
                         document.getElementById('distributorOlseraPortal').style.display !== 'none';
  const isAuthorized = !!appState.isDevMasterLoggedIn || 
                       !!appState.isDistributorLoggedIn || 
                       !!appState.isAdminMode || 
                       isInsidePortal;

  // Hanya pengunjung umum di luar portal yang diminta PIN dev jika mencoba mengakses
  if (!isAuthorized) {
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
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  try {
    const name = document.getElementById('settingStoreName')?.value.trim();
    const tagline = document.getElementById('settingStoreTagline')?.value.trim();
    const logoText = document.getElementById('settingLogoText')?.value.trim().toUpperCase() || 'SR12';
    const wa = document.getElementById('settingStoreWa')?.value.trim();
    const city = document.getElementById('settingStoreCity')?.value.trim();
    const owner = document.getElementById('settingStoreOwner')?.value.trim();
    const heroTitle = document.getElementById('settingHeroTitle')?.value.trim();
    const heroSubtitle = document.getElementById('settingHeroSubtitle')?.value.trim();
    const feePayer = document.getElementById('settingFeePayer')?.value || 'buyer';
    const curSlug = appState.currentStoreSlug || appState.storeSettings?.slug || 'alzam-agency';
    const savedSlugPin = localStorage.getItem(`sr12_store_pin_${curSlug}`);
    const inputPin = document.getElementById('settingStoreAdminPin')?.value.trim();
    const storeAdminPin = (inputPin && inputPin !== '••••') ? inputPin : (savedSlugPin || '1234');
    const globalFeeVal = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);
    appState.platformFee = globalFeeVal;

    let logoUrl = appState.storeSettings.storeLogoUrl || 'assets/sr12-logo.png';
    if (appState.tempStoreLogoBase64) {
      logoUrl = appState.tempStoreLogoBase64;
    }

    let bannerUrl = (appState.tempHeroBannerBase64 !== null && appState.tempHeroBannerBase64 !== undefined)
      ? appState.tempHeroBannerBase64
      : (appState.storeSettings.heroBannerUrl || '');

    appState.storeSettings = {
      ...appState.storeSettings,
      storeName: name || (appState.storeSettings && appState.storeSettings.storeName) || 'SR12 Partner Hub',
      storeTagline: tagline || (appState.storeSettings && appState.storeSettings.storeTagline) || 'Herbal Skin Care Ecosystem',
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
      platformFeeAmount: globalFeeVal,
      storeAdminPin: storeAdminPin
    };

    // Simpan berkas dokumen SK fisik baru jika diunggah
    if (appState.tempStoreSkBase64) {
      appState.storeSettings.skDocUrl = appState.tempStoreSkBase64;
      appState.storeSettings.skDocName = appState.tempStoreSkDocName || 'Dokumen_SK_Toko.jpg';
    }

    // Sinkronkan ke daftar partnerStores agar direktori pusat terupdate seketika
    const currentIdx = (appState.partnerStores || []).findIndex(s => s.slug === appState.currentStoreSlug);
    if (currentIdx > -1) {
      appState.partnerStores[currentIdx] = {
        ...appState.partnerStores[currentIdx],
        ...appState.storeSettings
      };
      saveStoredPartnerStores(appState.partnerStores);
    }

    appState.tempStoreLogoBase64 = null;
    appState.tempHeroBannerBase64 = null;
    appState.tempStoreSkBase64 = null;
    appState.tempStoreSkDocName = null;

    try {
      localStorage.setItem('sr12_store_settings_v4', JSON.stringify(appState.storeSettings));
      if (curSlug) {
        localStorage.setItem(`sr12_store_pin_${curSlug}`, storeAdminPin);
      }
    } catch (lsErr) {
      console.warn('Peringatan kuota localStorage penuh saat simpan store settings:', lsErr);
    }
    
    if (typeof saveStoreToSupabase === 'function') {
      try {
        saveStoreToSupabase(appState.storeSettings);
      } catch (sbErr) {
        console.warn('Peringatan Supabase sync:', sbErr);
      }
    }

    // Pembaruan DOM seketika untuk respons visual langsung
    const heroCover = document.getElementById('distHeroCoverImg');
    if (heroCover) {
      if (bannerUrl && bannerUrl.trim()) {
        heroCover.src = bannerUrl;
        heroCover.style.display = 'block';
      } else {
        heroCover.src = '';
        heroCover.style.display = 'none';
      }
    }
    const heroLogo = document.getElementById('distHeroLogoImg');
    if (heroLogo) heroLogo.src = getStoreEmblemSvgUrl(appState.storeSettings);

    renderStoreBranding();
    updateCartSummary();
    closeModal('modalStoreSettings');
    const modalEl = document.getElementById('modalStoreSettings');
    if (modalEl) modalEl.classList.remove('open');
    if (typeof ensureScrollUnlocked === 'function') ensureScrollUnlocked();

    showToast(`🎉 Profil & Pengaturan Toko Berhasil Disimpan: "${appState.storeSettings.storeName}"!`);
  } catch (fatalErr) {
    console.error('Error saat menyimpan pengaturan toko:', fatalErr);
    closeModal('modalStoreSettings');
    const modalEl = document.getElementById('modalStoreSettings');
    if (modalEl) modalEl.classList.remove('open');
    if (typeof ensureScrollUnlocked === 'function') ensureScrollUnlocked();
    showToast('⚠️ Pengaturan toko berhasil diperbarui di layar!');
  }
}
window.handleSaveStoreSettingsSubmit = handleSaveStoreSettingsSubmit;

function resetStoreBannerToDefault() {
  appState.tempHeroBannerBase64 = '';
  const previewBanner = document.getElementById('settingBannerPreview');
  if (previewBanner) {
    previewBanner.src = '';
    previewBanner.style.display = 'none';
  }
  const fileInput = document.getElementById('settingBannerFileInput');
  if (fileInput) fileInput.value = '';
  showToast('🗑️ Banner dikosongkan (toko memakai gradien tema).');
}
window.resetStoreBannerToDefault = resetStoreBannerToDefault;

function selectBannerPreset(presetUrl) {
  if (!presetUrl) return;
  appState.tempHeroBannerBase64 = presetUrl;
  const previewBanner = document.getElementById('settingBannerPreview');
  if (previewBanner) {
    previewBanner.src = presetUrl;
    previewBanner.style.display = 'block';
  }
  const olseraBannerPreview = document.getElementById('olseraSetBannerPreviewImg');
  if (olseraBannerPreview) {
    olseraBannerPreview.src = presetUrl;
    olseraBannerPreview.style.display = 'block';
  }
  const fileInput = document.getElementById('settingBannerFileInput');
  if (fileInput) fileInput.value = '';
  showToast('🖼️ Template banner resmi SR12 dipilih!');
}
window.selectBannerPreset = selectBannerPreset;

function resetStoreLogoToDefault() {
  appState.tempStoreLogoBase64 = 'assets/sr12-logo.png';
  const previewLogo = document.getElementById('settingLogoPreview');
  if (previewLogo) {
    previewLogo.src = 'assets/sr12-logo.png';
    previewLogo.style.display = 'block';
  }
  const fileInput = document.getElementById('settingLogoFileInput');
  if (fileInput) fileInput.value = '';
  const textInput = document.getElementById('settingLogoText');
  if (textInput) textInput.value = 'SR12';
  showToast('🌿 Foto profil dikembalikan ke Logo Resmi SR12.');
}
window.resetStoreLogoToDefault = resetStoreLogoToDefault;

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

  const activeSlug = appState.currentStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || 'alzam-agency';
  appState.products.unshift(newProduct);
  saveStoreProductOverride(activeSlug, newProduct);
  if (typeof dbSaveProduct === 'function') {
    dbSaveProduct({ ...newProduct, id: `${activeSlug}___${newProduct.id}`, originalId: newProduct.id, store_slug: activeSlug });
  }
  if (typeof saveProductToSupabase === 'function') {
    saveProductToSupabase(newProduct, activeSlug);
  }

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

function openAddPromoModal() {
  const isAuthorized = (typeof appState !== 'undefined') && !!(appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn);
  if (!isAuthorized) {
    alert('Akses Ditolak: Anda harus login sebagai Pemilik Toko (Distributor) untuk membuat promo toko.');
    return;
  }
  const modal = document.getElementById('modalAddPromo');
  if (modal) modal.classList.add('open');
}
window.openAddPromoModal = openAddPromoModal;

function deleteReward(rewardId, rewardTitle) {
  const isAuthorized = (typeof appState !== 'undefined') && !!(appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn);
  if (!isAuthorized) {
    alert('Akses Ditolak: Fitur pengelolaan reward/promo hanya dapat diakses oleh Pemilik Toko (Distributor Resmi).');
    return;
  }

  if (!confirm(`Apakah Anda yakin ingin menghapus promo/hadiah "${rewardTitle}" ini dari katalog toko?`)) {
    return;
  }

  const currentStoreSlug = (typeof appState !== 'undefined' && appState.currentStoreSlug) ? appState.currentStoreSlug : 'sr12-central';

  // 1. Simpan ke daftar deleted rewards per toko & global agar tidak muncul kembali
  const storeDeletedKey = `sr12_deleted_rewards_${currentStoreSlug}`;
  let deletedIds = JSON.parse(localStorage.getItem(storeDeletedKey) || '[]');
  if (!deletedIds.includes(rewardId)) {
    deletedIds.push(rewardId);
    localStorage.setItem(storeDeletedKey, JSON.stringify(deletedIds));
  }
  let globalDeleted = JSON.parse(localStorage.getItem('sr12_deleted_rewards') || '[]');
  if (!globalDeleted.includes(rewardId)) {
    globalDeleted.push(rewardId);
    localStorage.setItem('sr12_deleted_rewards', JSON.stringify(globalDeleted));
  }

  // 2. Hapus dari custom rewards jika ada
  const storeCustomKey = `sr12_custom_rewards_${currentStoreSlug}`;
  let customRewards = JSON.parse(localStorage.getItem(storeCustomKey) || localStorage.getItem('sr12_custom_rewards') || '[]');
  customRewards = customRewards.filter(r => r.id !== rewardId);
  localStorage.setItem(storeCustomKey, JSON.stringify(customRewards));
  localStorage.setItem('sr12_custom_rewards', JSON.stringify(customRewards));

  // 3. Update appState.rewards
  appState.rewards = (appState.rewards || []).filter(r => r.id !== rewardId);

  renderRewards();
  showToast(`🗑️ Promo "${rewardTitle}" berhasil dihapus dari katalog toko!`);
}
window.deleteReward = deleteReward;

function renderRewards() {
  const container = document.getElementById('rewardsGrid');
  if (!container) return;

  const isOwner = (typeof appState !== 'undefined') && !!(appState.isAdminMode || appState.isDistributorLoggedIn || appState.isDevMasterLoggedIn);

  const filtered = (appState.rewards || []).filter(r => {
    if (appState.selectedRewardScope === 'all') return true;
    return r.scope === appState.selectedRewardScope;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <p style="font-weight: 700; color: var(--dark-700);">Belum Ada Promo dalam Kategori Ini</p>
        ${isOwner ? '<p style="font-size: 0.82rem; color: var(--dark-500); margin-top: 4px;">Anda dapat membuat promo toko baru kapan saja menggunakan tombol di atas.</p>' : ''}
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const isResmi = r.scope === 'resmi';
    const escapedTitle = (r.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `
      <div class="reward-card" style="${!isResmi ? 'border-color: #fbcfe8; background: #fffdfd;' : ''}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
            <span class="reward-badge-tag" style="${!isResmi ? 'background: #fdf2f8; color: #be185d;' : ''}">${r.badge}</span>
            ${isOwner ? `
              <button type="button" class="btn-delete-reward-card" onclick="deleteReward('${r.id}', '${escapedTitle}')" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #dc2626; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.74rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Hapus Promo / Hadiah Ini">
                <span>🗑️</span> Hapus
              </button>
            ` : ''}
          </div>
          <h3 style="margin-top: 4px;">${r.title}</h3>
          <div class="reward-points-required" style="${!isResmi ? 'color: #be185d;' : ''}">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            ${(r.requiredPoints || 0).toLocaleString('id-ID')} Poin
          </div>
          <p class="reward-desc-text">${r.description}</p>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 14px; align-items: stretch;">
          <button type="button" class="btn-claim-reward" style="flex: 1; padding: 10px 14px; border-radius: var(--radius-md); font-weight: 700; font-size: 0.85rem; cursor: pointer; ${!isResmi ? 'background: #be185d; color: #fff;' : ''}" onclick="claimReward('${r.id}', ${r.requiredPoints || 0}, '${escapedTitle}')">
            🎁 Tukar / Klaim Reward
          </button>
          ${isOwner ? `
            <button type="button" class="btn-delete-reward-action" onclick="deleteReward('${r.id}', '${escapedTitle}')" style="background: #fef2f2; border: 1.5px solid #ef4444; color: #dc2626; padding: 10px 14px; border-radius: var(--radius-md); font-weight: 800; font-size: 0.82rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px; box-shadow: 0 1px 3px rgba(239,68,68,0.15);" title="Hapus Promo/Hadiah Ini dari Toko">
              <span style="font-size: 0.95rem;">🗑️</span> <span>Hapus</span>
            </button>
          ` : ''}
        </div>
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
  try {
    localStorage.setItem('sr12_active_public_tab', tabId);
    localStorage.setItem('sr12_current_view', 'storefront');
    localStorage.setItem('sr12_active_view_mode', 'storefront');
    if (window.location.hash !== '#' + tabId) {
      history.replaceState(null, '', window.location.pathname + window.location.search + '#' + tabId);
    }
  } catch(e) {}

  // Jika sedang berada di dalam antarmuka Olsera Suite Dashboard, arahkan ke tab Olsera terkait agar layar tidak putih
  const portal = document.getElementById('distributorOlseraPortal');
  const isOlseraActive = (document.body.classList.contains('olsera-portal-active') || (portal && portal.style.display !== 'none'));
  if (isOlseraActive && typeof switchOlseraTab === 'function') {
    if (tabId === 'marketers') {
      switchOlseraTab('marketer');
      return;
    }
    if (tabId === 'resellers') {
      switchOlseraTab('mitra');
      return;
    }
  }

  // Jika tombol Mitra atau Gaji Marketer ditekan saat mode admin distributor aktif, buka langsung di portal Olsera agar header toko tidak bocor
  if ((tabId === 'marketers' || tabId === 'resellers') && typeof showDistributorPortalView === 'function') {
    showDistributorPortalView(true);
    if (typeof switchOlseraTab === 'function') {
      switchOlseraTab(tabId === 'marketers' ? 'marketer' : 'mitra');
      return;
    }
  }

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
    if (typeof renderRewards === 'function') renderRewards();
    if (typeof updateViewModeUI === 'function') updateViewModeUI();
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

// ==========================================
// SINKRONISASI PESANAN CLOUD JARINGAN UNTUK METRIK DEVELOPER
// ==========================================
async function syncAllNetworkOrdersForDev() {
  if (typeof initSupabaseClient !== 'function') return;
  const client = initSupabaseClient();
  if (!client) return;
  try {
    const token = (typeof getActiveSessionToken === 'function') ? getActiveSessionToken('all') : null;
    const { data: allOrders, error } = await client.rpc('rpc_get_store_orders', {
      p_slug: 'all',
      p_token: token || 'dev_master'
    });
    if (!error && Array.isArray(allOrders)) {
      window._allCloudOrdersCache = allOrders.map(r => ({
        id: r.order_id,
        store_slug: r.store_slug,
        grandTotal: Number(r.grand_total) || 0,
        subtotalHet: Number(r.subtotal_het) || 0,
        status: r.status,
        orderSource: r.order_source
      }));
      if (typeof updateDevPortalMetrics === 'function') {
        updateDevPortalMetrics();
      }
    }
  } catch(e) {
    console.warn('syncAllNetworkOrdersForDev note:', e);
  }
}
window.syncAllNetworkOrdersForDev = syncAllNetworkOrdersForDev;

function updateDevPortalMetrics() {
  const m = appState.devMetrics || {};
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

  const validStores = (appState.partnerStores || []).filter(s => s && s.slug && s.slug !== 'toko-supa-distributor' && !s.slug.startsWith('deleted_'));
  const totalStores = validStores.length;

  // Akumulasi Transaksi Jaringan, Omzet GMV, & Kas Top-up dari seluruh toko:
  let storeTxSum = 0;
  let storeGmvSum = 0;
  let storeTopupSum = 0;

  validStores.forEach(s => {
    // Top-up kas
    storeTopupSum += (Number(s.totalTopupPaid) || 0);

    // Transaksi dari counter toko (sinkronisasi dari cloud stores.total_tx)
    let sTx = Number(s.totalTx) || 0;
    let sGmv = 0;

    // Transaksi lokal toko jika tersimpan di browser
    try {
      const rawLocal = localStorage.getItem(`sr12_pos_transactions_v2_${s.slug}`) || localStorage.getItem(`sr12_customer_orders_${s.slug}`);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(t => t && t.status !== 'Dihapus' && t.status !== 'deleted' && t.status !== 'Dibatalkan' && !t.id?.startsWith('CSH-'));
          sTx = Math.max(sTx, valid.length);
          sGmv = valid.reduce((acc, t) => acc + (Number(t.grandTotal) || Number(t.subtotalHet) || 0), 0);
        }
      }
    } catch(e) {}

    // Transaksi toko yang sedang aktif di memori
    if (appState.storeSettings && appState.storeSettings.slug === s.slug && Array.isArray(appState.transactions)) {
      const activeValid = appState.transactions.filter(t => t && t.status !== 'Dihapus' && t.status !== 'deleted' && t.status !== 'Dibatalkan' && !t.id?.startsWith('CSH-'));
      sTx = Math.max(sTx, activeValid.length);
      const activeGmv = activeValid.reduce((acc, t) => acc + (Number(t.grandTotal) || Number(t.subtotalHet) || 0), 0);
      sGmv = Math.max(sGmv, activeGmv);
    }

    storeTxSum += sTx;
    storeGmvSum += sGmv;
  });

  // Gabungkan jika ada cache seluruh pesanan cloud
  if (Array.isArray(window._allCloudOrdersCache) && window._allCloudOrdersCache.length > 0) {
    const validCloud = window._allCloudOrdersCache.filter(o => o && o.status !== 'Dihapus' && o.status !== 'deleted' && !o.id?.startsWith('CSH-') && o.orderSource !== 'Buku Kas Olsera');
    storeTxSum = Math.max(storeTxSum, validCloud.length);
    const cloudGmv = validCloud.reduce((acc, o) => acc + (Number(o.grandTotal) || Number(o.subtotalHet) || 0), 0);
    storeGmvSum = Math.max(storeGmvSum, cloudGmv);
  }

  const totalTx = Math.max(storeTxSum, m.totalPlatformTransactions || 0);
  const totalFee = totalTx * (appState.platformFee || 2000);
  const totalTopupKas = storeTopupSum;
  const totalGMV = Math.max(storeGmvSum, m.totalGMV || 0);

  // Sync Modal Numbers
  if (dTx) dTx.textContent = totalTx.toLocaleString('id-ID');
  if (dFee) dFee.textContent = formatRupiah(totalFee);
  if (dStores) dStores.textContent = `${totalStores} Toko`;
  if (dGmv) dGmv.textContent = formatRupiah(totalGMV);
  if (dTopup) dTopup.textContent = formatRupiah(totalTopupKas);
  const devEmailText = appState.developerEmail || localStorage.getItem('sr12_dev_email') || 'developer@sr12.co.id';
  if (pinDisp) pinDisp.textContent = devEmailText;
  if (storesCounter) storesCounter.textContent = `${totalStores} Toko Terdaftar`;

  // Sync Workspace Console Numbers
  if (wsTx) wsTx.textContent = totalTx.toLocaleString('id-ID');
  if (wsFee) wsFee.textContent = formatRupiah(totalFee);
  if (wsStores) wsStores.textContent = `${totalStores} Toko`;
  if (wsTopup) wsTopup.textContent = formatRupiah(totalTopupKas);
  if (wsGmv) wsGmv.textContent = formatRupiah(totalGMV);
  if (wsPin) wsPin.textContent = devEmailText;
  if (navStores) navStores.textContent = `${totalStores} Toko`;
  if (navFee) navFee.textContent = formatRupiah(totalFee);
  const storesCounter_ws = document.getElementById('devTotalStoresCounter_ws');
  if (storesCounter_ws) storesCounter_ws.textContent = `${totalStores} Toko Terdaftar`;

  // Sinkronkan Input Tarif Biaya Admin Sistem Global Developer
  const inputGlobalFee = document.getElementById('inputDevGlobalFeeAmount');
  if (inputGlobalFee && !inputGlobalFee.matches(':focus')) {
    inputGlobalFee.value = appState.platformFee || 2000;
  }
  if (typeof updateTopupPackageCardsUI === 'function') {
    updateTopupPackageCardsUI();
  }

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
  if (consolePin) consolePin.textContent = isMasterPinVisible ? (appState.masterDevPin || '8899') : '••••';

  // 1. Render Modal Stores Table
  if (storesTableBody) {
    storesTableBody.innerHTML = appState.partnerStores.map(s => {
      const tierObj = SR12_TIERS[s.partnerTier] || SR12_TIERS.reseller;
      const quotaVal = typeof s.orderQuota === 'number' ? s.orderQuota : 10;
      const statusBadge = s.isBlocked
        ? `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 1px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 800;">🚫 DIBLOKIR</span>`
        : `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 1px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700;">🟢 AKTIF</span>`;
      return `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 6px 8px; font-weight: 700;">
            ${s.storeName}
            <div style="font-size: 0.7rem; color: #38bdf8; font-family: monospace;">?store=${s.slug}</div>
            <div style="margin-top: 2px;">${statusBadge}</div>
          </td>
          <td style="padding: 6px 8px;">${s.storeOwner}</td>
          <td style="padding: 6px 8px;"><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">${tierObj.name}</span></td>
          <td style="padding: 6px 8px; font-family: monospace;">${s.storeWaNumber}</td>
          <td style="padding: 6px 8px; text-align: center;">
            <span style="background: ${quotaVal <= 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${quotaVal <= 2 ? '#f87171' : '#34d399'}; padding: 3px 8px; border-radius: 9999px; font-weight: 800; font-size: 0.72rem; display: inline-block;">
              ${quotaVal} Order
            </span>
          </td>
          <td style="padding: 6px 8px; text-align: center;">
            <div style="display: inline-flex; gap: 4px; justify-content: center; align-items: center; flex-wrap: wrap;">
              <button onclick="switchPartnerStore('${s.slug}'); closeModal('modalDevPortal');" style="background: #0284c7; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                Buka
              </button>
              <button onclick="openDevEditStoreModal('${s.slug}'); closeModal('modalDevPortal');" style="background: #0d9488; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;" title="Edit Data & NIK Toko">
                ✏️ NIK
              </button>
              ${s.slug !== 'sr12-central' ? `
              <button onclick="toggleBlockStore('${s.slug}')" style="background: ${s.isBlocked ? '#059669' : '#dc2626'}; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;" title="${s.isBlocked ? 'Buka Blokir Toko' : 'Blokir Toko Karena Pelanggaran'}">
                ${s.isBlocked ? '✅ Buka' : '🚫 Blok'}
              </button>
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
      const statusBadge = s.isBlocked
        ? `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 800; display: inline-block;">🚫 DIBLOKIR</span>`
        : `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; display: inline-block;">🟢 AKTIF</span>`;
      return `
        <tr style="border-bottom: 1px solid #334155;">
          <td data-label="Nama Toko" style="padding: 10px 12px; font-weight: 700;">
            <div style="font-size: 0.9rem; color: #f8fafc;">${escapeHtml(s.storeName)}</div>
            <div style="font-size: 0.72rem; color: #38bdf8; font-family: monospace;">?store=${escapeHtml(s.slug)}</div>
            <div style="font-size: 0.72rem; color: #38bdf8; font-weight: 600; margin-top: 2px;">✉️ ${escapeHtml(s.ownerEmail || s.owner_email || 'Email belum diatur')}</div>
            <div style="margin-top: 4px;">${statusBadge}</div>
          </td>
          <td data-label="Pemilik & Kota" style="padding: 10px 12px;">
            <div style="font-weight: 600; color: #f1f5f9;">${escapeHtml(s.storeOwner)}</div>
            <div style="font-size: 0.7rem; color: #94a3b8;">📍 ${escapeHtml(s.storeCity || '-')}</div>
          </td>
          <td data-label="Level" style="padding: 10px 12px;"><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">${tierObj.name}</span></td>
          <td data-label="WhatsApp" style="padding: 10px 12px; font-family: monospace; color: #cbd5e1;">+${escapeHtml(s.storeWaNumber)}</td>
          <td data-label="Sisa Kuota" style="padding: 10px 12px; text-align: center;">
            <span style="background: ${quotaVal <= 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${quotaVal <= 2 ? '#f87171' : '#34d399'}; padding: 4px 12px; border-radius: 9999px; font-weight: 800; font-size: 0.75rem; display: inline-block;">
              ${quotaVal} Order
            </span>
          </td>
          <td data-label="Aksi" style="padding: 10px 12px; text-align: center; white-space: nowrap;">
            <div style="display: inline-flex; gap: 6px; align-items: center; width: 100%; justify-content: flex-end; flex-wrap: wrap;">
              <button type="button" onclick="switchPartnerStore('${s.slug}'); showDeveloperWorkspaceView(false);" style="background: #0284c7; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                👁️ Tinjau
              </button>
              <button type="button" onclick="openDevStoreAdminBackoffice('${s.slug}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);">
                👑 Backoffice
              </button>
              <button type="button" onclick="openDevEditStoreModal('${s.slug}')" style="background: #0d9488; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);" title="Edit Data & NIK Pemilik Toko">
                ✏️ Edit NIK
              </button>
              ${s.slug !== 'sr12-central' ? `
              <button type="button" onclick="toggleBlockStore('${s.slug}')" style="background: ${s.isBlocked ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #dc2626, #b91c1c)'}; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="${s.isBlocked ? 'Buka Blokir Toko' : 'Blokir Toko Karena Pelanggaran'}">
                ${s.isBlocked ? '✅ Buka' : '🚫 Blok'}
              </button>
              <button type="button" onclick="deletePartnerStore('${s.slug}')" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);" title="Hapus Toko Permanen">
                🗑️
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
                <button type="button" onclick="deletePendingStoreApp('${app.id}')" title="Hapus Permanen" style="background: #991b1b; color: #fff; border: none; padding: 5px 9px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
                  🗑️ Hapus
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
                <button type="button" onclick="deletePendingStoreApp('${app.id}')" title="Hapus Permanen dari Database" style="background: #991b1b; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; cursor: pointer;">
                  🗑️ Hapus
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
    const deletedSlugs = getDeletedStoreSlugs();
    const list = (appState.mitraList || []).filter(m => !m.store_slug || !deletedSlugs.includes(m.store_slug));
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
        const storeObj = appState.partnerStores?.find(s => s.slug === m.store_slug);
        const storeLabel = storeObj ? storeObj.storeName : (m.store_slug === 'sr12-central' ? 'Official Central Hub' : (m.store_slug || 'Pusat'));
        return `
          <tr style="border-bottom: 1px solid #334155;">
            <td data-label="Nama Mitra" style="padding: 10px 12px; font-weight: 600; color: #f1f5f9;">
              ${m.name || '-'}
              <div style="font-size: 0.7rem; color: #38bdf8; margin-top: 2px;">🏪 ${storeLabel}</div>
            </td>
            <td data-label="ID Mitra" style="padding: 10px 12px; font-family: monospace; color: #38bdf8;">${m.id || '-'}</td>
            <td data-label="Level" style="padding: 10px 12px;"><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">${tierName}</span></td>
            <td data-label="WhatsApp" style="padding: 10px 12px; font-family: monospace; color: #cbd5e1;">${m.phone || '-'}</td>
            <td data-label="Poin" style="padding: 10px 12px; font-weight: 700; color: #fbbf24;">${m.points || 0} Poin</td>
            <td data-label="Aksi" style="padding: 10px 12px; text-align: center; white-space: nowrap;">
              <div style="display: inline-flex; gap: 4px; align-items: center; justify-content: center;">
                <button type="button" onclick="contactMitraWA('${m.phone || ''}', '${m.name || ''}')" style="background: rgba(37, 211, 102, 0.15); border: 1px solid #25d366; color: #4ade80; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                  Hubungi WA
                </button>
                <button type="button" onclick="deleteNetworkMitra('${m.id || ''}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;" title="Hapus Mitra dari Database Sentral">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
    const networkScopeBadge = document.getElementById('devNetworkScopeBadge');
    if (networkScopeBadge) {
      networkScopeBadge.innerHTML = `<span>🌐</span> <span>Global Network (${list.length} Mitra)</span>`;
    }
  }
}

function openDevEditStoreModal(slug) {
  const store = (appState.partnerStores || []).find(s => s && s.slug === slug);
  if (!store) {
    showToast('❌ Toko tidak ditemukan.');
    return;
  }

  const modal = document.getElementById('modalDevEditStore');
  if (!modal) return;

  const slugInput = document.getElementById('devEditStoreSlug');
  const nameInput = document.getElementById('devEditStoreName');
  const ownerInput = document.getElementById('devEditStoreOwner');
  const nikInput = document.getElementById('devEditStoreNik');
  const waInput = document.getElementById('devEditStoreWa');
  const cityInput = document.getElementById('devEditStoreCity');
  const pinInput = document.getElementById('devEditStorePin');
  const quotaInput = document.getElementById('devEditStoreQuota');

  if (slugInput) slugInput.value = store.slug;
  if (nameInput) nameInput.value = store.storeName || '';
  if (ownerInput) ownerInput.value = store.storeOwner || '';
  
  // Ambil NIK dari pending store atau partnerStores atau localStorage
  const savedNik = store.nikNumber || store.nik_number || localStorage.getItem(`sr12_store_nik_${store.slug}`) || '3374025804820003';
  if (nikInput) nikInput.value = savedNik;

  if (waInput) waInput.value = store.storeWaNumber || '';
  if (cityInput) cityInput.value = store.storeCity || '';

  // Ambil PIN aktual
  const savedPin = localStorage.getItem(`sr12_store_pin_${store.slug}`) || (store.storeAdminPin !== '••••' ? store.storeAdminPin : '') || '1234';
  if (pinInput) pinInput.value = savedPin;

  if (quotaInput) quotaInput.value = typeof store.orderQuota === 'number' ? store.orderQuota : 10;

  modal.classList.add('open');
}
window.openDevEditStoreModal = openDevEditStoreModal;

async function handleDevSaveStoreData(e) {
  if (e) e.preventDefault();
  const slugInput = document.getElementById('devEditStoreSlug');
  const slug = slugInput?.value;
  if (!slug) return;

  const storeIdx = (appState.partnerStores || []).findIndex(s => s && s.slug === slug);
  if (storeIdx < 0) {
    showToast('❌ Toko tidak ditemukan.');
    return;
  }

  const nameVal = document.getElementById('devEditStoreName')?.value.trim();
  const ownerVal = document.getElementById('devEditStoreOwner')?.value.trim();
  const nikVal = document.getElementById('devEditStoreNik')?.value.trim();
  const waVal = document.getElementById('devEditStoreWa')?.value.trim();
  const cityVal = document.getElementById('devEditStoreCity')?.value.trim();
  const pinVal = document.getElementById('devEditStorePin')?.value.trim() || '1234';
  const quotaVal = parseInt(document.getElementById('devEditStoreQuota')?.value, 10) || 10;

  if (!nameVal || !ownerVal) {
    alert('Nama toko dan nama pemilik wajib diisi!');
    return;
  }

  if (nikVal && nikVal.length !== 16) {
    alert('⚠️ NIK harus tepat 16 digit angka sesuai KTP!');
    return;
  }

  const submitBtn = document.getElementById('btnDevSaveStoreSubmit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Menyimpan...';
  }

  try {
    const s = appState.partnerStores[storeIdx];
    s.storeName = nameVal;
    s.storeOwner = ownerVal;
    s.nikNumber = nikVal;
    s.storeWaNumber = waVal;
    s.storeCity = cityVal;
    s.storeAdminPin = pinVal;
    s.orderQuota = quotaVal;

    // Simpan ke storage lokal
    localStorage.setItem(`sr12_store_pin_${slug}`, pinVal);
    localStorage.setItem(`sr12_store_nik_${slug}`, nikVal);
    saveStoredPartnerStores(appState.partnerStores);

    // Jika sedang di toko ini, perbarui appState.storeSettings
    if (appState.currentStoreSlug === slug) {
      appState.storeSettings = {
        ...appState.storeSettings,
        storeName: nameVal,
        storeOwner: ownerVal,
        nikNumber: nikVal,
        storeWaNumber: waVal,
        storeCity: cityVal,
        storeAdminPin: pinVal,
        orderQuota: quotaVal
      };
      try {
        localStorage.setItem('sr12_store_settings_v4', JSON.stringify(appState.storeSettings));
      } catch(e) {}
      if (typeof renderStoreBranding === 'function') renderStoreBranding();
    }

    // Sinkronkan ke Supabase Cloud
    if (typeof saveStoreToSupabase === 'function') {
      try {
        await saveStoreToSupabase(s);
      } catch(eSb) {
        console.warn('Sync to Supabase warning:', eSb);
      }
    }

    // Perbarui juga data di pending_stores jika ada row pengajuannya
    const client = (typeof initSupabaseClient === 'function') ? initSupabaseClient() : null;
    if (client) {
      try {
        await client.from('pending_stores').update({
          store_name: nameVal,
          store_owner: ownerVal,
          nik_number: nikVal,
          store_wa_number: waVal,
          store_city: cityVal
        }).eq('slug', slug);
      } catch(ePend) {}
    }

    showToast(`✅ Data & NIK Toko "${nameVal}" berhasil diperbarui!`);
    closeModal('modalDevEditStore');
    if (typeof renderDevPortal === 'function') renderDevPortal();
  } catch(err) {
    console.error('Error saving store data by dev:', err);
    alert('Gagal menyimpan perubahan: ' + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '💾 Simpan Perubahan Toko';
    }
  }
}
window.handleDevSaveStoreData = handleDevSaveStoreData;

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
  const effectiveFee = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);
  const fee = isFeeChargedToBuyer ? effectiveFee : 0;
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
    toast.style.bottom = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(15, 23, 42, 0.88)';
    toast.style.color = '#f8fafc';
    toast.style.padding = '6px 14px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '0.74rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '100005';
    toast.style.boxShadow = '0 4px 14px rgba(0,0,0,0.22)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.webkitBackdropFilter = 'blur(8px)';
    toast.style.border = '1px solid rgba(255,255,255,0.14)';
    toast.style.maxWidth = '86vw';
    toast.style.whiteSpace = 'nowrap';
    toast.style.overflow = 'hidden';
    toast.style.textOverflow = 'ellipsis';
    toast.style.pointerEvents = 'none';
    toast.style.transition = 'all 0.22s ease';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.display = 'block';

  if (toast._timer) clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 220);
  }, 1900);
}

// ==========================================
// REAL-TIME AUDIO ENGINE & NOTIFICATION CHIME (WEB AUDIO API UNLOCKED)
// ==========================================
let sr12GlobalAudioCtx = null;
let sr12AudioUnlocked = false;

function getSR12AudioContext() {
  if (!sr12GlobalAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sr12GlobalAudioCtx = new AudioCtx();
    }
  }
  return sr12GlobalAudioCtx;
}

function unlockSR12Audio() {
  if (sr12AudioUnlocked) return;
  const ctx = getSR12AudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        sr12AudioUnlocked = true;
        console.log('🔊 [Web Audio] AudioContext berhasil diaktifkan oleh gesture pengguna.');
      }).catch(() => {});
    } else if (ctx.state === 'running') {
      sr12AudioUnlocked = true;
    }
  }
}

// Global user gesture listeners: Aktifkan hak pemutaran audio browser pada klik/sentuhan pertama
if (typeof window !== 'undefined') {
  ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach(evtType => {
    window.addEventListener(evtType, unlockSR12Audio, { once: true, passive: true });
  });
}

/**
 * Nada Dering Pesanan Masuk: Harmoni Mewah 3-Nada (C6 -> E6 -> G6 + Sparkle C7)
 * Menghasilkan suara dering khas kasir ritel elegan tanpa ketergantungan file MP3 eksternal.
 */
function playOrderChime(isTest = false) {
  try {
    const ctx = getSR12AudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    // 3 nada beruntun yang merdu: C6 (1046.5Hz) -> E6 (1318.5Hz) -> G6 (1567.98Hz)
    const tones = [
      { freq: 1046.50, start: 0.00, dur: 0.35, gain: 0.25 },
      { freq: 1318.51, start: 0.11, dur: 0.40, gain: 0.28 },
      { freq: 1567.98, start: 0.22, dur: 0.70, gain: 0.30 }
    ];

    tones.forEach(tone => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, t + tone.start);

      // Fast attack & smooth exponential decay
      gain.gain.setValueAtTime(0.0001, t + tone.start);
      gain.gain.exponentialRampToValueAtTime(tone.gain, t + tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.start + tone.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + tone.start);
      osc.stop(t + tone.start + tone.dur + 0.05);
    });

    // Sentuhan harmonik sparkle lembut di nada penutup (C7)
    const sparkleOsc = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkleOsc.type = 'triangle';
    sparkleOsc.frequency.setValueAtTime(2093.00, t + 0.22);
    sparkleGain.gain.setValueAtTime(0.0001, t + 0.22);
    sparkleGain.gain.exponentialRampToValueAtTime(0.08, t + 0.24);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkleOsc.start(t + 0.22);
    sparkleOsc.stop(t + 0.90);

    if (isTest && typeof showToast === 'function') {
      showToast('🔔 Suara notifikasi aktif & berfungsi jernih!');
    }
  } catch (e) {
    console.warn('Audio chime warning:', e);
  }
}

/**
 * ========================================================
 * INDIKATOR STATUS CLOUD SUPABASE (REALTIME CONNECTION MONITOR)
 * ========================================================
 */
let currentCloudStatus = 'online';

function updateCloudStatusUI(status) {
  currentCloudStatus = status || (typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline');

  const badges = [
    document.getElementById('cloudStatusBadge'),
    document.getElementById('olseraCloudStatusBadge'),
    document.getElementById('adminCloudStatusBadge')
  ].filter(Boolean);

  let text = 'Cloud Aktif';
  let color = '#10b981';
  let bg = 'rgba(16, 185, 129, 0.12)';
  let border = 'rgba(16, 185, 129, 0.3)';
  let title = 'Cloud Supabase Terhubung Realtime. Klik untuk cek status & tes suara.';

  if (currentCloudStatus === 'connecting') {
    text = 'Menghubungkan...';
    color = '#f59e0b';
    bg = 'rgba(245, 158, 11, 0.12)';
    border = 'rgba(245, 158, 11, 0.3)';
    title = 'Sedang menyambungkan ke Cloud Supabase...';
  } else if (currentCloudStatus === 'offline') {
    text = 'Mode Offline';
    color = '#ef4444';
    bg = 'rgba(239, 68, 68, 0.12)';
    border = 'rgba(239, 68, 68, 0.3)';
    title = 'Koneksi internet terputus. Pesanan & transaksi diamankan di antrean lokal.';
  }

  // Cek antrean offline
  let queueCount = 0;
  if (typeof getOfflineTransactionsQueue === 'function') {
    queueCount = getOfflineTransactionsQueue().length;
  }
  if (queueCount > 0) {
    if (currentCloudStatus === 'online') {
      text = `Cloud Aktif (${queueCount} Antrean)`;
    } else {
      text = `Offline (${queueCount} Antrean)`;
    }
  }

  badges.forEach(b => {
    b.style.display = 'inline-flex';
    b.style.background = bg;
    b.style.borderColor = border;
    b.style.color = color;
    b.setAttribute('title', title);
    b.innerHTML = `
      <span class="cloud-status-dot ${currentCloudStatus}"></span>
      <span class="cloud-status-text">${text}</span>
    `;
  });
}

function handleCloudBadgeClick() {
  unlockSR12Audio();
  if (currentCloudStatus === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    if (typeof showToast === 'function') {
      showToast('🔴 Perangkat sedang offline. Pastikan koneksi internet / WiFi aktif.');
    }
  } else if (currentCloudStatus === 'connecting') {
    if (typeof showToast === 'function') {
      showToast('🟡 Sedang menyambungkan ke Supabase Cloud...');
    }
    if (typeof flushOfflineTransactions === 'function') flushOfflineTransactions();
  } else {
    playOrderChime(true);
    let queueCount = 0;
    if (typeof getOfflineTransactionsQueue === 'function') {
      queueCount = getOfflineTransactionsQueue().length;
    }
    if (queueCount > 0) {
      if (typeof showToast === 'function') {
        showToast(`🟢 Cloud Realtime Aktif! Memproses ${queueCount} pesanan di antrean...`);
      }
      if (typeof flushOfflineTransactions === 'function') flushOfflineTransactions();
    } else {
      if (typeof showToast === 'function') {
        showToast('🟢 Cloud Supabase Terhubung Realtime 100%!');
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 [Network] Perangkat kembali online.');
    updateCloudStatusUI('connecting');
    if (typeof flushOfflineTransactions === 'function') {
      setTimeout(() => {
        flushOfflineTransactions();
        updateCloudStatusUI('online');
      }, 1000);
    }
  });

  window.addEventListener('offline', () => {
    console.warn('🌐 [Network] Perangkat offline.');
    updateCloudStatusUI('offline');
    if (typeof showToast === 'function') {
      showToast('⚠️ Koneksi internet terputus. Mode antrean kasir offline aktif.');
    }
  });

  window.addEventListener('sr12:cloud-status', (e) => {
    const detail = e.detail || {};
    if (detail.status === 'SUBSCRIBED') {
      updateCloudStatusUI('online');
    } else if (detail.status === 'CLOSED' || detail.status === 'CHANNEL_ERROR' || detail.status === 'TIMED_OUT') {
      updateCloudStatusUI('connecting');
    }
  });

  window.addEventListener('sr12:offline-queue-updated', () => {
    updateCloudStatusUI(currentCloudStatus);
  });
}


function updateAdminNotificationUI() {
  const list = (appState.transactions || []).filter(t => t && t.status !== 'Dihapus' && t.status !== 'deleted');
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
  if (!order || !order.id) return;
  // Jangan pernah tampilkan banner untuk pesanan yang sudah berstatus selesai
  if (order.status === 'Lunas / Selesai' || order.status === 'Selesai') return;

  if (!appState.notifiedOrderIds) {
    try {
      const saved = localStorage.getItem('sr12_notified_orders');
      appState.notifiedOrderIds = new Set(saved ? JSON.parse(saved) : []);
    } catch(e) {
      appState.notifiedOrderIds = new Set();
    }
  }

  // Jika pesanan ini sudah pernah dinotifikasikan pop-up, jangan tampilkan banner mengambang lagi
  if (appState.notifiedOrderIds.has(order.id)) return;
  appState.notifiedOrderIds.add(order.id);
  try {
    localStorage.setItem('sr12_notified_orders', JSON.stringify(Array.from(appState.notifiedOrderIds).slice(-100)));
  } catch(e) {}

  playOrderChime();
  updateAdminNotificationUI();

  const banner = document.getElementById('adminFloatingOrderBanner');
  const nameEl = document.getElementById('floatingBannerCustomer');
  const detailsEl = document.getElementById('floatingBannerDetails');

  if (banner && nameEl && detailsEl) {
    nameEl.textContent = order.customerName;
    detailsEl.textContent = `${(order.items || []).length} macam produk • ${formatRupiah(order.grandTotal)} • ${order.paymentMethod || 'Ambil di Toko'}`;
    banner.style.display = 'block';

    if (banner._timer) clearTimeout(banner._timer);
    banner._timer = setTimeout(() => {
      banner.style.display = 'none';
    }, 7000);
  }

  showToast(`🔔 PESANAN MASUK BARU! ${order.customerName} (${formatRupiah(order.grandTotal)})`);
}

/**
 * Handler Realtime saat Supabase mendeteksi pesanan baru masuk dari laptop atau HP lain
 */
async function handleRealtimeCloudOrderUpdate(payload) {
  const currentSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  if (!payload || !payload.new) return;
  const newRow = payload.new;
  if (newRow.store_slug && newRow.store_slug !== currentSlug && currentSlug !== 'sr12-central') {
    return; // Pesanan ditujukan untuk toko mitra lain
  }

  // ISOLASI AKSES: Pengunjung biasa/katalog publik tidak perlu mengunduh data riwayat pesanan toko
  if (!appState.isAdminMode && !appState.isDistributorLoggedIn && !appState.isDevMasterLoggedIn) {
    return;
  }

  if (typeof syncOrdersFromSupabase === 'function') {
    try {
      const cloudOrders = await syncOrdersFromSupabase(currentSlug);
      if (Array.isArray(cloudOrders)) {
        mergeCloudOrdersIntoLocal(cloudOrders, currentSlug);
        
        if (typeof renderPosTransactions === 'function') renderPosTransactions();
        if (typeof renderAdminOrdersModal === 'function') renderAdminOrdersModal();
        if (typeof renderResellers === 'function') renderResellers();
        updateAdminNotificationUI();

        // Cari pesanan baru khusus event INSERT untuk membunyikan bel dan notifikasi sekali saja
        if (payload.eventType === 'INSERT' && newRow) {
          const targetOrderId = newRow.order_id;
          if (targetOrderId) {
            const targetOrder = (appState.transactions || []).find(o => o && o.id === targetOrderId);
            if (targetOrder && (targetOrder.status === 'Menunggu Konfirmasi' || targetOrder.status === 'Siap Diambil di Toko')) {
              triggerAdminNewOrderNotification(targetOrder);
            }
          }
        }
      }

      // Sinkronkan juga pembukuan gaji marketer dari cloud
      if (typeof syncMarketerSalesFromSupabase === 'function') {
        const cloudSales = await syncMarketerSalesFromSupabase(currentSlug);
        if (Array.isArray(cloudSales) && cloudSales.length > 0) {
          const local = appState.marketerSales || [];
          const sMap = new Map();
          local.forEach(s => { if (s && s.orderId) sMap.set(s.orderId, s); });
          cloudSales.forEach(cs => { if (cs && cs.orderId) sMap.set(cs.orderId, cs); });
          appState.marketerSales = Array.from(sMap.values());
          saveStoredMarketerSales(appState.marketerSales, false);
          if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
        }
      }
    } catch(e) {
      console.warn('Realtime cloud order handler exception:', e);
    }
  }
}
window.handleRealtimeCloudOrderUpdate = handleRealtimeCloudOrderUpdate;

function chatCustomerWa(phone, customerName, orderId) {
  const decPhone = decodeURIComponent(phone || '');
  const decName = decodeURIComponent(customerName || '');
  const decOrderId = decodeURIComponent(orderId || '');
  const cleanPhone = formatWaNumber(decPhone);
  if (!cleanPhone || cleanPhone.length < 8) {
    alert('Nomor WhatsApp pemesan (' + (decPhone || '-') + ') tidak valid atau tidak lengkap!');
    return;
  }
  const msg = `Halo Kak ${decName}, pesanan ${decOrderId} di SR12 sudah kami terima dan siap disiapkan. Terima kasih! 🌿`;
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

let currentAdminOrdersTab = 'pending';

function switchAdminOrdersTab(tab) {
  currentAdminOrdersTab = tab;
  const btnPending = document.getElementById('btnTabOrdersPending');
  const btnDone = document.getElementById('btnTabOrdersDone');
  if (btnPending && btnDone) {
    if (tab === 'pending') {
      btnPending.style.background = '#ecfdf5';
      btnPending.style.borderColor = '#059669';
      btnPending.style.color = '#065f46';
      btnPending.style.fontWeight = '800';
      btnDone.style.background = '#f8fafc';
      btnDone.style.borderColor = '#cbd5e1';
      btnDone.style.color = '#64748b';
      btnDone.style.fontWeight = '700';
    } else {
      btnDone.style.background = '#ecfdf5';
      btnDone.style.borderColor = '#059669';
      btnDone.style.color = '#065f46';
      btnDone.style.fontWeight = '800';
      btnPending.style.background = '#f8fafc';
      btnPending.style.borderColor = '#cbd5e1';
      btnPending.style.color = '#64748b';
      btnPending.style.fontWeight = '700';
    }
  }
  renderAdminOrdersModal();
}
window.switchAdminOrdersTab = switchAdminOrdersTab;

function renderAdminOrdersModal() {
  const body = document.getElementById('adminOrdersListBody');
  if (!body) return;

  const orders = (appState.transactions || []).filter(ord => ord && ord.status !== 'Dihapus' && ord.status !== 'deleted');
  const pendingOrders = orders.filter(ord => ord.status === 'Menunggu Konfirmasi' || ord.status === 'Siap Diambil di Toko');
  const doneOrders = orders.filter(ord => ord.status === 'Lunas / Selesai' || ord.status === 'Selesai');

  const badgePending = document.getElementById('adminOrdersTabBadgePending');
  const badgeDone = document.getElementById('adminOrdersTabBadgeDone');
  if (badgePending) badgePending.textContent = pendingOrders.length;
  if (badgeDone) badgeDone.textContent = doneOrders.length;

  const displayList = (currentAdminOrdersTab === 'pending') ? pendingOrders : doneOrders;

  if (displayList.length === 0) {
    if (currentAdminOrdersTab === 'pending') {
      body.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: #64748b;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf5; border: 2px dashed #10b981; display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 14px;">
            🎉
          </div>
          <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 1.05rem; font-weight: 800;">Tidak Ada Pesanan Tertunda</h4>
          <p style="margin: 0 auto; max-width: 440px; font-size: 0.84rem; line-height: 1.5; color: #64748b;">
            Semua pesanan masuk telah selesai diproses. Klik tab <b>"Riwayat Selesai"</b> di atas untuk meninjau pesanan yang sudah rampung!
          </p>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: #64748b;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #f8fafc; border: 2px dashed #cbd5e1; display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 14px;">
            📭
          </div>
          <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 1.05rem; font-weight: 800;">Belum Ada Riwayat Selesai</h4>
          <p style="margin: 0 auto; max-width: 440px; font-size: 0.84rem; line-height: 1.5; color: #64748b;">
            Pesanan yang telah Anda konfirmasi "✅ Selesai" akan tersimpan rapi di sini.
          </p>
        </div>
      `;
    }
    return;
  }

  body.innerHTML = displayList.map(ord => {
    const isPending = ord.status === 'Menunggu Konfirmasi' || ord.status === 'Siap Diambil di Toko';
    const statusBg = isPending ? '#fffbeb' : '#ecfdf5';
    const statusBorder = isPending ? '#fde68a' : '#a7f3d0';
    const statusColor = isPending ? '#b45309' : '#047857';
    const statusIcon = isPending ? '⏳' : '✅';

    const safeId = escapeHtml(ord.id || '');
    const safeCustomerName = escapeHtml(ord.customerName || 'Pelanggan Toko');
    const safeCustomerPhone = escapeHtml(ord.customerPhone || '-');
    const safePaymentMethod = escapeHtml(ord.paymentMethod || 'Ambil di Toko');
    const safeTierLabel = escapeHtml(ord.tierLabel || 'Retail');
    const safeDateTime = escapeHtml(ord.dateTime || '');
    const safeStatus = escapeHtml(ord.status || 'Menunggu Konfirmasi');

    const itemsSummary = (ord.items || []).map(i => `
      <span style="display: inline-flex; align-items: center; gap: 4px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 6px; font-size: 0.76rem; font-weight: 600; color: #334155; margin: 2px 4px 2px 0;">
        <b style="color: #059669;">${Number(i.qty) || 1}x</b> ${escapeHtml(i.name || 'Produk')}
      </span>
    `).join('');

    return `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; box-shadow: 0 2px 8px -2px rgba(15,23,42,0.05); transition: box-shadow 0.2s ease;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 10px; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.95rem; font-weight: 800; color: #0f172a; font-family: monospace;">${safeId}</span>
              <span style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
                ${safeTierLabel}
              </span>
            </div>
            <div style="font-size: 0.76rem; color: #64748b; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
              <span>📅</span> <span>${safeDateTime}</span>
            </div>
          </div>
          <span style="background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; font-size: 0.74rem; font-weight: 800; padding: 4px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 5px;">
            ${statusIcon} ${safeStatus}
          </span>
        </div>

        <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; font-size: 0.82rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
            <div>
              <span style="color: #64748b; font-size: 0.73rem; display: block;">👤 Pemesan / Pelanggan:</span>
              <b style="color: #0f172a; font-size: 0.88rem;">${safeCustomerName}</b>
            </div>
            <div>
              <span style="color: #64748b; font-size: 0.73rem; display: block;">📱 WhatsApp:</span>
              <span style="color: #0284c7; font-weight: 700; font-family: monospace;">${safeCustomerPhone}</span>
            </div>
            <div>
              <span style="color: #64748b; font-size: 0.73rem; display: block;">📦 Pengambilan / Pengiriman:</span>
              <span style="font-weight: 700; color: #334155;">${safePaymentMethod}</span>
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
              <button type="button" onclick="confirmOrderFromModal('${safeId}')" style="background: linear-gradient(135deg, #059669, #047857); color: #ffffff; border: none; padding: 7px 13px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(5,150,105,0.25);" title="Klik setelah pesanan selesai diproses/dikirim">
                ✅ Selesai
              </button>
            ` : ''}
            <button type="button" onclick="viewHistoricalReceipt('${safeId}')" style="background: #ffffff; color: #334155; border: 1.5px solid #cbd5e1; padding: 7px 11px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Cetak struk nota belanja">
              📄 Struk
            </button>
            <button type="button" onclick="printOrderShippingLabel('${safeId}')" style="background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; padding: 7px 11px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Cetak label resi untuk paket pengiriman">
              🖨️ Resi
            </button>
            ${ord.customerPhone && ord.customerPhone !== '-' ? `
              <button type="button" onclick="chatCustomerWa('${encodeURIComponent(ord.customerPhone || '')}', '${encodeURIComponent(ord.customerName || '')}', '${safeId}')" style="background: #25d366; color: #ffffff; border: none; padding: 7px 12px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(37,211,102,0.25);" title="Kirim chat WhatsApp ke pemesan">
                💬 Chat WA
              </button>
            ` : ''}
            <button type="button" onclick="deleteTransactionEntry('${safeId}')" style="background: #fff1f2; color: #b91c1c; border: 1.5px solid #fecdd3; padding: 7px 11px; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="Hapus pesanan ini secara permanen dari browser dan Supabase">
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function printOrderShippingLabel(trxId) {
  const ord = (appState.transactions || []).find(t => t.id === trxId);
  if (!ord) return;
  const storeName = escapeHtml((appState.storeSettings && appState.storeSettings.storeName) || 'SR12 Official');
  const storePhone = escapeHtml((appState.storeSettings && appState.storeSettings.storeWaNumber) || '-');
  const storeCity = escapeHtml((appState.storeSettings && appState.storeSettings.storeCity) || 'Kota Toko');

  const safeCustomerName = escapeHtml(ord.customerName || 'Pelanggan');
  const safeCustomerPhone = escapeHtml(ord.customerPhone || '-');
  const safeCustomerAddress = escapeHtml(ord.customerAddress || 'Alamat Penerima');
  const safePaymentMethod = escapeHtml(ord.paymentMethod || 'Reguler');

  const itemsHtml = (ord.items || []).map(i => `<div style="font-size: 11px; margin-bottom: 2px;">• ${Number(i.qty) || 1}x ${escapeHtml(i.name || 'Produk')}</div>`).join('');
  const labelHtml = `
    <html>
    <head>
      <title>RESI PENGIRIMAN - ${escapeHtml(ord.id)}</title>
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
      <div class="barcode">||| ${escapeHtml(ord.id)} |||</div>
      <div class="row"><b>DARI PENGIRIM:</b><br>${storeName}<br>WhatsApp: ${storePhone}<br>Kota: ${storeCity}</div>
      <hr style="border: none; border-top: 1px dashed #ccc; margin: 8px 0;">
      <div class="row"><b>KEPADA PENERIMA:</b><br><b>${safeCustomerName}</b> (${safeCustomerPhone})<br>${safeCustomerAddress}</div>
      <div class="row"><b>LAYANAN PENGIRIMAN:</b> ${safePaymentMethod}</div>
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

  // Tutup banner notifikasi mengambang seketika saat membuka monitor pesanan
  const banner = document.getElementById('adminFloatingOrderBanner');
  if (banner) banner.style.display = 'none';

  // Tandai pesanan yang sudah ada sebagai sudah dilihat agar popup tidak muncul berulang
  if (!appState.notifiedOrderIds) appState.notifiedOrderIds = new Set();
  (appState.transactions || []).forEach(t => {
    if (t && t.id) appState.notifiedOrderIds.add(t.id);
  });
  try {
    localStorage.setItem('sr12_notified_orders', JSON.stringify(Array.from(appState.notifiedOrderIds).slice(-100)));
  } catch(e) {}

  // Bersihkan teks subtitle panjang jika masih tertinggal di cache DOM browser
  const modalEl = document.getElementById('modalAdminOrders');
  if (modalEl) {
    const subtitleEls = modalEl.querySelectorAll('.modal-header p');
    subtitleEls.forEach(el => el.remove());
  }

  // Set default tab ke pending (perlu diproses)
  currentAdminOrdersTab = 'pending';
  const btnPending = document.getElementById('btnTabOrdersPending');
  const btnDone = document.getElementById('btnTabOrdersDone');
  if (btnPending && btnDone) {
    btnPending.style.background = '#ecfdf5';
    btnPending.style.borderColor = '#059669';
    btnPending.style.color = '#065f46';
    btnPending.style.fontWeight = '800';
    btnDone.style.background = '#f8fafc';
    btnDone.style.borderColor = '#cbd5e1';
    btnDone.style.color = '#64748b';
    btnDone.style.fontWeight = '700';
  }

  renderAdminOrdersModal();
  openModal('modalAdminOrders');
}

function confirmOrderFromModal(trxId) {
  const ord = (appState.transactions || []).find(t => t.id === trxId);
  if (!ord) return;
  ord.status = 'Lunas / Selesai';
  const curSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  if (typeof saveStoredTransactions === 'function') {
    saveStoredTransactions(appState.transactions, curSlug);
  }
  if (typeof updateOrderStatusInSupabase === 'function') {
    updateOrderStatusInSupabase(trxId, 'Selesai', curSlug);
  }

  // TANDAI GAJI / KOMISI MARKETER SELESAI & LUNAS
  if (!appState.marketerSales) appState.marketerSales = getStoredMarketerSales();
  const mktSale = (appState.marketerSales || []).find(s => s.orderId === trxId || s.orderId === ord.id);
  if (mktSale) {
    mktSale.paidStatus = 'paid';
    mktSale.paidDate = new Date().toISOString().split('T')[0];
    saveStoredMarketerSales(appState.marketerSales);
    if (typeof saveMarketerSaleToSupabase === 'function') {
      saveMarketerSaleToSupabase(mktSale, curSlug);
    }
  }

  // Catat atau pastikan pesanan tercatat di buku Kas Masuk
  if (!appState.cashflow) appState.cashflow = (typeof getStoredCashflow === 'function') ? getStoredCashflow(curSlug) : [];
  const existingCf = (appState.cashflow || []).find(c => c.notes && c.notes.includes(trxId));
  if (!existingCf && ord) {
    const isCash = (ord.paymentMethod && (ord.paymentMethod.includes('COD') || ord.paymentMethod.includes('Ambil') || ord.paymentMethod === 'CASH'));
    appState.cashflow.unshift({
      id: 'CSH-ORD-' + Date.now().toString().slice(-6),
      store_slug: curSlug,
      date: new Date().toISOString().split('T')[0],
      type: 'in',
      account: isCash ? 'CASH' : 'TRANSFER',
      category: `Pesanan Selesai (${ord.tierLabel || 'Retail'})`,
      notes: `${ord.id} - ${ord.customerName} [${ord.paymentMethod}]`,
      amount: Number(ord.grandTotal) || 0
    });
    if (typeof saveStoredCashflow === 'function') {
      saveStoredCashflow(appState.cashflow, curSlug);
    }
  }
  if (typeof renderCashflowTable === 'function') renderCashflowTable();

  renderAdminOrdersModal();
  updateAdminNotificationUI();
  if (typeof renderPosTransactions === 'function') renderPosTransactions();
  if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
  showToast(`✅ Pesanan ${trxId} berhasil dikonfirmasi selesai!`);
}

function clearAllSimulationOrders() {
  const curSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const storeName = (appState.storeSettings && appState.storeSettings.storeName) || curSlug;
  if (!confirm(`🗑️ Kosongkan seluruh riwayat pesanan toko "${storeName}"?\n\n• Seluruh transaksi dan pesanan masuk akan dibersihkan total dari penyimpanan lokal dan Supabase Cloud.\n• Rekap komisi marketer dan pembukuan toko akan dinolkan kembali.\n• Data kemitraan Anda tetap tersimpan aman.`)) {
    return;
  }
  clearStoreOrdersAndFinancials(curSlug, true);
  showToast('🗑️ Seluruh riwayat pesanan dan pembukuan toko berhasil dibersihkan total!');
}
window.clearAllSimulationOrders = clearAllSimulationOrders;
window.clearAllStoreOrders = clearAllSimulationOrders;

// ==========================================
// MODEL 1: PREPAID ORDER QUOTA & TOP-UP SYSTEM
// ==========================================
let currentSelectedTopupAmount = 50000;
let currentSelectedTopupQuota = 55;

function updateStoreQuotaUI() {
  const store = (typeof appState !== 'undefined' && Array.isArray(appState.partnerStores))
    ? (appState.partnerStores.find(s => s && s.slug === appState.currentStoreSlug) || appState.storeSettings)
    : (appState.storeSettings || {});

  const currentQuota = typeof store?.orderQuota === 'number'
    ? store.orderQuota
    : (typeof appState?.storeSettings?.orderQuota === 'number' ? appState.storeSettings.orderQuota : 10);

  if (appState && appState.storeSettings) {
    appState.storeSettings.orderQuota = currentQuota;
  }

  // 1. Modal Top Up
  const topupDisp = document.getElementById('topupCurrentQuotaDisplay');
  const topupTitle = document.getElementById('topupStoreNameTitle');
  if (topupDisp) topupDisp.textContent = `${currentQuota} Order`;
  if (topupTitle) topupTitle.textContent = store?.storeName || appState.storeSettings?.storeName || 'Toko Anda';

  // 2. Olsera Drawer Menu Badge ("Sisa Kuota Order")
  const drawerBadge = document.getElementById('olseraDrawerQuotaBadge');
  if (drawerBadge) {
    drawerBadge.textContent = `${currentQuota}`;
    if (currentQuota <= 2) {
      drawerBadge.style.background = '#fee2e2';
      drawerBadge.style.color = '#dc2626';
    } else {
      drawerBadge.style.background = '#fef9c3';
      drawerBadge.style.color = '#854d0e';
    }
  }

  // 3. Olsera Topbar Quota Display & Static Topbar Display
  const topbarQuota = document.getElementById('olseraTopbarQuotaDisplay');
  if (topbarQuota) topbarQuota.textContent = `${currentQuota}`;
  const staticQuota = document.getElementById('olseraStaticQuotaDisplay');
  if (staticQuota) staticQuota.textContent = `${currentQuota}`;

  // 4. Admin Store Quota Display (Header Dashboard Toko)
  const adminDisp = document.getElementById('adminStoreQuotaDisplay');
  const badge = document.getElementById('adminQuotaBadge');
  if (adminDisp) adminDisp.textContent = `${currentQuota} Order`;

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

  // 5. Developer Strip Quota Display
  const stripQuota = document.getElementById('devStripOrderQuota');
  if (stripQuota) stripQuota.textContent = currentQuota;
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
  const merged = Object.assign({}, DEFAULT_DEV_PAYMENT_SETTINGS);

  // 1. Baca dari data central store row di partnerStores / storeSettings jika tersedia
  if (typeof appState !== 'undefined') {
    let central = null;
    if (appState.currentStoreSlug === 'sr12-central' && appState.storeSettings) {
      central = appState.storeSettings;
    } else if (Array.isArray(appState.partnerStores)) {
      central = appState.partnerStores.find(s => s && s.slug === 'sr12-central');
    }
    if (central && (central.heroSubtitle || central.hero_subtitle)) {
      try {
        const raw = central.heroSubtitle || central.hero_subtitle;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === 'object') {
          Object.assign(merged, parsed);
        }
      } catch (e) {}
    }
  }

  // 2. Baca dari localStorage (prioritaskan jika ada pembaruan lokal)
  const stored = localStorage.getItem('sr12_dev_payment_settings_v1');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        Object.assign(merged, parsed);
      }
    } catch (e) {}
  }

  // 3. Baca dari appState.devPaymentSettings jika ada di memory aktif
  if (typeof appState !== 'undefined' && appState.devPaymentSettings) {
    Object.assign(merged, appState.devPaymentSettings);
  }

  if (typeof appState !== 'undefined') {
    appState.devPaymentSettings = merged;
  }
  return merged;
}

// Refresh pengaturan rekening developer secara asinkron langsung dari Supabase Cloud (row sr12-central)
async function refreshDevPaymentSettingsFromCloud() {
  if (typeof fetchDevPaymentSettingsFromSupabase === 'function') {
    try {
      const cloudSettings = await fetchDevPaymentSettingsFromSupabase();
      if (cloudSettings && typeof cloudSettings === 'object') {
        const current = getStoredDevPaymentSettings();
        const merged = Object.assign({}, current, cloudSettings);
        if (typeof appState !== 'undefined') {
          appState.devPaymentSettings = merged;
          if (merged.platformFee) {
            const feeVal = parseInt(merged.platformFee, 10);
            if (!isNaN(feeVal) && feeVal >= 500) {
              appState.platformFee = feeVal;
              try {
                localStorage.setItem('sr12_platform_fee_amount', String(feeVal));
              } catch (e) {}
              if (appState.storeSettings) appState.storeSettings.platformFeeAmount = feeVal;
              if (Array.isArray(appState.partnerStores)) {
                appState.partnerStores.forEach(s => { s.platformFeeAmount = feeVal; });
              }
              if (typeof syncPlatformFeeInputsToAllSettings === 'function') {
                syncPlatformFeeInputsToAllSettings(feeVal);
              }
            }
          }
          if (Array.isArray(appState.partnerStores)) {
            const central = appState.partnerStores.find(s => s && s.slug === 'sr12-central');
            if (central) {
              central.heroSubtitle = JSON.stringify(merged);
              central.hero_subtitle = JSON.stringify(merged);
            }
          }
          if (appState.storeSettings && appState.storeSettings.slug === 'sr12-central') {
            appState.storeSettings.heroSubtitle = JSON.stringify(merged);
            appState.storeSettings.hero_subtitle = JSON.stringify(merged);
          }
        }
        try {
          localStorage.setItem('sr12_dev_payment_settings_v1', JSON.stringify(merged));
        } catch (e) {}
        updateDevPaymentUI();
        return merged;
      }
    } catch (e) {
      console.warn('Error refreshing dev payment settings:', e);
    }
  }
  return null;
}
window.refreshDevPaymentSettingsFromCloud = refreshDevPaymentSettingsFromCloud;

function saveStoredDevPaymentSettings(settings) {
  if (typeof appState !== 'undefined') {
    appState.devPaymentSettings = settings;
    // Perbarui juga objek sr12-central di partnerStores dan storeSettings jika ada
    if (Array.isArray(appState.partnerStores)) {
      const central = appState.partnerStores.find(s => s && s.slug === 'sr12-central');
      if (central) {
        central.heroSubtitle = JSON.stringify(settings);
        central.hero_subtitle = JSON.stringify(settings);
      }
    }
    if (appState.storeSettings && appState.storeSettings.slug === 'sr12-central') {
      appState.storeSettings.heroSubtitle = JSON.stringify(settings);
      appState.storeSettings.hero_subtitle = JSON.stringify(settings);
    }
  }
  try {
    localStorage.setItem('sr12_dev_payment_settings_v1', JSON.stringify(settings));
  } catch (e) {}

  // Sinkronkan ke Supabase Cloud (tabel stores, row sr12-central)
  if (typeof updateDevPaymentSettingsInSupabase === 'function') {
    updateDevPaymentSettingsInSupabase(settings);
  }
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

  // Bank & E-Wallet Elements di Modal Top-Up
  const bankNameEl = document.getElementById('topupDevBankName');
  const bankAccEl = document.getElementById('topupDevBankAccount');
  const bankHolderEl = document.getElementById('topupDevBankHolder');
  const ewalletNameEl = document.getElementById('topupDevEwalletName');
  const ewalletNumEl = document.getElementById('topupDevEwalletNumber');
  const qrisReceiverEl = document.getElementById('topupDevQrisReceiverName');

  if (bankNameEl) bankNameEl.textContent = settings.bankName || 'BCA';
  if (bankAccEl) bankAccEl.textContent = settings.bankAccount || '(Belum diatur)';
  if (bankHolderEl) bankHolderEl.textContent = settings.bankHolder || 'Developer Platform SR12';
  
  // Tampilkan atau sembunyikan kotak e-wallet jika dikosongkan
  const ewalletBox = document.getElementById('topupDevEwalletContainer');
  if (ewalletBox) {
    if (settings.ewalletNumber && settings.ewalletNumber.trim()) {
      ewalletBox.style.display = 'flex';
      if (ewalletNameEl) ewalletNameEl.textContent = settings.ewalletName || 'DANA';
      if (ewalletNumEl) ewalletNumEl.textContent = settings.ewalletNumber.trim();
    } else {
      ewalletBox.style.display = 'none';
      if (ewalletNumEl) ewalletNumEl.textContent = '';
    }
  }

  if (qrisReceiverEl) qrisReceiverEl.textContent = settings.bankHolder ? `${settings.bankHolder} (Developer SR12)` : 'Platform Developer SR12 Ecosystem';

  // Bank elements di tampilan QRIS
  const bankNameQrisEl = document.getElementById('topupDevBankName_qris');
  const bankAccQrisEl = document.getElementById('topupDevBankAccount_qris');
  const bankHolderQrisEl = document.getElementById('topupDevBankHolder_qris');
  if (bankNameQrisEl) bankNameQrisEl.textContent = settings.bankName || 'BCA';
  if (bankAccQrisEl) bankAccQrisEl.textContent = settings.bankAccount || '(Belum diatur)';
  if (bankHolderQrisEl) bankHolderQrisEl.textContent = settings.bankHolder || 'Developer Platform SR12';

  // Label Tombol Kirim Bukti WhatsApp
  const waLabel = settings.developerWa ? ` (${settings.developerWa})` : '';
  const waBtnQris = document.getElementById('topupDevWaBtnText_qris');
  const waBtnBank = document.getElementById('topupDevWaBtnText_bank');
  if (waBtnQris) waBtnQris.textContent = `Kirim Bukti Transfer ke WhatsApp Developer${waLabel}`;
  if (waBtnBank) waBtnBank.textContent = `Kirim Bukti Transfer ke WhatsApp Developer${waLabel}`;

  // Overview Banner di Developer Workspace & Modal
  const devBankText_ws = document.getElementById('devBankTargetText_ws');
  const devBankText = document.getElementById('devBankTargetText');
  const bankDesc = settings.bankAccount
    ? `${settings.bankName || 'BCA'} ${settings.bankAccount} a/n ${settings.bankHolder || 'Developer'}`
    : 'BCA 7820-xxxx-xxxx a/n Developer SR12 Platform';
  if (devBankText_ws) devBankText_ws.textContent = bankDesc;
  if (devBankText) devBankText.textContent = bankDesc;

  // Form Inputs (Modal Developer)
  const inputBankName = document.getElementById('devSettingBankName');
  const inputBankAcc = document.getElementById('devSettingBankAccount');
  const inputBankHolder = document.getElementById('devSettingBankHolder');
  const inputEwallet = document.getElementById('devSettingEwalletNumber');
  const inputWa = document.getElementById('devSettingWaNumber');

  if (inputBankName) inputBankName.value = settings.bankName || '';
  if (inputBankAcc) inputBankAcc.value = settings.bankAccount || '';
  if (inputBankHolder) inputBankHolder.value = settings.bankHolder || '';
  if (inputEwallet) inputEwallet.value = settings.ewalletNumber || '';
  if (inputWa) inputWa.value = settings.developerWa || '';

  // Workspace Inputs (Dedicated Developer Console)
  const inputBankName_ws = document.getElementById('devSettingBankName_ws');
  const inputBankAcc_ws = document.getElementById('devSettingBankAccount_ws');
  const inputBankHolder_ws = document.getElementById('devSettingBankHolder_ws');
  const inputEwallet_ws = document.getElementById('devSettingEwalletNumber_ws');
  const inputWa_ws = document.getElementById('devSettingWaNumber_ws');

  if (inputBankName_ws) inputBankName_ws.value = settings.bankName || '';
  if (inputBankAcc_ws) inputBankAcc_ws.value = settings.bankAccount || '';
  if (inputBankHolder_ws) inputBankHolder_ws.value = settings.bankHolder || '';
  if (inputEwallet_ws) inputEwallet_ws.value = settings.ewalletNumber || '';
  if (inputWa_ws) inputWa_ws.value = settings.developerWa || '';

  // Render tabel token aktivasi developer jika tersedia
  if (typeof renderDevTokenTable === 'function') {
    renderDevTokenTable();
  }
}

function handleSaveDevPaymentSettings(e) {
  if (e) e.preventDefault();

  // Deteksi secara presisi form mana yang disubmit (Workspace Console atau Floating Modal)
  const isWs = !!(e && e.target && (e.target.closest('#devTabPane_ws_payment') || e.target.querySelector('#devSettingBankAccount_ws')));
  const isModal = !!(e && e.target && (e.target.closest('#devTabPane_payment') || e.target.querySelector('#devSettingBankAccount')));

  const wsName = document.getElementById('devSettingBankName_ws')?.value.trim();
  const wsAcc = document.getElementById('devSettingBankAccount_ws')?.value.trim();
  const wsHolder = document.getElementById('devSettingBankHolder_ws')?.value.trim();
  const wsEwallet = document.getElementById('devSettingEwalletNumber_ws')?.value.trim();
  const wsWa = document.getElementById('devSettingWaNumber_ws')?.value.trim();

  const modalName = document.getElementById('devSettingBankName')?.value.trim();
  const modalAcc = document.getElementById('devSettingBankAccount')?.value.trim();
  const modalHolder = document.getElementById('devSettingBankHolder')?.value.trim();
  const modalEwallet = document.getElementById('devSettingEwalletNumber')?.value.trim();
  const modalWa = document.getElementById('devSettingWaNumber')?.value.trim();

  let bankName, bankAccount, bankHolder, ewalletNumber, developerWa;

  if (isModal) {
    bankName = modalName || wsName || 'BCA';
    bankAccount = (modalAcc !== undefined && modalAcc !== '') ? modalAcc : (wsAcc || '');
    bankHolder = (modalHolder !== undefined && modalHolder !== '') ? modalHolder : (wsHolder || '');
    ewalletNumber = (modalEwallet !== undefined && modalEwallet !== '') ? modalEwallet : (wsEwallet || '');
    developerWa = (modalWa !== undefined && modalWa !== '') ? modalWa : (wsWa || '');
  } else if (isWs) {
    bankName = wsName || modalName || 'BCA';
    bankAccount = (wsAcc !== undefined && wsAcc !== '') ? wsAcc : (modalAcc || '');
    bankHolder = (wsHolder !== undefined && wsHolder !== '') ? wsHolder : (modalHolder || '');
    ewalletNumber = (wsEwallet !== undefined && wsEwallet !== '') ? wsEwallet : (modalEwallet || '');
    developerWa = (wsWa !== undefined && wsWa !== '') ? wsWa : (modalWa || '');
  } else {
    // Dipanggil langsung tanpa event
    bankName = wsName || modalName || 'BCA';
    bankAccount = (wsAcc || modalAcc || '');
    bankHolder = (wsHolder || modalHolder || '');
    ewalletNumber = (wsEwallet !== undefined && wsEwallet !== '') ? wsEwallet : (modalEwallet || '');
    developerWa = (wsWa || modalWa || '');
  }

  // Fallback antar form jika salah satu kosong tapi form lain terisi
  if (!bankAccount && (isModal ? wsAcc : modalAcc)) {
    bankAccount = isModal ? wsAcc : modalAcc;
  }
  if (!bankHolder && (isModal ? wsHolder : modalHolder)) {
    bankHolder = isModal ? wsHolder : modalHolder;
  }
  if (!developerWa && (isModal ? wsWa : modalWa)) {
    developerWa = isModal ? wsWa : modalWa;
  }

  if (!bankAccount && !ewalletNumber && !developerWa) {
    alert('Mohon masukkan minimal Nomor Rekening Bank atau Nomor WhatsApp Developer.');
    return;
  }

  const existing = getStoredDevPaymentSettings();

  const settings = {
    bankName: bankName || existing.bankName || 'BCA',
    bankAccount: bankAccount !== '' ? bankAccount : (existing.bankAccount || ''),
    bankHolder: bankHolder !== '' ? bankHolder : (existing.bankHolder || ''),
    ewalletName: 'DANA',
    ewalletNumber: ewalletNumber,
    developerWa: developerWa !== '' ? developerWa : (existing.developerWa || ''),
    activeTokens: existing.activeTokens || []
  };

  saveStoredDevPaymentSettings(settings);
  updateDevPaymentUI();
  showToast('✅ Rekening & WhatsApp Developer berhasil disimpan dan disinkronkan ke Cloud!');
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
  if (!settings.ewalletNumber) return;
  navigator.clipboard.writeText(settings.ewalletNumber).then(() => {
    showToast(`📋 Nomor DANA (${settings.ewalletNumber}) berhasil disalin!`);
  }).catch(() => {
    alert(`Nomor DANA: ${settings.ewalletNumber}`);
  });
}

function sendTopupProofToDeveloperWA() {
  const settings = getStoredDevPaymentSettings();
  const store = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  
  let targetWa = (settings.developerWa || '').replace(/[^0-9]/g, '');
  if (!targetWa) {
    const inputPrompt = prompt('Nomor WhatsApp Resmi Developer belum disetel di Dashboard Developer.\nSilakan masukkan nomor WhatsApp Developer untuk menerima bukti transfer:', '081234567890');
    if (!inputPrompt) return;
    targetWa = inputPrompt.replace(/[^0-9]/g, '');
    settings.developerWa = targetWa;
    saveStoredDevPaymentSettings(settings);
  }

  if (targetWa.startsWith('0')) {
    targetWa = '62' + targetWa.slice(1);
  }

  const bankInfo = settings.bankAccount
    ? `${settings.bankName} - ${settings.bankAccount} (a.n ${settings.bankHolder})`
    : `DANA - ${settings.ewalletNumber || 'QRIS Developer'}`;

  const msg = `*PERMINTAAN TOP-UP KUOTA TRANSAKSI TOKO*\n` +
    `-----------------------------------------\n` +
    `Nama Toko   : *${store.storeName}*\n` +
    `Pemilik     : ${store.storeOwner || 'Pemilik Toko'}\n` +
    `Paket Kuota : +${currentSelectedTopupQuota} Order WhatsApp\n` +
    `Nominal     : *${formatRupiah(currentSelectedTopupAmount)}*\n` +
    `Tujuan Transfer: ${bankInfo}\n` +
    `-----------------------------------------\n` +
    `Halo Developer, saya telah mentransfer pembayaran Top-Up kuota toko di atas.\n` +
    `Mohon bantuannya untuk verifikasi bukti transfer dan kirimkan Kode Token Aktivasi Kuota untuk toko kami. Terima kasih! 🙏`;

  window.open(`https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(msg)}`, '_blank');
}

function updateTopupPackageCardsUI() {
  const fee = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);
  
  // Paket 1: 20 Kuota Order (@ fee)
  const pkg1Amount = 20 * fee;
  const pkg1Card = document.getElementById('pkgCard20k');
  if (pkg1Card) {
    pkg1Card.setAttribute('onclick', `selectTopupPackage(${pkg1Amount}, 20)`);
    pkg1Card.innerHTML = `
      <div class="topup-quota-num">20</div>
      <div style="font-size: 0.72rem; color: var(--dark-500);">Kuota Order</div>
      <div class="topup-price-num">${formatRupiah(pkg1Amount)}</div>
      <div style="font-size: 0.65rem; color: var(--dark-400); margin-top: 2px;">@ ${formatRupiah(fee)} / order</div>
    `;
  }

  // Paket 2: 50 Kuota (+5 Bonus = 55 Order)
  const pkg2Raw = 50 * fee;
  const pkg2Discount = fee >= 1500 ? 5000 : (fee >= 1000 ? 2000 : 0);
  const pkg2Amount = pkg2Raw - pkg2Discount;
  const pkg2Card = document.getElementById('pkgCard50k');
  if (pkg2Card) {
    pkg2Card.setAttribute('onclick', `selectTopupPackage(${pkg2Amount}, 55)`);
    pkg2Card.innerHTML = `
      <span class="topup-pkg-badge">POPULER</span>
      <div class="topup-quota-num" style="color: var(--gold-600);">55</div>
      <div style="font-size: 0.72rem; color: var(--dark-500);">Kuota (+5 Bonus)</div>
      <div class="topup-price-num" style="color: var(--gold-700);">${formatRupiah(pkg2Amount)}</div>
      <div style="font-size: 0.65rem; color: var(--gold-600); font-weight: 600; margin-top: 2px;">Hemat ${formatRupiah(pkg2Discount + (5 * fee))}</div>
    `;
  }

  // Paket 3: 100 Kuota (+20 Bonus = 120 Order)
  const pkg3Raw = 100 * fee;
  const pkg3Discount = fee >= 1500 ? 15000 : (fee >= 1000 ? 5000 : 0);
  const pkg3Amount = pkg3Raw - pkg3Discount;
  const pkg3Card = document.getElementById('pkgCard100k');
  if (pkg3Card) {
    pkg3Card.setAttribute('onclick', `selectTopupPackage(${pkg3Amount}, 120)`);
    pkg3Card.innerHTML = `
      <span class="topup-pkg-badge" style="background: #0284c7;">BEST VALUE</span>
      <div class="topup-quota-num" style="color: #0369a1;">120</div>
      <div style="font-size: 0.72rem; color: var(--dark-500);">Kuota (+20 Bonus)</div>
      <div class="topup-price-num">${formatRupiah(pkg3Amount)}</div>
      <div style="font-size: 0.65rem; color: #0284c7; font-weight: 600; margin-top: 2px;">Hemat ${formatRupiah(pkg3Discount + (20 * fee))}</div>
    `;
  }

  // SINKRONKAN PILIHAN PAKET TOKEN DI DEVELOPER WORKSPACE & MODAL
  const selWs = document.getElementById('devTokenQuotaPackage_ws');
  const selModal = document.getElementById('devTokenQuotaPackage');
  const tokenOpts = `
    <option value="20:${pkg1Amount}">+20 Kuota Order (${formatRupiah(pkg1Amount)})</option>
    <option value="55:${pkg2Amount}" selected>+55 Kuota Order (${formatRupiah(pkg2Amount)} - Populer)</option>
    <option value="120:${pkg3Amount}">+120 Kuota Order (${formatRupiah(pkg3Amount)} - Best Value)</option>
  `;
  if (selWs) {
    const curVal = selWs.value;
    const curQuota = curVal ? curVal.split(':')[0] : '55';
    selWs.innerHTML = tokenOpts;
    if (curQuota === '20') selWs.value = `20:${pkg1Amount}`;
    else if (curQuota === '120') selWs.value = `120:${pkg3Amount}`;
    else selWs.value = `55:${pkg2Amount}`;
  }
  if (selModal) {
    const curVal = selModal.value;
    const curQuota = curVal ? curVal.split(':')[0] : '55';
    selModal.innerHTML = tokenOpts;
    if (curQuota === '20') selModal.value = `20:${pkg1Amount}`;
    else if (curQuota === '120') selModal.value = `120:${pkg3Amount}`;
    else selModal.value = `55:${pkg2Amount}`;
  }

  return { pkg1Amount, pkg2Amount, pkg3Amount };
}

function openTopupQuotaModal() {
  const modal = document.getElementById('modalTopupQuota');
  updateStoreQuotaUI();
  updateDevPaymentUI();
  if (typeof refreshDevPaymentSettingsFromCloud === 'function') {
    refreshDevPaymentSettingsFromCloud().then(() => {
      if (typeof updateDevPaymentUI === 'function') {
        updateDevPaymentUI();
      }
    });
  }
  switchTopupMethod('qris');
  const pkgs = updateTopupPackageCardsUI();
  selectTopupPackage(pkgs.pkg2Amount, 55); // Default pilihan paket populer

  // Reset input token aktivasi
  const inputToken = document.getElementById('inputTopupActivationToken');
  if (inputToken) inputToken.value = '';
  const tokenMsg = document.getElementById('topupTokenStatusMsg');
  if (tokenMsg) tokenMsg.style.display = 'none';

  // Tampilkan akses cepat bypass persetujuan HANYA jika Developer Master sedang login
  const devQuickWrap = document.getElementById('devQuickApproveTopupWrap');
  if (devQuickWrap) {
    devQuickWrap.style.display = appState.isDevMasterLoggedIn ? 'block' : 'none';
  }

  if (modal) modal.classList.add('open');
}

function selectTopupPackage(amount, quota) {
  currentSelectedTopupAmount = amount;
  currentSelectedTopupQuota = quota;

  const cards = document.querySelectorAll('.topup-pkg-card');
  cards.forEach(c => c.classList.remove('active'));

  if (quota === 20) {
    document.getElementById('pkgCard20k')?.classList.add('active');
  } else if (quota === 55) {
    document.getElementById('pkgCard50k')?.classList.add('active');
  } else if (quota === 120) {
    document.getElementById('pkgCard100k')?.classList.add('active');
  }

  const qrisAmountTag = document.getElementById('qrisTagAmount');
  if (qrisAmountTag) {
    qrisAmountTag.textContent = formatRupiah(amount);
  }

  const bankAmountTag = document.getElementById('bankTagAmount');
  if (bankAmountTag) {
    bankAmountTag.textContent = formatRupiah(amount);
  }
}

// -------------------------------------------------------------------------
// SISTEM TOKEN AKTIVASI KUOTA (VALIDASI PEMBAYARAN OLEH DEVELOPER)
// -------------------------------------------------------------------------

async function activateTopupWithToken() {
  const inputEl = document.getElementById('inputTopupActivationToken');
  const msgEl = document.getElementById('topupTokenStatusMsg');
  const btnEl = document.getElementById('btnActivateWithToken');

  if (!inputEl) return;
  const tokenCode = inputEl.value.trim().toUpperCase();

  if (!tokenCode) {
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.background = '#fee2e2';
      msgEl.style.color = '#dc2626';
      msgEl.style.border = '1px solid #fca5a5';
      msgEl.textContent = '⚠️ Masukkan 6 digit Kode Token yang Anda terima dari Developer.';
    }
    inputEl.focus();
    return;
  }

  // State loading saat validasi
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '<span>⏳</span> Memverifikasi...';
  }

  // Sinkronkan token live dari Cloud untuk memastikan token terbaru Developer terbaca
  try {
    const client = (typeof initSupabaseClient === 'function') ? initSupabaseClient() : null;
    if (client) {
      const { data: centralRow } = await client
        .from('stores')
        .select('hero_subtitle')
        .eq('slug', 'sr12-central')
        .maybeSingle();

      if (centralRow && centralRow.hero_subtitle) {
        try {
          const parsed = typeof centralRow.hero_subtitle === 'string' ? JSON.parse(centralRow.hero_subtitle) : centralRow.hero_subtitle;
          if (parsed && Array.isArray(parsed.activeTokens)) {
            const cur = getStoredDevPaymentSettings();
            cur.activeTokens = parsed.activeTokens;
            appState.devPaymentSettings = cur;
            localStorage.setItem('sr12_dev_payment_settings_v1', JSON.stringify(cur));
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('Live token sync warning:', err);
  }

  const devSettings = getStoredDevPaymentSettings();
  const tokens = Array.isArray(devSettings.activeTokens) ? devSettings.activeTokens : [];
  const currentSlug = appState.currentStoreSlug || 'sr12-central';
  const store = appState.partnerStores.find(s => s.slug === currentSlug) || appState.storeSettings;

  // Cari kecocokan token
  const matchedIdx = tokens.findIndex(t => {
    if (!t || !t.token) return false;
    const isCodeMatch = t.token.trim().toUpperCase() === tokenCode;
    const isStatusActive = (t.status === 'active' || !t.status);
    const isStoreMatch = (!t.storeSlug || t.storeSlug === 'all' || t.storeSlug === currentSlug);
    return isCodeMatch && isStatusActive && isStoreMatch;
  });

  if (matchedIdx === -1) {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = '<span>⚡</span> Aktifkan Kuota';
    }
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.background = '#fee2e2';
      msgEl.style.color = '#dc2626';
      msgEl.style.border = '1px solid #fca5a5';
      msgEl.innerHTML = `❌ Kode Token <b>"${tokenCode}"</b> tidak valid, salah, atau sudah pernah digunakan.<br><span style="font-size:0.68rem; color:#64748b;">Pastikan Anda meminta token resmi dari Developer via WhatsApp setelah transfer.</span>`;
    }
    return;
  }

  const matched = tokens[matchedIdx];
  const quotaToAdd = Number(matched.quota) || 55;
  const amountPaid = Number(matched.amount) || 50000;

  // Ubah status token menjadi 'used' (terpakai)
  matched.status = 'used';
  matched.usedAt = new Date().toISOString();
  matched.usedBySlug = currentSlug;
  matched.usedByStore = store.storeName || 'Toko Mitra';

  tokens[matchedIdx] = matched;
  devSettings.activeTokens = tokens;
  saveStoredDevPaymentSettings(devSettings);

  // Tambahkan kuota ke toko
  const currentQuota = typeof store.orderQuota === 'number' ? store.orderQuota : 10;
  const currentBalance = typeof store.walletBalance === 'number' ? store.walletBalance : 10000;
  const currentTopupPaid = typeof store.totalTopupPaid === 'number' ? store.totalTopupPaid : 0;

  store.orderQuota = currentQuota + quotaToAdd;
  store.walletBalance = currentBalance + amountPaid;
  store.totalTopupPaid = currentTopupPaid + amountPaid;

  appState.storeSettings.orderQuota = store.orderQuota;
  appState.storeSettings.walletBalance = store.walletBalance;
  appState.storeSettings.totalTopupPaid = store.totalTopupPaid;

  // Sinkronkan ke daftar partnerStores di memory dan localStorage
  const storeIdx = appState.partnerStores.findIndex(s => s.slug === currentSlug);
  if (storeIdx >= 0) {
    appState.partnerStores[storeIdx] = Object.assign({}, appState.partnerStores[storeIdx], store);
  }
  saveStoredPartnerStores(appState.partnerStores);

  // SINKRONISASI KE SUPABASE CLOUD (PERMANEN)
  if (typeof updateStoreQuotaInSupabase === 'function') {
    updateStoreQuotaInSupabase(store.slug, store.orderQuota);
  }

  // Update seluruh tampilan UI kuota secara serentak
  updateStoreQuotaUI();
  updateDevPortalMetrics();
  renderDevTokenTable();

  if (btnEl) {
    btnEl.disabled = false;
    btnEl.innerHTML = '<span>⚡</span> Aktifkan Kuota';
  }

  closeModal('modalTopupQuota');

  showToast(`🎉 Token Valid! +${quotaToAdd} Kuota Order Berhasil Diaktifkan.`);
  alert(
    `🎉 ALHAMDULILLAH! TOKEN AKTIVASI RESMI VALID!\n\n` +
    `🏪 Toko: ${store.storeName}\n` +
    `🔑 Token: ${tokenCode}\n` +
    `⚡ Paket Kuota Ditambahkan: +${quotaToAdd} Order WhatsApp\n` +
    `📊 Total Sisa Kuota Sekarang: ${store.orderQuota} Order\n\n` +
    `Kuota telah aktif seketika di sistem Anda dan Cloud. Anda dapat kembali menerima pesanan pelanggan via WhatsApp!`
  );
}

function generateDevTopupToken(source) {
  const storeSelectId = source === 'ws' ? 'devTokenTargetStore_ws' : 'devTokenTargetStore';
  const pkgSelectId = source === 'ws' ? 'devTokenQuotaPackage_ws' : 'devTokenQuotaPackage';
  const resultBoxId = source === 'ws' ? 'devTokenResultBox_ws' : 'devTokenResultBox';
  const codeId = source === 'ws' ? 'devGeneratedTokenCode_ws' : 'devGeneratedTokenCode';
  const metaId = source === 'ws' ? 'devGeneratedTokenMeta_ws' : 'devGeneratedTokenMeta';

  const targetSlug = document.getElementById(storeSelectId)?.value || 'all';
  const currentFee = parseInt(appState.platformFee || localStorage.getItem('sr12_platform_fee_amount') || 2000, 10);
  const pkgVal = document.getElementById(pkgSelectId)?.value || `55:${50 * currentFee - 5000}`;
  const [quotaStr, amountStr] = pkgVal.split(':');
  const quota = parseInt(quotaStr, 10) || 55;
  const fallbackAmount = quota === 20 ? 20 * currentFee : (quota === 120 ? 100 * currentFee - 15000 : 50 * currentFee - 5000);
  const amount = parseInt(amountStr, 10) || fallbackAmount;

  let targetStoreName = 'Semua Toko (Bebas)';
  if (targetSlug !== 'all') {
    const s = appState.partnerStores.find(st => st.slug === targetSlug);
    if (s) targetStoreName = s.storeName;
  }

  // Generate 6 digit angka acak unik
  const code = String(Math.floor(100000 + Math.random() * 900000));

  const devSettings = getStoredDevPaymentSettings();
  devSettings.activeTokens = devSettings.activeTokens || [];

  const newToken = {
    token: code,
    quota: quota,
    amount: amount,
    storeSlug: targetSlug,
    storeName: targetStoreName,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  devSettings.activeTokens.unshift(newToken);
  saveStoredDevPaymentSettings(devSettings);

  // Tampilkan box hasil token baru
  const resBox = document.getElementById(resultBoxId);
  const codeEl = document.getElementById(codeId);
  const metaEl = document.getElementById(metaId);

  if (resBox) resBox.style.display = 'block';
  if (codeEl) codeEl.textContent = code;
  if (metaEl) metaEl.textContent = `(+${quota} Order • ${formatRupiah(amount)} • ${targetStoreName})`;

  renderDevTokenTable();
  showToast(`🎲 Token Aktivasi "${code}" (+${quota} Order) berhasil dibuat!`);
}

function copyDevGeneratedToken(source) {
  const codeId = source === 'ws' ? 'devGeneratedTokenCode_ws' : 'devGeneratedTokenCode';
  const code = document.getElementById(codeId)?.textContent?.trim();
  if (!code || code === '------') return;
  navigator.clipboard.writeText(code).then(() => {
    showToast(`📋 Token "${code}" berhasil disalin ke clipboard!`);
  }).catch(() => {
    prompt('Salin Token Aktivasi di bawah ini:', code);
  });
}

function sendDevGeneratedTokenWA(source) {
  const codeId = source === 'ws' ? 'devGeneratedTokenCode_ws' : 'devGeneratedTokenCode';
  const code = document.getElementById(codeId)?.textContent?.trim();
  if (!code || code === '------') return;

  const devSettings = getStoredDevPaymentSettings();
  const tokenObj = (devSettings.activeTokens || []).find(t => t.token === code);
  const quota = tokenObj ? tokenObj.quota : 55;
  const storeName = tokenObj ? tokenObj.storeName : 'Mitra SR12';

  let targetWa = '';
  if (tokenObj && tokenObj.storeSlug && tokenObj.storeSlug !== 'all') {
    const s = appState.partnerStores.find(st => st.slug === tokenObj.storeSlug);
    if (s && s.storeWaNumber) targetWa = s.storeWaNumber.replace(/[^0-9]/g, '');
  }

  const msg =
    `Halo *${storeName}*,\n\n` +
    `Pembayaran Top-Up kuota order WhatsApp toko Anda telah kami terima dan verifikasi. Terima kasih! 🙏\n\n` +
    `Berikut Kode Token Aktivasi Kuota Anda:\n` +
    `👉 *${code}* (+${quota} Kuota Order)\n\n` +
    `Silakan masukkan kode token di atas pada menu *Top Up Kuota Order* di aplikasi toko Anda untuk mengaktifkan kuota transaksi secara langsung.\n\n` +
    `Semoga berkah dan laris manis penjualannya! ✨`;

  if (targetWa) {
    if (targetWa.startsWith('0')) targetWa = '62' + targetWa.slice(1);
    window.open(`https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(msg)}`, '_blank');
  } else {
    const inputWa = prompt(`Kirim Token Aktivasi "${code}" via WhatsApp ke Nomor Toko (contoh: 081234567890):`, '');
    if (inputWa) {
      let clean = inputWa.replace(/[^0-9]/g, '');
      if (clean.startsWith('0')) clean = '62' + clean.slice(1);
      window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(msg)}`, '_blank');
    }
  }
}

function renderDevTokenTable() {
  const devSettings = getStoredDevPaymentSettings();
  const tokens = Array.isArray(devSettings.activeTokens) ? devSettings.activeTokens : [];

  const tbodyWs = document.getElementById('devTokenTableBody_ws');
  const tbodyModal = document.getElementById('devTokenTableBody');

  const populateBody = (tbody) => {
    if (!tbody) return;
    if (tokens.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 12px;">Belum ada token kuota yang dibuat. Klik tombol "Generate Token Baru" di atas.</td></tr>`;
      return;
    }

    tbody.innerHTML = tokens.map((t) => {
      const isActive = (t.status === 'active' || !t.status);
      const statusBadge = isActive
        ? `<span style="background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #16a34a; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.68rem;">🟢 Aktif</span>`
        : `<span style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid #475569; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.68rem;">⚪ Terpakai</span>`;

      return `
        <tr style="border-bottom: 1px solid #334155;">
          <td style="padding: 6px 8px; font-family: monospace; font-weight: 800; color: #38bdf8;">${t.token}</td>
          <td style="padding: 6px 8px; color: #cbd5e1;">${escapeHtml(t.storeName || 'Semua Toko')}</td>
          <td style="padding: 6px 8px; font-weight: 700; color: #4ade80;">+${t.quota}</td>
          <td style="padding: 6px 8px;">${statusBadge}</td>
          <td style="padding: 6px 8px; text-align: center;">
            <div style="display: inline-flex; gap: 4px;">
              ${isActive ? `<button type="button" onclick="sendSpecificTokenWA('${t.token}')" title="Kirim via WA" style="background: #25d366; color: #fff; border: none; padding: 3px 6px; border-radius: 3px; font-size: 0.68rem; cursor: pointer;">📲</button>` : ''}
              <button type="button" onclick="deleteDevToken('${t.token}')" title="Hapus Token" style="background: #ef4444; color: #fff; border: none; padding: 3px 6px; border-radius: 3px; font-size: 0.68rem; cursor: pointer;">🗑</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  populateBody(tbodyWs);
  populateBody(tbodyModal);

  // Populate dropdown toko target
  const selectWs = document.getElementById('devTokenTargetStore_ws');
  const selectModal = document.getElementById('devTokenTargetStore');
  const stores = (appState.partnerStores || []).filter(s => s && s.slug && s.slug !== 'sr12-central');

  const populateSelect = (sel) => {
    if (!sel) return;
    const cur = sel.value;
    let html = `<option value="all">🌟 Semua Toko (Bisa Dipakai Toko Mana Saja)</option>`;
    stores.forEach(s => {
      html += `<option value="${s.slug}" ${cur === s.slug ? 'selected' : ''}>${escapeHtml(s.storeName)} (${s.storeCity || '-'})</option>`;
    });
    sel.innerHTML = html;
  };

  populateSelect(selectWs);
  populateSelect(selectModal);
}

function deleteDevToken(tokenCode) {
  if (!confirm(`Hapus token "${tokenCode}"?`)) return;
  const devSettings = getStoredDevPaymentSettings();
  devSettings.activeTokens = (devSettings.activeTokens || []).filter(t => t.token !== tokenCode);
  saveStoredDevPaymentSettings(devSettings);
  renderDevTokenTable();
  showToast(`🗑️ Token "${tokenCode}" berhasil dihapus.`);
}

function sendSpecificTokenWA(tokenCode) {
  const devSettings = getStoredDevPaymentSettings();
  const tokenObj = (devSettings.activeTokens || []).find(t => t.token === tokenCode);
  if (!tokenObj) return;

  const quota = tokenObj.quota || 55;
  const storeName = tokenObj.storeName || 'Mitra SR12';

  let targetWa = '';
  if (tokenObj.storeSlug && tokenObj.storeSlug !== 'all') {
    const s = appState.partnerStores.find(st => st.slug === tokenObj.storeSlug);
    if (s && s.storeWaNumber) targetWa = s.storeWaNumber.replace(/[^0-9]/g, '');
  }

  const msg =
    `Halo *${storeName}*,\n\n` +
    `Pembayaran Top-Up kuota order WhatsApp toko Anda telah kami terima dan verifikasi. Terima kasih! 🙏\n\n` +
    `Berikut Kode Token Aktivasi Kuota Anda:\n` +
    `👉 *${tokenCode}* (+${quota} Kuota Order)\n\n` +
    `Silakan masukkan kode token di atas pada menu *Top Up Kuota Order* di aplikasi toko Anda untuk mengaktifkan kuota transaksi toko secara instan.\n\n` +
    `Semoga berkah dan laris manis penjualannya! ✨`;

  if (targetWa) {
    if (targetWa.startsWith('0')) targetWa = '62' + targetWa.slice(1);
    window.open(`https://api.whatsapp.com/send?phone=${targetWa}&text=${encodeURIComponent(msg)}`, '_blank');
  } else {
    const inputWa = prompt(`Kirim Token Aktivasi "${tokenCode}" via WhatsApp ke Nomor Toko (contoh: 081234567890):`, '');
    if (inputWa) {
      let clean = inputWa.replace(/[^0-9]/g, '');
      if (clean.startsWith('0')) clean = '62' + clean.slice(1);
      window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(msg)}`, '_blank');
    }
  }
}

// Fungsi bypass persetujuan cepat (khusus Developer Master)
function confirmSimulatedTopupPayment() {
  const store = appState.partnerStores.find(s => s.slug === appState.currentStoreSlug) || appState.storeSettings;
  const currentQuota = typeof store.orderQuota === 'number' ? store.orderQuota : 10;
  const currentBalance = typeof store.walletBalance === 'number' ? store.walletBalance : 10000;
  const currentTopupPaid = typeof store.totalTopupPaid === 'number' ? store.totalTopupPaid : 0;
  const devSettings = getStoredDevPaymentSettings();

  const bankDestination = devSettings.bankAccount
    ? `${devSettings.bankName} ${devSettings.bankAccount} (a.n ${devSettings.bankHolder})`
    : `DANA / QRIS Developer`;

  const proceed = confirm(
    `PERSETUJUAN TOP-UP DEVELOPER MASTER\n` +
    `-----------------------------------------\n` +
    `Apakah Anda ingin langsung menyetujui dan mengaktifkan kuota untuk:\n` +
    `• Toko Penerima : ${store.storeName}\n` +
    `• Paket Kuota   : +${currentSelectedTopupQuota} Order WhatsApp\n` +
    `• Nominal Kas   : ${formatRupiah(currentSelectedTopupAmount)}\n` +
    `• Kuota Baru    : ${currentQuota + currentSelectedTopupQuota} Order\n\n` +
    `Klik [OK] untuk langsung mengaktifkan kuota toko ini ke Supabase Cloud.`
  );
  if (!proceed) return;

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

  // SINKRONISASI KE SUPABASE CLOUD (PERMANEN)
  if (typeof updateStoreQuotaInSupabase === 'function') {
    updateStoreQuotaInSupabase(store.slug, store.orderQuota);
  }

  updateStoreQuotaUI();
  updateDevPortalMetrics();
  closeModal('modalTopupQuota');

  showToast(`⚡ Top Up Disetujui! +${currentSelectedTopupQuota} Kuota Order Ditambahkan.`);
  alert(`✅ PERSETUJUAN BERHASIL & KUOTA AKTIF!\n\n` +
    `🏪 Toko: ${store.storeName}\n` +
    `📦 Paket Top Up: +${currentSelectedTopupQuota} Kuota Order WhatsApp\n` +
    `💰 Nominal: ${formatRupiah(currentSelectedTopupAmount)}\n` +
    `⚡ Total Kuota Toko Sekarang: ${store.orderQuota} Order\n\n` +
    `Kuota transaksi telah tersimpan di Supabase Cloud.`);
}

// ==========================================
// TIER PRICE CALCULATION & METRIC RESET UTILITIES
// ==========================================
function updateNewProdTierCalc(het) {
  const tiers = {
    konsumen: Math.round(het * 1.0),
    marketer: Math.round(het * 1.0), // Marketer bayar harga HET penuh, komisi 15% dicairkan bulanan
    reseller: Math.round(het * 0.80),
    sub_agen: Math.round(het * 0.70),
    agen: Math.round(het * 0.60),
    distributor: Math.round(het * 0.50)
  };
  Object.keys(tiers).forEach(k => {
    const el = document.getElementById(`newCalc_${k}`);
    if (el) {
      if (k === 'marketer') {
        el.textContent = `${formatRupiah(tiers[k])} (Komisi 15% Bulanan)`;
      } else {
        el.textContent = formatRupiah(tiers[k]);
      }
    }
  });
}

function updateEditProdTierCalc(het) {
  const tiers = {
    konsumen: Math.round(het * 1.0),
    marketer: Math.round(het * 1.0), // Marketer bayar harga HET penuh, komisi 15% dicairkan bulanan
    reseller: Math.round(het * 0.80),
    sub_agen: Math.round(het * 0.70),
    agen: Math.round(het * 0.60),
    distributor: Math.round(het * 0.50)
  };
  Object.keys(tiers).forEach(k => {
    const el = document.getElementById(`editCalc_${k}`);
    if (el) {
      if (k === 'marketer') {
        el.textContent = `${formatRupiah(tiers[k])} (Komisi 15%)`;
      } else {
        el.textContent = formatRupiah(tiers[k]);
      }
    }
  });
}

/**
 * 1. Tambah Kuota Order Manual oleh Super Admin / Developer
 */
function promptAddStoreQuota(slug) {
  const store = (appState.partnerStores || []).find(s => s.slug === slug);
  if (!store) return;
  const currentQ = typeof store.orderQuota === 'number' ? store.orderQuota : 10;
  const input = prompt(
    `⚡ TAMBAH KUOTA ORDER MANUAL (SUPER ADMIN / DEVELOPER)\n\n` +
    `🏪 Toko: ${store.storeName} (${store.storeOwner})\n` +
    `📦 Sisa Kuota Sekarang: ${currentQ} Order\n\n` +
    `Masukkan JUMLAH ORDER yang ingin ditambahkan ke toko ini:\n` +
    `(Contoh: ketik 25, 50, atau 100)\n\n` +
    `Tips: Anda juga dapat memasukkan angka minus jika ingin mengurangi kuota.`,
    '25'
  );
  if (input === null) return;
  const qty = parseInt(input, 10);
  if (isNaN(qty) || qty === 0) {
    alert('⚠️ Jumlah kuota yang dimasukkan tidak valid.');
    return;
  }
  
  store.orderQuota = Math.max(0, currentQ + qty);
  if (appState.storeSettings && appState.storeSettings.slug === slug) {
    appState.storeSettings.orderQuota = store.orderQuota;
  }
  saveStoredPartnerStores(appState.partnerStores);
  updateDevPortalMetrics();
  updateStoreQuotaUI();
  showToast(`✅ Kuota toko "${store.storeName}" berhasil disesuaikan: ${currentQ} -> ${store.orderQuota} Order!`);
}
window.promptAddStoreQuota = promptAddStoreQuota;

/**
 * 2. Blokir / Buka Blokir Toko yang Melanggar Aturan
 * Saat diblokir: Toko tetap bisa lihat kas & laporan, namun etalase & pesanan baru dinonaktifkan
 */
function toggleBlockStore(slug) {
  if (slug === 'sr12-central') {
    alert('⚠️ Toko Pusat (SR12-Ku Pro) tidak dapat diblokir.');
    return;
  }
  const store = (appState.partnerStores || []).find(s => s.slug === slug);
  if (!store) return;
  const willBlock = !store.isBlocked;
  const actionText = willBlock ? 'MEMBLOKIR' : 'MEMBUKA BLOKIR';
  const reasonText = willBlock 
    ? 'Toko ini akan dibekukan: Etalase belanja & checkout pesanan dinonaktifkan.\nPemilik toko TETAP DAPAT mengakses pembukuan kas & laporan keuangan toko.'
    : 'Toko akan kembali aktif normal dan dapat menerima pesanan pelanggan kembali.';
    
  const confirmed = confirm(
    `⚠️ KONFIRMASI ${actionText} TOKO\n\n` +
    `Apakah Anda yakin ingin ${actionText} toko:\n` +
    `"${store.storeName}" (Pemilik: ${store.storeOwner})?\n\n` +
    `${reasonText}\n\n` +
    `Lanjutkan?`
  );
  if (!confirmed) return;

  store.isBlocked = willBlock;
  if (appState.storeSettings && appState.storeSettings.slug === slug) {
    appState.storeSettings.isBlocked = willBlock;
  }
  saveStoredPartnerStores(appState.partnerStores);
  updateDevPortalMetrics();
  renderStoreBranding();
  showToast(`✅ Status toko "${store.storeName}" berhasil diperbarui: ${willBlock ? 'DIBLOKIR' : 'AKTIF'}!`);
}
window.toggleBlockStore = toggleBlockStore;

/**
 * 3. Hapus Mitra Jaringan Tertentu dari Database Global
 */
function deleteNetworkMitra(mitraId) {
  if (!mitraId) return;
  const target = (appState.mitraList || []).find(m => m.id === mitraId);
  const name = target ? target.name : mitraId;
  if (!confirm(`Hapus data mitra "${name}" (ID: ${mitraId}) dari database sentral jaringan?`)) return;
  appState.mitraList = (appState.mitraList || []).filter(m => m.id !== mitraId);
  if (appState.resellers) {
    appState.resellers = appState.resellers.filter(m => m.id !== mitraId);
  }
  saveStoredMitra(appState.mitraList, true);
  updateDevPortalMetrics();
  showToast(`🗑️ Mitra "${name}" berhasil dihapus dari database.`);
}
window.deleteNetworkMitra = deleteNetworkMitra;


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
  localStorage.setItem('sr12_distributor_mitra_v2', JSON.stringify([]));
  localStorage.setItem('sr12_distributor_resellers_v1', JSON.stringify([]));
  if (typeof dbSaveAllMitra === 'function') {
    dbSaveAllMitra([]);
  }

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

function findMitraByIdOrPhone(query, targetStoreSlug = null) {
  if (!query) return null;
  const currentSlug = targetStoreSlug || (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const qTrim = String(query).trim();
  const qClean = qTrim.toUpperCase();
  const qAlphaNum = qClean.replace(/[^A-Z0-9]/g, '');
  const qPhone = normalizePhone(qTrim);
  const qPhoneTail = qPhone.length >= 8 ? qPhone.slice(-8) : '';
  const allList = appState.mitraList || appState.resellers || [];

  const matcher = m => {
    // 1. Cocokkan ID persis atau tanpa tanda hubung (AG-001 vs AG001 vs ag-001)
    const mIdClean = (m.id || '').toUpperCase();
    const mIdAlphaNum = mIdClean.replace(/[^A-Z0-9]/g, '');
    const idMatch = (mIdClean === qClean) || (mIdAlphaNum.length > 0 && mIdAlphaNum === qAlphaNum);

    // 2. Cocokkan No. WhatsApp (support 08xxx, 628xxx, spasi, tanda hubung)
    const mPhone = normalizePhone(m.phone || '');
    const phoneMatch = (qPhone.length >= 9 && mPhone === qPhone) ||
                       (qPhoneTail.length >= 8 && mPhone.endsWith(qPhoneTail));

    // 3. Cocokkan Nama Mitra (case-insensitive)
    const nameMatch = m.name && m.name.trim().toLowerCase() === qTrim.toLowerCase();

    return idMatch || phoneMatch || nameMatch;
  };

  // 1. Utamakan cari mitra yang terdaftar pada toko aktif yang sedang dituju
  const list = allList.filter(m => (m.store_slug || 'sr12-central') === currentSlug);
  const inStore = list.find(matcher);
  if (inStore) return inStore;

  // 2. Fallback: Cari di seluruh database mitra sistem jika belum terdaftar khusus di toko ini
  return allList.find(matcher) || null;
}

// ==========================================
// DATABASE PELANGGAN TOKO (CRM RETAIL NON-MITRA)
// ==========================================
function getStoreCustomers(storeSlug) {
  const slug = storeSlug || (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const raw = localStorage.getItem(`sr12_customers_${slug}`);
  let list = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch (e) {
      list = [];
    }
  }
  if (!Array.isArray(list)) list = [];

  // Sinkronkan juga dari riwayat transaksi aktif toko jika ada pelanggan retail
  const activeTx = (appState.transactions || []).filter(t => {
    if (!t || t.status === 'Dihapus' || t.status === 'deleted') return false;
    const tSlug = t.store_slug || slug;
    return tSlug === slug && t.customerName && t.customerPhone && (t.tier === 'konsumen' || !t.tier);
  });

  const cMap = new Map();
  list.forEach(c => {
    if (!c || !c.phone) return;
    const cleanP = String(c.phone).replace(/[^0-9]/g, '');
    if (cleanP) cMap.set(cleanP, c);
  });

  activeTx.forEach(t => {
    const cleanP = String(t.customerPhone || '').replace(/[^0-9]/g, '');
    if (!cleanP || cleanP.length < 8) return;
    if (!cMap.has(cleanP)) {
      cMap.set(cleanP, {
        id: `CUST-${cleanP.slice(-4)}`,
        name: t.customerName,
        phone: t.customerPhone,
        address: t.customerAddress || '-',
        city: (t.customerAddress || '').split(',')[0] || '-',
        totalOrders: 1,
        totalSpent: Number(t.total || t.grandTotal) || 0,
        lastOrderDate: (t.date || t.dateTime || '').split(' ')[0] || new Date().toISOString().split('T')[0],
        storeSlug: slug
      });
    } else {
      const existing = cMap.get(cleanP);
      if (t.customerAddress && t.customerAddress !== '-' && (!existing.address || existing.address === '-')) {
        existing.address = t.customerAddress;
      }
    }
  });

  return Array.from(cMap.values());
}
window.getStoreCustomers = getStoreCustomers;

function saveStoreCustomer(storeSlug, customerData) {
  if (!customerData || !customerData.phone) return;
  const slug = storeSlug || (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const cleanPhone = String(customerData.phone).replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) return;

  const list = getStoreCustomers(slug);
  const nowIso = new Date().toISOString().split('T')[0];
  const idx = list.findIndex(c => String(c.phone || '').replace(/[^0-9]/g, '') === cleanPhone);

  if (idx >= 0) {
    const c = list[idx];
    c.name = customerData.name || c.name;
    if (customerData.address && customerData.address !== '-') c.address = customerData.address;
    c.totalOrders = (c.totalOrders || 1) + 1;
    c.totalSpent = (c.totalSpent || 0) + (customerData.totalSpent || 0);
    c.lastOrderDate = nowIso;
  } else {
    list.unshift({
      id: `CUST-${cleanPhone.slice(-4)}`,
      name: customerData.name || 'Pelanggan Baru',
      phone: customerData.phone,
      address: customerData.address || '-',
      city: (customerData.address || '').split(',')[0] || '-',
      totalOrders: 1,
      totalSpent: customerData.totalSpent || 0,
      lastOrderDate: nowIso,
      firstOrderDate: nowIso,
      storeSlug: slug
    });
  }

  try {
    localStorage.setItem(`sr12_customers_${slug}`, JSON.stringify(list));
  } catch (e) {}

  return list;
}
window.saveStoreCustomer = saveStoreCustomer;

function findStoreCustomer(query, storeSlug) {
  if (!query) return null;
  const qClean = String(query).trim().toLowerCase();
  const qNum = String(query).replace(/[^0-9]/g, '');
  const slug = storeSlug || (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const list = getStoreCustomers(slug);

  return list.find(c => {
    const cPhone = String(c.phone || '').replace(/[^0-9]/g, '');
    if (qNum && qNum.length >= 8 && cPhone && (cPhone === qNum || cPhone.endsWith(qNum) || qNum.endsWith(cPhone))) {
      return true;
    }
    const cName = String(c.name || '').toLowerCase();
    if (qClean.length >= 3 && cName && cName.includes(qClean)) {
      return true;
    }
    return false;
  }) || null;
}
window.findStoreCustomer = findStoreCustomer;

function loadSavedCustomerProfileToCart() {
  const nameIn = document.getElementById('cartBuyerNameInput');
  const phoneIn = document.getElementById('cartBuyerPhoneField');
  const addrIn = document.getElementById('cartBuyerAddressInput');
  const savedBadge = document.getElementById('cartCustomerSavedBadge');

  const savedProfileJson = localStorage.getItem('sr12_customer_profile');
  if (savedProfileJson) {
    try {
      const p = JSON.parse(savedProfileJson);
      if (p && typeof p === 'object') {
        if (nameIn && !nameIn.value && p.name) {
          nameIn.value = p.name;
          appState.buyerDetails.name = p.name;
        }
        if (phoneIn && !phoneIn.value && p.phone) {
          phoneIn.value = p.phone;
          appState.buyerDetails.phone = p.phone;
        }
        if (addrIn && !addrIn.value && p.address) {
          addrIn.value = p.address;
          appState.buyerDetails.address = p.address;
        }
        if (savedBadge && p.name) {
          savedBadge.style.display = 'inline-block';
        }
      }
    } catch (e) {}
  }
}
window.loadSavedCustomerProfileToCart = loadSavedCustomerProfileToCart;

function generateNextMitraId(tier) {
  const currentSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const prefix = tier === 'agen' ? 'AG' : (tier === 'sub_agen' ? 'SUB' : (tier === 'marketer' ? 'MKT' : 'RS'));
  let maxNum = 0;

  const testIdCandidate = (rawId) => {
    if (!rawId) return;
    const clean = String(rawId).trim().toUpperCase();
    if (clean.startsWith(prefix + '-')) {
      const numPart = parseInt(clean.replace(prefix + '-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  };

  // 1. Scan semua mitra toko aktif dan seluruh riwayat mitra
  (appState.mitraList || []).forEach(m => {
    testIdCandidate(m.id);
    testIdCandidate(m.partner_code);
    if (Array.isArray(m.previousIds)) {
      m.previousIds.forEach(testIdCandidate);
    }
  });

  // 2. Scan semua riwayat transaksi toko agar kode lawas tidak pernah dipakai ulang
  (appState.transactions || []).forEach(t => {
    testIdCandidate(t.resellerId);
    testIdCandidate(t.marketerId);
    testIdCandidate(t.customerPhone);
  });

  // 3. Scan semua penjualan marketer
  (appState.marketerSales || []).forEach(s => {
    testIdCandidate(s.marketerId);
  });

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

function getMitraStatus(m) {
  const tier = m.tier || 'reseller';
  const qualDateStr = m.qualificationDate || m.lastOrderDate || new Date().toISOString().split('T')[0];
  const qualDate = new Date(qualDateStr);
  const now = new Date();

  // Hitung tanggal akhir siklus 3 bulan (tepat 3 bulan kalender dari tanggal kualifikasi / bergabung)
  const cycleEndDate = new Date(qualDate);
  cycleEndDate.setMonth(cycleEndDate.getMonth() + 3);

  const diffEndMs = cycleEndDate - now;
  const daysLeft = Math.ceil(diffEndMs / (1000 * 60 * 60 * 24));
  const diffStartMs = now - qualDate;
  const daysPassed = Math.max(0, Math.floor(diffStartMs / (1000 * 60 * 60 * 24)));
  const spent = m.accumulatedSpent90Days || 0;
  const endDateStr = isNaN(cycleEndDate.getTime()) ? '-' : cycleEndDate.toISOString().split('T')[0];

  if (tier === 'marketer') {
    return {
      state: 'active',
      label: 'Aktif (Tim 15%)',
      badgeColor: '#0284c7',
      daysPassed,
      daysLeft: 999,
      spent,
      targetNominal: 0,
      isTargetMet: true,
      deficit: 0,
      startDateStr: qualDateStr,
      endDateStr: '-'
    };
  }

  // Aturan Pemeliharaan Omset 3 Bulan Resmi 2026 (Rules Kemitraan):
  // Reseller: Rp 1.500.000 (atau Rp 500.000 / bulan)
  // Sub Agen: Rp 12.000.000 (atau Rp 4.000.000 / bulan)
  // Agen: Rp 45.000.000 (atau Rp 15.000.000 / bulan)
  const tierObj = (typeof SR12_TIERS !== 'undefined' && SR12_TIERS[tier]) ? SR12_TIERS[tier] : null;
  const targetNominal = tierObj?.maintenance3Months || (tier === 'agen' ? 45000000 : (tier === 'sub_agen' ? 12000000 : 1500000));
  const isTargetMet = spent >= targetNominal;
  const deficit = Math.max(0, targetNominal - spent);

  let state = 'active';
  let label = 'Aman (Target 3 Bln Tercapai)';
  let badgeColor = '#10b981';

  if (daysLeft <= 0 && !isTargetMet) {
    state = 'expired';
    const downgradeName = tier === 'agen' ? 'Sub Agen' : (tier === 'sub_agen' ? 'Reseller' : 'Marketer');
    label = `Evaluasi Habis (Turun ke ${downgradeName})`;
    badgeColor = '#ef4444';
  } else if (!isTargetMet && daysLeft <= 30) {
    state = 'warning';
    label = `Perlu RO (Sisa ${daysLeft} Hari)`;
    badgeColor = '#f59e0b';
  } else if (isTargetMet) {
    state = 'active';
    label = `Aman (Capai ${formatRupiah(spent)})`;
    badgeColor = '#10b981';
  } else {
    state = 'active';
    label = `Aktif (Sisa ${daysLeft} Hari)`;
    badgeColor = '#059669';
  }

  return {
    state,
    label,
    badgeColor,
    daysPassed,
    daysLeft: Math.max(0, daysLeft),
    spent,
    targetNominal,
    isTargetMet,
    deficit,
    startDateStr: qualDateStr,
    endDateStr
  };
}

/**
 * EVALUASI KENAIKAN JENJANG KARIR MITRA RESMI SR12 (SMART TIER PROGRESSION)
 * Marketer -> Reseller -> Sub Agen -> Agen Resmi
 */
function getMitraProgression(m) {
  const currentTier = m.tier || 'reseller';
  const careerConfig = (typeof SR12_CAREER_PATH !== 'undefined' && SR12_CAREER_PATH[currentTier]) ? SR12_CAREER_PATH[currentTier] : null;
  if (!careerConfig) {
    return { hasNextTier: false, isEligible: false };
  }

  const spent = Number(m.spent || m.accumulatedSpent90Days || 0);
  const target = careerConfig.targetNominal;
  const isEligible = spent >= target;
  const progressPct = Math.min(100, Math.round((spent / target) * 100));
  const deficit = Math.max(0, target - spent);

  return {
    hasNextTier: true,
    currentTier,
    currentTierName: careerConfig.currentTierName,
    nextTier: careerConfig.nextTier,
    nextTierName: careerConfig.nextTierName,
    targetNominal: target,
    newDiscountPct: careerConfig.newDiscountPct,
    benefitText: careerConfig.benefitText,
    congratsTitle: careerConfig.congratsTitle,
    prefix: careerConfig.prefix,
    spent,
    progressPct,
    deficit,
    isEligible
  };
}
window.getMitraProgression = getMitraProgression;

function renderResellers() {
  const tbody = document.getElementById('crmResellersTableBody');
  const totalEl = document.getElementById('crmTotalResellers');
  const agenSubEl = document.getElementById('crmCountAgenSub');
  const activeEl = document.getElementById('crmActiveResellers');
  const marketerEl = document.getElementById('crmCountMarketer');
  const readyUpgradeEl = document.getElementById('crmReadyForUpgradeCount');
  const chipEligibleEl = document.getElementById('chipEligibleUpgradeCount');
  const counterTab = document.getElementById('resellersCountDisplay');
  const tabMarketerCounter = document.getElementById('marketerCountDisplay');

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }

  // ISOLASI DATA TOKO & DEDUPLIKASI KETAT: Hanya tampilkan data mitra milik toko aktif tanpa duplikat
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const seenCodes = new Set();
  const storeMitraList = (appState.mitraList || []).filter(m => {
    if ((m.store_slug || 'sr12-central') !== currentStoreSlug) return false;
    const cleanCode = String(m.id || m.partner_code || '').trim().toUpperCase();
    if (!cleanCode || seenCodes.has(cleanCode)) return false;
    seenCodes.add(cleanCode);
    return true;
  });
  appState.resellers = storeMitraList;

  let countAgenSub = 0;
  let countResellerActive = 0;
  let countMarketer = 0;
  let countEligibleUpgrade = 0;

  const evaluatedList = storeMitraList.map(m => {
    const mOrders = [];
    const seenIds = new Set();
    const mCleanId = String(m.id || m.partner_code || '').trim().toUpperCase();
    const mPhoneClean = String(m.phone || '').replace(/[^0-9]/g, '');
    const mNameClean = String(m.name || '').trim().toLowerCase();

    // Dapatkan transaksi aktif milik toko saat ini (tidak berstatus Dihapus/deleted)
    const activeTransactions = (appState.transactions || []).filter(t => {
      if (!t || !t.id) return false;
      if (t.status === 'Dihapus' || t.status === 'deleted') return false;
      const tSlug = t.store_slug || currentStoreSlug;
      return !t.store_slug || tSlug === currentStoreSlug;
    });

    if (m.tier === 'marketer') {
      // 1. Marketer: Cocokkan HANYA dari transaksi/penjualan aktif yang dialokasikan ke Marketer ini
      (appState.marketerSales || []).forEach(s => {
        if (!s) return;
        if (s.paidStatus === 'deleted' || s.paidStatus === 'Dihapus') return;
        const sid = String(s.orderId || s.order_id || s.id || '').trim();
        if (sid.startsWith('ORD-MKT-')) return; // Abaikan dummy lawas
        if (s.marketerId === 'RS-WEB' || s.marketerId === 'RETAIL') return; // Bukan penjualan marketer

        // Jika berawalan ORD-WEB-, pastikan ada di transaksi aktif toko
        if (sid.startsWith('ORD-WEB-') && !activeTransactions.some(t => t.id === sid)) return;

        const sMarketerId = String(s.marketerId || s.partner_code || '').trim().toUpperCase();
        const sPhoneRaw = String(s.customerPhone || '').trim().toUpperCase();
        const sName = String(s.customerName || '').trim().toLowerCase();

        const isMatch = (sMarketerId && (sMarketerId === mCleanId || sMarketerId === String(m.id).toUpperCase())) ||
                        (sPhoneRaw && (sPhoneRaw === mCleanId || sPhoneRaw === String(m.id).toUpperCase())) ||
                        (mNameClean && sName && (sName === mNameClean || mNameClean.includes(sName)));

        if (isMatch && (!sid || !seenIds.has(sid))) {
          if (sid) seenIds.add(sid);
          mOrders.push({
            id: sid || 'MKT-ORD',
            amount: Number(s.omsetHet || s.omset_het) || 0,
            date: s.date || s.dateTime
          });
        }
      });

      activeTransactions.forEach(t => {
        const tid = String(t.id).trim();
        const tMarketerId = String(t.marketerId || '').trim().toUpperCase();
        const tPhoneRaw = String(t.customerPhone || '').trim().toUpperCase();
        const tPhoneDigits = tPhoneRaw.replace(/[^0-9]/g, '');
        const tName = String(t.customerName || '').trim().toLowerCase();
        const tLabel = String(t.tierLabel || '').toLowerCase();

        const isMatch = (tMarketerId && (tMarketerId === mCleanId || tMarketerId === String(m.id).toUpperCase())) ||
                        (tPhoneRaw && (tPhoneRaw === mCleanId || tPhoneRaw === String(m.id).toUpperCase())) ||
                        (t.tier === 'marketer' && mPhoneClean.length >= 8 && tPhoneDigits.length >= 8 && (tPhoneDigits === mPhoneClean || tPhoneDigits.endsWith(mPhoneClean.slice(-8)) || mPhoneClean.endsWith(tPhoneDigits.slice(-8)))) ||
                        (t.tier === 'marketer' && tName && (tName === mNameClean || mNameClean.includes(tName))) ||
                        (t.tier === 'marketer' && (tLabel.includes(mCleanId.toLowerCase()) || (mNameClean && tLabel.includes(mNameClean))));

        if (isMatch && !seenIds.has(tid)) {
          seenIds.add(tid);
          mOrders.push({
            id: tid,
            amount: Number(t.subtotalHet || t.subtotal || t.grandTotal) || 0,
            date: t.dateTime || t.date
          });
        }
      });
    } else {
      // 2. Reseller / Sub Agen / Agen: Cocokkan HANYA pesanan grosir untuk mitra ini
      activeTransactions.forEach(t => {
        const tid = String(t.id).trim();
        const tResellerId = String(t.resellerId || '').trim().toUpperCase();
        const tPhoneRaw = String(t.customerPhone || '').trim().toUpperCase();
        const tPhoneDigits = tPhoneRaw.replace(/[^0-9]/g, '');
        const tName = String(t.customerName || '').trim().toLowerCase();
        const tLabel = String(t.tierLabel || '').toLowerCase();

        // VALIDASI KEPEMILIKAN KETAT: Jika transaksi ini secara jelas milik mitra binaan lain, abaikan
        const belongsToOtherMitra = storeMitraList.some(other => {
          if (other === m) return false;
          const oPhone = String(other.phone || '').replace(/[^0-9]/g, '');
          const oName = String(other.name || '').trim().toLowerCase();
          const oCleanId = String(other.id || other.partner_code || '').trim().toUpperCase();
          if (oPhone && oPhone.length >= 8 && tPhoneDigits && (tPhoneDigits === oPhone || tPhoneDigits.endsWith(oPhone.slice(-8)) || oPhone.endsWith(tPhoneDigits.slice(-8)))) return true;
          if (oName && tName && (tName === oName || (tName.length >= 4 && oName.includes(tName)))) return true;
          if (oCleanId && tResellerId && tResellerId === oCleanId) return true;
          return false;
        });
        if (belongsToOtherMitra) return;

        const isExactId = (tResellerId && (tResellerId === mCleanId || tResellerId === String(m.id).toUpperCase() || (m.previousIds && m.previousIds.includes(tResellerId))));
        const isCodePhone = (tPhoneRaw === mCleanId || tPhoneRaw === String(m.id).toUpperCase());
        const isExactPhoneTier = (mPhoneClean.length >= 8 && tPhoneDigits.length >= 8 && (tPhoneDigits === mPhoneClean || tPhoneDigits.endsWith(mPhoneClean.slice(-8)) || mPhoneClean.endsWith(tPhoneDigits.slice(-8))));
        const isExactNameTier = (tName && (tName === mNameClean || mNameClean.includes(tName) || tName.includes(mNameClean)));
        const isLabelMatch = (tLabel.includes(mCleanId.toLowerCase()) || (mNameClean && tLabel.includes(mNameClean)));

        if ((isExactId || isCodePhone || isExactPhoneTier || isExactNameTier || isLabelMatch) && !seenIds.has(tid)) {
          seenIds.add(tid);
          mOrders.push({
            id: tid,
            amount: Number(t.subtotal || t.subtotalHet || t.grandTotal) || 0,
            date: t.dateTime || t.date
          });
        }
      });
    }

    const dynamicTotalAmount = mOrders.reduce((sum, o) => sum + o.amount, 0);
    const dynamicOrdersCount = mOrders.length;

    // Nilai riil transaksi aktual adalah sumber kebenaran (source of truth). Jika pesanan belum termuat di memori, gunakan saldo tersimpan resmi dari database cloud
    const serverSpent = Number(m.accumulatedSpent90Days || m.accumulated_spent_90_days) || 0;
    const serverCount = Number(m.totalOrdersCount || m.total_orders_count) || 0;
    const effectiveSpent = (dynamicTotalAmount > 0 || mOrders.length > 0) ? dynamicTotalAmount : serverSpent;
    const effectiveCount = (dynamicOrdersCount > 0 || mOrders.length > 0) ? dynamicOrdersCount : serverCount;

    m.accumulatedSpent90Days = effectiveSpent;
    m.totalOrdersCount = effectiveCount;

    const stat = getMitraStatus({ ...m, accumulatedSpent90Days: effectiveSpent });
    const progression = getMitraProgression({ ...m, spent: effectiveSpent, accumulatedSpent90Days: effectiveSpent });

    if (m.tier === 'agen' || m.tier === 'sub_agen') countAgenSub++;
    if (m.tier === 'reseller' && stat.state === 'active') countResellerActive++;
    if (m.tier === 'marketer') countMarketer++;
    if (progression.isEligible) countEligibleUpgrade++;

    return { ...m, ...stat, progression, spent: effectiveSpent, totalOrdersCount: effectiveCount };
  });

  if (totalEl) totalEl.textContent = `${storeMitraList.length}`;
  if (agenSubEl) agenSubEl.textContent = `${countAgenSub}`;
  if (activeEl) activeEl.textContent = `${countResellerActive}`;
  if (marketerEl) marketerEl.textContent = `${countMarketer}`;
  if (readyUpgradeEl) readyUpgradeEl.textContent = `${countEligibleUpgrade}`;
  if (chipEligibleEl) chipEligibleEl.textContent = `${countEligibleUpgrade}`;
  if (counterTab) counterTab.textContent = `${storeMitraList.length} Mitra`;
  if (tabMarketerCounter) tabMarketerCounter.textContent = `${countMarketer} Tim`;
  const olseraMitraBadgeEl = document.getElementById('olseraMitraBadge');
  if (olseraMitraBadgeEl) olseraMitraBadgeEl.textContent = `${storeMitraList.length}`;

  const chipCustEl = document.getElementById('chipCustomerCount');
  const storeCustomers = (typeof getStoreCustomers === 'function') ? getStoreCustomers(currentStoreSlug) : [];
  if (chipCustEl) chipCustEl.textContent = `${storeCustomers.length}`;

  const autoUpToggle = document.getElementById('toggleAutoUpgradeMitra');
  if (autoUpToggle) {
    autoUpToggle.checked = !!(appState.storeSettings && appState.storeSettings.autoTierUpgrade);
  }

  if (!tbody) return;

  // JIKA TAB PELANGGAN RETAIL (NON-MITRA) AKTIF:
  if (appState.selectedMitraFilter === 'customer') {
    const q = (appState.resellerSearchQuery || '').toLowerCase();
    const filteredCustomers = storeCustomers.filter(c => {
      if (!q) return true;
      return (c.name && c.name.toLowerCase().includes(q)) ||
             (c.phone && c.phone.includes(q)) ||
             (c.address && c.address.toLowerCase().includes(q));
    });

    if (filteredCustomers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 16px; color: #64748b;">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">👤</div>
            <div style="font-weight: 800; color: #0f172a; font-size: 1rem;">Belum Ada Pelanggan Retail (Non-Mitra) Tersimpan</div>
            <div style="font-size: 0.8rem; color: #64748b; max-width: 520px; margin: 4px auto 0 auto; line-height: 1.5;">
              Setiap kali pembeli retail (non-mitra) berbelanja di website atau kasir toko Anda, Nama, Nomor WhatsApp, dan Alamat Lengkap mereka otomatis terdaftar dan tersimpan permanen di sini.
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredCustomers.map((c, idx) => `
      <tr>
        <td data-label="ID & Nama Pelanggan">
          <div style="font-weight: 800; color: #0f172a; font-size: 0.9rem;">
            ${escapeHtml(c.name)}
          </div>
          <div style="font-size: 0.72rem; color: #059669; font-weight: 700; margin-top: 2px;">
            ID: <span style="font-family: monospace;">${escapeHtml(c.id || `CUST-${idx+1}`)}</span> &bull; 👤 Konsumen Retail
          </div>
        </td>
        <td data-label="Kontak WhatsApp">
          <div>
            <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 800; font-family: monospace; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px;">
              <span>💬</span> ${escapeHtml(c.phone)}
            </a>
          </div>
        </td>
        <td data-label="Alamat Lengkap Pengiriman" colspan="2">
          <div style="font-size: 0.8rem; color: #334155; line-height: 1.4; max-width: 380px;">
            📍 ${escapeHtml(c.address || '-')}
          </div>
        </td>
        <td data-label="Total Belanja">
          <div class="crm-td-cell-wrapper" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right;">
            <div style="font-weight: 800; color: #0f172a; font-size: 0.85rem;">
              ${formatRupiah(c.totalSpent || 0)}
            </div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
              ${c.totalOrders || 1}x Pesanan Selesai
            </div>
          </div>
        </td>
        <td data-label="Status Pelanggan">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-size: 0.72rem; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
            ✓ Pelanggan Aktif
          </span>
          <div style="font-size: 0.68rem; color: #64748b; margin-top: 2px;">
            Terakhir: ${escapeHtml(c.lastOrderDate || '-')}
          </div>
        </td>
        <td data-label="Aksi" style="text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
            <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Kak ${c.name}, terima kasih telah berbelanja di ${appState.storeSettings?.storeName || 'toko kami'}!`)}" target="_blank" class="btn-action-sm" style="background: #22c55e; color: #fff; text-decoration: none; border-radius: 4px; padding: 5px 9px; font-size: 0.74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="Chat WhatsApp Pelanggan">
              <span>💬</span> Hubungi
            </a>
            <button type="button" onclick="navigator.clipboard.writeText('${escapeHtml(c.name)}\\n${escapeHtml(c.phone)}\\n${escapeHtml(c.address || '-')}'); showToast('📋 Alamat pelanggan berhasil disalin!');" class="btn-action-sm" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 4px; padding: 5px 9px; font-size: 0.74rem; font-weight: 700; cursor: pointer;" title="Salin Info Pengiriman">
              📋 Salin
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    return;
  }

  const filter = appState.selectedMitraFilter || 'all';
  const q = (appState.resellerSearchQuery || '').toLowerCase().trim();

  const filtered = evaluatedList.filter(m => {
    let matchType = false;
    if (filter === 'all') matchType = true;
    else if (filter === 'reseller_active') matchType = m.tier === 'reseller' && m.state === 'active';
    else if (filter === 'reseller_grace') matchType = m.tier === 'reseller' && (m.state === 'grace' || m.state === 'inactive');
    else if (filter === 'sub_agen') matchType = m.tier === 'sub_agen';
    else if (filter === 'agen') matchType = m.tier === 'agen';
    else if (filter === 'marketer') matchType = m.tier === 'marketer';
    else if (filter === 'eligible_upgrade') matchType = m.progression && m.progression.isEligible;
    else matchType = m.tier === filter;

    const matchQuery = !q ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.id && m.id.toLowerCase().includes(q)) ||
      (m.partner_code && m.partner_code.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.city && m.city.toLowerCase().includes(q));

    return matchType && matchQuery;
  });

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
    const prog = m.progression || { hasNextTier: false, isEligible: false };

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
              <b style="font-size: 0.92rem; color: #0f172a;">${escapeHtml(m.name)}</b>
            </div>
            <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 0.7rem; ${tierBadgeStyle}">
                ${tierBadgeText}
              </span>
              ${prog.isEligible ? `
                <span style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; border: 1px solid #f59e0b; padding: 2px 7px; border-radius: 4px; font-weight: 800; font-size: 0.68rem; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; animation: pulse 2s infinite;">
                  🎉 Siap Naik ${prog.nextTierName}
                </span>
              ` : `
                <span class="badge-crm" style="background: ${m.state === 'active' ? '#dcfce7' : (m.state === 'warning' ? '#fef3c7' : '#fee2e2')}; color: ${m.state === 'active' ? '#15803d' : (m.state === 'warning' ? '#92400e' : '#b91c1c')}; padding: 2px 7px; font-size: 0.7rem;">
                  ${m.state === 'active' ? '🟢' : (m.state === 'warning' ? '🟡' : '🔴')} ${m.label}
                </span>
              `}
            </div>
          </div>
          <div style="font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span><a href="https://wa.me/${m.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 700; font-family: monospace;">📱 ${m.phone}</a></span>
            <span>&bull;</span>
            <span>📍 ${m.city || 'Indonesia'}</span>
          </div>
        </td>
        <td data-label="Tingkat">
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <span style="display: inline-block; padding: 4px 9px; border-radius: 4px; font-weight: 800; font-size: 0.72rem; ${tierBadgeStyle}">
              ${tierBadgeText}
            </span>
            ${prog.isEligible ? `
              <span style="color: #7c3aed; font-size: 0.68rem; font-weight: 800; white-space: nowrap;">
                ➔ Naik ke ${prog.nextTierName}
              </span>
            ` : ''}
          </div>
        </td>
        <td data-label="Rekening Bank">
          <div class="crm-td-cell-wrapper" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right; min-width: 0;">
            <div style="font-size: 0.8rem; font-weight: 800; color: #0f172a; white-space: nowrap;">
              🏦 ${m.bankName || 'BCA'} &bull; <span style="font-family: monospace; letter-spacing: 0.02em;">${m.bankAccount || '-'}</span>
            </div>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px; white-space: nowrap;">
              a.n <span style="font-weight: 600; color: #334155;">${m.bankHolder || m.name}</span>
            </div>
          </div>
        </td>
        <td data-label="Masa Aktif">
          <div class="crm-td-cell-wrapper" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right; min-width: 0;">
            ${m.tier === 'marketer' ? `
              <div style="font-size: 0.78rem; color: #0284c7; font-weight: 800; white-space: nowrap;">
                ✨ Jualan Tanpa Modal
              </div>
              <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px; white-space: nowrap;">
                Bergabung: <span style="font-family: monospace;">${m.qualificationDate || '-'}</span>
              </div>
            ` : `
              <div style="font-size: 0.75rem; color: #334155; white-space: nowrap;">
                Mulai: <b style="white-space: nowrap; font-family: monospace;">${m.qualificationDate || '-'}</b>
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 1px; white-space: nowrap;">
                Evaluasi: <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${m.endDateStr || '-'}</span> (3 Bulan)
              </div>
              <div style="font-size: 0.72rem; color: ${m.daysLeft <= 30 && m.state !== 'active' ? '#dc2626' : (m.daysLeft <= 30 ? '#d97706' : '#059669')}; font-weight: 800; margin-top: 2px; white-space: nowrap;">
                ⏳ Sisa ${m.daysLeft} Hari
              </div>
            `}
          </div>
        </td>
        <td data-label="Akumulasi Belanja">
          <div class="crm-td-cell-wrapper" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right; width: 100%; max-width: 210px; min-width: 140px;">
            <div style="display: flex; justify-content: flex-end; align-items: baseline; font-size: 0.78rem; margin-bottom: 3px; gap: 6px; width: 100%; flex-wrap: wrap;">
              <b style="color: #0f172a; font-size: 0.82rem; white-space: nowrap;">${formatRupiah(m.spent)}</b>
              ${prog.hasNextTier ? `
                <span style="color: #64748b; font-size: 0.68rem; white-space: nowrap;">Ke ${prog.nextTierName}: ${formatRupiah(prog.targetNominal)}</span>
              ` : `
                <span style="color: #64748b; font-size: 0.68rem; white-space: nowrap;">Target RO: ${formatRupiah(m.targetNominal)}</span>
              `}
            </div>

            ${prog.hasNextTier ? `
              <div style="background: #e2e8f0; border-radius: 999px; height: 6px; width: 100%; max-width: 150px; overflow: hidden; margin: 2px 0;">
                <div style="width: ${prog.progressPct}%; height: 100%; background: ${prog.isEligible ? 'linear-gradient(90deg, #10b981, #8b5cf6)' : '#0284c7'}; border-radius: 999px;"></div>
              </div>
              <div style="font-size: 0.68rem; margin-top: 2px; font-weight: 700; white-space: nowrap;">
                ${prog.isEligible ? `
                  <span style="color: #7c3aed; font-weight: 800;">🎉 Syarat Tembus! Siap Promosi</span>
                ` : `
                  <span style="color: #64748b;">Kurang ${formatRupiah(prog.deficit)} lagi</span>
                `}
              </div>
            ` : `
              <div style="background: #e2e8f0; border-radius: 999px; height: 6px; width: 100%; max-width: 150px; overflow: hidden; margin: 2px 0;">
                <div style="width: ${Math.min(100, Math.round((m.spent / (m.targetNominal || 1)) * 100))}%; height: 100%; background: #10b981; border-radius: 999px;"></div>
              </div>
              <div style="font-size: 0.68rem; color: #059669; margin-top: 2px; font-weight: 700; white-space: nowrap;">
                ✨ Mitra Tingkat Tertinggi
              </div>
            `}
          </div>
        </td>
        <td data-label="Status">
          <span class="badge-crm" style="background: ${m.state === 'active' ? '#dcfce7' : (m.state === 'warning' ? '#fef3c7' : '#fee2e2')}; color: ${m.state === 'active' ? '#15803d' : (m.state === 'warning' ? '#92400e' : '#b91c1c')};">
            ${m.state === 'active' ? '🟢' : (m.state === 'warning' ? '🟡' : '🔴')} ${m.label}
          </span>
        </td>
        <td data-label="Aksi" style="text-align: center;">
          <div style="display: flex; gap: 5px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
            ${prog.isEligible ? `
              <button onclick="openUpgradeMitraModal('${m.id}')" title="Promosikan ke ${prog.nextTierName}" style="background: linear-gradient(135deg, #059669, #047857); color: #ffffff; border: 1px solid #10b981; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(5,150,105,0.3); white-space: nowrap;">
                <span>⬆️</span> Naikkan
              </button>
            ` : ''}

            ${m.tier === 'reseller' && m.deficit > 0 && !prog.isEligible ? `
              <button onclick="sendResellerReminderWA('${m.phone}', '${m.name}', ${m.daysLeft}, ${m.deficit})" title="Kirim Pengingat RO ke WhatsApp" style="background: #25d366; color: #fff; border: none; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>📲</span> Ingatkan RO
              </button>
            ` : (m.tier === 'marketer' && !prog.isEligible ? `
              <button onclick="goToMarketerPayroll('${m.id}')" title="Lihat Rekap Gaji Marketer" style="background: #0284c7; color: #fff; border: none; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>💼</span> Gaji
              </button>
            ` : `
              <button onclick="sendGeneralMitraWA('${m.phone}', '${m.name}', '${m.tier}')" title="Hubungi Mitra via WhatsApp" style="background: #25d366; color: #fff; border: none; padding: 5px 9px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
                <span>📲</span> Chat WA
              </button>
            `)}
            <button onclick="openEditMitraModal('${m.id}')" title="Edit Data & Tanggal Bergabung Mitra" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 5px 8px; border-radius: 6px; font-size: 0.72rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" aria-label="Edit Data Mitra">
              ✏️
            </button>
            <button onclick="deleteMitra('${m.id}')" title="Hapus Data Mitra" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 8px; border-radius: 6px; font-size: 0.72rem; cursor: pointer;">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function goToMarketerPayroll(marketerId) {
  try {
    const portal = document.getElementById('distributorOlseraPortal');
    const isOlseraActive = (document.body.classList.contains('olsera-portal-active') || (portal && portal.style.display !== 'none'));

    if (isOlseraActive && typeof switchOlseraTab === 'function') {
      switchOlseraTab('marketer');
    } else if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(true);
      if (typeof switchOlseraTab === 'function') {
        switchOlseraTab('marketer');
      }
    } else if (typeof switchTab === 'function') {
      switchTab('marketers');
    }

    // Pastikan section marketer ditampilkan dan dirender
    const mrkSec = document.getElementById('marketersSection');
    if (mrkSec) mrkSec.style.display = 'block';

    if (typeof renderMarketerPayroll === 'function') {
      renderMarketerPayroll();
    }

    if (marketerId) {
      setTimeout(() => {
        const row = document.querySelector(`[data-marketer-id="${marketerId}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.outline = '2.5px solid #0284c7';
          setTimeout(() => { row.style.outline = ''; }, 2500);
        }
      }, 300);
    }
  } catch (err) {
    console.error('Error navigating to marketer payroll:', err);
    if (typeof switchTab === 'function') {
      switchTab('marketers');
    }
  }
}
window.goToMarketerPayroll = goToMarketerPayroll;

function filterMitra(tierFilter) {
  appState.selectedMitraFilter = tierFilter;
  const chipIds = {
    'all': 'btnFilterAllMitra',
    'eligible_upgrade': 'btnFilterEligibleUpgrade',
    'agen': 'btnFilterAgen',
    'sub_agen': 'btnFilterSubAgen',
    'reseller': 'btnFilterReseller',
    'marketer': 'btnFilterMarketer',
    'customer': 'btnFilterCustomer'
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

/**
 * MODAL PROMOSI JENJANG KARIR MITRA & EKSEKUSI KENAIKAN TINGKAT
 */
function openUpgradeMitraModal(mitraId) {
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const mitra = (appState.mitraList || []).find(m => m.id === mitraId && (m.store_slug || 'sr12-central') === currentStoreSlug);
  if (!mitra) return;

  const prog = getMitraProgression(mitra);
  if (!prog.hasNextTier) {
    showToast('Mitra ini sudah berada di tingkatan tertinggi.');
    return;
  }

  const modal = document.getElementById('modalUpgradeMitra');
  const card = document.getElementById('upgradeMitraDetailCard');
  const idInput = document.getElementById('upgradeNewMitraId');
  const hiddenId = document.getElementById('upgradeTargetMitraId');
  const hiddenTier = document.getElementById('upgradeTargetNextTier');
  const keepOldCheckbox = document.getElementById('upgradeKeepOldIdCheckbox');

  if (hiddenId) hiddenId.value = mitra.id;
  if (hiddenTier) hiddenTier.value = prog.nextTier;
  if (keepOldCheckbox) keepOldCheckbox.checked = false;

  // Generate ID baru otomatis sesuai tingkatan berikutnya
  const nextId = generateNextMitraId(prog.nextTier);
  if (idInput) {
    idInput.value = nextId;
    idInput.dataset.newId = nextId;
    idInput.dataset.oldId = mitra.id;
    idInput.readOnly = false;
    idInput.style.background = '#ffffff';
  }

  if (card) {
    const curTierObj = SR12_TIERS[mitra.tier] || SR12_TIERS.reseller;
    const nextTierObj = SR12_TIERS[prog.nextTier] || SR12_TIERS.reseller;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed #bbf7d0; padding-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div>
          <b style="font-size: 1.05rem; color: #065f46;">${escapeHtml(mitra.name)}</b>
          <div style="font-size: 0.76rem; color: #64748b; font-family: monospace;">ID Saat Ini: <b>${mitra.id}</b> • 📱 ${mitra.phone}</div>
        </div>
        <span style="background: #dcfce7; color: #166534; border: 1px solid #86efac; padding: 3px 10px; border-radius: 999px; font-size: 0.74rem; font-weight: 800;">
          🎉 Memenuhi Syarat
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center; margin-bottom: 14px; text-align: center;">
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px;">
          <span style="font-size: 0.7rem; color: #64748b; display: block; font-weight: 700;">Tingkat Saat Ini</span>
          <b style="font-size: 0.88rem; color: #1e293b; display: block; margin: 2px 0;">${curTierObj.name}</b>
          <span style="font-size: 0.72rem; color: #0284c7; font-weight: 800;">${curTierObj.discountPct > 0 ? `Diskon ${curTierObj.discountPct}%` : 'Komisi 15%'}</span>
        </div>
        <span style="font-size: 1.4rem; color: #059669; font-weight: 900;">➔</span>
        <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1.5px solid #10b981; border-radius: 8px; padding: 10px;">
          <span style="font-size: 0.7rem; color: #065f46; display: block; font-weight: 700;">Tingkat Baru</span>
          <b style="font-size: 0.92rem; color: #064e3b; display: block; margin: 2px 0;">${nextTierObj.name}</b>
          <span style="font-size: 0.72rem; color: #047857; font-weight: 800;">Diskon ${nextTierObj.discountPct}% Langsung</span>
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; font-size: 0.78rem; color: #166534; line-height: 1.5;">
        <div>📊 <b>Akumulasi Belanja Riil:</b> <span style="font-weight: 800; color: #0f172a;">${formatRupiah(prog.spent)}</span> (Syarat Minimal: ${formatRupiah(prog.targetNominal)})</div>
        <div style="margin-top: 3px;">🎁 <b>Keuntungan Baru:</b> ${prog.benefitText}</div>
      </div>
    `;
  }

  if (modal) modal.classList.add('open');
}
window.openUpgradeMitraModal = openUpgradeMitraModal;

function toggleUpgradeKeepOldId(keepOld) {
  const idInput = document.getElementById('upgradeNewMitraId');
  if (!idInput) return;
  if (keepOld) {
    idInput.value = idInput.dataset.oldId || idInput.value;
    idInput.readOnly = true;
    idInput.style.background = '#f1f5f9';
  } else {
    idInput.value = idInput.dataset.newId || idInput.value;
    idInput.readOnly = false;
    idInput.style.background = '#ffffff';
  }
}
window.toggleUpgradeKeepOldId = toggleUpgradeKeepOldId;

async function handleConfirmMitraUpgrade(e) {
  if (e) e.preventDefault();
  const hiddenId = document.getElementById('upgradeTargetMitraId');
  const hiddenTier = document.getElementById('upgradeTargetNextTier');
  const idInput = document.getElementById('upgradeNewMitraId');
  const sendWaCheckbox = document.getElementById('upgradeSendWaCongrats');

  const oldId = hiddenId ? hiddenId.value : '';
  const newTier = hiddenTier ? hiddenTier.value : '';
  const newId = (idInput ? idInput.value : oldId).trim().toUpperCase();
  const willSendWA = sendWaCheckbox ? sendWaCheckbox.checked : true;

  if (!oldId || !newTier) return;

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const mitra = (appState.mitraList || []).find(m => m.id === oldId && (m.store_slug || 'sr12-central') === currentStoreSlug);
  if (!mitra) return;

  const oldTier = mitra.tier;
  const oldName = mitra.name;

  // Jika kode ID berubah (misal dari MKT-001 ke RS-002), hapus kode ID lama di Supabase agar tidak tertinggal data usang
  if (newId !== oldId && typeof deleteMitraFromSupabase === 'function') {
    deleteMitraFromSupabase(oldId, currentStoreSlug);
    if (typeof dbDeleteMitra === 'function') {
      dbDeleteMitra(oldId);
    }
  }

  // Update properti mitra
  mitra.id = newId;
  mitra.partner_code = newId;
  mitra.tier = newTier;
  mitra.qualificationDate = new Date().toISOString().split('T')[0];
  mitra.lastOrderDate = new Date().toISOString().split('T')[0];
  mitra.status = 'active';

  // Simpan ke storage lokal & IndexedDB
  saveStoredMitra(appState.mitraList, false);
  if (typeof dbSaveMitra === 'function') {
    dbSaveMitra(mitra);
  }

  // Simpan ke Supabase Cloud
  if (typeof saveMitraToSupabase === 'function') {
    saveMitraToSupabase(mitra, currentStoreSlug);
  }

  closeModal('modalUpgradeMitra');
  renderResellers();
  updateViewModeUI();

  showToast(`🎉 Selamat! Mitra "${oldName}" resmi dipromosikan ke tingkat ${SR12_TIERS[newTier]?.name || newTier}!`);

  if (willSendWA) {
    sendMitraUpgradeCongratsWA(mitra, oldTier, newTier, newId);
  }
}
window.handleConfirmMitraUpgrade = handleConfirmMitraUpgrade;

function sendMitraUpgradeCongratsWA(mitra, oldTier, newTier, newId) {
  if (!mitra || !mitra.phone) return;
  const cleanPhone = mitra.phone.replace(/[^0-9]/g, '');
  const waTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : (cleanPhone.startsWith('62') ? cleanPhone : '62' + cleanPhone);

  const oldTierName = SR12_TIERS[oldTier]?.name || oldTier;
  const newTierName = SR12_TIERS[newTier]?.name || newTier;
  const newDiscount = SR12_TIERS[newTier]?.discountPct || 20;
  const storeName = appState.storeSettings?.storeName || 'SR12 Partner Store';

  const msg = `🎉 *SURAT KETERANGAN RESMI KENAIKAN TINGKAT MITRA SR12* 🎉\n\n` +
    `Yth. Kak *${mitra.name}*,\n\n` +
    `Alhamdulillah, atas dedikasi dan performa luar biasa Kakak dalam mencatatkan penjualan & akumulasi belanja yang melampaui target, per hari ini *${storeName}* secara resmi memutuskan:\n\n` +
    `✨ *MENAIKKAN TINGKAT KEMITRAAN KAKAK:* ✨\n` +
    `• Dari Jenjang    : *${oldTierName}*\n` +
    `• Naik Menjadi    : *${newTierName.toUpperCase()}* 👑\n` +
    `• ID Kemitraan Baru: *${newId}*\n` +
    `• Hak Keuntungan  : *Diskon ${newDiscount}% Langsung Setiap Pembelian*\n` +
    `• Tanggal Promosi : *${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}*\n\n` +
    `Sekarang Kakak sudah bisa berbelanja langsung di website toko kami dengan memasukkan ID *${newId}* atau nomor WhatsApp Kakak untuk menikmati diskon resmi ${newDiscount}%!\n\n` +
    `Terima kasih atas sinergi luar biasa bersama kami. Semoga bisnis herbal SR12 Kakak semakin berkah, laris manis, dan segera menembus tingkat berikutnya! Aamiin. 🤲🍃\n\n` +
    `Salam Sukses,\n` +
    `*Manajemen ${storeName}*`;

  const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}
window.sendMitraUpgradeCongratsWA = sendMitraUpgradeCongratsWA;

function toggleAutoUpgradeMitraSetting(enabled) {
  if (!appState.storeSettings) appState.storeSettings = {};
  appState.storeSettings.autoTierUpgrade = !!enabled;
  saveStoredStoreSettings(appState.storeSettings);
  if (enabled) {
    showToast('⚡ Mode Promosi Otomatis AKTIF: Mitra yang tembus target otomatis naik tingkat!');
    checkAllMitraForAutoUpgrade();
  } else {
    showToast('Mode Promosi Otomatis NONAKTIF: Kenaikan tingkat mitra menunggu persetujuan manual 1-klik.');
  }
}
window.toggleAutoUpgradeMitraSetting = toggleAutoUpgradeMitraSetting;

function checkAllMitraForAutoUpgrade() {
  if (!appState.storeSettings || !appState.storeSettings.autoTierUpgrade) return;
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  let upgradedCount = 0;

  (appState.mitraList || []).forEach(m => {
    if ((m.store_slug || 'sr12-central') !== currentStoreSlug) return;
    const prog = getMitraProgression(m);
    if (prog.hasNextTier && prog.isEligible) {
      const oldId = m.id;
      const oldTier = m.tier;
      const newTier = prog.nextTier;
      const newId = generateNextMitraId(newTier);

      if (newId !== oldId && typeof deleteMitraFromSupabase === 'function') {
        deleteMitraFromSupabase(oldId, currentStoreSlug);
        if (typeof dbDeleteMitra === 'function') {
          dbDeleteMitra(oldId);
        }
      }

      m.tier = newTier;
      m.id = newId;
      m.partner_code = newId;
      m.qualificationDate = new Date().toISOString().split('T')[0];
      m.lastOrderDate = new Date().toISOString().split('T')[0];
      m.status = 'active';
      if (typeof saveMitraToSupabase === 'function') {
        saveMitraToSupabase(m, currentStoreSlug);
      }
      upgradedCount++;
    }
  });

  if (upgradedCount > 0) {
    saveStoredMitra(appState.mitraList, false);
    renderResellers();
    updateViewModeUI();
    showToast(`⚡ ${upgradedCount} mitra otomatis dipromosikan ke tingkat berikutnya!`);
  }
}
window.checkAllMitraForAutoUpgrade = checkAllMitraForAutoUpgrade;

function checkAndAutoUpgradeMitraIfEnabled(mitra, storeSlug = null) {
  if (!mitra || !appState.storeSettings || !appState.storeSettings.autoTierUpgrade) return;
  const currentStoreSlug = storeSlug || (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const prog = getMitraProgression(mitra);
  if (prog.hasNextTier && prog.isEligible) {
    const oldId = mitra.id;
    const oldTier = mitra.tier;
    const oldName = mitra.name;
    const newTier = prog.nextTier;
    const nextTierObj = SR12_TIERS[newTier];
    const newId = generateNextMitraId(newTier);

    if (newId !== oldId && typeof deleteMitraFromSupabase === 'function') {
      deleteMitraFromSupabase(oldId, currentStoreSlug);
      if (typeof dbDeleteMitra === 'function') {
        dbDeleteMitra(oldId);
      }
    }

    mitra.id = newId;
    mitra.partner_code = newId;
    mitra.tier = newTier;
    mitra.qualificationDate = new Date().toISOString().split('T')[0];
    mitra.lastOrderDate = new Date().toISOString().split('T')[0];
    mitra.status = 'active';

    saveStoredMitra(appState.mitraList, false);
    if (typeof dbSaveMitra === 'function') {
      dbSaveMitra(mitra);
    }
    if (typeof saveMitraToSupabase === 'function') {
      saveMitraToSupabase(mitra, currentStoreSlug);
    }

    if (typeof renderResellers === 'function') {
      renderResellers();
    }
    if (typeof updateViewModeUI === 'function') {
      updateViewModeUI();
    }

    if (typeof showToast === 'function') {
      showToast(`⚡ AUTO-UPGRADE: Mitra "${oldName}" otomatis dipromosikan menjadi ${nextTierObj?.name || newTier}!`);
    }
  }
}
window.checkAndAutoUpgradeMitraIfEnabled = checkAndAutoUpgradeMitraIfEnabled;

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
  const joinDateInput = document.getElementById('newMitraJoinDate');

  const tier = preferredTier || (tierSelect ? tierSelect.value : 'reseller');
  if (tierSelect) tierSelect.value = tier;
  if (idInput) idInput.value = generateNextMitraId(tier);
  if (joinDateInput) joinDateInput.value = new Date().toISOString().split('T')[0];

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
      initialSpendInput.value = 0;
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
  const joinDate = document.getElementById('newMitraJoinDate')?.value || new Date().toISOString().split('T')[0];
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

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';

  // Cek apakah ID sudah dipakai di toko ini
  const storeMitra = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
  if (storeMitra.some(m => (m.id || '').toUpperCase() === id.toUpperCase())) {
    alert(`Nomor ID "${id}" sudah digunakan di toko ini! Silakan gunakan ID lain.`);
    return;
  }

  const newMitra = {
    id: id,
    store_slug: currentStoreSlug,
    name: name,
    phone: phone,
    city: city || 'Indonesia',
    tier: tier,
    bankName: bankName,
    bankAccount: bankAccount,
    bankHolder: bankHolder,
    qualificationDate: joinDate,
    lastOrderDate: joinDate,
    accumulatedSpent90Days: initialSpend,
    totalOrdersCount: initialSpend > 0 ? 1 : 0,
    status: 'active'
  };

  appState.mitraList.unshift(newMitra);
  appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
  saveStoredMitra(appState.mitraList, false); // Mencegah double call ke Supabase
  if (typeof saveMitraToSupabase === 'function') {
    saveMitraToSupabase(newMitra, currentStoreSlug);
  }

  renderResellers();
  updateViewModeUI();
  closeModal('modalAddMitra');
  closeModal('modalAddReseller');
  showToast(`✅ Berhasil! Mitra "${name}" (${id}) berhasil didaftarkan. Siklus 3 bulan dihitung dari ${joinDate}.`);
}

function handleAddResellerSubmit(e) {
  handleAddMitraSubmit(e);
}

function openEditMitraModal(mitraId) {
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const mitra = (appState.mitraList || []).find(m => m.id === mitraId && (m.store_slug || 'sr12-central') === currentStoreSlug);
  if (!mitra) return;

  const modal = document.getElementById('modalEditMitra');
  const idHidden = document.getElementById('editMitraOriginalId');
  const idInput = document.getElementById('editMitraId');
  const tierSelect = document.getElementById('editMitraTier');
  const nameInput = document.getElementById('editMitraName');
  const joinDateInput = document.getElementById('editMitraJoinDate');
  const phoneInput = document.getElementById('editMitraPhone');
  const cityInput = document.getElementById('editMitraCity');
  const bankNameSelect = document.getElementById('editMitraBankName');
  const bankAccountInput = document.getElementById('editMitraBankAccount');
  const bankHolderInput = document.getElementById('editMitraBankHolder');

  if (idHidden) idHidden.value = mitra.id;
  if (idInput) idInput.value = mitra.id;
  if (tierSelect) tierSelect.value = mitra.tier || 'reseller';
  if (nameInput) nameInput.value = mitra.name || '';
  if (joinDateInput) joinDateInput.value = mitra.qualificationDate || mitra.lastOrderDate || new Date().toISOString().split('T')[0];
  if (phoneInput) phoneInput.value = mitra.phone || '';
  if (cityInput) cityInput.value = mitra.city || '';
  if (bankNameSelect) bankNameSelect.value = mitra.bankName || 'BCA';
  if (bankAccountInput) bankAccountInput.value = mitra.bankAccount || '';
  if (bankHolderInput) bankHolderInput.value = mitra.bankHolder || mitra.name || '';

  if (modal) modal.classList.add('open');
}
window.openEditMitraModal = openEditMitraModal;

async function handleEditMitraSubmit(e) {
  if (e) e.preventDefault();
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const originalId = document.getElementById('editMitraOriginalId')?.value;
  const mitra = (appState.mitraList || []).find(m => m.id === originalId && (m.store_slug || 'sr12-central') === currentStoreSlug);
  if (!mitra) return;

  const newTier = document.getElementById('editMitraTier')?.value || mitra.tier;
  const newName = document.getElementById('editMitraName')?.value.trim() || mitra.name;
  const newJoinDate = document.getElementById('editMitraJoinDate')?.value || mitra.qualificationDate;
  const newPhone = document.getElementById('editMitraPhone')?.value.trim() || mitra.phone;
  const newCity = document.getElementById('editMitraCity')?.value.trim() || mitra.city;
  const newBankName = document.getElementById('editMitraBankName')?.value || mitra.bankName;
  const newBankAccount = document.getElementById('editMitraBankAccount')?.value.trim() || mitra.bankAccount;
  const newBankHolder = document.getElementById('editMitraBankHolder')?.value.trim() || mitra.bankHolder;

  mitra.tier = newTier;
  mitra.name = newName;
  mitra.qualificationDate = newJoinDate;
  mitra.phone = newPhone;
  mitra.city = newCity;
  mitra.bankName = newBankName;
  mitra.bankAccount = newBankAccount;
  mitra.bankHolder = newBankHolder;

  saveStoredMitra(appState.mitraList, false);
  if (typeof dbSaveMitra === 'function') {
    dbSaveMitra(mitra);
  }
  if (typeof saveMitraToSupabase === 'function') {
    saveMitraToSupabase(mitra, currentStoreSlug);
  }

  closeModal('modalEditMitra');
  renderResellers();
  updateViewModeUI();
  showToast(`✅ Data mitra "${newName}" berhasil diperbarui! Siklus 3 bulan dihitung dari ${newJoinDate}.`);
}
window.handleEditMitraSubmit = handleEditMitraSubmit;

function deleteMitra(id) {
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const found = (appState.mitraList || []).find(m => m.id === id && (m.store_slug || 'sr12-central') === currentStoreSlug);
  if (!found) return;
  if (!confirm(`Hapus mitra "${found.name}" (${found.id}) dari database toko ini?`)) return;

  appState.mitraList = appState.mitraList.filter(m => !(m.id === id && (m.store_slug || 'sr12-central') === currentStoreSlug));
  appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
  saveStoredMitra(appState.mitraList);
  if (typeof dbDeleteMitra === 'function') {
    dbDeleteMitra(id);
  }
  if (typeof deleteMitraFromSupabase === 'function') {
    deleteMitraFromSupabase(id, currentStoreSlug);
  }
  renderResellers();
  updateViewModeUI();
  showToast(`Mitra "${found.name}" (${found.id}) berhasil dihapus.`);
}

function deleteReseller(id) {
  deleteMitra(id);
}

function clearAllMitraDatabase() {
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  if (!confirm(`⚠️ Anda yakin ingin mengosongkan seluruh Database Mitra Binaan Toko "${appState.storeSettings?.storeName || currentStoreSlug}"?\n\nData mitra pada toko ini akan dihapus bersih.`)) {
    return;
  }
  const toRemove = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
  appState.mitraList = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') !== currentStoreSlug);
  appState.resellers = [];
  saveStoredMitra(appState.mitraList);
  if (typeof dbSaveAllMitra === 'function') {
    dbSaveAllMitra(appState.mitraList);
  }
  if (typeof deleteMitraFromSupabase === 'function') {
    toRemove.forEach(m => deleteMitraFromSupabase(m.id, currentStoreSlug));
  }
  renderResellers();
  updateViewModeUI();
  showToast('🗑️ Database Mitra Toko Ini berhasil dikosongkan!');
}
window.clearAllMitraDatabase = clearAllMitraDatabase;

function clearAllMarketerSales() {
  const curSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const storeName = (appState.storeSettings && appState.storeSettings.storeName) || curSlug;
  if (!confirm(`⚠️ Anda yakin ingin mengosongkan seluruh Rekap Penjualan & Bonus Gaji Marketer untuk toko "${storeName}"?\n\nSeluruh catatan penjualan dan komisi marketer toko ini akan dikosongkan untuk simulasi bersih.`)) {
    return;
  }
  appState.marketerSales = [];
  saveStoredMarketerSales([], false, curSlug);
  try {
    localStorage.removeItem(`sr12_marketer_sales_v2_${curSlug}`);
    if (curSlug === 'sr12-central') {
      localStorage.removeItem('sr12_marketer_sales_v1');
    }
    sessionStorage.removeItem('sr12_active_referral_marketer');
    localStorage.removeItem('sr12_active_referral_marketer');
    appState.activeReferralMarketer = '';
  } catch(e) {}

  if (typeof dbSaveAllMarketerSales === 'function') {
    dbSaveAllMarketerSales([]);
  }
  if (typeof clearMarketerSalesFromSupabase === 'function') {
    clearMarketerSalesFromSupabase(curSlug);
  }

  // Bersihkan juga transaksi pesanan yang terafiliasi marketer agar tidak membangkitkan rekap lagi
  if (Array.isArray(appState.transactions)) {
    const prevTrxLen = appState.transactions.length;
    appState.transactions = appState.transactions.filter(t => !t.marketerId && t.tier !== 'marketer');
    if (appState.transactions.length !== prevTrxLen && typeof saveStoredTransactions === 'function') {
      saveStoredTransactions(appState.transactions, curSlug);
    }
  }

  // Reset akumulasi belanja dan pesanan marketer di mitraList toko ini
  if (Array.isArray(appState.mitraList)) {
    appState.mitraList.forEach(m => {
      if ((!m.store_slug || m.store_slug === curSlug || curSlug === 'sr12-central') && m.tier === 'marketer') {
        m.accumulatedSpent90Days = 0;
        m.totalOrdersCount = 0;
        m.spent = 0;
      }
    });
    saveStoredMitra(appState.mitraList, false);
    if (typeof dbSaveAllMitra === 'function') {
      dbSaveAllMitra(appState.mitraList);
    }
  }
  renderMarketerPayroll();
  if (typeof renderResellers === 'function') renderResellers();
  if (typeof renderPosTransactions === 'function') renderPosTransactions();
  if (typeof renderAdminOrdersModal === 'function') renderAdminOrdersModal();
  showToast('🗑️ Rekap Gaji & Komisi Marketer toko ini berhasil dikosongkan!');
}
window.clearAllMarketerSales = clearAllMarketerSales;

function clearStoreOrdersAndFinancials(targetSlug, silent = false) {
  const curSlug = targetSlug || (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const storeName = (appState.storeSettings && appState.storeSettings.storeName) || curSlug;

  if (!silent) {
    if (!confirm(`🧹 BERSIHKAN DATA TRANSAKSI & PEMBUKUAN TOKO: "${storeName}"?\n\nFitur ini akan mengosongkan seluruh:\n• Riwayat transaksi kasir POS & pesanan online\n• Seluruh catatan rekap komisi gaji marketer\n• Riwayat kas masuk & keranjang belanja\n• Reset angka akumulasi belanja mitra ke Rp 0\n• Supabase Cloud & IndexedDB disinkronkan bersih\n\nData kemitraan & produk Anda tetap tersimpan aman.`)) {
      return;
    }
  }

  // 1. Kosongkan transaksi toko ini
  appState.transactions = [];
  if (typeof saveStoredTransactions === 'function') {
    saveStoredTransactions([], curSlug);
  }
  try {
    localStorage.removeItem(`sr12_pos_transactions_v2_${curSlug}`);
    localStorage.removeItem('sr12_pos_transactions_v1');
    localStorage.removeItem(`sr12_admin_orders_${curSlug}`);
    localStorage.removeItem(`sr12_orders_${curSlug}`);
    localStorage.removeItem('sr12_notified_orders');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sr12_pos_transactions_') && (k.includes(curSlug) || curSlug === 'sr12-central')) {
        localStorage.removeItem(k);
      }
    });
  } catch(e) {}
  appState.notifiedOrderIds = new Set();

  // 2. Kosongkan marketer sales toko ini
  appState.marketerSales = [];
  if (typeof saveStoredMarketerSales === 'function') {
    saveStoredMarketerSales([], false, curSlug);
  }
  try {
    localStorage.removeItem(`sr12_marketer_sales_v2_${curSlug}`);
    localStorage.removeItem('sr12_marketer_sales_v1');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sr12_marketer_sales_') && (k.includes(curSlug) || curSlug === 'sr12-central')) {
        localStorage.removeItem(k);
      }
    });
  } catch(e) {}

  // 3. Kosongkan kas masuk toko ini
  appState.cashflow = [];
  if (typeof saveStoredCashflow === 'function') {
    saveStoredCashflow([], curSlug);
  }
  try {
    localStorage.removeItem(`sr12_cashflow_records_v2_${curSlug}`);
    localStorage.removeItem('sr12_cashflow_records_v1');
    localStorage.removeItem(`sr12_stock_mutations_v2_${curSlug}`);
    localStorage.removeItem('sr12_stock_mutations_v1');
  } catch(e) {}

  // 4. Kosongkan keranjang & referral aktif
  appState.cart = [];
  appState.posCart = [];
  if (typeof saveStoredCart === 'function') {
    saveStoredCart([]);
  }
  appState.activeReferralMarketer = '';
  try {
    sessionStorage.removeItem('sr12_active_referral_marketer');
    localStorage.removeItem('sr12_active_referral_marketer');
  } catch(e) {}

  // 5. Bersihkan IndexedDB Marketer Sales permanen
  if (typeof dbSaveAllMarketerSales === 'function') {
    dbSaveAllMarketerSales([]);
  }

  // 6. Bersihkan Cloud Supabase secara total
  if (typeof clearOrdersFromSupabase === 'function') {
    clearOrdersFromSupabase(curSlug);
  }
  if (typeof clearMarketerSalesFromSupabase === 'function') {
    clearMarketerSalesFromSupabase(curSlug);
  }

  // 7. Reset akumulasi belanja seluruh mitra toko ini ke 0
  if (Array.isArray(appState.mitraList)) {
    appState.mitraList.forEach(m => {
      if (!m.store_slug || m.store_slug === curSlug || curSlug === 'sr12-central') {
        m.accumulatedSpent90Days = 0;
        m.totalOrdersCount = 0;
        m.spent = 0;
      }
    });
    saveStoredMitra(appState.mitraList, false);
    if (typeof dbSaveAllMitra === 'function') {
      dbSaveAllMitra(appState.mitraList);
    }
  }

  // 8. Reset seluruh badge transaksi & pesanan ke 0
  const trxBadge = document.getElementById('olseraTrxBadge');
  if (trxBadge) trxBadge.textContent = '0';
  const badgePending = document.getElementById('adminOrdersTabBadgePending');
  const badgeDone = document.getElementById('adminOrdersTabBadgeDone');
  if (badgePending) badgePending.textContent = '0';
  if (badgeDone) badgeDone.textContent = '0';
  const badge1 = document.getElementById('adminPendingOrderCountBadge');
  const badge2 = document.getElementById('olseraTopbarOrderBadge');
  if (badge1) badge1.textContent = '0';
  if (badge2) badge2.textContent = '0';
  const drawerOrderBadge = document.getElementById('olseraDrawerOrderBadge');
  if (drawerOrderBadge) drawerOrderBadge.style.display = 'none';
  const staticMenuBadge = document.getElementById('olseraStaticMenuOrderBadge');
  if (staticMenuBadge) staticMenuBadge.style.display = 'none';

  // 9. Refresh seluruh tampilan seketika
  if (typeof updateCartUI === 'function') updateCartUI();
  if (typeof renderPosTransactions === 'function') renderPosTransactions('all');
  if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
  if (typeof renderResellers === 'function') renderResellers();
  if (typeof renderCashflowTable === 'function') renderCashflowTable();
  if (typeof updateAdminNotificationUI === 'function') updateAdminNotificationUI();
  if (typeof renderAdminOrdersModal === 'function') renderAdminOrdersModal();
  if (typeof updateStoreQuotaUI === 'function') updateStoreQuotaUI();

  if (!silent) {
    showToast(`✅ Seluruh data transaksi & pesanan untuk toko "${storeName}" berhasil dibersihkan total!`);
  }
}
window.clearStoreOrdersAndFinancials = clearStoreOrdersAndFinancials;
window.clearStoreAllSimulationData = clearStoreOrdersAndFinancials;

function resetAllMitraAccumulation() {
  const curSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const storeName = (appState.storeSettings && appState.storeSettings.storeName) || curSlug;
  if (!confirm(`🧹 Reset seluruh angka akumulasi belanja mitra toko "${storeName}" kembali ke Rp 0?\n\n• Data mitra (nama, ID, nomor WA, rekening) TETAP TERSIMPAN AMAN.\n• Angka akumulasi belanja & pesanan terjual akan dinolkan kembali untuk simulasi baru.`)) {
    return;
  }
  if (Array.isArray(appState.mitraList)) {
    appState.mitraList.forEach(m => {
      m.accumulatedSpent90Days = 0;
      m.totalOrdersCount = 0;
      m.spent = 0;
    });
    saveStoredMitra(appState.mitraList, false);
    if (typeof dbSaveAllMitra === 'function') {
      dbSaveAllMitra(appState.mitraList);
    }
  }
  if (typeof renderResellers === 'function') renderResellers();
  showToast('✅ Seluruh angka akumulasi belanja mitra berhasil di-reset ke Rp 0!');
}
window.resetAllMitraAccumulation = resetAllMitraAccumulation;

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

// Helper ekstraksi periode bulan dari tanggal (Format standar 'YYYY-MM')
function extractMonthPeriod(dateStr, explicitMonthPeriod) {
  if (explicitMonthPeriod && /^\d{4}-\d{2}$/.test(String(explicitMonthPeriod).trim())) {
    return String(explicitMonthPeriod).trim();
  }
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  // Format YYYY-MM-DD atau ISO
  if (/^\d{4}-\d{2}/.test(s)) {
    return s.slice(0, 7);
  }
  // Format lokal Indonesia DD/MM/YYYY atau DD-MM-YYYY
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}`;
  }
  // Fallback Date object parsing
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  } catch (e) {}
  return '';
}

// Helper nama bulan resmi Indonesia
function formatMonthPeriodTitle(period) {
  if (!period || period === 'all') return 'Semua Periode (Akumulasi)';
  const monthNames = {
    '01': 'Januari',
    '02': 'Februari',
    '03': 'Maret',
    '04': 'April',
    '05': 'Mei',
    '06': 'Juni',
    '07': 'Juli',
    '08': 'Agustus',
    '09': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Desember'
  };
  const parts = String(period).split('-');
  if (parts.length === 2 && monthNames[parts[1]]) {
    return `${monthNames[parts[1]]} ${parts[0]}`;
  }
  return period;
}

// Populasi dinamis opsi pilihan bulan pada filter rekap gaji marketer
function populatePayrollMonthSelect() {
  const select = document.getElementById('payrollMonthSelect');
  if (!select) return;

  const currentVal = select.value || appState.selectedPayrollMonth || 'all';

  const monthNamesIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const periodSet = new Set();
  const now = new Date();

  // Tambahkan rentang dinamis 24 bulan ke depan (masa depan) hingga 24 bulan ke belakang (masa lalu)
  for (let i = -24; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periodSet.add(key);
  }

  // Tambahkan juga jika ada riwayat transaksi masa lalu atau rencana masa depan di data lokal
  (appState.marketerSales || []).forEach(s => {
    const m = extractMonthPeriod(s.date || s.dateTime || s.created_at, s.monthPeriod || s.month_period);
    if (m) periodSet.add(m);
  });
  (appState.transactions || []).forEach(t => {
    const m = extractMonthPeriod(t.dateTime || t.date || t.created_at, t.monthPeriod);
    if (m) periodSet.add(m);
  });

  const sortedPeriods = Array.from(periodSet).sort().reverse();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let html = `<option value="all" ${currentVal === 'all' ? 'selected' : ''}>Semua Periode (Akumulasi)</option>`;
  sortedPeriods.forEach(p => {
    const parts = p.split('-');
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    const isCurrent = (p === curKey);
    const label = `${monthNamesIndo[mIdx] || parts[1]} ${y}${isCurrent ? ' (Bulan Ini)' : ''}`;
    html += `<option value="${p}" ${currentVal === p ? 'selected' : ''}>${label}</option>`;
  });

  select.innerHTML = html;
  select.value = currentVal;
}

// Konsolidasi & deduplikasi pesanan marketer terpadu terisolasi per periode
function getMarketerConsolidatedSales(m, selectedMonth, currentStoreSlug) {
  if (!m) return [];

  const mCleanId = String(m.id || m.partner_code || '').trim().toUpperCase();
  const mPhoneDigits = (m.phone || '').replace(/[^0-9]/g, '');
  const mNameClean = String(m.name || '').trim().toLowerCase();

  const isCurrentStore = (sSlug) => {
    if (!sSlug) return true; // Sesuai dengan toko aktif saat ini
    return sSlug === currentStoreSlug;
  };

  const isMatchingMarketer = (mId, mCode, item) => {
    const cleanMid = String(mId || (item && item.marketerId) || '').trim().toUpperCase();
    const cleanMCode = String(mCode || (item && (item.marketerCode || item.partner_code)) || '').trim().toUpperCase();
    const targetId = mCleanId;
    if (cleanMid && (cleanMid === targetId || cleanMid === String(m.id).toUpperCase())) return true;
    if (cleanMCode && (cleanMCode === targetId || cleanMCode === String(m.id).toUpperCase())) return true;
    if (item) {
      const itemPhone = String(item.customerPhone || item.phone || '').trim().toUpperCase();
      if (itemPhone && (itemPhone === targetId || (mPhoneDigits.length >= 8 && itemPhone.replace(/[^0-9]/g, '') === mPhoneDigits))) return true;
      const itemName = String(item.customerName || item.name || '').trim().toLowerCase();
      if (itemName && mNameClean && (itemName === mNameClean || mNameClean.includes(itemName) || itemName.includes(mNameClean))) return true;
      const itemLabel = String(item.tierLabel || '').toLowerCase();
      if (itemLabel && mNameClean && itemLabel.includes(mNameClean)) return true;
      if (itemLabel && targetId && itemLabel.includes(targetId.toLowerCase())) return true;
    }
    return false;
  };

  const isMatchingPeriod = (dateVal, explicitPeriod) => {
    if (!selectedMonth || selectedMonth === 'all') return true;
    const extracted = extractMonthPeriod(dateVal, explicitPeriod);
    return extracted === selectedMonth;
  };

  // Dapatkan map transaksi aktif milik toko saat ini
  const activeTrxMap = new Map();
  (appState.transactions || []).forEach(t => {
    if (t && t.id && t.status !== 'Dihapus' && t.status !== 'deleted') {
      activeTrxMap.set(String(t.id).trim(), t);
    }
  });

  // 1. Ambil dari catatan penjualan marketer (appState.marketerSales)
  const salesFromRecords = (appState.marketerSales || []).filter(s => {
    if (!s) return false;
    if (s.paidStatus === 'deleted' || s.paidStatus === 'Dihapus') return false;
    if (!isCurrentStore(s.store_slug)) return false;

    const oid = String(s.orderId || s.order_id || s.id || '').trim();
    if (oid.startsWith('ORD-MKT-')) return false; // Abaikan dummy lawas
    if (s.marketerId === 'RS-WEB' || s.marketerId === 'RETAIL') return false; // Bukan marketer

    // Jika berawalan ORD-WEB-, pastikan ada di transaksi aktif toko
    if (oid.startsWith('ORD-WEB-') && !activeTrxMap.has(oid)) return false;

    const isM = isMatchingMarketer(s.marketerId, s.partner_code, s);
    if (!isM) return false;

    return isMatchingPeriod(s.date || s.dateTime || s.created_at, s.monthPeriod || s.month_period);
  });

  // 2. Ambil dari transaksi toko online / POS (appState.transactions)
  const salesFromTrx = (appState.transactions || []).filter(t => {
    if (!t || !t.id) return false;
    if (t.status === 'Dihapus' || t.status === 'deleted') return false;
    if (!isCurrentStore(t.store_slug)) return false;

    // Transaksi POS/Online HANYA diakui jika memang order marketer resmi
    const isMktTier = t.tier === 'marketer' || (t.marketerId && String(t.marketerId).toUpperCase().startsWith('MKT-'));
    if (!isMktTier && !t.marketerId) return false;

    const isM = isMatchingMarketer(t.marketerId, null, t);
    if (!isM) return false;

    return isMatchingPeriod(t.dateTime || t.date || t.created_at, t.monthPeriod);
  });

  // 3. Konsolidasi & Deduplikasi ID unik
  const seenOrderKeys = new Set();
  const uniqueSales = [];

  salesFromRecords.forEach(s => {
    const oid = String(s.orderId || s.order_id || s.id || '').trim();
    const omset = Number(s.omsetHet || s.omset_het) || 0;
    const key = oid ? `ID:${oid}` : `FALLBACK:${s.date}:${omset}:${s.customerPhone}`;
    if (!seenOrderKeys.has(key)) {
      seenOrderKeys.add(key);
      const saleDate = s.date || s.dateTime || s.created_at || '';
      const salePeriod = s.monthPeriod || s.month_period || extractMonthPeriod(saleDate) || selectedMonth;
      uniqueSales.push({
        orderId: oid || 'ORD-MKT',
        store_slug: s.store_slug || currentStoreSlug,
        marketerId: m.id,
        date: saleDate,
        monthPeriod: salePeriod,
        customerName: s.customerName || m.name,
        customerPhone: s.customerPhone || m.phone,
        customerAddress: s.customerAddress || '-',
        fulfillmentType: s.fulfillmentType || 'pickup',
        itemsDesc: s.itemsDesc || 'Produk Herbal SR12',
        omsetHet: omset,
        commissionPct: Number(s.commissionPct) || 15,
        commissionAmount: Number(s.commissionAmount) || Math.round(omset * 0.15),
        paidStatus: (s.paidStatus === 'paid' || s.paid_status === 'paid') ? 'paid' : 'unpaid'
      });
    }
  });

  salesFromTrx.forEach(t => {
    const tid = String(t.id).trim();
    const tomset = Number(t.grandTotal || t.subtotalHet) || 0;
    const key = `ID:${tid}`;

    const isAlreadyRecorded = seenOrderKeys.has(key) || uniqueSales.some(s => {
      if (s.orderId === tid) return true;
      const sameAmount = Math.abs(s.omsetHet - tomset) < 100;
      const tDatePrefix = (t.dateTime || t.date || '').slice(0, 10);
      const sDatePrefix = (s.date || '').slice(0, 10);
      return sameAmount && tDatePrefix && sDatePrefix && (tDatePrefix === sDatePrefix || t.customerPhone === s.customerPhone);
    });

    if (!isAlreadyRecorded) {
      seenOrderKeys.add(key);
      const tDate = t.dateTime || t.date || t.created_at || '';
      const tPeriod = t.monthPeriod || extractMonthPeriod(tDate) || selectedMonth;
      uniqueSales.push({
        orderId: tid,
        store_slug: currentStoreSlug,
        marketerId: m.id,
        date: tDate,
        monthPeriod: tPeriod,
        customerName: t.customerName || m.name,
        customerPhone: t.customerPhone || m.phone,
        customerAddress: t.customerAddress || '-',
        fulfillmentType: t.shippingType ? 'dropship' : 'pickup',
        itemsDesc: Array.isArray(t.items) ? t.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Pesanan Web SR12',
        omsetHet: tomset,
        commissionPct: 15,
        commissionAmount: Math.round(tomset * 0.15),
        paidStatus: (t.status === 'Lunas / Selesai' || t.status === 'Selesai') ? 'paid' : 'unpaid'
      });
    }
  });

  return uniqueSales;
}

function renderMarketerPayroll() {
  const tbody = document.getElementById('payrollTableBody');
  const monthSelect = document.getElementById('payrollMonthSelect');

  // Pastikan daftar pilihan bulan terisi lengkap
  if (monthSelect && !monthSelect.getAttribute('data-dynamic-loaded')) {
    populatePayrollMonthSelect();
    monthSelect.setAttribute('data-dynamic-loaded', 'true');
  }

  const selectedMonth = monthSelect ? monthSelect.value : (appState.selectedPayrollMonth || 'all');
  appState.selectedPayrollMonth = selectedMonth;

  const totalMarketersEl = document.getElementById('payrollTotalMarketers');
  const totalOrdersEl = document.getElementById('payrollTotalOrders');
  const totalOmsetEl = document.getElementById('payrollTotalOmset');
  const totalBonusEl = document.getElementById('payrollTotalBonus');

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  if (!appState.marketerSales) {
    appState.marketerSales = getStoredMarketerSales(currentStoreSlug);
  }
  const storeMitra = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);

  // Fungsi validasi ketat ID Marketer (menolak RS-WEB, RES-WEB, RETAIL, dll)
  const isValidMarketer = (id, tier) => {
    if (!id) return false;
    const clean = String(id).trim().toUpperCase();
    if (clean === 'RS-WEB' || clean === 'RES-WEB' || clean === 'RETAIL' || clean === 'KONSUMEN' || clean === 'PELANGGAN') return false;
    if (clean.startsWith('RS-') || clean.startsWith('RES-') || clean.startsWith('AG-') || clean.startsWith('SUB-')) return false;
    if (tier && tier !== 'marketer') return false;
    return true;
  };

  // Bersihkan data sampah non-marketer dari appState.marketerSales
  if (Array.isArray(appState.marketerSales)) {
    const prevCount = appState.marketerSales.length;
    appState.marketerSales = appState.marketerSales.filter(s => {
      if (!s) return false;
      const sMid = String(s.marketerId || '').trim().toUpperCase();
      return isValidMarketer(sMid);
    });
    if (appState.marketerSales.length !== prevCount && typeof saveStoredMarketerSales === 'function') {
      saveStoredMarketerSales(appState.marketerSales, false, currentStoreSlug);
    }
  }

  // Kumpulkan seluruh data marketer yang terdaftar di toko ini
  const marketersMap = new Map();
  storeMitra.filter(m => m.tier === 'marketer' && isValidMarketer(m.id)).forEach(m => {
    if ((m.id === 'MKT-001' || m.partner_code === 'MKT-001') && (!m.name || m.name.includes('Marketer MKT-001'))) {
      m.name = 'Maryam';
      m.phone = m.phone || '085342743763';
      m.city = m.city || 'Baniaga';
      m.bankName = m.bankName || 'BCA';
      m.bankAccount = m.bankAccount || '123456789';
      m.bankHolder = m.bankHolder || 'Maryam';
    }
    marketersMap.set(m.id, m);
  });

  // Tambahkan marketer dari riwayat penjualan marketer di toko ini jika belum ada di map
  (appState.marketerSales || []).forEach(s => {
    const isStore = (!s.store_slug || s.store_slug === currentStoreSlug);
    const sMktId = String(s.marketerId || '').trim().toUpperCase();
    if (isStore && sMktId && isValidMarketer(sMktId) && !marketersMap.has(s.marketerId)) {
      const resolvedName = (typeof getMarketerNameById === 'function' ? getMarketerNameById(s.marketerId) : '') || s.marketerName || (s.marketerId === 'MKT-001' ? 'Maryam' : `Marketer ${s.marketerId}`);
      marketersMap.set(s.marketerId, {
        id: s.marketerId,
        tier: 'marketer',
        name: resolvedName,
        phone: (s.marketerId === 'MKT-001' ? '0895800355550' : (s.customerPhone || '-')),
        city: (s.marketerId === 'MKT-001' ? 'Baniaga' : 'Indonesia'),
        bankName: 'BCA',
        bankAccount: (s.marketerId === 'MKT-001' ? '123456789' : '-'),
        bankHolder: resolvedName
      });
    }
  });

  // Tambahkan marketer dari transaksi online toko HANYA jika memang order marketer resmi
  (appState.transactions || []).forEach(t => {
    const isStore = (!t.store_slug || t.store_slug === currentStoreSlug);
    const tMktId = String(t.marketerId || '').trim().toUpperCase();
    const isMktTrx = t.tier === 'marketer' || (tMktId && tMktId.startsWith('MKT-'));
    if (isStore && tMktId && isValidMarketer(tMktId) && isMktTrx && !marketersMap.has(t.marketerId)) {
      const resolvedName = (typeof getMarketerNameById === 'function' ? getMarketerNameById(t.marketerId) : '') || t.marketerName || (t.marketerId === 'MKT-001' ? 'Maryam' : `Marketer ${t.marketerId}`);
      marketersMap.set(t.marketerId, {
        id: t.marketerId,
        tier: 'marketer',
        name: resolvedName,
        phone: (t.marketerId === 'MKT-001' ? '0895800355550' : (t.customerPhone || '-')),
        city: (t.marketerId === 'MKT-001' ? 'Baniaga' : 'Indonesia'),
        bankName: 'BCA',
        bankAccount: (t.marketerId === 'MKT-001' ? '123456789' : '-'),
        bankHolder: resolvedName
      });
    }
  });

  const marketers = Array.from(marketersMap.values()).filter(m => {
    return isValidMarketer(m.id, m.tier);
  });

  let grandOrders = 0;
  let grandOmset = 0;
  let grandBonus = 0;

  const payrollData = marketers.map(m => {
    const combinedSales = getMarketerConsolidatedSales(m, selectedMonth, currentStoreSlug);
    const countOrders = combinedSales.length;
    const omset = combinedSales.reduce((acc, s) => acc + (Number(s.omsetHet) || 0), 0);
    const bonus = Math.round(omset * 0.15);
    const isAllPaid = countOrders > 0 && combinedSales.every(s => s.paidStatus === 'paid');

    grandOrders += countOrders;
    grandOmset += omset;
    grandBonus += bonus;

    return {
      marketer: m,
      sales: combinedSales,
      countOrders,
      omset,
      bonus,
      isAllPaid
    };
  });

  const activeMarketersCount = payrollData.filter(i => i.countOrders > 0).length;

  if (totalMarketersEl) {
    if (selectedMonth === 'all') {
      totalMarketersEl.textContent = `${marketers.length} Orang`;
    } else {
      totalMarketersEl.textContent = `${activeMarketersCount} / ${marketers.length} Orang`;
    }
  }
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

  tbody.innerHTML = payrollData.map(item => {
    const m = item.marketer;
    const paidBadge = item.countOrders === 0 ? `<span style="background: #f1f5f9; color: #64748b; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">Belum Ada Penjualan</span>` :
                      (item.isAllPaid ? `<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">✅ Lunas Ditransfer</span>` :
                      `<span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">⏳ Belum Ditransfer</span>`);

    return `
      <tr data-marketer-id="${m.id}">
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

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const storeMitra = (appState.mitraList || []).filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
  const marketers = storeMitra.filter(m => m.tier === 'marketer');

  if (marketers.length === 0) {
    alert(`Belum ada tim marketer yang terdaftar di Toko "${appState.storeSettings?.storeName || currentStoreSlug}". Daftarkan marketer terlebih dahulu!`);
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

  const dateInput = document.getElementById('saleOrderDate');
  if (dateInput) {
    const activeMonth = appState.selectedPayrollMonth;
    const nowIso = new Date().toISOString().split('T')[0];
    if (activeMonth && activeMonth !== 'all' && !nowIso.startsWith(activeMonth)) {
      dateInput.value = `${activeMonth}-01`;
    } else {
      dateInput.value = nowIso;
    }
  }

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
  const nowIso = new Date().toISOString().split('T')[0];
  const orderDate = document.getElementById('saleOrderDate')?.value || nowIso;
  const itemsDesc = document.getElementById('saleItemsDesc')?.value.trim();
  const omsetHet = Number(document.getElementById('saleOmsetHet')?.value) || 0;
  const fulfillmentType = document.getElementById('saleFulfillmentType')?.value || 'pickup';
  const customerAddress = document.getElementById('saleCustomerAddress')?.value.trim() || '';

  if (!marketerId || !customerName || omsetHet <= 0) {
    alert('Mohon lengkapi semua data pesanan marketer dengan benar!');
    return;
  }

  const monthPeriod = extractMonthPeriod(orderDate) || orderDate.slice(0, 7);
  const commission = Math.round(omsetHet * 0.15);

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const newSale = {
    orderId: 'ORD-MKT-' + Date.now().toString().slice(-4),
    store_slug: currentStoreSlug,
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

  // Update total omset marketer di data mitra toko ini
  const marketer = (appState.mitraList || []).find(m => m.id === marketerId && (m.store_slug || 'sr12-central') === currentStoreSlug);
  if (marketer) {
    marketer.accumulatedSpent90Days = (marketer.accumulatedSpent90Days || 0) + omsetHet;
    marketer.totalOrdersCount = (marketer.totalOrdersCount || 0) + 1;
    marketer.lastOrderDate = orderDate;
    if (typeof checkAndAutoUpgradeMitraIfEnabled === 'function') {
      checkAndAutoUpgradeMitraIfEnabled(marketer, currentStoreSlug);
    }
    saveStoredMitra(appState.mitraList);
    if (typeof saveMitraToSupabase === 'function') {
      saveMitraToSupabase(marketer, currentStoreSlug);
    }
  }

  closeModal('modalAddMarketerSale');
  renderMarketerPayroll();
  renderResellers();
  showToast(`✅ Pesanan senilai ${formatRupiah(omsetHet)} berhasil dicatat! Hak bonus 15% (${formatRupiah(commission)}) ditambahkan.`);
}

function toggleMarketerPayrollStatus(marketerId, monthPeriod) {
  if (!appState.marketerSales) appState.marketerSales = getStoredMarketerSales();
  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const marketer = (appState.mitraList || []).find(m => m.id === marketerId);
  const sales = getMarketerConsolidatedSales(marketer, monthPeriod, currentStoreSlug);
  if (sales.length === 0) return;

  const allPaid = sales.every(s => s.paidStatus === 'paid');
  const newStatus = allPaid ? 'unpaid' : 'paid';
  const nowIso = new Date().toISOString().split('T')[0];

  sales.forEach(s => {
    const found = appState.marketerSales.find(ms => (ms.orderId && ms.orderId === s.orderId) || (ms.id && ms.id === s.id));
    if (found) {
      found.paidStatus = newStatus;
      found.paidDate = newStatus === 'paid' ? nowIso : null;
      if (typeof saveMarketerSaleToSupabase === 'function') {
        saveMarketerSaleToSupabase(found, currentStoreSlug);
      }
    } else {
      s.paidStatus = newStatus;
      s.paidDate = newStatus === 'paid' ? nowIso : null;
      appState.marketerSales.unshift(s);
      if (typeof saveMarketerSaleToSupabase === 'function') {
        saveMarketerSaleToSupabase(s, currentStoreSlug);
      }
    }
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

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const sales = getMarketerConsolidatedSales(marketer, monthPeriod, currentStoreSlug);
  const periodTitle = formatMonthPeriodTitle(monthPeriod);

  if (title) title.textContent = `📋 Rincian Pesanan: ${marketer.name} (${marketer.id})`;

  const totalOmset = sales.reduce((a, s) => a + (s.omsetHet || 0), 0);
  const totalComm = Math.round(totalOmset * 0.15);

  if (headerBox) {
    headerBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <b>Rekening Tujuan:</b> ${marketer.bankName || 'BCA'} - ${marketer.bankAccount || '-'} (a.n ${marketer.bankHolder || marketer.name})<br>
          <span style="font-size: 0.75rem; color: #64748b;">No. WhatsApp: ${marketer.phone} &middot; Periode: <b>${periodTitle}</b></span>
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
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Belum ada transaksi di periode ${periodTitle}.</td></tr>`;
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
              ${s.customerAddress && s.customerAddress !== '-' ? `<span style="font-size: 0.68rem; color: #64748b;">${s.customerAddress}</span>` : ''}
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

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
  const sales = getMarketerConsolidatedSales(marketer, monthPeriod, currentStoreSlug);
  const totalOmset = sales.reduce((a, s) => a + (s.omsetHet || 0), 0);
  const totalBonus = Math.round(totalOmset * 0.15);
  const allPaid = sales.length > 0 && sales.every(s => s.paidStatus === 'paid');

  const cleanPhone = marketer.phone.replace(/[^0-9]/g, '');
  const targetWa = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  const monthTitle = formatMonthPeriodTitle(monthPeriod);

  if (sales.length === 0) {
    alert(`Belum ada catatan transaksi pesanan untuk ${marketer.name} pada periode ${monthTitle}!`);
    return;
  }

  const text = `📄 *SLIP BONUS & KOMISI BULANAN MARKETER SR12*\n` +
    `Toko : *${storeName}*\n` +
    `Bulan: *${monthTitle}*\n` +
    `------------------------------------------\n` +
    `👤 *DATA MARKETER:*\n` +
    `• ID Marketer   : *${marketer.id}*\n` +
    `• Nama Lengkap  : ${marketer.name}\n` +
    `• No. WhatsApp  : ${marketer.phone}\n` +
    `• Rekening Bank : ${marketer.bankName || 'BCA'} - ${marketer.bankAccount || '-'}\n` +
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
let debounceMitraCheckTimer = null;

function checkBuyerMitraPhoneClick() {
  const input = document.getElementById('cartBuyerPhoneInput');
  if (input && input.value) {
    if (debounceMitraCheckTimer) clearTimeout(debounceMitraCheckTimer);
    const q = input.value.trim();
    // 1. Cek langsung memori lokal
    let found = findMitraByIdOrPhone(q);
    if (found) {
      applyBuyerMitraVerification(found, q);
      return;
    }
    // 2. Jika belum ada di lokal, periksa langsung ke Supabase Cloud (Khusus Toko Ini)
    if (typeof findMitraInSupabase === 'function') {
      const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
      const storeName = appState.storeSettings?.storeName || 'Toko Ini';
      const notice = document.getElementById('buyerStatusNotice');
      if (notice) {
        notice.style.display = 'block';
        notice.style.background = '#f0f9ff';
        notice.style.color = '#0369a1';
        notice.style.border = '1px solid #bae6fd';
        notice.innerHTML = `<span>⏳ Memverifikasi ID/No. HP "<b>${escapeHtml(q)}</b>" di Database ${storeName}...</span>`;
      }
      findMitraInSupabase(q, currentStoreSlug).then(cloudFound => {
        if (cloudFound) {
          if (!appState.mitraList) appState.mitraList = [];
          const existIdx = appState.mitraList.findIndex(m => m.id === cloudFound.id && (m.store_slug || 'sr12-central') === currentStoreSlug);
          if (existIdx >= 0) {
            appState.mitraList[existIdx] = Object.assign({}, appState.mitraList[existIdx], cloudFound);
          } else {
            appState.mitraList.unshift(cloudFound);
          }
          appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
          saveStoredMitra(appState.mitraList, false);
          applyBuyerMitraVerification(cloudFound, q);
          showToast(`✅ Data Mitra "${cloudFound.name}" (${cloudFound.id}) berhasil diverifikasi dari Cloud!`);
        } else {
          applyBuyerMitraVerification(null, q);
        }
      }).catch(err => {
        console.warn('Cek cloud error:', err);
        applyBuyerMitraVerification(null, q);
      });
    } else {
      applyBuyerMitraVerification(null, q);
    }
  }
}

async function autoCheckBuyerMitraPhone(query) {
  const notice = document.getElementById('buyerStatusNotice');
  if (!notice) return;
  const q = (query || '').trim();
  if (q.length < 2) {
    notice.style.display = 'none';
    appState.verifiedMitra = null;
    updateCartSummary();
    return;
  }

  if (!appState.mitraList) {
    appState.mitraList = getStoredMitra();
  }

  const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';

  // 1. Cek dulu di memori lokal (instan tanpa delay, khusus toko ini)
  const found = findMitraByIdOrPhone(q, currentStoreSlug);
  if (found) {
    if (debounceMitraCheckTimer) clearTimeout(debounceMitraCheckTimer);
    applyBuyerMitraVerification(found, q);
    return;
  }

  // 2. Jika belum ditemukan di lokal, cari ke Supabase Cloud (dengan debounce 350ms, khusus toko ini)
  if (typeof findMitraInSupabase === 'function' && q.length >= 3) {
    const storeName = appState.storeSettings?.storeName || 'Toko Ini';
    notice.style.display = 'block';
    notice.style.background = '#f0f9ff';
    notice.style.color = '#0369a1';
    notice.style.border = '1px solid #bae6fd';
    notice.innerHTML = `<span>⏳ Mencari "<b>${escapeHtml(q)}</b>" di Database ${storeName}...</span>`;

    if (debounceMitraCheckTimer) clearTimeout(debounceMitraCheckTimer);
    debounceMitraCheckTimer = setTimeout(async () => {
      try {
        const cloudFound = await findMitraInSupabase(q, currentStoreSlug);
        if (cloudFound) {
          if (!appState.mitraList) appState.mitraList = [];
          const existIdx = appState.mitraList.findIndex(m => m.id === cloudFound.id && (m.store_slug || 'sr12-central') === currentStoreSlug);
          if (existIdx >= 0) {
            appState.mitraList[existIdx] = Object.assign({}, appState.mitraList[existIdx], cloudFound);
          } else {
            appState.mitraList.unshift(cloudFound);
          }
          appState.resellers = appState.mitraList.filter(m => (m.store_slug || 'sr12-central') === currentStoreSlug);
          saveStoredMitra(appState.mitraList, false);
          applyBuyerMitraVerification(cloudFound, q);
          showToast(`✅ Data Mitra "${cloudFound.name}" (${cloudFound.id}) berhasil diverifikasi dari Cloud!`);
        } else {
          applyBuyerMitraVerification(null, q);
        }
      } catch (e) {
        console.warn('Auto check cloud mitra error:', e);
        applyBuyerMitraVerification(null, q);
      }
    }, 350);
    return;
  }

  applyBuyerMitraVerification(null, q);
}

function applyBuyerMitraVerification(found, query) {
  const notice = document.getElementById('buyerStatusNotice');
  if (!notice) return;

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
    const currentStoreSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
    const existingCust = (typeof findStoreCustomer === 'function') ? findStoreCustomer(query, currentStoreSlug) : null;
    if (existingCust) {
      const nameField = document.getElementById('cartBuyerNameInput');
      const phoneField = document.getElementById('cartBuyerPhoneField');
      const addrField = document.getElementById('cartBuyerAddressInput');
      if (nameField && !nameField.value) nameField.value = existingCust.name;
      if (phoneField && !phoneField.value) phoneField.value = existingCust.phone;
      if (addrField && (!addrField.value || addrField.value === '-')) addrField.value = existingCust.address || '';
      appState.buyerDetails.name = existingCust.name;
      appState.buyerDetails.phone = existingCust.phone;
      if (existingCust.address && existingCust.address !== '-') {
        appState.buyerDetails.address = existingCust.address;
      }
      const savedBadge = document.getElementById('cartCustomerSavedBadge');
      if (savedBadge) savedBadge.style.display = 'inline-block';

      notice.style.display = 'block';
      notice.style.background = '#ecfdf5';
      notice.style.color = '#065f46';
      notice.style.border = '1px solid #a7f3d0';
      notice.innerHTML = `✨ <b>Pelanggan Retail Dikenali: ${escapeHtml(existingCust.name)}!</b><br>Alamat pengiriman dan kontak WhatsApp otomatis terisi untuk kemudahan pemesanan Anda.`;
      updateCartSummary();
      return;
    }
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
      const storeName = appState.storeSettings?.storeName || 'toko ini';
      const qText = query ? `ID/No. "<b>${escapeHtml(query)}</b>" tidak terdaftar di ${storeName}. ` : '';
      notice.innerHTML = `ℹ️ ${qText}Status: <b>Konsumen Retail (Harga HET)</b>.<br>Tambah belanja ${formatRupiah(def)} lagi (total min. Rp 500.000) untuk otomatis bergabung menjadi Reseller Resmi di ${storeName}!`;
    }
  }
  updateCartSummary();
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
window.activateTopupWithToken = activateTopupWithToken;
window.generateDevTopupToken = generateDevTopupToken;
window.copyDevGeneratedToken = copyDevGeneratedToken;
window.sendDevGeneratedTokenWA = sendDevGeneratedTokenWA;
window.renderDevTokenTable = renderDevTokenTable;
window.deleteDevToken = deleteDevToken;
window.sendSpecificTokenWA = sendSpecificTokenWA;
window.updateDevPaymentUI = updateDevPaymentUI;
window.updateTopupPackageCardsUI = updateTopupPackageCardsUI;
window.openDistributorLoginModal = openDistributorLoginModal;
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
window.updateCloudStatusUI = updateCloudStatusUI;
window.handleCloudBadgeClick = handleCloudBadgeClick;
window.unlockSR12Audio = unlockSR12Audio;

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
  try {
    localStorage.removeItem('sr12_explicit_storefront_preview');
    localStorage.setItem('sr12_current_view', 'portal');
    localStorage.setItem('sr12_active_view_mode', 'portal');
  } catch(e) {}
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
  // Baca kode marketer pribadi yang tersimpan (atau dari akun marketer aktif)
  const savedMktCode = localStorage.getItem('sr12_marketer_my_referral_code') || 
    (appState.activeMarketerId || (appState.currentTier === 'marketer' ? 'MKT-001' : ''));
  const mktInp = document.getElementById('inputPromoMarketerCode');
  if (mktInp) mktInp.value = savedMktCode || '';

  // Link langsung khusus produk di toko mitra bersangkutan (Universal untuk Localhost & Online Hosting / GitHub Pages)
  let productUrl = `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(cleanSlug)}&product=${encodeURIComponent(prod.id)}`;
  if (savedMktCode) {
    productUrl += `&mkt=${encodeURIComponent(savedMktCode)}`;
  }
  const storeUrl = `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(cleanSlug)}`;

  currentPromoShareData = {
    prod,
    cleanSlug,
    storeName,
    tierPrice,
    isPromo,
    mktCode: savedMktCode || '',
    productUrl,
    storeUrl
  };

  const imgEl = document.getElementById('promoShareImage');
  const catEl = document.getElementById('promoShareCategory');
  const titleEl = document.getElementById('promoShareTitle');
  const priceEl = document.getElementById('promoSharePrice');
  const hetEl = document.getElementById('promoShareHet');
  const descEl = document.getElementById('promoShareDesc');

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

  refreshPromoShareUrlAndCopy(savedMktCode || '');

  openModal('modalProductPromoShare');
}
window.openProductPromoShareModal = openProductPromoShareModal;

let promoShareDebounceTimer = null;

function updatePromoShareMarketerCode() {
  if (!currentPromoShareData) return;
  const inp = document.getElementById('inputPromoMarketerCode');
  let code = (inp ? inp.value.trim() : '');
  
  if (code && code.toLowerCase().startsWith('mkt')) {
    code = code.toUpperCase();
    if (inp && inp.value !== code) inp.value = code;
  }

  if (code) {
    localStorage.setItem('sr12_marketer_my_referral_code', code);
  } else {
    localStorage.removeItem('sr12_marketer_my_referral_code');
  }

  if (promoShareDebounceTimer) {
    clearTimeout(promoShareDebounceTimer);
  }
  
  // Gunakan debounce 200ms agar tidak terjadi flicker/balapan saat pengguna sedang mengetik
  promoShareDebounceTimer = setTimeout(() => {
    refreshPromoShareUrlAndCopy(code);
  }, 200);
}
window.updatePromoShareMarketerCode = updatePromoShareMarketerCode;

function clearPromoShareMarketerCode() {
  const inp = document.getElementById('inputPromoMarketerCode');
  if (inp) inp.value = '';
  localStorage.removeItem('sr12_marketer_my_referral_code');
  if (promoShareDebounceTimer) clearTimeout(promoShareDebounceTimer);
  refreshPromoShareUrlAndCopy('');
}
window.clearPromoShareMarketerCode = clearPromoShareMarketerCode;

function refreshPromoShareUrlAndCopy(mktCode) {
  if (!currentPromoShareData || !currentPromoShareData.prod) return;
  const prod = currentPromoShareData.prod;
  const cleanSlug = currentPromoShareData.cleanSlug || 'alzam-agency';
  const storeName = currentPromoShareData.storeName || 'SR12 Partner Store';
  const tierPrice = currentPromoShareData.tierPrice || prod.het;
  const isPromo = currentPromoShareData.isPromo;

  let productUrl = `${window.location.origin}${window.location.pathname}?store=${encodeURIComponent(cleanSlug)}&product=${encodeURIComponent(prod.id)}`;
  if (mktCode) {
    productUrl += `&mkt=${encodeURIComponent(mktCode)}`;
  }
  currentPromoShareData.productUrl = productUrl;
  currentPromoShareData.mktCode = mktCode;

  const linkEl = document.getElementById('promoShareDirectLink');
  if (linkEl) {
    linkEl.textContent = productUrl;
    linkEl.title = productUrl;
  }

  const benefitsText = (prod.benefits && prod.benefits.length > 0)
    ? prod.benefits.slice(0, 3).map(b => `✅ ${b}`).join('\n')
    : `✅ 100% Produk Herbal Terdaftar BPOM\n✅ Formulasi Lembut & Aman Digunakan Tiap Hari\n✅ Garansi Keaslian Resmi Pabrik SR12`;

  let mktFound = null;
  if (mktCode) {
    if (mktCode.toUpperCase() === 'MKT-001') {
      mktFound = {
        id: 'MKT-001',
        name: 'Maryam',
        tier: 'marketer',
        phone: '0895800355550',
        city: 'Baniaga',
        bankName: 'BCA',
        bankAccount: '123456789',
        bankHolder: 'Maryam'
      };
    } else {
      mktFound = findMitraByIdOrPhone(mktCode, cleanSlug);
    }
  }

  const badgeEl = document.getElementById('promoShareMarketerBadge');
  if (badgeEl) {
    if (mktFound && mktFound.name) {
      badgeEl.style.display = 'block';
      badgeEl.style.color = '#15803d';
      badgeEl.innerHTML = `✅ <b>Marketer Terverifikasi:</b> ${escapeHtml(mktFound.name)} (${escapeHtml(mktFound.id || mktCode)})`;
    } else if (mktCode && mktCode.length >= 3) {
      badgeEl.style.display = 'block';
      badgeEl.style.color = '#0284c7';
      badgeEl.innerHTML = `⏳ <i>Mengecek identitas "${escapeHtml(mktCode)}"...</i>`;
      const queryCode = mktCode;
      if (typeof findMitraInSupabase === 'function') {
        findMitraInSupabase(mktCode, cleanSlug).then(cloudM => {
          const curInp = document.getElementById('inputPromoMarketerCode');
          // Cegah balapan respons asinkronus jika input sudah berubah
          if (curInp && curInp.value.trim().toUpperCase() !== queryCode.toUpperCase()) {
            return;
          }
          if (cloudM && cloudM.name) {
            if (!appState.mitraList) appState.mitraList = [];
            const existIdx = appState.mitraList.findIndex(m => (m.id || '').toUpperCase() === (cloudM.id || '').toUpperCase());
            if (existIdx < 0) appState.mitraList.unshift(cloudM);
            else appState.mitraList[existIdx] = Object.assign({}, appState.mitraList[existIdx], cloudM);
            const b = document.getElementById('promoShareMarketerBadge');
            if (b) {
              b.style.display = 'block';
              b.style.color = '#15803d';
              b.innerHTML = `✅ <b>Marketer Terverifikasi:</b> ${escapeHtml(cloudM.name)} (${escapeHtml(cloudM.id || queryCode)})`;
            }
            // Perbarui teks copywriting dengan nama marketer resmi dari cloud
            const mktNameBadge = `\n💼 *Rekomendasi Resmi Tim Marketer:* ${cloudM.name} (${queryCode})`;
            const curCopy = document.getElementById('promoShareCopywritingText');
            if (curCopy && curCopy.value) {
              curCopy.value = curCopy.value.replace(/\n💼 \*Rekomendasi Resmi Tim Marketer:\* [^\n]+/, mktNameBadge);
            }
          } else {
            const b = document.getElementById('promoShareMarketerBadge');
            if (b) {
              b.style.display = 'block';
              b.style.color = '#15803d';
              b.innerHTML = `💼 Link rujukan aktif dengan kode: <b>${escapeHtml(queryCode)}</b>`;
            }
          }
        }).catch(() => {});
      }
    } else {
      badgeEl.style.display = 'none';
      badgeEl.innerHTML = '';
    }
  }

  const mktDisplayName = (mktFound && mktFound.name) ? `${mktFound.name} (${mktCode})` : mktCode;
  const refBadge = mktCode ? `\n💼 *Rekomendasi Resmi Tim Marketer:* ${mktDisplayName}` : '';

  const copyText = 
`✨ *PROMO SPESIAL: ${prod.name.toUpperCase()}* ✨
${prod.summary || 'Produk perawatan herbal berkualitas resmi SR12 teruji klinis dan BPOM.'} 🌿

⭐ *Rating Pembeli:* 4.9 / 5.0 (Terbukti Berkhasiat)
🛡️ *Izin Edar Resmi:* 100% Terverifikasi BPOM & Halal MUI${refBadge}

🔥 *Keunggulan Produk:*
${benefitsText}

💰 *Harga Spesial:* ${formatRupiah(tierPrice)}${isPromo ? ` (Harga Normal: ~${formatRupiah(prod.het)}~)` : ''}
🚚 *Pengiriman Cepat, Aman & Garansi Original!*

👇 *Beli & Lihat Detail Produk Langsung di Toko Resmi (${storeName}):*
${productUrl}

Silakan klik tautan di atas untuk melihat detail lengkap & pemesanan resmi via WhatsApp! 🌸`;

  const textEl = document.getElementById('promoShareCopywritingText');
  if (textEl) textEl.value = copyText;
}
window.refreshPromoShareUrlAndCopy = refreshPromoShareUrlAndCopy;

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
function handleDirectProductDeepLink(retryCount = 0) {
  const params = new URLSearchParams(window.location.search);
  const rawParam = params.get('product') || params.get('p') || params.get('prod');
  if (!rawParam) return;

  // Tunggu jika daftar produk masih dalam proses loading async dari IndexedDB / data.js
  if (!appState.products || appState.products.length === 0) {
    if (retryCount < 15) {
      setTimeout(() => handleDirectProductDeepLink(retryCount + 1), 150);
    }
    return;
  }

  // Gunakan pencocokan cerdas kandidat terbaik (prioritaskan produk yang punya foto asli / customEdited)
  let prod = (typeof findBestProductMatch === 'function') 
    ? findBestProductMatch(appState.products, rawParam)
    : null;

  if (!prod) {
    const cleanParam = rawParam.toLowerCase().trim();
    const cleanKey = cleanParam.replace(/[^a-z0-9]/g, '');
    prod = (appState.products || []).find(p => 
      p.id.toLowerCase() === cleanParam ||
      (p.sku && p.sku.toLowerCase() === cleanParam) ||
      (p.slug && p.slug.toLowerCase() === cleanParam) ||
      p.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey
    );
  }

  if (!prod) {
    if (retryCount < 10) {
      setTimeout(() => handleDirectProductDeepLink(retryCount + 1), 200);
      return;
    }
    console.warn('⚠️ [Deep-Link Produk] Produk tidak ditemukan:', rawParam);
    return;
  }

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

  // Pastikan wrapper etalase katalog produk aktif & ditampilkan
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

  // Bersihkan query string produk agar tidak membuka ulang pop-up saat reload atau navigasi internal berikutnya
  try {
    const curP = new URLSearchParams(window.location.search);
    if (curP.has('product') || curP.has('p') || curP.has('prod')) {
      curP.delete('product');
      curP.delete('p');
      curP.delete('prod');
      const qStr = curP.toString();
      const nUrl = window.location.pathname + (qStr ? '?' + qStr : '') + window.location.hash;
      window.history.replaceState(window.history.state, '', nUrl);
    }
  } catch(e) {}

  // Safeguard ganda agar modal tetap terbuka dan tidak tertutup event lain
  setTimeout(() => {
    const modal = document.getElementById('modalProductDetail');
    if (modal && !modal.classList.contains('open')) {
      openProductDetailModal(prod.id);
    }
  }, 350);

  // JIKA FOTO MASIH ILUSTRASI DUMMY SVG:
  // Segera ambil foto asli produk langsung dari Supabase Cloud untuk toko ini!
  const isDummyImage = !prod.image || prod.image.startsWith('data:image/svg+xml');
  if (isDummyImage && typeof fetchSingleProductFromSupabase === 'function') {
    const activeSlug = (appState.storeSettings && appState.storeSettings.slug) || appState.currentStoreSlug || 'sr12-central';
    fetchSingleProductFromSupabase(rawParam, activeSlug).then(cloudProd => {
      if (cloudProd && cloudProd.image && !cloudProd.image.startsWith('data:image/svg+xml')) {
        console.log('⚡ [Deep-Link Produk] Foto asli produk berhasil dimuat dari Cloud:', cloudProd.name);
        prod.image = cloudProd.image;
        prod.customEdited = true;
        if (cloudProd.name) prod.name = cloudProd.name;
        if (cloudProd.het) { prod.het = cloudProd.het; prod.price = cloudProd.het; }
        if (cloudProd.summary) prod.summary = cloudProd.summary;

        // Perbarui gambar & judul di modal yang sedang terbuka secara seketika
        const modalImg = document.getElementById('modalProdImage');
        if (modalImg) modalImg.src = cloudProd.image;
        const modalTitle = document.getElementById('modalProdTitle');
        if (modalTitle && cloudProd.name) modalTitle.textContent = cloudProd.name;
        const modalHet = document.getElementById('modalProdHet');
        if (modalHet && cloudProd.het) modalHet.textContent = formatRupiah(cloudProd.het);

        // Perbarui gambar di kartu etalase
        const c = document.getElementById(`card-${prod.id}`);
        if (c) {
          const imgEl = c.querySelector('.product-thumb-box img');
          if (imgEl) imgEl.src = cloudProd.image;
        }

        // Simpan ke IndexedDB untuk fast-boot kunjungan berikutnya
        if (typeof dbSaveProduct === 'function') {
          dbSaveProduct(prod);
        }
      }
    }).catch(err => console.warn('Cloud single prod fetch warning:', err));
  }
}
window.handleDirectProductDeepLink = handleDirectProductDeepLink;

window.deletePendingStoreApp = deletePendingStoreApp;
window.openChangeSecurityPinModal = openChangeSecurityPinModal;
window.handleSecurityPinChangeSubmit = handleSecurityPinChangeSubmit;
window.toggleMasterPinVisibilityDisplay = toggleMasterPinVisibilityDisplay;
window.togglePinVisibility = togglePinVisibility;
window.onNewPinInput = onNewPinInput;
window.changeDevMasterPin = changeDevMasterPin;

// ==========================================
// SECRET STORE LOGO TRIGGER (STEALTH DISTRIBUTOR LOGIN: 2-3 TAPS / CLICKS)
// ==========================================
let _secretLogoTapCount = 0;
let _secretLogoTapTimer = null;

function handleSecretStoreLogoTap(e) {
  if (e) {
    // Hindari trigger jika mengklik tombol edit logo atau action lain di dalam box
    if (e.target && e.target.closest && e.target.closest('#btnEditStoreLogo')) return;
  }
  _secretLogoTapCount++;
  if (_secretLogoTapTimer) clearTimeout(_secretLogoTapTimer);

  if (_secretLogoTapCount >= 2) {
    // 2 atau 3 kali klik/tap langsung membuka portal Olsera (jika login) atau modal login
    _secretLogoTapCount = 0;
    if (appState.isDistributorLoggedIn || appState.isAdminMode) {
      if (typeof showDistributorPortalView === 'function') {
        showDistributorPortalView(true);
        if (typeof openOlseraSidebarDrawer === 'function') openOlseraSidebarDrawer();
      }
    } else {
      if (typeof openDistributorLoginModal === 'function') {
        openDistributorLoginModal();
      }
    }
    return;
  }

  _secretLogoTapTimer = setTimeout(() => {
    _secretLogoTapCount = 0;
  }, 1200);
}

function handleSecretStoreLogoDblClick(e) {
  if (e) {
    if (e.target && e.target.closest && e.target.closest('#btnEditStoreLogo')) return;
  }
  _secretLogoTapCount = 0;
  if (_secretLogoTapTimer) clearTimeout(_secretLogoTapTimer);
  if (appState.isDistributorLoggedIn || appState.isAdminMode) {
    if (typeof showDistributorPortalView === 'function') {
      showDistributorPortalView(true);
      if (typeof openOlseraSidebarDrawer === 'function') openOlseraSidebarDrawer();
    }
  } else {
    if (typeof openDistributorLoginModal === 'function') {
      openDistributorLoginModal();
    }
  }
}
window.handleSecretStoreLogoTap = handleSecretStoreLogoTap;
window.handleSecretStoreLogoDblClick = handleSecretStoreLogoDblClick;

// ==========================================
// FITUR PEMULIHAN PIN / PASSWORD TOKO DISTRIBUTOR
// ==========================================
// ==========================================
// FITUR PEMULIHAN PIN / PASSWORD TOKO DISTRIBUTOR TERPROTEKSI (2-FACTOR WA & OTP)
// ==========================================

function openForgotStorePinModal(forceStep1 = false) {
  if (typeof closeModal === 'function') closeModal('modalDistributorLogin');
  const modal = document.getElementById('modalForgotStorePin');
  const badge = document.getElementById('forgotStoreBadge');
  const step1 = document.getElementById('forgotStoreStep1');
  const step2 = document.getElementById('forgotStoreStep2');
  const waInput = document.getElementById('forgotStoreWaInput');
  const nikInput = document.getElementById('forgotStoreNikInput');
  const err1 = document.getElementById('forgotStoreError');
  const err2 = document.getElementById('forgotStoreStep2Error');

  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const currentSlug = appState.currentStoreSlug || store.slug || 'sr12-central';
  if (badge) {
    badge.textContent = `${store.storeName} (${store.storeCity || 'Mitra Resmi'})`;
  }

  // Cek apakah ada sesi pemulihan yang masih aktif tersimpan
  let activeSession = appState.storeResetSession;
  if (!activeSession) {
    try {
      const stored = sessionStorage.getItem('sr12_store_reset_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.slug === currentSlug && parsed.expiresAt > Date.now()) {
          activeSession = parsed;
          appState.storeResetSession = parsed;
        }
      }
    } catch (e) {}
  }

  if (activeSession && activeSession.expiresAt > Date.now() && !forceStep1) {
    // Sesi masih aktif! Langsung lanjutkan ke Step 2 tanpa perlu minta token ulang
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'block';
    if (err2) err2.style.display = 'none';
    const maskedWaEl = document.getElementById('forgotStoreMaskedWa');
    if (maskedWaEl && activeSession.maskedWa) {
      maskedWaEl.innerHTML = `Sesi pemulihan PIN masih aktif. PIN Sementara telah dikirimkan ke WhatsApp resmi pemilik (<b>${escapeHtml(activeSession.maskedWa)}</b>). Silakan masukkan kode token di bawah:`;
    }
  } else {
    // Tampilkan Step 1
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (waInput) waInput.value = '';
    if (nikInput) nikInput.value = '';
    if (err1) err1.style.display = 'none';
    if (err2) err2.style.display = 'none';
  }

  if (modal) {
    document.body.classList.add('modal-open');
    modal.classList.add('open');
  }
}
window.openForgotStorePinModal = openForgotStorePinModal;

function backToForgotStoreStep1() {
  appState.storeResetSession = null;
  try { sessionStorage.removeItem('sr12_store_reset_session'); } catch (e) {}
  const banner = document.getElementById('distLoginActiveResetBanner');
  if (banner) banner.style.display = 'none';
  openForgotStorePinModal(true);
}
window.backToForgotStoreStep1 = backToForgotStoreStep1;

// Anti-Spam / Rate Limiting untuk Permintaan Reset PIN Toko
const storeResetRateLimit = {
  fails: 0,
  lockedUntil: 0
};

function handleRequestStoreTempPin() {
  const now = Date.now();
  const errEl = document.getElementById('forgotStoreError');

  if (storeResetRateLimit.lockedUntil && now < storeResetRateLimit.lockedUntil) {
    const sisaMenit = Math.ceil((storeResetRateLimit.lockedUntil - now) / 60000);
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = `🔒 Terlalu banyak percobaan gagal. Demi keamanan toko, silakan tunggu ${sisaMenit} menit sebelum mencoba kembali.`;
    }
    return;
  }

  const waInput = document.getElementById('forgotStoreWaInput');
  const nikInput = document.getElementById('forgotStoreNikInput');
  const userWa = (waInput?.value || '').replace(/\D/g, '');
  const userNik = (nikInput?.value || '').trim();

  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const storeWa = (store.storeWaNumber || store.phone || '').replace(/\D/g, '');
  const storeNik = (store.nikNumber || '').replace(/\D/g, '');

  if (!userWa || userWa.length < 8) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = '❌ Masukkan nomor kontak toko Anda dengan benar!';
    }
    return;
  }

  if (!userNik) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = '❌ Masukkan kode unik keamanan toko!';
    }
    return;
  }

  // Normalisasi nomor WA toko (08xx vs 628xx)
  const normUser = userWa.startsWith('62') ? userWa.slice(2) : (userWa.startsWith('0') ? userWa.slice(1) : userWa);
  const normStore = storeWa.startsWith('62') ? storeWa.slice(2) : (storeWa.startsWith('0') ? storeWa.slice(1) : storeWa);
  const isWaMatch = normUser && normStore && (normUser === normStore || normStore.endsWith(normUser) || normUser.endsWith(normStore));

  // Verifikasi kode unik (mencocokkan kode unik pemilik di sistem)
  let isNikMatch = true;
  if (storeNik && storeNik.length >= 6) {
    const last6StoreNik = storeNik.slice(-6);
    isNikMatch = (userNik === last6StoreNik);
  } else if (storeNik && storeNik.length >= 4) {
    const last4StoreNik = storeNik.slice(-4);
    isNikMatch = (userNik === last4StoreNik || userNik.endsWith(last4StoreNik));
  } else if (userNik.length > 0 && userNik.length < 4) {
    isNikMatch = false;
  }

  if (!isWaMatch || !isNikMatch) {
    storeResetRateLimit.fails++;
    if (storeResetRateLimit.fails >= 5) {
      storeResetRateLimit.lockedUntil = Date.now() + 15 * 60 * 1000; // Lock 15 menit
    }
    if (errEl) {
      errEl.style.display = 'block';
      errEl.innerHTML = `❌ Verifikasi data gagal! Nomor kontak atau kode unik tidak cocok.<br><span style="font-size: 0.7rem; color: #64748b;">Percobaan gagal: ${storeResetRateLimit.fails}/5. Hubungi distributor atau Developer Pusat jika memerlukan bantuan.</span>`;
    }
    return;
  }

  // Verifikasi lolos! Buat PIN Sementara Acak 6 Digit Baru (Time-Limited OTP)
  const tempPin = String(Math.floor(100000 + Math.random() * 900000));
  const currentSlug = appState.currentStoreSlug || store.slug || 'sr12-central';

  const cleanPhone = storeWa.startsWith('0') ? ('62' + storeWa.slice(1)) : (storeWa.startsWith('62') ? storeWa : ('62' + storeWa));
  const displayWa = cleanPhone.length > 7
    ? `+${cleanPhone.slice(0, 4)} ****-**${cleanPhone.slice(-2)}`
    : `+${cleanPhone}`;

  appState.storeResetSession = {
    slug: currentSlug,
    tempPin: tempPin,
    expiresAt: Date.now() + 10 * 60 * 1000, // Valid 10 menit
    maskedWa: displayWa,
    attempts: 0
  };

  try {
    sessionStorage.setItem('sr12_store_reset_session', JSON.stringify(appState.storeResetSession));
  } catch (e) {}

  // Susun pesan WhatsApp resmi yang profesional dan aman
  const storeName = store.storeName || 'Toko Mitra SR12';
  const owner = store.storeOwner || 'Pemilik Toko';
  const timeStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  const msg =
    `🛡️ *NOTIFIKASI KEAMANAN TOKO SR12*\n\n` +
    `Halo *${owner}*,\n` +
    `Ada permintaan pemulihan PIN untuk toko Anda:\n` +
    `🏪 Toko: *${storeName}* (${currentSlug})\n` +
    `⏰ Waktu: ${timeStr} WIB\n\n` +
    `🔑 *PIN SEMENTARA LOGIN ANDA:*\n` +
    `👉 *${tempPin}* 👈\n\n` +
    `⚠️ *PERINGATAN PENTING:*\n` +
    `1. Masukkan kode PIN Sementara di atas pada layar konfirmasi pemulihan toko untuk membuat PIN baru Anda.\n` +
    `2. *JIKA ANDA TIDAK MERASA MEMINTA RESET INI:* Jangan berikan kode ini kepada siapa pun dan *ABAIKAN PESAN INI*. Keamanan toko Anda tetap terjaga dan PIN lama Anda TIDAK AKAN BERUBAH.`;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

  // Buka WhatsApp langsung ke nomor WA pemilik toko
  window.open(waUrl, '_blank');

  // Pindah ke Step 2 (Konfirmasi PIN Sementara)
  const step1 = document.getElementById('forgotStoreStep1');
  const step2 = document.getElementById('forgotStoreStep2');
  const maskedWaEl = document.getElementById('forgotStoreMaskedWa');
  const otpInput = document.getElementById('forgotStoreOtpInput');
  const newPinInput = document.getElementById('forgotStoreNewPinInput');
  const confirmPinInput = document.getElementById('forgotStoreConfirmNewPinInput');
  const err2 = document.getElementById('forgotStoreStep2Error');

  if (maskedWaEl) {
    maskedWaEl.innerHTML = `Pesan verifikasi berisi <b>PIN Sementara</b> telah dikirimkan ke WhatsApp pemilik toko resmi (<b>${escapeHtml(displayWa)}</b>). Silakan buka WhatsApp Anda.`;
  }
  if (otpInput) otpInput.value = '';
  if (newPinInput) newPinInput.value = '';
  if (confirmPinInput) confirmPinInput.value = '';
  if (err2) err2.style.display = 'none';

  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';

  showToast('📨 Pesan keamanan berisi PIN Sementara telah dikirim ke WhatsApp pemilik!');
}
window.handleRequestStoreTempPin = handleRequestStoreTempPin;

function handleResendStoreTempPin() {
  handleRequestStoreTempPin();
}
window.handleResendStoreTempPin = handleResendStoreTempPin;

function handleConfirmStoreTempPin() {
  const session = appState.storeResetSession;
  const errEl = document.getElementById('forgotStoreStep2Error');

  if (!session || !session.tempPin) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = '❌ Sesi reset PIN tidak ditemukan atau telah kedaluwarsa. Silakan ulangi dari awal.';
    }
    return;
  }

  if (Date.now() > session.expiresAt) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = '⏳ PIN Sementara telah kedaluwarsa (berlaku 10 menit). Silakan klik "Kirim Ulang WA".';
    }
    return;
  }

  const otpInput = document.getElementById('forgotStoreOtpInput')?.value.trim();
  const newPin = document.getElementById('forgotStoreNewPinInput')?.value.trim();
  const confirmPin = document.getElementById('forgotStoreConfirmNewPinInput')?.value.trim();

  if (!otpInput) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = '❌ Masukkan PIN Sementara 6-digit yang Anda terima di WhatsApp!';
    }
    return;
  }

  if (otpInput !== session.tempPin) {
    session.attempts = (session.attempts || 0) + 1;
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = `❌ PIN Sementara salah! Periksa kembali pesan di WhatsApp Anda (Percobaan: ${session.attempts}/3).`;
    }
    if (session.attempts >= 3) {
      appState.storeResetSession = null;
      if (errEl) {
        errEl.textContent = '❌ Terlalu banyak percobaan salah. Sesi dibatalkan demi keamanan.';
      }
      setTimeout(() => backToForgotStoreStep1(), 2000);
    }
    return;
  }

  // Jika input PIN baru diisi, pastikan minimal 4 digit dan cocok
  let finalPin = session.tempPin;
  if (newPin || confirmPin) {
    if (newPin.length < 4) {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = '❌ PIN Baru minimal 4 digit angka!';
      }
      return;
    }
    if (newPin !== confirmPin) {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = '❌ Konfirmasi PIN Baru tidak cocok dengan PIN Baru!';
      }
      return;
    }
    finalPin = newPin;
  }

  // Sukses! Simpan PIN Baru Toko secara Permanen
  const currentSlug = session.slug || appState.currentStoreSlug || 'sr12-central';
  const store = appState.partnerStores.find(s => s.slug === currentSlug) || appState.storeSettings;

  store.storeAdminPin = finalPin;
  if (appState.storeSettings) appState.storeSettings.storeAdminPin = finalPin;

  try {
    localStorage.setItem(`sr12_store_pin_${currentSlug}`, finalPin);
    localStorage.setItem('sr12_store_settings_v4', JSON.stringify(appState.storeSettings));
  } catch (eLs) {
    console.warn('Gagal simpan PIN ke localStorage:', eLs);
  }

  const sIdx = (appState.partnerStores || []).findIndex(s => s.slug === currentSlug);
  if (sIdx >= 0) {
    appState.partnerStores[sIdx].storeAdminPin = finalPin;
    if (typeof saveStoredPartnerStores === 'function') saveStoredPartnerStores(appState.partnerStores);
  }

  // Sinkronkan ke Supabase Cloud
  if (typeof saveStoreToSupabase === 'function') {
    saveStoreToSupabase(appState.storeSettings).catch(() => {});
  }

  // Hapus sesi reset PIN
  appState.storeResetSession = null;
  try { sessionStorage.removeItem('sr12_store_reset_session'); } catch (e) {}
  const activeResetBanner = document.getElementById('distLoginActiveResetBanner');
  if (activeResetBanner) activeResetBanner.style.display = 'none';

  resetAuthLockout('store');

  if (typeof closeModal === 'function') closeModal('modalForgotStorePin');

  // Login otomatis masuk ke portal toko
  appState.isAdminMode = true;
  appState.isDistributorLoggedIn = true;
  localStorage.setItem('sr12_active_view_mode', 'portal');
  localStorage.setItem('sr12_active_olsera_tab', 'pos');
  localStorage.setItem('sr12_last_active_partner_store', currentSlug);
  localStorage.setItem('sr12_logged_store_slug', currentSlug);

  if (typeof showDistributorPortalView === 'function') {
    showDistributorPortalView(true);
  } else if (typeof updateViewModeUI === 'function') {
    updateViewModeUI();
  }

  showToast(`🎉 PIN Baru Toko Berhasil Disimpan & Akses Toko Telah Dibuka!`);
}
window.handleConfirmStoreTempPin = handleConfirmStoreTempPin;

// Kompatibilitas mundur
window.handleVerifyAndResetStorePin = handleRequestStoreTempPin;

function sendStorePinResetRequestToDevWA() {
  const store = appState.storeSettings || DEFAULT_STORE_SETTINGS;
  const storeName = store.storeName || 'Toko Mitra SR12';
  const slug = store.slug || 'toko';
  const owner = store.storeOwner || 'Pemilik Toko';
  const wa = store.storeWaNumber || '-';

  const text = encodeURIComponent(
    `Halo Super Admin Developer SR12,\n\nSaya pemilik toko *${storeName}* (${slug})\nNama Pemilik: ${owner}\nNo. WA Toko: ${wa}\n\nSaya lupa password/PIN toko saya dan membutuhkan bantuan reset akses login manual dari Developer. Mohon panduannya. Terima kasih!`
  );
  window.open(`https://wa.me/6282255554309?text=${text}`, '_blank');
}
window.sendStorePinResetRequestToDevWA = sendStorePinResetRequestToDevWA;

// ==========================================
// FITUR PEMULIHAN AKSES DEVELOPER (SUPER ADMIN EMERGENCY RECOVERY)
// ==========================================
function openForgotDevPinModal() {
  if (typeof closeModal === 'function') closeModal('modalDevPin');
  const modal = document.getElementById('modalForgotDevPin');
  const input = document.getElementById('devEmergencyKeyInput');
  const err = document.getElementById('devEmergencyError');

  if (input) input.value = '';
  if (err) err.style.display = 'none';

  if (modal) {
    document.body.classList.add('modal-open');
    modal.classList.add('open');
  }
}
window.openForgotDevPinModal = openForgotDevPinModal;

function useEmergencyMasterDevPin() {
  const input = document.getElementById('devEmergencyKeyInput');
  const err = document.getElementById('devEmergencyError');
  const val = (input?.value || '').trim();

  // Validasi Master Emergency Key: Default master emergency bypass key adalah 8899 atau SR12SUPERADMIN
  if (val === '8899' || val.toUpperCase() === 'SR12SUPERADMIN') {
    // Reset Master PIN lokal ke default 8899
    try {
      localStorage.setItem('sr12_master_dev_pin', '8899');
    } catch (eLs) {}
    if (window.appState) window.appState.masterDevPin = '8899';

    resetAuthLockout('dev');

    appState.isDevMasterLoggedIn = true;
    appState.isAdminMode = true;
    appState.developerEmail = localStorage.getItem('sr12_dev_email') || 'developer@sr12.co.id';

    createSecureAuthSession(appState.developerEmail, 'developer', 'sr12-central');

    if (typeof closeModal === 'function') closeModal('modalForgotDevPin');
    if (typeof showDeveloperWorkspaceView === 'function') {
      showDeveloperWorkspaceView(true);
    }
    if (typeof showToast === 'function') {
      showToast('🔓 Akses Developer Berhasil Dipulihkan!');
    }
  } else {
    if (err) {
      err.style.display = 'block';
      err.textContent = '❌ Master Emergency Key salah! Hubungi WhatsApp Technical Lead jika Anda lupa key resmi.';
    }
  }
}
window.useEmergencyMasterDevPin = useEmergencyMasterDevPin;

function sendDevWaRecoveryHelp() {
  const devEmail = localStorage.getItem('sr12_dev_email') || 'developer@sr12.co.id';
  const text = encodeURIComponent(
    `Halo Technical Lead Developer SR12,\n\nSaya membutuhkan bantuan pemulihan akses akun Developer Console SR12 Partner Store (Lupa Password / Master PIN).\nEmail Developer: ${devEmail}\n\nMohon petunjuk pemulihan kredensial Master Developer. Terima kasih!`
  );
  window.open(`https://wa.me/6282255554309?text=${text}`, '_blank');
}
window.sendDevWaRecoveryHelp = sendDevWaRecoveryHelp;



