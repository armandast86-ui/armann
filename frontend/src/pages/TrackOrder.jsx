import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { api } from '../lib/api';
import { ORDER_STATUS, PAYMENT_STATUS, formatDateTime, formatToman, statusLabel, statusTone } from '../lib/format';

export default function TrackOrder() {
  const [form, setForm] = useState({ orderNumber: '', phone: '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const result = await api.post('/orders/track', form);
      setOrder(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-racing">پیگیری سفارش</h1>
        <p className="mt-2 text-sm leading-7 text-ink/60">
          شماره سفارش و شماره تماس خود را وارد کنید تا وضعیت پرداخت و ارسال سفارش را ببینید.
        </p>

        <form onSubmit={submit} className="card mt-6 grid gap-4 p-6 sm:grid-cols-2" noValidate>
          <div>
            <label htmlFor="orderNumber" className="mb-1.5 block text-xs font-medium text-ink/75">
              شماره سفارش
            </label>
            <input
              id="orderNumber"
              dir="ltr"
              value={form.orderNumber}
              onChange={(event) => setForm({ ...form, orderNumber: event.target.value.trim() })}
              className="field text-start"
              placeholder="AB123456789"
            />
          </div>
          <div>
            <label htmlFor="trackPhone" className="mb-1.5 block text-xs font-medium text-ink/75">
              شماره تماس
            </label>
            <input
              id="trackPhone"
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value.trim() })}
              className="field text-start"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              <PackageSearch size={17} strokeWidth={1.8} />
              {loading ? 'در حال بررسی…' : 'نمایش وضعیت سفارش'}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {order && (
          <div className="card mt-6 space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold">سفارش {order.orderNumber}</h2>
              <span className="text-xs text-ink/55">{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`rounded-full px-3 py-1.5 text-xs ${statusTone(ORDER_STATUS, order.status)}`}>
                {statusLabel(ORDER_STATUS, order.status)}
              </span>
              <span className={`rounded-full px-3 py-1.5 text-xs ${statusTone(PAYMENT_STATUS, order.paymentStatus)}`}>
                {statusLabel(PAYMENT_STATUS, order.paymentStatus)}
              </span>
            </div>
            <dl className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink/55">گیرنده</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">شهر</dt>
                <dd>{order.city}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink/55">مبلغ کل</dt>
                <dd className="font-bold text-racing">{formatToman(order.total)}</dd>
              </div>
            </dl>
            <ul className="divide-y divide-line border-t border-line text-sm">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <span>{item.name}</span>
                  <span className="text-xs text-ink/60">
                    {item.quantity.toLocaleString('fa-IR')} × {formatToman(item.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-ink/60">
          برای مشاهده تاریخچه سفارش‌ها{' '}
          <Link to="/account" className="text-racing hover:underline">
            وارد حساب کاربری
          </Link>{' '}
          شوید.
        </p>
      </div>
    </div>
  );
}
