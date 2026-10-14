import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Lock, MapPin, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { formatToman, parseNumber } from '../lib/format';
import { EmptyState, NoteBanner } from '../components/ui/States';

const PROVINCES = [
  'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز', 'ایلام', 'بوشهر', 'تهران',
  'چهارمحال و بختیاری', 'خراسان جنوبی', 'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 'سمنان',
  'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان', 'کرمان', 'کرمانشاه', 'کهگیلویه و بویراحمد',
  'گلستان', 'گیلان', 'لرستان', 'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد',
];

const EMPTY_FORM = {
  customerName: '',
  phone: '',
  province: '',
  city: '',
  address: '',
  postalCode: '',
  note: '',
};

export default function Checkout() {
  const { cart, user, authReady, clearCart, notify } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  // A single key per checkout attempt: the server returns the same order instead of
  // creating a duplicate when the request is retried.
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `key-${Date.now()}`,
  );

  const serialized = JSON.stringify(cart.map((item) => ({ productId: item.productId, quantity: item.quantity })));

  useEffect(() => {
    if (cart.length === 0) return undefined;
    let cancelled = false;
    api
      .post('/orders/quote', { items: JSON.parse(serialized) })
      .then((data) => {
        if (!cancelled) setQuote(data);
      })
      .catch((error) => {
        if (!cancelled) setQuoteError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [serialized, cart.length]);

  useEffect(() => {
    if (!user) return;
    api
      .get('/addresses')
      .then((data) => {
        setAddresses(data ?? []);
        const preferred = (data ?? []).find((item) => item.isDefault) ?? data?.[0];
        if (preferred) {
          setSelectedAddress(String(preferred.id));
          setForm((current) => ({
            ...current,
            customerName: preferred.fullName,
            phone: preferred.phone,
            province: preferred.province ?? '',
            city: preferred.city,
            address: preferred.address,
            postalCode: preferred.postalCode ?? '',
          }));
        }
      })
      .catch(() => {});
  }, [user]);

  const applyAddress = (value) => {
    setSelectedAddress(value);
    const address = addresses.find((item) => String(item.id) === value);
    if (!address) return;
    setForm((current) => ({
      ...current,
      customerName: address.fullName,
      phone: address.phone,
      province: address.province ?? '',
      city: address.city,
      address: address.address,
      postalCode: address.postalCode ?? '',
    }));
  };

  const validate = () => {
    const next = {};
    if (form.customerName.trim().length < 3) next.customerName = 'نام و نام خانوادگی را کامل وارد کنید.';
    if (!/^09\d{9}$/.test(form.phone.trim())) next.phone = 'شماره تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.';
    if (!form.city.trim()) next.city = 'شهر را وارد کنید.';
    if (form.address.trim().length < 10) next.address = 'نشانی را کامل‌تر وارد کنید.';
    if (form.postalCode && !/^\d{10}$/.test(form.postalCode)) next.postalCode = 'کد پستی باید ۱۰ رقم باشد.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;
    if (!quote || quote.lines.length === 0) {
      setServerError('سبد خرید شما قابل ثبت نیست. لطفاً سبد را بررسی کنید.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post('/orders', {
        ...form,
        items: JSON.parse(serialized),
        idempotencyKey,
      });
      clearCart();
      notify('سفارش شما ثبت شد.');
      navigate(`/order/${result.order.id}`, { state: { justPlaced: true }, replace: true });
    } catch (error) {
      if (error.status === 401) {
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }
      setServerError(error.message);
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => quote, [quote]);

  if (!authReady) return null;

  if (cart.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="سبد خرید شما خالی است"
          description="برای ثبت سفارش ابتدا محصولی را به سبد خرید اضافه کنید."
          action={
            <Link to="/shop" className="btn btn-primary mt-2">
              رفتن به فروشگاه
            </Link>
          }
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="برای ثبت سفارش وارد حساب خود شوید"
          description="تاریخچه سفارش‌ها و پیگیری ارسال، پس از ورود به حساب برای شما نمایش داده می‌شود."
          action={
            <div className="mt-2 flex gap-3">
              <Link to="/login" state={{ from: '/checkout' }} className="btn btn-primary">
                ورود به حساب
              </Link>
              <Link to="/register" state={{ from: '/checkout' }} className="btn btn-outline">
                ساخت حساب جدید
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const field = (name, label, extra = {}) => (
    <div key={name}>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-ink/75">
        {label}
        {extra.required && <span className="text-racing-deep"> *</span>}
      </label>
      {extra.type === 'textarea' ? (
        <textarea
          id={name}
          rows={3}
          value={form[name]}
          onChange={(event) => setForm({ ...form, [name]: event.target.value })}
          className="field"
          placeholder={extra.placeholder}
        />
      ) : extra.options ? (
        <select
          id={name}
          value={form[name]}
          onChange={(event) => setForm({ ...form, [name]: event.target.value })}
          className="field"
        >
          <option value="">انتخاب کنید…</option>
          {extra.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type="text"
          inputMode={extra.inputMode}
          dir={extra.ltr ? 'ltr' : undefined}
          value={form[name]}
          onChange={(event) =>
            setForm({ ...form, [name]: extra.numeric ? String(parseNumber(event.target.value) || '').replace('NaN', '') : event.target.value })
          }
          className={`field ${extra.ltr ? 'text-start' : ''}`}
          placeholder={extra.placeholder}
        />
      )}
      {errors[name] && <p className="mt-1 text-[11px] text-red-600">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-extrabold text-racing">تکمیل سفارش</h1>
      <p className="mt-2 text-sm text-ink/60">
        اطلاعات گیرنده و نشانی ارسال را کامل کنید تا سفارش شما ثبت شود.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <form onSubmit={submit} className="space-y-6" noValidate>
          {addresses.length > 0 && (
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <MapPin size={16} strokeWidth={1.7} className="text-racing-deep" />
                انتخاب از نشانی‌های ذخیره‌شده
              </h2>
              <select
                value={selectedAddress}
                onChange={(event) => applyAddress(event.target.value)}
                className="field mt-3"
                aria-label="نشانی ذخیره‌شده"
              >
                <option value="">نشانی جدید وارد می‌کنم</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.fullName} — {address.city}، {address.address.slice(0, 40)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="card space-y-5 p-5">
            <h2 className="text-sm font-bold">اطلاعات گیرنده</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('customerName', 'نام و نام خانوادگی', { required: true, placeholder: 'مثلاً سارا محمدی' })}
              {field('phone', 'شماره تماس', {
                required: true,
                ltr: true,
                inputMode: 'tel',
                placeholder: '۰۹۱۲۳۴۵۶۷۸۹',
              })}
              {field('province', 'استان', { options: PROVINCES })}
              {field('city', 'شهر', { required: true, placeholder: 'مثلاً تهران' })}
            </div>
            {field('address', 'نشانی کامل پستی', {
              required: true,
              type: 'textarea',
              placeholder: 'خیابان، کوچه، پلاک، واحد',
            })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('postalCode', 'کد پستی (اختیاری)', { ltr: true, numeric: true, inputMode: 'numeric' })}
            </div>
            {field('note', 'توضیحات سفارش (اختیاری)', {
              type: 'textarea',
              placeholder: 'مثلاً تحویل در ساعات عصر',
            })}
          </div>

          <NoteBanner>
            در این نسخه، سفارش با وضعیت «پرداخت نشده» ثبت می‌شود و هیچ پرداخت آنلاین واقعی انجام نمی‌شود. برای
            تکمیل پرداخت، درگاه بانکی باید توسط مدیر فروشگاه متصل شود.
          </NoteBanner>

          {serverError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
            <Lock size={16} strokeWidth={1.8} />
            {submitting ? 'در حال ثبت سفارش…' : 'ثبت نهایی سفارش'}
          </button>
        </form>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card space-y-4 p-6">
            <h2 className="text-base font-bold">مرور سفارش</h2>

            {!summary && !quoteError && <p className="text-sm text-ink/60">در حال محاسبه مبلغ سفارش…</p>}
            {quoteError && <p className="text-sm text-red-600">{quoteError}</p>}

            {summary && (
              <>
                <ul className="space-y-3 border-b border-line pb-4">
                  {summary.lines.map((line) => (
                    <li key={line.productId} className="flex items-center gap-3 text-xs">
                      <img src={line.image} alt="" loading="lazy" className="size-12 rounded-lg object-cover" />
                      <span className="flex-1 leading-6">
                        {line.name}
                        <span className="block text-ink/50">
                          {line.quantity.toLocaleString('fa-IR')} × {formatToman(line.unitPrice)}
                        </span>
                      </span>
                      <span className="font-medium">{formatToman(line.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-ink/60">جمع کالاها</dt>
                    <dd>{formatToman(summary.subtotal)}</dd>
                  </div>
                  {summary.discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <dt>تخفیف</dt>
                      <dd>−{formatToman(summary.discountTotal)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="text-ink/60">هزینه ارسال</dt>
                    <dd>{summary.shippingTotal === 0 ? 'رایگان' : formatToman(summary.shippingTotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-3 text-base font-bold text-racing">
                    <dt>مبلغ قابل پرداخت</dt>
                    <dd>{formatToman(summary.total)}</dd>
                  </div>
                </dl>

                {summary.unavailable?.length > 0 && (
                  <p className="flex items-start gap-2 text-[11px] leading-6 text-racing-deep">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    {summary.unavailable.length.toLocaleString('fa-IR')} محصول از سبد خرید در حال حاضر قابل
                    خرید نیست و در محاسبه لحاظ نشده است.
                  </p>
                )}
              </>
            )}

            <Link to="/cart" className="btn btn-outline w-full">
              <ShoppingBag size={15} strokeWidth={1.8} />
              ویرایش سبد خرید
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
