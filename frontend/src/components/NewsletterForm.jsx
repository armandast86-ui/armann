import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

const ICONS = { اینستاگرام: Instagram, تلگرام: Send, واتس‌اپ: MessageCircle };

export default function NewsletterForm({ tone = 'light' }) {
  const { notify } = useApp();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error');
      setMessage('ایمیل وارد‌شده معتبر نیست.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const result = await api.post('/newsletter', { email: email.trim() });
      setStatus('success');
      setMessage(result?.message ?? 'عضویت شما در خبرنامه ثبت شد.');
      setEmail('');
      notify('عضویت شما در خبرنامه ثبت شد.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  const dark = tone === 'dark';

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="newsletter-email">
          ایمیل شما
        </label>
        <input
          id="newsletter-email"
          type="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ایمیل شما"
          className={`flex-1 rounded-full px-4 py-2.5 text-sm placeholder:text-end ${
            dark
              ? 'border border-white/25 bg-white/10 text-white placeholder:text-white/60'
              : 'field'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn btn-primary px-5 py-2.5"
        >
          {status === 'loading' ? 'در حال ثبت…' : 'عضویت'}
        </button>
      </div>
      {message && (
        <p
          role="status"
          className={`text-xs ${status === 'error' ? 'text-red-300' : dark ? 'text-white/80' : 'text-emerald-700'}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}

export { ICONS as socialIcons };
