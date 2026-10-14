import { Link } from 'react-router-dom';
import { Instagram, Send, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ICONS = { اینستاگرام: Instagram, تلگرام: Send, واتس‌اپ: MessageCircle };

/** Slim dusty-rose announcement bar. The text lives in the store settings record. */
export default function AnnouncementBar() {
  const { settings } = useApp();
  if (!settings?.announcementEnabled || !settings?.announcementText) return null;

  const socials = (settings.socials ?? []).slice(0, 3);

  return (
    <div className="bg-rose text-white">
      <div className="container-page flex min-h-9 items-center justify-center gap-4 py-1.5 text-center text-[11px] sm:text-xs">
        <p className="leading-5">{settings.announcementText}</p>
        {socials.length > 0 && (
          <div className="hidden items-center gap-3 border-s border-white/30 ps-4 md:flex">
            {socials.map((social) => {
              const Icon = ICONS[social.name] ?? MessageCircle;
              return (
                <Link
                  key={social.name}
                  to={social.url || '#'}
                  aria-label={social.name}
                  className="text-white/90 transition hover:text-white"
                >
                  <Icon size={15} strokeWidth={1.6} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
