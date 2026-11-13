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
          {houses.map((house) => {
            // "From" price: the cheapest way to spend this weekend there, i.e. the cheapest unit
            // (or smaller-group price) for the smallest group. Venues show their party price instead.
            const quote = isVenue(house) ? undefined : quoteStay(house, checkIn, checkOut, 1);
            const parts = quote?.units?.filter(Boolean) ?? [];
            return (
              <div key={house.id} className={`${houses.length > 1 ? 'w-[85%]' : 'w-full'} shrink-0 snap-start sm:w-auto`}>
                <HouseCard
                  house={house}
                  destinationName={destinationOf(house)?.name}
                  quote={quote}
                  fromPrice
                  quoteLabel={parts.length ? t('fromLabelUnit', { unit: parts.join(' + ') }) : t('fromLabel')}
                  linkQuery={{ checkIn: toDateParam(checkIn), checkOut: toDateParam(checkOut) }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
