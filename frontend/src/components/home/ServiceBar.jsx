import { BadgeCheck, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';

const ITEMS = [
  { icon: BadgeCheck, title: 'کیفیت تضمین‌شده', text: 'قطعات باکیفیت و معتبر' },
  { icon: Truck, title: 'ارسال سریع', text: 'ارسال سفارش در کوتاه‌ترین زمان' },
  { icon: ShieldCheck, title: 'پرداخت امن', text: 'خرید مطمئن و ایمن' },
  { icon: RefreshCcw, title: 'ضمانت بازگشت', text: 'امکان بازگشت طبق شرایط فروشگاه' },
];

/** Dark service strip directly below the hero. */
export default function ServiceBar() {
  return (
    <section className="border-y border-white/10 bg-graphite text-white">
      <div className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-7 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/5 text-racing">
              <Icon size={20} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-[11px] leading-5 text-white/55 sm:text-xs">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
