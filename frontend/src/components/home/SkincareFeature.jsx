import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const ROUTINE_STEPS = [
  'شست‌وشوی ملایم صبح و شب بدون خشک‌کردن پوست',
  'استفاده از سرم آبرسان روی پوست نیمه‌مرطوب',
  'قفل‌کردن رطوبت با مرطوب‌کننده و محافظت روزانه با ضد آفتاب',
];

export default function SkincareFeature() {
  return (
    <section className="py-10 lg:py-14">
      <div className="container-page">
        <div className="grid items-center gap-8 overflow-hidden rounded-[1.75rem] border border-line bg-white lg:grid-cols-2 lg:gap-0">
          <img
            src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80"
            alt="ست مراقبت از پوست شامل پاک‌کننده، سرم و مرطوب‌کننده"
            loading="lazy"
            className="h-64 w-full object-cover lg:h-full"
          />

          <div className="px-8 py-10 lg:px-14 lg:py-16">
            <span className="text-xs font-medium tracking-wide text-rose-ink">روتین پیشنهادی</span>
            <h2 className="mt-3 text-2xl font-extrabold leading-snug text-burgundy sm:text-3xl">
              یک روتین ساده برای پوستی شاداب‌تر
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/65">
              نیازی به محصولات زیاد نیست؛ سه گام درست، نتیجه‌ای پایدار می‌سازد.
            </p>
            <ul className="mt-6 space-y-3">
              {ROUTINE_STEPS.map((step) => (
                <li key={step} className="flex items-start gap-3 text-sm leading-7 text-ink/80">
                  <span className="mt-0.5 rounded-full bg-cream p-1 text-rose-ink">
                    <Check size={14} strokeWidth={2} />
                  </span>
                  {step}
                </li>
              ))}
            </ul>
            <Link to="/category/skincare" className="btn btn-outline mt-8 px-7 py-3">
              کشف محصولات مراقبت پوست
              <ArrowLeft size={16} strokeWidth={1.9} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
