import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import DestinationCard from '@/components/cards/DestinationCard';
import SectionHeading from '@/components/SectionHeading';
import { Link } from '@/i18n/navigation';
import { pickHomepageDestinations } from '@/lib/destinations';
import type { Destination } from '@/types';

/**
 * Homepage destinations: only the most popular ones (most houses), so the section stays
 * the same size with 9 or 90 destinations. Everything else is on /destinacije.
 */
export default function Destinations({
  destinations,
  houseCounts,
}: {
  /** All destinations, in the admin's order */
  destinations: Destination[];
  /** destination id → number of published houses */
  houseCounts: Record<string, number>;
}) {
  const t = useTranslations('destinations');
  const shown = pickHomepageDestinations(destinations, houseCounts);
  const allLink = { href: '/destinations' as const, label: t('seeAll', { count: destinations.length }) };

  return (
    <section id="destinations" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeading title={t('title')} subtitle={t('subtitle')} action={allLink} />

        {/* First destination is a large featured tile; the rest fill a 4-column grid around it */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:auto-rows-[200px]">
          {shown.map((destination, i) => (
            <DestinationCard
              key={destination.id}
              name={destination.name}
              slug={destination.slug}
              image={destination.imageUrl ?? `/images/destination-${destination.slug}.svg`}
              country={t(`countries.${destination.country}`)}
              houseCount={t('houseCount', { count: houseCounts[destination.id] ?? 0 })}
              featured={i === 0}
              className={i === 0 ? 'col-span-2 min-h-64 lg:row-span-2' : ''}
            />
          ))}
        </div>

        {destinations.length > shown.length && (
          <div className="mt-8 text-center">
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-primary px-6 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
            >
              {allLink.label} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
