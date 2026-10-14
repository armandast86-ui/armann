import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatToman } from '../../lib/format';
import Rating from './Rating';

export default function ProductCard({ product, compact = false }) {
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const inWishlist = wishlist.includes(product.id);
  const outOfStock = !product.inStock;

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition duration-300 hover:border-racing/40 hover:shadow-[var(--shadow-soft)]">
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block" aria-label={product.name}>
          {/* Fixed aspect container keeps the grid from shifting while images load */}
          <div className="relative aspect-square overflow-hidden bg-surface">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-ink/40">بدون تصویر</div>
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute top-2.5 start-2.5 flex flex-col items-start gap-1.5">
          {product.discountPercent > 0 && (
            <span className="rounded-md bg-racing px-2 py-1 text-[10px] font-bold text-white">
              ٪{product.discountPercent.toLocaleString('fa-IR')} تخفیف
            </span>
          )}
          {product.isNew && !product.discountPercent && (
            <span className="rounded-md bg-carbon px-2 py-1 text-[10px] font-bold text-white">جدید</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={inWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          aria-pressed={inWishlist}
          className="absolute top-2.5 end-2.5 rounded-full border border-line bg-white/90 p-2 text-ink/60 transition hover:border-racing hover:text-racing"
        >
          <Heart size={15} strokeWidth={1.8} className={inWishlist ? 'fill-racing text-racing' : ''} />
        </button>

        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-carbon/85 py-1.5 text-center text-[11px] font-semibold text-white">
            ناموجود
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {product.brand?.name && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-racing">{product.brand.name}</span>
        )}
        <h3 className="line-clamp-2 min-h-10 text-[13px] font-bold leading-5 sm:text-sm">
          <Link to={`/product/${product.slug}`} className="transition hover:text-racing">
            {product.name}
          </Link>
        </h3>

        {product.partNumber && (
          <span dir="ltr" className="text-[10px] tracking-wide text-ink/40">
            {product.partNumber}
          </span>
        )}

        {!compact && product.shortDescription && (
          <p className="line-clamp-2 text-xs leading-6 text-ink/55">{product.shortDescription}</p>
        )}

        <Rating value={product.rating} count={product.reviewCount} />

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex flex-wrap items-baseline gap-2">
            {product.compareAtPrice && (
              <span className="text-[11px] text-ink/40 line-through">{formatToman(product.compareAtPrice)}</span>
            )}
            <span className="text-sm font-extrabold sm:text-[15px]">{formatToman(product.price)}</span>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product, 1)}
            className="btn btn-primary w-full py-2 text-[11px] sm:text-xs"
          >
            <ShoppingCart size={14} strokeWidth={2} />
            {outOfStock ? 'ناموجود' : 'افزودن به سبد خرید'}
          </button>
        </div>
      </div>
    </article>
  );
}
