import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Car,
  Heart,
  RefreshCcw,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { formatDateTime, formatToman } from '../lib/format';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Rating from '../components/ui/Rating';
import QuantityStepper from '../components/ui/QuantityStepper';
import ProductCard from '../components/ui/ProductCard';
import { ErrorState, Loading, NoteBanner } from '../components/ui/States';

const TABS = [
  { key: 'description', label: 'توضیحات' },
  { key: 'specs', label: 'مشخصات فنی' },
  { key: 'fitment', label: 'سازگاری با خودرو' },
];

export default function ProductDetails() {
  const { slug } = useParams();
  const { addToCart, toggleWishlist, wishlist, user, notify, settings } = useApp();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewStatus, setReviewStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setQuantity(1);
    setActiveImage(0);
    setActiveTab('description');
    api
      .get(`/products/${slug}`)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.status === 404 ? 'این محصول در فروشگاه موجود نیست.' : err.message);
        setStatus('error');
      });
    api.get(`/products/${slug}/related`).then((data) => !cancelled && setRelated(data ?? [])).catch(() => {});
    api.get(`/products/${slug}/reviews`).then((data) => !cancelled && setReviews(data ?? [])).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewStatus('loading');
    try {
      await api.post(`/products/${slug}/reviews`, reviewForm);
      const data = await api.get(`/products/${slug}/reviews`);
      setReviews(data ?? []);
      const refreshed = await api.get(`/products/${slug}`);
      setProduct(refreshed);
      setReviewForm({ rating: 5, comment: '' });
      setReviewStatus('idle');
      notify('نظر شما ثبت شد. سپاس از بازخوردتان.');
    } catch (err) {
      setReviewStatus('error');
      notify(err.message, 'error');
    }
  };

  if (status === 'loading') return <Loading label="در حال بارگذاری محصول…" className="min-h-[60vh]" />;
  if (status === 'error') {
    return (
      <div className="container-page py-16">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
        <p className="mt-4 text-center text-sm">
          <Link to="/shop" className="text-racing hover:underline">
            بازگشت به فروشگاه
          </Link>
        </p>
      </div>
    );
  }

  const images = [product.image, ...(product.gallery ?? [])].filter(Boolean);
  const inWishlist = wishlist.includes(product.id);
  const threshold = settings?.freeShippingThreshold ?? 0;
  const compatibility = product.compatibility ?? [];

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: 'فروشگاه', to: '/shop' },
          ...(product.category ? [{ label: product.category.name, to: `/category/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      {product.isDemo && (
        <div className="mt-5">
          <NoteBanner tone="demo">
            این محصول «داده نمایشی» است و برای آزمون مسیر خرید ثبت شده است؛ مشخصات و قیمت آن را پیش از انتشار
            فروشگاه با اطلاعات واقعی جایگزین کنید.
          </NoteBanner>
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`تصویر ${index + 1} از ${product.name}`}
                  aria-current={index === activeImage}
                  className={`size-16 overflow-hidden rounded-xl border transition sm:size-20 ${
                    index === activeImage ? 'border-racing' : 'border-line hover:border-racing/50'
                  }`}
                >
                  <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase panel */}
        <div>
          {product.brand?.name && (
            <Link
              to={`/shop?brand=${product.brand.slug}`}
              className="text-xs font-bold uppercase tracking-wide text-racing transition hover:text-racing-deep"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-extrabold leading-snug sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/55">
            {product.partNumber && (
              <span>
                شماره فنی: <span dir="ltr" className="font-semibold text-ink/75">{product.partNumber}</span>
              </span>
            )}
            {product.category && <span>دسته: {product.category.name}</span>}
          </div>

          {product.shortDescription && (
            <p className="mt-3 text-sm leading-7 text-ink/65">{product.shortDescription}</p>
          )}

          <div className="mt-4">
            <Rating value={product.rating} count={product.reviewCount} size={16} />
            {!product.reviewCount && <p className="text-xs text-ink/50">هنوز نظری برای این محصول ثبت نشده است.</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-extrabold">{formatToman(product.price)}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-sm text-ink/40 line-through">{formatToman(product.compareAtPrice)}</span>
                <span className="rounded-md bg-racing px-2.5 py-1 text-[11px] font-bold text-white">
                  ٪{product.discountPercent.toLocaleString('fa-IR')} تخفیف
                </span>
              </>
            )}
          </div>

          <p className={`mt-4 text-sm ${product.inStock ? 'text-emerald-700' : 'text-red-600'}`}>
            {product.inStock
              ? product.stock <= 5
                ? `تنها ${product.stock.toLocaleString('fa-IR')} عدد در انبار باقی مانده است`
                : 'موجود در انبار'
              : 'این محصول در حال حاضر موجود نیست'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(product.stock, 1)} />
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => addToCart(product, quantity)}
              className="btn btn-primary flex-1 px-8 py-3 sm:flex-none"
            >
              <ShoppingCart size={17} strokeWidth={2} />
              {product.inStock ? 'افزودن به سبد خرید' : 'ناموجود'}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={inWishlist}
              className="btn btn-outline px-4 py-3"
            >
              <Heart size={17} strokeWidth={1.9} className={inWishlist ? 'fill-racing text-racing' : ''} />
              {inWishlist ? 'در علاقه‌مندی‌ها' : 'علاقه‌مندی'}
            </button>
          </div>

          <ul className="mt-6 space-y-2.5 text-xs text-ink/65">
            <li className="flex items-center gap-2">
              <Truck size={15} strokeWidth={1.8} className="text-racing" />
              {threshold > 0
                ? `ارسال رایگان برای سفارش‌های بالای ${formatToman(threshold)}`
                : 'هزینه ارسال در مرحله پرداخت محاسبه می‌شود'}
            </li>
            {product.warranty && (
              <li className="flex items-center gap-2">
                <BadgeCheck size={15} strokeWidth={1.8} className="text-racing" />
                {product.warranty}
              </li>
            )}
            <li className="flex items-center gap-2">
              <RefreshCcw size={15} strokeWidth={1.8} className="text-racing" />
              ضمانت بازگشت کالا طبق شرایط فروشگاه
            </li>
          </ul>
        </div>
      </div>

      {/* Detail tabs */}
      <section className="mt-14">
        <div className="flex flex-wrap gap-2 border-b border-line">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'border-racing text-racing'
                  : 'border-transparent text-ink/55 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div className="max-w-3xl text-sm leading-8 text-ink/75">
              <p className="whitespace-pre-line">{product.description || 'توضیحی برای این محصول ثبت نشده است.'}</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <dl className="grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
              {product.partNumber && <SpecRow label="شماره فنی" value={product.partNumber} ltr />}
              {product.brand?.name && <SpecRow label="برند" value={product.brand.name} />}
              {product.origin && <SpecRow label="کشور سازنده" value={product.origin} />}
              {product.warranty && <SpecRow label="گارانتی" value={product.warranty} />}
              {(product.specs ?? []).map((item) => (
                <SpecRow key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
              ))}
            </dl>
          )}

          {activeTab === 'fitment' && (
            <div className="max-w-3xl">
              {compatibility.length ? (
                <>
                  <p className="mb-4 flex items-center gap-2 text-sm text-ink/65">
                    <Car size={16} strokeWidth={1.9} className="text-racing" />
                    این قطعه با خودروهای زیر سازگار است:
                  </p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {compatibility.map((item) => (
                      <li
                        key={`${item.make.slug}-${item.model.slug}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm"
                      >
                        <span className="font-semibold">
                          {item.make.name} {item.model.name}
                        </span>
                        <span className="text-[11px] text-ink/50">
                          {item.yearFrom?.toLocaleString('fa-IR', { useGrouping: false })} تا{' '}
                          {item.yearTo?.toLocaleString('fa-IR', { useGrouping: false })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm leading-7 text-ink/60">
                  سازگاری این قطعه با مدل‌های خودرو ثبت نشده است؛ پیش از خرید با پشتیبانی تماس بگیرید.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-10 border-t border-line pt-10">
        <h2 className="text-lg font-extrabold">نظرات خریداران</h2>

        {reviews.length ? (
          <ul className="mt-5 space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">{review.author}</span>
                  <span className="text-[11px] text-ink/45">{formatDateTime(review.createdAt)}</span>
                </div>
                <span className="mt-1 flex items-center gap-0.5" aria-label={`امتیاز ${review.rating} از ۵`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={13}
                      strokeWidth={1.4}
                      className={star <= review.rating ? 'fill-star text-star' : 'text-line'}
                    />
                  ))}
                </span>
                {review.comment && <p className="mt-2 text-sm leading-7 text-ink/70">{review.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink/55">هنوز نظری ثبت نشده است. اولین نفری باشید که تجربه‌اش را می‌نویسد.</p>
        )}

        <div className="mt-8 max-w-xl">
          {user ? (
            <form onSubmit={submitReview} className="card space-y-4 p-5">
              <h3 className="text-sm font-extrabold">ثبت نظر شما</h3>
              <div>
                <label htmlFor="review-rating" className="mb-1.5 block text-xs font-semibold text-ink/70">
                  امتیاز شما
                </label>
                <select
                  id="review-rating"
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((form) => ({ ...form, rating: Number(event.target.value) }))}
                  className="field"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value.toLocaleString('fa-IR')} از ۵
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="review-comment" className="mb-1.5 block text-xs font-semibold text-ink/70">
                  متن نظر (اختیاری)
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((form) => ({ ...form, comment: event.target.value }))}
                  className="field"
                  placeholder="تجربه خود از این قطعه را بنویسید…"
                />
              </div>
              <button type="submit" disabled={reviewStatus === 'loading'} className="btn btn-primary">
                {reviewStatus === 'loading' ? 'در حال ثبت…' : 'ثبت نظر'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-ink/60">
              برای ثبت نظر ابتدا{' '}
              <Link to="/login" className="text-racing hover:underline">
                وارد حساب کاربری
              </Link>{' '}
              شوید.
            </p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-lg font-extrabold">محصولات مرتبط</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SpecRow({ label, value, ltr = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
      <dt className="text-xs text-ink/50">{label}</dt>
      <dd className="text-sm font-semibold" dir={ltr ? 'ltr' : undefined}>
        {value}
      </dd>
    </div>
  );
}
