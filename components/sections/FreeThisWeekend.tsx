import { useLocale, useTranslations } from 'next-intl';
import HouseCard from '@/components/cards/HouseCard';
import SectionHeading from '@/components/SectionHeading';
import { getDestinationById, getFreeThisWeekend } from '@/lib/data';
import { calculateTotalPrice } from '@/lib/pricing';
import { formatDateRange, getUpcomingWeekend, toDateParam } from '@/lib/dates';

// Homepage prices are for a full house (the per-person price is what groups compare);
// the search page uses the guest count the visitor entered.
export default function FreeThisWeekend() {
  const t = useTranslations('freeThisWeekend');
  const locale = useLocale();
  const houses = getFreeThisWeekend();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {houses.map((house) => (
            <HouseCard
              key={house.id}
              house={house}
              quote={calculateTotalPrice(
                house,
                checkIn,
                checkOut,
                house.capacity,
                getDestinationById(house.destinationId)
              )}
              quoteLabel={t('quoteLabel', { count: house.capacity })}
              guests={house.capacity}
              linkQuery={{
                checkIn: toDateParam(checkIn),
                checkOut: toDateParam(checkOut),
                guests: house.capacity,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
