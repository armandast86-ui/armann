import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Logo from '../ui/Logo';
import NewsletterForm, { socialIcons } from '../NewsletterForm';

const SERVICE_LINKS = [
  { label: 'راهنمای خرید', to: '/buying-guide' },
  { label: 'پیگیری سفارش', to: '/track-order' },
  { label: 'شرایط ارسال', to: '/shipping' },
  { label: 'قوانین بازگشت کالا', to: '/returns' },
  { label: 'سوالات متداول', to: '/faq' },
  { label: 'تماس با پشتیبانی', to: '/contact' },
];

const COMPANY_LINKS = [
  { label: 'درباره ما', to: '/about' },
  { label: 'مجله خودرو', to: '/journal' },
  { label: 'فرصت‌های همکاری', to: '/careers' },
  { label: 'حریم خصوصی', to: '/privacy' },
  { label: 'قوانین و مقررات', to: '/terms' },
];

const PAYMENTS = ['VISA', 'Mastercard', 'AMEX', 'PayPal'];

export default function Footer() {
  const { settings, categories } = useApp();

  return (
    <footer className="border-t border-white/10 bg-carbon text-white/75">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-3">
          <Link to="/" className="flex items-center gap-2.5 text-white" aria-label={settings?.storeName ?? 'اتو درایو'}>
            <Logo size={40} />
            <span className="text-lg font-extrabold">{settings?.storeName ?? 'اتو درایو'}</span>
          </Link>
          <p className="mt-4 text-sm leading-7 text-white/60">
            اتو درایو؛ همراه شما برای خرید مطمئن قطعات خودرو. کیفیت بالا، تنوع محصولات و تجربه خرید آسان را در کنار هم
            تجربه کنید.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-white/60">
            {settings?.phone && (
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-racing" />
                <span dir="ltr" className="tracking-wide">{settings.phone}</span>
              </li>
            )}
            {settings?.email && (
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-racing" />
                <span dir="ltr">{settings.email}</span>
              </li>
            )}
            {settings?.address && (
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-1 shrink-0 text-racing" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>

          <div className="mt-5 flex items-center gap-2">
            {(settings?.socials ?? []).map((social) => {
              const Icon = socialIcons[social.name] ?? socialIcons['اینستاگرام'];
              return (
                <a
                  key={social.name}
                  href={social.url || '#'}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.name}
                  className="grid size-9 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-racing hover:bg-racing hover:text-white"
                >
                  <Icon size={16} strokeWidth={1.7} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Columns */}
        <nav className="lg:col-span-3" aria-label="دسته‌بندی محصولات">
          <h3 className="mb-4 text-sm font-bold text-white">دسته‌بندی محصولات</h3>
          <ul className="space-y-2.5 text-sm">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link to={`/category/${category.slug}`} className="transition hover:text-racing">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="lg:col-span-2" aria-label="خدمات مشتریان">
          <h3 className="mb-4 text-sm font-bold text-white">خدمات مشتریان</h3>
          <ul className="space-y-2.5 text-sm">
            {SERVICE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition hover:text-racing">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="lg:col-span-2" aria-label="درباره فروشگاه">
          <h3 className="mb-4 text-sm font-bold text-white">درباره فروشگاه</h3>
          <ul className="space-y-2.5 text-sm">
            {COMPANY_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition hover:text-racing">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter */}
        <div className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-white">عضویت در خبرنامه</h3>
          <p className="mb-3 text-xs leading-6 text-white/60">
            از جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه باخبر شوید.
          </p>
          <NewsletterForm tone="dark" />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-5 text-xs sm:flex-row">
          <p className="text-white/55">
            © {new Date().getFullYear()} {settings?.storeName ?? 'اتو درایو'} — تمام حقوق محفوظ است.
          </p>
          <ul className="flex items-center gap-2">
            {PAYMENTS.map((payment) => (
              <li
                key={payment}
                dir="ltr"
                className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/70"
              >
                {payment}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
