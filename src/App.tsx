import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Product } from './types';
import {
  getStoreCatalog,
  updateStoreProduct,
  updateStoreProductStock,
  resetStoreCatalogToMaster
} from './services/catalogService';
import { PlatformTopbar } from './components/common/PlatformTopbar';
import { Navbar } from './components/common/Navbar';
import { NotificationChime } from './components/common/NotificationChime';
import { Footer } from './components/common/Footer';
import { HeroBanner } from './components/storefront/HeroBanner';
import { TierSelector } from './components/storefront/TierSelector';
import { CategorySlider } from './components/storefront/CategorySlider';
import { ProductCard } from './components/storefront/ProductCard';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { ShareModal } from './components/storefront/ShareModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { RegisterStoreModal } from './components/storefront/RegisterStoreModal';
import { DevConsoleModal } from './components/dev/DevConsoleModal';
import { DistributorLoginModal } from './components/dev/DistributorLoginModal';
import { StoreAdminLoginModal } from './components/dev/StoreAdminLoginModal';
import { AffiliateBanner } from './components/storefront/AffiliateBanner';
import { PosLayout } from './components/pos/PosLayout';
import { BottomNav } from './components/common/BottomNav';

export function App() {
  const { isPosOpen, setIsPosOpen, currentStore } = useApp();


  // Load isolated catalog specific to the current active store
  const [products, setProducts] = useState<Product[]>(() => {
    return getStoreCatalog(currentStore.slug);
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);
  const [isDistributorLoginOpen, setIsDistributorLoginOpen] = useState(false);
  const [isStoreLoginOpen, setIsStoreLoginOpen] = useState(false);

  // When active store switches (via ?store=... or switcher), load that store's custom catalog
  useEffect(() => {
    setProducts(getStoreCatalog(currentStore.slug));
  }, [currentStore.slug]);

  // Check URL query parameters for ?product=id deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    if (prodId) {
      const found = products.find(p => p.id === prodId || p.sku.toLowerCase() === prodId.toLowerCase());
      if (found) {
        setDetailProduct(found);
        setTimeout(() => {
          const el = document.getElementById(`product-card-${found.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.6)';
            setTimeout(() => {
              el.style.boxShadow = '';
            }, 3000);
          }
        }, 400);
      }
    }
  }, [products]);

  const handleUpdateStock = (productId: string, newStock: number) => {
    const nextCatalog = updateStoreProductStock(currentStore.slug, productId, newStock);
    setProducts(nextCatalog);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const nextCatalog = updateStoreProduct(currentStore.slug, updatedProduct);
    setProducts(nextCatalog);
  };

  const handleResetCatalog = () => {
    const nextCatalog = resetStoreCatalogToMaster(currentStore.slug);
    setProducts(nextCatalog);
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // If user opened POS view, render the Olsera POS Suite
  if (isPosOpen) {
    return (
      <PosLayout
        products={products}
        onUpdateStock={handleUpdateStock}
        onUpdateProduct={handleUpdateProduct}
        onResetCatalogToMaster={handleResetCatalog}
      />
    );
  }

  return (
    <div className="storefront-page">
      {/* 1. Affiliate Top Banner if ref present */}
      <AffiliateBanner />

      {/* 2. Platform Topbar */}
      <PlatformTopbar
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenDevConsole={() => setIsDevConsoleOpen(true)}
        onOpenDistributorLogin={() => setIsDistributorLoginOpen(true)}
        onOpenStoreLogin={() => setIsStoreLoginOpen(true)}
      />

      {/* 3. Site Navbar */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenDistributorLogin={() => setIsDistributorLoginOpen(true)}
      />

      {/* 4. Realtime Audio Chime Alert */}
      <NotificationChime />

      {/* 5. Hero Promo Banner */}
      <HeroBanner />

      {/* 6. Catalog Controls: Tier Selector & Category Slider */}
      <section className="catalog-controls" id="catalogControlsSection">
        <TierSelector />
        <CategorySlider
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </section>

      {/* 7. Products Grid */}
      <main className="products-grid" id="productsGridSection">

        {filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tidak ada produk yang cocok dengan pencarian Anda.</p>
            <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Coba cari dengan kata kunci lain atau pilih kategori &quot;Semua Produk&quot;.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetail={(p) => setDetailProduct(p)}
              onOpenShare={(p) => setShareProduct(p)}
            />
          ))
        )}
      </main>

      {/* 8. Footer */}
      <Footer />

      {/* MODALS */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
      />

      <ShareModal
        product={shareProduct}
        onClose={() => setShareProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <RegisterStoreModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      <DevConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
      />

      <DistributorLoginModal
        isOpen={isDistributorLoginOpen}
        onClose={() => setIsDistributorLoginOpen(false)}
      />

      <StoreAdminLoginModal
        isOpen={isStoreLoginOpen}
        onClose={() => setIsStoreLoginOpen(false)}
        onSuccessLogin={() => setIsPosOpen(true)}
      />

      {/* 9. Mobile Bottom Navigation Dock (Fixed at bottom on HP) */}
      <BottomNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenStoreLogin={() => setIsStoreLoginOpen(true)}
        onScrollToCatalog={() => {
          const el = document.getElementById('catalogControlsSection');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onScrollToTiers={() => {
          const el = document.getElementById('tierSelectorSection');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />
    </div>
  );
}

export default App;

