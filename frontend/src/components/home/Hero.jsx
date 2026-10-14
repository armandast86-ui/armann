import { useApp } from '../../context/AppContext';
import FitmentFinder from './FitmentFinder';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1900&q=80';

export default function Hero() {
  const { settings } = useApp();
  const image = settings?.heroImage || FALLBACK_IMAGE;

  return (
    <section className="relative isolate overflow-hidden bg-carbon text-white">
      <img
        src={image}
        alt="خودروی اسپرت تیره با نور استودیویی"
        className="absolute inset-0 -z-10 size-full object-cover object-center opacity-60"
        fetchPriority="high"
      />
      {/* Dark scrim keeps the Persian headline readable; darkest behind the text on the right. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-l from-carbon via-carbon/85 to-carbon/45" />
      <div className="absolute inset-0 -z-10 stripes-dark" />

      <div className="container-page py-14 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <span className="eyebrow text-racing">قطعات اصلی و اسپرت خودرو</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] sm:text-5xl lg:text-6xl">
            بهتر برانید.
            <br />
            <span className="text-racing">فراتر بروید.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-8 text-white/70 sm:text-base">
            قطعات باکیفیت خودرو برای انواع خودروهای داخلی و خارجی
          </p>
        </div>

        <FitmentFinder />
      </div>
    </section>
  );
}
