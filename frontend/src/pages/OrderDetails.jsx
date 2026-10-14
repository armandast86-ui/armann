import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Copy } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { ORDER_STATUS, PAYMENT_STATUS, formatDateTime, formatToman, statusLabel, statusTone } from '../lib/format';
import { ErrorState, Loading, NoteBanner } from '../components/ui/States';

export default function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { notify } = useApp();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const justPlaced = Boolean(location.state?.justPlaced);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/orders/${id}`)
      .then((data) => {
        if (!cancelled) {
          setOrder(data);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === 'loading') return <Loading label="در حال بارگذاری سفارش…" className="min-h-[50vh]" />;
  if (status === 'error') {
    return (
      <div className="container-page py-16">
        <ErrorState message={error} />
      </div>
    );
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      notify('شماره سفارش کپی شد.');
    } catch {
      notify('کپی‌کردن شماره سفارش ممکن نشد.', 'error');
    }
  };

  return (
    <div className="container-page py-10">
      {justPlaced && (
        <div className="card mb-6 border-emerald-200 bg-emerald-50 p-5">
          <h1 className="flex items-center gap-2 text-base font-bold text-emerald-800">
            <CheckCircle2 size={18} strokeWidth={1.8} />
            سفارش شما با موفقیت ثبت شد
          </h1>
          <p className="mt-2 text-sm leading-7 text-emerald-900/80">
            سفارش در وضعیت «پرداخت نشده» ثبت شده است. این نسخه درگاه پرداخت واقعی ندارد و پرداخت آنلاین انجام
            نشده است؛ برای هماهنگی پرداخت با پشتیبانی فروشگاه تماس بگیرید.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-burgundy">سفارش {order.orderNumber}</h1>
          <p className="mt-1 text-xs text-ink/55">ثبت‌شده در {formatDateTime(order.createdAt)}</p>
        </div>
        <button type="button" onClick={copyNumber} className="btn btn-outline px-4 py-2">
          <Copy size={15} strokeWidth={1.8} />
          کپی شماره سفارش
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <span className={`rounded-full px-3 py-1.5 text-xs ${statusTone(ORDER_STATUS, order.status)}`}>
          وضعیت سفارش: {statusLabel(ORDER_STATUS, order.status)}
        </span>
        <span className={`rounded-full px-3 py-1.5 text-xs ${statusTone(PAYMENT_STATUS, order.paymentStatus)}`}>
          وضعیت پرداخت: {statusLabel(PAYMENT_STATUS, order.paymentStatus)}
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="card divide-y divide-line">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                {item.slug ? (
                  <Link to={`/product/${item.slug}`} className="text-sm font-medium transition hover:text-burgundy">
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
                <p className="mt-1 text-xs text-ink/55">
                  {item.quantity.toLocaleString('fa-IR')} × {formatToman(item.unitPrice)}
                </p>
              </div>
              <span className="text-sm font-bold text-burgundy">{formatToman(item.lineTotal)}</span>
            </div>
          ))}
        </section>

        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-bold">مبلغ سفارش</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink/60">جمع کالاها</dt>
                <dd>{formatToman(order.subtotal)}</dd>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <dt>تخفیف {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                  <dd>−{formatToman(order.discountTotal)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-ink/60">هزینه ارسال</dt>
                <dd>{order.shippingTotal === 0 ? 'رایگان' : formatToman(order.shippingTotal)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3 text-base font-bold text-burgundy">
                <dt>مبلغ کل</dt>
                <dd>{formatToman(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold">اطلاعات گیرنده</h2>
            <dl className="mt-3 space-y-2 text-sm leading-7">
              <div>
                <dt className="text-xs text-ink/55">نام</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">شماره تماس</dt>
                <dd dir="ltr" className="text-end">
                  {order.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">نشانی</dt>
                <dd>
                  {[order.province, order.city].filter(Boolean).join('، ')} — {order.address}
                  {order.postalCode ? ` — کد پستی ${order.postalCode}` : ''}
                </dd>
              </div>
              {order.note && (
                <div>
                  <dt className="text-xs text-ink/55">توضیحات</dt>
                  <dd>{order.note}</dd>
                </div>
              )}
            </dl>
          </div>

          <NoteBanner>
            پیگیری وضعیت ارسال از طریق همین صفحه یا صفحه «پیگیری سفارش» با شماره سفارش و شماره تماس امکان‌پذیر است.
          </NoteBanner>

          <Link to="/account?tab=orders" className="btn btn-outline w-full">
            فهرست همه سفارش‌های من
          </Link>
        </aside>
      </div>
    </div>
  );
}
