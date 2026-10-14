import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { formatNumber } from '../../lib/format';

const EMPTY_CATEGORY = { id: null, name: '', slug: '', image: '', description: '', sortOrder: '0' };
const EMPTY_BRAND = { id: null, name: '', slug: '', description: '' };

function CatalogForm({ kind, initial, onSaved, onCancel }) {
  const { notify } = useApp();
  const [form, setForm] = useState({ ...(kind === 'category' ? EMPTY_CATEGORY : EMPTY_BRAND), ...initial });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (form.id) await api.put(`/admin/${kind === 'category' ? 'categories' : 'brands'}/${form.id}`, form);
      else await api.post(`/admin/${kind === 'category' ? 'categories' : 'brands'}`, form);
      notify('ذخیره شد.');
      onSaved();
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  const isCategory = kind === 'category';

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {form.id ? `ویرایش ${initial.name}` : isCategory ? 'دسته‌بندی جدید' : 'برند جدید'}
        </h3>
        <button type="button" onClick={onCancel} className="rounded-full p-1.5 hover:bg-cream" aria-label="بستن فرم">
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/75" htmlFor="c-name">
            نام *
          </label>
          <input
            id="c-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="field"
          />
        </div>
        {!form.id && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/75" htmlFor="c-slug">
              نامک (slug) انگلیسی *
            </label>
            <input
              id="c-slug"
              dir="ltr"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              className="field text-start"
              placeholder="مثلاً skincare"
            />
          </div>
        )}
      </div>

      {isCategory && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/75" htmlFor="c-image">
              نشانی تصویر
            </label>
            <input
              id="c-image"
              dir="ltr"
              value={form.image ?? ''}
              onChange={(event) => setForm({ ...form, image: event.target.value })}
              className="field text-start"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/75" htmlFor="c-order">
              ترتیب نمایش
            </label>
            <input
              id="c-order"
              inputMode="numeric"
              value={form.sortOrder ?? '0'}
              onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
              className="field"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink/75" htmlFor="c-description">
          توضیح
        </label>
        <textarea
          id="c-description"
          rows={2}
          value={form.description ?? ''}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="field"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'در حال ذخیره…' : 'ذخیره'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-outline">
          انصراف
        </button>
      </div>
    </form>
  );
}

export default function AdminCatalog() {
  const { categories, brands, notify } = useApp();
  const [editing, setEditing] = useState(null); // {kind, item|null}
  const [localCategories, setLocalCategories] = useState(null);
  const [localBrands, setLocalBrands] = useState(null);

  const refresh = () => {
    api.get('/categories').then(setLocalCategories).catch(() => {});
    api.get('/brands').then(setLocalBrands).catch(() => {});
  };

  useEffect(() => {
    refresh();
  }, []);

  const categoryList = localCategories ?? categories;
  const brandList = localBrands ?? brands;

  const remove = async (kind, item) => {
    if (!window.confirm(`«${item.name}» حذف شود؟`)) return;
    try {
      await api.del(`/admin/${kind === 'category' ? 'categories' : 'brands'}/${item.id}`);
      notify('حذف شد.');
      refresh();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const renderList = (kind, items) => (
    <div className="card divide-y divide-line">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            {kind === 'category' && item.image && (
              <img src={item.image} alt="" loading="lazy" className="size-10 rounded-full object-cover" />
            )}
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-[11px] text-ink/50">
                {item.slug} · {formatNumber(item.productCount)} محصول
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing({ kind, item })}
              className="btn btn-outline px-3 py-1.5 text-xs"
            >
              <Pencil size={13} strokeWidth={1.8} />
              ویرایش
            </button>
            <button
              type="button"
              onClick={() => remove(kind, item)}
              className="btn btn-outline px-3 py-1.5 text-xs"
            >
              <Trash2 size={13} strokeWidth={1.8} />
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {editing && (
        <CatalogForm
          kind={editing.kind}
          initial={editing.item ?? (editing.kind === 'category' ? EMPTY_CATEGORY : EMPTY_BRAND)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">دسته‌بندی‌ها</h2>
          <button
            type="button"
            onClick={() => setEditing({ kind: 'category', item: null })}
            className="btn btn-primary"
          >
            <Plus size={16} strokeWidth={2} />
            دسته‌بندی جدید
          </button>
        </div>
        {categoryList.length === 0 ? (
          <p className="card p-6 text-center text-sm text-ink/60">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
        ) : (
          renderList('category', categoryList)
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">برندها</h2>
          <button type="button" onClick={() => setEditing({ kind: 'brand', item: null })} className="btn btn-primary">
            <Plus size={16} strokeWidth={2} />
            برند جدید
          </button>
        </div>
        {brandList.length === 0 ? (
          <p className="card p-6 text-center text-sm text-ink/60">هنوز برندی ثبت نشده است.</p>
        ) : (
          renderList('brand', brandList)
        )}
      </section>
    </div>
  );
}
