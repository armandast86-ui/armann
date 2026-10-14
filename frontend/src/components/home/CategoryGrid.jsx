import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/** Eight circular category tiles on a light background. */
export default function CategoryGrid() {
  const { categories } = useApp();
  if (!categories.length) return null;

  return (
    <section className="bg-surface py-12 lg:py-16">
      <div className="container-page">
        <div className="mb-8 text-center">
          <span className="eyebrow justify-center">دسته‌بندی‌ها</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">خرید بر اساس دسته‌بندی</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="group flex flex-col items-center text-center"
            >
              <span className="relative block size-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_10px_25px_-18px_rgba(8,9,11,0.7)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_30px_-16px_rgba(227,27,45,0.6)] sm:size-28">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="size-full object-cover transition duration-500 group-hover:scale-110"
                  />
                ) : (
                  <span className="grid size-full place-items-center bg-carbon text-xs text-white/60">
                    {category.name}
                  </span>
                )}
              </span>
              <span className="mt-3 text-sm font-bold transition group-hover:text-racing">{category.name}</span>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-ink/45">
                مشاهده محصولات
                <ArrowLeft size={11} strokeWidth={2} className="transition group-hover:-translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
