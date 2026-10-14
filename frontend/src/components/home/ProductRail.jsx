import { useEffect, useState } from 'react';
import { api, queryString } from '../../lib/api';
import ProductCard from '../ui/ProductCard';
import SectionHeading from '../ui/SectionHeading';
import { EmptyState, ErrorState, SkeletonGrid } from '../ui/States';

/** One homepage shelf backed by a real catalogue query. */
export default function ProductRail({ eyebrow, title, subtitle, link, params, emptyTitle, emptyDescription }) {
  const [state, setState] = useState({ status: 'loading', items: [] });
  const serialized = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', items: [] });
    api
      .get(`/products${queryString({ limit: 4, ...params })}`)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', items: data.items ?? [] });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', items: [], error: error.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return (
    <section className="py-10 lg:py-12">
      <div className="container-page">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} link={link} />

        {state.status === 'loading' && <SkeletonGrid count={4} />}
        {state.status === 'error' && <ErrorState message={state.error} />}
        {state.status === 'ready' &&
          (state.items.length === 0 ? (
            <EmptyState
              title={emptyTitle ?? 'هنوز محصولی در این بخش نیست'}
              description={emptyDescription ?? 'به‌زودی محصولات تازه به این بخش اضافه می‌شوند.'}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {state.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ))}
      </div>
    </section>
  );
}
