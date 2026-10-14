import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, ShoppingBag, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { formatToman } from '../lib/format';
import QuantityStepper from '../components/ui/QuantityStepper';
import { EmptyState, Loading } from '../components/ui/States';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, settings, notify } = useApp();
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState('idle');
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState('');

  const serialized = JSON.stringify(cart.map((item) => ({ productId: item.productId, quantity: item.quantity })));

  useEffect(() => {
    if (cart.length === 0) {
      setQuote(null);
      setStatus('idle');
      return undefined;
    }
    let cancelled = false;
    setStatus('loading');
    setError('');
    api
      .post('/orders/quote', { items: JSON.parse(serialized), couponCode: coupon.trim() || undefined })
      .then((data) => {
        if (cancelled) return;
        setQuote(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [serialized, coupon, cart.length]);

  const applyCoupon = (event) => {
    event.preventDefault();
    if (!coupon.trim()) {
      notify('کد تخفیف را وارد کنید.', 'error');
      return;
    }
    setCoupon((current) => `${current.trim().toUpperCase()}`);
    notify('کد تخفیف بررسی شد.');
  };

  if (cart.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="سبد خرید شما خالی است"
          description="محصولات مورد علاقه‌تان را به سبد اضافه کنید تا در این صفحه نمایش داده شوند."
          action={
            <Link to="/shop" className="btn btn-primary mt-2">
              رفتن به فروشگاه
            </Link>
          }
        />
      </div>
    );
  }

  const lines = quote?.lines ?? [];

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-extrabold text-burgundy">سبد خرید</h1>
      <p className="mt-2 text-sm text-ink/60">
        قیمت‌ها و موجودی در این صفحه از سرور خوانده می‌شوند تا با آخرین وضعیت فروشگاه هم‌خوان باشند.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          {status === 'loading' && lines.length === 0 && <Loading label="در حال بررسی سبد خرید…" />}
  {status === 'error' && (
            <div className="card border-red-200 p-4 text-sm text-red-700">{error}</div>
          )}

          {quote?.unavailable?.length > 0 && (
            <div className="card border-gold/50 bg-gold/10 p-4 text-xs leading-6">
              <p className="mb-1 flex items-center gap-2 font-medium">
                <Info size={14} strokeWidth={1.8} />
                این محصولات در حال حاضر قابل خرید نیستند:
              </p>
              <ul className="list-inside list-disc">
                {quote.unavailable.map((item) => (
                  <li key={item.productId}>{item.name ?? `محصول #${item.productId}`} — {item.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {lines.map((line) => (
            <div key={line.productId} className="card flex gap-4 p-4">
              <Link to={`/product/${line.slug}`} className="shrink-0">
                <img
                  src={line.image}
                  alt={line.name}
                  loading="lazy"
                  className="size-20 rounded-xl object-cover sm:size-24"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/product/${line.slug}`} className="text-sm font-medium transition hover:text-burgundy">
                    {line.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.productId)}
                    aria-label={`حذف ${line.name} از سبد خرید`}
                    className="rounded-full p-1.5 text-ink/45 transition hover:bg-cream hover:text-red-600"
                  >
                    <Trash2 size={15} strokeWidth={1.7} />
                  </button>
                </div>
                <p className="text-xs text-ink/55">
                  قیمت واحد: {formatToman(line.unitPrice)}
                  {line.stockAdjusted && (
                    <span className="ms-2 text-rose-ink">
                      تعداد به اندازه موجودی ({line.stock.toLocaleString('fa-IR')}) اصلاح شد
                    </span>
                  )}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <QuantityStepper
                    size="sm"
                    value={line.quantity}
                    max={Math.max(line.stock, 1)}
                    onChange={(next) => updateQuantity(line.productId, next)}
                  />
                  <span className="text-sm font-bold text-burgundy">{formatToman(line.lineTotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card space-y-4 p-6">
            <h2 className="text-base font-bold">خلاصه سفارش</h2>

            <form onSubmit={applyCoupon} className="space-y-2">
              <label htmlFor="coupon" className="block text-xs text-ink/70">
                کد تخفیف
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon"
                  dir="ltr"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value.toUpperCase())}
                  placeholder="مثلاً AIDA15"
                  className="field text-start"
                />
                <button type="submit" className="btn btn-outline shrink-0 px-4">
                  بررسی
                </button>
              </div>
            </form>

            {quote?.coupon && (
              <p className="text-xs text-emerald-700">
                کد «{quote.coupon.code}» اعمال شد — {quote.coupon.description}
              </p>
            )}

            <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink/60">جمع کالاها</dt>
                <dd>{quote ? formatToman(quote.subtotal) : '—'}</dd>
              </div>
              {quote?.discountTotal > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <dt>تخفیف</dt>
                  <dd>−{formatToman(quote.discountTotal)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-ink/60">هزینه ارسال</dt>
                <dd>{quote ? (quote.shippingTotal === 0 ? 'رایگان' : formatToman(quote.shippingTotal)) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3 text-base font-bold text-burgundy">
                <dt>مبلغ قابل پرداخت</dt>
                <dd>{quote ? formatToman(quote.total) : '—'}</dd>
              </div>
            </dl>

            {quote && quote.shippingTotal > 0 && quote.freeShippingThreshold > 0 && (
              <p className="text-[11px] leading-6 text-ink/55">
                با {formatToman(Math.max(quote.freeShippingThreshold - (quote.subtotal - quote.discountTotal), 0))} خرید
                بیشتر، ارسال سفارش شما رایگان می‌شود.
              </p>
            )}

            <Link to="/checkout" className="btn btn-primary w-full py-3">
              <ShoppingBag size={17} strokeWidth={1.8} />
              ادامه فرآیند خرید
            </Link>
            <Link to="/shop" className="btn btn-outline w-full">
              <ArrowLeft size={15} strokeWidth={1.8} />
              ادامه خرید
            </Link>

            {settings?.shippingFee > 0 && (
              <p className="text-[11px] leading-6 text-ink/50">
                هزینه ارسال پایه {formatToman(settings.shippingFee)} است و برای سفارش‌های بالای{' '}
                {formatToman(settings.freeShippingThreshold)} رایگان می‌شود.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
