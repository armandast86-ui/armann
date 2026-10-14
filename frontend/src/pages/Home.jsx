import HeroSlider from '../components/home/HeroSlider';
import BenefitsBar from '../components/home/BenefitsBar';
import CategoryGrid from '../components/home/CategoryGrid';
import PromoBanner from '../components/home/PromoBanner';
import ProductRail from '../components/home/ProductRail';
import SkincareFeature from '../components/home/SkincareFeature';
import JournalPreview from '../components/home/JournalPreview';

export default function Home() {
  return (
    <>
      <HeroSlider />
      <BenefitsBar />
      <CategoryGrid />
      <PromoBanner />

      <ProductRail
        eyebrow="انتخاب مشتریان"
        title="پرفروش‌ترین محصولات"
        subtitle="پرطرفدارترین محصولات فروشگاه بر پایه سفارش‌های ثبت‌شده"
        link={{ to: '/shop?sort=best-selling', label: 'مشاهده همه محصولات' }}
        params={{ sort: 'best-selling' }}
        emptyTitle="هنوز سفارشی ثبت نشده است"
        emptyDescription="پس از ثبت نخستین سفارش‌ها، پرفروش‌ترین محصولات همین‌جا نمایش داده می‌شوند."
      />

      <ProductRail
        eyebrow="تازه‌ها"
        title="تازه رسیده‌ها"
        subtitle="جدیدترین محصولاتی که به فروشگاه اضافه شده‌اند"
        link={{ to: '/shop?sort=newest', label: 'مشاهده همه محصولات' }}
        params={{ sort: 'newest' }}
      />

      <ProductRail
        eyebrow="تخفیف‌های فعال"
        title="پیشنهادهای ویژه"
        subtitle="محصولاتی که در حال حاضر تخفیف دارند"
        link={{ to: '/shop?onSale=true', label: 'مشاهده همه تخفیف‌ها' }}
        params={{ onSale: true, sort: 'discount' }}
        emptyTitle="در حال حاضر تخفیف فعالی وجود ندارد"
        emptyDescription="به‌محض فعال‌شدن تخفیف‌ها، محصولات تخفیف‌دار در این بخش نمایش داده می‌شوند."
      />

      <SkincareFeature />
      <JournalPreview />
    </>
  );
}
