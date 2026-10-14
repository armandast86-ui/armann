import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { label: 'صفحه اصلی', to: '/' },
  { label: 'فروشگاه', to: '/shop' },
  { label: 'محصولات جدید', to: '/shop?sort=newest' },
  { label: 'پرفروش‌ترین‌ها', to: '/shop?sort=best-selling' },
  { label: 'تخفیف‌ها', to: '/shop?onSale=true' },
  { label: 'مجله زیبایی', to: '/journal' },
  { label: 'درباره ما', to: '/about' },
  { label: 'تماس با ما', to: '/contact' },
];

export default function Header() {
  const { settings, categories, cartCount, wishlist, user } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setCategoryOpen(false);
    setMobileCategoriesOpen(false);
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
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex items-center justify-between gap-4 py-3">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-tight text-burgundy sm:text-xl">
            {settings?.storeName ?? 'آیدا بیوتی'}
          </span>
          <span className="hidden text-[11px] text-rose-ink sm:block">
            {settings?.tagline ?? 'زیبایی، مراقبت و اعتماد به نفس'}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-5 lg:flex" aria-label="فهرست اصلی">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link text-sm text-ink/90">
              {({ isActive }) => <span data-active={isActive}>{item.label}</span>}
            </NavLink>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setCategoryOpen(true)}
            onMouseLeave={() => setCategoryOpen(false)}
          >
            <button
              type="button"
              className="nav-link flex items-center gap-1 text-sm text-ink/90"
              aria-expanded={categoryOpen}
              aria-haspopup="true"
              onClick={() => setCategoryOpen((open) => !open)}
            >
              دسته‌بندی محصولات
              <ChevronDown size={15} strokeWidth={1.7} />
            </button>

            {categoryOpen && (
              <div className="absolute end-0 top-full z-50 w-[42rem] pt-3">
                <div className="card grid grid-cols-3 gap-2 p-4 shadow-[var(--shadow-soft)]">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      to={`/category/${category.slug}`}
                      className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-cream"
                    >
                      <img
                        src={category.image}
                        alt={category.name}
                        loading="lazy"
                        className="size-12 rounded-full object-cover"
                      />
                      <span>
                        <span className="block text-sm font-medium transition group-hover:text-burgundy">
                          {category.name}
                        </span>
                        <span className="block text-[11px] text-ink/55">
                          {category.productCount} محصول
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {NAV_ITEMS.slice(2).map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-link text-sm text-ink/90">
              {({ isActive }) => <span data-active={isActive}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label="جست‌وجو در محصولات"
            className="rounded-full p-2.5 text-ink transition hover:bg-cream"
          >
            <Search size={19} strokeWidth={1.7} />
          </button>

          <Link
            to={user ? '/account' : '/login'}
            aria-label="حساب کاربری"
            className="rounded-full p-2.5 text-ink transition hover:bg-cream"
          >
            <User size={19} strokeWidth={1.7} />
          </Link>

          <Link
            to="/wishlist"
            aria-label="علاقه‌مندی‌ها"
            className="relative rounded-full p-2.5 text-ink transition hover:bg-cream"
          >
            <Heart size={19} strokeWidth={1.7} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 end-0 min-w-4 rounded-full bg-rose px-1 text-[10px] leading-4 text-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label="سبد خرید"
            className="relative rounded-full p-2.5 text-ink transition hover:bg-cream"
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            <span className="absolute -top-0.5 end-0 min-w-4 rounded-full bg-burgundy px-1 text-center text-[10px] leading-4 text-white">
              {cartCount}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="فهرست موبایل"
            className="rounded-full p-2.5 text-ink transition hover:bg-cream lg:hidden"
          >
            <Menu size={20} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line bg-white">
          <form onSubmit={submitSearch} className="container-page flex items-center gap-3 py-3">
            <Search size={18} className="text-ink/50" strokeWidth={1.7} />
            <input
              ref={searchRef}
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="نام محصول یا برند را جست‌وجو کنید…"
              aria-label="جست‌وجوی محصول"
              className="field border-0 bg-transparent px-0 focus:ring-0"
            />
            <button type="submit" className="btn btn-primary px-5 py-2">
              جست‌وجو
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="بستن جست‌وجو"
              className="rounded-full p-2 text-ink/60 hover:bg-cream"
            >
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      </header>

      {/* Mobile drawer — slides in from the right, matching the reading direction.
          It is rendered outside <header> on purpose: the header's `backdrop-blur`
          makes it the containing block for fixed descendants, which would pin this
          full-screen overlay to the header box instead of the viewport. */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-ink/40 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* In RTL the inline start edge is the right side, so the drawer slides in
            from the right and parks off-screen to the right when closed. */}
        <aside
          className={`absolute inset-y-0 start-0 flex w-[19rem] max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-bold text-burgundy">{settings?.storeName ?? 'آیدا بیوتی'}</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="بستن فهرست"
              className="rounded-full p-2 hover:bg-cream"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3" aria-label="فهرست موبایل">
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-cream"
              aria-expanded={mobileCategoriesOpen}
            >
              دسته‌بندی محصولات
              <ChevronDown
                size={16}
                className={`transition ${mobileCategoriesOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {mobileCategoriesOpen && (
              <div className="mt-1 space-y-1 ps-3">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-cream"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded-xl px-3 py-2.5 text-sm hover:bg-cream"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/track-order" className="block rounded-xl px-3 py-2.5 text-sm hover:bg-cream">
              پیگیری سفارش
            </Link>
          </nav>

          <div className="border-t border-line p-4">
            <Link to={user ? '/account' : '/login'} className="btn btn-outline w-full">
              {user ? 'حساب کاربری من' : 'ورود / ثبت‌نام'}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
