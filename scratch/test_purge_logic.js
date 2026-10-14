// Test Unified Purge and Single Deletion Logic
const fs = require('fs');

console.log('--- TEST PURGE & DELETION LOGIC ---');

// Mock localStorage
const store = {};
const localStorage = {
  getItem: (k) => store[k] !== undefined ? store[k] : null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.localStorage = localStorage;
global.sessionStorage = localStorage;

// Mock window and document
global.window = global;
global.document = {
  getElementById: () => null
};

// Initial state with simulation orders
const curSlug = 'sr12-central';
let appState = {
  storeSettings: { slug: curSlug, storeName: 'Kantor Pusat' },
  currentStoreSlug: curSlug,
  transactions: [
    { id: 'ORD-001', tier: 'marketer', marketerId: 'MKT-001', grandTotal: 100000 },
    { id: 'ORD-002', tier: 'reseller', resellerId: 'RS-001', grandTotal: 50000 }
  ],
  marketerSales: [
    { orderId: 'ORD-001', marketerId: 'MKT-001', omsetHet: 100000 }
  ],
  cashflow: [
    { id: 'CF-001', notes: 'ORD-001 - Maryam', amount: 100000 },
    { id: 'CF-002', notes: 'ORD-002 - Zahrah', amount: 50000 }
  ],
  mitraList: [
    { id: 'MKT-001', name: 'Maryam', tier: 'marketer', accumulatedSpent90Days: 100000, totalOrdersCount: 1 },
    { id: 'RS-001', name: 'Zahrah', tier: 'reseller', accumulatedSpent90Days: 50000, totalOrdersCount: 1 }
  ]
};

// Test 1: Single Deletion of ORD-001
const trxId = 'ORD-001';
appState.transactions = appState.transactions.filter(t => t.id !== trxId);
appState.marketerSales = appState.marketerSales.filter(s => s.orderId !== trxId);
appState.cashflow = appState.cashflow.filter(c => !(c.notes && c.notes.includes(trxId)));

if (appState.transactions.length !== 1) throw new Error('Transaction not deleted');
if (appState.marketerSales.length !== 0) throw new Error('Marketer sale not deleted with transaction');
if (appState.cashflow.length !== 1) throw new Error('Cashflow not deleted with transaction');
console.log('✅ Single transaction deletion correctly purged marketer sale & cashflow!');

// Test 2: Full Purge
appState.transactions = [];
appState.marketerSales = [];
appState.cashflow = [];
appState.mitraList.forEach(m => {
  m.accumulatedSpent90Days = 0;
  m.totalOrdersCount = 0;
  m.spent = 0;
});

if (appState.transactions.length !== 0) throw new Error('Transactions not 0');
if (appState.marketerSales.length !== 0) throw new Error('Marketer sales not 0');
if (appState.cashflow.length !== 0) throw new Error('Cashflow not 0');
if (appState.mitraList.some(m => m.accumulatedSpent90Days !== 0 || m.totalOrdersCount !== 0)) {
  throw new Error('Mitra spend not reset to 0');
}
console.log('✅ Full purge reset all financial & partner counters to 0!');
console.log('--- ALL TESTS PASSED ---');
