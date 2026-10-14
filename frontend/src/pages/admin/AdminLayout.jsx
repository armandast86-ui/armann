import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Tags, Settings, Store } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV = [
  { to: '/admin', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'محصولات', icon: Package },
  { to: '/admin/orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { to: '/admin/catalog', label: 'دسته‌بندی و برندها', icon: Tags },
  { to: '/admin/settings', label: 'تنظیمات فروشگاه', icon: Settings },
];

export default function AdminLayout() {
  const { user } = useApp();

  return (
    <div className="bg-cream">
      <div className="container-page py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-burgundy">پنل مدیریت آیدا بیوتی</h1>
            <p className="mt-1 text-xs text-ink/55">
              این بخش فقط برای مدیران فروشگاه در دسترس است — دسترسی در سرور بررسی می‌شود.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-white px-3 py-1.5">مدیر: {user?.name}</span>
            <Link to="/" className="btn btn-outline px-4 py-2">
              <Store size={15} strokeWidth={1.8} />
              مشاهده فروشگاه
            </Link>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
          <nav className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col" aria-label="بخش‌های پنل مدیریت">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${
                    isActive ? 'bg-burgundy text-white' : 'bg-white text-ink hover:bg-white/70'
                  }`
                }
              >
                <item.icon size={16} strokeWidth={1.8} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
