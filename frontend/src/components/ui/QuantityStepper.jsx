import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, max = 99, min = 1, size = 'md' }) {
  const compact = size === 'sm';
  const buttonClass = `flex items-center justify-center rounded-full text-ink transition hover:bg-cream disabled:opacity-40 ${
    compact ? 'size-7' : 'size-9'
  }`;

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-1">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        aria-label="افزودن یکی به تعداد"
      >
        <Plus size={compact ? 13 : 15} strokeWidth={2} />
      </button>
      <span className={`min-w-7 text-center ${compact ? 'text-xs' : 'text-sm'}`}>{value.toLocaleString('fa-IR')}</span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(Math.max(value - 1, min))}
        disabled={value <= min}
        aria-label="کاهش یکی از تعداد"
      >
        <Minus size={compact ? 13 : 15} strokeWidth={2} />
      </button>
    </div>
  );
}
