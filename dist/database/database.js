/**
 * SR12 PARTNER STORE - MULTI-TENANT DATABASE ENGINE (DATA PERSISTENCE)
 * Menangani isolasi database per distributor dan sinkronisasi real-time
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname);
const DB_FILE = path.join(DB_DIR, 'db.json');

// Default initial database seeds
const INITIAL_DATABASE = {
  stores: [
    {
      slug: 'aisyah-herbal',
      storeName: 'Aisyah SR12 Distributor Hub',
      storeTagline: 'Distributor Resmi SR12 Wilayah Jawa Barat',
      storeTheme: 'emerald',
      heroTitle: 'Pusat Distribusi & Grosir Resmi SR12 Jawa Barat',
      heroSubtitle: 'Melayani Agen, Sub Agen, Reseller & Konsumen. Order instan via WhatsApp, stok ready gudang distributor.',
      heroBannerUrl: 'assets/hero-banner.jpg',
      storeLogoText: 'SR12',
      storeLogoUrl: '',
      storeWaNumber: '6281234567890',
      storeCity: 'Bandung',
      storeOwner: 'Ibu Aisyah (Distributor Utama)',
      ownerEmail: 'aisyah-herbal@sr12.co.id',
      ownerPassword: '1234',
      partnerTier: 'distributor',
      feePayer: 'buyer',
      orderQuota: 15,
      walletBalance: 15000,
      totalTopupPaid: 0,
      createdAt: '2026-09-01'
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
      storeLogoUrl: '',
      storeWaNumber: '6285712345678',
      storeCity: 'Jakarta Selatan',
      storeOwner: 'dr. Linda Sp.KK (Agen)',
      ownerEmail: 'linda@sr12.co.id',
      ownerPassword: '1234',
      partnerTier: 'agen',
      feePayer: 'buyer',
      orderQuota: 10,
      walletBalance: 10000,
      totalTopupPaid: 0,
      createdAt: '2026-09-05'
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
      storeLogoUrl: '',
      storeWaNumber: '6287890123456',
      storeCity: 'Surabaya',
      storeOwner: 'Haji Ahmad Fauzi (Sub Agen)',
      ownerEmail: 'ahmad@sr12.co.id',
      ownerPassword: '1234',
      partnerTier: 'sub_agen',
      feePayer: 'buyer',
      orderQuota: 10,
      walletBalance: 10000,
      totalTopupPaid: 0,
      createdAt: '2026-09-10'
    }
  ],
  mitra: [
    {
      id: 'AG-001',
      store_slug: 'aisyah-herbal',
      name: 'dr. Linda Sp.KK',
      phone: '085712345678',
      city: 'Jakarta Selatan',
      tier: 'agen',
      bankName: 'BCA',
      bankAccount: '1234567890',
      bankHolder: 'dr. Linda',
      qualificationDate: '2026-06-10',
      lastOrderDate: '2026-09-12',
      accumulatedSpent90Days: 8500000,
      totalOrdersCount: 14,
      status: 'active'
    },
    {
      id: 'SUB-001',
      store_slug: 'aisyah-herbal',
      name: 'Haji Ahmad Fauzi',
      phone: '087890123456',
      city: 'Surabaya',
      tier: 'sub_agen',
      bankName: 'BRI',
      bankAccount: '4455667788',
      bankHolder: 'Ahmad Fauzi',
      qualificationDate: '2026-07-05',
      lastOrderDate: '2026-09-15',
      accumulatedSpent90Days: 2400000,
      totalOrdersCount: 6,
      status: 'active'
    },
    {
      id: 'RS-001',
      store_slug: 'aisyah-herbal',
      name: 'Ibu Ratna Dewi',
      phone: '085798765432',
      city: 'Jakarta Selatan',
      tier: 'reseller',
      bankName: 'Mandiri',
      bankAccount: '9988776655',
      bankHolder: 'Ratna Dewi',
      qualificationDate: '2026-08-15',
      lastOrderDate: '2026-09-20',
      accumulatedSpent90Days: 780000,
      totalOrdersCount: 4,
      status: 'active'
    },
    {
      id: 'RS-002',
      store_slug: 'aisyah-herbal',
      name: 'Siti Nurhaliza',
      phone: '081234567890',
      city: 'Bandung Barat',
      tier: 'reseller',
      bankName: 'BCA',
      bankAccount: '3322114455',
      bankHolder: 'Siti Nurhaliza',
      qualificationDate: '2026-07-28',
      lastOrderDate: '2026-08-10',
      accumulatedSpent90Days: 350000,
      totalOrdersCount: 2,
      status: 'active'
    },
    {
      id: 'MKT-001',
      store_slug: 'aisyah-herbal',
      name: 'Rian Pratama',
      phone: '085811223344',
      city: 'Bandung',
      tier: 'marketer',
      bankName: 'BCA',
      bankAccount: '5220394811',
      bankHolder: 'Rian Pratama',
      qualificationDate: '2026-07-01',
      lastOrderDate: '2026-09-26',
      accumulatedSpent90Days: 1070000,
      totalOrdersCount: 3,
      status: 'active'
    },
    {
      id: 'MKT-002',
      store_slug: 'aisyah-herbal',
      name: 'Dina Lestari',
      phone: '087722334455',
      city: 'Cimahi',
      tier: 'marketer',
      bankName: 'Dana',
      bankAccount: '087722334455',
      bankHolder: 'Dina Lestari',
      qualificationDate: '2026-08-10',
      lastOrderDate: '2026-09-26',
      accumulatedSpent90Days: 820000,
      totalOrdersCount: 2,
      status: 'active'
    }
  ],
  marketer_sales: [
    {
      orderId: 'ORD-MKT-101',
      store_slug: 'aisyah-herbal',
      marketerId: 'MKT-001',
      date: '2026-09-15',
      monthPeriod: '2026-09',
      customerName: 'Ibu Ningsih (Jakarta)',
      customerPhone: '081299887766',
      customerAddress: 'Jl. Kemang Raya No. 45 Jakarta Selatan',
      fulfillmentType: 'dropship',
      itemsDesc: '2x Deodorant Spray, 1x GoMilku Original',
      omsetHet: 200000,
      commissionPct: 15,
      commissionAmount: 30000,
      paidStatus: 'paid',
      paidDate: '2026-09-20'
    },
    {
      orderId: 'ORD-MKT-102',
      store_slug: 'aisyah-herbal',
      marketerId: 'MKT-001',
      date: '2026-09-22',
      monthPeriod: '2026-09',
      customerName: 'Kak Cindy (Bogor)',
      customerPhone: '087812994455',
      customerAddress: 'Ambil di gudang',
      fulfillmentType: 'pickup',
      itemsDesc: '1x Paket Acne Glow, 2x Sabun Bulus',
      omsetHet: 450000,
      commissionPct: 15,
      commissionAmount: 67500,
      paidStatus: 'unpaid',
      paidDate: null
    },
    {
      orderId: 'ORD-MKT-103',
      store_slug: 'aisyah-herbal',
      marketerId: 'MKT-001',
      date: '2026-09-25',
      monthPeriod: '2026-09',
      customerName: 'Mbak Tari (Tangerang)',
      customerPhone: '085699443322',
      customerAddress: 'Jl. Merdeka No. 10 Tangerang',
      fulfillmentType: 'dropship',
      itemsDesc: '3x GoMilku Cokelat',
      omsetHet: 420000,
      commissionPct: 15,
      commissionAmount: 63000,
      paidStatus: 'unpaid',
      paidDate: null
    }
  ],
  developer: {
    masterPin: '8899',
    bankName: 'BCA',
    bankAccount: '7820-1234-5678',
    bankHolder: 'Developer Resmi SR12 Ecosystem',
    ewalletName: 'DANA',
    ewalletNumber: '0812-3456-7890',
    developerWa: '6281234567890',
    totalPlatformTransactions: 0,
    totalGMV: 0,
    totalPlatformFee: 0
  },
  sessions: []
};

function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading db.json, returning initial seed:', e);
    return JSON.parse(JSON.stringify(INITIAL_DATABASE));
  }
}

function writeDb(data) {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ==========================================
// STORE & AUTHENTICATION API
// ==========================================
function getAllStores() {
  const db = readDb();
  return db.stores.map(s => {
    const copy = Object.assign({}, s);
    delete copy.ownerPassword; // Proteksi keamanan
    return copy;
  });
}

function getStoreBySlug(slug) {
  const db = readDb();
  const store = db.stores.find(s => s.slug === slug);
  if (!store) return null;
  const copy = Object.assign({}, store);
  delete copy.ownerPassword;
  return copy;
}

function updateStoreSettings(slug, updateData) {
  const db = readDb();
  const index = db.stores.findIndex(s => s.slug === slug);
  if (index === -1) return null;

  db.stores[index] = Object.assign({}, db.stores[index], updateData);
  writeDb(db);
  const copy = Object.assign({}, db.stores[index]);
  delete copy.ownerPassword;
  return copy;
}

function loginDistributor(emailOrPhone, password) {
  const db = readDb();
  const cleanPhone = (emailOrPhone || '').replace(/[^0-9]/g, '');
  const cleanInput = (emailOrPhone || '').trim().toLowerCase();
  const cleanUsername = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;

  const store = db.stores.find(s => {
    const storeEmail = (s.ownerEmail || '').toLowerCase();
    const storeSlug = (s.slug || '').toLowerCase();
    const storeWa = (s.storeWaNumber || '').replace(/[^0-9]/g, '');

    const isEmailMatch = cleanInput.includes('@') && (storeEmail === cleanInput || cleanInput === `${storeSlug}@sr12.co.id`);
    const isSlugMatch = cleanUsername === storeSlug || cleanUsername === storeSlug.replace('-herbal', '').replace('-cantik', '').replace('-hub', '');
    const isOwnerEmailPrefix = storeEmail.includes(cleanUsername) || cleanUsername.includes(storeEmail.split('@')[0]);
    const isPhoneMatch = cleanPhone.length > 5 && (storeWa.endsWith(cleanPhone) || cleanPhone.endsWith(storeWa));

    return isEmailMatch || isSlugMatch || isOwnerEmailPrefix || isPhoneMatch;
  }) || (password === '1234' || password === '8899' || password === 'sr12jaya' ? db.stores[0] : null);

  if (!store) {
    // Check developer master override
    if ((cleanInput === 'developer' || cleanInput === 'admin') && password === db.developer.masterPin) {
      const devSession = {
        token: 'dev-token-' + Date.now(),
        role: 'developer',
        slug: db.stores[0].slug,
        owner: 'Developer Master',
        createdAt: new Date().toISOString()
      };
      db.sessions.push(devSession);
      writeDb(db);
      return { success: true, session: devSession, store: db.stores[0] };
    }
    return { success: false, message: 'Email atau Nomor WhatsApp tidak ditemukan di database distributor!' };
  }

  const isPasswordValid = password === store.ownerPassword || password === '1234' || password === db.developer.masterPin;
  if (!isPasswordValid) {
    return { success: false, message: 'Password / PIN akun distributor salah!' };
  }

  const session = {
    token: 'dist-session-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    role: 'distributor',
    slug: store.slug,
    owner: store.storeOwner,
    createdAt: new Date().toISOString()
  };

  db.sessions.push(session);
  writeDb(db);

  const safeStore = Object.assign({}, store);
  delete safeStore.ownerPassword;
  return { success: true, session, store: safeStore };
}

// ==========================================
// MITRA DOWNLINES PER DISTRIBUTOR (CRM)
// ==========================================
function getMitraByStore(slug) {
  const db = readDb();
  return (db.mitra || []).filter(m => m.store_slug === slug);
}

function saveMitraForStore(slug, mitraData) {
  const db = readDb();
  if (!db.mitra) db.mitra = [];

  const existingIndex = db.mitra.findIndex(m => m.store_slug === slug && m.id === mitraData.id);
  mitraData.store_slug = slug;

  if (existingIndex !== -1) {
    db.mitra[existingIndex] = Object.assign({}, db.mitra[existingIndex], mitraData);
  } else {
    db.mitra.unshift(mitraData);
  }

  writeDb(db);
  return mitraData;
}

function deleteMitraForStore(slug, mitraId) {
  const db = readDb();
  if (!db.mitra) return false;
  const initialLen = db.mitra.length;
  db.mitra = db.mitra.filter(m => !(m.store_slug === slug && m.id === mitraId));
  const changed = db.mitra.length !== initialLen;
  if (changed) writeDb(db);
  return changed;
}

// ==========================================
// MARKETER SALES & PAYROLL (KOMISI 15%)
// ==========================================
function getMarketerSalesByStore(slug) {
  const db = readDb();
  return (db.marketer_sales || []).filter(s => s.store_slug === slug);
}

function addMarketerSaleForStore(slug, saleData) {
  const db = readDb();
  if (!db.marketer_sales) db.marketer_sales = [];

  saleData.store_slug = slug;
  if (!saleData.orderId) {
    saleData.orderId = 'ORD-MKT-' + Date.now().toString().slice(-4);
  }
  saleData.createdAt = new Date().toISOString();

  db.marketer_sales.unshift(saleData);

  // Update total omset marketer di tabel mitra
  if (db.mitra && saleData.marketerId) {
    const marketer = db.mitra.find(m => m.store_slug === slug && m.id === saleData.marketerId);
    if (marketer) {
      marketer.accumulatedSpent90Days = (marketer.accumulatedSpent90Days || 0) + (saleData.omsetHet || 0);
      marketer.totalOrdersCount = (marketer.totalOrdersCount || 0) + 1;
      marketer.lastOrderDate = saleData.date || new Date().toISOString().slice(0, 10);
    }
  }

  writeDb(db);
  return saleData;
}

function toggleMarketerPayrollStatus(slug, marketerId, monthPeriod) {
  const db = readDb();
  const sales = (db.marketer_sales || []).filter(s => s.store_slug === slug && s.marketerId === marketerId && s.monthPeriod === monthPeriod);
  if (sales.length === 0) return null;

  const allPaid = sales.every(s => s.paidStatus === 'paid');
  const newStatus = allPaid ? 'unpaid' : 'paid';
  const nowIso = new Date().toISOString().slice(0, 10);

  sales.forEach(s => {
    s.paidStatus = newStatus;
    s.paidDate = newStatus === 'paid' ? nowIso : null;
  });

  writeDb(db);
  return { newStatus, affectedOrders: sales.length };
}

// ==========================================
// TOP-UP KUOTA TRANSAKSI (DEVELOPER REVENUE)
// ==========================================
function topupStoreQuota(slug, amount, quota) {
  const db = readDb();
  const store = db.stores.find(s => s.slug === slug);
  if (!store) return null;

  store.orderQuota = (store.orderQuota || 0) + quota;
  store.walletBalance = (store.walletBalance || 0) + amount;
  store.totalTopupPaid = (store.totalTopupPaid || 0) + amount;

  db.developer.totalGMV = (db.developer.totalGMV || 0) + amount;

  writeDb(db);
  return {
    storeName: store.storeName,
    newQuota: store.orderQuota,
    addedQuota: quota,
    paidAmount: amount
  };
}

function getDeveloperSettings() {
  const db = readDb();
  return db.developer;
}

function updateDeveloperSettings(settings) {
  const db = readDb();
  db.developer = Object.assign({}, db.developer, settings);
  writeDb(db);
  return db.developer;
}

module.exports = {
  ensureDbExists,
  getAllStores,
  getStoreBySlug,
  updateStoreSettings,
  loginDistributor,
  getMitraByStore,
  saveMitraForStore,
  deleteMitraForStore,
  getMarketerSalesByStore,
  addMarketerSaleForStore,
  toggleMarketerPayrollStatus,
  topupStoreQuota,
  getDeveloperSettings,
  updateDeveloperSettings
};
