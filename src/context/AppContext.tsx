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
  const [currentStore, setCurrentStore] = useState<Store>(DEFAULT_PARTNER_STORES[0]);
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
      if (storeParam) {
        const found = stores.find(s => s.slug === storeParam.toLowerCase());
        if (found) {
          setCurrentStore(found);
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

      // Keep currentStore updated with latest server state
      setCurrentStore(prev => {
        const updated = stores.find(s => s.slug === prev.slug);
        return updated || prev;
      });
      return stores;
    } catch {
      setCloudStatus('offline');
      return partnerStores;
    }
  };

  // Realtime Supabase Channel subscription for instant incoming orders
  useEffect(() => {
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      let nextCart: CartItem[];
      if (idx >= 0) {
        nextCart = [...prev];
        nextCart[idx].quantity += quantity;
      } else {
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
