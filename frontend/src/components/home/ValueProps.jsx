import { Award, Gauge, Headphones, Ruler } from 'lucide-react';

const ITEMS = [
  { icon: Ruler, title: 'تضمین سازگاری قطعات با خودرو', text: 'قطعه مناسب خودروی شما' },
  { icon: Gauge, title: 'تنوع گسترده محصولات', text: 'از قطعات اصلی تا اسپرت' },
  { icon: Headphones, title: 'پشتیبانی تخصصی خرید', text: 'راهنمایی کارشناسان فنی' },
  { icon: Award, title: 'امتیاز و پاداش مشتریان', text: 'خرید به‌صرفه در هر سفارش' },
];

/** Light benefits row with black line icons and subtle separators. */
export default function ValueProps() {
  return (
    <section className="border-y border-line bg-white py-10">
      <div className="container-page grid grid-cols-2 gap-y-8 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, text }, index) => (
          <div
            key={title}
            className={`flex items-start gap-3 px-2 ${
              index < ITEMS.length - 1 ? 'lg:border-e lg:border-line' : ''
            }`}
          >
            <Icon size={26} strokeWidth={1.5} className="shrink-0 text-carbon" />
            <div>
              <p className="text-sm font-bold leading-6">{title}</p>
              <p className="mt-0.5 text-xs text-ink/50">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
