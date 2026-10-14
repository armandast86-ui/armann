import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import AnnouncementBar from './components/layout/AnnouncementBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ToastViewport from './components/ToastViewport';
import { Loading } from './components/ui/States';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import TrackOrder from './pages/TrackOrder';
import Journal from './pages/Journal';
import ArticlePage from './pages/ArticlePage';
import { About, Contact, Faq, Shipping, Returns, Terms, Privacy } from './pages/StaticPages';
import NotFound from './pages/NotFound';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCatalog from './pages/admin/AdminCatalog';
import AdminSettings from './pages/admin/AdminSettings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function RequireAuth({ children }) {
  const { user, authReady } = useApp();
  const location = useLocation();
  if (!authReady) return <Loading label="در حال بررسی حساب کاربری…" className="min-h-[50vh]" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, authReady } = useApp();
  if (!authReady) return <Loading label="در حال بررسی دسترسی…" className="min-h-[50vh]" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="container-page py-20">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <h1 className="text-lg font-bold text-burgundy">دسترسی به این بخش مجاز نیست</h1>
          <p className="mt-3 text-sm leading-7 text-ink/65">
            این صفحه فقط برای مدیران فروشگاه در دسترس است. اگر فکر می‌کنید دسترسی شما اشتباه تنظیم شده است، با
            مدیر سایت تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/order/:id"
            element={
              <RequireAuth>
                <OrderDetails />
              </RequireAuth>
            }
          />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:slug" element={<ArticlePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ToastViewport />
    </div>
  );
}
