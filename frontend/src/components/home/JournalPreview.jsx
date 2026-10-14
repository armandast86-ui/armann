import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import SectionHeading from '../ui/SectionHeading';
import { EmptyState, SkeletonGrid } from '../ui/States';
import { formatDate } from '../../lib/format';

export default function JournalPreview() {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/articles')
      .then((data) => {
        if (!cancelled) setArticles(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container-page">
        <SectionHeading
          title="مجله زیبایی"
          subtitle="راهنماهای کوتاه برای انتخاب و استفاده درست از محصولات"
          link={{ to: '/journal', label: 'همه مقاله‌ها' }}
        />

        {articles === null && <SkeletonGrid count={3} />}
        {articles?.length === 0 && (
          <EmptyState
            title="هنوز مقاله‌ای منتشر نشده است"
            description="به‌زودی مقاله‌های تازه در مجله زیبایی منتشر می‌شود."
          />
        )}
        {articles && articles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <article key={article.slug} className="group card overflow-hidden">
                <Link to={`/journal/${article.slug}`} className="block">
                  <div className="aspect-[16/10] overflow-hidden bg-cream">
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-95"
                    />
                  </div>
                </Link>
                <div className="space-y-2 p-5">
                  <div className="flex items-center gap-2 text-[11px] text-ink/50">
                    <span>{formatDate(article.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه</span>
                  </div>
                  <h3 className="text-sm font-bold leading-7">
                    <Link to={`/journal/${article.slug}`} className="transition hover:text-burgundy">
                      {article.title}
                    </Link>
                  </h3>
                  <p className="line-clamp-2 text-xs leading-6 text-ink/60">{article.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
