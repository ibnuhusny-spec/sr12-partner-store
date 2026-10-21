import React from 'react';
import { useApp } from '../../context/AppContext';
import { Store, Tag, MessageCircle, ShoppingBag, ShieldCheck, Lock } from 'lucide-react';

interface BottomNavProps {
  onOpenCart: () => void;
  onOpenStoreLogin: () => void;
  onScrollToCatalog: () => void;
  onScrollToTiers: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenCart,
  onOpenStoreLogin,
  onScrollToCatalog,
  onScrollToTiers
}) => {
  const { currentStore, cartCount, isStoreAdminLoggedIn, isDistributorLoggedIn, isDevMasterLoggedIn, setIsPosOpen } = useApp();

  const handleWaClick = () => {
    if (!currentStore.storeWaNumber) return;
    const cleanWa = currentStore.storeWaNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Halo Admin ${currentStore.storeName}, saya ingin konsultasi & order produk SR12.`);
    window.open(`https://wa.me/${cleanWa}?text=${message}`, '_blank');
  };

  const handlePosClick = () => {
    if (isStoreAdminLoggedIn || isDistributorLoggedIn || isDevMasterLoggedIn) {
      setIsPosOpen(true);
    } else {
      onOpenStoreLogin();
    }
  };

  return (
    <nav className="mobile-bottom-nav" id="mobileBottomNav" aria-label="Navigasi Utama Mobile">
      {/* 1. Etalase / Katalog */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onScrollToCatalog}
        title="Lihat Semua Produk"
      >
        <div className="bottom-nav-icon-wrapper">
          <Store size={20} />
        </div>
        <span className="bottom-nav-label">Katalog</span>
      </button>

      {/* 2. Simulasi Level Harga */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onScrollToTiers}
        title="Simulasi Level Harga Mitra"
      >
        <div className="bottom-nav-icon-wrapper">
          <Tag size={20} />
        </div>
        <span className="bottom-nav-label">Level Harga</span>
      </button>

      {/* 3. WhatsApp CS (Center Highlighted Action) */}
      <button
        type="button"
        className="bottom-nav-item bottom-nav-item-wa"
        onClick={handleWaClick}
        title="Chat WhatsApp CS Toko"
      >
        <div className="bottom-nav-icon-wrapper bottom-nav-icon-wa">
          <MessageCircle size={22} />
        </div>
        <span className="bottom-nav-label" style={{ color: '#16a34a', fontWeight: 800 }}>Chat WA</span>
      </button>

      {/* 4. Keranjang Belanja */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onOpenCart}
        title="Buka Keranjang Belanja"
      >
        <div className="bottom-nav-icon-wrapper" style={{ position: 'relative' }}>
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="bottom-nav-badge">{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </div>
        <span className="bottom-nav-label">Keranjang</span>
      </button>

      {/* 5. Kasir POS Olsera */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={handlePosClick}
        title={isStoreAdminLoggedIn ? 'Buka Kasir POS Gudang' : 'Login Kasir POS Gudang'}
      >
        <div className="bottom-nav-icon-wrapper">
          {isStoreAdminLoggedIn ? <ShieldCheck size={20} color="#10b981" /> : <Lock size={20} />}
        </div>
        <span className="bottom-nav-label">
          {isStoreAdminLoggedIn ? 'Kasir (Aktif)' : 'Kasir POS'}
        </span>
      </button>
    </nav>
  );
};
