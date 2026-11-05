import { useTranslations } from 'next-intl';
import { MountainSnow, PartyPopper, Sailboat, WavesLadder, Users, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import SectionHeading from '@/components/SectionHeading';
import { getCategories } from '@/lib/data';

const icons: Record<string, LucideIcon> = {
  mountain: MountainSnow,
  party: PartyPopper,
  lake: Sailboat,
  pool: WavesLadder,
  family: Users,
  romantic: Heart,
};

export default function Categories() {
  const t = useTranslations('categories');
  const categories = getCategories();

  return (
    <section id="categories" className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeading title={t('title')} className="mb-8" />

        {/* Phones: one swipeable row. Desktop: all six in a row. */}
        <ul className="-mx-4 flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {categories.map((category) => {
            const Icon = icons[category.id] ?? MountainSnow;
            return (
              <li key={category.id} className="shrink-0">
                <Link
                  href={{ pathname: '/search', query: { category: category.slug } }}
                  className="group flex h-full w-36 flex-col items-start gap-4 rounded-2xl border border-primary/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg lg:w-auto"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-accent group-hover:text-white">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="font-medium leading-snug text-text">
                    {t(category.id as 'mountain')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
