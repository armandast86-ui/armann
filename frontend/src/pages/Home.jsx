import Hero from '../components/home/Hero';
import ServiceBar from '../components/home/ServiceBar';
import CategoryGrid from '../components/home/CategoryGrid';
import ProductRail from '../components/home/ProductRail';
import PromoBanners from '../components/home/PromoBanners';
import ValueProps from '../components/home/ValueProps';
import MagazinePreview from '../components/home/MagazinePreview';

export default function Home() {
  return (
    <>
      <Hero />
      <ServiceBar />
      <CategoryGrid />

      <ProductRail
        eyebrow="انتخاب مشتریان"
        title="پرفروش‌ترین محصولات"
        subtitle="پرطرفدارترین قطعات خودرو بر پایه سفارش‌های ثبت‌شده"
        link={{ to: '/shop?sort=best-selling', label: 'مشاهده همه محصولات' }}
        params={{ sort: 'best-selling' }}
        limit={6}
      />

      <PromoBanners />
      <ValueProps />
      <MagazinePreview />
    </>
  );
}
