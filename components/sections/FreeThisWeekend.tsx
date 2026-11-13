import { useLocale, useTranslations } from 'next-intl';
import HouseCard from '@/components/cards/HouseCard';
import SectionHeading from '@/components/SectionHeading';
import { isVenue, quoteStay } from '@/lib/pricing';
import { formatDateRange, getUpcomingWeekend, toDateParam } from '@/lib/dates';
import type { Destination, House } from '@/types';

// Homepage prices are for a full house (the per-person price is what groups compare);
// the search page uses the guest count the visitor entered.
export default function FreeThisWeekend({
  houses,
  destinations,
}: {
  houses: House[];
  destinations: Destination[];
}) {
  const t = useTranslations('freeThisWeekend');
  const locale = useLocale();
  const destinationOf = (house: House) => destinations.find((d) => d.id === house.destinationId);
  const { checkIn, checkOut } = getUpcomingWeekend();
  const dates = formatDateRange(checkIn, checkOut, locale);

  return (
    <section id="houses" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow={dates}
          title={t('title')}
          subtitle={t('subtitle')}
          action={{
            href: {
              pathname: '/search',
              query: { checkIn: toDateParam(checkIn), checkOut: toDateParam(checkOut) },
            },
            label: t('seeAll'),
          }}
        />
        {/* Phones: one row you swipe sideways (the next card peeks in), so the homepage stays
            short; tablet/desktop: a normal grid */}
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
          {houses.map((house) => (
            <div key={house.id} className={`${houses.length > 1 ? 'w-[85%]' : 'w-full'} shrink-0 snap-start sm:w-auto`}>
            <HouseCard
              house={house}
              destinationName={destinationOf(house)?.name}
              // Venues show their "from" party price instead of a weekend stay
              quote={isVenue(house) ? undefined : quoteStay(house, checkIn, checkOut, house.capacity)}
              quoteLabel={t('quoteLabel', { count: house.capacity })}
              guests={house.capacity}
              linkQuery={{
                checkIn: toDateParam(checkIn),
                checkOut: toDateParam(checkOut),
                guests: house.capacity,
              }}
            />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
