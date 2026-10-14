import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const YEARS = Array.from({ length: 20 }, (_, index) => 1404 - index);

/** Vehicle fitment panel: pick a year, make and model to filter the catalogue. */
export default function FitmentFinder() {
  const { vehicles } = useApp();
  const navigate = useNavigate();
  const [year, setYear] = useState('');
  const [makeSlug, setMakeSlug] = useState('');
  const [modelSlug, setModelSlug] = useState('');

  const make = vehicles.find((item) => item.slug === makeSlug);
  const models = make?.models ?? [];

  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (makeSlug) params.set('make', makeSlug);
    if (modelSlug) params.set('model', modelSlug);
    const search = params.toString();
    navigate(`/shop${search ? `?${search}` : ''}`);
  };

  return (
    <form
      onSubmit={submit}
      className="mt-10 rounded-2xl border border-white/10 bg-graphite/80 p-5 backdrop-blur-sm sm:p-6"
      aria-label="جست‌وجوی قطعات بر اساس خودرو"
    >
      <p className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
        <Car size={17} strokeWidth={2} className="text-racing" />
        قطعه‌ای متناسب با خودروی خود پیدا کنید
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="انتخاب سال خودرو">
          <select value={year} onChange={(event) => setYear(event.target.value)} className="fitment-select">
            <option value="">همه سال‌ها</option>
            {YEARS.map((value) => (
              <option key={value} value={value}>
                {value.toLocaleString('fa-IR', { useGrouping: false })}
              </option>
            ))}
          </select>
        </Field>

        <Field label="انتخاب برند خودرو">
          <select
            value={makeSlug}
            onChange={(event) => {
              setMakeSlug(event.target.value);
              setModelSlug('');
            }}
            className="fitment-select"
          >
            <option value="">همه برندها</option>
            {vehicles.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="انتخاب مدل خودرو">
          <select
            value={modelSlug}
            onChange={(event) => setModelSlug(event.target.value)}
            disabled={!models.length}
            className="fitment-select disabled:opacity-50"
          >
            <option value="">{models.length ? 'همه مدل‌ها' : 'ابتدا برند را انتخاب کنید'}</option>
            {models.map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.name}
              </option>
            ))}
          </select>
        </Field>

        <button type="submit" className="btn btn-primary h-[46px] self-end">
          <Search size={17} strokeWidth={2} />
          جست‌وجوی قطعات
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-white/60">{label}</span>
      {children}
    </label>
  );
}
