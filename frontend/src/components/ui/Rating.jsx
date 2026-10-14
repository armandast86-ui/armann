import { Star } from 'lucide-react';
import { formatNumber } from '../../lib/format';

/** Renders a rating only when the product actually has customer reviews. */
export default function Rating({ value, count, size = 13, showValue = true }) {
  if (!count || !value) return null;
  const rounded = Math.round(Number(value));

  return (
    <div className="flex items-center gap-1.5" dir="rtl">
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            strokeWidth={1.4}
            className={star <= rounded ? 'fill-gold text-gold' : 'text-line'}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-[11px] text-ink/60">
          {Number(value).toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          <span className="mx-1">·</span>
          {formatNumber(count)} نظر
        </span>
      )}
      <span className="sr-only">{`امتیاز ${value} از ۵ بر پایه ${count} نظر`}</span>
    </div>
  );
}
