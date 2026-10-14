import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { ORDER_STATUS, PAYMENT_STATUS, formatDate, formatNumber, formatToman, statusLabel, statusTone } from '../../lib/format';
import { ErrorState, Loading } from '../../components/ui/States';

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-5">
      <Icon size={18} strokeWidth={1.6} className="text-rose-ink" />
      <p className="mt-3 text-xs text-ink/60">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-burgundy">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink/50">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <Loading label="در حال خواندن آمار فروشگاه…" />;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="محصولات"
          value={formatNumber(stats.products.total)}
          hint={`${formatNumber(stats.products.active)} فعال · ${formatNumber(stats.products.demo)} نمایشی`}
        />
        <StatCard
          icon={AlertTriangle}
          label="هشدار موجودی"
          value={formatNumber(stats.stock.out_of_stock)}
          hint={`${formatNumber(stats.stock.low_stock)} محصول با موجودی کمتر از ۵ عدد`}
        />
        <StatCard
          icon={ShoppingBag}
          label="سفارش‌ها"
          value={formatNumber(stats.orders.total)}
          hint={`${formatNumber(stats.orders.pending)} سفارش در انتظار بررسی`}
        />
        <StatCard
          icon={TrendingUp}
          label="مبلغ سفارش‌های پرداخت‌شده"
          value={formatToman(stats.orders.paidRevenue)}
          hint="فقط سفارش‌هایی که وضعیت پرداخت آن‌ها «پرداخت شده» است"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="کاربران" value={formatNumber(stats.users.total)} hint={`${formatNumber(stats.users.customers)} مشتری`} />
        <StatCard icon={ShoppingBag} label="ارزش کل سفارش‌ها" value={formatToman(stats.orders.orderValue)} hint="بدون احتساب سفارش‌های لغوشده" />
        <StatCard icon={Users} label="عضویت خبرنامه" value={formatNumber(stats.newsletter)} hint="ایمیل‌های ثبت‌شده" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold">آخرین سفارش‌ها</h2>
            <Link to="/admin/orders" className="text-xs text-burgundy hover:underline">
              همه سفارش‌ها
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink/60">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <Link to="/admin/orders" className="text-sm font-medium hover:text-burgundy">
                      {order.orderNumber}
                    </Link>
                    <p className="mt-1 text-[11px] text-ink/55">
                      {order.customerName} — {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusTone(ORDER_STATUS, order.status)}`}>
                      {statusLabel(ORDER_STATUS, order.status)}
                    </span>
                    <span className="text-xs font-bold text-burgundy">{formatToman(order.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-bold">موجودی کم</h2>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink/60">همه محصولات موجودی کافی دارند.</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.lowStock.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="line-clamp-1">{item.name}</span>
                  <span className={`shrink-0 text-xs ${item.stock === 0 ? 'text-red-600' : 'text-rose-ink'}`}>
                    {item.stock === 0 ? 'ناموجود' : `${formatNumber(item.stock)} عدد`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold">وضعیت سفارش‌ها</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          {Object.entries(ORDER_STATUS).map(([key, meta]) => (
            <div key={key} className="rounded-xl bg-cream p-3 text-center">
              <p className="text-[11px] text-ink/60">{meta.label}</p>
              <p className="mt-1 font-bold">{formatNumber(stats.orders[key] ?? 0)}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-6 text-ink/55">
          وضعیت پرداخت هر سفارش را می‌توانید در صفحه «سفارش‌ها» تغییر دهید. تا زمانی که درگاه پرداخت واقعی متصل
          نشود، سفارش‌ها با وضعیت «{PAYMENT_STATUS.unpaid.label}» ثبت می‌شوند.
        </p>
      </div>
    </div>
  );
}
