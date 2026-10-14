import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Logo from '../ui/Logo';

const SIMPLE_ITEMS = [
  { label: 'پرفروش‌ترین‌ها', to: '/shop?sort=best-selling' },
  { label: 'محصولات جدید', to: '/shop?sort=newest' },
  { label: 'تخفیف‌ها', to: '/deals' },
  { label: 'درباره ما', to: '/about' },
  { label: 'تماس با ما', to: '/contact' },
];

export default function Header() {
  const { settings, categories, brands, cartCount, wishlist, user } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null); // 'categories' | 'brands' | null
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setDropdown(null);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `/shop?query=${encodeURIComponent(query)}` : '/shop');
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const openDropdown = (name) => {
    window.clearTimeout(closeTimer.current);
    setDropdown(name);
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setDropdown(null), 140);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-carbon text-white">
        <div className="container-page flex items-center justify-between gap-4 py-3">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={settings?.storeName ?? 'اتو درایو'}>
            <Logo size={40} />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold tracking-tight sm:text-xl">
                {settings?.storeName ?? 'اتو درایو'}
              </span>
              <span className="hidden text-[11px] text-white/55 sm:block">
                {settings?.tagline ?? 'کیفیت، عملکرد، اطمینان'}
              </span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 xl:flex" aria-label="فهرست اصلی">
            <NavLink to="/" end className="nav-link text-[13px] text-white/85 hover:text-white">
              {({ isActive }) => <span data-active={isActive}>صفحه اصلی</span>}
            </NavLink>

            <Dropdown
              label="دسته‌بندی محصولات"
              open={dropdown === 'categories'}
              onOpen={() => openDropdown('categories')}
              onClose={scheduleClose}
            >
              <div className="grid w-[44rem] grid-cols-2 gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}`}
                    className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface"
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      className="size-11 rounded-full object-cover"
                    />
                    <span>
                      <span className="block text-sm font-semibold transition group-hover:text-racing">
                        {category.name}
                      </span>
                      <span className="block text-[11px] text-ink/50">{category.productCount} محصول</span>
                    </span>
                  </Link>
                ))}
                <Link
                  to="/shop"
                  className="col-span-2 mt-1 rounded-xl bg-carbon px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-graphite"
                >
                  مشاهده همه محصولات
                </Link>
              </div>
            </Dropdown>

            <Dropdown
              label="برندها"
              open={dropdown === 'brands'}
              onOpen={() => openDropdown('brands')}
              onClose={scheduleClose}
            >
              <div className="grid w-[30rem] grid-cols-2 gap-1">
                {brands.map((brand) => (
                  <Link
                    key={brand.slug}
                    to={`/shop?brand=${brand.slug}`}
                    className="rounded-xl px-3 py-2 text-sm transition hover:bg-surface hover:text-racing"
                  >
                    <span className="font-semibold">{brand.name}</span>
                    <span className="ms-2 text-[11px] text-ink/45">{brand.productCount}</span>
                  </Link>
                ))}
                <Link
                  to="/brands"
                  className="col-span-2 mt-1 rounded-xl bg-carbon px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-graphite"
                >
                  مشاهده همه برندها
                </Link>
              </div>
            </Dropdown>

            {SIMPLE_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className="nav-link text-[13px] text-white/85 hover:text-white">
                {({ isActive }) => <span data-active={isActive}>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label="جست‌وجو در محصولات"
              aria-expanded={searchOpen}
              className="rounded-full p-2.5 transition hover:bg-white/10"
            >
              <Search size={19} strokeWidth={1.8} />
            </button>

            <Link
              to={user ? '/account' : '/login'}
              aria-label="حساب کاربری"
              className="rounded-full p-2.5 transition hover:bg-white/10"
            >
              <User size={19} strokeWidth={1.8} />
            </Link>

            <Link
              to="/wishlist"
              aria-label="علاقه‌مندی‌ها"
              className="relative rounded-full p-2.5 transition hover:bg-white/10"
            >
              <Heart size={19} strokeWidth={1.8} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 end-0 min-w-4 rounded-full bg-racing px-1 text-center text-[10px] leading-4 text-white">
                  {wishlist.length.toLocaleString('fa-IR')}
                </span>
              )}
            </Link>

            <Link to="/cart" aria-label="سبد خرید" className="relative rounded-full p-2.5 transition hover:bg-white/10">
              <ShoppingBag size={19} strokeWidth={1.8} />
              <span className="absolute -top-0.5 end-0 min-w-4 rounded-full bg-racing px-1 text-center text-[10px] leading-4 text-white">
                {cartCount.toLocaleString('fa-IR')}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="باز کردن فهرست"
              className="rounded-full p-2.5 transition hover:bg-white/10 xl:hidden"
            >
              <Menu size={20} strokeWidth={1.9} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-white/10 bg-graphite">
            <form onSubmit={submitSearch} className="container-page flex items-center gap-2 py-3">
              <input
                ref={searchRef}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="نام محصول، برند یا شماره فنی قطعه…"
                aria-label="جست‌وجو"
                className="w-full rounded-lg border border-white/15 bg-carbon px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-racing focus:outline-none"
              />
              <button type="submit" className="btn btn-primary shrink-0 px-5 py-2.5">
                جست‌وجو
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile drawer — kept outside <header> so it fills the viewport. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="فهرست موبایل">
          <button
            type="button"
            aria-label="بستن فهرست"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 end-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-carbon text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="flex items-center gap-2">
                <Logo size={34} />
                <span className="text-base font-extrabold">{settings?.storeName ?? 'اتو درایو'}</span>
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="بستن"
                className="rounded-full p-2 transition hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitSearch} className="border-b border-white/10 px-5 py-4">
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="جست‌وجو در محصولات…"
                aria-label="جست‌وجو"
                className="w-full rounded-lg border border-white/15 bg-graphite px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-racing focus:outline-none"
              />
            </form>

            <nav className="flex flex-col px-2 py-3" aria-label="فهرست موبایل">
              {[{ label: 'صفحه اصلی', to: '/' }, ...SIMPLE_ITEMS.slice(0, 4)].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}

              <p className="px-4 pb-1 pt-4 text-[11px] font-bold tracking-widest text-white/40">
                دسته‌بندی محصولات
              </p>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
                >
                  <img src={category.image} alt="" loading="lazy" className="size-8 rounded-full object-cover" />
                  {category.name}
                </Link>
              ))}

              <p className="px-4 pb-1 pt-4 text-[11px] font-bold tracking-widest text-white/40">برندها</p>
              <Link to="/brands" className="rounded-lg px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10">
                مشاهده همه برندها
              </Link>

              {SIMPLE_ITEMS.slice(4).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white/10 p-5">
              <Link to="/cart" className="btn btn-primary">
                <ShoppingBag size={16} />
                سبد خرید
              </Link>
              <Link to={user ? '/account' : '/login'} className="btn btn-ghost-light">
                <User size={16} />
                {user ? 'حساب من' : 'ورود'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Menu-style dropdown for the desktop navigation. */
function Dropdown({ label, open, onOpen, onClose, children }) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className="nav-link flex items-center gap-1 text-[13px] text-white/85 hover:text-white"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => (open ? onClose() : onOpen())}
      >
        {label}
        <ChevronDown size={15} strokeWidth={1.9} className={open ? 'rotate-180 transition' : 'transition'} />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 pt-4">
          <div className="card p-3 text-ink shadow-[var(--shadow-soft)]">{children}</div>
        </div>
      )}
    </div>
  );
}
