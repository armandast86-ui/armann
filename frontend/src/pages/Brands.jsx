import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { EmptyState, Loading } from '../components/ui/States';

export default function Brands() {
  const { brands } = useApp();

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'برندها' }]} />

      <header className="mb-8 mt-5">
        <span className="eyebrow">برندهای معتبر</span>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">برندهای فروشگاه</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/55">
          قطعات خودرو از برندهای شناخته‌شده جهانی؛ از سیستم ترمز و تعلیق تا روشنایی و قطعات موتور.
        </p>
      </header>

      {!brands.length ? (
        <Loading label="در حال بارگذاری برندها…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              to={`/shop?brand=${brand.slug}`}
              className="card group flex flex-col gap-3 p-6 transition hover:border-racing/40 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-extrabold" dir="ltr">
                  {brand.name}
                </span>
                {brand.country && (
                  <span className="rounded-md bg-surface px-2.5 py-1 text-[11px] text-ink/60">{brand.country}</span>
                )}
              </div>
              {brand.description && <p className="text-xs leading-6 text-ink/55">{brand.description}</p>}
              <span className="mt-auto text-xs font-semibold text-racing transition group-hover:text-racing-deep">
                {brand.productCount.toLocaleString('fa-IR')} محصول در این برند
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
