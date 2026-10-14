import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import Breadcrumbs from '../components/ui/Breadcrumbs';

/** Shared shell for the static / informational pages. */
function PageShell({ title, subtitle, children }) {
  return (
    <div className="container-page py-10">
      <Breadcrumbs items={[{ label: title }]} />
      <header className="mb-8 mt-5 max-w-3xl">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-3 text-sm leading-7 text-ink/60">{subtitle}</p>}
      </header>
      <div className="max-w-3xl space-y-5 text-sm leading-8 text-ink/75">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-racing" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function About() {
  return (
    <PageShell
      title="درباره اتو درایو"
      subtitle="فروشگاهی آنلاین برای تأمین قطعات خودرو با کیفیت تضمین‌شده و راهنمایی تخصصی."
    >
      <p>
        اتو درایو با هدف ساده‌تر کردن خرید قطعات خودرو برای رانندگان فارسی‌زبان ساخته شده است. تمرکز ما بر سه چیز است:
        قطعه اصل، قیمت شفاف و راهنمایی درست پیش از خرید.
      </p>
      <p>
        در اتو درایو می‌توانید بر اساس خودروی خود (برند، مدل و سال ساخت) قطعه مناسب را پیدا کنید، مشخصات فنی را
        مقایسه کنید و با اطمینان خرید کنید. تیم پشتیبانی فنی ما در انتخاب قطعه درست در کنار شماست.
      </p>
      <h2 className="pt-2 text-base font-extrabold text-ink">اتو درایو چه چیزی ارائه می‌دهد؟</h2>
      <BulletList
        items={[
          'قطعات اصلی و اسپرت از برندهای معتبر جهانی',
          'فیلتر بر اساس سازگاری قطعه با خودروی شما',
          'مشخصات فنی و شماره فنی دقیق برای هر قطعه',
          'ارسال سریع و امکان بازگشت کالا طبق شرایط فروشگاه',
        ]}
      />
      <p className="text-xs text-ink/50">
        اطلاعات محصولات این نسخه، داده نمایشی است و پیش از انتشار فروشگاه جایگزین می‌شود.
      </p>
    </PageShell>
  );
}

export function Contact() {
  const { settings, notify } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const result = await api.post('/contact', form);
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      notify(result?.message ?? 'پیام شما ثبت شد.');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div className="container-page py-10">
      <Breadcrumbs items={[{ label: 'تماس با ما' }]} />
      <header className="mb-8 mt-5 max-w-3xl">
        <h1 className="text-2xl font-extrabold sm:text-3xl">تماس با ما</h1>
        <p className="mt-3 text-sm leading-7 text-ink/60">
          سؤالی درباره سازگاری قطعه با خودرو یا وضعیت سفارش دارید؟ برای ما پیام بگذارید؛ کارشناسان ما پاسخ می‌دهند.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی">
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="field"
              />
            </Field>
            <Field label="ایمیل">
              <input
                required
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="field"
              />
            </Field>
            <Field label="شماره تماس (اختیاری)">
              <input
                dir="ltr"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="field"
              />
            </Field>
            <Field label="موضوع">
              <input
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                className="field"
              />
            </Field>
          </div>

          <Field label="متن پیام">
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="field"
              placeholder="پیام خود را بنویسید…"
            />
          </Field>

          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
          {status === 'success' && (
            <p role="status" className="text-xs text-emerald-700">
              پیام شما ثبت شد؛ به‌زودی پاسخ می‌دهیم.
            </p>
          )}

          <button type="submit" disabled={status === 'loading'} className="btn btn-primary">
            <Send size={16} strokeWidth={2} />
            {status === 'loading' ? 'در حال ارسال…' : 'ارسال پیام'}
          </button>
        </form>

        <aside className="card h-fit space-y-4 p-6 text-sm">
          <h2 className="text-base font-extrabold">راه‌های ارتباطی</h2>
          {settings?.phone && (
            <p className="flex items-center gap-2 text-ink/70">
              <Phone size={16} className="text-racing" />
              <span dir="ltr">{settings.phone}</span>
            </p>
          )}
          {settings?.email && (
            <p className="flex items-center gap-2 text-ink/70">
              <Mail size={16} className="text-racing" />
              <span dir="ltr">{settings.email}</span>
            </p>
          )}
          {settings?.address && (
            <p className="flex items-start gap-2 text-ink/70">
              <MapPin size={16} className="mt-1 shrink-0 text-racing" />
              {settings.address}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink/70">{label}</span>
      {children}
    </label>
  );
}

export function Faq() {
  return (
    <PageShell title="سوالات متداول" subtitle="پاسخ پرتکرارترین پرسش‌های مشتریان اتو درایو.">
      <dl className="space-y-5">
        {[
          {
            q: 'چطور مطمئن شوم قطعه با خودروی من سازگار است؟',
            a: 'در صفحه هر محصول، بخش «سازگاری با خودرو» فهرست برند و مدل‌هایی را نشان می‌دهد که قطعه برای آن‌ها مناسب است. همچنین می‌توانید از فیلتر خودرو در صفحه فروشگاه استفاده کنید.',
          },
          {
            q: 'شماره فنی قطعه را از کجا پیدا کنم؟',
            a: 'شماره فنی هر قطعه در صفحه محصول و در زیر نام آن در کارت محصول نمایش داده می‌شود. می‌توانید همین شماره را در جست‌وجوی فروشگاه وارد کنید.',
          },
          {
            q: 'ارسال چقدر زمان می‌برد؟',
            a: 'سفارش‌ها در روزهای کاری پردازش و ارسال می‌شوند. جزئیات و هزینه ارسال در صفحه «شرایط ارسال» آمده است.',
          },
          {
            q: 'امکان بازگشت کالا وجود دارد؟',
            a: 'بله؛ تا ۳۰ روز پس از دریافت، در صورت باز نشدن بسته‌بندی و سالم بودن قطعه، امکان بازگشت وجود دارد. شرایط کامل در صفحه «قوانین بازگشت کالا» آمده است.',
          },
        ].map((item) => (
          <div key={item.q} className="card p-5">
            <dt className="text-sm font-extrabold text-ink">{item.q}</dt>
            <dd className="mt-2 text-sm leading-8 text-ink/70">{item.a}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}

export function Shipping() {
  return (
    <PageShell title="شرایط ارسال" subtitle="نحوه آماده‌سازی و ارسال سفارش‌ها در اتو درایو.">
      <BulletList
        items={[
          'سفارش‌ها پس از ثبت، در اولین روز کاری پردازش و بسته‌بندی می‌شوند.',
          'ارسال به سراسر کشور از طریق پست و باربری انجام می‌شود.',
          'برای سفارش‌های بالای مبلغ مشخص‌شده در تنظیمات فروشگاه، ارسال رایگان است.',
          'هزینه ارسال در مرحله پرداخت، پیش از نهایی‌کردن سفارش نمایش داده می‌شود.',
          'کد رهگیری پس از تحویل مرسوله به شرکت حمل، در حساب کاربری شما ثبت می‌شود.',
        ]}
      />
    </PageShell>
  );
}

export function Returns() {
  return (
    <PageShell title="قوانین بازگشت کالا" subtitle="ضمانت بازگشت کالا تا ۳۰ روز طبق شرایط فروشگاه.">
      <BulletList
        items={[
          'بازگشت کالا تا ۳۰ روز پس از دریافت امکان‌پذیر است.',
          'قطعه باید در بسته‌بندی اصلی و بدون آسیب فیزیکی باشد.',
          'قطعات الکترونیکی نصب‌شده و قطعات سفارشی قابل بازگشت نیستند.',
          'برای شروع فرآیند بازگشت، از طریق صفحه «تماس با ما» درخواست خود را ثبت کنید.',
          'هزینه بازگشت در صورت مغایرت کالا با سفارش، بر عهده فروشگاه است.',
        ]}
      />
    </PageShell>
  );
}

export function BuyingGuide() {
  return (
    <PageShell title="راهنمای خرید" subtitle="چند قدم ساده برای انتخاب قطعه درست.">
      <BulletList
        items={[
          'برند، مدل و سال ساخت خودروی خود را مشخص کنید تا فیلتر سازگاری دقیق‌تر عمل کند.',
          'اگر شماره فنی قطعه را می‌دانید، آن را در جست‌وجوی فروشگاه وارد کنید.',
          'پیش از خرید، بخش «مشخصات فنی» و «سازگاری با خودرو» را بررسی کنید.',
          'در صورت تردید، پیش از خرید با پشتیبانی فنی تماس بگیرید.',
          'برای خریدهای چند قطعه‌ای، سبد خرید را نهایی کنید تا هزینه ارسال یک‌بار محاسبه شود.',
        ]}
      />
    </PageShell>
  );
}

export function Careers() {
  return (
    <PageShell title="فرصت‌های همکاری" subtitle="به تیم اتو درایو بپیوندید.">
      <p>
        اگر به دنیای خودرو علاقه دارید و دوست دارید در ساخت یک فروشگاه قطعات حرفه‌ای سهیم باشید، خوشحال می‌شویم
        رزومه شما را ببینیم.
      </p>
      <BulletList
        items={[
          'کارشناس فروش قطعات خودرو',
          'کارشناس پشتیبانی فنی و مشاوره خرید',
          'کارشناس انبار و کنترل کیفیت قطعات',
          'همکار در حوزه تولید محتوا و شبکه‌های اجتماعی',
        ]}
      />
      <p>
        برای ارسال رزومه از صفحه{' '}
        <Link to="/contact" className="font-semibold text-racing hover:underline">
          تماس با ما
        </Link>{' '}
        استفاده کنید.
      </p>
    </PageShell>
  );
}

export function Terms() {
  return (
    <PageShell title="قوانین و مقررات" subtitle="شرایط استفاده از فروشگاه اتو درایو.">
      <p>
        استفاده از این فروشگاه به معنای پذیرش قوانین زیر است. اتو درایو ممکن است این شرایط را به‌روزرسانی کند؛
        نسخه معتبر همیشه همین صفحه است.
      </p>
      <BulletList
        items={[
          'قیمت‌ها به تومان و شامل مالیات بر ارزش افزوده است.',
          'تصاویر محصولات ممکن است با محصول واقعی تفاوت جزئی داشته باشند.',
          'سفارش‌ها تنها پس از تأیید پرداخت، وارد فرآیند آماده‌سازی می‌شوند.',
          'مسئولیت نصب صحیح قطعه بر عهده خریدار یا تعمیرگاه مجاز است.',
        ]}
      />
    </PageShell>
  );
}

export function Privacy() {
  return (
    <PageShell title="حریم خصوصی" subtitle="چگونه از اطلاعات شما محافظت می‌کنیم.">
      <BulletList
        items={[
          'اطلاعات حساب کاربری تنها برای مدیریت سفارش‌ها و پشتیبانی استفاده می‌شود.',
          'اطلاعات تماس شما در اختیار هیچ شخص ثالثی قرار نمی‌گیرد.',
          'آدرس و شماره تماس تنها برای ارسال سفارش و هماهنگی تحویل به شرکت حمل ارائه می‌شود.',
          'می‌توانید در هر زمان درخواست حذف حساب کاربری خود را ثبت کنید.',
        ]}
      />
    </PageShell>
  );
}
