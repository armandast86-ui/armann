import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatToman } from '../../lib/format';
import Rating from './Rating';

export default function ProductCard({ product, compact = false }) {
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const inWishlist = wishlist.includes(product.id);
  const outOfStock = !product.inStock;

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-soft)]">
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block" aria-label={product.name}>
          {/* Fixed aspect container keeps the grid from shifting while images load */}
          <div className="relative aspect-square overflow-hidden bg-cream">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-95"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-ink/40">بدون تصویر</div>
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute top-3 start-3 flex flex-col items-start gap-1.5">
          {product.discountPercent > 0 && (
            <span className="rounded-full bg-burgundy px-2.5 py-1 text-[11px] font-medium text-white">
              ٪{product.discountPercent.toLocaleString('fa-IR')} تخفیف
            </span>
          )}
          {product.isNew && !product.discountPercent && (
            <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-medium text-ink">جدید</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={inWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          aria-pressed={inWishlist}
          className="absolute top-3 end-3 rounded-full border border-line bg-white/90 p-2 text-ink/70 transition hover:text-rose-ink"
        >
          <Heart size={15} strokeWidth={1.7} className={inWishlist ? 'fill-rose text-rose' : ''} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {product.brand?.name && <span className="text-[11px] text-ink/50">{product.brand.name}</span>}
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-6 sm:text-[0.9375rem]">
          <Link to={`/product/${product.slug}`} className="transition hover:text-burgundy">
            {product.name}
          </Link>
        </h3>

        {!compact && product.shortDescription && (
          <p className="line-clamp-2 text-xs leading-6 text-ink/55">{product.shortDescription}</p>
        )}

        <Rating value={product.rating} count={product.reviewCount} />

        <div className="mt-auto space-y-3 pt-2">
          <div className="flex flex-wrap items-baseline gap-2">
            {product.compareAtPrice && (
              <span className="text-xs text-ink/45 line-through">{formatToman(product.compareAtPrice)}</span>
            )}
            <span className="text-sm font-bold text-burgundy sm:text-base">{formatToman(product.price)}</span>
          </div>

          <p className={`text-[11px] ${outOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
            {outOfStock ? 'ناموجود' : 'موجود در انبار'}
          </p>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product, 1)}
            className="btn btn-primary w-full py-2 text-xs sm:text-[13px]"
          >
            <ShoppingBag size={15} strokeWidth={1.8} />
            {outOfStock ? 'ناموجود' : 'افزودن به سبد خرید'}
          </button>
        </div>
      </div>
    </article>
  );
}
