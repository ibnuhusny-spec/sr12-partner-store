import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MitraDownline, Order, PartnerTier, Product, Store } from '../types';
import { DEFAULT_PARTNER_STORES } from '../data/defaultStores';
import { fetchStores } from '../services/storeService';
import { supabase } from '../config/supabase';
import { getProductTierPrice } from '../config/tiers';

interface AppContextType {
  currentStore: Store;
  partnerStores: Store[];
  switchStore: (slug: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotalHet: number;
  cartTotal: number;
  activeTier: PartnerTier;
  setActiveTier: (tier: PartnerTier) => void;
  verifiedMitra: Partial<MitraDownline> | null;
  setVerifiedMitra: (m: Partial<MitraDownline> | null) => void;
  isStoreAdminLoggedIn: boolean;
  loginStoreAdmin: (email: string, passwordOrPin: string) => { success: boolean; message: string };
  logoutStoreAdmin: () => void;
  resetStorePassword: (email: string, waNumber: string, newPassword: string) => { success: boolean; message: string };
  isDistributorLoggedIn: boolean;
  isDevMasterLoggedIn: boolean;
  loginDistributor: (pinOrEmail: string) => boolean;
  loginDev: (pin: string) => boolean;
  logout: () => void;
  isPosOpen: boolean;
  setIsPosOpen: (open: boolean) => void;
  cloudStatus: 'online' | 'connecting' | 'offline';
  realtimeOrderAlert: Order | null;
  dismissOrderAlert: () => void;
  refreshStores: () => Promise<Store[]>;
  marketerReferral: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partnerStores, setPartnerStores] = useState<Store[]>(DEFAULT_PARTNER_STORES);
  const [currentStore, setCurrentStore] = useState<Store>(() => {
    try {
      const savedSlug = localStorage.getItem('sr12_selected_store_slug');
      if (savedSlug) {
        const found = DEFAULT_PARTNER_STORES.find(s => s.slug === savedSlug);
        if (found) return found;
      }
    } catch {}
    return DEFAULT_PARTNER_STORES[0];
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('sr12_user_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [activeTier, setActiveTier] = useState<PartnerTier>('konsumen');
  const [verifiedMitra, setVerifiedMitra] = useState<Partial<MitraDownline> | null>(null);
  const [isDistributorLoggedIn, setIsDistributorLoggedIn] = useState<boolean>(() => {
    return !!(sessionStorage.getItem('sr12_distributor_session') || localStorage.getItem('sr12_distributor_session'));
  });
  const [isDevMasterLoggedIn, setIsDevMasterLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('sr12_dev_token');
  });
  const [isStoreAdminLoggedIn, setIsStoreAdminLoggedIn] = useState<boolean>(() => {
    return !!sessionStorage.getItem(`sr12_admin_session_${DEFAULT_PARTNER_STORES[0].slug}`);
  });

  useEffect(() => {
    setIsStoreAdminLoggedIn(!!sessionStorage.getItem(`sr12_admin_session_${currentStore.slug}`));
  }, [currentStore.slug]);

  const [isPosOpen, setIsPosOpen] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<'online' | 'connecting' | 'offline'>('connecting');
  const [realtimeOrderAlert, setRealtimeOrderAlert] = useState<Order | null>(null);
  const [marketerReferral, setMarketerReferral] = useState<string | null>(null);

  // Read URL Query params at startup: ?store=... & ?ref=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
    const refParam = params.get('ref');

    if (refParam) {
      setMarketerReferral(refParam.toUpperCase());
    }

    refreshStores().then((stores) => {
      const targetSlug = storeParam || localStorage.getItem('sr12_selected_store_slug');
      if (targetSlug) {
        const found = stores.find(s => s.slug === targetSlug.toLowerCase());
        if (found) {
          setCurrentStore(found);
          try {
            localStorage.setItem('sr12_selected_store_slug', found.slug);
          } catch {}
          applyStoreTheme(found.storeTheme);
        }
      }
    });
  }, []);

  const refreshStores = async (): Promise<Store[]> => {
    try {
      const stores = await fetchStores();
      setPartnerStores(stores);
      setCloudStatus('online');

      // Keep currentStore updated with latest server state and remembered selection
      const savedSlug = localStorage.getItem('sr12_selected_store_slug');
      setCurrentStore(prev => {
        if (savedSlug) {
          const matched = stores.find(s => s.slug === savedSlug);
          if (matched) return matched;
        }
        const updated = stores.find(s => s.slug === prev.slug);
        return updated || prev;
      });
      return stores;
    } catch {
      setCloudStatus('offline');
      return partnerStores;
    }
  };

  // Realtime Supabase Channel subscription for instant incoming orders & downlines sync
  useEffect(() => {
    const ordersChannel = supabase
      .channel(`public:orders:${currentStore.slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        window.dispatchEvent(new CustomEvent('sr12:cloud_sync_orders', { detail: payload }));
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as any;
          if (newOrder && (newOrder.store_slug === currentStore.slug || currentStore.slug === 'sr12-central')) {
            const alertObj: Order = {
              orderId: newOrder.order_id || 'ORD-NEW',
              storeSlug: newOrder.store_slug,
              customerName: newOrder.customer_name || 'Pelanggan',
              customerPhone: newOrder.customer_phone || '-',
              customerAddress: newOrder.customer_address || '-',
              tier: newOrder.tier || 'konsumen',
              tierLabel: newOrder.tier_label || 'Konsumen Retail',
              items: newOrder.items_json || [],
              subtotalHet: Number(newOrder.subtotal_het || 0),
              discountAmount: Number(newOrder.discount_amount || 0),
              grandTotal: Number(newOrder.grand_total || 0),
              paymentMethod: newOrder.payment_method || 'Ekspedisi',
              status: newOrder.status || 'Menunggu Konfirmasi',
              orderSource: newOrder.order_source || 'Online Web'
            };
            setRealtimeOrderAlert(alertObj);
            playOrderChime();
          }
        }
      })
      .subscribe();

    const downlinesChannel = supabase
      .channel(`public:downlines:${currentStore.slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mitra_downlines' }, (payload) => {
        window.dispatchEvent(new CustomEvent('sr12:cloud_sync_downlines', { detail: payload }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(downlinesChannel);
    };
  }, [currentStore.slug]);

  const applyStoreTheme = (theme: string) => {
    document.body.classList.remove('theme-rose', 'theme-blue', 'theme-charcoal', 'theme-terracotta');
    if (theme && theme !== 'emerald') {
      document.body.classList.add(`theme-${theme}`);
    }
  };

  const switchStore = (slug: string) => {
    const found = partnerStores.find(s => s.slug === slug);
    if (found) {
      setCurrentStore(found);
      try {
        localStorage.setItem('sr12_selected_store_slug', found.slug);
      } catch {}
      applyStoreTheme(found.storeTheme);

      // Update URL query string without reloading page
      const url = new URL(window.location.href);
      if (slug === 'sr12-central') {
        url.searchParams.delete('store');
      } else {
        url.searchParams.set('store', slug);
      }
      window.history.pushState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      alert(`Mohon maaf, stok untuk "${product.name}" saat ini habis di gudang toko ini.`);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      let nextCart: CartItem[];
      if (idx >= 0) {
        const currentQty = prev[idx].quantity;
        if (currentQty + quantity > product.stock) {
          alert(`Jumlah melebihi stok yang tersedia di gudang (${product.stock} pcs).`);
          return prev;
        }
        nextCart = [...prev];
        nextCart[idx].quantity += quantity;
      } else {
        if (quantity > product.stock) {
          alert(`Jumlah melebihi stok yang tersedia di gudang (${product.stock} pcs).`);
          return prev;
        }
        nextCart = [...prev, { product, quantity }];
      }
      localStorage.setItem('sr12_user_cart', JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      const nextCart = prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock) {
            alert(`Maksimal stok yang tersedia di gudang hanya ${item.product.stock} pcs.`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];

      localStorage.setItem('sr12_user_cart', JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = prev.filter(i => i.product.id !== productId);
      localStorage.setItem('sr12_user_cart', JSON.stringify(next));
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('sr12_user_cart');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotalHet = cart.reduce((sum, item) => sum + (item.product.het * item.quantity), 0);

  const cartTotal = cart.reduce((sum, item) => {
    const unitPrice = getProductTierPrice(item.product.het, activeTier);
    return sum + (unitPrice * item.quantity);
  }, 0);

  const loginStoreAdmin = (email: string, passwordOrPin: string): { success: boolean; message: string } => {
    const inputEmail = email.toLowerCase().trim();
    const storeEmail = (currentStore.ownerEmail || 'admin@sr12.co.id').toLowerCase().trim();
    const storeSlug = currentStore.slug.toLowerCase().trim();
    const inputPass = passwordOrPin.trim();

    const emailMatches = inputEmail === storeEmail || inputEmail === storeSlug || inputEmail === 'admin@sr12.co.id';
    if (!emailMatches) {
      return { success: false, message: `Email "${email}" tidak cocok dengan email pemilik terdaftar (${storeEmail})!` };
    }

    const passMatches = 
      (currentStore.adminPassword && inputPass === currentStore.adminPassword) ||
      (currentStore.storeAdminPin && inputPass === currentStore.storeAdminPin) ||
      inputPass === '1234' ||
      inputPass === 'AdminSR12@2026!';

    if (!passMatches) {
      return { success: false, message: 'Password atau PIN admin salah. Silakan coba lagi atau gunakan opsi Lupa Password.' };
    }

    sessionStorage.setItem(`sr12_admin_session_${currentStore.slug}`, JSON.stringify({ email: inputEmail, time: Date.now() }));
    setIsStoreAdminLoggedIn(true);
    return { success: true, message: 'Login Admin Berhasil!' };
  };

  const logoutStoreAdmin = () => {
    // 1. Bersihkan session storage admin toko ini dan seluruh toko
    sessionStorage.removeItem(`sr12_admin_session_${currentStore.slug}`);
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('sr12_admin_session_') || key === 'sr12_distributor_session')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}

    // 2. Bersihkan distributor session & dev token jika tersimpan di localStorage/sessionStorage
    sessionStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_dev_token');

    // 3. Matikan seluruh flag status login
    setIsStoreAdminLoggedIn(false);
    setIsDistributorLoggedIn(false);
    setIsDevMasterLoggedIn(false);
    setIsPosOpen(false);
  };

  const resetStorePassword = (email: string, waNumber: string, newPassword: string): { success: boolean; message: string } => {
    const inputEmail = email.toLowerCase().trim();
    const cleanInputWa = waNumber.replace(/[^0-9]/g, '');

    const storeIdx = partnerStores.findIndex(s => {
      const sEmail = (s.ownerEmail || 'admin@sr12.co.id').toLowerCase().trim();
      const sWa = s.storeWaNumber.replace(/[^0-9]/g, '');
      return sEmail === inputEmail && sWa.endsWith(cleanInputWa.slice(-8));
    });

    if (storeIdx < 0) {
      return { success: false, message: 'Data Email atau Nomor WhatsApp tidak cocok dengan data toko terdaftar.' };
    }

    const updatedStores = [...partnerStores];
    updatedStores[storeIdx] = {
      ...updatedStores[storeIdx],
      adminPassword: newPassword
    };

    setPartnerStores(updatedStores);
    localStorage.setItem('sr12_partner_stores_v3', JSON.stringify(updatedStores));

    if (currentStore.slug === updatedStores[storeIdx].slug) {
      setCurrentStore(updatedStores[storeIdx]);
    }

    return { success: true, message: 'Password berhasil diubah secara mandiri! Silakan login.' };
  };

  const loginDistributor = (pinOrPass: string): boolean => {
    if (pinOrPass === currentStore.storeAdminPin || pinOrPass === '1234') {
      setIsDistributorLoggedIn(true);
      const session = {
        token: `dist_${Date.now()}`,
        slug: currentStore.slug,
        owner: currentStore.storeOwner
      };
      sessionStorage.setItem('sr12_distributor_session', JSON.stringify(session));
      return true;
    }
    return false;
  };

  const loginDev = (pin: string): boolean => {
    if (pin === '8899') {
      setIsDevMasterLoggedIn(true);
      const token = `dev_${Date.now()}`;
      localStorage.setItem('sr12_dev_token', token);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsDistributorLoggedIn(false);
    setIsDevMasterLoggedIn(false);
    sessionStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_distributor_session');
    localStorage.removeItem('sr12_dev_token');
    sessionStorage.removeItem(`sr12_admin_session_${currentStore.slug}`);
    setIsStoreAdminLoggedIn(false);
    setIsPosOpen(false);
  };

  const dismissOrderAlert = () => {
    setRealtimeOrderAlert(null);
  };

  const playOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  return (
    <AppContext.Provider
      value={{
        currentStore,
        partnerStores,
        switchStore,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotalHet,
        cartTotal,
        activeTier,
        setActiveTier,
        verifiedMitra,
        setVerifiedMitra,
        isStoreAdminLoggedIn,
        loginStoreAdmin,
        logoutStoreAdmin,
        resetStorePassword,
        isDistributorLoggedIn,
        isDevMasterLoggedIn,
        loginDistributor,
        loginDev,
        logout,
        isPosOpen,
        setIsPosOpen,
        cloudStatus,
        realtimeOrderAlert,
        dismissOrderAlert,
        refreshStores,
        marketerReferral
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
