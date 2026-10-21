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
  ChevronLeft
} from 'lucide-react';

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

  return (
    <div className="pos-wrapper">
      {/* POS Topbar Header */}
      <header className="pos-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsPosOpen(false)}
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Kembali ke Etalase Toko Online Pembeli"
          >
            <ChevronLeft size={16} />
            <span><span className="hide-on-mobile">Etalase </span>Toko</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                {currentStore.storeName}
              </span>
              <span style={{ fontSize: '0.62rem', background: '#0369a1', color: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                POS
              </span>
            </div>
            <div className="hide-on-mobile" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Gudang &bull; {currentStore.storeCity}
            </div>
          </div>
        </div>

        {/* Cashier Attendance & Shift Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={12} color={isClockedIn ? '#34d399' : '#f59e0b'} />
            <span className="hide-on-mobile" style={{ color: '#94a3b8' }}>Kasir:</span>
            <b style={{ color: '#f8fafc' }}>{cashierName}</b>
            <span
              onClick={() => setIsClockedIn(!isClockedIn)}
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: isClockedIn ? '#34d399' : '#f59e0b',
                background: isClockedIn ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                padding: '1px 5px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="Klik untuk ubah status Clock-In / Clock-Out"
            >
              {isClockedIn ? 'AKTIF' : 'OFF'}
            </span>
          </div>

          {/* Lock Screen / Logout Kasir */}
          <button
            type="button"
            onClick={logoutStoreAdmin}
            style={{
              background: 'rgba(239, 68, 68, 0.18)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Kunci Olsera POS & Keluar Sesi Admin"
          >
            <Lock size={12} />
            <span className="hide-on-mobile">Kunci POS</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <nav style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '0 8px', display: 'flex', gap: '2px', overflowX: 'auto', scrollbarWidth: 'none' }}>
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
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'cashier' && (
          <PosCashierView products={products} activeCashierName={cashierName} />
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
    </div>
  );
};
