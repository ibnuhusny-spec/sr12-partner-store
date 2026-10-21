import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, MessageCircle, Store as StoreIcon } from 'lucide-react';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenDistributorLogin: () => void;
  onOpenDirectory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenDistributorLogin, onOpenDirectory }) => {
  const { currentStore, cartCount } = useApp();

  const handleLogoDblClick = () => {
    onOpenDistributorLogin();
  };

  const isCentral = currentStore.slug === 'sr12-central';

  return (
    <header className="site-navbar" id="siteHeaderStorefront">
      <div className="site-navbar-inner">
        {/* Brand Group */}
        <div
          className="brand-wrapper"
          onDoubleClick={handleLogoDblClick}
          title="Klik 2x pada logo untuk Login Pemilik Toko"
        >
          <div className="brand-logo-badge">
            {currentStore.storeLogoUrl ? (
              <img src={currentStore.storeLogoUrl} alt="Logo Toko" className="brand-logo-img" />
            ) : (
              <span>{currentStore.storeLogoText || 'SR12'}</span>
            )}
          </div>
          <div className="brand-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 id="brandStoreName">{currentStore.storeName}</h1>
              {isCentral ? (
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>
                  🏛️ PUSAT RESMI
                </span>
              ) : (
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                  ⭐ MITRA RESMI ({currentStore.partnerTier.toUpperCase()})
                </span>
              )}
            </div>
            <p id="brandStoreTagline">{currentStore.storeTagline || 'Direktori Kemitraan & Pasokan Resmi SR12 Skin Care'}</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="navbar-actions">
          {onOpenDirectory && (
            <button
              type="button"
              className="btn-topbar"
              style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
              onClick={onOpenDirectory}
              title="Cari Toko Mitra SR12 Lain di Kota Anda"
            >
              <StoreIcon size={13} />
              <span><span className="hide-on-mobile">Pilih </span>Toko Lain</span>
            </button>
          )}


          {/* WhatsApp CS Link (Desktop view, on mobile it is in BottomNav) */}
          {currentStore.storeWaNumber && (
            <a
              href={`https://wa.me/${currentStore.storeWaNumber.replace(/[^0-9]/g, '')}?text=Halo%20Admin%20${encodeURIComponent(currentStore.storeName)},%20saya%20ingin%20tanya%20seputar%20produk%20SR12`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-nav-wa hide-on-mobile"
              title="Chat WhatsApp CS Toko Ini"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>
          )}

          {/* Floating Cart Launcher Button (Desktop view, on mobile it is in BottomNav) */}
          <button
            type="button"
            className="btn-nav-cart hide-on-mobile"
            id="btnOpenCart"
            onClick={onOpenCart}
            title="Buka Keranjang Belanja"
            aria-label="Keranjang Belanja"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};

