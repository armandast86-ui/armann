import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function Register() {
  const { login, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 3) {
      setError('نام و نام خانوادگی را کامل وارد کنید.');
      return;
    }
    if (form.phone && !/^09\d{9}$/.test(form.phone.trim())) {
      setError('شماره تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.');
      return;
    }
    if (form.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('تکرار رمز عبور با رمز عبور یکسان نیست.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      login(result.user);
      notify('حساب کاربری شما ساخته شد.');
      navigate(location.state?.from || '/account', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-xl font-extrabold text-racing">ساخت حساب کاربری</h1>
          <p className="mt-2 text-sm leading-7 text-ink/60">
            با ساخت حساب، سفارش‌ها و نشانی‌های شما برای خریدهای بعدی ذخیره می‌شود.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-ink/75">
                نام و نام خانوادگی
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="field"
                placeholder="مثلاً سارا محمدی"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="mb-1.5 block text-xs font-medium text-ink/75">
                ایمیل
              </label>
              <input
                id="register-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="field text-start"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label htmlFor="register-phone" className="mb-1.5 block text-xs font-medium text-ink/75">
                شماره تماس (اختیاری)
              </label>
              <input
                id="register-phone"
                type="tel"
                dir="ltr"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="field text-start"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="mb-1.5 block text-xs font-medium text-ink/75">
                رمز عبور
              </label>
              <input
                id="register-password"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="field text-start"
                placeholder="حداقل ۶ کاراکتر"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-ink/75">
                تکرار رمز عبور
              </label>
              <input
                id="confirm"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                className="field text-start"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              <UserPlus size={16} strokeWidth={1.8} />
              {loading ? 'در حال ساخت حساب…' : 'ثبت‌نام'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/65">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link to="/login" state={location.state} className="text-racing hover:underline">
              وارد شوید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
