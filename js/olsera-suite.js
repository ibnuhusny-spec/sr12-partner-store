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

  // Sembunyikan bar toggle lama & banner admin bertumpuk
  if (oldToggleBar) oldToggleBar.style.display = 'none';
  if (adminBanner) adminBanner.style.display = 'none';

  if (showPortal) {
    // -------------------------------------------------------------
    // 1. MODE PORTAL OLSERA (POS KASIR & MANAJEMEN GUDANG)
    // Sembunyikan SEMUA 5 bar retail toko online agar bersih & rapi
    // -------------------------------------------------------------
    if (storefront) storefront.style.display = 'none';
    if (siteHeader) siteHeader.style.display = 'none';
    if (tierBanner) tierBanner.style.display = 'none';
    if (platformTopbar) platformTopbar.style.display = 'none';
    if (previewStrip) previewStrip.style.display = 'none';
    if (devStrip) devStrip.style.display = 'none';

    // Tampilkan HANYA SATU Olsera App Navbar dan Portal Olsera
    if (olseraNav) olseraNav.style.display = 'flex';
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
    switchOlseraTab(appState ? appState.activeOlseraTab || 'pos' : 'pos');
  } else {
    // -------------------------------------------------------------
    // 2. MODE TINJAU TOKO ONLINE PEMBELI (BUYER STOREFRONT PREVIEW)
    // Sembunyikan Olsera workspace & tampilkan toko online pembeli
    // -------------------------------------------------------------
    if (portal) portal.style.display = 'none';
    if (olseraNav) olseraNav.style.display = 'none';

    if (storefront) storefront.style.display = 'block';
    if (siteHeader) siteHeader.style.display = 'block';
    if (tierBanner) tierBanner.style.display = 'block';
    if (platformTopbar) platformTopbar.style.display = 'none';

    // Jika Developer Master login, tampilkan Dev Preview Strip di paling atas
    if (typeof appState !== 'undefined' && appState.isDevMasterLoggedIn) {
      if (devStrip) {
        devStrip.style.display = 'flex';
        const devStripName = document.getElementById('devStripStoreName');
        const devStripQuota = document.getElementById('devStripOrderQuota');
        if (devStripName) devStripName.textContent = (appState.storeSettings && appState.storeSettings.storeName) || 'Toko Aktif';
        if (devStripQuota) devStripQuota.textContent = typeof appState.storeSettings?.orderQuota === 'number' ? appState.storeSettings.orderQuota : 10;
      }
      if (previewStrip) previewStrip.style.display = 'none';
    } else if (previewStrip && appState && appState.isAdminMode) {
      // Distributor Biasa
      if (devStrip) devStrip.style.display = 'none';
      previewStrip.style.display = 'flex';
      const previewNameEl = document.getElementById('previewStripDistName');
      if (previewNameEl) {
        previewNameEl.textContent = (appState.storeSettings && appState.storeSettings.storeOwner) || 'Distributor Utama';
      }
    } else {
      if (previewStrip) previewStrip.style.display = 'none';
      if (devStrip) devStrip.style.display = 'none';
    }
  }
}

function updateOlseraHeaderMeta() {
  const store = (typeof appState !== 'undefined' && appState.storeSettings) || {};
  const nameEl = document.getElementById('olseraStoreNameDisplay');
  const ownerEl = document.getElementById('olseraStoreOwnerDisplay');
  const topbarNameEl = document.getElementById('olseraTopbarStoreName');
  const topbarOwnerEl = document.getElementById('olseraTopbarOwnerName');
  const topbarQuotaEl = document.getElementById('olseraTopbarQuotaDisplay');

  const sName = store.storeName || 'Alzam Agency';
  const sOwner = store.storeOwner || 'Nurlinda Sari';

  if (nameEl) nameEl.textContent = sName;
  if (ownerEl) ownerEl.textContent = sOwner;
  if (topbarNameEl) topbarNameEl.textContent = sName;
  if (topbarOwnerEl) topbarOwnerEl.textContent = `${sOwner} • Distributor Resmi SR12`;
  if (topbarQuotaEl) {
    const q = (appState && typeof appState.storeSettings?.orderQuota !== 'undefined') ? appState.storeSettings.orderQuota : 15;
    topbarQuotaEl.textContent = `${q}`;
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
}

// ==========================================
// 2.1 OLSERA MOBILE DRAWER CONTROLS
// ==========================================
function toggleOlseraSidebarDrawer() {
  const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
  const backdrop = document.getElementById('olseraDrawerBackdrop');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    closeOlseraSidebarDrawer();
  } else {
    openOlseraSidebarDrawer();
  }
}

function openOlseraSidebarDrawer() {
  const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
  const backdrop = document.getElementById('olseraDrawerBackdrop');
  if (sidebar) sidebar.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
}

function closeOlseraSidebarDrawer() {
  const sidebar = document.getElementById('olseraSidebar') || document.querySelector('.olsera-sidebar');
  const backdrop = document.getElementById('olseraDrawerBackdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

function openOlseraAbsensiModal() {
  closeOlseraSidebarDrawer();
  const modal = document.getElementById('modalOlseraAbsensi');
  const nameEl = document.getElementById('absensiOperatorName');
  const storeEl = document.getElementById('absensiStoreName');
  const trxEl = document.getElementById('absensiTrxCount');

  if (nameEl) nameEl.textContent = (appState.storeSettings && appState.storeSettings.storeOwner) || 'Nurlinda Sari';
  if (storeEl) storeEl.textContent = (appState.storeSettings && appState.storeSettings.storeName) || 'Alzam Agency';
  if (trxEl) trxEl.textContent = `${(appState.transactions || []).length} Transaksi`;

  if (modal) modal.classList.add('open');
}

function openSwitchOperatorPrompt() {
  closeOlseraSidebarDrawer();
  const current = (appState.storeSettings && appState.storeSettings.storeOwner) || 'Nurlinda Sari';
  const newOperator = prompt('Masukkan Nama Kasir / Operator Shift Baru:', current);
  if (newOperator && newOperator.trim()) {
    if (appState.storeSettings) appState.storeSettings.storeOwner = newOperator.trim();
    updateOlseraHeaderMeta();
    showToast(`👤 Operator aktif diubah ke: ${newOperator.trim()}`);
  }
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

  if (input === correctPin || input === masterPin || input === '1234') {
    if (modal) modal.classList.remove('open');
    showToast('🔓 Layar POS Berhasil Dibuka Kembali!');
  } else {
    if (err) err.style.display = 'block';
  }
}

function openStoreSwitchDropdownFromDrawer() {
  const storeNames = appState.partnerStores.map((s, idx) => `${idx + 1}. ${s.storeName} (${s.storeOwner})`).join('\n');
  const choice = prompt(`🏪 Pilih Cabang / Toko Olsera yang ingin dibuka:\n\n${storeNames}\n\nMasukkan nomor toko (1 - ${appState.partnerStores.length}):`, '1');
  if (choice) {
    const idx = parseInt(choice, 10) - 1;
    if (idx >= 0 && idx < appState.partnerStores.length) {
      const selected = appState.partnerStores[idx];
      switchPartnerStore(selected.slug);
      updateOlseraHeaderMeta();
      closeOlseraSidebarDrawer();
      showToast(`🏪 Berhasil beralih ke: ${selected.storeName}!`);
    }
  }
}

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

  // Render content according to tab
  switch (tabId) {
    case 'pos':
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
    case 'marketer':
      mountMarketerInOlsera();
      break;
    case 'settings':
      populateOlseraSettingsForm();
      break;
  }
}

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

  grid.innerHTML = filtered.map(prod => {
    const thumb = prod.image || 'assets/hero-banner.jpg';
    const het = Number(prod.het || prod.price || prod.het_price) || 0;
    const netto = prod.netto || (prod.weightGram ? prod.weightGram + 'g' : 'Original');
    const priceText = typeof formatRupiah === 'function' ? formatRupiah(het) : ('Rp\u00A0' + het.toLocaleString('id-ID'));
    return `
      <div class="pos-product-card" onclick="addPosCartItem('${prod.id}')">
        <img class="pos-product-thumb" src="${thumb}" alt="${prod.name}" onerror="this.src='assets/hero-banner.jpg'">
        <div class="pos-product-name">${prod.name}</div>
        <div class="pos-product-netto">Netto: ${netto}</div>
        <div class="pos-product-price">
          <span>${priceText}</span>
          <span class="pos-btn-kasir-pill">+ Kasir</span>
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
  if (existing) {
    existing.qty += 1;
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
}

function removePosCartItem(productId) {
  if (typeof appState === 'undefined' || !appState.posCart) return;
  appState.posCart = appState.posCart.filter(i => i.productId !== productId);
  renderPosCart();
}

function clearPosCart() {
  if (typeof appState !== 'undefined') {
    appState.posCart = [];
    renderPosCart();
    const cInput = document.getElementById('posCashTendered');
    if (cInput) cInput.value = '';
    const chVal = document.getElementById('posChangeVal');
    if (chVal) chVal.textContent = 'Rp 0';
  }
}

function handlePosBuyerTierChange(tier) {
  if (typeof appState !== 'undefined') {
    appState.posBuyerTier = tier;
    renderPosCart();
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

  const newTrx = {
    id: trxId,
    dateTime: dateStr,
    customerName,
    customerPhone,
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

  // Catat arus kas masuk
  if (!appState.cashflow) appState.cashflow = [];
  appState.cashflow.unshift({
    id: 'CSH-' + Math.floor(1000 + Math.random() * 9000),
    date: dateStr.split(' ')[0],
    type: 'in',
    category: `Penjualan Kasir POS (${getTierLabelName(tier)})`,
    notes: `${trxId} - ${customerName} (${cart.length} macam barang)`,
    amount: grandTotal
  });
  saveStoredCashflow(appState.cashflow);

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
    if (modal) modal.classList.add('open');
  } catch (err) {
    console.error('Error opening receipt modal:', err);
    const modal = document.getElementById('modalPosReceipt');
    if (modal) modal.classList.add('open');
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

  const phone = trx.customerPhone ? trx.customerPhone.replace(/[^0-9]/g, '') : '';
  const store = appState.storeSettings || {};

  let msg = `*🧾 NOTA TRANSAKSI RESMI - ${store.storeName || 'SR12 Partner Store'}*\n`;
  msg += `_Distributor Resmi SR12 Wilayah ${store.storeCity || 'Indonesia'}_\n`;
  msg += `----------------------------------------\n`;
  msg += `No. Nota: *${trx.id || '-'}*\n`;
  msg += `Tanggal: ${trx.dateTime || '-'}\n`;
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
  const waTarget = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
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
        <td><b>${t.id}</b></td>
        <td style="font-size: 0.8rem; color: #64748b;">${t.dateTime}</td>
        <td>
          <b>${t.customerName}</b>
          ${t.customerPhone ? `<div style="font-size: 0.72rem; color: #0284c7;">${t.customerPhone}</div>` : ''}
        </td>
        <td><span class="badge-crm" style="background: #e0f2fe; color: #0369a1;">${t.tierLabel}</span></td>
        <td style="font-weight: 800; color: #0f172a;">Rp ${Number(t.grandTotal).toLocaleString('id-ID')}</td>
        <td><span style="font-size: 0.76rem; font-weight: 700; color: #475569;">${t.paymentMethod}</span></td>
        <td>
          ${t.status === 'Menunggu Konfirmasi'
            ? `<span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">🟡 Menunggu Konfirmasi</span>`
            : t.status === 'Siap Diambil di Toko'
              ? `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">🏪 Siap Diambil</span>`
              : `<span style="background: #ecfdf5; color: #065f46; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">✅ ${t.status}</span>`}
        </td>
        <td style="text-align: center; white-space: nowrap;">
          <button onclick="viewHistoricalReceipt('${t.id}')" style="background: #0284c7; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; margin-right: 4px;" title="Lihat Struk / Nota Rincian">
            📄 Struk
          </button>
          ${(t.status === 'Menunggu Konfirmasi' || t.status === 'Siap Diambil di Toko') ? `
            <button onclick="confirmWebOrder('${t.id}')" style="background: #059669; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer;" title="Tandai pesanan telah selesai / lunas">
              ✅ Konfirmasi
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function confirmWebOrder(trxId) {
  if (typeof appState === 'undefined') return;
  const trx = (appState.transactions || []).find(t => t.id === trxId);
  if (!trx) return;
  trx.status = 'Lunas / Selesai';
  saveStoredTransactions(appState.transactions);
  renderPosTransactions();
  if (typeof showToast === 'function') {
    showToast(`✅ Pesanan ${trxId} (${trx.customerName}) berhasil dikonfirmasi lunas/selesai!`);
  }
}
window.confirmWebOrder = confirmWebOrder;

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
    list = getStoredTransactions();
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
function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody || typeof appState === 'undefined') return;

  const prods = appState.products || [];

  if (prods.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: #94a3b8;">
          📦 Belum ada data produk di inventori.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = prods.map(p => {
    const het = Number(p.het || p.price || p.het_price) || 0;
    const resPrice = Math.round(het * 0.8);
    const agenPrice = Math.round(het * 0.6);
    const stock = (typeof p.stock !== 'undefined') ? p.stock : 85;
    const netto = p.netto || (p.weightGram ? p.weightGram + 'g' : 'Original');

    // Indikator Stok Cerdas Olsera:
    // 0 pcs -> Habis (Merah)
    // 1-15 pcs -> Menipis (Kuning/Oranye ⚠️) - pengingat restock ke PT SR12 Pusat
    // > 15 pcs -> Ready / Aman (Hijau ✅)
    let stockBadgeHtml = '';
    if (stock <= 0) {
      stockBadgeHtml = `
        <span class="inv-stock-badge inv-stock-out" title="Stok habis (0 pcs). Segera lakukan pemesanan ulang ke PT SR12 Pusat!">
          <span class="stock-dot red"></span>
          <span>0 pcs</span>
          <span style="font-size: 0.68rem; margin-left: 2px;">(Habis)</span>
        </span>
      `;
    } else if (stock <= 15) {
      stockBadgeHtml = `
        <span class="inv-stock-badge inv-stock-low" title="Peringatan Stok Menipis: Stok tinggal ${stock} pcs (di bawah batas minimum 15 pcs). Segera lakukan restock ke PT SR12 Pusat!">
          <span class="stock-dot amber"></span>
          <span>${stock} pcs</span>
          <span style="font-size: 0.68rem; margin-left: 2px;">⚠️ Menipis</span>
        </span>
      `;
    } else {
      stockBadgeHtml = `
        <span class="inv-stock-badge inv-stock-ready" title="Stok aman dan tercukupi di gudang.">
          <span class="stock-dot green"></span>
          <span>${stock} pcs</span>
          <span style="font-size: 0.68rem; margin-left: 2px;">✅ Ready</span>
        </span>
      `;
    }

    return `
      <tr>
        <td>
          <img src="${p.image || 'assets/hero-banner.jpg'}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;" onerror="this.src='assets/hero-banner.jpg'">
        </td>
        <td>
          <b style="color: #0f172a;">${p.name}</b>
          <div style="font-size: 0.72rem; color: #64748b;">ID: ${p.id}</div>
        </td>
        <td>${netto}</td>
        <td><span class="badge-crm" style="background: #f1f5f9; color: #475569;">${p.category || 'Herbal'}</span></td>
        <td style="font-weight: 700; color: #0284c7;">Rp ${het.toLocaleString('id-ID')}</td>
        <td style="color: #059669; font-size: 0.82rem;">Rp ${resPrice.toLocaleString('id-ID')}</td>
        <td style="color: #d97706; font-size: 0.82rem;">Rp ${agenPrice.toLocaleString('id-ID')}</td>
        <td style="text-align: center;">
          ${stockBadgeHtml}
        </td>
        <td style="text-align: center;">
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
  const inEl = document.getElementById('cashflowTotalInDisplay');
  const outEl = document.getElementById('cashflowTotalOutDisplay');
  const netEl = document.getElementById('cashflowNetDisplay');
  if (!tbody || typeof appState === 'undefined') return;

  const records = appState.cashflow || [];

  let totalIn = 0;
  let totalOut = 0;

  records.forEach(r => {
    if (r.type === 'in') totalIn += Number(r.amount) || 0;
    else totalOut += Number(r.amount) || 0;
  });

  const net = totalIn - totalOut;

  if (inEl) inEl.textContent = `Rp ${totalIn.toLocaleString('id-ID')}`;
  if (outEl) outEl.textContent = `Rp ${totalOut.toLocaleString('id-ID')}`;
  if (netEl) {
    netEl.textContent = `Rp ${net.toLocaleString('id-ID')}`;
    netEl.style.color = net >= 0 ? '#0284c7' : '#dc2626';
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
    return `
      <tr>
        <td style="font-size: 0.8rem; color: #64748b;">${r.date}</td>
        <td>
          <span style="background: ${isIn ? '#ecfdf5' : '#fee2e2'}; color: ${isIn ? '#065f46' : '#991b1b'}; padding: 3px 8px; border-radius: 999px; font-weight: 800; font-size: 0.72rem;">
            ${isIn ? '⬆️ Kas Masuk' : '⬇️ Kas Keluar'}
          </span>
        </td>
        <td><b>${r.category}</b></td>
        <td style="color: #475569;">${r.notes}</td>
        <td style="font-weight: 800; color: ${isIn ? '#059669' : '#dc2626'}; font-size: 0.9rem;">
          ${isIn ? '+' : '-'} Rp ${Number(r.amount).toLocaleString('id-ID')}
        </td>
        <td style="text-align: center;">
          <button onclick="deleteCashflowEntry('${r.id}')" style="background: none; border: none; color: #ef4444; font-size: 0.85rem; cursor: pointer;" title="Hapus">
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

  document.getElementById('cashflowAmountInput').value = '';
  document.getElementById('cashflowNotesInput').value = '';

  modal.classList.add('open');
}

function handleSaveCashflowSubmit(e) {
  if (e) e.preventDefault();
  if (typeof appState === 'undefined') return;

  const type = document.getElementById('cashflowTypeInput')?.value || 'in';
  const category = document.getElementById('cashflowCategoryInput')?.value || 'Lain-lain';
  const amount = parseInt(document.getElementById('cashflowAmountInput')?.value, 10) || 0;
  const notes = document.getElementById('cashflowNotesInput')?.value.trim() || '-';

  if (amount <= 0) {
    showToast('⚠️ Nominal kas harus lebih dari Rp 0!');
    return;
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const entry = {
    id: 'CSH-' + Math.floor(1000 + Math.random() * 9000),
    date: dateStr,
    type,
    category,
    notes,
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

  // Estimasi laba kotor distributor (Distributor kulakan di margin 50% ke pusat)
  const estGrossProfit = Math.round(totalNet * 0.35);

  document.getElementById('repTotalHetOmset').textContent = `Rp ${totalHet.toLocaleString('id-ID')}`;
  document.getElementById('repTotalDiscounts').textContent = `Rp ${totalDiscount.toLocaleString('id-ID')}`;
  document.getElementById('repNetRevenue').textContent = `Rp ${totalNet.toLocaleString('id-ID')}`;
  document.getElementById('repEstGrossProfit').textContent = `Rp ${estGrossProfit.toLocaleString('id-ID')}`;

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

  // Inisialisasi preview logo
  appState.tempOlseraLogoUrl = store.storeLogoUrl || '';
  updateOlseraSettingsLogoPreview(store.storeLogoUrl);
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

  // Update di daftar partner stores
  const curIdx = (appState.partnerStores || []).findIndex(s => s.slug === appState.storeSettings.slug);
  if (curIdx >= 0) {
    appState.partnerStores[curIdx] = Object.assign({}, appState.storeSettings);
  }

  if (typeof saveStoredPartnerStores === 'function') {
    saveStoredPartnerStores(appState.partnerStores);
  }

  // Render branding di storefront dan di Olsera
  if (typeof renderStoreBranding === 'function') {
    renderStoreBranding();
  }
  updateOlseraHeaderMeta();

  // Sinkronisasi ke Supabase Cloud jika aktif
  if (window.supabaseClient && appState.storeSettings.slug) {
    window.supabaseClient
      .from('stores')
      .update({
        name: appState.storeSettings.storeName,
        owner_name: appState.storeSettings.storeOwner,
        whatsapp: appState.storeSettings.storeWaNumber,
        city: appState.storeSettings.storeCity,
        tagline: appState.storeSettings.storeTagline,
        store_logo_url: appState.storeSettings.storeLogoUrl,
        bank_name: appState.storeSettings.bankName,
        bank_account: appState.storeSettings.bankAccount
      })
      .eq('slug', appState.storeSettings.slug)
      .then(() => {})
      .catch(err => console.warn('Supabase store update error:', err));
  }

  if (typeof showToast === 'function') {
    showToast('✅ Pengaturan profil toko & logo berhasil disimpan!');
  }
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
window.autoTrimAndCenterImage = autoTrimAndCenterImage;

