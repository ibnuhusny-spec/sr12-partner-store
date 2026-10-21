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
  const { currentStore, setIsPosOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'cashier' | 'transactions' | 'inventory' | 'cashflow' | 'reports' | 'downlines'>('cashier');
  const [cashierName, setCashierName] = useState('Siti Aminah');
  const [isClockedIn, setIsClockedIn] = useState(true);

  return (
    <div className="pos-wrapper">
      {/* POS Topbar Header */}
      <header className="pos-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={() => setIsPosOpen(false)}
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Kembali ke Etalase Toko Online Pembeli"
          >
            <ChevronLeft size={16} />
            <span>Etalase Toko</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 900, fontSize: '0.96rem', color: '#f8fafc' }}>{currentStore.storeName}</span>
              <span style={{ fontSize: '0.65rem', background: '#0369a1', color: '#e0f2fe', padding: '1px 7px', borderRadius: '4px', fontWeight: 800 }}>
                OLSERA POS BACKOFFICE
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Gudang Distributor &bull; {currentStore.storeCity}
            </div>
          </div>
        </div>

        {/* Cashier Attendance & Shift Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={13} color={isClockedIn ? '#34d399' : '#f59e0b'} />
            <span style={{ color: '#94a3b8' }}>Kasir:</span>
            <b style={{ color: '#f8fafc' }}>{cashierName}</b>
            <span
              onClick={() => setIsClockedIn(!isClockedIn)}
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: isClockedIn ? '#34d399' : '#f59e0b',
                background: isClockedIn ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                padding: '1px 6px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="Klik untuk ubah status Clock-In / Clock-Out"
            >
              {isClockedIn ? 'SHIFT AKTIF' : 'CLOCK-OUT'}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <nav style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '0 16px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('cashier')}
          style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: activeTab === 'cashier' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'cashier' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <ShoppingCart size={15} />
          <span>Kasir POS Cepat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: activeTab === 'transactions' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'transactions' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Receipt size={15} />
          <span>Pesanan &amp; Transaksi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: activeTab === 'inventory' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'inventory' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Package size={15} />
          <span>Inventori &amp; Stok Olsera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: activeTab === 'cashflow' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'cashflow' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Wallet size={15} />
          <span>Buku Kas (Masuk/Keluar)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: activeTab === 'reports' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'reports' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <BarChart3 size={15} />
          <span>Laporan Laba/Rugi &amp; CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('downlines')}
          style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: activeTab === 'downlines' ? '#38bdf8' : '#94a3b8',
            borderBottom: activeTab === 'downlines' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={15} />
          <span>Database Mitra &amp; Gaji Marketer</span>
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
