import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function SectionHeading({ eyebrow, title, subtitle, link, align = 'start' }) {
  return (
    <div
      className={`mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${
        align === 'center' ? 'text-center sm:flex-col sm:items-center' : ''
      }`}
    >
      <div className={align === 'center' ? 'mx-auto max-w-xl' : ''}>
        {eyebrow && <span className="mb-2 block text-xs font-medium tracking-wide text-rose-ink">{eyebrow}</span>}
        <h2 className="text-xl font-extrabold text-ink sm:text-2xl lg:text-[1.75rem]">{title}</h2>
        {subtitle && <p className="mt-2 text-sm leading-7 text-ink/60">{subtitle}</p>}
      </div>
      {link && (
        <Link
          to={link.to}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-burgundy transition hover:text-rose-ink"
        >
          {link.label}
          <ArrowLeft size={15} strokeWidth={1.8} className="transition group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
