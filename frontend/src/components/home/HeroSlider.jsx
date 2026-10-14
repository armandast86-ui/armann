import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const wide = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1300&q=80`;

const SLIDES = [
  {
    label: 'تازه‌های زیبایی',
    title: 'درخشش پوست، اعتماد به نفس واقعی',
    description: 'محصولات مراقبتی منتخب برای زیبایی طبیعی و روزمره شما',
    cta: { label: 'مشاهده محصولات', to: '/category/skincare' },
    image: wide('1556228720-195a672e8a03'),
    imageAlt: 'ست محصولات مراقبت از پوست روی پایه سنگی',
  },
  {
    label: 'مجموعه آرایش',
    title: 'آرایشی سبک، ماندگاری تمام روز',
    description: 'رژ لب، کرم پودر و محصولات آرایشی برای جلوه‌ای طبیعی و ماندگار',
    cta: { label: 'مشاهده محصولات آرایشی', to: '/category/makeup' },
    image: wide('1522335789203-aabd1fc54bc9'),
    imageAlt: 'محصولات آرایشی صورت روی سطح روشن',
  },
  {
    label: 'مراقبت مو و بدن',
    title: 'نرمی و درخشش، از مو تا پوست',
    description: 'شامپو، ماسک مو و لوسیون‌های بدن با ترکیبات ملایم و مؤثر',
    cta: { label: 'مشاهده محصولات مراقبت مو', to: '/category/haircare' },
    image: wide('1586495777744-4413f21062fa'),
    imageAlt: 'محصولات مراقبت از مو و بدن',
  },
];

const AUTOPLAY_MS = 6500;
const RESUME_AFTER_INTERACTION_MS = 12000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef(null);

  const goTo = useCallback((nextIndex, { manual = false } = {}) => {
    setIndex((nextIndex + SLIDES.length) % SLIDES.length);
    if (manual) {
      // Pause automatic rotation for a while after the visitor takes control.
      setPaused(true);
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_AFTER_INTERACTION_MS);
    }
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  return (
    <section
      aria-label="معرفی مجموعه‌های آیدا بیوتی"
      className="relative overflow-hidden bg-cream"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div key={slide.title} className="w-full shrink-0">
            <div className="container-page grid items-center gap-8 py-10 md:grid-cols-2 md:py-14 lg:gap-14">
              {/* Text panel — first in the RTL flow, so it sits on the right */}
              <div className="order-2 text-center md:order-1 md:text-start">
                <span className="inline-block rounded-full bg-white px-4 py-1.5 text-[11px] font-medium tracking-wide text-rose-ink">
                  {slide.label}
                </span>
                <h1 className="mt-5 text-3xl font-extrabold leading-tight text-burgundy sm:text-4xl lg:text-5xl">
                  {slide.title}
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-ink/70 md:mx-0 md:text-base">
                  {slide.description}
                </p>
                <Link to={slide.cta.to} className="btn btn-primary mt-7 px-7 py-3">
                  {slide.cta.label}
                  <ArrowLeft size={16} strokeWidth={1.9} />
                </Link>
              </div>

              {/* Product photography */}
              <div className="order-1 md:order-2">
                <div className="relative mx-auto max-w-lg overflow-hidden rounded-[2rem] border border-line bg-white md:max-w-none">
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    loading="eager"
                    className="aspect-[4/3] w-full object-cover md:aspect-[5/4]"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="container-page flex items-center justify-between pb-6">
        <div className="flex items-center gap-2" role="tablist" aria-label="انتخاب اسلاید">
          {SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`اسلاید ${slide.label}`}
              onClick={() => goTo(slideIndex, { manual: true })}
              className={`h-1.5 rounded-full transition-all ${
                slideIndex === index ? 'w-8 bg-burgundy' : 'w-3 bg-burgundy/25'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(index + 1, { manual: true })}
            aria-label="اسلاید بعدی"
            className="rounded-full border border-line bg-white p-2.5 text-ink transition hover:border-burgundy hover:text-burgundy"
          >
            <ChevronLeft size={17} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => goTo(index - 1, { manual: true })}
            aria-label="اسلاید قبلی"
            className="rounded-full border border-line bg-white p-2.5 text-ink transition hover:border-burgundy hover:text-burgundy"
          >
            <ChevronRight size={17} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </section>
  );
}
