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
  const [brandClicks, setBrandClicks] = useState(0);
  const [lastBrandClickTime, setLastBrandClickTime] = useState(0);

  const handleSecretBrandClick = () => {
    const now = Date.now();
    if (now - lastBrandClickTime > 2500) {
      setBrandClicks(1);
    } else {
      const count = brandClicks + 1;
      if (count >= 5) {
        setBrandClicks(0);
        onOpenDevConsole();
      } else {
        setBrandClicks(count);
      }
    }
    setLastBrandClickTime(now);
  };

  return (
    <aside className="platform-topbar" id="platformTopbar">
      <div className="platform-topbar-inner">
        {/* Left: Brand Platform (Secret 5-click opens Developer Console) */}
        <div
          className="platform-brand"
          onClick={handleSecretBrandClick}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="SR12 Partner Ecosystem"
        >
          <span className="badge-official">🌿 Resmi</span>
          <span className="hide-on-mobile">Jaringan Toko Online Mitra SR12</span>
        </div>

        {/* Right: Active Store Tools */}
        <div className="platform-tools">
          {/* Active Store Chip (Single Store Mode) */}
          <div className="store-chip" title="Toko Resmi">
            <StoreIcon size={13} color="#94a3b8" />
            <span className="hide-on-mobile" style={{ color: '#94a3b8' }}>Toko:</span>
            <span className="store-chip-name">{currentStore.storeName}</span>
          </div>

          {/* Cloud Indicator */}
          <div
            className="store-chip"
            style={{ cursor: 'pointer' }}
            onClick={() => refreshStores()}
            title={`Status Cloud Supabase: ${cloudStatus.toUpperCase()}. Klik untuk refresh data.`}
          >
            <span className={`cloud-dot ${cloudStatus}`} />
            <span className="hide-on-mobile" style={{ color: cloudStatus === 'online' ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
              {cloudStatus === 'online' ? 'Cloud Aktif' : 'Menghubungkan...'}
            </span>
          </div>

          {/* Backoffice Olsera POS Button (Desktop only, mobile has BottomNav) */}
          <button
            type="button"
            className="btn-topbar btn-topbar-pos hide-on-mobile"
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

          {/* Buka Toko Baru */}
          <button
            type="button"
            className="btn-topbar btn-topbar-primary"
            onClick={onOpenRegister}
            title="Daftarkan Toko Online SR12 Baru"
          >
            <PlusCircle size={13} />
            <span><span className="hide-on-mobile">Buka </span>Toko</span>
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
              <span className="hide-on-mobile">Kunci Kasir</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

