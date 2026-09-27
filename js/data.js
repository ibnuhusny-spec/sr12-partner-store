/**
 * SR12 PARTNER STORE - MASTER DATA & DATABASE (V3 DISTINCT VISUALS)
 * Ekosistem Resmi Kemitraan SR12 Herbal Skin Care
 */

const SR12_TIERS = {
  konsumen: {
    id: 'konsumen',
    name: 'Konsumen Retail',
    label: 'Konsumen Umum',
    discountPct: 0,
    minOrderNominal: 0,
    minOrderPcs: 1,
    badgeColor: '#64748b',
    description: 'Harga Eceran Tertinggi (HET) resmi konsumen'
  },
  marketer: {
    id: 'marketer',
    name: 'Mitra Marketer',
    label: 'Marketer (15%)',
    discountPct: 15,
    minOrderNominal: 0,
    minOrderPcs: 1,
    badgeColor: '#0284c7',
    description: 'Bisa jualan tanpa modal, margin komisi 15%'
  },
  reseller: {
    id: 'reseller',
    name: 'Reseller Resmi',
    label: 'Reseller (20%)',
    discountPct: 20,
    minOrderNominal: 300000,
    minOrderPcs: 3,
    badgeColor: '#10b981',
    description: 'Margin 20%, minimal belanja awal Rp 300.000 / 3 pcs'
  },
  sub_agen: {
    id: 'sub_agen',
    name: 'Sub Agen SR12',
    label: 'Sub Agen (30%)',
    discountPct: 30,
    minOrderNominal: 1500000,
    minOrderPcs: 15,
    badgeColor: '#8b5cf6',
    description: 'Margin 30%, minimal order Rp 1.500.000 / 15 pcs'
  },
  agen: {
    id: 'agen',
    name: 'Agen Resmi SR12',
    label: 'Agen (40%)',
    discountPct: 40,
    minOrderNominal: 5000000,
    minOrderPcs: 50,
    badgeColor: '#f59e0b',
    description: 'Margin 40%, minimal order kartonan / Rp 5.000.000'
  },
  distributor: {
    id: 'distributor',
    name: 'Distributor Utama',
    label: 'Distributor (50%)',
    discountPct: 50,
    minOrderNominal: 15000000,
    minOrderPcs: 150,
    badgeColor: '#dc2626',
    description: 'Margin maksimal 50%, pemegang stok wilayah besar'
  }
};

// Helper SVG Generator for distinct realistic herbal cosmetics products
function makeProductIllustration(theme, icon, label, sub) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g_${theme}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme === 'green' ? '#064e3b' : theme === 'gold' ? '#78350f' : theme === 'blue' ? '#0c4a6e' : theme === 'purple' ? '#581c87' : theme === 'rose' ? '#831843' : '#14532d'}"/>
        <stop offset="100%" stop-color="${theme === 'green' ? '#047857' : theme === 'gold' ? '#d97706' : theme === 'blue' ? '#0284c7' : theme === 'purple' ? '#9333ea' : theme === 'rose' ? '#db2777' : '#16a34a'}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g_${theme})"/>
    <circle cx="200" cy="120" r="75" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <text x="200" y="140" font-size="64" text-anchor="middle" dominant-baseline="middle">${icon}</text>
    <rect x="50" y="210" width="300" height="60" rx="10" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.2)"/>
    <text x="200" y="235" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="bold" font-size="16" fill="#ffffff" text-anchor="middle">${label}</text>
    <text x="200" y="255" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" fill="#fde68a" text-anchor="middle">${sub}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Database Master Produk Resmi SR12 (Dengan visual khusus yang berbeda)
const DEFAULT_SR12_PRODUCTS = [
  {
    id: 'SR12-DEO-60',
    name: 'SR12 Deodorant Spray Herbal (60ml)',
    category: 'Body Care',
    sku: 'SR12-DEO-60',
    bpom: 'NA18200900002',
    halal: 'MUI-00150084520917',
    image: 'assets/deodorant-spray.jpg',
    het: 40000,
    weightGram: 80,
    stock: 250,
    isBestseller: true,
    rating: 4.9,
    soldCount: 3820,
    summary: 'Deodorant herbal alami berbahan dasar tawas & air suling murni.',
    benefits: [
      'Mencegah dan menghilangkan bau badan hingga 24 jam nonstop',
      'Mencerahkan area ketiak yang menghitam tanpa rasa perih',
      'Tidak meninggalkan noda kuning di pakaian',
      'Aman untuk ibu hamil, menyusui, dan anak-anak'
    ],
    howToUse: 'Semprotkan 2-3 kali ke ketiak setelah mandi. Tunggu sesaat hingga meresap.'
  },
  {
    id: 'SR12-LIP-01',
    name: 'SR12 Lip Care Natural (Cherry Pink)',
    category: 'Face Care',
    sku: 'SR12-LIP-01',
    bpom: 'NA18191305977',
    halal: 'MUI-00150084520917',
    image: 'assets/deodorant-spray.jpg',
    het: 25000,
    weightGram: 30,
    stock: 180,
    isBestseller: true,
    rating: 4.8,
    soldCount: 2940,
    summary: 'Pelembab bibir alami dengan petroleum jelly murni, madu, dan VCO.',
    benefits: [
      'Mengatasi bibir kering, pecah-pecah, dan berdarah',
      'Mengembalikan rona bibir merah muda alami secara bertahap',
      'Bisa dipakai sebagai dasar sebelum lipstik'
    ],
    howToUse: 'Oleskan merata pada bibir setiap pagi dan malam sebelum tidur.'
  },
  {
    id: 'SR12-GOMILK-ORI',
    name: 'SR12 GoMilku Susu Kambing Etawa Premium (200g)',
    category: 'Nutrisi & Susu',
    sku: 'SR12-GOMILK-ORI',
    bpom: 'MD803112003254',
    halal: 'MUI-00120108351120',
    image: makeProductIllustration('blue', '🥛', 'SR12 GOMILKU ETAWA', 'Susu Kambing + Daun Kelor & Ikan Gabus'),
    het: 52500,
    weightGram: 250,
    stock: 310,
    isBestseller: true,
    rating: 5.0,
    soldCount: 5200,
    summary: 'Susu kambing etawa murni dipadu daun kelor, ikan gabus, dan madu.',
    benefits: [
      'Menyehatkan lambung dan meredakan maag / asam lambung',
      'Memperkuat kepadatan tulang dan persendian',
      'Rasa nikmat gurih, sama sekali tidak bau prengus'
    ],
    howToUse: 'Seduh 2 sendok makan GoMilku ke dalam 150ml air hangat. Minum 2 kali sehari.'
  },
  {
    id: 'SR12-MJK-01',
    name: 'SR12 Manjakani Kapsul Herbal (60 Kapsul)',
    category: 'Herbal & Kesehatan',
    sku: 'SR12-MJK-01',
    bpom: 'TR183311871',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('purple', '🌸', 'SR12 MANJAKANI HERBAL', 'Ekstrak Buah Manjakani Persia Murni'),
    het: 70000,
    weightGram: 100,
    stock: 120,
    isBestseller: true,
    rating: 5.0,
    soldCount: 4500,
    summary: 'Ekstrak buah manjakani Persia kualitas premium grade A.',
    benefits: [
      'Mengatasi keputihan abnormal, bau tidak sedap, dan gatal',
      'Merapatkan dan mengencangkan otot kewanitaan',
      'Melancarkan siklus haid dan meredakan nyeri menstruasi'
    ],
    howToUse: 'Minum 1-2 kapsul setiap malam sebelum tidur.'
  },
  {
    id: 'SR12-SLM-01',
    name: 'SR12 Salimah Slim Pelangsing Herbal (60 Kapsul)',
    category: 'Herbal & Kesehatan',
    sku: 'SR12-SLM-01',
    bpom: 'TR163396331',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('green', '🍃', 'SR12 SALIMAH SLIM', 'Peluruh Lemak Rimpang Kunyit & Jati Belanda'),
    het: 60000,
    weightGram: 90,
    stock: 150,
    isBestseller: true,
    rating: 4.9,
    soldCount: 3100,
    summary: 'Kombinasi rimpang kunyit dan daun jati belanda peluruh lemak jahat.',
    benefits: [
      'Membantu menurunkan berat badan secara alami dan sehat',
      'Melancarkan buang air besar tanpa rasa mulas berlebihan',
      'Membakar tumpukan lemak perut, paha, dan lengan'
    ],
    howToUse: 'Minum 3 x 3 kapsul sehari, 1 jam setelah makan.'
  },
  {
    id: 'SR12-VCO-100',
    name: 'SR12 Virgin Coconut Oil (VCO) Cold Pressed 100ml',
    category: 'Herbal & Kesehatan',
    sku: 'SR12-VCO-100',
    bpom: 'TR173606151',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('gold', '🥥', 'SR12 VCO COLD PRESSED', 'Minyak Kelapa Murni Ekstraksi Dingin'),
    het: 43000,
    weightGram: 120,
    stock: 95,
    isBestseller: true,
    rating: 4.9,
    soldCount: 1980,
    summary: 'Minyak kelapa murni fermentasi dingin tanpa pemanasan kimiawi.',
    benefits: [
      'Meningkatkan daya tahan tubuh & imunitas keluarga',
      'Pelembab alami kulit kering, bibir, dan vitamin rambut',
      'Dapat dikonsumsi langsung sebagai asupan MPASI sehat batita'
    ],
    howToUse: 'Dewasa: 1-2 sendok makan per hari. Anak-anak: 1 sendok teh.'
  },
  {
    id: 'SR12-KRASNY-DAY',
    name: 'SR12 Krasny Day Cream Herbal Markisa (20g)',
    category: 'Face Care',
    sku: 'SR12-KRASNY-DAY',
    bpom: 'NA18130101711',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('rose', '✨', 'SR12 KRASNY DAY CREAM', 'Minyak Biji Markisa + SPF Herbal'),
    het: 60000,
    weightGram: 50,
    stock: 85,
    isBestseller: false,
    rating: 4.8,
    soldCount: 1250,
    summary: 'Krim siang herbal dengan ekstrak minyak biji markisa & tabir surya alami.',
    benefits: [
      'Mencerahkan wajah secara bertahap dan melembutkan kulit',
      'Melindungi dari sinar matahari dan polusi',
      'Mengurangi kerutan halus tanda penuaan dini'
    ],
    howToUse: 'Oleskan merata pada wajah yang telah dibersihkan setiap pagi hari.'
  },
  {
    id: 'SR12-ACNE-TOTOL',
    name: 'SR12 Acne Totol Treatment (10g)',
    category: 'Face Care',
    sku: 'SR12-ACNE-TOTOL',
    bpom: 'NA18200101112',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('green', '🌱', 'SR12 ACNE TOTOL', 'Tea Tree Oil & Salicylic Acid Treatment'),
    het: 58000,
    weightGram: 25,
    stock: 140,
    isBestseller: true,
    rating: 4.9,
    soldCount: 2600,
    summary: 'Obat totol jerawat herbal dengan tea tree oil dan salicylic acid.',
    benefits: [
      'Mengempiskan jerawat meradang dan jerawat batu dalam 1-3 hari',
      'Membunuh bakteri penyebab jerawat',
      'Mencegah timbulnya noda bekas jerawat hitam'
    ],
    howToUse: 'Totolkan secukupnya hanya pada area yang berjerawat pada malam hari.'
  },
  {
    id: 'SR12-BLS-SOAP',
    name: 'SR12 Sabun Bulus Herbal Facial & Body Soap',
    category: 'Sabun Herbal',
    sku: 'SR12-BLS-SOAP',
    bpom: 'NA18170500214',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('gold', '🧼', 'SR12 SABUN BULUS', 'Minyak Bulus Murni + Aroma Melati'),
    het: 25000,
    weightGram: 60,
    stock: 210,
    isBestseller: false,
    rating: 4.8,
    soldCount: 2200,
    summary: 'Sabun herbal dengan kandungan minyak bulus murni beraroma melati segar.',
    benefits: [
      'Mengencangkan dan menghaluskan tekstur kulit wajah & tubuh',
      'Membantu memudarkan stretch mark, selulit, dan bekas luka',
      'Mengatasi jerawat punggung dan bruntusan'
    ],
    howToUse: 'Busakan pada telapak tangan, diamkan 1-2 menit pada kulit, lalu bilas bersih.'
  },
  {
    id: 'SR12-RICE-SOAP',
    name: 'SR12 Sabun Beras Herbal (Rice Soap)',
    category: 'Sabun Herbal',
    sku: 'SR12-RICE-SOAP',
    bpom: 'NA18160500687',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('green', '🌾', 'SR12 RICE SOAP', 'Ekstrak Beras Organik Pengontrol Minyak'),
    het: 22000,
    weightGram: 60,
    stock: 175,
    isBestseller: false,
    rating: 4.8,
    soldCount: 1850,
    summary: 'Sabun cuci muka herbal ekstrak beras organik untuk kulit berminyak & jerawat.',
    benefits: [
      'Mengontrol kelebihan minyak di wajah seharian',
      'Mengecilkan pori-pori dan mengurangi komedo',
      'Mencerahkan wajah kusam tanpa membuat kulit kering ketarik'
    ],
    howToUse: 'Gunakan saat mencuci wajah 2 kali sehari pagi dan sore.'
  },
  {
    id: 'SR12-SUN-30',
    name: 'SR12 Sunscreen Lightening SPF 30++',
    category: 'Face Care',
    sku: 'SR12-SUN-30',
    bpom: 'NA18201700201',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('gold', '☀️', 'SR12 SUNSCREEN SPF 30', 'Lightening & Anti UV Sun Protector'),
    het: 68000,
    weightGram: 50,
    stock: 80,
    isBestseller: false,
    rating: 4.8,
    soldCount: 1450,
    summary: 'Tabir surya ringan bebas minyak dengan efek mencerahkan alami.',
    benefits: [
      'Melindungi kulit dari paparan sinar UV A dan UV B penyebab flek',
      'Mencerahkan wajah secara bertahap tanpa efek topeng (*no white cast*)',
      'Formula lembut, tidak menyumbat pori-pori'
    ],
    howToUse: 'Oleskan merata pada wajah dan leher 15 menit sebelum beraktivitas di luar.'
  },
  {
    id: 'SR12-SERUM-GOLD',
    name: 'SR12 Serum Gold Lightening Herbal',
    category: 'Face Care',
    sku: 'SR12-SERUM-GOLD',
    bpom: 'NA18191905882',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('gold', '👑', 'SR12 SERUM GOLD', 'Partikel Emas Murni & Vitamin C'),
    het: 140000,
    weightGram: 50,
    stock: 60,
    isBestseller: true,
    rating: 4.9,
    soldCount: 1780,
    summary: 'Serum anti-aging mewah dengan partikel emas murni, kolagen, dan vitamin C.',
    benefits: [
      'Memudarkan flek hitam menahun dan bekas jerawat bandel',
      'Mengencangkan kulit wajah dan menyamarkan garis halus',
      'Menjadikan kulit wajah glowing berkilau sehat alami'
    ],
    howToUse: 'Teteskan 2-3 tetes pada wajah bersih setiap malam sebelum tidur.'
  },
  {
    id: 'SR12-GOMILK-600',
    name: 'SR12 GoMilku Susu Kambing Etawa Jumbo (600g)',
    category: 'Nutrisi & Susu',
    sku: 'SR12-GOMILK-600',
    bpom: 'MD803112003254',
    halal: 'MUI-00120108351120',
    image: makeProductIllustration('blue', '🥛', 'SR12 GOMILKU 600G', 'Kemasan Jumbo Lebih Hemat 600gr'),
    het: 125000,
    weightGram: 700,
    stock: 140,
    isBestseller: true,
    rating: 5.0,
    soldCount: 3100,
    summary: 'Susu kambing etawa murni kemasan keluarga jumbo 600 gram lebih hemat.',
    benefits: [
      'Menyehatkan lambung dan meredakan maag / asam lambung',
      'Kemasan jumbo hemat untuk konsumsi seluruh anggota keluarga',
      'Rasa nikmat gurih alami, sama sekali tidak bau kambing'
    ],
    howToUse: 'Seduh 2 sendok makan ke dalam 150ml air hangat. Minum 2 kali sehari.'
  },
  {
    id: 'SR12-VCO-250',
    name: 'SR12 Virgin Coconut Oil (VCO) Cold Pressed 250ml',
    category: 'Herbal & Kesehatan',
    sku: 'SR12-VCO-250',
    bpom: 'TR173606151',
    halal: 'MUI-00150084520917',
    image: makeProductIllustration('gold', '🥥', 'SR12 VCO 250ML', 'Minyak Kelapa Murni Dingin 250ml'),
    het: 80000,
    weightGram: 300,
    stock: 90,
    isBestseller: true,
    rating: 4.9,
    soldCount: 1650,
    summary: 'Minyak kelapa murni fermentasi dingin kemasan botol besar 250ml.',
    benefits: [
      'Meningkatkan daya tahan tubuh & imunitas keluarga',
      'Pelembab alami kulit kering, bibir, dan vitamin rambut',
      'Sangat baik untuk asupan sehat sehari-hari'
    ],
    howToUse: 'Dewasa: 1-2 sendok makan per hari. Anak-anak: 1 sendok teh.'
  },
  {
    id: 'SR12-DEO-100',
    name: 'SR12 Deodorant Spray Herbal Jumbo (100ml)',
    category: 'Body Care',
    sku: 'SR12-DEO-100',
    bpom: 'NA18200900002',
    halal: 'MUI-00150084520917',
    image: 'assets/deodorant-spray.jpg',
    het: 60000,
    weightGram: 140,
    stock: 160,
    isBestseller: true,
    rating: 4.9,
    soldCount: 2400,
    summary: 'Deodorant herbal alami tawas murni kemasan besar 100ml tahan 3-4 bulan.',
    benefits: [
      'Mencegah dan menghilangkan bau badan hingga 24 jam nonstop',
      'Mencerahkan area ketiak tanpa perih',
      'Hemat untuk pemakaian hingga 3-4 bulan'
    ],
    howToUse: 'Semprotkan 2-3 kali ke ketiak setelah mandi.'
  }
];

// Whitelist Validasi SR12
const SR12_OFFICIAL_WHITELIST = {
  brandName: 'SR12 Herbal Skin Care',
  allowedPrefixes: ['SR12-', 'SR-'],
  validBPOMPrefixes: ['NA18', 'TR18', 'TR16', 'TR17', 'TR19', 'NA19', 'NA20', 'NA21', 'NA22', 'NA23', 'NA24', 'NA25', 'MD80'],
  knownSKUs: [
    'SR12-DEO-60', 'SR12-DEO-PREM', 'SR12-LIP-01', 'SR12-MJK-01', 'SR12-SLM-01',
    'SR12-BLS-SOAP', 'SR12-BLS-OIL', 'SR12-VCO-100', 'SR12-VCO-250', 'SR12-SUN-30',
    'SR12-COF-MASK', 'SR12-KRASNY-DAY', 'SR12-KRASNY-NIGHT', 'SR12-GOMILK-ORI',
    'SR12-SHAMPOO-APPLE', 'SR12-TONER-CHAMOMILE', 'SR12-ACNE-TOTOL', 'SR12-SERUM-GOLD',
    'SR12-RICE-SOAP'
  ]
};

// Database Reward (Program Resmi Nasional vs Promo Khusus Toko)
const DEFAULT_SR12_REWARDS = [
  {
    id: 'rew-resmi-1',
    scope: 'resmi',
    title: 'Logam Mulia Emas Antam 0.5 Gram (Resmi)',
    requiredPoints: 500,
    category: 'Emas Murni',
    description: 'Program reward resmi PT. SR12 Herbal Perkasa untuk akumulasi poin repeat order mitra.',
    badge: 'Program Resmi SR12 Pusat'
  },
  {
    id: 'rew-resmi-2',
    scope: 'resmi',
    title: 'Logam Mulia Emas Antam 2.0 Gram (Resmi)',
    requiredPoints: 1800,
    category: 'Emas Murni',
    description: 'Reward tahunan resmi untuk pencapaian omzet kemitraan Agen & Distributor.',
    badge: 'Program Resmi SR12 Pusat'
  },
  {
    id: 'rew-resmi-3',
    scope: 'resmi',
    title: 'Paket Ibadah Umrah SR12 Eksekutif 9 Hari',
    requiredPoints: 25000,
    category: 'Grand Prize',
    description: 'Grand Prize Tahunan dari Manajemen Pusat SR12 untuk mitra berprestasi.',
    badge: 'Grand Prize Nasional'
  },
  {
    id: 'rew-toko-1',
    scope: 'toko',
    title: 'Bonus 2 Pcs Lip Care (Promo Gajian Toko)',
    requiredPoints: 50,
    category: 'Promo Toko',
    description: 'Khusus pembelanjaan minggu ini: bonus langsung 2 pcs Lip Care dari Distributor toko ini.',
    badge: 'Promo Khusus Toko Kami'
  },
  {
    id: 'rew-toko-2',
    scope: 'toko',
    title: 'Cashback Belanja Rp 150.000',
    requiredPoints: 150,
    category: 'Cashback Toko',
    description: 'Insentif saldo pembelanjaan tambahan khusus tim reseller internal kami.',
    badge: 'Insentif Internal'
  }
];

// Marketing Kit & Bahan Promosi Siap Share
const DEFAULT_MARKETING_KITS = [
  {
    id: 'mk-1',
    productName: 'SR12 Deodorant Spray Herbal',
    headline: 'Bebas Bau Badan 24 Jam Nonstop!',
    caption: `Bau badan bikin minder pas kumpul sama teman atau keluarga? 🥺\n\nNih rahasia ketiak tetap wangi segar seharian tanpa noda kuning di baju: SR12 Deodorant Spray Herbal! 🍃\n\n✨ 100% bahan alami tawas pilihan\n✨ Mencegah bau badan 24 jam nonstop\n✨ Bantu mencerahkan ketiak\n✨ Sudah BPOM & Halal MUI!\n\nHarga cuma Rp 40.000 tapi awet dipakai 2-3 bulan! Mau order sekarang sebelum kehabisan? Langsung WA ya: [No HP Kamu] 📲`,
    tags: ['#SR12Deodorant', '#SR12HerbalSkinCare', '#BebasBauBadan', '#HalalBPOM']
  },
  {
    id: 'mk-2',
    productName: 'SR12 GoMilku Susu Kambing Etawa',
    headline: 'Asam Lambung & Maag Sembuh Alami',
    caption: `Sering kembung, begah, atau perih ulu hati karena asam lambung naik? 🥛\n\nIkhtiar sehat yuk dengan SR12 GoMilku! Susu kambing etawa premium yang diformulasikan khusus dengan Daun Kelor, Ikan Gabus, dan Madu murni.\n\n🌿 Menetralisir asam lambung & maag\n🌿 Memperkuat sendi dan tulang\n🌿 Rasanya gurih enak, sama sekali TIDAK AMIS/PRENGUS!\n🌿 Cocok untuk anak-anak hingga lansia\n\nYuk sediakan GoMilku untuk kesehatan keluarga tercinta. Chat admin sekarang yuk! 💕`,
    tags: ['#GoMilkuSR12', '#SusuKambingEtawa', '#SolusiMaag', '#HerbalKeluarga']
  },
  {
    id: 'mk-3',
    productName: 'SR12 Manjakani & Herbal Rahasia Wanita',
    headline: 'Solusi Tuntas Keputihan & Masalah Kewanitaan',
    caption: `Bunda sering merasa risih dengan masalah keputihan atau haid yang tidak teratur? 🌸\n\nAlhamdulillah ribuan wanita sudah membuktikan khasiat legendaris Manjakani SR12! Diproses secara higienis dari buah manjakani Persia kualitas nomor satu.\n\n✅ Tuntaskan keputihan & bau tidak sedap\n✅ Merapatkan organ kewanitaan\n✅ Terdaftar resmi BPOM TR183311871\n\nKonsultasi gratis & pemesanan langsung chat ke WhatsApp ya sist! 💌`,
    tags: ['#ManjakaniSR12', '#HerbalKewanitaan', '#SR12Herbal', '#RahasiaWanita']
  },
  {
    id: 'mk-4',
    productName: 'Paket Diet Sehat (Salimah Slim + VCO)',
    headline: 'Turun Berat Badan Tanpa Mules Tersiksa',
    caption: `Mau turun 2-5 kg tanpa tersiksa lapar dan lemas? 🍋\n\nDuet maut Salimah Slim + VCO SR12 herbal siap bantu detoks lemak jahat dan lancarkan metabolisme tubuh secara alami!\n\n🌿 Kunyit & Jati Belanda meluruhkan lemak\n🌿 VCO menjaga energi & rasa kenyang\n🌿 Bebas bahan kimia berbahaya\n\nYuk mulai hidup sehat dan langsing ideal! Hubungi admin di [No HP Kamu] 📲`,
    tags: ['#SalimahSlimSR12', '#DietHerbalAlami', '#VCOSR12', '#LangsingSehat']
  }
];

// Ekspedisi Pengiriman
const SR12_SHIPPING_PROVIDERS = [
  { id: 'jne', name: 'JNE Express (Reguler)', costPerKg: 12000, estDays: '2-3 hari', minKg: 1 },
  { id: 'jnt', name: 'J&T Express (Kilat)', costPerKg: 14000, estDays: '1-2 hari', minKg: 1 },
  { id: 'sicepat', name: 'SiCepat Halu / Reguler', costPerKg: 11000, estDays: '2-3 hari', minKg: 1 },
  { id: 'kargo', name: 'J&T Cargo / Indah Kargo (Khusus Agen/Grosir)', costPerKg: 3500, estDays: '3-5 hari', minKg: 10 }
];
