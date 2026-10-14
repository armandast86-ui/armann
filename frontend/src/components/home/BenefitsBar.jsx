import { Headphones, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';

const BENEFITS = [
  {
    icon: Truck,
    title: 'ارسال سریع',
    description: 'ارسال سفارش‌ها در کوتاه‌ترین زمان ممکن',
  },
  {
    icon: BadgeCheck,
    title: 'ضمانت اصالت کالا',
    description: 'برای محصولات دارای ضمانت اصالت',
  },
  {
    icon: ShieldCheck,
    title: 'پرداخت امن',
    description: 'پرداخت از طریق روش‌های معتبر و امن',
  },
  {
    icon: Headphones,
    title: 'پشتیبانی مشتریان',
    description: 'همراه شما در مسیر خرید',
  },
];

export default function BenefitsBar() {
  return (
    <section aria-label="مزایای خرید" className="border-b border-line bg-white">
      <div className="container-page grid grid-cols-2 gap-4 py-8 lg:grid-cols-4 lg:gap-6">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex items-start gap-3">
            <span className="rounded-full bg-cream p-2.5 text-rose-ink">
              <benefit.icon size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="text-[13px] font-bold text-ink sm:text-sm">{benefit.title}</h3>
              <p className="mt-1 text-[11px] leading-6 text-ink/60 sm:text-xs">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
