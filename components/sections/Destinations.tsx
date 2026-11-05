import { useTranslations } from 'next-intl';
import DestinationCard from '@/components/cards/DestinationCard';
import SectionHeading from '@/components/SectionHeading';
import type { Destination } from '@/types';

export default function Destinations({
  destinations,
  houseCounts,
}: {
  destinations: Destination[];
  /** destination id → number of published houses */
  houseCounts: Record<string, number>;
}) {
  const t = useTranslations('destinations');

  return (
    <section id="destinations" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeading
          title={t('title')}
          subtitle={t('subtitle')}
          action={{ href: '/search', label: t('seeAll') }}
        />

        {/* First destination is a large featured tile; the rest fill a 4-column grid around it */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:auto-rows-[200px]">
          {destinations.map((destination, i) => (
            <DestinationCard
              key={destination.id}
              name={destination.name}
              slug={destination.slug}
              image={`/images/destination-${destination.slug}.svg`}
              country={t(`countries.${destination.country}`)}
              houseCount={t('houseCount', { count: houseCounts[destination.id] ?? 0 })}
              featured={i === 0}
              className={i === 0 ? 'col-span-2 min-h-64 lg:row-span-2' : ''}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
