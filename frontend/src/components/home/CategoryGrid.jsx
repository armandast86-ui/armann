import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import SectionHeading from '../ui/SectionHeading';

export default function CategoryGrid() {
  const { categories } = useApp();
  if (!categories.length) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="container-page">
        <SectionHeading
          align="center"
          title="دسته‌بندی محصولات"
          subtitle="محصول مورد علاقه‌ات را پیدا کن"
        />

        <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-full border border-line bg-white p-1.5 transition-transform duration-300 group-hover:-translate-y-1">
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="size-full rounded-full object-cover transition-transform duration-500 group-hover:scale-95"
                  />
                )}
              </div>
              <span className="text-xs font-medium transition group-hover:text-burgundy sm:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
