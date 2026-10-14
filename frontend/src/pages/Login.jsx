import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login, notify } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('ایمیل و رمز عبور را وارد کنید.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.post('/auth/login', { email: form.email.trim(), password: form.password });
      login(result.user);
      notify('خوش آمدید!');
      const target = location.state?.from || (result.user.role === 'admin' ? '/admin' : '/account');
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-xl font-extrabold text-burgundy">ورود به حساب کاربری</h1>
          <p className="mt-2 text-sm leading-7 text-ink/60">
            برای پیگیری سفارش‌ها و ذخیره نشانی‌ها وارد حساب خود شوید.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink/75">
                ایمیل
              </label>
              <input
                id="email"
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
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink/75">
                رمز عبور
              </label>
              <input
                id="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
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
              <Lock size={16} strokeWidth={1.8} />
              {loading ? 'در حال ورود…' : 'ورود'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/65">
            حساب کاربری ندارید؟{' '}
            <Link to="/register" state={location.state} className="text-burgundy hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
