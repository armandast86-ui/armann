import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import NewsletterForm, { socialIcons } from '../NewsletterForm';

const QUICK_LINKS = [
  { label: 'صفحه اصلی', to: '/' },
  { label: 'فروشگاه', to: '/shop' },
  { label: 'دسته‌بندی محصولات', to: '/shop' },
  { label: 'محصولات جدید', to: '/shop?sort=newest' },
  { label: 'تخفیف‌ها', to: '/shop?onSale=true' },
  { label: 'درباره ما', to: '/about' },
];

const CUSTOMER_CARE = [
  { label: 'پیگیری سفارش', to: '/track-order' },
  { label: 'راهنمای خرید', to: '/faq' },
  { label: 'روش‌های ارسال', to: '/shipping' },
  { label: 'قوانین و مقررات', to: '/terms' },
  { label: 'شرایط بازگشت کالا', to: '/returns' },
  { label: 'پرسش‌های متداول', to: '/faq' },
  { label: 'حریم خصوصی', to: '/privacy' },
];

/** Placeholder shown until the store owner fills the real business details in settings. */
const NOT_SET = 'در حال تکمیل در تنظیمات فروشگاه';

export default function Footer() {
  const { settings } = useApp();
  const socials = settings?.socials ?? [];

  return (
    <footer className="relative mt-24 overflow-hidden bg-burgundy text-white">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 end-4 select-none text-[5rem] font-extrabold leading-none text-white/5 sm:text-[8rem]"
      >
        {settings?.storeName ?? 'آیدا بیوتی'}
      </span>

      <div className="container-page relative grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="text-xl font-extrabold">{settings?.storeName ?? 'آیدا بیوتی'}</h3>
          <p className="mt-3 text-sm leading-7 text-white/70">
            انتخابی زیبا برای مراقبت روزانه از پوست، مو و زیبایی شما.
          </p>
          <ul className="mt-5 space-y-2 text-xs text-white/70">
            <li className="flex items-center gap-2">
              <Phone size={14} strokeWidth={1.6} />
              <span dir={settings?.phone ? 'ltr' : 'rtl'}>{settings?.phone || NOT_SET}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} strokeWidth={1.6} />
              <span dir={settings?.email ? 'ltr' : 'rtl'}>{settings?.email || NOT_SET}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={14} strokeWidth={1.6} className="mt-1 shrink-0" />
              <span>{settings?.address || NOT_SET}</span>
            </li>
          </ul>
          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-3">
              {socials.map((social) => {
                const Icon = socialIcons[social.name] ?? MessageCircle;
                return (
                  <a
                    key={social.name}
                    href={social.url || '#'}
                    target={social.url?.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    aria-label={social.name}
                    className="rounded-full border border-white/25 p-2 text-white/80 transition hover:border-gold hover:text-gold"
                  >
                    <Icon size={16} strokeWidth={1.6} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <nav aria-label="دسترسی سریع">
          <h4 className="text-sm font-bold text-blush">دسترسی سریع</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            {QUICK_LINKS.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="transition hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="خدمات مشتریان">
          <h4 className="text-sm font-bold text-blush">خدمات مشتریان</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            {CUSTOMER_CARE.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="transition hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h4 className="text-sm font-bold text-blush">عضویت در خبرنامه</h4>
          <p className="mt-4 text-sm leading-7 text-white/70">
            از محصولات جدید و پیشنهادهای ویژه باخبر شو.
          </p>
          <div className="mt-4">
            <NewsletterForm tone="dark" />
          </div>
          <p className="mt-4 text-[11px] leading-6 text-white/50">
            پرداخت این نسخه به‌صورت نمایشی است؛ درگاه پرداخت واقعی هنوز متصل نشده است.
          </p>
        </div>
      </div>

      <div className="relative border-t border-white/15">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/60 sm:flex-row">
          <p>تمامی حقوق این وب‌سایت محفوظ است.</p>
          <p>© {new Date().getFullYear()} {settings?.storeName ?? 'آیدا بیوتی'}</p>
        </div>
      </div>
    </footer>
  );
}
