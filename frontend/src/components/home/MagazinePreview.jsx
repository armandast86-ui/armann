import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import SectionHeading from '../ui/SectionHeading';

/** Three newest magazine articles — tips for choosing and maintaining parts. */
export default function MagazinePreview() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/articles')
      .then((data) => {
        if (!cancelled) setArticles((data ?? []).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!articles.length) return null;

  return (
    <section className="bg-surface py-12 lg:py-16">
      <div className="container-page">
        <SectionHeading
          eyebrow="مجله خودرو"
          title="راهنمای انتخاب و نگهداری قطعات"
          link={{ to: '/journal', label: 'مشاهده همه مقالات' }}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="card group overflow-hidden transition-shadow hover:shadow-[var(--shadow-soft)]">
              <Link to={`/journal/${article.slug}`} className="block">
                <div className="aspect-[16/10] overflow-hidden bg-carbon">
                  <img
                    src={article.image}
                    alt={article.title}
                    loading="lazy"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <h3 className="line-clamp-2 text-base font-bold leading-7 transition group-hover:text-racing">
                    {article.title}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-6 text-ink/55">{article.excerpt}</p>
                  <p className="flex items-center gap-1.5 pt-1 text-[11px] text-ink/45">
                    <Clock size={12} strokeWidth={2} />
                    {article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه
                    <ArrowLeft size={13} className="ms-auto transition group-hover:-translate-x-0.5" />
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
