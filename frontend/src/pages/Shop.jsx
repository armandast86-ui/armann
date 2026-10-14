import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, RotateCcw, Search, X } from 'lucide-react';
import { api, queryString } from '../lib/api';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ui/ProductCard';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { EmptyState, ErrorState, NoteBanner, SkeletonGrid } from '../components/ui/States';
import { parseNumber } from '../lib/format';

const SORT_OPTIONS = [
  { value: 'default', label: 'پیشنهاد فروشگاه' },
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price-asc', label: 'ارزان‌ترین' },
  { value: 'price-desc', label: 'گران‌ترین' },
  { value: 'best-selling', label: 'پرفروش‌ترین' },
  { value: 'discount', label: 'بیشترین تخفیف' },
];

const PAGE_SIZE = 12;

export default function Shop() {
  const { slug } = useParams();
  const { categories, brands } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState({ status: 'loading', items: [], total: 0, pages: 1 });
  const [searchInput, setSearchInput] = useState(searchParams.get('query') ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number.parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const activeCategory = slug ?? searchParams.get('category') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const inStock = searchParams.get('inStock') === 'true';
  const onSale = searchParams.get('onSale') === 'true';
  const sort = searchParams.get('sort') ?? 'default';
  const query = searchParams.get('query') ?? '';

  const requestParams = useMemo(
    () => ({ query, category: activeCategory, brand, minPrice, maxPrice, inStock, onSale, sort, page, limit: PAGE_SIZE }),
    [query, activeCategory, brand, minPrice, maxPrice, inStock, onSale, sort, page],
  );
  const serialized = queryString(requestParams);

  useEffect(() => {
    let cancelled = false;
    setResult((current) => ({ ...current, status: 'loading' }));
    api
      .get(`/products${serialized}`)
      .then((data) => {
        if (cancelled) return;
        setResult({ status: 'ready', items: data.items ?? [], total: data.total ?? 0, pages: data.pages ?? 1 });
      })
      .catch((error) => {
        if (!cancelled) setResult({ status: 'error', items: [], total: 0, pages: 1, error: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [serialized]);

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined || value === false) next.delete(key);
        else next.set(key, String(value));
      });
      if (!('page' in changes)) next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = [brand, minPrice, maxPrice, inStock, onSale, query].filter(Boolean).length;
  const categoryInfo = categories.find((item) => item.slug === activeCategory);

  const filterPanel = (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update({ query: searchInput.trim() });
          setFiltersOpen(false);
        }}
        className="space-y-2"
      >
        <label htmlFor="filter-search" className="block text-xs font-medium text-ink/70">
          جست‌وجو در محصولات
        </label>
        <div className="flex gap-2">
          <input
            id="filter-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="نام محصول یا برند"
            className="field"
          />
          <button type="submit" aria-label="جست‌وجو" className="btn btn-primary px-3">
            <Search size={16} strokeWidth={1.8} />
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <label htmlFor="filter-category" className="block text-xs font-medium text-ink/70">
          دسته‌بندی
        </label>
        <select
          id="filter-category"
          value={activeCategory}
          onChange={(event) => {
            const value = event.target.value;
            const next = new URLSearchParams(searchParams);
            next.delete('category');
            next.delete('page');
            const search = next.toString();
            navigate(value ? `/category/${value}${search ? `?${search}` : ''}` : `/shop${search ? `?${search}` : ''}`, {
              replace: true,
            });
          }}
          className="field"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="filter-brand" className="block text-xs font-medium text-ink/70">
          برند
        </label>
        <select
          id="filter-brand"
          value={brand}
          onChange={(event) => update({ brand: event.target.value })}
          className="field"
        >
          <option value="">همه برندها</option>
          {brands.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-ink/70">محدوده قیمت (تومان)</legend>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => update({ minPrice: String(parseNumber(event.target.value) || '').replace('NaN', '') })}
            placeholder="از"
            aria-label="کمترین قیمت"
            className="field"
          />
          <input
            type="text"
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => update({ maxPrice: String(parseNumber(event.target.value) || '').replace('NaN', '') })}
            placeholder="تا"
            aria-label="بیشترین قیمت"
            className="field"
          />
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(event) => update({ inStock: event.target.checked })}
          className="size-4 accent-burgundy"
        />
        فقط محصولات موجود
      </label>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={onSale}
          onChange={(event) => update({ onSale: event.target.checked })}
          className="size-4 accent-burgundy"
        />
        فقط محصولات تخفیف‌دار
      </label>

      <button type="button" onClick={clearFilters} className="btn btn-outline w-full">
        <RotateCcw size={15} strokeWidth={1.8} />
        حذف همه فیلترها
      </button>
    </div>
  );

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: 'فروشگاه', to: '/shop' },
          ...(categoryInfo ? [{ label: categoryInfo.name }] : []),
        ]}
      />

      <header className="mb-6 mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-burgundy">
            {categoryInfo ? categoryInfo.name : 'فروشگاه آیدا بیوتی'}
          </h1>
          <p className="mt-2 text-sm leading-7 text-ink/60">
            {categoryInfo?.description ?? 'همه محصولات مراقبت از پوست، مو و آرایشی موجود در فروشگاه'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs text-ink/60">
            مرتب‌سازی
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => update({ sort: event.target.value })}
            className="field w-44 py-2 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="btn btn-outline px-4 py-2 lg:hidden"
            aria-expanded={filtersOpen}
          >
            <Filter size={15} strokeWidth={1.8} />
            فیلترها
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-burgundy px-1.5 text-[10px] text-white">
                {activeFilterCount.toLocaleString('fa-IR')}
              </span>
            )}
          </button>
        </div>
      </header>

      <NoteBanner tone="demo">
        محصولات این نسخه، داده نمایشی هستند و برای آزمون کامل مسیر خرید (جست‌وجو، سبد، سفارش و پنل مدیریت) ثبت
        شده‌اند. هیچ امتیاز یا نظری برای آن‌ها ساخته نشده است.
      </NoteBanner>

      <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-28 p-5">{filterPanel}</div>
        </aside>

        {filtersOpen && (
          <div className="card p-5 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">فیلترها</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="بستن فیلترها"
                className="rounded-full p-1.5 hover:bg-cream"
              >
                <X size={16} />
              </button>
            </div>
            {filterPanel}
          </div>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between text-xs text-ink/60">
            <span>{result.status === 'ready' ? `${result.total.toLocaleString('fa-IR')} محصول` : 'در حال جست‌وجو…'}</span>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="text-burgundy hover:underline">
                حذف فیلترها
              </button>
            )}
          </div>

          {result.status === 'loading' && <SkeletonGrid count={6} />}
          {result.status === 'error' && <ErrorState message={result.error} />}
          {result.status === 'ready' &&
            (result.items.length === 0 ? (
              <EmptyState
                title="محصولی با این مشخصات پیدا نشد"
                description="فیلترها را تغییر دهید یا همه فیلترها را حذف کنید تا همه محصولات فروشگاه را ببینید."
                action={
                  <button type="button" onClick={clearFilters} className="btn btn-outline mt-2">
                    حذف همه فیلترها
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
                  {result.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {result.pages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-2" aria-label="صفحه‌بندی">
                    <button
                      type="button"
                      onClick={() => update({ page: page - 1 })}
                      disabled={page <= 1}
                      className="btn btn-outline px-3 py-2"
                      aria-label="صفحه قبلی"
                    >
                      <ChevronRight size={16} strokeWidth={1.8} />
                    </button>
                    {Array.from({ length: result.pages }).map((_, index) => {
                      const pageNumber = index + 1;
                      if (result.pages > 7 && Math.abs(pageNumber - page) > 2) {
                        if (pageNumber === 1 || pageNumber === result.pages) {
                          return (
                            <span key={pageNumber} className="px-1 text-xs text-ink/40">
                              {pageNumber.toLocaleString('fa-IR')}
                            </span>
                          );
                        }
                        if (Math.abs(pageNumber - page) === 3) {
                          return (
                            <span key={pageNumber} className="px-1 text-xs text-ink/40">
                              …
                            </span>
                          );
                        }
                        return null;
                      }
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => update({ page: pageNumber })}
                          aria-current={pageNumber === page ? 'page' : undefined}
                          className={`size-9 rounded-full text-sm transition ${
                            pageNumber === page
                              ? 'bg-burgundy text-white'
                              : 'border border-line bg-white text-ink hover:border-burgundy'
                          }`}
                        >
                          {pageNumber.toLocaleString('fa-IR')}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => update({ page: page + 1 })}
                      disabled={page >= result.pages}
                      className="btn btn-outline px-3 py-2"
                      aria-label="صفحه بعدی"
                    >
                      <ChevronLeft size={16} strokeWidth={1.8} />
                    </button>
                  </nav>
                )}
              </>
            ))}
        </section>
      </div>

      <p className="mt-10 text-center text-xs text-ink/50">
        محصولات بیشتری می‌خواهید؟{' '}
        <Link to="/category/skincare" className="text-burgundy hover:underline">
          فروشگاه را بر اساس دسته‌بندی مرور کنید
        </Link>
      </p>
    </div>
  );
}
