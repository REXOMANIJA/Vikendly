import { ViewTransition } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import SectionHeading from '@/components/SectionHeading';
import type { Category } from '@/types';

/**
 * "Kakav vikend želite?" tiles. Each category has a photo in /public/images/categories/<id>.jpg
 * (free Unsplash photos, see PHOTO_CREDITS.md). Replace a file to change its picture.
 */
export default function Categories({ categories }: { categories: Category[] }) {
  const t = useTranslations('categories');

  return (
    <section id="categories" className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeading title={t('title')} className="mb-8" />

        {/* Phones: 2 per row so all six are visible at once. Tablet and desktop: 3 per row. */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={{ pathname: '/search', query: { category: category.slug } }}
                transitionTypes={['nav-forward']}
                className="group block h-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-primary/10 transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-accent-dark md:rounded-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* Same name as the banner on the search page: the photo grows into it */}
                  <ViewTransition name={`category-${category.id}`} share="vk-morph" default="none">
                    <Image
                      src={`/images/categories/${category.id}.jpg`}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      quality={70}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </ViewTransition>
                </div>
                <p className="px-3 py-2.5 font-serif text-base font-bold leading-tight text-primary group-hover:text-accent-dark sm:text-lg md:px-5 md:py-4 md:text-xl">
                  {t(category.id as 'mountain')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
