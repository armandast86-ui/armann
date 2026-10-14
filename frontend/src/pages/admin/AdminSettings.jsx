import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Loading, NoteBanner } from '../../components/ui/States';

const EMPTY = {
  storeName: '',
  tagline: '',
  announcementText: '',
  announcementEnabled: true,
  freeShippingThreshold: '0',
  shippingFee: '0',
  phone: '',
  email: '',
  address: '',
  logoUrl: '',
  socials: [],
};

export default function AdminSettings() {
  const { notify, refreshSettings } = useApp();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ saving: false, error: '', message: '' });

  useEffect(() => {
    api
      .get('/settings')
      .then((data) =>
        setForm(
          data
            ? {
                ...EMPTY,
                ...data,
                freeShippingThreshold: String(data.freeShippingThreshold ?? 0),
                shippingFee: String(data.shippingFee ?? 0),
                socials: data.socials ?? [],
              }
            : { ...EMPTY },
        ),
      )
      .catch(() => setForm({ ...EMPTY }));
  }, []);

  if (!form) return <Loading label="در حال خواندن تنظیمات…" />;

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ saving: true, error: '', message: '' });
    try {
      await api.put('/admin/settings', form);
      await refreshSettings();
      setStatus({ saving: false, error: '', message: 'تنظیمات فروشگاه ذخیره شد.' });
      notify('تنظیمات فروشگاه ذخیره شد.');
    } catch (error) {
      setStatus({ saving: false, error: error.message, message: '' });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <h2 className="text-base font-bold">تنظیمات فروشگاه</h2>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-bold">هویت فروشگاه</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="s-name" className="mb-1.5 block text-xs font-medium text-ink/75">
              نام فروشگاه
            </label>
            <input id="s-name" value={form.storeName} onChange={(event) => set('storeName', event.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="s-tagline" className="mb-1.5 block text-xs font-medium text-ink/75">
              شعار فروشگاه
            </label>
            <input id="s-tagline" value={form.tagline} onChange={(event) => set('tagline', event.target.value)} className="field" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="s-logo" className="mb-1.5 block text-xs font-medium text-ink/75">
              نشانی لوگو (اختیاری)
            </label>
            <input
              id="s-logo"
              dir="ltr"
              value={form.logoUrl ?? ''}
              onChange={(event) => set('logoUrl', event.target.value)}
              className="field text-start"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-bold">نوار اعلان بالای سایت</h3>
        <div>
          <label htmlFor="s-announcement" className="mb-1.5 block text-xs font-medium text-ink/75">
            متن اعلان
          </label>
          <input
            id="s-announcement"
            value={form.announcementText}
            onChange={(event) => set('announcementText', event.target.value)}
            className="field"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.announcementEnabled)}
            onChange={(event) => set('announcementEnabled', event.target.checked)}
            className="size-4 accent-burgundy"
          />
          نمایش نوار اعلان در وب‌سایت
        </label>
      </div>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-bold">ارسال و پرداخت</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="s-threshold" className="mb-1.5 block text-xs font-medium text-ink/75">
              حد ارسال رایگان (تومان)
            </label>
            <input
              id="s-threshold"
              inputMode="numeric"
              value={form.freeShippingThreshold}
              onChange={(event) => set('freeShippingThreshold', event.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="s-fee" className="mb-1.5 block text-xs font-medium text-ink/75">
              هزینه ارسال پایه (تومان)
            </label>
            <input
              id="s-fee"
              inputMode="numeric"
              value={form.shippingFee}
              onChange={(event) => set('shippingFee', event.target.value)}
              className="field"
            />
          </div>
        </div>
        <NoteBanner>
          این مقدارها در نوار اعلان، سبد خرید و محاسبه سفارش استفاده می‌شوند. درگاه پرداخت آنلاین در این نسخه
          متصل نیست و سفارش‌ها با وضعیت «پرداخت نشده» ثبت می‌شوند.
        </NoteBanner>
      </div>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-bold">اطلاعات تماس</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="s-phone" className="mb-1.5 block text-xs font-medium text-ink/75">
              شماره تماس
            </label>
            <input
              id="s-phone"
              dir="ltr"
              value={form.phone ?? ''}
              onChange={(event) => set('phone', event.target.value)}
              className="field text-start"
            />
          </div>
          <div>
            <label htmlFor="s-email" className="mb-1.5 block text-xs font-medium text-ink/75">
              ایمیل
            </label>
            <input
              id="s-email"
              dir="ltr"
              value={form.email ?? ''}
              onChange={(event) => set('email', event.target.value)}
              className="field text-start"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="s-address" className="mb-1.5 block text-xs font-medium text-ink/75">
              نشانی فروشگاه
            </label>
            <textarea
              id="s-address"
              rows={2}
              value={form.address ?? ''}
              onChange={(event) => set('address', event.target.value)}
              className="field"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-bold">شبکه‌های اجتماعی</h3>
        {(form.socials ?? []).map((social, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <div className="min-w-32 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-ink/75">نام</label>
              <input
                value={social.name}
                onChange={(event) => {
                  const next = [...form.socials];
                  next[index] = { ...social, name: event.target.value };
                  set('socials', next);
                }}
                className="field"
              />
            </div>
            <div className="min-w-40 flex-[2]">
              <label className="mb-1.5 block text-xs font-medium text-ink/75">نشانی</label>
              <input
                dir="ltr"
                value={social.url}
                onChange={(event) => {
                  const next = [...form.socials];
                  next[index] = { ...social, url: event.target.value };
                  set('socials', next);
                }}
                className="field text-start"
              />
            </div>
            <button
              type="button"
              onClick={() => set('socials', form.socials.filter((_, position) => position !== index))}
              className="btn btn-outline px-3 py-2 text-xs"
              aria-label="حذف شبکه اجتماعی"
            >
              <Trash2 size={13} strokeWidth={1.8} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set('socials', [...(form.socials ?? []), { name: '', url: '' }])}
          className="btn btn-outline"
        >
          <Plus size={15} strokeWidth={1.9} />
          افزودن شبکه اجتماعی
        </button>
      </div>

      {status.error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{status.error}</p>}
      {status.message && <p className="text-sm text-emerald-700">{status.message}</p>}

      <button type="submit" disabled={status.saving} className="btn btn-primary">
        <Save size={16} strokeWidth={1.8} />
        {status.saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}
      </button>
    </form>
  );
}
