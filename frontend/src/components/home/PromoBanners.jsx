import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/** Two side-by-side promotional banners driven by the promo_banners table. */
export default function PromoBanners() {
  const { banners } = useApp();
  if (!banners?.length) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container-page grid gap-5 lg:grid-cols-2">
        {banners.slice(0, 2).map((banner) => (
          <article
            key={banner.id}
            className="group relative isolate min-h-[16rem] overflow-hidden rounded-2xl bg-carbon text-white"
          >
            {banner.image && (
              <img
                src={banner.image}
                alt={banner.title}
                loading="lazy"
                className="absolute inset-0 -z-10 size-full object-cover opacity-50 transition duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-l from-carbon via-carbon/85 to-carbon/40" />

            <div className="flex h-full flex-col justify-center gap-3 p-7 sm:p-9">
              <span className="eyebrow text-racing">
                {banner.tone === 'red' ? 'پیشنهاد ویژه' : 'برندهای منتخب'}
              </span>
              <h3 className="max-w-sm text-xl font-extrabold leading-snug sm:text-2xl">{banner.title}</h3>
              {banner.subtitle && <p className="max-w-sm text-sm leading-7 text-white/70">{banner.subtitle}</p>}
              {banner.ctaLabel && (
                <Link
                  to={banner.ctaHref || '/shop'}
                  className={`mt-2 self-start ${banner.tone === 'red' ? 'btn btn-primary' : 'btn btn-ghost-light'}`}
                >
                  {banner.ctaLabel}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
