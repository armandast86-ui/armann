import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * RTL breadcrumbs: the first item sits on the right and the separator arrow
 * points to the left, following the Persian reading direction.
 */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="مسیر صفحه" className="flex flex-wrap items-center gap-2 text-xs text-ink/60">
      <Link to="/" className="transition hover:text-racing">
        صفحه اصلی
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          <ChevronLeft size={13} strokeWidth={1.8} className="text-ink/35" />
          {item.to && index < items.length - 1 ? (
            <Link to={item.to} className="transition hover:text-racing">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink/80">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
