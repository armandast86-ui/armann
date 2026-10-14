import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import SectionHeading from '../components/ui/SectionHeading';
import { EmptyState, SkeletonGrid } from '../components/ui/States';
import { formatDate } from '../lib/format';

export default function Journal() {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    api.get('/articles').then((data) => setArticles(data ?? [])).catch(() => setArticles([]));
  }, []);

  return (
    <div className="container-page py-12">
      <SectionHeading
        eyebrow="مجله زیبایی"
        title="راهنمای مراقبت و زیبایی"
        subtitle="مقاله‌های کوتاه درباره انتخاب محصول، روتین پوستی و مراقبت از مو"
      />

      {articles === null && <SkeletonGrid count={3} />}
      {articles?.length === 0 && (
        <EmptyState title="هنوز مقاله‌ای منتشر نشده است" description="به‌زودی مقاله‌های تازه در این بخش منتشر می‌شود." />
      )}

      {articles && articles.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.slug} className="group card flex h-full flex-col overflow-hidden">
              <Link to={`/journal/${article.slug}`} className="block">
                <div className="aspect-[16/10] overflow-hidden bg-surface">
                  <img
                    src={article.image}
                    alt={article.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-95"
                  />
                </div>
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-center gap-2 text-[11px] text-ink/50">
                  <span>{formatDate(article.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه</span>
                </div>
                <h2 className="text-sm font-bold leading-7">
                  <Link to={`/journal/${article.slug}`} className="transition hover:text-racing">
                    {article.title}
                  </Link>
                </h2>
                <p className="text-xs leading-6 text-ink/60">{article.excerpt}</p>
                <Link
                  to={`/journal/${article.slug}`}
                  className="mt-auto pt-3 text-xs font-medium text-racing hover:underline"
                >
                  خواندن مقاله
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
