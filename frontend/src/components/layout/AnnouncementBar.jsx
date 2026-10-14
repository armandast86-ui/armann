import { ShieldCheck, Tag, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ICONS = { truck: Truck, tag: Tag, shield: ShieldCheck };

const FALLBACK = [
  { icon: 'truck', text: 'ارسال رایگان برای سفارش‌های بالای ۵ میلیون تومان' },
  { icon: 'tag', text: '۱۰٪ تخفیف اولین خرید با کد DRIVE10' },
  { icon: 'shield', text: 'ضمانت بازگشت کالا تا ۳۰ روز' },
];

/**
 * Slim black announcement bar. The three promotional messages come from the store
 * settings record; on small screens they sit in a horizontally scrollable row.
 */
export default function AnnouncementBar() {
  const { settings } = useApp();
  if (!settings?.announcementEnabled) return null;

  const items =
    settings.announcements?.length > 0
      ? settings.announcements
      : settings.announcementText
        ? [{ icon: 'truck', text: settings.announcementText }]
        : FALLBACK;

  return (
    <div className="border-b border-white/10 bg-carbon text-white">
      <div className="container-page flex items-center gap-4 py-2">
        <div className="no-scrollbar flex flex-1 items-center gap-5 overflow-x-auto text-[11px] sm:justify-between sm:gap-3 sm:text-xs">
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? ShieldCheck;
            return (
              <p key={item.text} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                <Icon size={13} strokeWidth={2} className="text-racing" />
                <span className="text-white/85">{item.text}</span>
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
