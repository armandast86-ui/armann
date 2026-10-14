import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Heart, Minus, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { formatDateTime, formatToman } from '../lib/format';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Rating from '../components/ui/Rating';
import QuantityStepper from '../components/ui/QuantityStepper';
import ProductCard from '../components/ui/ProductCard';
import { ErrorState, Loading, NoteBanner } from '../components/ui/States';
import { Star } from 'lucide-react';

export default function ProductDetails() {
  const { slug } = useParams();
  const { addToCart, toggleWishlist, wishlist, user, notify, settings } = useApp();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewStatus, setReviewStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setQuantity(1);
    setActiveImage(0);
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
        <ErrorState
          message={error}
          onRetry={() => window.location.reload()}
        />
        <p className="mt-4 text-center text-sm">
          <Link to="/shop" className="text-burgundy hover:underline">
            بازگشت به فروشگاه
          </Link>
        </p>
      </div>
    );
  }

  const images = [product.image, ...(product.gallery ?? [])].filter(Boolean);
  const inWishlist = wishlist.includes(product.id);
  const threshold = settings?.freeShippingThreshold ?? 0;

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: 'فروشگاه', to: '/shop' },
          ...(product.category ? [{ label: product.category.name, to: `/category/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.5rem] border border-line bg-white">
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
                    index === activeImage ? 'border-burgundy' : 'border-line hover:border-rose'
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
              className="text-xs text-rose-ink transition hover:text-burgundy"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-extrabold leading-snug text-ink sm:text-3xl">{product.name}</h1>
          {product.shortDescription && (
            <p className="mt-3 text-sm leading-7 text-ink/65">{product.shortDescription}</p>
          )}

          <div className="mt-4">
            <Rating value={product.rating} count={product.reviewCount} size={16} />
            {!product.reviewCount && (
              <p className="text-xs text-ink/50">هنوز نظری برای این محصول ثبت نشده است.</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-extrabold text-burgundy">{formatToman(product.price)}</span>
            {product.compareAtPrice && (
              <>
                <span className="text-sm text-ink/45 line-through">{formatToman(product.compareAtPrice)}</span>
                <span className="rounded-full bg-blush px-3 py-1 text-[11px] font-medium text-ink">
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
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(product.stock, 1)}
            />
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => addToCart(product, quantity)}
              className="btn btn-primary flex-1 px-8 py-3 sm:flex-none"
            >
              <ShoppingBag size={17} strokeWidth={1.8} />
              {product.inStock ? 'افزودن به سبد خرید' : 'ناموجود'}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={inWishlist}
              className="btn btn-outline px-4 py-3"
            >
              <Heart size={17} strokeWidth={1.8} className={inWishlist ? 'fill-rose text-rose' : ''} />
              {inWishlist ? 'در علاقه‌مندی‌ها' : 'علاقه‌مندی'}
            </button>
          </div>

          <ul className="mt-6 space-y-2 text-xs text-ink/65">
            <li className="flex items-center gap-2">
              <Truck size={15} strokeWidth={1.6} className="text-rose-ink" />
              {threshold > 0
                ? `ارسال رایگان برای سفارش‌های بالای ${formatToman(threshold)}`
                : 'هزینه ارسال در مرحله پرداخت محاسبه می‌شود'}
            </li>
            <li className="flex items-center gap-2">
              <Check size={15} strokeWidth={1.8} className="text-rose-ink" />
              پرداخت در این نسخه به‌صورت نمایشی ثبت می‌شود
            </li>
          </ul>

          {product.isDemo && (
            <div className="mt-6">
              <NoteBanner tone="demo">
                این محصول «داده نمایشی» است و برای آزمون فروشگاه ثبت شده است. قیمت و موجودی آن واقعی نیست.
              </NoteBanner>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="text-base font-bold">توضیحات محصول</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-ink/75">{product.description}</p>
          </section>

          {product.usage && (
            <section>
              <h2 className="text-base font-bold">روش استفاده</h2>
              <p className="mt-3 text-sm leading-8 text-ink/75">{product.usage}</p>
            </section>
          )}

          {product.ingredients && (
            <section>
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Sparkles size={16} strokeWidth={1.6} className="text-gold" />
                ترکیبات
              </h2>
              <p className="mt-3 text-sm leading-8 text-ink/75">{product.ingredients}</p>
            </section>
          )}

          <section>
            <h2 className="text-base font-bold">نظرات مشتریان</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-ink/60">
                هنوز نظری ثبت نشده است. می‌توانید اولین نظر را بنویسید.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{review.author}</span>
                      <span className="text-[11px] text-ink/50">{formatDateTime(review.createdAt)}</span>
                    </div>
                    <span className="mt-2 flex items-center gap-0.5" aria-label={`امتیاز ${review.rating} از ۵`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          strokeWidth={1.4}
                          className={star <= review.rating ? 'fill-gold text-gold' : 'text-line'}
                        />
                      ))}
                    </span>
                    {review.comment && <p className="mt-2 text-sm leading-7 text-ink/75">{review.comment}</p>}
                  </li>
                ))}
              </ul>
            )}

            {user ? (
              <form onSubmit={submitReview} className="card mt-6 space-y-4 p-5">
                <h3 className="text-sm font-bold">ثبت نظر شما</h3>
                <div className="flex items-center gap-2">
                  <label htmlFor="review-rating" className="text-xs text-ink/70">
                    امتیاز
                  </label>
                  <select
                    id="review-rating"
                    value={reviewForm.rating}
                    onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}
                    className="field w-24 py-2"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value.toLocaleString('fa-IR')} ستاره
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="review-comment" className="mb-1 block text-xs text-ink/70">
                    متن نظر (اختیاری)
                  </label>
                  <textarea
                    id="review-comment"
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                    className="field"
                    placeholder="تجربه‌تان از این محصول را بنویسید…"
                  />
                </div>
                <button type="submit" disabled={reviewStatus === 'loading'} className="btn btn-primary">
                  {reviewStatus === 'loading' ? 'در حال ثبت…' : 'ثبت نظر'}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-ink/60">
                برای ثبت نظر{' '}
                <Link to="/login" className="text-burgundy hover:underline">
                  وارد حساب خود شوید
                </Link>
                .
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-bold">مشخصات محصول</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {product.brand?.name && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink/60">برند</dt>
                  <dd>{product.brand.name}</dd>
                </div>
              )}
              {product.category?.name && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink/60">دسته‌بندی</dt>
                  <dd>{product.category.name}</dd>
                </div>
              )}
              {(product.specs ?? []).map((spec) => (
                <div key={spec.label} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink/60">{spec.label}</dt>
                  <dd className="text-end">{spec.value}</dd>
                </div>
              ))}
            </dl>
            {(!product.specs || product.specs.length === 0) && (
              <p className="mt-3 text-xs text-ink/55">
                مشخصات تکمیلی این محصول در پنل مدیریت قابل ثبت است.
              </p>
            )}
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-extrabold text-burgundy">
            <Minus size={16} className="text-rose" />
            محصولات مرتبط
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
