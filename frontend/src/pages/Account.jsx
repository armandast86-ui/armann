import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, LogOut, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { ORDER_STATUS, PAYMENT_STATUS, formatDate, formatToman, statusLabel, statusTone } from '../lib/format';
import { EmptyState, Loading } from '../components/ui/States';

const TABS = [
  { key: 'profile', label: 'اطلاعات حساب' },
  { key: 'orders', label: 'سفارش‌های من' },
  { key: 'addresses', label: 'نشانی‌ها' },
  { key: 'wishlist', label: 'علاقه‌مندی‌ها' },
];

const EMPTY_ADDRESS = {
  id: null,
  fullName: '',
  phone: '',
  province: '',
  city: '',
  address: '',
  postalCode: '',
  isDefault: false,
};

export default function Account() {
  const { user, setUser, logout, notify, wishlist, reloadWishlist } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((item) => item.key === searchParams.get('tab')) ? searchParams.get('tab') : 'profile';

  const [profile, setProfile] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', password: '' });
  const [profileStatus, setProfileStatus] = useState({ loading: false, message: '', error: '' });

  const [orders, setOrders] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [addressForm, setAddressForm] = useState(null);
  const [addressError, setAddressError] = useState('');
  const [wishlistProducts, setWishlistProducts] = useState(null);

  const loadOrders = useCallback(() => {
    api.get('/orders').then(setOrders).catch(() => setOrders([]));
  }, []);

  const loadAddresses = useCallback(() => {
    api.get('/addresses').then(setAddresses).catch(() => setAddresses([]));
  }, []);

  useEffect(() => {
    if (tab === 'orders' && orders === null) loadOrders();
  }, [tab, orders, loadOrders]);

  useEffect(() => {
    if (tab === 'addresses' && addresses === null) loadAddresses();
  }, [tab, addresses, loadAddresses]);

  useEffect(() => {
    if (tab !== 'wishlist') return;
    reloadWishlist();
    api.get('/wishlist').then(setWishlistProducts).catch(() => setWishlistProducts([]));
  }, [tab, reloadWishlist]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileStatus({ loading: true, message: '', error: '' });
    try {
      const result = await api.patch('/auth/me', {
        name: profile.name,
        phone: profile.phone,
        password: profile.password || undefined,
      });
      setUser(result.user);
      setProfile({ name: result.user.name, phone: result.user.phone ?? '', password: '' });
      setProfileStatus({ loading: false, message: 'اطلاعات حساب ذخیره شد.', error: '' });
      notify('اطلاعات حساب ذخیره شد.');
    } catch (error) {
      setProfileStatus({ loading: false, message: '', error: error.message });
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setAddressError('');
    try {
      if (addressForm.id) await api.put(`/addresses/${addressForm.id}`, addressForm);
      else await api.post('/addresses', addressForm);
      setAddressForm(null);
      loadAddresses();
      notify('نشانی ذخیره شد.');
    } catch (error) {
      setAddressError(error.message);
    }
  };

  const removeAddress = async (id) => {
    try {
      await api.del(`/addresses/${id}`);
      setAddresses((current) => current.filter((item) => item.id !== id));
      notify('نشانی حذف شد.');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const removeWishlist = async (productId) => {
    await api.del(`/wishlist/${productId}`);
    setWishlistProducts((current) => current.filter((item) => item.id !== productId));
    reloadWishlist();
  };

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-burgundy">حساب کاربری من</h1>
          <p className="mt-1 text-sm text-ink/60">{user?.name} — {user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-outline">
              پنل مدیریت
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="btn btn-outline px-4"
          >
            <LogOut size={15} strokeWidth={1.8} />
            خروج از حساب
          </button>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col" aria-label="بخش‌های حساب کاربری">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-current={tab === item.key ? 'page' : undefined}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm transition ${
                tab === item.key ? 'bg-burgundy text-white' : 'bg-white text-ink hover:bg-cream'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section>
          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="card max-w-xl space-y-4 p-6" noValidate>
              <h2 className="text-base font-bold">اطلاعات حساب</h2>
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-xs font-medium text-ink/75">
                  نام و نام خانوادگی
                </label>
                <input
                  id="profile-name"
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="profile-phone" className="mb-1.5 block text-xs font-medium text-ink/75">
                  شماره تماس
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  dir="ltr"
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                  className="field text-start"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-1.5 block text-xs font-medium text-ink/75">
                  ایمیل (غیرقابل تغییر)
                </label>
                <input id="profile-email" dir="ltr" value={user?.email ?? ''} disabled className="field text-start opacity-60" />
              </div>
              <div>
                <label htmlFor="profile-password" className="mb-1.5 block text-xs font-medium text-ink/75">
                  رمز عبور جدید (اختیاری)
                </label>
                <input
                  id="profile-password"
                  type="password"
                  dir="ltr"
                  value={profile.password}
                  onChange={(event) => setProfile({ ...profile, password: event.target.value })}
                  className="field text-start"
                  placeholder="برای تغییر رمز، رمز جدید را وارد کنید"
                />
              </div>

              {profileStatus.error && <p className="text-sm text-red-600">{profileStatus.error}</p>}
              {profileStatus.message && <p className="text-sm text-emerald-700">{profileStatus.message}</p>}

              <button type="submit" disabled={profileStatus.loading} className="btn btn-primary">
                {profileStatus.loading ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
              </button>
            </form>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              {orders === null && <Loading />}
              {orders?.length === 0 && (
                <EmptyState
                  title="هنوز سفارشی ثبت نکرده‌اید"
                  description="پس از ثبت اولین سفارش، وضعیت آن در این بخش نمایش داده می‌شود."
                  action={
                    <Link to="/shop" className="btn btn-primary mt-2">
                      مشاهده محصولات
                    </Link>
                  }
                />
              )}
              {orders?.map((order) => (
                <div key={order.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-bold">سفارش {order.orderNumber}</p>
                    <p className="mt-1 text-xs text-ink/55">
                      {formatDate(order.createdAt)} — {order.itemCount.toLocaleString('fa-IR')} قلم کالا
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusTone(ORDER_STATUS, order.status)}`}>
                        {statusLabel(ORDER_STATUS, order.status)}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusTone(PAYMENT_STATUS, order.paymentStatus)}`}>
                        {statusLabel(PAYMENT_STATUS, order.paymentStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-bold text-burgundy">{formatToman(order.total)}</p>
                    <Link to={`/order/${order.id}`} className="mt-2 inline-block text-xs text-burgundy hover:underline">
                      مشاهده جزئیات
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'addresses' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setAddressForm({ ...EMPTY_ADDRESS });
                  setAddressError('');
                }}
                className="btn btn-primary"
              >
                <Plus size={16} strokeWidth={1.9} />
                افزودن نشانی جدید
              </button>

              {addresses === null && <Loading />}
              {addresses?.length === 0 && !addressForm && (
                <EmptyState title="نشانی ذخیره‌شده‌ای ندارید" description="برای خرید سریع‌تر، نشانی ارسال خود را ذخیره کنید." />
              )}

              {addresses?.map((address) => (
                <div key={address.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="text-sm leading-7">
                    <p className="flex items-center gap-2 font-medium">
                      <MapPin size={15} strokeWidth={1.7} className="text-rose-ink" />
                      {address.fullName}
                      {address.isDefault && (
                        <span className="rounded-full bg-blush px-2 py-0.5 text-[10px]">نشانی پیش‌فرض</span>
                      )}
                    </p>
                    <p className="mt-1 text-ink/70">
                      {[address.province, address.city].filter(Boolean).join('، ')} — {address.address}
                    </p>
                    <p dir="ltr" className="mt-1 text-end text-xs text-ink/55">
                      {address.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAddressForm(address)}
                      className="btn btn-outline px-3 py-2 text-xs"
                    >
                      <Pencil size={13} strokeWidth={1.8} />
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAddress(address.id)}
                      className="btn btn-outline px-3 py-2 text-xs"
                    >
                      <Trash2 size={13} strokeWidth={1.8} />
                      حذف
                    </button>
                  </div>
                </div>
              ))}

              {addressForm && (
                <form onSubmit={saveAddress} className="card space-y-4 p-6" noValidate>
                  <h3 className="text-sm font-bold">{addressForm.id ? 'ویرایش نشانی' : 'نشانی جدید'}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { name: 'fullName', label: 'نام گیرنده', required: true },
                      { name: 'phone', label: 'شماره تماس', ltr: true },
                      { name: 'province', label: 'استان' },
                      { name: 'city', label: 'شهر', required: true },
                      { name: 'postalCode', label: 'کد پستی', ltr: true },
                    ].map((field) => (
                      <div key={field.name}>
                        <label htmlFor={`addr-${field.name}`} className="mb-1.5 block text-xs font-medium text-ink/75">
                          {field.label}
                        </label>
                        <input
                          id={`addr-${field.name}`}
                          dir={field.ltr ? 'ltr' : undefined}
                          value={addressForm[field.name] ?? ''}
                          onChange={(event) => setAddressForm({ ...addressForm, [field.name]: event.target.value })}
                          className={`field ${field.ltr ? 'text-start' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="addr-address" className="mb-1.5 block text-xs font-medium text-ink/75">
                      نشانی کامل پستی
                    </label>
                    <textarea
                      id="addr-address"
                      rows={3}
                      value={addressForm.address}
                      onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })}
                      className="field"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })}
                      className="size-4 accent-burgundy"
                    />
                    این نشانی پیش‌فرض من باشد
                  </label>

                  {addressError && <p className="text-sm text-red-600">{addressError}</p>}

                  <div className="flex gap-3">
                    <button type="submit" className="btn btn-primary">
                      ذخیره نشانی
                    </button>
                    <button type="button" onClick={() => setAddressForm(null)} className="btn btn-outline">
                      انصراف
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {tab === 'wishlist' && (
            <div className="space-y-4">
              {wishlistProducts === null && <Loading />}
              {wishlistProducts?.length === 0 && (
                <EmptyState
                  title="فهرست علاقه‌مندی‌ها خالی است"
                  description="با زدن آیکون قلب روی محصولات، آن‌ها را اینجا ذخیره کنید."
                  action={
                    <Link to="/shop" className="btn btn-primary mt-2">
                      مشاهده محصولات
                    </Link>
                  }
                />
              )}
              {wishlistProducts?.map((product) => (
                <div key={product.id} className="card flex items-center gap-4 p-4">
                  <img src={product.image} alt="" className="size-16 rounded-xl object-cover" loading="lazy" />
                  <div className="flex-1">
                    <Link to={`/product/${product.slug}`} className="text-sm font-medium hover:text-burgundy">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-burgundy">{formatToman(product.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWishlist(product.id)}
                    className="btn btn-outline px-3 py-2 text-xs"
                  >
                    <Heart size={13} strokeWidth={1.8} className="fill-rose text-rose" />
                    حذف
                  </button>
                </div>
              ))}
              {wishlist.length === 0 && wishlistProducts?.length > 0 && (
                <p className="text-xs text-ink/55">فهرست علاقه‌مندی‌ها به‌روز شد.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
