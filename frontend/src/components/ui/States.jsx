import { AlertCircle, Loader2, PackageOpen } from 'lucide-react';

export function Loading({ label = 'در حال بارگذاری…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-12 text-sm text-ink/60 ${className}`} role="status">
      <Loader2 size={18} className="animate-spin text-racing" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <PackageOpen size={30} strokeWidth={1.4} className="text-racing" />
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="max-w-md text-sm leading-7 text-ink/60">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <AlertCircle size={28} strokeWidth={1.5} className="text-racing-deep" />
      <p className="text-sm leading-7 text-ink/75">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline">
          تلاش دوباره
        </button>
      )}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="aspect-square animate-pulse bg-surface" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-surface" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
            <div className="h-8 w-full animate-pulse rounded-full bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Small read-only notice used for demo content and admin notes. */
export function NoteBanner({ children, tone = 'info' }) {
  return (
    <p
      className={`rounded-xl border px-4 py-3 text-xs leading-6 ${
        tone === 'demo' ? 'border-star/40 bg-star/10 text-ink/80' : 'border-line bg-white text-ink/70'
      }`}
    >
      {children}
    </p>
  );
}
