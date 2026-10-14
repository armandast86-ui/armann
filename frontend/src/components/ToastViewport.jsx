import { Check, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

/** Persian confirmation / error messages for cart and account actions. */
export default function ToastViewport() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 start-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toast.tone === 'error' ? Info : Check;
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-soft)] ${
              toast.tone === 'error'
                ? 'border-red-200 bg-white text-red-700'
                : 'border-line bg-white text-ink'
            }`}
          >
            <Icon size={17} strokeWidth={1.8} className="mt-0.5 shrink-0 text-racing" />
            <p className="flex-1 leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="بستن پیام"
              className="rounded-full p-1 text-ink/40 transition hover:bg-surface"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
