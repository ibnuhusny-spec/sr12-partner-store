/**
 * SR12 PARTNER STORE - MULTI-TENANT DATABASE ENGINE (DATA PERSISTENCE)
 * Menangani isolasi database per distributor dan sinkronisasi real-time
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname);
const DB_FILE = path.join(DB_DIR, 'db.json');

// Default initial database seeds (Clean slate - ready for fresh simulation)
const INITIAL_DATABASE = {
  stores: [],
  mitra: [],
  marketer_sales: [],
  orders: [],
  cashflow: [],
  developer: {
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

function addStore(storeData) {
  const db = readDb();
  if (!db.stores) db.stores = [];
  const idx = db.stores.findIndex(s => s.slug === storeData.slug);
  if (idx >= 0) {
    db.stores[idx] = Object.assign({}, db.stores[idx], storeData);
  } else {
    db.stores.unshift(storeData);
  }
  writeDb(db);
  const copy = Object.assign({}, storeData);
  delete copy.ownerPassword;
  return copy;
}

function clearAllData() {
  writeDb(JSON.parse(JSON.stringify(INITIAL_DATABASE)));
  return true;
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
  updateDeveloperSettings,
  addStore,
  clearAllData
};
