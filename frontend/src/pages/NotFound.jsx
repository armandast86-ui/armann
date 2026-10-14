import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-5xl font-extrabold text-racing/40">۴۰۴</p>
        <h1 className="mt-4 text-xl font-extrabold text-racing">این صفحه پیدا نشد</h1>
        <p className="mt-3 text-sm leading-8 text-ink/65">
          ممکن است نشانی صفحه تغییر کرده باشد یا محصول مورد نظر از فروشگاه حذف شده باشد.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-primary">
            صفحه اصلی
          </Link>
          <Link to="/shop" className="btn btn-outline">
            مشاهده محصولات
          </Link>
        </div>
      </div>
    </div>
  );
}
