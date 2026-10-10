/**
 * SR12 PARTNER STORE - OLSERA-STYLE DISTRIBUTOR MANAGEMENT SUITE (POS & OPERATIONS)
 * Modul lengkap kasir gudang, inventori stok, arus kas masuk-keluar, dan laporan omset.
 */

// ==========================================
// 1. DATA AWAL TRANSAKSI & ARUS KAS GUDANG
// ==========================================
const DEFAULT_TRANSACTIONS = [];

const DEFAULT_CASHFLOW = [];

function getStoredTransactions() {
  const s = localStorage.getItem('sr12_pos_transactions_v1');
  if (s) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        // Hapus pesanan dummy bawaan agar simulasi bersih dari awal
        const cleaned = parsed.filter(t => !['TRX-2026-101', 'TRX-2026-102', 'TRX-2026-103'].includes(t.id));
        if (cleaned.length !== parsed.length) {
          saveStoredTransactions(cleaned);
        }
        return cleaned;
      }
    } catch (e) {}
  }
  return [];
}

function saveStoredTransactions(list) {
  localStorage.setItem('sr12_pos_transactions_v1', JSON.stringify(list));
}

function getStoredCashflow() {
  const dummyCashIds = ['CSH-001', 'CSH-002', 'CSH-003', 'CSH-004', 'CSH-005'];
  const s = localStorage.getItem('sr12_cashflow_records_v1');
  if (s) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(c => !dummyCashIds.includes(c.id));
        if (cleaned.length !== parsed.length) {
          saveStoredCashflow(cleaned);
        }
        return cleaned;
      }
    } catch (e) {}
  }
  saveStoredCashflow([]);
  return [];
}

function saveStoredCashflow(list) {
  localStorage.setItem('sr12_cashflow_records_v1', JSON.stringify(list));
}

// ------------------------------------------
// 1.5. KARTU RIWAYAT MUTASI STOK GUDANG OTOMATIS
// ------------------------------------------
function getStoredStockMutations() {
  const s = localStorage.getItem('sr12_stock_mutations_v1');
  if (s) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

function saveStoredStockMutations(list) {
  localStorage.setItem('sr12_stock_mutations_v1', JSON.stringify(list));
}

function recordStockMutation(entry) {
  const list = getStoredStockMutations();
  const now = new Date();
  const dateFormatted = entry.date || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  
  const newEntry = {
    id: 'MUT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: now.toISOString(),
    date: dateFormatted,
    productId: entry.productId || '',
    productName: entry.productName || 'Produk SR12',
    type: entry.type || 'ADJUST', // 'IN_RESTOCK', 'OUT_POS', 'OUT_ONLINE', 'ADJUST'
    typeLabel: entry.typeLabel || 'Penyesuaian Stok',
    qty: Number(entry.qty) || 0,
    stockBefore: Number(entry.stockBefore) || 0,
    stockAfter: Number(entry.stockAfter) || 0,
    refNo: entry.refNo || '-',
    notes: entry.notes || ''
  };

  list.unshift(newEntry);
  saveStoredStockMutations(list);
  return newEntry;
}
window.recordStockMutation = recordStockMutation;
window.getStoredStockMutations = getStoredStockMutations;
window.saveStoredStockMutations = saveStoredStockMutations;

// Inisialisasi state POS & Olsera di appState
if (typeof appState !== 'undefined') {
  appState.isOlseraPortalOpen = false;
  appState.activeOlseraTab = 'pos';
  appState.posCart = [];
  appState.posBuyerTier = 'konsumen';
  appState.posSearchQuery = '';
  appState.posSelectedCategory = 'all';
  appState.posCurrentTrx = null;
  appState.posPayMethod = 'cash';
  appState.transactions = getStoredTransactions();
  appState.cashflow = getStoredCashflow();
}

// ==========================================
// 2. TOGGLE ANTARA TOKO ONLINE & PORTAL OLSERA
// ==========================================
function showDistributorPortalView(showPortal) {
  const portal = document.getElementById('distributorOlseraPortal');
  const olseraNav = document.getElementById('olseraAppNavbar');
  const previewStrip = document.getElementById('distributorPreviewStrip');
  const devStrip = document.getElementById('devPreviewStrip');
  const storefront = document.getElementById('publicStorefrontMain');
  const platformTopbar = document.getElementById('platformTopbar') || document.querySelector('.platform-topbar');
  const adminBanner = document.getElementById('adminModeBanner');
  const siteHeader = document.querySelector('.site-header');
  const tierBanner = document.querySelector('.tier-quick-banner');
  const oldToggleBar = document.getElementById('distributorPortalToggleBar');
  const backToDevBtn = document.getElementById('btnOlseraBackToDevConsole');
  const superAdminBanner = document.getElementById('olseraSuperAdminBanner');

  if (typeof appState !== 'undefined') {
    appState.isOlseraPortalOpen = !!showPortal;
  }
  try {
    if (showPortal) {
      localStorage.setItem('sr12_active_view_mode', 'portal');
    } else {
      localStorage.setItem('sr12_active_view_mode', 'storefront');
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  } catch (e) {}

  // Sembunyikan bar toggle lama & banner admin bertumpuk
  if (oldToggleBar) oldToggleBar.style.display = 'none';
  if (adminBanner) adminBanner.style.display = 'none';

  const isCentral = (typeof appState !== 'undefined' && appState.storeSettings) 
    ? (!appState.storeSettings.slug || appState.storeSettings.slug === 'sr12-central')
    : true;

  if (showPortal) {
    // -------------------------------------------------------------
    // 1. MODE PORTAL OLSERA (POS KASIR & MANAJEMEN GUDANG)
    // Sembunyikan SEMUA bar retail toko online agar bersih & rapi
    // -------------------------------------------------------------
    document.body.classList.add('olsera-portal-active');
    if (storefront) storefront.style.display = 'none';
    if (siteHeader) siteHeader.style.display = 'none';
    if (tierBanner) tierBanner.style.display = 'none';
    if (platformTopbar) platformTopbar.style.display = 'none';
    if (previewStrip) previewStrip.style.display = 'none';
    if (devStrip) devStrip.style.display = 'none';
    const btnFloat = document.getElementById('btnFloatingAdminMenu');
    if (btnFloat) btnFloat.style.display = 'none';

    // Tampilkan Portal Olsera dan pastikan Tab Hitam Atas (olseraNav) Disembunyikan Sesuai Permintaan User
    if (olseraNav) olseraNav.style.display = 'none';
    if (portal) portal.style.display = 'flex';

    // Jika Developer Super Admin yang sedang masuk:
    if (typeof appState !== 'undefined' && appState.isDevMasterLoggedIn) {
      if (backToDevBtn) backToDevBtn.style.display = 'inline-flex';
      if (superAdminBanner) {
        superAdminBanner.style.display = 'flex';
        const nameEl = document.getElementById('olseraSuperAdminStoreName');
        if (nameEl) nameEl.textContent = (appState.storeSettings && appState.storeSettings.storeName) || 'Toko Mitra';
      }
    } else {
      if (backToDevBtn) backToDevBtn.style.display = 'none';
      if (superAdminBanner) superAdminBanner.style.display = 'none';
    }

    // Refresh data nama toko, kuota, logo, dan hitungan badge
    updateOlseraHeaderMeta();
    const currentTab = (window.location.hash ? window.location.hash.replace('#', '') : null) || 
      (typeof appState !== 'undefined' ? appState.activeOlseraTab : null) || 
      localStorage.getItem('sr12_active_olsera_tab') || 'pos';
    switchOlseraTab(currentTab);
  } else {
    // -------------------------------------------------------------
    // 2. MODE TINJAU TOKO ONLINE PEMBELI (BUYER STOREFRONT PREVIEW)
    // Sembunyikan Olsera workspace & tampilkan toko online pembeli
    // -------------------------------------------------------------
    // 1. Pastikan drawer Olsera dan backdrop ditutup seketika
    if (typeof closeOlseraSidebarDrawer === 'function') {
      closeOlseraSidebarDrawer();
    }
    const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
    const backdrop = document.getElementById('olseraDrawerBackdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');

    // 2. Tutup modal Olsera/admin yang mungkin masih terbuka (jangan tutup modal produk atau keranjang pembeli!)
    document.querySelectorAll('.modal-backdrop.open').forEach(m => {
      if (m.id !== 'modalProductDetail' && m.id !== 'cartDrawer' && m.id !== 'modalProductPromoShare') {
        m.classList.remove('open');
      }
    });

    // 3. Lepaskan SEMUA pengunci scroll dari body dan html
    document.body.classList.remove('olsera-drawer-open');
    document.body.classList.remove('modal-open');
    if (document.documentElement) {
      document.documentElement.classList.remove('olsera-drawer-open');
      document.documentElement.classList.remove('modal-open');
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
    if (typeof ensureScrollUnlocked === 'function') {
      ensureScrollUnlocked();
    }

    document.body.classList.remove('olsera-portal-active');
    document.body.classList.toggle('is-central-hub', isCentral);
    document.body.classList.toggle('is-partner-store', !isCentral);

    if (portal) portal.style.display = 'none';
    if (olseraNav) olseraNav.style.display = 'none';
    const bBar = document.getElementById('posMobileBottomBar');
    if (bBar) {
      bBar.classList.remove('active');
      bBar.style.display = 'none';
    }

    if (storefront) storefront.style.display = 'block';
    if (siteHeader) siteHeader.style.display = isCentral ? 'block' : 'none';
    if (tierBanner) tierBanner.style.display = 'none';
    if (platformTopbar) platformTopbar.style.display = isCentral ? 'block' : 'none';

    // Sembunyikan semua strip/tab hitam atas agar toko online pembeli benar-benar bersih
    if (previewStrip) previewStrip.style.display = 'none';
    if (devStrip) devStrip.style.display = (typeof appState !== 'undefined' && appState.isDevMasterLoggedIn) ? 'flex' : 'none';

    // Tampilkan tombol melayang Menu Toko hanya jika distributor sedang login
    const isLoggedDistributor = (typeof appState !== 'undefined') && !!appState.isAdminMode && !!appState.isDistributorLoggedIn;
    const btnFloat = document.getElementById('btnFloatingAdminMenu');
    if (btnFloat) btnFloat.style.display = isLoggedDistributor ? 'inline-flex' : 'none';

    if (typeof renderProducts === 'function') renderProducts();
  }
}

function updateOlseraHeaderMeta() {
  const store = (typeof appState !== 'undefined' && appState.storeSettings) || {};
  const nameEl = document.getElementById('olseraStoreNameDisplay');
  const ownerEl = document.getElementById('olseraStoreOwnerDisplay');
  const topbarNameEl = document.getElementById('olseraTopbarStoreName');
  const topbarOwnerEl = document.getElementById('olseraTopbarOwnerName');
  const topbarQuotaEl = document.getElementById('olseraTopbarQuotaDisplay');

  const isCentral = !store.slug || store.slug === 'sr12-central';
  const sName = isCentral ? 'SR12-Ku Pro (Pusat)' : (store.storeName || 'SR12 Partner Store');
  const sOwner = isCentral ? 'Administrator Pusat' : (store.storeOwner || 'Pemilik Toko');

  // Selaraskan kasir aktif dengan pemilik toko saat ini jika belum ada kasir atau toko berpindah
  if (typeof appState !== 'undefined') {
    if (!appState.activeCashier || (appState.activeCashier.storeSlug && appState.activeCashier.storeSlug !== store.slug)) {
      appState.activeCashier = {
        name: sOwner,
        storeSlug: store.slug || 'sr12-central',
        shift: 'Shift Pagi (08:00 - 15:00)',
        clockInTime: '08:00 WIB',
        openingCash: 100000,
        trxCount: 0,
        totalSales: 0,
        cashSales: 0,
        nonCashSales: 0,
        status: 'Aktif'
      };
      if (typeof saveStoredActiveCashier === 'function') {
        saveStoredActiveCashier(appState.activeCashier);
      }
    }
  }

  const activeCashierName = (typeof appState !== 'undefined' && appState.activeCashier && appState.activeCashier.name) ? appState.activeCashier.name : sOwner;
  const displayName = sName;

  if (nameEl) nameEl.textContent = displayName;
  if (ownerEl) {
    ownerEl.textContent = isCentral 
      ? `${activeCashierName} (Admin) • SR12 Official Central Hub` 
      : `${activeCashierName} (Kasir Aktif)`;
  }
  if (topbarNameEl) topbarNameEl.textContent = displayName;
  if (topbarOwnerEl) {
    if (isCentral) {
      topbarOwnerEl.textContent = `${activeCashierName} (Admin) • SR12 Official Central Hub`;
    } else {
      topbarOwnerEl.textContent = `${activeCashierName} (Kasir) • Distributor Resmi SR12 (${store.storeCity || 'Mitra'})`;
    }
  }

  // Update Topbar Statis Terintegrasi
  const staticStoreNameEl = document.getElementById('olseraStaticStoreName');
  const staticStoreRoleEl = document.getElementById('olseraStaticStoreRole');
  const staticCashierLabelEl = document.getElementById('olseraStaticCashierLabel');
  const staticQuotaEl = document.getElementById('olseraStaticQuotaDisplay');

  if (staticStoreNameEl) staticStoreNameEl.textContent = displayName;
  if (staticStoreRoleEl) staticStoreRoleEl.textContent = isCentral ? 'SR12 Official Central Hub' : `Distributor Resmi SR12 (${store.storeCity || 'Indonesia'})`;
  if (staticCashierLabelEl) staticCashierLabelEl.textContent = `Kasir: ${activeCashierName}`;

  // Update POS Cashier Pills
  const posCashierPill = document.getElementById('posActiveCashierLabel');
  if (posCashierPill) {
    const shift = (appState && appState.activeCashier && appState.activeCashier.shift) ? appState.activeCashier.shift.split('(')[0].trim() : 'Shift Pagi';
    posCashierPill.textContent = `Kasir: ${activeCashierName} (${shift})`;
  }
  const topbarCashier = document.getElementById('topbarActiveCashierName');
  if (topbarCashier) topbarCashier.textContent = activeCashierName;

  const q = (appState && typeof appState.storeSettings?.orderQuota !== 'undefined') ? appState.storeSettings.orderQuota : 15;
  if (topbarQuotaEl) topbarQuotaEl.textContent = `${q}`;
  if (staticQuotaEl) staticQuotaEl.textContent = `${q}`;
  const drawerQuotaEl = document.getElementById('olseraDrawerQuotaBadge');
  if (drawerQuotaEl) drawerQuotaEl.textContent = `${q}`;

  const drawerOrderEl = document.getElementById('olseraDrawerOrderBadge');
  if (drawerOrderEl) {
    const pendingOrders = (typeof getStoredCustomerOrders === 'function') 
      ? getStoredCustomerOrders().filter(o => o.status === 'pending').length 
      : 0;
    drawerOrderEl.textContent = `${pendingOrders}`;
  }

  // Update logo di sidebar & topbar dengan logo resmi tanpa kotak (sesuai gaya Olsera)
  const logoEl = document.getElementById('olseraLogoIcon');
  const topbarLogoEl = document.getElementById('olseraTopbarLogo');

  const activeLogo = store.storeLogoUrl || 'assets/sr12-logo.png';
  const logoHtml = `<img src="${activeLogo}" alt="Logo Toko" style="width: 100%; height: 100%; object-fit: contain !important; object-position: center center !important; border-radius: 50%; display: block; margin: 0 auto;">`;

  if (logoEl) logoEl.innerHTML = logoHtml;
  if (topbarLogoEl) topbarLogoEl.innerHTML = logoHtml;

  // Auto-center any custom uploaded logo that might have asymmetric padding
  if (activeLogo && activeLogo !== 'assets/sr12-logo.png' && typeof autoTrimAndCenterImage === 'function') {
    autoTrimAndCenterImage(activeLogo, (centeredUrl) => {
      if (centeredUrl && centeredUrl !== activeLogo) {
        if (logoEl) {
          const img = logoEl.querySelector('img');
          if (img) img.src = centeredUrl;
        }
        if (topbarLogoEl) {
          const img = topbarLogoEl.querySelector('img');
          if (img) img.src = centeredUrl;
        }
      }
    });
  }

  // Badges count
  const trxBadge = document.getElementById('olseraTrxBadge');
  if (trxBadge) trxBadge.textContent = (appState && appState.transactions) ? appState.transactions.length : '0';

  const invBadge = document.getElementById('olseraInvBadge');
  if (invBadge) invBadge.textContent = (appState && appState.products) ? appState.products.length : '0';

  const mitraBadge = document.getElementById('olseraMitraBadge');
  if (mitraBadge) mitraBadge.textContent = (appState && appState.mitraList) ? appState.mitraList.length : '0';

  // Perbarui juga notifikasi pesanan masuk real-time
  if (typeof updateAdminNotificationUI === 'function') {
    updateAdminNotificationUI();
  }
}

// ==========================================
// ==========================================
// 2.1 OLSERA MOBILE & DESKTOP DRAWER CONTROLS (SESUAI PERSIS SCREENSHOT USER)
// ==========================================
function openOlseraSidebarDrawer() {
  const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
  const backdrop = document.getElementById('olseraDrawerBackdrop');
  if (sidebar) {
    sidebar.style.transform = '';
    sidebar.style.transition = '';
    sidebar.classList.add('open');
  }
  if (backdrop) {
    backdrop.style.opacity = '';
    backdrop.classList.add('open');
  }
  document.documentElement.classList.add('olsera-drawer-open');
  document.body.classList.add('olsera-drawer-open');
  document.body.style.overflow = 'hidden';
  if (typeof updateAdminNotificationUI === 'function') {
    updateAdminNotificationUI();
  }
}

function closeOlseraSidebarDrawer() {
  const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
  const backdrop = document.getElementById('olseraDrawerBackdrop');
  if (sidebar) {
    sidebar.classList.remove('open');
    sidebar.style.transform = '';
    sidebar.style.transition = '';
  }
  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.style.opacity = '';
  }
  document.documentElement.classList.remove('olsera-drawer-open');
  document.body.classList.remove('olsera-drawer-open');
  document.body.style.overflow = '';
}

function toggleOlseraSidebarDrawer() {
  const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
  if (!sidebar) return;
  if (sidebar.classList.contains('open')) {
    closeOlseraSidebarDrawer();
  } else {
    openOlseraSidebarDrawer();
  }
}

function toggleOlseraMenuInFlow() {
  toggleOlseraSidebarDrawer();
}

/**
 * GESTUR GESER LAYAR (SWIPE TO CLOSE) & PENCEGAHAN SCROLL BACKGROUND:
 * Menjamin saat drawer terbuka di HP, geser layar ke kiri langsung menutup drawer
 * dan halaman di belakangnya 100% diam terkunci tidak bergerak.
 */
function initOlseraDrawerSwipeGesture() {
  const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
  const backdrop = document.getElementById('olseraDrawerBackdrop');
  if (!sidebar) return;

  let startX = 0;
  let startY = 0;
  let currentDiffX = 0;
  let isSwipingSidebar = false;

  // 1. Geser ke kiri pada sidebar untuk menutup (Swipe left to close)
  sidebar.addEventListener('touchstart', (e) => {
    if (!sidebar.classList.contains('open')) return;
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentDiffX = 0;
    isSwipingSidebar = false;
  }, { passive: true });

  sidebar.addEventListener('touchmove', (e) => {
    if (!sidebar.classList.contains('open')) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // Deteksi tarikan ke kiri secara horizontal
    if (diffX < -10 && Math.abs(diffX) > Math.abs(diffY) * 1.1) {
      isSwipingSidebar = true;
      if (e.cancelable) e.preventDefault(); // Kunci background & menu vertical scroll saat swipe horizontal
      currentDiffX = Math.min(0, diffX);
      sidebar.style.transform = `translateX(${currentDiffX}px)`;
      sidebar.style.transition = 'none';
      if (backdrop) {
        const sidebarWidth = sidebar.offsetWidth || 300;
        const progress = Math.max(0, 1 + (diffX / sidebarWidth));
        backdrop.style.opacity = `${progress}`;
      }
    }
  }, { passive: false });

  sidebar.addEventListener('touchend', (e) => {
    if (!sidebar.classList.contains('open')) return;
    if (isSwipingSidebar) {
      isSwipingSidebar = false;
      sidebar.style.transition = '';
      if (backdrop) backdrop.style.opacity = '';

      // Jika tarikan ke kiri mencapai >= 35px, tutup drawer
      if (currentDiffX <= -35) {
        closeOlseraSidebarDrawer();
      } else {
        sidebar.style.transform = '';
      }
    }
  }, { passive: true });

  // 2. Sentuhan & geseran pada backdrop: Cegah scroll background dan tutup drawer jika digeser/ditekan
  if (backdrop) {
    backdrop.addEventListener('touchmove', (e) => {
      // 100% pastikan halaman di belakang backdrop tidak bergeser sama sekali
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    backdrop.addEventListener('touchend', (e) => {
      if (e.cancelable) e.preventDefault();
      closeOlseraSidebarDrawer();
    }, { passive: false });
  }
}

// ========================================================
// ABSENSI SHIFT KASIR & OPERATOR SUITE
// ========================================================

function getStoredActiveCashier() {
  try {
    const raw = localStorage.getItem('sr12_active_cashier');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name === 'Nurlinda Sari' && typeof appState !== 'undefined' && appState.storeSettings && appState.storeSettings.storeOwner) {
        parsed.name = appState.storeSettings.storeOwner;
      }
      return parsed;
    }
  } catch (e) {}
  const defaultOwner = (typeof appState !== 'undefined' && appState.storeSettings && appState.storeSettings.storeOwner) || 'Administrator Toko';
  return {
    name: defaultOwner,
    shift: 'Shift Pagi (08:00 - 15:00)',
    clockInTime: '08:00 WIB',
    openingCash: 100000,
    trxCount: 0,
    totalSales: 0,
    cashSales: 0,
    nonCashSales: 0,
    status: 'Aktif'
  };
}

function saveStoredActiveCashier(cashier) {
  try {
    localStorage.setItem('sr12_active_cashier', JSON.stringify(cashier));
  } catch (e) {}
}

function getStoredCashierAttendance() {
  try {
    const raw = localStorage.getItem('sr12_cashier_attendance');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Hapus dummy bawaan jika ada
        return parsed.filter(l => l.cashierName !== 'Nurlinda Sari' || (typeof appState !== 'undefined' && appState.storeSettings && appState.storeSettings.storeOwner === 'Nurlinda Sari'));
      }
    }
  } catch (e) {}
  return [];
}

function saveStoredCashierAttendance(logs) {
  try {
    localStorage.setItem('sr12_cashier_attendance', JSON.stringify(logs));
  } catch (e) {}
}

function getStoredCashierList() {
  try {
    const raw = localStorage.getItem('sr12_cashiers_list_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const owner = (typeof appState !== 'undefined' && appState.storeSettings && appState.storeSettings.storeOwner) || 'Owner / Kepala Toko';
  return [
    { id: 'c-owner', name: owner, role: 'Owner / Kepala Toko', isOwner: true },
    { id: 'c-1', name: 'Siti Rahma', role: 'Kasir 1', isOwner: false },
    { id: 'c-2', name: 'Ahmad Fauzi', role: 'Kasir 2', isOwner: false }
  ];
}

function saveStoredCashierList(list) {
  try {
    localStorage.setItem('sr12_cashiers_list_v2', JSON.stringify(list));
  } catch (e) {}
}

function renderCashierSelectionDropdown() {
  const selectEl = document.getElementById('absensiSelectCashier');
  if (!selectEl) return;
  const list = getStoredCashierList();
  const currentVal = selectEl.value;

  selectEl.innerHTML = list.map(c => `
    <option value="${c.name}">${c.name} (${c.role || 'Kasir'})</option>
  `).join('') + `
    <option value="custom">✏️ + Ketik Nama Kasir Lainnya</option>
  `;

  if (currentVal && list.some(c => c.name === currentVal)) {
    selectEl.value = currentVal;
  }
  renderCashierManagerPanel();
}

function renderCashierManagerPanel() {
  const container = document.getElementById('cashierManagerListBody');
  if (!container) return;
  const list = getStoredCashierList();

  if (list.length === 0) {
    container.innerHTML = '<div style="color: #94a3b8; font-size: 0.74rem; padding: 6px;">Tidak ada kasir terdaftar.</div>';
    return;
  }

  container.innerHTML = list.map(c => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 6px; font-size: 0.78rem;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span>${c.isOwner ? '👑' : '👤'}</span>
        <b>${c.name}</b>
        <span style="color: #64748b; font-size: 0.7rem;">(${c.role || 'Kasir'})</span>
      </div>
      <div>
        ${!c.isOwner ? `
          <button type="button" onclick="deleteCashierOperator('${c.id}')" title="Hapus Kasir Ini" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
            <span>🗑️</span> Hapus
          </button>
        ` : `<span style="font-size: 0.7rem; color: #166534; font-weight: 700; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">Pemilik</span>`}
      </div>
    </div>
  `).join('');
}

function deleteCashierOperator(cashierId) {
  const list = getStoredCashierList();
  const found = list.find(c => c.id === cashierId);
  if (!found) return;
  if (found.isOwner) {
    alert('Nama pemilik toko tidak dapat dihapus.');
    return;
  }
  if (!confirm(`Hapus kasir "${found.name}" dari daftar operator toko?`)) return;

  const updated = list.filter(c => c.id !== cashierId);
  saveStoredCashierList(updated);
  renderCashierSelectionDropdown();
  showToast(`🗑️ Kasir "${found.name}" berhasil dihapus.`);
}
window.deleteCashierOperator = deleteCashierOperator;

function addNewCashierOperatorQuick() {
  const input = document.getElementById('inputNewCashierQuickName');
  const name = input?.value.trim();
  if (!name) {
    alert('Mohon masukkan nama kasir baru.');
    return;
  }
  const list = getStoredCashierList();
  if (list.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('Nama kasir ini sudah terdaftar.');
    return;
  }
  const newCashier = {
    id: 'c-' + Date.now(),
    name: name,
    role: `Kasir ${list.length}`,
    isOwner: false
  };
  list.push(newCashier);
  saveStoredCashierList(list);
  if (input) input.value = '';
  renderCashierSelectionDropdown();
  const selectEl = document.getElementById('absensiSelectCashier');
  if (selectEl) selectEl.value = name;
  showToast(`✅ Kasir baru "${name}" berhasil ditambahkan!`);
}
window.addNewCashierOperatorQuick = addNewCashierOperatorQuick;

function initCashierAttendanceState() {
  if (typeof appState === 'undefined') return;
  if (!appState.activeCashier) {
    appState.activeCashier = getStoredActiveCashier();
  }
  if (!appState.cashierAttendanceLog) {
    appState.cashierAttendanceLog = getStoredCashierAttendance();
  }
  renderCashierSelectionDropdown();
  updateCashierBadgeUI();
}

function switchAbsensiTab(tabId) {
  const tabs = ['status', 'form', 'log'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtnAbsensi${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const view = document.getElementById(`absensiView${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === tabId);
    if (view) view.style.display = (t === tabId) ? 'block' : 'none';
  });

  if (tabId === 'status') {
    renderAbsensiStatusView();
  } else if (tabId === 'form') {
    renderCashierSelectionDropdown();
  } else if (tabId === 'log') {
    renderAbsensiLogs();
  }
}

function handleSelectCashierPreset(val) {
  const customInput = document.getElementById('absensiInputCustomName');
  if (!customInput) return;
  if (val === 'custom') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
    customInput.value = '';
  }
}

function handleClockInSubmit(e) {
  if (e) e.preventDefault();
  const selectEl = document.getElementById('absensiSelectCashier');
  const customInput = document.getElementById('absensiInputCustomName');
  const shiftSelect = document.getElementById('absensiShiftSelect');
  const cashInput = document.getElementById('absensiOpeningCashInput');

  let chosenName = selectEl ? selectEl.value : 'Nurlinda Sari';
  if (chosenName === 'custom') {
    chosenName = customInput?.value.trim() || 'Kasir Pengganti';
  }
  const chosenShift = shiftSelect ? shiftSelect.value : 'Shift Pagi (08:00 - 15:00)';
  const openingCash = Math.max(0, parseInt(cashInput?.value, 10) || 100000);

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  // Simpan data kasir aktif baru
  appState.activeCashier = {
    name: chosenName,
    shift: chosenShift,
    clockInTime: timeStr,
    openingCash,
    trxCount: 0,
    totalSales: 0,
    cashSales: 0,
    nonCashSales: 0,
    status: 'Aktif'
  };
  saveStoredActiveCashier(appState.activeCashier);

  // Catat ke daftar log absensi
  if (!appState.cashierAttendanceLog) appState.cashierAttendanceLog = [];
  appState.cashierAttendanceLog.unshift({
    id: 'ABS-' + Math.floor(100 + Math.random() * 900),
    date: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,
    cashierName: chosenName,
    shift: chosenShift,
    clockIn: timeStr,
    clockOut: 'Sedang Berjalan',
    openingCash,
    totalSales: 0,
    status: 'Aktif'
  });
  saveStoredCashierAttendance(appState.cashierAttendanceLog);

  updateCashierBadgeUI();
  switchAbsensiTab('status');
  showToast(`✅ Absen Masuk Berhasil! Kasir: ${chosenName} (${chosenShift.split(' ')[0] || 'Shift'}).`);
}

function handleClockOutCashier() {
  if (!appState.activeCashier) return;
  const cashier = appState.activeCashier;
  const now = new Date();
  const timeOutStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  const expectedDrawer = (cashier.openingCash || 0) + (cashier.cashSales || 0);

  const confirmMsg = `Konfirmasi Tutup Shift Kasir?\n\n` +
    `• Kasir: ${cashier.name}\n` +
    `• Shift: ${cashier.shift}\n` +
    `• Jam Masuk: ${cashier.clockInTime}\n` +
    `• Jam Tutup: ${timeOutStr}\n` +
    `• Transaksi Sesi Ini: ${cashier.trxCount || 0} Trx\n` +
    `• Total Omset: Rp ${(cashier.totalSales || 0).toLocaleString('id-ID')}\n` +
    `• Modal Awal Kas: Rp ${(cashier.openingCash || 0).toLocaleString('id-ID')}\n` +
    `• Uang Tunai di Laci Kasir: Rp ${expectedDrawer.toLocaleString('id-ID')}\n\n` +
    `Apakah Anda ingin menyelesaikan rekap shift ini?`;

  if (!confirm(confirmMsg)) return;

  // Update log absensi terakhir
  if (appState.cashierAttendanceLog && appState.cashierAttendanceLog.length > 0) {
    const activeLog = appState.cashierAttendanceLog.find(l => l.cashierName === cashier.name && l.status === 'Aktif') || appState.cashierAttendanceLog[0];
    if (activeLog) {
      activeLog.clockOut = timeOutStr;
      activeLog.status = 'Selesai';
      activeLog.totalSales = cashier.totalSales || 0;
      activeLog.expectedDrawer = expectedDrawer;
    }
    saveStoredCashierAttendance(appState.cashierAttendanceLog);
  }

  // Tandai kasir selesai
  cashier.status = 'Selesai';
  saveStoredActiveCashier(cashier);

  showToast(`🏁 Shift Kasir "${cashier.name}" selesai. Uang laci diserahkan: Rp ${expectedDrawer.toLocaleString('id-ID')}.`);
  switchAbsensiTab('form');
}

function renderAbsensiStatusView() {
  const cashier = (typeof appState !== 'undefined' && appState.activeCashier) ? appState.activeCashier : getStoredActiveCashier();
  const nameEl = document.getElementById('absensiOperatorName');
  const shiftLabelEl = document.getElementById('absensiShiftLabel');
  const clockInEl = document.getElementById('absensiClockInTime');
  const openingCashEl = document.getElementById('absensiOpeningCash');
  const sessionTrxEl = document.getElementById('absensiSessionTrxCount');
  const cashSalesEl = document.getElementById('absensiCashSalesVal');
  const nonCashSalesEl = document.getElementById('absensiNonCashSalesVal');
  const expectedDrawerEl = document.getElementById('absensiExpectedDrawerCash');
  const statusBadge = document.getElementById('absensiStatusBadge');

  if (nameEl) nameEl.textContent = cashier.name || 'Nurlinda Sari';
  if (shiftLabelEl) shiftLabelEl.textContent = cashier.shift || 'Shift Pagi (08:00 - 15:00)';
  if (clockInEl) clockInEl.textContent = cashier.clockInTime || '08:00 WIB';
  if (openingCashEl) openingCashEl.textContent = `Rp ${(cashier.openingCash || 100000).toLocaleString('id-ID')}`;
  if (sessionTrxEl) sessionTrxEl.textContent = `${cashier.trxCount || 0} Transaksi`;
  if (cashSalesEl) cashSalesEl.textContent = `Rp ${(cashier.cashSales || 0).toLocaleString('id-ID')}`;
  if (nonCashSalesEl) nonCashSalesEl.textContent = `Rp ${(cashier.nonCashSales || 0).toLocaleString('id-ID')}`;

  const expectedDrawer = (cashier.openingCash || 0) + (cashier.cashSales || 0);
  if (expectedDrawerEl) expectedDrawerEl.textContent = `Rp ${expectedDrawer.toLocaleString('id-ID')}`;

  if (statusBadge) {
    if (cashier.status === 'Selesai') {
      statusBadge.style.background = '#f1f5f9';
      statusBadge.style.color = '#64748b';
      statusBadge.style.borderColor = '#cbd5e1';
      statusBadge.innerHTML = '⚪ Shift Ditutup';
    } else {
      statusBadge.style.background = '#dcfce7';
      statusBadge.style.color = '#166534';
      statusBadge.style.borderColor = '#86efac';
      statusBadge.innerHTML = '<span class="badge-online-dot"></span> Sedang Bertugas';
    }
  }
}

function renderAbsensiLogs() {
  const tbody = document.getElementById('absensiLogTableBody');
  if (!tbody || typeof appState === 'undefined') return;

  const logs = appState.cashierAttendanceLog || getStoredCashierAttendance();
  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">
          Belum ada riwayat shift tercatat.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const isAktif = l.status === 'Aktif';
    const statusHtml = isAktif
      ? `<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-weight: 800; font-size: 0.7rem;">🟢 Aktif</span>`
      : `<span style="background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 0.7rem;">✅ Ditutup</span>`;

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">${l.cashierName || '-'}</td>
        <td style="padding: 8px 10px; color: #475569;">${l.shift || '-'}</td>
        <td style="padding: 8px 10px; color: #64748b; font-size: 0.72rem;">${l.clockIn || '-'} &rarr; ${l.clockOut || '-'}</td>
        <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #059669;">Rp ${(l.totalSales || 0).toLocaleString('id-ID')}</td>
        <td style="padding: 8px 10px; text-align: center;">${statusHtml}</td>
        <td style="padding: 6px 8px; text-align: center; white-space: nowrap;">
          <button type="button" onclick="editAbsensiLog('${l.id}')" title="Edit Nama Kasir" style="background: #f1f5f9; color: #0284c7; border: 1px solid #cbd5e1; padding: 3px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; margin-right: 4px;">
            ✏️
          </button>
          <button type="button" onclick="deleteAbsensiLog('${l.id}')" title="Hapus Riwayat Shift" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 3px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function editActiveCashierName() {
  const cashier = (typeof appState !== 'undefined' && appState.activeCashier) ? appState.activeCashier : getStoredActiveCashier();
  const current = cashier.name || 'Kasir Toko';
  const newName = prompt('Ubah nama kasir / operator yang sedang bertugas:', current);
  if (newName && newName.trim()) {
    cashier.name = newName.trim();
    saveStoredActiveCashier(cashier);
    if (typeof appState !== 'undefined') appState.activeCashier = cashier;
    updateCashierBadgeUI();
    renderAbsensiStatusView();
    showToast(`✅ Nama kasir bertugas diubah menjadi: ${cashier.name}`);
  }
}
window.editActiveCashierName = editActiveCashierName;

function resetActiveCashierName() {
  const defaultName = (typeof appState !== 'undefined' && appState.storeSettings && appState.storeSettings.storeOwner) || 'Administrator Toko';
  if (confirm(`Reset nama kasir bertugas kembali ke nama pemilik toko ("${defaultName}")?`)) {
    const cashier = (typeof appState !== 'undefined' && appState.activeCashier) ? appState.activeCashier : getStoredActiveCashier();
    cashier.name = defaultName;
    saveStoredActiveCashier(cashier);
    if (typeof appState !== 'undefined') appState.activeCashier = cashier;
    updateCashierBadgeUI();
    renderAbsensiStatusView();
    showToast(`✅ Nama kasir bertugas direset ke: ${defaultName}`);
  }
}
window.resetActiveCashierName = resetActiveCashierName;

function editAbsensiLog(logId) {
  const logs = appState.cashierAttendanceLog || getStoredCashierAttendance();
  const log = logs.find(l => l.id === logId);
  if (!log) return;
  const newName = prompt(`Ubah nama kasir untuk data shift ini (${log.date}):`, log.cashierName || '');
  if (newName && newName.trim()) {
    log.cashierName = newName.trim();
    saveStoredCashierAttendance(logs);
    renderAbsensiLogs();
    showToast('✅ Data kasir shift berhasil diperbarui.');
  }
}
window.editAbsensiLog = editAbsensiLog;

function deleteAbsensiLog(logId) {
  const logs = appState.cashierAttendanceLog || getStoredCashierAttendance();
  const log = logs.find(l => l.id === logId);
  if (!log) return;
  if (!confirm(`Hapus catatan shift kasir "${log.cashierName}" (${log.shift})?`)) return;
  appState.cashierAttendanceLog = logs.filter(l => l.id !== logId);
  saveStoredCashierAttendance(appState.cashierAttendanceLog);
  renderAbsensiLogs();
  showToast('🗑️ Data shift kasir berhasil dihapus.');
}
window.deleteAbsensiLog = deleteAbsensiLog;

function clearAbsensiLogs() {
  if (!confirm('Yakin ingin membersihkan riwayat absensi shift yang tersimpan?')) return;
  appState.cashierAttendanceLog = [];
  saveStoredCashierAttendance([]);
  renderAbsensiLogs();
  showToast('🧹 Riwayat absensi shift telah dibersihkan.');
}

function updateCashierBadgeUI() {
  if (typeof appState === 'undefined') return;
  const cashier = appState.activeCashier || getStoredActiveCashier();
  const shiftText = cashier.shift?.includes('Pagi') ? 'Shift Pagi' : (cashier.shift?.includes('Sore') ? 'Shift Sore' : 'Full Day');

  const labelEl = document.getElementById('posActiveCashierLabel');
  if (labelEl) {
    labelEl.textContent = `Kasir: ${cashier.name || 'Nurlinda Sari'} (${shiftText})`;
  }

  // Update Topbar Active Cashier Pill (terlihat jelas di HP dan Desktop)
  const topbarCashier = document.getElementById('topbarActiveCashierName');
  if (topbarCashier) {
    topbarCashier.textContent = cashier.name || 'Nurlinda Sari';
  }

  // Update POS Register Header Cashier Card (terlihat jelas di atas keranjang kasir)
  const regCashier = document.getElementById('posRegisterCashierName');
  if (regCashier) {
    regCashier.textContent = cashier.name || 'Nurlinda Sari';
  }
  const regShift = document.getElementById('posRegisterShiftName');
  if (regShift) {
    regShift.textContent = shiftText;
  }

  updateOlseraHeaderMeta();
}

function openOlseraAbsensiModal() {
  closeOlseraSidebarDrawer();
  initCashierAttendanceState();
  switchAbsensiTab('status');
  const modal = document.getElementById('modalOlseraAbsensi');
  if (modal) modal.classList.add('open');
}

function openSwitchOperatorPrompt() {
  closeOlseraSidebarDrawer();
  initCashierAttendanceState();
  switchAbsensiTab('form');
  const modal = document.getElementById('modalOlseraAbsensi');
  if (modal) modal.classList.add('open');
}

function lockOlseraScreen() {
  closeOlseraSidebarDrawer();
  const modal = document.getElementById('modalOlseraLock');
  const input = document.getElementById('olseraUnlockPinInput');
  const err = document.getElementById('olseraUnlockPinError');
  if (input) input.value = '';
  if (err) err.style.display = 'none';
  if (modal) modal.classList.add('open');
  if (input) setTimeout(() => input.focus(), 200);
}

function unlockOlseraScreen() {
  const input = document.getElementById('olseraUnlockPinInput')?.value.trim();
  const err = document.getElementById('olseraUnlockPinError');
  const modal = document.getElementById('modalOlseraLock');
  const correctPin = (appState.storeSettings && appState.storeSettings.storeAdminPin) || '1234';
  const masterPin = appState.masterDevPin || '8899';

  if (input === correctPin || input === masterPin) {
    if (modal) modal.classList.remove('open');
    showToast('🔓 Layar POS Berhasil Dibuka Kembali!');
  } else {
    if (err) err.style.display = 'block';
  }
}

function openStoreSwitchDropdownFromDrawer() {
  closeOlseraSidebarDrawer();
  if (typeof openStoreSwitchModal === 'function') {
    openStoreSwitchModal();
  }
}

window.toggleOlseraMenuInFlow = toggleOlseraMenuInFlow;
window.toggleOlseraSidebarDrawer = toggleOlseraSidebarDrawer;
window.openOlseraSidebarDrawer = openOlseraSidebarDrawer;
window.closeOlseraSidebarDrawer = closeOlseraSidebarDrawer;
window.openOlseraAbsensiModal = openOlseraAbsensiModal;
window.openSwitchOperatorPrompt = openSwitchOperatorPrompt;
window.lockOlseraScreen = lockOlseraScreen;
window.unlockOlseraScreen = unlockOlseraScreen;
window.openStoreSwitchDropdownFromDrawer = openStoreSwitchDropdownFromDrawer;

// ==========================================
// 3. SWITCHER TAB MENU OLSERA DRAWER
// ==========================================
function switchOlseraTab(tabId) {
  if (typeof appState !== 'undefined') {
    appState.activeOlseraTab = tabId;
  }
  try {
    localStorage.setItem('sr12_active_olsera_tab', tabId);
    if (window.location.hash !== '#' + tabId) {
      history.replaceState(null, '', '#' + tabId);
    }
  } catch (e) {}

  // Sticky topbar HANYA saat di halaman Point of Sale (POS)
  if (tabId === 'pos') {
    document.body.classList.add('olsera-portal-pos-active');
  } else {
    document.body.classList.remove('olsera-portal-pos-active');
  }

  // Tutup drawer secara otomatis di mobile saat menu diklik
  closeOlseraSidebarDrawer();

  // Update active state on sidebar items
  const menuItems = document.querySelectorAll('.olsera-menu-item');
  menuItems.forEach(item => item.classList.remove('active'));

  const activeMenu = document.getElementById(`menuItem${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (activeMenu) activeMenu.classList.add('active');


  // Hide all view containers
  const views = [
    'olseraViewPos',
    'olseraViewTransactions',
    'olseraViewInventory',
    'olseraViewCashflow',
    'olseraViewReports',
    'olseraViewMitra',
    'olseraViewPending',
    'olseraViewMarketer',
    'olseraViewSettings'
  ];

  views.forEach(vId => {
    const el = document.getElementById(vId);
    if (el) el.style.display = 'none';
  });

  // Show active view
  const targetView = document.getElementById(`olseraView${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (targetView) targetView.style.display = 'block';

  const bBar = document.getElementById('posMobileBottomBar');
  if (bBar && tabId !== 'pos') {
    bBar.classList.remove('active');
    bBar.style.display = 'none';
  }

  // Render content according to tab
  switch (tabId) {
    case 'pos':
      filterPosBuyerTierByStoreRole();
      renderPosProducts();
      renderPosCart();
      break;
    case 'transactions':
      renderPosTransactions();
      break;
    case 'inventory':
      renderInventoryTable();
      break;
    case 'cashflow':
      renderCashflowTable();
      break;
    case 'reports':
      renderReportsView();
      break;
    case 'mitra':
      mountMitraInOlsera();
      break;
    case 'pending':
      renderOlseraPendingStores();
      break;
    case 'marketer':
      mountMarketerInOlsera();
      break;
    case 'settings':
      populateOlseraSettingsForm();
      break;
  }
}

function renderOlseraPendingStores() {
  const mount = document.getElementById('olseraPendingStoresMount');
  if (!mount || typeof appState === 'undefined') return;

  const currentDistSlug = (appState.storeSettings && appState.storeSettings.slug) || 'alzam-agency';
  const apps = (appState.pendingStoreApps || []).filter(a => {
    return a.recommenderSlug === currentDistSlug || a.recommenderDistributor?.toLowerCase().includes('alzam') || appState.isDevMasterLoggedIn;
  });

  if (apps.length === 0) {
    mount.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: #64748b;">
        <span style="font-size: 3rem; display: block; margin-bottom: 12px;">✨</span>
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 1.15rem; font-weight: 800;">Tidak Ada Antrean Pengajuan Toko Baru</h3>
        <p style="margin: 0; font-size: 0.86rem; color: #64748b; max-width: 480px; margin: 0 auto;">Semua permohonan pembukaan toko Agen yang memilih toko Anda sebagai Distributor Pembina telah selesai diverifikasi &amp; disetujui.</p>
      </div>
    `;
    return;
  }

  mount.innerHTML = `
    <div style="margin-bottom: 16px; font-size: 0.86rem; color: #475569;">
      Terdapat <b style="color: #d97706;">${apps.length} calon mitra</b> yang mengajukan pembukaan toko dan memilih toko Anda sebagai <b>Distributor Pembina</b>:
    </div>
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${apps.map(app => {
        const tierObj = (typeof SR12_TIERS !== 'undefined' && SR12_TIERS[app.partnerTier]) || { name: 'Agen Resmi' };
        return `
          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 14px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">${app.storeName}</h3>
                  <span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 800;">
                    👑 ${tierObj.name.toUpperCase()} (DISKON 40%)
                  </span>
                  <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; font-weight: 800;">
                    ⏳ Menunggu Persetujuan Anda
                  </span>
                </div>
                <div style="font-size: 0.82rem; color: #475569; margin-top: 6px;">
                  👤 Calon Pemilik: <b>${app.storeOwner}</b> &bull; 📍 Wilayah: <b>${app.storeCity}</b>
                </div>
                <div style="font-size: 0.8rem; color: #059669; font-weight: 700; margin-top: 3px;">
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
              <button type="button" onclick="rejectPendingStore('${app.id}'); renderOlseraPendingStores(); if(typeof updateDistributorPendingBadges==='function') updateDistributorPendingBadges();" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                ❌ Tolak Pengajuan
              </button>
              <button type="button" onclick="approvePendingStore('${app.id}'); renderOlseraPendingStores(); if(typeof updateDistributorPendingBadges==='function') updateDistributorPendingBadges();" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 9px 22px; border-radius: 8px; font-weight: 800; font-size: 0.84rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
                <span>✅</span> Setujui &amp; Aktifkan Toko Agen Ini
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
window.renderOlseraPendingStores = renderOlseraPendingStores;

// ==========================================
// 4. POINT OF SALE (POS) LOGIC
// ==========================================
function renderPosProducts(category = 'all', query = '') {
  const grid = document.getElementById('posProductGrid');
  if (!grid || typeof appState === 'undefined') return;

  const q = (query || appState.posSearchQuery || '').toLowerCase().trim();
  const cat = category || appState.posSelectedCategory || 'all';

  const filtered = (appState.products || []).filter(p => {
    const matchCat = (cat === 'all') || (p.category && p.category.toLowerCase().includes(cat.toLowerCase()));
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #94a3b8;">
        🔍 Tidak ada produk yang sesuai dengan pencarian "${q}".
      </div>
    `;
    return;
  }

  const tier = (typeof appState !== 'undefined' && appState.posBuyerTier) ? appState.posBuyerTier : 'konsumen';
  const discountPct = getPosTierDiscountPct(tier);
  const isRetail = tier === 'konsumen';

  grid.innerHTML = filtered.map(prod => {
    const thumb = prod.image || 'assets/hero-banner.jpg';
    const het = Number(prod.het || prod.price || prod.het_price) || 0;
    const tierPrice = Math.round(het * (1 - (discountPct / 100)));
    const profitMargin = het - tierPrice;
    const inCart = (appState.posCart || []).find(i => i.productId === prod.id);
    const inCartQty = inCart ? inCart.qty : 0;

    return `
      <div class="product-card ${inCartQty > 0 ? 'pos-card-active' : ''}" id="pos-card-${prod.id}">
        <div class="product-thumb-box" onclick="addPosCartItem('${prod.id}')" style="cursor: pointer;">
          <img src="${thumb}" alt="${prod.name}" loading="lazy" onerror="this.src='assets/hero-banner.jpg'" />
          <span class="badge-bpom-clean">🌿 BPOM</span>
          ${!isRetail ? `<span class="badge-disc-clean">-${discountPct}%</span>` : ''}
          <span class="badge-stock-clean ${(prod.stock ?? 85) <= 15 ? 'low' : ''}">Stok: ${prod.stock ?? 85}</span>
          ${inCartQty > 0 ? `<span class="pos-badge-qty-floating">✓ ${inCartQty} di Kasir</span>` : ''}
        </div>

        <div class="product-body">
          <div class="product-category-row">
            <span class="product-cat-name">${prod.category || 'SR12'}</span>
            <span class="product-rating">★ ${prod.rating || '4.9'}</span>
          </div>

          <h4 class="product-title" onclick="addPosCartItem('${prod.id}')" title="Klik untuk tambah ${prod.name} ke kasir">${prod.name}</h4>
          <p class="product-summary-text">${prod.summary || ''}</p>

          <div class="price-block" onclick="addPosCartItem('${prod.id}')" style="cursor: pointer;">
            <div class="price-main-row">
              <span class="tier-price-val">${formatRupiah(tierPrice)}</span>
              ${!isRetail ? `<span class="badge-mini-disc">-${discountPct}%</span>` : ''}
            </div>
            <div class="price-sub-row">
              ${!isRetail ? `
                <span class="het-text">HET: <del>${formatRupiah(het)}</del></span>
                <span class="tier-profit-margin">+Profit ${formatRupiah(profitMargin)}</span>
              ` : `
                <span class="het-text-plain">HET Resmi</span>
              `}
            </div>
          </div>

          <div class="card-actions">
            <button type="button" class="btn-add-cart ${inCartQty > 0 ? 'btn-pos-active' : ''}" onclick="addPosCartItem('${prod.id}')" title="Tambah ${prod.name} ke Kasir">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span class="btn-add-cart-text">${inCartQty > 0 ? `✓ ${inCartQty}` : 'Kasir'}</span>
            </button>
            <button type="button" class="btn-detail-preview" title="Lihat Detail & Khasiat" onclick="openProductDetailModal('${prod.id}')">
              👁️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handlePosSearch(val) {
  if (typeof appState !== 'undefined') {
    appState.posSearchQuery = val;
    renderPosProducts(appState.posSelectedCategory, val);
  }
}

function filterPosCategory(category, btn) {
  if (typeof appState !== 'undefined') {
    appState.posSelectedCategory = category;
  }
  const buttons = document.querySelectorAll('.pos-toolbar .chip-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  renderPosProducts(category, appState ? appState.posSearchQuery : '');
}

function addPosCartItem(productId) {
  if (typeof appState === 'undefined') return;
  const prod = (appState.products || []).find(p => p.id === productId);
  if (!prod) return;

  const existing = (appState.posCart || []).find(item => item.productId === productId);
  let currentQty = 1;
  if (existing) {
    existing.qty += 1;
    currentQty = existing.qty;
  } else {
    if (!appState.posCart) appState.posCart = [];
    appState.posCart.push({
      productId: prod.id,
      name: prod.name,
      netto: prod.netto || (prod.weightGram ? prod.weightGram + 'g' : 'Original'),
      price: Number(prod.het || prod.price || prod.het_price) || 0,
      qty: 1
    });
  }

  renderPosCart();
  renderPosProducts();

  const totalQty = (appState.posCart || []).reduce((acc, it) => acc + it.qty, 0);
  if (typeof showToast === 'function') {
    showToast(`🛒 "${prod.name}" (${currentQty} pcs) masuk kasir! Total: ${totalQty} item`);
  }
}

function updatePosCartQty(productId, delta) {
  if (typeof appState === 'undefined' || !appState.posCart) return;
  const item = appState.posCart.find(i => i.productId === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    appState.posCart = appState.posCart.filter(i => i.productId !== productId);
  }

  renderPosCart();
  renderPosProducts();
}

function removePosCartItem(productId) {
  if (typeof appState === 'undefined' || !appState.posCart) return;
  appState.posCart = appState.posCart.filter(i => i.productId !== productId);
  renderPosCart();
  renderPosProducts();
}

function clearPosCart() {
  if (typeof appState !== 'undefined') {
    appState.posCart = [];
    renderPosCart();
    renderPosProducts();
    const cInput = document.getElementById('posCashTendered');
    if (cInput) cInput.value = '';
    const chVal = document.getElementById('posChangeVal');
    if (chVal) chVal.textContent = 'Rp 0';
    const bBar = document.getElementById('posMobileBottomBar');
    if (bBar) {
      bBar.classList.remove('active');
      bBar.style.display = 'none';
    }
    if (typeof showToast === 'function') {
      showToast('🗑️ Keranjang kasir telah dikosongkan.');
    }
  }
}

function handlePosBuyerTierChange(tier) {
  if (typeof appState !== 'undefined') {
    appState.posBuyerTier = tier;
    renderPosCart();
    renderPosProducts();
  }
}

function getPosTierDiscountPct(tier) {
  switch (tier) {
    case 'reseller': return 20;
    case 'sub_agen': return 30;
    case 'agen': return 40;
    case 'marketer': return 0; // Marketer bayar HET, komisi 15% dicatat terpisah
    default: return 0; // Konsumen Retail (0%)
  }
}

function renderPosCart() {
  const listEl = document.getElementById('posCartList');
  const subtotalHetEl = document.getElementById('posSubtotalHet');
  const discountLabelEl = document.getElementById('posDiscountLabel');
  const discountValEl = document.getElementById('posDiscountVal');
  const grandTotalEl = document.getElementById('posGrandTotal');

  if (!listEl || typeof appState === 'undefined') return;

  const cart = appState.posCart || [];
  const tier = appState.posBuyerTier || 'konsumen';
  const discountPct = getPosTierDiscountPct(tier);

  if (cart.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 30px 10px; font-size: 0.85rem;">
        🛒 Belum ada barang dipilih.<br>Klik produk di sebelah kiri untuk menambah ke kasir.
      </div>
    `;
    if (subtotalHetEl) subtotalHetEl.textContent = 'Rp 0';
    if (discountValEl) discountValEl.textContent = '- Rp 0';
    if (grandTotalEl) grandTotalEl.textContent = 'Rp 0';
    calculatePosChange();
    const bBar = document.getElementById('posMobileBottomBar');
    if (bBar) {
      bBar.classList.remove('active');
      bBar.style.display = 'none';
    }
    return;
  }

  let subtotalHet = 0;

  listEl.innerHTML = cart.map(item => {
    const itemSub = item.price * item.qty;
    subtotalHet += itemSub;

    return `
      <div class="pos-cart-item">
        <div style="flex: 1; min-width: 0; padding-right: 8px;">
          <div style="font-weight: 700; font-size: 0.82rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.name}
          </div>
          <div style="font-size: 0.72rem; color: #64748b;">
            @ Rp ${item.price.toLocaleString('id-ID')} &middot; ${item.netto}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          <button type="button" onclick="updatePosCartQty('${item.productId}', -1)" style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-weight: 800; font-size: 0.8rem;">-</button>
          <span style="font-weight: 800; font-size: 0.82rem; width: 22px; text-align: center;">${item.qty}</span>
          <button type="button" onclick="updatePosCartQty('${item.productId}', 1)" style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-weight: 800; font-size: 0.8rem;">+</button>
        </div>

        <div style="font-weight: 800; font-size: 0.82rem; color: #0284c7; width: 75px; text-align: right;">
          Rp ${itemSub.toLocaleString('id-ID')}
        </div>

        <button type="button" onclick="removePosCartItem('${item.productId}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; padding: 0 4px;" title="Hapus">
          &times;
        </button>
      </div>
    `;
  }).join('');

  const discountAmount = Math.round(subtotalHet * (discountPct / 100));
  const grandTotal = Math.max(0, subtotalHet - discountAmount);

  if (subtotalHetEl) subtotalHetEl.textContent = `Rp ${subtotalHet.toLocaleString('id-ID')}`;
  if (discountLabelEl) {
    discountLabelEl.textContent = discountPct > 0 
      ? `Diskon ${discountPct}% (${tier.toUpperCase()}):` 
      : (tier === 'marketer' ? 'Komisi Marketer (15% dihitung):' : 'Diskon Mitra:');
  }
  if (discountValEl) {
    if (tier === 'marketer') {
      const comm = Math.round(subtotalHet * 0.15);
      discountValEl.textContent = `+ Rp ${comm.toLocaleString('id-ID')} (Bonus)`;
      discountValEl.style.color = '#0284c7';
    } else {
      discountValEl.textContent = `- Rp ${discountAmount.toLocaleString('id-ID')}`;
      discountValEl.style.color = '#059669';
    }
  }
  if (grandTotalEl) grandTotalEl.textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;

  calculatePosChange();

  // Floating Mobile Bottom Cart Bar for POS
  const bBar = document.getElementById('posMobileBottomBar');
  const totalQty = (cart || []).reduce((acc, it) => acc + it.qty, 0);
  const anyModalOpen = document.querySelectorAll('.modal-backdrop.open').length > 0;
  if (bBar) {
    if (totalQty > 0 && !anyModalOpen && (typeof appState === 'undefined' || appState.activeOlseraTab === 'pos')) {
      bBar.classList.add('active');
      bBar.style.display = 'flex';
      const qtyEl = document.getElementById('posBottomBarQty');
      const totEl = document.getElementById('posBottomBarTotal');
      if (qtyEl) qtyEl.innerHTML = `🛒 <b>${totalQty} item</b>`;
      if (totEl) totEl.textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    } else {
      bBar.classList.remove('active');
      bBar.style.display = 'none';
    }
  }
}

function togglePosCashInput(isCash) {
  if (typeof appState !== 'undefined') {
    appState.posPayMethod = isCash ? 'cash' : 'transfer';
  }
  const cashBox = document.getElementById('posCashBox');
  if (cashBox) {
    cashBox.style.display = isCash ? 'block' : 'none';
  }
  calculatePosChange();
}

function calculatePosChange() {
  const grandTotalEl = document.getElementById('posGrandTotal');
  const cashInput = document.getElementById('posCashTendered');
  const changeValEl = document.getElementById('posChangeVal');
  if (!grandTotalEl || !cashInput || !changeValEl || typeof appState === 'undefined') return;

  const totalRaw = parseInt(grandTotalEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
  const cashTendered = parseInt(cashInput.value, 10) || 0;

  if (cashTendered >= totalRaw && totalRaw > 0) {
    const diff = cashTendered - totalRaw;
    changeValEl.textContent = `Rp ${diff.toLocaleString('id-ID')}`;
    changeValEl.style.color = '#059669';
  } else {
    changeValEl.textContent = 'Rp 0';
    changeValEl.style.color = '#64748b';
  }
}

// Checkout POS
function processPosCheckout(action = 'save') {
  if (typeof appState === 'undefined') return;
  const cart = appState.posCart || [];
  if (cart.length === 0) {
    showToast('⚠️ Keranjang kasir masih kosong!');
    return;
  }

  const grandTotalEl = document.getElementById('posGrandTotal');
  const subtotalHetEl = document.getElementById('posSubtotalHet');
  const discountValEl = document.getElementById('posDiscountVal');
  const grandTotal = parseInt(grandTotalEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
  const subtotalHet = parseInt(subtotalHetEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
  const discountAmount = Math.max(0, subtotalHet - grandTotal);

  const customerName = (document.getElementById('posCustomerName')?.value.trim()) || 'Pembeli Langsung (Kasir)';
  const customerPhone = (document.getElementById('posCustomerPhone')?.value.trim()) || '';
  const tier = appState.posBuyerTier || 'konsumen';

  const isCash = !document.querySelector('input[name="posPayMethod"][value="transfer"]:checked');
  const cashInputVal = parseInt(document.getElementById('posCashTendered')?.value, 10) || 0;
  const cashTendered = isCash ? (cashInputVal > 0 ? cashInputVal : grandTotal) : grandTotal;
  const changeAmount = isCash ? Math.max(0, cashTendered - grandTotal) : 0;

  const trxId = 'TRX-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const activeCashier = (typeof appState !== 'undefined' && appState.activeCashier) ? appState.activeCashier : getStoredActiveCashier();

  const newTrx = {
    id: trxId,
    dateTime: dateStr,
    customerName,
    customerPhone,
    cashierName: activeCashier.name || 'Nurlinda Sari',
    shift: activeCashier.shift || 'Shift Pagi',
    tier,
    tierLabel: getTierLabelName(tier),
    items: cart.map(i => ({
      name: i.name,
      qty: i.qty,
      price: i.price,
      subtotal: i.price * i.qty
    })),
    subtotalHet,
    discountAmount,
    grandTotal,
    paymentMethod: isCash ? 'CASH' : 'TRANSFER',
    cashTendered,
    changeAmount,
    status: 'Lunas'
  };

  // Simpan ke riwayat transaksi
  if (!appState.transactions) appState.transactions = [];
  appState.transactions.unshift(newTrx);
  saveStoredTransactions(appState.transactions);

  // Update akumulasi penjualan sesi shift kasir aktif
  if (appState.activeCashier) {
    appState.activeCashier.trxCount = (appState.activeCashier.trxCount || 0) + 1;
    appState.activeCashier.totalSales = (appState.activeCashier.totalSales || 0) + grandTotal;
    if (isCash) {
      appState.activeCashier.cashSales = (appState.activeCashier.cashSales || 0) + grandTotal;
    } else {
      appState.activeCashier.nonCashSales = (appState.activeCashier.nonCashSales || 0) + grandTotal;
    }
    saveStoredActiveCashier(appState.activeCashier);
    updateCashierBadgeUI();
  }

  // Catat arus kas masuk terpisah akun (Kas Tunai Laci vs Transfer Bank)
  if (!appState.cashflow) appState.cashflow = [];
  appState.cashflow.unshift({
    id: 'CSH-' + Math.floor(1000 + Math.random() * 9000),
    date: dateStr.split(' ')[0],
    type: 'in',
    account: isCash ? 'CASH' : 'TRANSFER',
    category: `Penjualan Kasir POS (${getTierLabelName(tier)})`,
    notes: `${trxId} - ${customerName} (${cart.length} macam barang) [${isCash ? 'Kas Tunai Laci' : 'Transfer Bank'}]`,
    amount: grandTotal
  });
  saveStoredCashflow(appState.cashflow);

  // PENGURANGAN STOK FISIK GUDANG & PENCATATAN MUTASI STOK OTOMATIS
  if (Array.isArray(appState.products)) {
    cart.forEach(item => {
      const p = appState.products.find(pr => pr.name === item.name || pr.id === item.id);
      if (p) {
        const oldStock = Number(p.stock) || 0;
        const qtySold = Number(item.qty) || 0;
        const newStock = Math.max(0, oldStock - qtySold);
        p.stock = newStock;
        p.sold = (Number(p.sold) || 0) + qtySold;
        if (typeof recordStockMutation === 'function') {
          recordStockMutation({
            date: dateStr,
            productId: p.id,
            productName: p.name,
            type: 'OUT_POS',
            typeLabel: 'Penjualan Kasir POS',
            qty: -qtySold,
            stockBefore: oldStock,
            stockAfter: newStock,
            refNo: trxId,
            notes: `Penjualan kasir tingkat ${getTierLabelName(tier)} kepada ${customerName}`
          });
        }
      }
    });
    if (typeof window.saveStoredProducts === 'function') {
      window.saveStoredProducts(appState.products);
    }
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderPosProductCatalog === 'function') renderPosProductCatalog();
    if (typeof renderInventoryTable === 'function') renderInventoryTable();
  }

  // Potong kuota order platform
  if (appState.storeSettings) {
    if (appState.storeSettings.orderQuota > 0) {
      appState.storeSettings.orderQuota -= 1;
    }
    appState.storeSettings.totalTx = (appState.storeSettings.totalTx || 0) + 1;
    saveStoredPartnerStores(appState.partnerStores);
    updateStoreQuotaUI();
  }

  // Jika Marketer: otomatis catat ke buku komisi 15% bulanan
  if (tier === 'marketer') {
    const marketerComm = Math.round(subtotalHet * 0.15);
    const mSale = {
      orderId: 'ORD-MKT-' + Math.floor(100 + Math.random() * 900),
      marketerId: 'MKT-001',
      date: dateStr.split(' ')[0],
      monthPeriod: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`,
      customerName,
      customerPhone,
      itemsDesc: cart.map(i => `${i.qty}x ${i.name}`).join(', '),
      omsetHet: subtotalHet,
      commissionPct: 15,
      commissionAmount: marketerComm,
      paidStatus: 'unpaid',
      paidDate: null
    };
    if (!appState.marketerSales) appState.marketerSales = [];
    appState.marketerSales.unshift(mSale);
    saveStoredMarketerSales(appState.marketerSales);
  }

  // Simpan objek untuk cetak nota
  appState.posCurrentTrx = newTrx;

  showToast(`✅ Transaksi ${trxId} Berhasil Disimpan! Total: Rp ${grandTotal.toLocaleString('id-ID')}`);

  if (action === 'print') {
    openPosReceiptModal(newTrx);
    setTimeout(() => {
      printPosReceiptWindow();
    }, 400);
  } else if (action === 'whatsapp') {
    openPosReceiptModal(newTrx);
    sendPosReceiptViaWhatsApp();
  }

  // Reset Kasir
  clearPosCart();
  document.getElementById('posCustomerName').value = '';
  document.getElementById('posCustomerPhone').value = '';
}

function getTierLabelName(tier) {
  switch (tier) {
    case 'reseller': return 'Reseller Resmi (20%)';
    case 'sub_agen': return 'Sub Agen (30%)';
    case 'agen': return 'Agen Resmi (40%)';
    case 'marketer': return 'Tim Marketer (15%)';
    default: return 'Konsumen Retail (HET)';
  }
}

// Modal Struk Nota POS
// Modal Struk Nota POS & Online Order
function openPosReceiptModal(trx) {
  if (!trx) return;
  try {
    const store = (typeof appState !== 'undefined' && appState.storeSettings) || {};
    
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl('rcptStoreName', store.storeName || 'Aisyah SR12 Hub');
    setEl('rcptStoreTagline', store.storeTagline || 'Distributor Resmi SR12 Wilayah Jawa Barat');
    setEl('rcptStoreAddress', `${store.storeCity || 'Bandung'} · WA: ${store.storeWaNumber || '6281234567890'}`);

    setEl('rcptTrxId', trx.id || '-');
    setEl('rcptDateTime', trx.dateTime || '-');
    setEl('rcptCashier', trx.cashierName || (typeof appState !== 'undefined' && appState.activeCashier ? appState.activeCashier.name : 'Nurlinda Sari'));
    setEl('rcptCustomer', trx.customerName || '-');
    setEl('rcptTier', trx.tierLabel || 'Retail');

    const items = trx.items || [];
    const tbody = document.getElementById('rcptItemsBody');
    if (tbody) {
      tbody.innerHTML = items.map(i => {
        const price = Number(i.price) || 0;
        const subtotal = Number(i.subtotal) || (price * (Number(i.qty) || 1));
        return `
          <tr>
            <td style="padding: 4px 0;">${i.name || 'Produk SR12'}</td>
            <td style="text-align: center; padding: 4px 0;">${i.qty || 1}</td>
            <td style="text-align: right; padding: 4px 0;">Rp ${price.toLocaleString('id-ID')}</td>
            <td style="text-align: right; padding: 4px 0; font-weight: 700;">Rp ${subtotal.toLocaleString('id-ID')}</td>
          </tr>
        `;
      }).join('');
    }

    const subtotalVal = Number(trx.subtotalHet) || Number(trx.grandTotal) || 0;
    const discountVal = Number(trx.discountAmount) || 0;
    const grandTotalVal = Number(trx.grandTotal) || 0;
    const cashVal = typeof trx.cashTendered === 'number' ? trx.cashTendered : grandTotalVal;
    const changeVal = typeof trx.changeAmount === 'number' ? trx.changeAmount : 0;

    setEl('rcptSubtotal', `Rp ${subtotalVal.toLocaleString('id-ID')}`);
    setEl('rcptDiscount', discountVal > 0 ? `- Rp ${discountVal.toLocaleString('id-ID')}` : 'Rp 0');
    setEl('rcptGrandTotal', `Rp ${grandTotalVal.toLocaleString('id-ID')}`);
    setEl('rcptMethod', trx.paymentMethod || 'TRANSFER / ONLINE');
    setEl('rcptCash', `Rp ${cashVal.toLocaleString('id-ID')}`);
    setEl('rcptChange', `Rp ${changeVal.toLocaleString('id-ID')}`);

    const modal = document.getElementById('modalPosReceipt');
    if (modal) {
      modal.classList.add('open');
      modal.style.zIndex = '100060';
    }
  } catch (err) {
    console.error('Error opening receipt modal:', err);
    const modal = document.getElementById('modalPosReceipt');
    if (modal) {
      modal.classList.add('open');
      modal.style.zIndex = '100060';
    }
  }
}

function printPosReceiptWindow() {
  const printArea = document.getElementById('posReceiptPrintArea');
  if (!printArea) return;

  const printWindow = window.open('', '_blank', 'width=450,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Struk Nota SR12</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 15px; color: #000; }
          table { width: 100%; border-collapse: collapse; }
          td, th { padding: 4px 0; }
          @media print {
            body { width: 100%; padding: 0; }
          }
        </style>
      </head>
      <body>
        ${printArea.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

function sendPosReceiptViaWhatsApp() {
  const trx = (typeof appState !== 'undefined' && appState.posCurrentTrx);
  if (!trx) return;

  const rawPhone = trx.customerPhone || '';
  const cleanPhone = (typeof formatWaNumber === 'function')
    ? formatWaNumber(rawPhone)
    : (rawPhone ? String(rawPhone).replace(/[^0-9]/g, '').replace(/^0/, '62') : '');
  const store = appState.storeSettings || {};

  let msg = `*🧾 NOTA TRANSAKSI RESMI - ${store.storeName || 'SR12 Partner Store'}*\n`;
  msg += `_Distributor Resmi SR12 Wilayah ${store.storeCity || 'Indonesia'}_\n`;
  msg += `----------------------------------------\n`;
  msg += `No. Nota: *${trx.id || '-'}*\n`;
  msg += `Tanggal: ${trx.dateTime || '-'}\n`;
  msg += `Kasir: *${trx.cashierName || (typeof appState !== 'undefined' && appState.activeCashier ? appState.activeCashier.name : 'Nurlinda Sari')}*\n`;
  msg += `Pelanggan: *${trx.customerName || '-'}* (${trx.tierLabel || 'Retail'})\n`;
  msg += `----------------------------------------\n`;
  msg += `*DAFTAR PRODUK:*\n`;

  const items = trx.items || [];
  items.forEach((item, idx) => {
    const price = Number(item.price) || 0;
    const subtotal = Number(item.subtotal) || (price * (Number(item.qty) || 1));
    msg += `${idx + 1}. ${item.name || 'Produk'}\n   ${item.qty || 1} pcs x Rp ${price.toLocaleString('id-ID')} = *Rp ${subtotal.toLocaleString('id-ID')}*\n`;
  });

  const subtotalVal = Number(trx.subtotalHet) || Number(trx.grandTotal) || 0;
  const discountVal = Number(trx.discountAmount) || 0;
  const grandTotalVal = Number(trx.grandTotal) || 0;

  msg += `----------------------------------------\n`;
  msg += `Subtotal HET: Rp ${subtotalVal.toLocaleString('id-ID')}\n`;
  if (discountVal > 0) {
    msg += `Diskon Kemitraan: -Rp ${discountVal.toLocaleString('id-ID')}\n`;
  }
  msg += `*TOTAL BAYAR: Rp ${grandTotalVal.toLocaleString('id-ID')}*\n`;
  msg += `Metode: ${trx.paymentMethod || 'TRANSFER / ONLINE'} (LUNAS)\n`;
  msg += `----------------------------------------\n`;
  msg += `_Terima kasih telah berbelanja produk asli SR12 Herbal Skin Care terverifikasi BPOM & Halal MUI!_`;

  const encoded = encodeURIComponent(msg);
  const waTarget = cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(waTarget, '_blank');
}

// ==========================================
// 5. TRANSAKSI (RIWAYAT ORDER) LOGIC
// ==========================================
function renderPosTransactions(filter = 'all') {
  const tbody = document.getElementById('posTransactionsTableBody');
  const omsetEl = document.getElementById('trxTotalOmsetVal');
  const countEl = document.getElementById('trxSuccessCountVal');
  const todayCountEl = document.getElementById('trxTodayCountVal');
  if (!tbody || typeof appState === 'undefined') return;

  const list = appState.transactions || [];
  const nowStr = new Date().toISOString().split('T')[0];

  let totalOmset = 0;
  let todayCount = 0;

  list.forEach(t => {
    totalOmset += Number(t.grandTotal) || 0;
    if (t.dateTime && t.dateTime.startsWith(nowStr)) {
      todayCount += 1;
    }
  });

  if (omsetEl) omsetEl.textContent = `Rp ${totalOmset.toLocaleString('id-ID')}`;
  if (countEl) countEl.textContent = `${list.length} Order`;
  if (todayCountEl) todayCountEl.textContent = `${todayCount} Order`;

  let filtered = list;
  if (filter === 'today') {
    filtered = list.filter(t => t.dateTime && t.dateTime.startsWith(nowStr));
  } else if (filter === 'month') {
    const curMonth = nowStr.substring(0, 7);
    filtered = list.filter(t => t.dateTime && t.dateTime.startsWith(curMonth));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">
          📅 Belum ada transaksi untuk filter ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    return `
      <tr>
        <td data-label="No. Transaksi"><b>${t.id}</b></td>
        <td data-label="Waktu" style="font-size: 0.8rem; color: #64748b;">${t.dateTime}</td>
        <td data-label="Pembeli">
          <b>${t.customerName}</b>
          ${t.customerPhone ? `<div style="font-size: 0.72rem; color: #0284c7;">${t.customerPhone}</div>` : ''}
        </td>
        <td data-label="Tingkat"><span class="badge-crm" style="background: #e0f2fe; color: #0369a1;">${t.tierLabel}</span></td>
        <td data-label="Total Bayar" style="font-weight: 800; color: #0f172a;">Rp ${Number(t.grandTotal).toLocaleString('id-ID')}</td>
        <td data-label="Metode"><span style="font-size: 0.76rem; font-weight: 700; color: #475569;">${t.paymentMethod}</span></td>
        <td data-label="Status">
          ${t.status === 'Menunggu Konfirmasi'
            ? `<span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">🟡 Menunggu Konfirmasi</span>`
            : t.status === 'Siap Diambil di Toko'
              ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">🏪 Siap Diambil</span>`
              : `<span style="background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">✅ ${t.status}</span>`}
        </td>
        <td data-label="Aksi" style="text-align: center; white-space: nowrap;">
          <button onclick="viewHistoricalReceipt('${t.id}')" style="background: #0284c7; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; margin-right: 4px;" title="Lihat Struk / Nota Rincian">
            📄 Struk
          </button>
          ${(t.status === 'Menunggu Konfirmasi' || t.status === 'Siap Diambil di Toko') ? `
            <button onclick="confirmWebOrder('${t.id}')" style="background: #059669; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;" title="Tandai pesanan telah selesai / lunas">
              ✅ Konfirmasi
            </button>
          ` : ''}
          <button onclick="deleteTransactionEntry('${t.id}')" style="background: none; border: none; color: #ef4444; font-size: 0.85rem; cursor: pointer; margin-left: 6px;" title="Hapus Riwayat Transaksi Ini">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function confirmWebOrder(trxId) {
  if (typeof appState === 'undefined') return;
  const trx = (appState.transactions || []).find(t => t.id === trxId);
  if (!trx) return;
  if (trx.status === 'Lunas / Selesai') {
    showToast(`Pesanan ${trxId} sudah berstatus lunas.`);
    return;
  }
  trx.status = 'Lunas / Selesai';
  saveStoredTransactions(appState.transactions);
  renderPosTransactions();

  // Catat arus kas masuk ke rekening bank begitu pesanan web diverifikasi & dikonfirmasi oleh pemilik/admin
  if (!appState.cashflow) appState.cashflow = [];
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  appState.cashflow.unshift({
    id: 'CSH-' + Math.floor(1000 + Math.random() * 9000),
    date: dateStr,
    type: 'in',
    account: 'TRANSFER',
    category: `Penjualan Toko Online (${trx.tierLabel || 'Retail'})`,
    notes: `${trx.id} - ${trx.customerName} (${trx.paymentMethod}) [Transfer Bank Terverifikasi]`,
    amount: Number(trx.grandTotal) || 0
  });
  saveStoredCashflow(appState.cashflow);
  renderCashflowTable();
  if (typeof renderReportsView === 'function') renderReportsView();

  if (typeof showToast === 'function') {
    showToast(`✅ Pesanan ${trxId} (${trx.customerName}) dikonfirmasi lunas! Saldo Bank bertambah Rp ${Number(trx.grandTotal).toLocaleString('id-ID')}`);
  }
}
window.confirmWebOrder = confirmWebOrder;

function deleteTransactionEntry(trxId) {
  if (typeof appState === 'undefined') return;
  if (!confirm(`⚠️ Hapus riwayat transaksi ${trxId}?`)) return;
  appState.transactions = (appState.transactions || []).filter(t => t.id !== trxId);
  saveStoredTransactions(appState.transactions);
  renderPosTransactions();
  if (typeof updateAdminNotificationUI === 'function') updateAdminNotificationUI();
  if (typeof showToast === 'function') showToast(`🗑️ Transaksi ${trxId} telah dihapus.`);
}
window.deleteTransactionEntry = deleteTransactionEntry;

function clearAllTransactionsHistory() {
  if (!confirm('⚠️ Anda yakin ingin mengosongkan seluruh Riwayat Transaksi Kasir POS & Pesanan Web?\n\nSemua riwayat transaksi akan dihapus untuk simulasi baru.')) {
    return;
  }
  appState.transactions = [];
  saveStoredTransactions([]);
  renderPosTransactions('all');
  if (typeof updateAdminNotificationUI === 'function') updateAdminNotificationUI();
  if (typeof showToast === 'function') showToast('🗑️ Seluruh Riwayat Transaksi berhasil dikosongkan!');
}
window.clearAllTransactionsHistory = clearAllTransactionsHistory;

function filterTransactions(f) {
  ['btnTrxAll', 'btnTrxToday', 'btnTrxMonth'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });

  if (f === 'today') document.getElementById('btnTrxToday')?.classList.add('active');
  else if (f === 'month') document.getElementById('btnTrxMonth')?.classList.add('active');
  else document.getElementById('btnTrxAll')?.classList.add('active');

  renderPosTransactions(f);
}

function viewHistoricalReceipt(trxId) {
  if (typeof appState === 'undefined') return;
  let list = appState.transactions;
  if (!list || list.length === 0) {
    list = typeof getStoredTransactions === 'function' ? getStoredTransactions() : [];
    appState.transactions = list;
  }
  const trx = (list || []).find(t => t.id === trxId);
  if (!trx) {
    alert(`Pesanan ${trxId} tidak ditemukan.`);
    return;
  }
  appState.posCurrentTrx = trx;
  openPosReceiptModal(trx);
}
window.viewHistoricalReceipt = viewHistoricalReceipt;

// ==========================================
// 6. INVENTORI (KATALOG & STOK GUDANG) LOGIC
// ==========================================
function filterPosBuyerTierByStoreRole() {
  const select = document.getElementById('posBuyerTierSelect');
  if (!select || typeof appState === 'undefined') return;
  const storeTier = (appState.storeSettings && appState.storeSettings.partnerTier) || 'distributor';
  const currentVal = select.value;

  let optionsHtml = '';
  if (storeTier === 'agen') {
    // Toko Agen Resmi: Tidak ada pilihan Agen atau Distributor
    optionsHtml = `
      <option value="konsumen">👤 Konsumen Retail Umum (HET)</option>
      <option value="reseller">🌿 Reseller Resmi (Diskon 20%)</option>
      <option value="sub_agen">🏢 Sub Agen SR12 (Diskon 30%)</option>
      <option value="marketer">💼 Tim Marketer (15% Komisi)</option>
    `;
  } else if (storeTier === 'sub_agen') {
    // Toko Sub Agen: Tidak ada pilihan Sub Agen, Agen, atau Distributor
    optionsHtml = `
      <option value="konsumen">👤 Konsumen Retail Umum (HET)</option>
      <option value="reseller">🌿 Reseller Resmi (Diskon 20%)</option>
      <option value="marketer">💼 Tim Marketer (15% Komisi)</option>
    `;
  } else {
    // Toko Distributor Utama: Menjual ke seluruh tingkatan
    optionsHtml = `
      <option value="konsumen">👤 Konsumen Retail Umum (HET)</option>
      <option value="reseller">🌿 Reseller Resmi (Diskon 20%)</option>
      <option value="sub_agen">🏢 Sub Agen SR12 (Diskon 30%)</option>
      <option value="agen">👑 Agen Resmi SR12 (Diskon 40%)</option>
      <option value="marketer">💼 Tim Marketer (15% Komisi)</option>
    `;
  }
  select.innerHTML = optionsHtml;
  if (Array.from(select.options).some(o => o.value === currentVal)) {
    select.value = currentVal;
  } else {
    select.value = 'konsumen';
  }
}
window.filterPosBuyerTierByStoreRole = filterPosBuyerTierByStoreRole;

function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody || typeof appState === 'undefined') return;

  const prods = appState.products || [];
  const storeTier = (appState.storeSettings && appState.storeSettings.partnerTier) || 'distributor';

  // Render header tabel inventori dinamis sesuai tingkatan toko:
  // - Distributor: HET, Reseller (20%), Sub Agen (30%), Agen (40%)
  // - Agen: HET, Reseller (20%), Sub Agen (30%) -> TIDAK ADA Harga Distributor
  // - Sub Agen: HET, Reseller (20%) -> TIDAK ADA Harga Distributor & Agen
  const thead = document.getElementById('inventoryTableHead');
  if (thead) {
    if (storeTier === 'agen') {
      thead.innerHTML = `
        <tr>
          <th>Produk SR12</th>
          <th>Netto</th>
          <th>Kategori</th>
          <th>Harga HET</th>
          <th>Reseller (20%)</th>
          <th>Sub Agen (30%)</th>
          <th style="text-align: center;">Stok Gudang</th>
          <th style="text-align: center;">Aksi Cepat</th>
        </tr>
      `;
    } else if (storeTier === 'sub_agen') {
      thead.innerHTML = `
        <tr>
          <th>Produk SR12</th>
          <th>Netto</th>
          <th>Kategori</th>
          <th>Harga HET</th>
          <th>Reseller (20%)</th>
          <th style="text-align: center;">Stok Gudang</th>
          <th style="text-align: center;">Aksi Cepat</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr>
          <th>Produk SR12</th>
          <th>Netto</th>
          <th>Kategori</th>
          <th>Harga HET</th>
          <th>Reseller (20%)</th>
          <th>Sub Agen (30%)</th>
          <th>Agen (40%)</th>
          <th style="text-align: center;">Stok Gudang</th>
          <th style="text-align: center;">Aksi Cepat</th>
        </tr>
      `;
    }
  }

  if (prods.length === 0) {
    const colSpan = storeTier === 'agen' ? 8 : (storeTier === 'sub_agen' ? 7 : 9);
    tbody.innerHTML = `
      <tr>
        <td colspan="${colSpan}" style="text-align: center; padding: 30px; color: #94a3b8;">
          📦 Belum ada data produk di inventori.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = prods.map(p => {
    const het = Number(p.het || p.price || p.het_price) || 0;
    const resPrice = Math.round(het * 0.8);
    const subPrice = Math.round(het * 0.7);
    const agenPrice = Math.round(het * 0.6);
    const stock = (typeof p.stock !== 'undefined') ? p.stock : 85;
    const netto = p.netto || (p.weightGram ? p.weightGram + 'g' : 'Original');

    let stockBadgeHtml = '';
    if (stock <= 0) {
      stockBadgeHtml = `
        <span class="inv-stock-badge inv-stock-out" title="Stok habis (0 pcs).">
          <span class="stock-dot red"></span>
          <span>0 pcs</span>
          <span style="font-size: 0.68rem; margin-left: 2px;">(Habis)</span>
        </span>
      `;
    } else if (stock <= 15) {
      stockBadgeHtml = `
        <span class="inv-stock-badge inv-stock-low" title="Peringatan Stok Menipis: Stok tinggal ${stock} pcs.">
          <span class="stock-dot amber"></span>
          <span>${stock} pcs</span>
          <span style="font-size: 0.68rem; margin-left: 2px;">⚠️ Menipis</span>
        </span>
      `;
    } else {
      stockBadgeHtml = `
        <span class="inv-stock-badge inv-stock-ready" title="Stok aman di gudang.">
          <span class="stock-dot green"></span>
          <span>${stock} pcs</span>
          <span style="font-size: 0.68rem; margin-left: 2px;">✅ Ready</span>
        </span>
      `;
    }

    let priceCellsHtml = '';
    if (storeTier === 'agen') {
      priceCellsHtml = `
        <td data-label="Harga HET" style="font-weight: 700; color: #0284c7;">Rp ${het.toLocaleString('id-ID')}</td>
        <td data-label="Reseller 20%" style="color: #059669; font-size: 0.82rem;">Rp ${resPrice.toLocaleString('id-ID')}</td>
        <td data-label="Sub Agen 30%" style="color: #7c3aed; font-size: 0.82rem;">Rp ${subPrice.toLocaleString('id-ID')}</td>
      `;
    } else if (storeTier === 'sub_agen') {
      priceCellsHtml = `
        <td data-label="Harga HET" style="font-weight: 700; color: #0284c7;">Rp ${het.toLocaleString('id-ID')}</td>
        <td data-label="Reseller 20%" style="color: #059669; font-size: 0.82rem;">Rp ${resPrice.toLocaleString('id-ID')}</td>
      `;
    } else {
      priceCellsHtml = `
        <td data-label="Harga HET" style="font-weight: 700; color: #0284c7;">Rp ${het.toLocaleString('id-ID')}</td>
        <td data-label="Reseller 20%" style="color: #059669; font-size: 0.82rem;">Rp ${resPrice.toLocaleString('id-ID')}</td>
        <td data-label="Sub Agen 30%" style="color: #7c3aed; font-size: 0.82rem;">Rp ${subPrice.toLocaleString('id-ID')}</td>
        <td data-label="Agen 40%" style="color: #d97706; font-size: 0.82rem;">Rp ${agenPrice.toLocaleString('id-ID')}</td>
      `;
    }

    return `
      <tr>
        <td data-label="Produk" class="inv-td-product">
          <div style="display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;">
            <img src="${p.image || 'assets/hero-banner.jpg'}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; flex-shrink: 0;" onerror="this.src='assets/hero-banner.jpg'">
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 800; color: #0f172a; font-size: 0.88rem; line-height: 1.25; word-break: break-word;">${p.name}</div>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">ID: ${p.id}</div>
            </div>
          </div>
        </td>
        <td data-label="Netto">${netto}</td>
        <td data-label="Kategori"><span class="badge-crm" style="background: #f1f5f9; color: #475569;">${p.category || 'Herbal'}</span></td>
        ${priceCellsHtml}
        <td data-label="Stok Gudang" style="text-align: center;">
          ${stockBadgeHtml}
        </td>
        <td data-label="Aksi Cepat" style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button onclick="quickUpdateStock('${p.id}', 10)" style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 4px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;" title="Tambah 10 stok masuk">
              +10
            </button>
            <button onclick="quickUpdateStock('${p.id}', -1)" style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 4px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;" title="Kurangi 1 stok">
              -1
            </button>
            <button onclick="openEditProductModal('${p.id}')" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 4px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; cursor: pointer;" title="Edit Produk">
              ✏️
            </button>
            <button onclick="deleteProduct('${p.id}')" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 4px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;" title="Hapus Produk dari Inventori">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function quickUpdateStock(productId, delta) {
  if (typeof appState === 'undefined') return;
  const prod = (appState.products || []).find(p => p.id === productId);
  if (!prod) return;

  if (typeof prod.stock === 'undefined') prod.stock = 85;
  prod.stock = Math.max(0, prod.stock + delta);
  saveStoredProducts(appState.products);
  renderInventoryTable();
  showToast(`📦 Stok ${prod.name} diperbarui menjadi ${prod.stock} pcs`);
}

// ==========================================
// 7. KAS MASUK - KELUAR (BUKU KAS) LOGIC
// ==========================================
function renderCashflowTable() {
  const tbody = document.getElementById('cashflowTableBody');
  const cashOnHandEl = document.getElementById('cashflowCashOnHandDisplay');
  const bankEl = document.getElementById('cashflowBankDisplay');
  const outEl = document.getElementById('cashflowTotalOutDisplay');
  const netEl = document.getElementById('cashflowNetDisplay');
  if (!tbody || typeof appState === 'undefined') return;

  const records = appState.cashflow || [];

  let totalCashIn = 0;
  let totalCashOut = 0;
  let totalBankIn = 0;
  let totalBankOut = 0;
  let totalOut = 0;
  let totalIn = 0;

  records.forEach(r => {
    const amt = Number(r.amount) || 0;
    const catLower = String(r.category || '').toLowerCase();
    const notesLower = String(r.notes || '').toLowerCase();
    const isCashAcc = r.account ? (r.account === 'CASH') : (!catLower.includes('bank') && !catLower.includes('transfer') && !catLower.includes('online') && !notesLower.includes('transfer bank'));
    if (r.type === 'in') {
      totalIn += amt;
      if (isCashAcc) totalCashIn += amt;
      else totalBankIn += amt;
    } else {
      totalOut += amt;
      if (isCashAcc) totalCashOut += amt;
      else totalBankOut += amt;
    }
  });

  const cashOnHand = totalCashIn - totalCashOut;
  const bankBalance = totalBankIn - totalBankOut;
  const net = totalIn - totalOut;

  if (cashOnHandEl) cashOnHandEl.textContent = `Rp ${cashOnHand.toLocaleString('id-ID')}`;
  if (bankEl) bankEl.textContent = `Rp ${bankBalance.toLocaleString('id-ID')}`;
  if (outEl) outEl.textContent = `Rp ${totalOut.toLocaleString('id-ID')}`;
  if (netEl) {
    netEl.textContent = `Rp ${net.toLocaleString('id-ID')}`;
    netEl.style.color = net >= 0 ? '#4f46e5' : '#dc2626';
  }

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 30px; color: #94a3b8;">
          💵 Belum ada catatan arus kas. Klik tombol "+ Catat Kas Masuk" atau "- Catat Kas Keluar".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(r => {
    const isIn = r.type === 'in';
    const catLower = String(r.category || '').toLowerCase();
    const notesLower = String(r.notes || '').toLowerCase();
    const isCashAcc = r.account ? (r.account === 'CASH') : (!catLower.includes('bank') && !catLower.includes('transfer') && !catLower.includes('online') && !notesLower.includes('transfer bank'));
    return `
      <tr>
        <td data-label="Tanggal" style="font-size: 0.8rem; color: #64748b;">${r.date}</td>
        <td data-label="Tipe">
          <span style="background: ${isIn ? '#ecfdf5' : '#fee2e2'}; color: ${isIn ? '#065f46' : '#991b1b'}; padding: 3px 8px; border-radius: 999px; font-weight: 800; font-size: 0.72rem;">
            ${isIn ? '⬆️ Kas Masuk' : '⬇️ Kas Keluar'}
          </span>
          <span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; margin-left: 4px; background: ${isCashAcc ? '#ecfdf5' : '#eff6ff'}; color: ${isCashAcc ? '#065f46' : '#1e40af'}; font-weight: 700;">
            ${isCashAcc ? '💵 Tunai' : '💳 Bank'}
          </span>
        </td>
        <td data-label="Kategori"><b>${r.category}</b></td>
        <td data-label="Keterangan" style="color: #475569;">${r.notes}</td>
        <td data-label="Nominal" style="font-weight: 800; color: ${isIn ? '#059669' : '#dc2626'}; font-size: 0.9rem;">
          ${isIn ? '+' : '-'} Rp ${Number(r.amount).toLocaleString('id-ID')}
        </td>
        <td data-label="Aksi" style="text-align: center; white-space: nowrap;">
          <button onclick="openEditCashflowModal('${r.id}')" style="background: none; border: none; color: #475569; font-size: 0.85rem; cursor: pointer; margin-right: 6px;" title="Edit Catatan Kas">
            ✏️
          </button>
          <button onclick="deleteCashflowEntry('${r.id}')" style="background: none; border: none; color: #ef4444; font-size: 0.85rem; cursor: pointer;" title="Hapus Catatan Kas">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}


function openAddCashflowModal(type = 'in') {
  const modal = document.getElementById('modalAddCashflow');
  const header = document.getElementById('modalCashflowHeader');
  const title = document.getElementById('modalCashflowTitle');
  const typeInput = document.getElementById('cashflowTypeInput');
  const catSelect = document.getElementById('cashflowCategoryInput');
  const btnSubmit = document.getElementById('btnSubmitCashflow');

  if (!modal || !typeInput || !catSelect) return;

  typeInput.value = type;

  if (type === 'in') {
    if (header) header.style.background = '#10b981';
    if (title) title.textContent = '💵 Catat Kas Masuk (Pemasukan)';
    if (btnSubmit) {
      btnSubmit.style.background = '#10b981';
      btnSubmit.textContent = 'Simpan Kas Masuk';
    }
    catSelect.innerHTML = `
      <option value="Saldo Awal Kas Toko (Modal Usaha)">Saldo Awal Kas Toko (Modal Usaha Pertama)</option>
      <option value="Penjualan Toko / Kasir POS">Penjualan Toko / Kasir POS</option>
      <option value="Penjualan Grosir Mitra">Penjualan Grosir Mitra (Agen/Reseller)</option>
      <option value="Setoran Modal Tambahan">Setoran Modal Tambahan</option>
      <option value="Penerimaan Piutang">Penerimaan Piutang</option>
      <option value="Pendapatan Lain-lain">Pendapatan Lain-lain</option>
    `;
  } else {
    if (header) header.style.background = '#ef4444';
    if (title) title.textContent = '💸 Catat Kas Keluar (Pengeluaran)';
    if (btnSubmit) {
      btnSubmit.style.background = '#ef4444';
      btnSubmit.textContent = 'Simpan Kas Keluar';
    }
    catSelect.innerHTML = `
      <option value="Kulakan PT SR12 Pusat">Kulakan Produk ke PT SR12 Pusat</option>
      <option value="Biaya Packing & Lakban">Biaya Packing (Lakban Fragile, Bubble, Kardus)</option>
      <option value="Gaji / Komisi Marketer">Gaji / Komisi Marketer 15%</option>
      <option value="Operasional Gudang / Bensin">Operasional Gudang & Bensin Kurir</option>
      <option value="Biaya Listrik / Internet Toko">Biaya Listrik & Internet Toko</option>
      <option value="Pengeluaran Lain-lain">Pengeluaran Lain-lain</option>
    `;
  }

  delete appState.activeEditingCashflowId;

  const accSelect = document.getElementById('cashflowAccountInput');
  if (accSelect) {
    accSelect.value = 'CASH';
  }

  document.getElementById('cashflowAmountInput').value = '';
  document.getElementById('cashflowNotesInput').value = '';

  modal.classList.add('open');
}

function openEditCashflowModal(id) {
  if (typeof appState === 'undefined') return;
  const entry = (appState.cashflow || []).find(c => c.id === id);
  if (!entry) return;
  openAddCashflowModal(entry.type || 'in');

  appState.activeEditingCashflowId = id;
  const title = document.getElementById('modalCashflowTitle');
  if (title) title.textContent = '✏️ Edit Catatan Buku Kas';
  const catInput = document.getElementById('cashflowCategoryInput');
  const accInput = document.getElementById('cashflowAccountInput');
  const amountInput = document.getElementById('cashflowAmountInput');
  const notesInput = document.getElementById('cashflowNotesInput');
  const btnSubmit = document.getElementById('btnSubmitCashflow');

  if (catInput) catInput.value = entry.category;
  if (accInput && entry.account) accInput.value = entry.account;
  if (amountInput) amountInput.value = entry.amount;
  if (notesInput) {
    notesInput.value = (entry.notes || '').replace(/\s*\[.*\]$/, '').trim();
  }
  if (btnSubmit) btnSubmit.textContent = 'Simpan Perubahan';
}
window.openEditCashflowModal = openEditCashflowModal;

function handleSaveCashflowSubmit(e) {
  if (e) e.preventDefault();
  if (typeof appState === 'undefined') return;

  const type = document.getElementById('cashflowTypeInput')?.value || 'in';
  const category = document.getElementById('cashflowCategoryInput')?.value || 'Lain-lain';
  const account = document.getElementById('cashflowAccountInput')?.value || 'CASH';
  const amount = parseInt(document.getElementById('cashflowAmountInput')?.value, 10) || 0;
  const notesRaw = document.getElementById('cashflowNotesInput')?.value.trim();
  const notes = notesRaw || category;

  if (amount <= 0) {
    showToast('⚠️ Nominal kas harus lebih dari Rp 0!');
    return;
  }

  // Jika sedang mode edit catatan yang sudah ada
  if (appState.activeEditingCashflowId) {
    const existing = (appState.cashflow || []).find(c => c.id === appState.activeEditingCashflowId);
    if (existing) {
      existing.type = type;
      existing.account = account;
      existing.category = category;
      existing.amount = amount;
      existing.notes = `${notes} [${account === 'CASH' ? 'Kas Tunai' : 'Transfer Bank'}]`;
      saveStoredCashflow(appState.cashflow);
      delete appState.activeEditingCashflowId;
      closeModal('modalAddCashflow');
      renderCashflowTable();
      showToast('✅ Catatan buku kas berhasil diperbarui!');
      return;
    }
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const entry = {
    id: 'CSH-' + Math.floor(1000 + Math.random() * 9000),
    date: dateStr,
    type,
    account,
    category,
    notes: `${notes} [${account === 'CASH' ? 'Kas Tunai' : 'Transfer Bank'}]`,
    amount
  };

  if (!appState.cashflow) appState.cashflow = [];
  appState.cashflow.unshift(entry);
  saveStoredCashflow(appState.cashflow);

  closeModal('modalAddCashflow');
  renderCashflowTable();
  showToast(`✅ Catatan Kas ${type === 'in' ? 'Masuk' : 'Keluar'} Rp ${amount.toLocaleString('id-ID')} berhasil dicatat!`);
}

function deleteCashflowEntry(id) {
  if (typeof appState === 'undefined') return;
  if (!confirm('Hapus catatan arus kas ini?')) return;

  appState.cashflow = (appState.cashflow || []).filter(c => c.id !== id);
  saveStoredCashflow(appState.cashflow);
  renderCashflowTable();
  showToast('Catatan arus kas telah dihapus.');
}

function clearAllCashflow() {
  if (!confirm('⚠️ Anda yakin ingin mengosongkan seluruh Catatan Buku Kas Masuk - Keluar?\n\nSemua data arus kas akan dihapus untuk simulasi baru.')) {
    return;
  }
  appState.cashflow = [];
  saveStoredCashflow([]);
  renderCashflowTable();
  if (typeof showToast === 'function') showToast('🗑️ Seluruh Catatan Kas Masuk - Keluar berhasil dikosongkan!');
}
window.clearAllCashflow = clearAllCashflow;

// ==========================================
// 8. LAPORAN & REKAP LABA LOGIC
// ==========================================
function renderReportsView() {
  if (typeof appState === 'undefined') return;

  const trxs = appState.transactions || [];
  let totalHet = 0;
  let totalDiscount = 0;
  let totalNet = 0;

  // Frekuensi produk terjual
  const productSalesMap = {};
  // Omset per jalur
  const channelOmsetMap = {
    konsumen: 0,
    reseller: 0,
    sub_agen: 0,
    agen: 0,
    marketer: 0
  };

  trxs.forEach(t => {
    totalHet += Number(t.subtotalHet) || 0;
    totalDiscount += Number(t.discountAmount) || 0;
    totalNet += Number(t.grandTotal) || 0;

    const tier = t.tier || 'konsumen';
    if (typeof channelOmsetMap[tier] !== 'undefined') {
      channelOmsetMap[tier] += Number(t.grandTotal) || 0;
    } else {
      channelOmsetMap.konsumen += Number(t.grandTotal) || 0;
    }

    (t.items || []).forEach(item => {
      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = { name: item.name, qty: 0, omset: 0 };
      }
      productSalesMap[item.name].qty += Number(item.qty) || 0;
      productSalesMap[item.name].omset += Number(item.subtotal) || 0;
    });
  });

  // Hitung Beban Operasional dari Buku Kas Keluar (Beban Toko & Komisi Marketer)
  const cashflows = appState.cashflow || [];
  let totalExpenses = 0;
  cashflows.forEach(c => {
    if (c.type === 'out' && !c.category.includes('Kulakan')) {
      totalExpenses += Number(c.amount) || 0;
    }
  });

  // HPP Modal Kulakan Toko Sesuai Tingkat Toko
  const storeTier = (appState.storeSettings && appState.storeSettings.partnerTier) || 'distributor';
  let hppRate = 0.50; // Distributor modal kulakan ke Pusat 50%
  let hppSubtext = 'Modal kulakan produk ke PT SR12 Pusat (50%)';
  if (storeTier === 'agen') {
    hppRate = 0.60; // Agen modal kulakan ke Distributor 60% (diskon 40%)
    hppSubtext = 'Modal kulakan produk ke Distributor Pembina (60%)';
  } else if (storeTier === 'sub_agen') {
    hppRate = 0.70; // Sub Agen modal kulakan ke Agen 70% (diskon 30%)
    hppSubtext = 'Modal kulakan produk ke Agen/Distributor Pembina (70%)';
  }

  const totalHpp = Math.round(totalHet * hppRate);
  const grossProfit = Math.max(0, totalNet - totalHpp);
  const grossMarginPct = totalNet > 0 ? Math.round((grossProfit / totalNet) * 100) : 0;
  const netProfit = grossProfit - totalExpenses;

  const netRevEl = document.getElementById('repNetRevenue');
  const hppEl = document.getElementById('repHppCost');
  const hppSubtextEl = document.getElementById('repHppSubtext');
  if (hppSubtextEl) hppSubtextEl.textContent = hppSubtext;
  const grossEl = document.getElementById('repGrossProfit');
  const grossMarginPctEl = document.getElementById('repGrossMarginPct');
  const expensesEl = document.getElementById('repOperatingExpenses');
  const netProfitEl = document.getElementById('repNetProfit');
  const statusBadgeEl = document.getElementById('repProfitStatusBadge');

  if (netRevEl) netRevEl.textContent = `Rp ${totalNet.toLocaleString('id-ID')}`;
  if (hppEl) hppEl.textContent = `Rp ${totalHpp.toLocaleString('id-ID')}`;
  if (grossEl) grossEl.textContent = `Rp ${grossProfit.toLocaleString('id-ID')}`;
  if (grossMarginPctEl) grossMarginPctEl.textContent = `Margin Kotor: ${grossMarginPct}%`;
  if (expensesEl) expensesEl.textContent = `Rp ${totalExpenses.toLocaleString('id-ID')}`;
  if (netProfitEl) {
    netProfitEl.textContent = `Rp ${netProfit.toLocaleString('id-ID')}`;
    netProfitEl.style.color = netProfit >= 0 ? '#7c3aed' : '#dc2626';
  }
  if (statusBadgeEl) {
    if (netProfit > 0) {
      statusBadgeEl.textContent = '🟢 SURPLUS BISNIS (PROFITABLE)';
      statusBadgeEl.style.color = '#059669';
    } else if (netProfit === 0) {
      statusBadgeEl.textContent = '⚪ IMPAS (BREAK-EVEN)';
      statusBadgeEl.style.color = '#64748b';
    } else {
      statusBadgeEl.textContent = '🔴 DEFISIT (PERIKSA BIAYA OPERASIONAL)';
      statusBadgeEl.style.color = '#dc2626';
    }
  }

  // Top 5 Products
  const sortedProds = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topListEl = document.getElementById('repTopProductsList');
  if (topListEl) {
    if (sortedProds.length === 0) {
      topListEl.innerHTML = `<div style="color: #94a3b8; font-size: 0.85rem;">Belum ada data transaksi.</div>`;
    } else {
      topListEl.innerHTML = sortedProds.map((p, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.82rem;">
          <div>
            <b>${idx + 1}. ${p.name}</b>
            <div style="color: #64748b; font-size: 0.74rem;">Terjual: ${p.qty} pcs</div>
          </div>
          <span style="font-weight: 800; color: #0284c7;">Rp ${p.omset.toLocaleString('id-ID')}</span>
        </div>
      `).join('');
    }
  }

  // Channel breakdown
  const channelListEl = document.getElementById('repChannelBreakdown');
  if (channelListEl) {
    channelListEl.innerHTML = `
      <div style="font-size: 0.82rem; line-height: 2;">
        <div style="display: flex; justify-content: space-between;">
          <span>👤 Konsumen Retail Umum:</span>
          <b>Rp ${(channelOmsetMap.konsumen || 0).toLocaleString('id-ID')}</b>
        </div>
        <div style="display: flex; justify-content: space-between; color: #059669;">
          <span>🌿 Jaringan Reseller (20%):</span>
          <b>Rp ${(channelOmsetMap.reseller || 0).toLocaleString('id-ID')}</b>
        </div>
        <div style="display: flex; justify-content: space-between; color: #7c3aed;">
          <span>🏢 Jaringan Sub Agen (30%):</span>
          <b>Rp ${(channelOmsetMap.sub_agen || 0).toLocaleString('id-ID')}</b>
        </div>
        <div style="display: flex; justify-content: space-between; color: #d97706;">
          <span>👑 Jaringan Agen Resmi (40%):</span>
          <b>Rp ${(channelOmsetMap.agen || 0).toLocaleString('id-ID')}</b>
        </div>
        <div style="display: flex; justify-content: space-between; color: #0284c7;">
          <span>💼 Penjualan Tim Marketer:</span>
          <b>Rp ${(channelOmsetMap.marketer || 0).toLocaleString('id-ID')}</b>
        </div>
      </div>
    `;
  }
}

function exportReportsToCSV() {
  if (typeof appState === 'undefined') return;
  const trxs = appState.transactions || [];

  if (trxs.length === 0) {
    showToast('⚠️ Belum ada transaksi untuk diekspor!');
    return;
  }

  let csv = 'No Transaksi,Tanggal,Nama Pelanggan,No WA,Tingkat Mitra,Subtotal HET,Diskon Mitra,Total Bayar,Metode,Status\n';

  trxs.forEach(t => {
    csv += `"${t.id}","${t.dateTime}","${t.customerName}","${t.customerPhone || ''}","${t.tierLabel}",${t.subtotalHet},${t.discountAmount},${t.grandTotal},"${t.paymentMethod}","${t.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Penjualan_SR12_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('📥 Laporan Transaksi berhasil diunduh dalam format CSV / Excel!');
}

// ==========================================
// 9. MOUNT MITRA & MARKETER VIEWS
// ==========================================
function mountMitraInOlsera() {
  const mount = document.getElementById('olseraMitraContainerMount');
  const src = document.getElementById('resellersSection');
  if (mount && src) {
    src.style.display = 'block';
    if (!mount.contains(src)) {
      mount.appendChild(src);
    }
    if (typeof renderResellersTable === 'function') renderResellersTable();
  }
}

function mountMarketerInOlsera() {
  const mount = document.getElementById('olseraMarketerContainerMount');
  const src = document.getElementById('marketersSection');
  if (mount && src) {
    src.style.display = 'block';
    if (!mount.contains(src)) {
      mount.appendChild(src);
    }
    if (typeof renderMarketerPayroll === 'function') renderMarketerPayroll();
  }
}

// ==========================================
// ==========================================
// 10. SETTINGS TOKO & LOGO UPLOAD LOGIC
// ==========================================
function populateOlseraSettingsForm() {
  const store = (typeof appState !== 'undefined' && appState.storeSettings) || {};
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setEl('setOlseraStoreName', store.storeName);
  setEl('setOlseraOwnerName', store.storeOwner);
  setEl('setOlseraWaNumber', store.storeWaNumber);
  setEl('setOlseraCity', store.storeCity);
  setEl('setOlseraTagline', store.storeTagline);
  setEl('setOlseraBankName', store.bankName || 'BCA');
  setEl('setOlseraBankAccount', store.bankAccount || '1234567890');
  const curFee = String(store.platformFeeAmount || (typeof appState !== 'undefined' && appState.platformFee) || localStorage.getItem('sr12_platform_fee_amount') || 1500);
  setEl('setOlseraPlatformFeeAmount', (curFee === '2000') ? '2000' : '1500');
  setEl('setOlseraFeePayer', store.feePayer || 'buyer');

  // Inisialisasi preview logo
  appState.tempOlseraLogoUrl = store.storeLogoUrl || '';
  updateOlseraSettingsLogoPreview(store.storeLogoUrl);

  // Inisialisasi preview banner
  appState.tempOlseraBannerUrl = store.heroBannerUrl || 'assets/hero-banner.jpg';
  updateOlseraSettingsBannerPreview(store.heroBannerUrl || 'assets/hero-banner.jpg');

  // Tampilkan zona bahaya hapus toko hanya untuk toko mitra (bukan central)
  const dangerZone = document.getElementById('olseraDangerZoneDeleteStore');
  if (dangerZone) {
    dangerZone.style.display = store.slug === 'sr12-central' ? 'none' : 'block';
  }
}

/**
 * Auto-trim and optical center utility for store logos
 * Crops uneven transparent or white padding and centers graphic in a 1:1 square canvas
 */
function autoTrimAndCenterImage(imgSrc, callback) {
  if (!imgSrc || typeof callback !== 'function') return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return callback(imgSrc);

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      let minX = w, minY = h, maxX = 0, maxY = 0;
      let hasContent = false;

      // Sample pixels to find graphic bounds
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Content pixel is not transparent and not pure white (above threshold)
          const isTransparent = a < 25;
          const isWhite = r > 248 && g > 248 && b > 248 && a > 200;

          if (!isTransparent && !isWhite) {
            hasContent = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!hasContent || maxX <= minX || maxY <= minY) {
        return callback(imgSrc);
      }

      const contentW = maxX - minX + 1;
      const contentH = maxY - minY + 1;
      const size = Math.max(contentW, contentH);
      const pad = Math.round(size * 0.05); // 5% breathing room
      const finalSize = size + pad * 2;

      const squareCanvas = document.createElement('canvas');
      squareCanvas.width = finalSize;
      squareCanvas.height = finalSize;
      const sCtx = squareCanvas.getContext('2d');

      const offsetX = Math.round((finalSize - contentW) / 2);
      const offsetY = Math.round((finalSize - contentH) / 2);

      sCtx.drawImage(
        img,
        minX, minY, contentW, contentH,
        offsetX, offsetY, contentW, contentH
      );

      callback(squareCanvas.toDataURL('image/png'));
    } catch (e) {
      console.warn('Auto-trim skipped (cross-origin or unsupported):', e);
      callback(imgSrc);
    }
  };
  img.onerror = () => callback(imgSrc);
  img.src = imgSrc;
}

function updateOlseraSettingsLogoPreview(logoUrl) {
  const img = document.getElementById('olseraSetLogoPreviewImg');
  const icon = document.getElementById('olseraSetLogoDefaultIcon');
  const urlInput = document.getElementById('setOlseraLogoUrlInput');
  const fileNameDisplay = document.getElementById('olseraLogoFileNameDisplay');

  const finalLogo = logoUrl || 'assets/sr12-logo.png';

  if (urlInput && document.activeElement !== urlInput) {
    urlInput.value = (logoUrl && !logoUrl.startsWith('data:') && logoUrl !== 'assets/sr12-logo.png') ? logoUrl : '';
  }

  if (img) {
    img.src = finalLogo;
    img.style.display = 'block';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center center';
    img.style.margin = '0 auto';
  }
  if (icon) icon.style.display = 'none';
  if (fileNameDisplay && (!logoUrl || logoUrl === 'assets/sr12-logo.png')) {
    fileNameDisplay.textContent = 'Logo Resmi SR12 (Default)';
  }
}

async function handleOlseraLogoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('olseraLogoUploadStatus');
  const fileNameDisplay = document.getElementById('olseraLogoFileNameDisplay');

  if (fileNameDisplay) {
    fileNameDisplay.textContent = file.name;
  }

  if (statusEl) {
    statusEl.style.display = 'inline-flex';
    statusEl.style.background = '#e0f2fe';
    statusEl.style.color = '#0284c7';
    statusEl.textContent = '⏳ Membaca & memusatkan logo...';
  }

  // 1. Instant local preview via Base64 FileReader with optical centering
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const rawData = ev.target.result;
    autoTrimAndCenterImage(rawData, async (centeredBase64) => {
      appState.tempOlseraLogoUrl = centeredBase64;
      updateOlseraSettingsLogoPreview(centeredBase64);

      // Also immediately update live logo previews in UI
      const logoEl = document.getElementById('olseraLogoIcon');
      const topbarLogoEl = document.getElementById('olseraTopbarLogo');
      if (logoEl) {
        const i = logoEl.querySelector('img');
        if (i) i.src = centeredBase64;
      }
      if (topbarLogoEl) {
        const i = topbarLogoEl.querySelector('img');
        if (i) i.src = centeredBase64;
      }

      // 2. Upload to Supabase Storage bucket if available
      if (window.supabaseClient) {
        try {
          if (statusEl) statusEl.textContent = '☁️ Mengupload ke Supabase Cloud...';
          const storeSlug = (appState.storeSettings && appState.storeSettings.slug) || 'store';
          const fileExt = file.name.split('.').pop() || 'png';
          const fileName = `logos/${storeSlug}-${Date.now()}.${fileExt}`;

          const { data, error } = await window.supabaseClient.storage
            .from('products')
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

          if (!error && data) {
            const { data: pubData } = window.supabaseClient.storage
              .from('products')
              .getPublicUrl(fileName);

            if (pubData && pubData.publicUrl) {
              appState.tempOlseraLogoUrl = pubData.publicUrl;
              if (statusEl) {
                statusEl.style.background = '#ecfdf5';
                statusEl.style.color = '#065f46';
                statusEl.textContent = '☁️ Terupload ke Supabase Cloud';
              }
              if (typeof showToast === 'function') {
                showToast('☁️ Logo berhasil diunggah ke Supabase Storage!');
              }
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase storage upload fallback to base64:', err);
        }
      }
    });

    if (statusEl) {
      statusEl.style.background = '#ecfdf5';
      statusEl.style.color = '#065f46';
      statusEl.textContent = '✅ Siap Disimpan';
    }
    if (typeof showToast === 'function') {
      showToast('🖼️ Logo siap! Klik "Simpan Pengaturan Toko" untuk menerapkan.');
    }
  };
  reader.readAsDataURL(file);
}

function handleOlseraLogoUrlInput(url) {
  const cleanUrl = (url || '').trim();
  appState.tempOlseraLogoUrl = cleanUrl;
  updateOlseraSettingsLogoPreview(cleanUrl);
  const statusEl = document.getElementById('olseraLogoUploadStatus');
  if (statusEl) {
    if (cleanUrl) {
      statusEl.style.display = 'inline-flex';
      statusEl.style.background = '#ecfdf5';
      statusEl.style.color = '#065f46';
      statusEl.textContent = '🔗 URL Gambar Terdeteksi';
    } else {
      statusEl.style.display = 'none';
    }
  }
}

function resetOlseraLogoToDefault() {
  appState.tempOlseraLogoUrl = 'assets/sr12-logo.png';
  updateOlseraSettingsLogoPreview('assets/sr12-logo.png');
  const statusEl = document.getElementById('olseraLogoUploadStatus');
  const fileInput = document.getElementById('olseraLogoFileInput');
  if (fileInput) fileInput.value = '';
  if (statusEl) {
    statusEl.style.display = 'inline-flex';
    statusEl.style.background = '#ecfdf5';
    statusEl.style.color = '#065f46';
    statusEl.textContent = '🌿 Menggunakan Logo Resmi SR12';
  }
  if (typeof showToast === 'function') {
    showToast('🌿 Logo toko diatur ke Logo Resmi SR12');
  }
}

function handleOlseraBannerUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const fileNameEl = document.getElementById('olseraBannerFileNameDisplay');
  const statusEl = document.getElementById('olseraBannerUploadStatus');
  if (fileNameEl) fileNameEl.textContent = `📁 ${file.name}`;
  if (statusEl) {
    statusEl.style.display = 'inline-flex';
    statusEl.style.background = '#e0f2fe';
    statusEl.style.color = '#0284c7';
    statusEl.textContent = '⏳ Mengoptimasi Banner...';
  }

  if (typeof compressImageSource === 'function') {
    compressImageSource(file, 1200, 0.82).then(compressed => {
      appState.tempOlseraBannerUrl = compressed;
      updateOlseraSettingsBannerPreview(compressed);
      if (statusEl) {
        statusEl.style.background = '#ecfdf5';
        statusEl.style.color = '#065f46';
        statusEl.textContent = '✅ Banner Siap Disimpan';
      }
    }).catch(err => {
      console.warn('Kompres banner gagal:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        appState.tempOlseraBannerUrl = e.target.result;
        updateOlseraSettingsBannerPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      appState.tempOlseraBannerUrl = e.target.result;
      updateOlseraSettingsBannerPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

function updateOlseraSettingsBannerPreview(url) {
  const previewImg = document.getElementById('olseraSetBannerPreviewImg');
  if (previewImg) {
    previewImg.src = url || 'assets/hero-banner.jpg';
    previewImg.style.display = 'block';
  }
}

function resetOlseraBannerToDefault() {
  appState.tempOlseraBannerUrl = 'assets/hero-banner.jpg';
  updateOlseraSettingsBannerPreview('assets/hero-banner.jpg');
  const statusEl = document.getElementById('olseraBannerUploadStatus');
  const fileInput = document.getElementById('olseraBannerFileInput');
  if (fileInput) fileInput.value = '';
  if (statusEl) {
    statusEl.style.display = 'inline-flex';
    statusEl.style.background = '#ecfdf5';
    statusEl.style.color = '#065f46';
    statusEl.textContent = '🌿 Menggunakan Banner Resmi SR12';
  }
  if (typeof showToast === 'function') {
    showToast('🌿 Banner toko diatur ke Banner Resmi SR12');
  }
}

function handleSaveOlseraSettings(e) {
  if (e) e.preventDefault();
  if (typeof appState === 'undefined' || !appState.storeSettings) return;

  appState.storeSettings.storeName = document.getElementById('setOlseraStoreName')?.value.trim() || appState.storeSettings.storeName;
  appState.storeSettings.storeOwner = document.getElementById('setOlseraOwnerName')?.value.trim() || appState.storeSettings.storeOwner;
  appState.storeSettings.storeWaNumber = document.getElementById('setOlseraWaNumber')?.value.trim() || appState.storeSettings.storeWaNumber;
  appState.storeSettings.storeCity = document.getElementById('setOlseraCity')?.value.trim() || appState.storeSettings.storeCity;
  appState.storeSettings.storeTagline = document.getElementById('setOlseraTagline')?.value.trim() || appState.storeSettings.storeTagline;
  appState.storeSettings.bankName = document.getElementById('setOlseraBankName')?.value || 'BCA';
  appState.storeSettings.bankAccount = document.getElementById('setOlseraBankAccount')?.value.trim() || '1234567890';

  // Simpan Logo Toko
  if (typeof appState.tempOlseraLogoUrl !== 'undefined') {
    appState.storeSettings.storeLogoUrl = appState.tempOlseraLogoUrl;
  } else {
    const manualUrl = document.getElementById('setOlseraLogoUrlInput')?.value.trim();
    if (manualUrl) {
      appState.storeSettings.storeLogoUrl = manualUrl;
    }
  }

  // Simpan Banner Toko
  if (typeof appState.tempOlseraBannerUrl !== 'undefined') {
    appState.storeSettings.heroBannerUrl = appState.tempOlseraBannerUrl;
  } else if (appState.tempHeroBannerBase64) {
    appState.storeSettings.heroBannerUrl = appState.tempHeroBannerBase64;
  }

  // Update di daftar partner stores
  const curIdx = (appState.partnerStores || []).findIndex(s => s.slug === appState.storeSettings.slug);
  if (curIdx >= 0) {
    appState.partnerStores[curIdx] = Object.assign({}, appState.storeSettings);
  }

  // Simpan Biaya Layanan Sistem
  const feeAmountVal = parseInt(document.getElementById('setOlseraPlatformFeeAmount')?.value, 10) || 1500;
  const feePayerVal = document.getElementById('setOlseraFeePayer')?.value || 'buyer';
  appState.storeSettings.platformFeeAmount = feeAmountVal;
  appState.storeSettings.feePayer = feePayerVal;
  appState.platformFee = feeAmountVal;

  try {
    localStorage.setItem('sr12_platform_fee_amount', String(feeAmountVal));
    localStorage.setItem('sr12_store_settings_v4', JSON.stringify(appState.storeSettings));
  } catch (eFee) {
    console.warn('Gagal simpan fee amount ke localStorage:', eFee);
  }

  if (typeof saveStoredPartnerStores === 'function') {
    saveStoredPartnerStores(appState.partnerStores);
  }

  // Sinkronisasi ke Supabase Cloud
  if (typeof saveStoreToSupabase === 'function') {
    saveStoreToSupabase(appState.storeSettings);
  }

  // Render branding di storefront dan di Olsera
  if (typeof renderStoreBranding === 'function') {
    renderStoreBranding();
  }
  if (typeof updateCartSummary === 'function') {
    updateCartSummary();
  }
  updateOlseraHeaderMeta();

  if (typeof showToast === 'function') {
    showToast('✅ Pengaturan profil toko, banner, logo & biaya sistem berhasil disimpan!');
  }
}

function syncOlseraPlatformFeeToModal(val) {
  const storeModalSelect = document.getElementById('settingPlatformFeeAmount');
  if (storeModalSelect) storeModalSelect.value = val;
  if (typeof updateFeePayerLabels === 'function') updateFeePayerLabels();
}
window.syncOlseraPlatformFeeToModal = syncOlseraPlatformFeeToModal;

// ==========================================
// 11. EXPORTS GLOBAL WINDOW
// ==========================================
// 6.5. RESTOCK / KULAKAN DARI PUSAT SR12
// ==========================================
function openRestockProductModal(targetProductId) {
  const modal = document.getElementById('modalRestockProduct');
  const select = document.getElementById('restockProductSelect');
  if (!modal || !select || typeof appState === 'undefined') return;

  const prods = appState.products || [];
  select.innerHTML = prods.map(p => {
    return `<option value="${p.id}" ${targetProductId && p.id === targetProductId ? 'selected' : ''}>${p.name} (Stok: ${p.stock || 0} pcs)</option>`;
  }).join('');

  if (targetProductId) {
    select.value = targetProductId;
  }
  handleRestockProductSelectChange();
  modal.classList.add('open');
}

function handleRestockProductSelectChange() {
  const select = document.getElementById('restockProductSelect');
  const currentStockDisplay = document.getElementById('restockCurrentStockDisplay');
  const hppInput = document.getElementById('restockHppInput');
  if (!select || typeof appState === 'undefined') return;

  const prodId = select.value;
  const prod = (appState.products || []).find(p => p.id === prodId);
  if (!prod) return;

  const stock = typeof prod.stock !== 'undefined' ? prod.stock : 85;
  if (currentStockDisplay) currentStockDisplay.textContent = `${stock} pcs`;

  const het = Number(prod.het || prod.price || prod.het_price) || 0;
  // Modal kulakan distributor resmi = 50% dari HET
  const estHpp = Math.round(het * 0.50);
  if (hppInput) hppInput.value = estHpp;

  calculateRestockTotalCost();
}

function calculateRestockTotalCost() {
  const qtyInput = document.getElementById('restockQtyInput');
  const hppInput = document.getElementById('restockHppInput');
  const totalDisplay = document.getElementById('restockGrandTotalDisplay');
  if (!qtyInput || !hppInput || !totalDisplay) return;

  const qty = parseInt(qtyInput.value, 10) || 0;
  const hpp = parseInt(hppInput.value, 10) || 0;
  const grandTotal = qty * hpp;
  totalDisplay.textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;
}

function handleSaveRestockSubmit(e) {
  if (e) e.preventDefault();
  if (typeof appState === 'undefined') return;

  const select = document.getElementById('restockProductSelect');
  const qtyInput = document.getElementById('restockQtyInput');
  const hppInput = document.getElementById('restockHppInput');
  const sourceSelect = document.getElementById('restockPaymentSource');
  const invoiceInput = document.getElementById('restockInvoiceNotes');

  const prodId = select?.value;
  const prod = (appState.products || []).find(p => p.id === prodId);
  if (!prod) {
    alert('Pilih produk terlebih dahulu.');
    return;
  }

  const qty = parseInt(qtyInput?.value, 10) || 0;
  const hpp = parseInt(hppInput?.value, 10) || 0;
  if (qty <= 0 || hpp <= 0) {
    alert('Jumlah kulakan dan harga modal harus lebih dari 0.');
    return;
  }

  const isCash = sourceSelect?.value === 'cash';
  const totalCost = qty * hpp;
  const invoiceNo = (invoiceInput?.value.trim()) || ('INV-SR12-PUSAT-' + Math.floor(1000 + Math.random() * 9000));

  const oldStock = Number(prod.stock) || 0;
  const newStock = oldStock + qty;
  prod.stock = newStock;

  // 1. Simpan stok produk
  if (typeof window.saveStoredProducts === 'function') {
    window.saveStoredProducts(appState.products);
  }

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  // 2. Catat Kartu Riwayat Mutasi Stok
  recordStockMutation({
    date: dateFormatted,
    productId: prod.id,
    productName: prod.name,
    type: 'IN_RESTOCK',
    typeLabel: 'Kulakan dari PT SR12 Pusat',
    qty: qty,
    stockBefore: oldStock,
    stockAfter: newStock,
    refNo: invoiceNo,
    notes: `Kulakan ${qty} pcs @ Rp ${hpp.toLocaleString('id-ID')} (${isCash ? 'Kas Tunai' : 'Transfer Bank'})`
  });

  // 3. Catat Kas Keluar di Buku Kas
  if (!appState.cashflow) appState.cashflow = [];
  appState.cashflow.unshift({
    id: 'CSH-' + Math.floor(1000 + Math.random() * 9000),
    date: dateFormatted.split(' ')[0],
    type: 'out',
    account: isCash ? 'CASH' : 'TRANSFER',
    category: 'Kulakan Produk ke PT SR12 Pusat',
    notes: `Kulakan ${prod.name} ${qty} pcs (${invoiceNo}) [${isCash ? 'Kas Tunai' : 'Transfer Bank'}]`,
    amount: totalCost
  });
  saveStoredCashflow(appState.cashflow);

  // 4. Update UI
  closeModal('modalRestockProduct');
  if (typeof renderInventoryTable === 'function') renderInventoryTable();
  if (typeof renderProducts === 'function') renderProducts();
  if (typeof renderPosProductCatalog === 'function') renderPosProductCatalog();
  if (typeof renderCashflowTable === 'function') renderCashflowTable();
  if (typeof renderReportsView === 'function') renderReportsView();

  if (typeof showToast === 'function') {
    showToast(`📦 Berhasil kulakan ${qty} pcs ${prod.name}! Stok sekarang: ${newStock} pcs.`);
  }
}

// ==========================================
// 6.6. KARTU RIWAYAT MUTASI STOK GUDANG MODAL
// ==========================================
function openStockMutationsModal() {
  const modal = document.getElementById('modalStockMutations');
  if (!modal) return;
  renderStockMutationsTable();
  modal.classList.add('open');
}

function renderStockMutationsTable() {
  const tbody = document.getElementById('stockMutationsTableBody');
  const query = (document.getElementById('filterMutationQuery')?.value.trim().toLowerCase()) || '';
  if (!tbody) return;

  let list = getStoredStockMutations();
  if (query) {
    list = list.filter(m => 
      (m.productName && m.productName.toLowerCase().includes(query)) ||
      (m.refNo && m.refNo.toLowerCase().includes(query)) ||
      (m.typeLabel && m.typeLabel.toLowerCase().includes(query))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: #94a3b8;">
          📜 Belum ada catatan mutasi stok. Transaksi penjualan kasir atau kulakan akan otomatis tercatat di sini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(m => {
    const isPlus = m.qty > 0;
    return `
      <tr>
        <td style="font-size: 0.76rem; color: #64748b; white-space: nowrap;">${m.date}</td>
        <td><b>${m.productName}</b></td>
        <td>
          <span style="background: ${isPlus ? '#eff6ff' : '#fef2f2'}; color: ${isPlus ? '#1d4ed8' : '#991b1b'}; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 0.72rem;">
            ${m.typeLabel || m.type}
          </span>
        </td>
        <td style="text-align: center; font-weight: 900; color: ${isPlus ? '#059669' : '#dc2626'}; font-size: 0.88rem;">
          ${isPlus ? '+' : ''}${m.qty} pcs
        </td>
        <td style="text-align: center; font-size: 0.8rem; color: #334155;">
          ${m.stockBefore} ➔ <b>${m.stockAfter} pcs</b>
        </td>
        <td style="font-size: 0.76rem; color: #475569; font-weight: 600;">${m.refNo}</td>
        <td style="font-size: 0.74rem; color: #64748b;">${m.notes || '-'}</td>
      </tr>
    `;
  }).join('');
}

function clearAllStockMutations() {
  if (!confirm('Hapus seluruh riwayat mutasi stok gudang?')) return;
  saveStoredStockMutations([]);
  renderStockMutationsTable();
  if (typeof showToast === 'function') showToast('Riwayat mutasi stok berhasil direset.');
}

// ==========================================
// 11. EXPORTS GLOBAL WINDOW
// ==========================================
window.showDistributorPortalView = showDistributorPortalView;
window.switchOlseraTab = switchOlseraTab;
window.renderPosProducts = renderPosProducts;
window.handlePosSearch = handlePosSearch;
window.filterPosCategory = filterPosCategory;
window.addPosCartItem = addPosCartItem;
window.updatePosCartQty = updatePosCartQty;
window.removePosCartItem = removePosCartItem;
window.clearPosCart = clearPosCart;
window.handlePosBuyerTierChange = handlePosBuyerTierChange;
window.togglePosCashInput = togglePosCashInput;
window.calculatePosChange = calculatePosChange;
window.processPosCheckout = processPosCheckout;
window.openPosReceiptModal = openPosReceiptModal;
window.printPosReceiptWindow = printPosReceiptWindow;
window.sendPosReceiptViaWhatsApp = sendPosReceiptViaWhatsApp;
window.renderPosTransactions = renderPosTransactions;
window.filterTransactions = filterTransactions;
window.viewHistoricalReceipt = viewHistoricalReceipt;
window.renderInventoryTable = renderInventoryTable;
window.quickUpdateStock = quickUpdateStock;
window.openRestockProductModal = openRestockProductModal;
window.handleRestockProductSelectChange = handleRestockProductSelectChange;
window.calculateRestockTotalCost = calculateRestockTotalCost;
window.handleSaveRestockSubmit = handleSaveRestockSubmit;
window.openStockMutationsModal = openStockMutationsModal;
window.renderStockMutationsTable = renderStockMutationsTable;
window.clearAllStockMutations = clearAllStockMutations;
window.renderCashflowTable = renderCashflowTable;
window.openAddCashflowModal = openAddCashflowModal;
window.handleSaveCashflowSubmit = handleSaveCashflowSubmit;
window.deleteCashflowEntry = deleteCashflowEntry;
window.renderReportsView = renderReportsView;
window.exportReportsToCSV = exportReportsToCSV;
window.populateOlseraSettingsForm = populateOlseraSettingsForm;
window.handleSaveOlseraSettings = handleSaveOlseraSettings;
window.handleOlseraLogoUpload = handleOlseraLogoUpload;
window.handleOlseraLogoUrlInput = handleOlseraLogoUrlInput;
window.resetOlseraLogoToDefault = resetOlseraLogoToDefault;
window.updateOlseraSettingsLogoPreview = updateOlseraSettingsLogoPreview;
window.handleOlseraBannerUpload = handleOlseraBannerUpload;
window.updateOlseraSettingsBannerPreview = updateOlseraSettingsBannerPreview;
window.resetOlseraBannerToDefault = resetOlseraBannerToDefault;
window.autoTrimAndCenterImage = autoTrimAndCenterImage;
window.scrollPosToCheckout = function() {
  const panel = document.querySelector('.pos-register-panel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const nameInput = document.getElementById('posCustomerName');
    if (nameInput) setTimeout(() => nameInput.focus(), 400);
  }
};

window.switchAbsensiTab = switchAbsensiTab;
window.handleSelectCashierPreset = handleSelectCashierPreset;
window.handleClockInSubmit = handleClockInSubmit;
window.handleClockOutCashier = handleClockOutCashier;
window.clearAbsensiLogs = clearAbsensiLogs;
window.updateCashierBadgeUI = updateCashierBadgeUI;
window.initCashierAttendanceState = initCashierAttendanceState;
window.initOlseraDrawerSwipeGesture = initOlseraDrawerSwipeGesture;

function initOlseraSuiteComponents() {
  initCashierAttendanceState();
  initOlseraDrawerSwipeGesture();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOlseraSuiteComponents);
} else {
  initOlseraSuiteComponents();
}


