import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

const AppContext = createContext(null);
const CART_KEY = 'autodrive.cart.v1';

function readCart() {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [banners, setBanners] = useState([]);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState(readCart);
  const [wishlist, setWishlist] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const notify = useCallback((message, tone = 'success') => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/settings').catch(() => null),
      api.get('/categories').catch(() => []),
      api.get('/brands').catch(() => []),
      api.get('/vehicles').catch(() => []),
      api.get('/banners').catch(() => []),
    ]).then(([settingsResult, categoryResult, brandResult, vehicleResult, bannerResult]) => {
      if (cancelled) return;
      setSettings(settingsResult);
      setCategories(categoryResult ?? []);
      setBrands(brandResult ?? []);
      setVehicles(vehicleResult ?? []);
      setBanners(bannerResult ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/me')
      .then((payload) => {
        if (!cancelled) setUser(payload?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const loadWishlist = useCallback(async () => {
    try {
      const items = await api.get('/wishlist');
      setWishlist(items.map((item) => item.id));
    } catch {
      setWishlist([]);
    }
  }, []);

  useEffect(() => {
    if (user) loadWishlist();
    else setWishlist([]);
  }, [user, loadWishlist]);

  const addToCart = useCallback(
    (product, quantity = 1) => {
      let adjusted = false;
      setCart((current) => {
        const existing = current.find((item) => item.productId === product.id);
        const nextQuantity = (existing?.quantity ?? 0) + quantity;
        const capped = Math.min(nextQuantity, product.stock ?? 99);
        adjusted = capped < nextQuantity;
        const entry = {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: capped,
        };
        if (existing) {
          return current.map((item) => (item.productId === product.id ? entry : item));
        }
        return [...current, entry];
      });
      notify(
        adjusted
          ? `بیشتر از موجودی «${product.name}» نمی‌توانید سفارش دهید.`
          : `«${product.name}» به سبد خرید اضافه شد.`,
        adjusted ? 'error' : 'success',
      );
    },
    [notify],
  );

  const updateQuantity = useCallback((productId, quantity) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock ?? 99)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    async (product) => {
      if (!user) {
        notify('برای افزودن به علاقه‌مندی‌ها ابتدا وارد حساب خود شوید.', 'error');
        return false;
      }
      const inList = wishlist.includes(product.id);
      try {
        if (inList) {
          await api.del(`/wishlist/${product.id}`);
          setWishlist((current) => current.filter((id) => id !== product.id));
          notify('از علاقه‌مندی‌ها حذف شد.');
        } else {
          await api.post('/wishlist', { productId: product.id });
          setWishlist((current) => [...current, product.id]);
          notify('به علاقه‌مندی‌ها اضافه شد.');
        }
        return true;
      } catch (error) {
        notify(error.message, 'error');
        return false;
      }
    },
    [notify, user, wishlist],
  );

  const login = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  const refreshSettings = useCallback(async () => {
    const next = await api.get('/settings').catch(() => null);
    if (next) setSettings(next);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      categories,
      brands,
      vehicles,
      banners,
      user,
      authReady,
      cart,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartSubtotal: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      wishlist,
      toasts,
      notify,
      dismissToast,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      reloadWishlist: loadWishlist,
      login,
      logout,
      setUser,
      refreshSettings,
    }),
    [
      settings,
      categories,
      brands,
      vehicles,
      banners,
      user,
      authReady,
      cart,
      wishlist,
      toasts,
      notify,
      dismissToast,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      loadWishlist,
      login,
      logout,
      refreshSettings,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
