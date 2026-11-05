import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getHouses, getDestinations, getCategoryBySlug } from '@/lib/data';
import { calculateTotalPrice } from '@/lib/pricing';
import { parseDateParam } from '@/lib/dates';
import { Link } from '@/i18n/navigation';
import HouseCard from '@/components/cards/HouseCard';

type SearchParams = {
  destination?: string;
  category?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  budget?: string;
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('search');
  const tCat = await getTranslations('categories');

  const [houses, destinations] = await Promise.all([getHouses(), getDestinations()]);
  const destinationOf = (id: string) => destinations.find((d) => d.id === id);
  const destination = sp.destination ? destinations.find((d) => d.slug === sp.destination) : undefined;
  const category = sp.category ? await getCategoryBySlug(sp.category) : undefined;
  const guests = sp.guests ? parseInt(sp.guests, 10) || undefined : undefined;
  const budget = sp.budget ? parseInt(sp.budget, 10) || undefined : undefined;
  const checkIn = parseDateParam(sp.checkIn);
  const checkOut = parseDateParam(sp.checkOut);
  const invalidDates = Boolean(checkIn && checkOut && checkOut <= checkIn);
  const canQuote = Boolean(checkIn && checkOut && !invalidDates);

  const results = houses
    .filter((house) => {
      if (destination && house.destinationId !== destination.id) return false;
      if (category && !house.categoryIds.includes(category.id)) return false;
      if (guests && house.capacity < guests) return false;
      return true;
    })
    .map((house) => ({
      house,
      quote:
        canQuote && checkIn && checkOut
          ? calculateTotalPrice(
              house,
              checkIn,
              checkOut,
              guests ?? 1,
              destinationOf(house.destinationId)
            )
          : undefined,
    }))
    // Budget is for the whole stay, so it only applies once dates are known
    .filter(({ quote }) => !(budget && quote && quote.total > budget));

  const heading = [destination?.name, category ? tCat(category.id as 'mountain') : undefined]
    .filter(Boolean)
    .join(' · ');
  const hasAnyFilter = Object.values(sp).some(Boolean);

  // Passed on to the house page so its calculator starts with the same stay
  const stayQuery: Record<string, string> = {};
  if (canQuote && sp.checkIn && sp.checkOut) {
    stayQuery.checkIn = sp.checkIn;
    stayQuery.checkOut = sp.checkOut;
  }
  if (guests) stayQuery.guests = String(guests);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">
            {heading || t('title')}
          </h1>
          <p className="text-text/70 mt-2">{t('found', { count: results.length })}</p>
        </div>
        {hasAnyFilter && (
          <Link href="/search" className="text-accent-dark font-medium hover:underline">
            {t('clearFilters')}
          </Link>
        )}
      </div>

      {invalidDates && (
        <p className="mb-6 rounded-lg bg-accent/10 text-accent-dark px-4 py-3">{t('invalidDates')}</p>
      )}

      {results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-text/70">{t('noResults')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(({ house, quote }) => (
            <HouseCard
              key={house.id}
              house={house}
              destinationName={destinationOf(house.destinationId)?.name}
              quote={quote}
              guests={guests}
              linkQuery={stayQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
