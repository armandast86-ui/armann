import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShoppingBag, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { NoteBanner } from '../components/ui/States';

function PageShell({ title, subtitle, children, breadcrumb }) {
  return (
    <div className="container-page py-10">
      <Breadcrumbs items={[{ label: breadcrumb ?? title }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-2xl font-extrabold text-burgundy sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-3 text-sm leading-8 text-ink/65">{subtitle}</p>}
      </header>
      <div className="mt-8 max-w-3xl space-y-6 text-sm leading-9 text-ink/80">{children}</div>
    </div>
  );
}

const NOT_SET = 'این اطلاعات هنوز در تنظیمات فروشگاه ثبت نشده است و باید توسط مدیر تکمیل شود.';

export function About() {
  return (
    <PageShell
      title="درباره آیدا بیوتی"
      subtitle="فروشگاهی آنلاین برای انتخاب ساده‌تر محصولات مراقبت از پوست، مو و زیبایی."
    >
      <p>
        آیدا بیوتی با این هدف ساخته شد که انتخاب محصولات مراقبتی برای مشتریان فارسی‌زبان ساده‌تر، شفاف‌تر و
        مطمئن‌تر شود. تمرکز ما روی محصولاتی است که ترکیبات روشن، کاربرد مشخص و قیمت منصفانه دارند تا بدون سردرگمی
        بتوانید روتین مناسب خودتان را بسازید.
      </p>
      <h2 className="pt-2 text-base font-bold text-ink">چه چیزی ما را متفاوت می‌کند؟</h2>
      <ul className="space-y-3 ps-4">
        <li className="flex gap-3">
          <Sparkles size={16} strokeWidth={1.6} className="mt-2 shrink-0 text-gold" />
          <span>
            <strong className="font-medium">توضیحات شفاف:</strong> در صفحه هر محصول، روش استفاده و ترکیبات تا حد
            امکان ثبت می‌شود تا بدانید چه چیزی می‌خرید.
          </span>
        </li>
        <li className="flex gap-3">
          <ShoppingBag size={16} strokeWidth={1.6} className="mt-2 shrink-0 text-rose" />
          <span>
            <strong className="font-medium">خرید بدون ابهام:</strong> قیمت، درصد تخفیف و وضعیت موجودی همیشه از
            اطلاعات واقعی فروشگاه خوانده می‌شود.
          </span>
        </li>
      </ul>
      <NoteBanner tone="demo">
        این نسخه از فروشگاه با محصولات نمایشی راه‌اندازی شده است تا همه بخش‌ها (جست‌وجو، سبد خرید، سفارش و پنل
        مدیریت) قابل بررسی باشند. برای عرضه واقعی، محصولات، قیمت‌ها و اطلاعات کسب‌وکار باید در پنل مدیریت ثبت شود.
      </NoteBanner>
    </PageShell>
  );
}

export function Contact() {
  const { settings } = useApp();
  const channels = [
    { icon: Phone, label: 'شماره تماس', value: settings?.phone, ltr: true },
    { icon: Mail, label: 'ایمیل', value: settings?.email, ltr: true },
    { icon: MapPin, label: 'نشانی', value: settings?.address, ltr: false },
  ];

  return (
    <PageShell
      title="تماس با ما"
      subtitle="اگر پرسشی درباره سفارش، محصول یا بازگشت کالا دارید، از راه‌های زیر با ما در تماس باشید."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {channels.map((channel) => (
          <div key={channel.label} className="card p-5">
            <channel.icon size={18} strokeWidth={1.6} className="text-rose-ink" />
            <h2 className="mt-3 text-xs font-medium text-ink/60">{channel.label}</h2>
            <p dir={channel.ltr ? 'ltr' : 'rtl'} className={`mt-1 text-sm ${channel.ltr ? 'text-end' : ''}`}>
              {channel.value || 'ثبت نشده'}
            </p>
          </div>
        ))}
      </div>

      {!(settings?.phone || settings?.email) && (
        <NoteBanner>
          {NOT_SET} فرم تماس آنلاین نیز در این نسخه فعال نیست؛ پس از تکمیل اطلاعات تماس، پیام‌ها از همین صفحه
          دریافت می‌شود.
        </NoteBanner>
      )}

      <h2 className="pt-2 text-base font-bold text-ink">پیش از تماس، این صفحه‌ها را ببینید</h2>
      <ul className="list-inside list-disc space-y-2">
        <li>
          <Link to="/faq" className="text-burgundy hover:underline">
            پرسش‌های متداول
          </Link>{' '}
          — پاسخ کوتاه به سؤال‌های رایج درباره ارسال، پرداخت و بازگشت کالا
        </li>
        <li>
          <Link to="/track-order" className="text-burgundy hover:underline">
            پیگیری سفارش
          </Link>{' '}
          — مشاهده وضعیت پرداخت و ارسال سفارش با شماره سفارش
        </li>
      </ul>
    </PageShell>
  );
}

const FAQ_ITEMS = [
  {
    question: 'هزینه ارسال چگونه محاسبه می‌شود؟',
    answer:
      'هزینه ارسال در صفحه سبد خرید و پیش از پرداخت نمایش داده می‌شود. برای سفارش‌های بالای حد تعیین‌شده در نوار بالای سایت، ارسال رایگان است.',
  },
  {
    question: 'چطور از اصالت محصول مطمئن شوم؟',
    answer:
      'ضمانت اصالت برای محصولاتی ارائه می‌شود که در صفحه محصول به‌عنوان دارای ضمانت اصالت معرفی شده‌اند. برای سایر محصولات، اطلاعات ترکیبات و منبع تأمین در توضیحات درج می‌شود.',
  },
  {
    question: 'پرداخت آنلاین چگونه انجام می‌شود؟',
    answer:
      'در این نسخه، درگاه پرداخت آنلاین متصل نشده است و سفارش با وضعیت «پرداخت نشده» ثبت می‌شود. پس از اتصال درگاه توسط مدیر فروشگاه، پرداخت آنلاین در همین مسیر فعال می‌شود.',
  },
  {
    question: 'امکان بازگشت کالا وجود دارد؟',
    answer:
      'شرایط دقیق بازگشت کالا باید توسط مدیر فروشگاه ثبت شود. تا آن زمان، برای هر درخواست بازگشت با پشتیبانی تماس بگیرید تا پرونده شما بررسی شود.',
  },
  {
    question: 'سفارشم را چطور پیگیری کنم؟',
    answer:
      'شماره سفارش و شماره تماس خود را در صفحه «پیگیری سفارش» وارد کنید؛ یا با ورود به حساب کاربری، وضعیت همه سفارش‌ها را ببینید.',
  },
];

export function Faq() {
  return (
    <PageShell title="پرسش‌های متداول" subtitle="پاسخ کوتاه به سؤال‌هایی که بیشتر از ما پرسیده می‌شود.">
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="card group p-5">
            <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span className="text-rose transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-8 text-ink/70">{item.answer}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}

export function Shipping() {
  return (
    <PageShell title="روش‌های ارسال" subtitle="نحوه آماده‌سازی و ارسال سفارش‌ها در آیدا بیوتی.">
      <p>
        سفارش‌ها پس از ثبت، در روزهای کاری آماده‌سازی و به شرکت پستی یا پیک تحویل داده می‌شوند. زمان دقیق تحویل
        به شهر مقصد و روش ارسال انتخابی بستگی دارد.
      </p>
      <h2 className="pt-2 text-base font-bold text-ink">هزینه و حد ارسال رایگان</h2>
      <p>
        هزینه ارسال و حد سفارش برای ارسال رایگان، از تنظیمات فروشگاه خوانده می‌شود و در صفحه سبد خرید به‌صورت
        شفاف نمایش داده می‌شود.
      </p>
      <NoteBanner>
        جدول دقیق زمان تحویل به تفکیک شهر و نام شرکت‌های حمل، هنوز در تنظیمات فروشگاه ثبت نشده است و باید توسط
        مدیر تکمیل شود.
      </NoteBanner>
    </PageShell>
  );
}

export function Returns() {
  return (
    <PageShell title="شرایط بازگشت کالا" subtitle="قواعد بازگشت و تعویض محصولات پیش از خرید را بخوانید.">
      <p>
        درخواست بازگشت کالا باید در بازه زمانی اعلام‌شده و با حفظ بسته‌بندی سالم محصول ثبت شود. محصولات بهداشتی
        باز‌شده، به‌دلیل مسائل سلامت، معمولاً قابل بازگشت نیستند.
      </p>
      <NoteBanner>
        بازه زمانی دقیق بازگشت، شرایط پذیرش کالای باز‌شده و فرآیند عودت وجه، هنوز توسط مدیر فروشگاه ثبت نشده
        است. تا زمان تکمیل این اطلاعات، برای هر درخواست با پشتیبانی تماس بگیرید.
      </NoteBanner>
    </PageShell>
  );
}

export function Terms() {
  return (
    <PageShell title="قوانین و مقررات" subtitle="شرایط استفاده از فروشگاه آیدا بیوتی.">
      <p>
        با استفاده از این فروشگاه، شما می‌پذیرید که اطلاعات وارد‌شده در فرم‌های خرید صحیح باشد و از محتوای سایت
        برای مقاصد غیرقانونی استفاده نکنید.
      </p>
      <ul className="list-inside list-disc space-y-2">
        <li>قیمت‌ها و موجودی محصولات از اطلاعات ثبت‌شده در فروشگاه خوانده می‌شود.</li>
        <li>در صورت اتمام موجودی پس از ثبت سفارش، تیم پشتیبانی برای هماهنگی با شما تماس می‌گیرد.</li>
        <li>مسئولیت صحت نشانی و شماره تماس وارد‌شده بر عهده خریدار است.</li>
      </ul>
      <NoteBanner>
        متن کامل حقوقی قوانین و مقررات (شامل شرایط لغو سفارش و مسئولیت‌ها) باید توسط مدیر فروشگاه ثبت و تأیید
        شود.
      </NoteBanner>
    </PageShell>
  );
}

export function Privacy() {
  return (
    <PageShell title="حریم خصوصی" subtitle="چگونه اطلاعات شما را نگهداری و استفاده می‌کنیم.">
      <p>
        اطلاعات حساب شما (نام، ایمیل، شماره تماس و نشانی‌ها) فقط برای پردازش سفارش‌ها، پیگیری ارسال و ارائه
        خدمات پشتیبانی استفاده می‌شود.
      </p>
      <ul className="list-inside list-disc space-y-2">
        <li>رمز عبور شما به‌صورت رمزنگاری‌شده ذخیره می‌شود و برای هیچ‌کس قابل مشاهده نیست.</li>
        <li>هر کاربر فقط به سفارش‌ها و اطلاعات حساب خود دسترسی دارد.</li>
        <li>دسترسی مدیران فروشگاه به سفارش‌ها برای پردازش و پشتیبانی ضروری است.</li>
      </ul>
      <NoteBanner>
        جزئیات کامل سیاست حریم خصوصی (مدت نگهداری داده و اشتراک‌گذاری با سرویس‌های بیرونی) باید توسط مدیر
        فروشگاه ثبت شود.
      </NoteBanner>
    </PageShell>
  );
}
