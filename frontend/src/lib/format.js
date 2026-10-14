const numberFormatter = new Intl.NumberFormat('fa-IR');

/** 1250000 → «۱٬۲۵۰٬۰۰۰» */
export const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

/** 1250000 → «۱٬۲۵۰٬۰۰۰ تومان» */
export const formatToman = (value) => `${numberFormatter.format(Number(value) || 0)} تومان`;

export const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return '';
  }
};

export const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return '';
  }
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Accepts user input written in Persian or Latin digits and returns a number. */
export const parseNumber = (value) => {
  if (value === null || value === undefined) return NaN;
  const latin = String(value).replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
  const cleaned = latin.replace(/[^\d.-]/g, '');
  return cleaned ? Number(cleaned) : NaN;
};

export const ORDER_STATUS = {
  pending: { label: 'در انتظار بررسی', tone: 'bg-blush/40 text-ink' },
  processing: { label: 'در حال آماده‌سازی', tone: 'bg-gold/20 text-ink' },
  shipped: { label: 'ارسال شده', tone: 'bg-rose/20 text-rose-ink' },
  delivered: { label: 'تحویل شده', tone: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'لغو شده', tone: 'bg-red-50 text-red-700' },
};

export const PAYMENT_STATUS = {
  unpaid: { label: 'پرداخت نشده', tone: 'bg-blush/40 text-ink' },
  paid: { label: 'پرداخت شده', tone: 'bg-emerald-50 text-emerald-700' },
  refunded: { label: 'بازگشت داده شده', tone: 'bg-red-50 text-red-700' },
};

export const statusLabel = (map, key) => map[key]?.label ?? key;
export const statusTone = (map, key) => map[key]?.tone ?? 'bg-line/60 text-ink';
