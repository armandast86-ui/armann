import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { ErrorState, Loading, NoteBanner } from '../components/ui/States';
import { formatDate } from '../lib/format';

export default function ArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get(`/articles/${slug}`)
      .then((data) => {
        if (!cancelled) {
          setArticle(data);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === 'loading') return <Loading className="min-h-[50vh]" label="در حال بارگذاری مقاله…" />;
  if (status === 'error') {
    return (
      <div className="container-page py-16">
        <ErrorState message={error} />
        <p className="mt-4 text-center text-sm">
          <Link to="/journal" className="text-racing hover:underline">
            بازگشت به مجله زیبایی
          </Link>
        </p>
      </div>
    );
  }

  return (
    <article className="container-page py-10">
      <Breadcrumbs items={[{ label: 'مجله زیبایی', to: '/journal' }, { label: article.title }]} />

      <header className="mx-auto mt-6 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] text-ink/50">
          <span>{formatDate(article.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه</span>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold leading-snug text-racing sm:text-3xl">{article.title}</h1>
        <p className="mt-4 text-sm leading-8 text-ink/65">{article.excerpt}</p>
      </header>

      <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-[1.5rem] border border-line">
        <img src={article.image} alt={article.title} className="aspect-[16/9] w-full object-cover" />
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-6 text-sm leading-9 text-ink/80">
        {(article.body ?? '').split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-6">
        {article.isDemo && (
          <NoteBanner tone="demo">
            این مقاله «داده نمایشی» است و برای آزمون بخش مجله ثبت شده است؛ متن آن جایگزین مشاوره تخصصی پوست و مو
            نیست.
          </NoteBanner>
        )}
        <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="text-sm leading-7 text-ink/70">محصولات مرتبط با این مقاله را در فروشگاه ببینید.</p>
          <Link to="/shop" className="btn btn-primary">
            مشاهده محصولات
          </Link>
        </div>
      </div>
    </article>
  );
}
