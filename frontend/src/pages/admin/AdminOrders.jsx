import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { api, queryString } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { ORDER_STATUS, PAYMENT_STATUS, formatDateTime, formatToman, statusLabel, statusTone } from '../../lib/format';
import { EmptyState, Loading, NoteBanner } from '../../components/ui/States';

export default function AdminOrders() {
  const { notify } = useApp();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState(null);

  const load = useCallback(() => {
    setOrders(null);
    api
      .get(`/admin/orders${queryString({ status, query })}`)
      .then((data) => setOrders(data ?? []))
      .catch((err) => {
        setError(err.message);
        setOrders([]);
      });
  }, [status, query]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetails = async (order) => {
    if (openId === order.id) {
      setOpenId(null);
      setDetails(null);
      return;
    }
    setOpenId(order.id);
    try {
      const data = await api.get(`/admin/orders/${order.id}`);
      setDetails(data);
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const updateOrder = async (order, changes) => {
    try {
      const updated = await api.patch(`/admin/orders/${order.id}`, changes);
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, ...updated } : item)),
      );
      notify('وضعیت سفارش به‌روز شد.');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold">مدیریت سفارش‌ها</h2>

      <NoteBanner>
        وضعیت پرداخت را فقط زمانی «پرداخت شده» ثبت کنید که وجه سفارش واقعاً دریافت شده باشد. این نسخه درگاه
        پرداخت آنلاین ندارد.
      </NoteBanner>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="field max-w-40" aria-label="فیلتر وضعیت">
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(ORDER_STATUS).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="شماره سفارش، نام یا شماره تماس"
            aria-label="جست‌وجوی سفارش"
            className="field max-w-xs"
          />
          <button type="submit" className="btn btn-outline px-4">
            <Search size={15} strokeWidth={1.8} />
            جست‌وجو
          </button>
        </form>
      </div>

      {error && <NoteBanner>{error}</NoteBanner>}
      {orders === null && <Loading />}
      {orders?.length === 0 && !error && (
        <EmptyState title="سفارشی یافت نشد" description="با تغییر فیلتر یا جست‌وجو دوباره تلاش کنید." />
      )}

      {orders?.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-bold">{order.orderNumber}</p>
                  <p className="mt-1 text-[11px] text-ink/55">
                    {order.customerName} — {formatDateTime(order.createdAt)}
                  </p>
                  <p dir="ltr" className="mt-0.5 text-end text-[11px] text-ink/55">
                    {order.phone}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusTone(ORDER_STATUS, order.status)}`}>
                    {statusLabel(ORDER_STATUS, order.status)}
                  </span>
                  <span className="text-sm font-bold text-burgundy">{formatToman(order.total)}</span>
                  <button
                    type="button"
                    onClick={() => openDetails(order)}
                    className="btn btn-outline px-3 py-1.5 text-xs"
                    aria-expanded={openId === order.id}
                  >
                    جزئیات
                    <ChevronDown size={13} className={openId === order.id ? 'rotate-180' : ''} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t border-line bg-cream/60 px-4 py-3">
                <label className="flex items-center gap-2 text-xs">
                  وضعیت سفارش
                  <select
                    value={order.status}
                    onChange={(event) => updateOrder(order, { status: event.target.value })}
                    className="field py-1.5 text-xs"
                  >
                    {Object.entries(ORDER_STATUS).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  وضعیت پرداخت
                  <select
                    value={order.paymentStatus}
                    onChange={(event) => updateOrder(order, { paymentStatus: event.target.value })}
                    className="field py-1.5 text-xs"
                  >
                    {Object.entries(PAYMENT_STATUS).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {openId === order.id && details?.id === order.id && (
                <div className="border-t border-line p-4 text-sm">
                  <ul className="divide-y divide-line">
                    {details.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                        <span>{item.name}</span>
                        <span className="text-xs text-ink/60">
                          {item.quantity.toLocaleString('fa-IR')} × {formatToman(item.unitPrice)} ={' '}
                          {formatToman(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-3 grid gap-2 text-xs text-ink/70 sm:grid-cols-2">
                    <div>
                      <dt className="text-ink/50">نشانی</dt>
                      <dd>
                        {[details.province, details.city].filter(Boolean).join('، ')} — {details.address}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink/50">جمع کل</dt>
                      <dd className="font-bold text-burgundy">{formatToman(details.total)}</dd>
                    </div>
                    {details.note && (
                      <div className="sm:col-span-2">
                        <dt className="text-ink/50">توضیحات مشتری</dt>
                        <dd>{details.note}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
