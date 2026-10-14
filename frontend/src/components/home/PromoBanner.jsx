import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';

const panelImage = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1100&q=80';

/**
 * The headline percentage is read from the products that are actually on sale,
 * so the banner never promises a discount the catalogue does not have.
 */
export default function PromoBanner() {
  const [topDiscount, setTopDiscount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products?onSale=true&sort=discount&limit=1')
      .then((data) => {
        if (cancelled) return;
        setTopDiscount(data?.items?.[0]?.discountPercent ?? 0);
      })
      .catch(() => {
        if (!cancelled) setTopDiscount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!topDiscount) return null;

  return (
    <section className="py-6 lg:py-10">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-[1.75rem] md:grid-cols-2">
          <div className="order-2 bg-rose px-8 py-12 text-white md:order-1 lg:px-14 lg:py-16">
            <span className="text-xs font-medium tracking-wide text-white/85">پیشنهاد محدود</span>
            <h2 className="mt-4 text-2xl font-extrabold leading-snug sm:text-3xl">
              تا ٪{topDiscount.toLocaleString('fa-IR')} تخفیف روی محصولات منتخب
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/85">زیبایی بیشتر، با هزینه کمتر</p>
            <Link
              to="/shop?onSale=true"
              className="btn mt-8 bg-white px-7 py-3 text-burgundy transition hover:opacity-90"
            >
              مشاهده تخفیف‌ها
              <ArrowLeft size={16} strokeWidth={1.9} />
            </Link>
            <p className="mt-5 text-[11px] leading-6 text-white/70">
              درصد تخفیف بر پایه اختلاف قیمت اصلی و قیمت فروش محصولات تخفیف‌دار محاسبه می‌شود.
            </p>
          </div>

          <div className="order-1 md:order-2">
            <img
              src={panelImage}
              alt="محصولات مراقبت از پوست با تخفیف ویژه"
              loading="lazy"
              className="size-full min-h-56 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
