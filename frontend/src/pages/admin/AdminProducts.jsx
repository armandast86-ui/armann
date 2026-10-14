import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { api, queryString } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { formatNumber, formatToman, parseNumber } from '../../lib/format';
import { EmptyState, Loading, NoteBanner } from '../../components/ui/States';

const EMPTY_PRODUCT = {
  id: null,
  name: '',
  slug: '',
  brandId: '',
  categoryId: '',
  price: '',
  compareAtPrice: '',
  stock: '0',
  image: '',
  gallery: [],
  specs: [],
  shortDescription: '',
  description: '',
  partNumber: '',
  warranty: '',
  origin: '',
  fitmentIds: [],
  isFeatured: false,
  isBestseller: false,
  isNew: false,
  isActive: true,
};

function ProductForm({ initial, categories, brands, onSaved, onCancel }) {
  const { notify, vehicles } = useApp();
  const [form, setForm] = useState(() => ({
    ...EMPTY_PRODUCT,
    ...initial,
    brandId: initial?.brand ? '' : '',
    categoryId: initial?.category ? '' : '',
    gallery: initial?.gallery ?? [],
    specs: initial?.specs ?? [],
  }));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // The edit payload carries brand/category names, so map them back to ids.
  useEffect(() => {
    if (!initial) return;
    setForm((current) => ({
      ...current,
      brandId: brands.find((brand) => brand.slug === initial.brand?.slug)?.id ?? '',
      categoryId: categories.find((category) => category.slug === initial.category?.slug)?.id ?? '',
    }));
  }, [initial, brands, categories]);

  // Load the product's vehicle compatibility and map model slugs back to ids.
  useEffect(() => {
    if (!initial?.slug) return undefined;
    let cancelled = false;
    api
      .get(`/products/${initial.slug}`)
      .then((full) => {
        if (cancelled) return;
        const slugs = new Set((full.compatibility ?? []).map((item) => item.model.slug));
        const ids = [];
        vehicles.forEach((make) =>
          make.models.forEach((model) => {
            if (slugs.has(model.slug)) ids.push(model.id);
          }),
        );
        setForm((current) => ({ ...current, fitmentIds: ids }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initial?.slug, vehicles]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/uploads', { method: 'POST', body, credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'بارگذاری تصویر انجام نشد.');
      set('image', payload.url);
      notify('تصویر محصول بارگذاری شد.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      price: parseNumber(form.price),
      compareAtPrice: form.compareAtPrice === '' ? null : parseNumber(form.compareAtPrice),
      stock: parseNumber(form.stock) || 0,
      categoryId: Number(form.categoryId),
      brandId: form.brandId ? Number(form.brandId) : null,
    };
    try {
      const saved = form.id
        ? await api.put(`/admin/products/${form.id}`, payload)
        : await api.post('/admin/products', payload);
      const productId = form.id ?? saved?.id;
      if (productId) {
        await api.put(`/admin/products/${productId}/fitments`, { modelIds: form.fitmentIds ?? [] });
      }
      notify('محصول ذخیره شد.');
      onSaved();
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{form.id ? `ویرایش «${initial?.name}»` : 'افزودن محصول جدید'}</h2>
        <button type="button" onClick={onCancel} className="rounded-full p-1.5 hover:bg-surface" aria-label="بستن فرم">
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className="mb-1.5 block text-xs font-medium text-ink/75">
            نام محصول *
          </label>
          <input id="p-name" value={form.name} onChange={(event) => set('name', event.target.value)} className="field" />
        </div>
        <div>
          <label htmlFor="p-slug" className="mb-1.5 block text-xs font-medium text-ink/75">
            نامک (slug) — انگلیسی، برای نشانی صفحه
          </label>
          <input
            id="p-slug"
            dir="ltr"
            value={form.slug}
            onChange={(event) => set('slug', event.target.value)}
            className="field text-start"
            placeholder="مثلاً hydrating-surface"
          />
        </div>
        <div>
          <label htmlFor="p-category" className="mb-1.5 block text-xs font-medium text-ink/75">
            دسته‌بندی *
          </label>
          <select
            id="p-category"
            value={form.categoryId}
            onChange={(event) => set('categoryId', event.target.value)}
            className="field"
          >
            <option value="">انتخاب کنید…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-brand" className="mb-1.5 block text-xs font-medium text-ink/75">
            برند
          </label>
          <select id="p-brand" value={form.brandId} onChange={(event) => set('brandId', event.target.value)} className="field">
            <option value="">بدون برند</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-price" className="mb-1.5 block text-xs font-medium text-ink/75">
            قیمت فروش (تومان) *
          </label>
          <input
            id="p-price"
            inputMode="numeric"
            value={form.price}
            onChange={(event) => set('price', event.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="p-compare" className="mb-1.5 block text-xs font-medium text-ink/75">
            قیمت قبل از تخفیف (اختیاری)
          </label>
          <input
            id="p-compare"
            inputMode="numeric"
            value={form.compareAtPrice}
            onChange={(event) => set('compareAtPrice', event.target.value)}
            className="field"
            placeholder="خالی بگذارید اگر تخفیف ندارد"
          />
        </div>
        <div>
          <label htmlFor="p-stock" className="mb-1.5 block text-xs font-medium text-ink/75">
            موجودی انبار
          </label>
          <input
            id="p-stock"
            inputMode="numeric"
            value={form.stock}
            onChange={(event) => set('stock', event.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="p-image" className="mb-1.5 block text-xs font-medium text-ink/75">
            تصویر اصلی
          </label>
          <div className="flex gap-2">
            <input
              id="p-image"
              dir="ltr"
              value={form.image}
              onChange={(event) => set('image', event.target.value)}
              className="field text-start"
              placeholder="نشانی تصویر"
            />
            <label className="btn btn-outline shrink-0 cursor-pointer px-3">
              <Upload size={15} strokeWidth={1.8} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => uploadFile(event.target.files?.[0])}
              />
            </label>
          </div>
          {uploading && <p className="mt-1 text-[11px] text-ink/55">در حال بارگذاری تصویر…</p>}
        </div>
      </div>

      {form.image && (
        <img src={form.image} alt="" className="size-24 rounded-xl border border-line object-cover" />
      )}

      <div>
        <label htmlFor="p-gallery" className="mb-1.5 block text-xs font-medium text-ink/75">
          گالری تصاویر — هر نشانی در یک خط
        </label>
        <textarea
          id="p-gallery"
          dir="ltr"
          rows={3}
          value={(form.gallery ?? []).join('\n')}
          onChange={(event) =>
            set(
              'gallery',
              event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
            )
          }
          className="field text-start"
        />
      </div>

      <div>
        <label htmlFor="p-specs" className="mb-1.5 block text-xs font-medium text-ink/75">
          مشخصات — هر سطر به شکل «عنوان: مقدار»
        </label>
        <textarea
          id="p-specs"
          rows={4}
          value={(form.specs ?? []).map((spec) => `${spec.label}: ${spec.value}`).join('\n')}
          onChange={(event) =>
            set(
              'specs',
              event.target.value
                .split('\n')
                .map((line) => line.split(':'))
                .filter((parts) => parts.length >= 2 && parts[0].trim() && parts.slice(1).join(':').trim())
                .map((parts) => ({ label: parts[0].trim(), value: parts.slice(1).join(':').trim() })),
            )
          }
          className="field"
          placeholder={'قطر: ۲۸۰ میلی‌متر\nموقعیت: محور جلو'}
        />
      </div>

      <div className="grid gap-4">
        <div>
          <label htmlFor="p-short" className="mb-1.5 block text-xs font-medium text-ink/75">
            توضیح کوتاه (روی کارت محصول)
          </label>
          <input
            id="p-short"
            value={form.shortDescription}
            onChange={(event) => set('shortDescription', event.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="p-description" className="mb-1.5 block text-xs font-medium text-ink/75">
            توضیح کامل محصول
          </label>
          <textarea
            id="p-description"
            rows={4}
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            className="field"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="p-part" className="mb-1.5 block text-xs font-medium text-ink/75">
              شماره فنی قطعه
            </label>
            <input
              id="p-part"
              dir="ltr"
              value={form.partNumber}
              onChange={(event) => set('partNumber', event.target.value)}
              className="field text-start"
              placeholder="BR-2458"
            />
          </div>
          <div>
            <label htmlFor="p-warranty" className="mb-1.5 block text-xs font-medium text-ink/75">
              گارانتی
            </label>
            <input
              id="p-warranty"
              value={form.warranty}
              onChange={(event) => set('warranty', event.target.value)}
              className="field"
              placeholder="۱۸ ماه"
            />
          </div>
          <div>
            <label htmlFor="p-origin" className="mb-1.5 block text-xs font-medium text-ink/75">
              کشور سازنده
            </label>
            <input
              id="p-origin"
              value={form.origin}
              onChange={(event) => set('origin', event.target.value)}
              className="field"
              placeholder="آلمان"
            />
          </div>
        </div>
      </div>

      <FitmentEditor value={form.fitmentIds} onChange={(ids) => set('fitmentIds', ids)} />

      <div className="flex flex-wrap gap-5">
        {[
          { key: 'isFeatured', label: 'محصول ویژه (نمایش پیشنهادی در فروشگاه)' },
          { key: 'isBestseller', label: 'پرفروش (نمایش در بخش پرفروش‌ترین‌ها)' },
          { key: 'isNew', label: 'محصول جدید' },
          { key: 'isActive', label: 'نمایش در فروشگاه' },
        ].map((toggle) => (
          <label key={toggle.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form[toggle.key])}
              onChange={(event) => set(toggle.key, event.target.checked)}
              className="size-4 accent-racing"
            />
            {toggle.label}
          </label>
        ))}
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'در حال ذخیره…' : 'ذخیره محصول'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-outline">
          انصراف
        </button>
      </div>
    </form>
  );
}

/** Checkbox list of vehicle models, grouped by make. */
function FitmentEditor({ value, onChange }) {
  const { vehicles } = useApp();
  const selected = new Set(value ?? []);
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="px-1 text-xs font-semibold text-ink/75">سازگاری با خودرو (اختیاری)</legend>
      <p className="mb-3 text-[11px] text-ink/50">
        مدل‌هایی که این قطعه با آن‌ها سازگار است را انتخاب کنید تا در فیلتر «سازگاری با خودرو» نمایش داده شوند.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((make) => (
          <div key={make.slug}>
            <p className="mb-1.5 text-[11px] font-bold text-ink/60">{make.name}</p>
            <div className="space-y-1">
              {make.models.map((model) => (
                <label key={model.id} className="flex items-center gap-2 text-xs text-ink/75">
                  <input
                    type="checkbox"
                    checked={selected.has(model.id)}
                    onChange={() => toggle(model.id)}
                    className="size-3.5 accent-racing"
                  />
                  {model.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default function AdminProducts() {
  const { categories, brands, notify } = useApp();
  const [data, setData] = useState({ status: 'loading', items: [], total: 0, pages: 1 });
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setData((current) => ({ ...current, status: 'loading' }));
    api
      .get(`/admin/products${queryString({ query, page, limit: 20 })}`)
      .then((result) => setData({ status: 'ready', ...result }))
      .catch((error) => setData({ status: 'error', items: [], total: 0, pages: 1, error: error.message }));
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (product) => {
    if (!window.confirm(`محصول «${product.name}» حذف شود؟ این کار قابل بازگشت نیست.`)) return;
    try {
      await api.del(`/admin/products/${product.id}`);
      notify('محصول حذف شد.');
      load();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  if (editing) {
    return (
      <ProductForm
        initial={editing === 'new' ? null : editing}
        categories={categories}
        brands={brands}
        onSaved={() => {
          setEditing(null);
          load();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">مدیریت محصولات</h2>
        <button type="button" onClick={() => setEditing('new')} className="btn btn-primary">
          <Plus size={16} strokeWidth={2} />
          محصول جدید
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جست‌وجوی نام محصول یا برند"
          aria-label="جست‌وجوی محصول"
          className="field max-w-sm"
        />
        <button type="submit" className="btn btn-outline px-4">
          <Search size={15} strokeWidth={1.8} />
          جست‌وجو
        </button>
      </form>

      {data.status === 'loading' && <Loading />}
      {data.status === 'error' && <NoteBanner>{data.error}</NoteBanner>}
      {data.status === 'ready' && data.items.length === 0 && (
        <EmptyState title="محصولی یافت نشد" description="با تغییر جست‌وجو یا افزودن محصول جدید ادامه دهید." />
      )}

      {data.status === 'ready' && data.items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-surface text-xs text-ink/60">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">محصول</th>
                  <th className="px-4 py-3 text-start font-medium">دسته‌بندی</th>
                  <th className="px-4 py-3 text-start font-medium">قیمت</th>
                  <th className="px-4 py-3 text-start font-medium">موجودی</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-start font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt=""
                          loading="lazy"
                          className="size-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-[11px] text-ink/50">
                            {product.brand?.name ?? 'بدون برند'}
                            {product.isDemo && ' · نمایشی'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{product.category?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={product.discountPercent ? 'text-racing' : ''}>
                        {formatToman(product.price)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="block text-[11px] text-ink/45 line-through">
                          {formatToman(product.compareAtPrice)}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-xs ${product.stock === 0 ? 'text-red-600' : ''}`}>
                      {product.stock === 0 ? 'ناموجود' : formatNumber(product.stock)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-line/60 text-ink'
                        }`}
                      >
                        {product.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(product)}
                          className="btn btn-outline px-3 py-1.5 text-xs"
                        >
                          <Pencil size={13} strokeWidth={1.8} />
                          ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          className="btn btn-outline px-3 py-1.5 text-xs"
                        >
                          <Trash2 size={13} strokeWidth={1.8} />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page <= 1}
            className="btn btn-outline px-3 py-2 text-xs"
          >
            قبلی
          </button>
          <span className="text-xs text-ink/60">
            صفحه {formatNumber(page)} از {formatNumber(data.pages)}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(current + 1, data.pages))}
            disabled={page >= data.pages}
            className="btn btn-outline px-3 py-2 text-xs"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
