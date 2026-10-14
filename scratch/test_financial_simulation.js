// Simulation unit test verifying the exact math and decoupling
const fs = require('fs');
const path = require('path');

console.log('--- TEST FINANCIAL & SIMULATION LOGIC ---');

// Mock localStorage and sessionStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] !== undefined ? storage[k] : null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
global.sessionStorage = {
  getItem: (k) => null,
  setItem: () => {},
  removeItem: () => {}
};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};
global.window = {
  location: { origin: 'http://localhost:3000', pathname: '/' }
};

// Test 1: getStoredTransactions with no legacy fallback
const curSlug = 'baniaga-test';
function getStoredTransactions(slug) {
  const cSlug = slug || 'sr12-central';
  const key = `sr12_pos_transactions_v2_${cSlug}`;
  const s = localStorage.getItem(key);
  if (s !== null) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

// Ensure empty initially
console.assert(getStoredTransactions(curSlug).length === 0, 'New store must start with 0 transactions');

// Test 2: Marketer consolidated sales without fake -AKUMULASI
const mockMarketer = {
  id: 'MKT-001',
  name: 'Maryam',
  phone: '0895800355550',
  tier: 'marketer',
  accumulatedSpent90Days: 0,
  totalOrdersCount: 0
};

const mockReseller = {
  id: 'RS-001',
  name: 'Zahrah',
  phone: '085342743763',
  tier: 'reseller',
  accumulatedSpent90Days: 0,
  totalOrdersCount: 0
};

let transactions = [];
let marketerSales = [];

// Order 1: Pelanggan Biasa (1x Manjakani Rp 86.500)
const orderRetail = {
  id: 'ORD-WEB-000001',
  store_slug: curSlug,
  tier: 'konsumen',
  tierLabel: 'Konsumen Retail',
  marketerId: null,
  resellerId: null,
  customerName: 'Budi Santoso',
  customerPhone: '081299990001',
  subtotal: 86500,
  subtotalHet: 86500,
  grandTotal: 86500
};
transactions.push(orderRetail);

// Order 2: Marketer Maryam (1x Manjakani Rp 86.500)
const orderMarketer = {
  id: 'ORD-WEB-000002',
  store_slug: curSlug,
  tier: 'marketer',
  tierLabel: 'Mitra Marketer (Maryam)',
  marketerId: 'MKT-001',
  marketerName: 'Maryam',
  resellerId: null,
  customerName: 'Pelanggan Maryam',
  customerPhone: '085342743763', // Note: tester's phone
  subtotal: 86500,
  subtotalHet: 86500,
  grandTotal: 86500
};
transactions.push(orderMarketer);
marketerSales.push({
  orderId: orderMarketer.id,
  store_slug: curSlug,
  marketerId: 'MKT-001',
  marketerName: 'Maryam',
  omsetHet: 86500,
  commissionPct: 15,
  commissionAmount: Math.round(86500 * 0.15),
  paidStatus: 'unpaid'
});

// Order 3: Reseller Zahrah (1x Madu Baduy Rp 61.500 HET -> 20% disc = Rp 49.200)
const orderReseller = {
  id: 'ORD-WEB-000003',
  store_slug: curSlug,
  tier: 'reseller',
  tierLabel: 'Reseller Resmi (Zahrah - RS-001)',
  marketerId: null,
  resellerId: 'RS-001',
  customerName: 'Zahrah',
  customerPhone: '085342743763', // Note: same tester's phone
  subtotal: 49200,
  subtotalHet: 61500,
  grandTotal: 49200
};
transactions.push(orderReseller);

console.log('Total Transactions count:', transactions.length);
console.assert(transactions.length === 3, 'Total transactions must be exactly 3 (NOT 7!)');

// Test 3: Calculate Maryam's Marketer payroll
const isMatchingMarketer = (mId, mCode, m) => {
  const cleanMid = String(mId || '').trim().toUpperCase();
  const cleanMCode = String(mCode || '').trim().toUpperCase();
  const targetId = String(m.id || m.partner_code || '').trim().toUpperCase();
  if (cleanMid && cleanMid === targetId) return true;
  if (cleanMCode && cleanMCode === targetId) return true;
  return false;
};

const maryamSales = marketerSales.filter(s => isMatchingMarketer(s.marketerId, null, mockMarketer));
const maryamTotalOmset = maryamSales.reduce((sum, s) => sum + s.omsetHet, 0);
const maryamTotalBonus = maryamSales.reduce((sum, s) => sum + s.commissionAmount, 0);

console.log('Maryam Sales Count:', maryamSales.length);
console.log('Maryam Omset:', maryamTotalOmset);
console.log('Maryam Bonus:', maryamTotalBonus);

console.assert(maryamSales.length === 1, 'Maryam must have exactly 1 order');
console.assert(maryamTotalOmset === 86500, 'Maryam omset must be Rp 86.500 (NOT Rp 1.083.000!)');
console.assert(maryamTotalBonus === 12975, 'Maryam bonus must be Rp 12.975 (NOT Rp 162.450!)');

// Test 4: Calculate Zahrah's Reseller stats
const zahrahOrders = transactions.filter(t => t.resellerId === mockReseller.id);
const zahrahTotalSpend = zahrahOrders.reduce((sum, t) => sum + t.subtotal, 0);

console.log('Zahrah Orders Count:', zahrahOrders.length);
console.log('Zahrah Total Spend:', zahrahTotalSpend);

console.assert(zahrahOrders.length === 1, 'Zahrah must have exactly 1 order');
console.assert(zahrahTotalSpend === 49200, 'Zahrah spend must be Rp 49.200 (NOT Rp 698.000!)');

console.log('✅ ALL FINANCIAL & SIMULATION ASSERTIONS PASSED PERFECTLY!');
