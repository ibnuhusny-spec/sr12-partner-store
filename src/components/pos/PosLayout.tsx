import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { PosCashierView } from './PosCashierView';
import { PosTransactionsView } from './PosTransactionsView';
import { PosInventoryView } from './PosInventoryView';
import { PosCashflowView } from './PosCashflowView';
import { PosReportsView } from './PosReportsView';
import { PosDownlinesView } from './PosDownlinesView';
import {
  ShoppingCart,
  Receipt,
  Package,
  Wallet,
  BarChart3,
  Users,
  Store as StoreIcon,
  Clock,
  Lock,
  ChevronLeft,
  Coins,
  RotateCcw,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { TokenTopupModal } from './TokenTopupModal';
import { clearAllOrders } from '../../services/orderService';
import { clearAllCashflow, clearAllStockMutations } from '../../services/posService';
import { clearAllStoreDownlines, resetDownlineAccumulatedSpent, clearAllMarketerSales } from '../../services/mitraService';

interface PosLayoutProps {
  products: Product[];
  onUpdateStock: (productId: string, newStock: number) => void;
  onUpdateProduct: (product: Product) => void;
  onResetCatalogToMaster?: () => void;
}

export const PosLayout: React.FC<PosLayoutProps> = ({
  products,
  onUpdateStock,
  onUpdateProduct,
  onResetCatalogToMaster
}) => {
  const { currentStore, setIsPosOpen, logoutStoreAdmin } = useApp();
  const [activeTab, setActiveTab] = useState<'cashier' | 'transactions' | 'inventory' | 'cashflow' | 'reports' | 'downlines'>('cashier');
  const [cashierName, setCashierName] = useState('Siti Aminah');
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const handleMasterResetSimulation = async () => {
    if (window.confirm(`⚠️ PERINGATAN MASTER RESET:\n\nApakah Anda ingin MERESET SEMUA data toko "${currentStore.storeName}"?\n\n• Seluruh riwayat transaksi akan dihapus\n• Seluruh catatan buku kas akan dihapus\n• Seluruh riwayat mutasi stok akan dibersihkan\n• Seluruh mitra downline akan dikosongkan (0 mitra)\n• Seluruh komisi marketer akan dibersihkan\n• Stok produk akan dikembalikan ke Master SR12 (50 pcs)\n\nSimulasi akan bersih dan kembali ke kondisi awal.`)) {
      await clearAllOrders(currentStore.slug);
      await clearAllCashflow(currentStore.slug);
      await clearAllStockMutations(currentStore.slug);
      await clearAllStoreDownlines(currentStore.slug);
      clearAllMarketerSales();
      if (onResetCatalogToMaster) {
        onResetCatalogToMaster();
      }
      alert('Pembersihan Berhasil! Seluruh data transaksi, mitra, kas, dan mutasi telah dikosongkan.');
      window.location.reload();
    }
  };

  return (
    <div className="pos-wrapper">
      {/* POS Topbar Header (Clean, Non-Clipping on Mobile & Explicit Logout) */}
      <header
        className="pos-header"
        style={{
          background: '#090f1d',
          borderBottom: '1px solid #1e293b',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          minHeight: '52px'
        }}
      >
        {/* Left: Store Branding & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
          <button
            type="button"
            onClick={() => setIsPosOpen(false)}
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '6px 9px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Kembali ke Etalase Toko Online Pembeli"
          >
            <ChevronLeft size={16} />
            <span className="hide-on-mobile">Etalase Toko</span>
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}
                title={currentStore.storeName}
              >
                {currentStore.storeName}
              </span>
              <span style={{ fontSize: '0.62rem', background: '#0369a1', color: '#e0f2fe', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                POS
              </span>
            </div>
            <div className="hide-on-mobile" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              Gudang &bull; {currentStore.storeCity}
            </div>
          </div>
        </div>

        {/* Right: Actions, Token & Clear Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Token Kuota Indicator & Topup Trigger */}
          <button
            type="button"
            onClick={() => setShowTokenModal(true)}
            style={{
              background: (currentStore.orderQuota || 0) <= 0 
                ? 'rgba(239, 68, 68, 0.2)' 
                : (currentStore.orderQuota || 0) <= 5 
                ? 'rgba(245, 158, 11, 0.2)' 
                : '#0f172a',
              color: (currentStore.orderQuota || 0) <= 0 
                ? '#f87171' 
                : (currentStore.orderQuota || 0) <= 5 
                ? '#fbbf24' 
                : '#f59e0b',
              border: `1px solid ${(currentStore.orderQuota || 0) <= 0 ? '#ef4444' : (currentStore.orderQuota || 0) <= 5 ? '#f59e0b' : '#334155'}`,
              padding: '5px 8px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Kelola Kuota Token Transaksi & Pengaturan Biaya Admin Toko"
          >
            <Coins size={13} color="#f59e0b" />
            <span><b>{currentStore.orderQuota || 0}</b> <span className="hide-on-mobile">Token</span></span>
            <span style={{ fontSize: '0.6rem', background: '#f59e0b', color: '#0f172a', padding: '1px 4px', borderRadius: '3px', fontWeight: 900 }}>+ISI</span>
          </button>

          {/* Clock-in (Kasir) Indicator - Desktop Only */}
          <div
            className="hide-on-mobile"
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '4px 8px',
              borderRadius: '999px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Clock size={12} color={isClockedIn ? '#34d399' : '#f59e0b'} />
            <span style={{ color: '#94a3b8' }}>Kasir:</span>
            <b style={{ color: '#f8fafc' }}>{cashierName}</b>
            <span
              onClick={() => setIsClockedIn(!isClockedIn)}
              style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                color: isClockedIn ? '#34d399' : '#f59e0b',
                background: isClockedIn ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                padding: '1px 4px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="Klik untuk ubah status Clock-In / Clock-Out"
            >
              {isClockedIn ? 'AKTIF' : 'OFF'}
            </span>
          </div>

          {/* Master Reset Simulasi */}
          <button
            type="button"
            onClick={handleMasterResetSimulation}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '5px 8px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Bersihkan semua data simulasi (transaksi, kas, mutasi, belanja mitra) untuk mulai dari nol"
          >
            <RotateCcw size={12} />
            <span className="hide-on-mobile">Reset Toko</span>
          </button>

          {/* PROMINENT LOGOUT BUTTON WITH CONFIRMATION */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirmModal(true)}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 11px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)'
            }}
            title="Keluar dari akun admin toko & kasir POS"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs (Desktop only) */}
      <nav className="hide-on-mobile" style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '0 8px', display: 'flex', gap: '2px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setActiveTab('cashier')}
          style={{
            padding: '10px 12px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: activeTab === 'cashier' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'cashier' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <ShoppingCart size={14} />
          <span>Kasir</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '10px 12px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: activeTab === 'transactions' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'transactions' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <Receipt size={14} />
          <span>Transaksi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 12px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: activeTab === 'inventory' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'inventory' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <Package size={14} />
          <span>Inventori &amp; Stok</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          style={{
            padding: '10px 12px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: activeTab === 'cashflow' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'cashflow' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <Wallet size={14} />
          <span>Buku Kas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '10px 12px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: activeTab === 'reports' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'reports' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <BarChart3 size={14} />
          <span>Laporan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('downlines')}
          style={{
            padding: '10px 12px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: activeTab === 'downlines' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'downlines' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={14} />
          <span>Mitra &amp; Downline</span>
        </button>
      </nav>

      {/* Main Tab Content */}
      <main className="pos-main-container" style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'cashier' && (
          <PosCashierView
            products={products}
            activeCashierName={cashierName}
            onUpdateStock={onUpdateStock}
            onSwitchTab={(tab) => setActiveTab(tab as any)}
          />
        )}
        {activeTab === 'transactions' && <PosTransactionsView />}
        {activeTab === 'inventory' && (
          <PosInventoryView
            products={products}
            onUpdateStock={onUpdateStock}
            onUpdateProduct={onUpdateProduct}
            onResetCatalogToMaster={onResetCatalogToMaster}
          />
        )}
        {activeTab === 'cashflow' && <PosCashflowView />}
        {activeTab === 'reports' && <PosReportsView />}
        {activeTab === 'downlines' && <PosDownlinesView />}
      </main>

      {/* Mobile Bottom Navigation Dock (OLSERA APP STYLE) */}
      <nav className="pos-mobile-bottom-nav">
        <button
          type="button"
          onClick={() => setActiveTab('cashier')}
          className={`pos-bottom-nav-item ${activeTab === 'cashier' ? 'active' : ''}`}
          title="Kasir POS"
        >
          <div className="pos-nav-icon-wrap">
            <ShoppingCart size={18} />
          </div>
          <span className="pos-bottom-nav-label">Kasir</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`pos-bottom-nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
          title="Riwayat Pesanan & Transaksi"
        >
          <div className="pos-nav-icon-wrap">
            <Receipt size={18} />
          </div>
          <span className="pos-bottom-nav-label">Transaksi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`pos-bottom-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          title="Inventori & Stok"
        >
          <div className="pos-nav-icon-wrap">
            <Package size={18} />
          </div>
          <span className="pos-bottom-nav-label">Stok</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          className={`pos-bottom-nav-item ${activeTab === 'cashflow' ? 'active' : ''}`}
          title="Buku Kas Masuk/Keluar"
        >
          <div className="pos-nav-icon-wrap">
            <Wallet size={18} />
          </div>
          <span className="pos-bottom-nav-label">Buku Kas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`pos-bottom-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          title="Laporan Omset & Laba"
        >
          <div className="pos-nav-icon-wrap">
            <BarChart3 size={18} />
          </div>
          <span className="pos-bottom-nav-label">Laporan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('downlines')}
          className={`pos-bottom-nav-item ${activeTab === 'downlines' ? 'active' : ''}`}
          title="Database Mitra & Downline"
        >
          <div className="pos-nav-icon-wrap">
            <Users size={18} />
          </div>
          <span className="pos-bottom-nav-label">Mitra</span>
        </button>
      </nav>

      {/* Token Topup & Settings Modal */}
      <TokenTopupModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
      />

      {/* Modal Konfirmasi Logout POS */}
      {showLogoutConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirmModal(false)} style={{ zIndex: 10000 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #334155',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#ef4444'
              }}
            >
              <LogOut size={26} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Konfirmasi Keluar (Logout)
            </h3>

            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin keluar dari sesi kasir &amp; backoffice toko <b>{currentStore.storeName}</b>?
              <br />
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                Anda harus memasukkan email dan password admin toko kembali untuk mengakses POS ini.
              </span>
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  logoutStoreAdmin();
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={15} />
                <span>Ya, Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
