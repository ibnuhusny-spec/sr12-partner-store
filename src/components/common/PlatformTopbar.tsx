import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, ShieldCheck, ShoppingCart, PlusCircle, Lock, LogOut, ChevronDown } from 'lucide-react';

interface PlatformTopbarProps {
  onOpenRegister: () => void;
  onOpenDevConsole: () => void;
  onOpenDistributorLogin: () => void;
  onOpenStoreLogin: () => void;
}

export const PlatformTopbar: React.FC<PlatformTopbarProps> = ({
  onOpenRegister,
  onOpenDevConsole,
  onOpenDistributorLogin,
  onOpenStoreLogin
}) => {
  const {
    currentStore,
    partnerStores,
    switchStore,
    cloudStatus,
    isStoreAdminLoggedIn,
    logoutStoreAdmin,
    isDistributorLoggedIn,
    isDevMasterLoggedIn,
    logout,
    setIsPosOpen,
    refreshStores
  } = useApp();

  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  return (
    <aside className="platform-topbar" id="platformTopbar">
      <div className="platform-topbar-inner">
        {/* Left: Brand Platform */}
        <div className="platform-brand">
          <span className="badge-official">🌿 Resmi</span>
          <span className="hide-on-mobile">Jaringan Toko Online Mitra SR12</span>
        </div>

        {/* Right: Active Store Tools */}
        <div className="platform-tools">
          {/* Active Store Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="store-chip"
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              title="Ganti Toko Mitra / Belanja di Pusat"
            >
              <StoreIcon size={14} color="#94a3b8" />
              <span style={{ color: '#94a3b8' }}>Toko:</span>
              <span className="store-chip-name">{currentStore.storeName}</span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>

            {showStoreDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  minWidth: '240px',
                  zIndex: 2000,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '8px 12px', fontSize: '0.72rem', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                  PILIH TOKO DISTRIBUTOR / AGEN:
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {partnerStores.map(store => (
                    <button
                      key={store.slug}
                      type="button"
                      onClick={() => {
                        switchStore(store.slug);
                        setShowStoreDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #1e293b',
                        background: store.slug === currentStore.slug ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        color: store.slug === currentStore.slug ? '#38bdf8' : '#e2e8f0',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{store.storeName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{store.storeCity} &bull; {store.partnerTier.toUpperCase()}</div>
                      </div>
                      {store.slug === 'sr12-central' && (
                        <span style={{ fontSize: '0.65rem', background: '#065f46', color: '#6ee7b7', padding: '1px 6px', borderRadius: '4px' }}>PUSAT</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cloud Indicator */}
          <div
            className="store-chip"
            style={{ cursor: 'pointer' }}
            onClick={() => refreshStores()}
            title={`Status Cloud Supabase: ${cloudStatus.toUpperCase()}. Klik untuk refresh data.`}
          >
            <span className={`cloud-dot ${cloudStatus}`} />
            <span style={{ color: cloudStatus === 'online' ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
              {cloudStatus === 'online' ? 'Cloud Aktif' : 'Menghubungkan...'}
            </span>
          </div>

          {/* Backoffice Olsera POS Button */}
          <button
            type="button"
            className="btn-topbar btn-topbar-pos"
            id="btnOpenPosBackoffice"
            onClick={() => {
              if (isStoreAdminLoggedIn || isDevMasterLoggedIn || isDistributorLoggedIn) {
                setIsPosOpen(true);
              } else {
                onOpenStoreLogin();
              }
            }}
            title="Buka Kasir Gudang & Backoffice POS Olsera (Khusus Pemilik Toko)"
          >
            {isStoreAdminLoggedIn ? <ShieldCheck size={13} color="#34d399" /> : <Lock size={13} />}
            <span>{isStoreAdminLoggedIn ? 'Kasir POS (Aktif)' : 'Kasir POS'}</span>
          </button>

          {/* Dev Console Button */}
          <button
            type="button"
            className="btn-topbar"
            style={{ background: '#1e293b', color: '#fde68a', border: '1px solid rgba(253, 230, 138, 0.3)' }}
            onClick={onOpenDevConsole}
            title="Buka Console Super Admin Developer (PIN 8899)"
          >
            <Lock size={12} />
            <span>Console Dev</span>
          </button>

          {/* Buka Toko Baru */}
          <button
            type="button"
            className="btn-topbar btn-topbar-primary"
            onClick={onOpenRegister}
            title="Daftarkan Toko Online SR12 Baru"
          >
            <PlusCircle size={13} />
            <span>Buka Toko</span>
          </button>

          {/* Logout if store admin or distributor logged in */}
          {(isStoreAdminLoggedIn || isDistributorLoggedIn || isDevMasterLoggedIn) && (
            <button
              type="button"
              className="btn-topbar"
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444' }}
              onClick={logoutStoreAdmin}
              title="Logout dari Sesi Admin Toko Ini"
            >
              <LogOut size={12} />
              <span>Kunci Kasir</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
