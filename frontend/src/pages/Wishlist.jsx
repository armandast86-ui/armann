import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ui/ProductCard';
import { EmptyState, Loading } from '../components/ui/States';

export default function Wishlist() {
  const { user, authReady, wishlist, reloadWishlist } = useApp();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    reloadWishlist();
    api
      .get('/wishlist')
      .then((data) => setItems(data ?? []))
      .catch(() => setItems([]));
  }, [user, reloadWishlist]);

  useEffect(() => {
    if (items && user) {
      setItems((current) => (current ? current.filter((item) => wishlist.includes(item.id)) : current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlist]);

  if (!authReady || (user && items === null)) return <Loading className="min-h-[50vh]" />;

  if (!user) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="لیست علاقه‌مندی‌های شما"
          description="برای دیدن و ذخیره محصولات مورد علاقه، وارد حساب کاربری خود شوید."
          action={
            <Link to="/login" state={{ from: '/wishlist' }} className="btn btn-primary mt-2">
              ورود به حساب
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-extrabold text-racing">علاقه‌مندی‌های من</h1>
      <p className="mt-2 text-sm text-ink/60">محصولاتی که برای بررسی بعدی ذخیره کرده‌اید.</p>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title="هنوز محصولی ذخیره نکرده‌اید"
            description="با زدن آیکون قلب روی هر محصول، آن را به این فهرست اضافه کنید."
            action={
              <Link to="/shop" className="btn btn-primary mt-2">
                مشاهده محصولات
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
