import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localizedAlternates } from '@/lib/seo';
import { getHouses, getDestinations, getCategories, getCategoryBySlug, getHouseCountsByDestination } from '@/lib/data';
import { getLowestNightlyPrice, isVenue, maxGuestsOf, quoteStay } from '@/lib/pricing';
import { parseDateParam } from '@/lib/dates';
import { slugify } from '@/lib/slug';
import { Link, getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import HouseCard from '@/components/cards/HouseCard';
import { SearchX } from 'lucide-react';
import SearchFilters from '@/components/search/SearchFilters';
import ResultsView from '@/components/search/ResultsView';
import { SORTS, type MapPoint, type SearchValues } from '@/lib/search';
import { ViewTransition } from 'react';
import Image from 'next/image';
import { isVector } from '@/lib/images';

type SearchParams = {
  q?: string;
  /** "1" = only houses we have visited in person */
  verified?: string;
  destination?: string;
  category?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  budget?: string;
  /** price-asc | price-desc | capacity; empty = recommended */
  sort?: string;
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'search' });
  const tCat = await getTranslations({ locale, namespace: 'categories' });
  const destination = sp.destination ? (await getDestinations()).find((d) => d.slug === sp.destination) : undefined;
  const category = sp.category ? await getCategoryBySlug(sp.category) : undefined;

  // Only plain destination or category pages are worth showing in Google; searches with
  // dates, guests, budget or a name are one-off results, so Google follows their links but
  // doesn't list them.
  const onlyOneFilter = Object.keys(sp).filter((k) => sp[k as keyof SearchParams]).length <= 1;
  // A destination or category with no houses yet is an empty page: Google shouldn't list it
  const count = (await getHouses()).filter(
    (h) => (!destination || h.destinationId === destination.id) && (!category || h.categoryIds.includes(category.id))
  ).length;
  const indexable = onlyOneFilter && (!!destination || !!category || Object.keys(sp).length === 0) && count > 0;
  const query = destination ? `?destination=${destination.slug}` : category ? `?category=${category.slug}` : '';

  // Destination and category pages get their own title and description for Google (search.seo)
  const seo = seoTexts(t, destination, category, count);
  const title = seo?.title ?? t('metaTitle');
  const description = seo?.description ?? t('metaDescription');
  // Shared destination/category links show that place's photo (drawings can't be previews)
  const photo = destination?.imageUrl ?? (category ? `/images/categories/${category.id}.jpg` : undefined);

  return {
    title,
    description,
    alternates: localizedAlternates(locale, '/search', query),
    robots: indexable ? undefined : { index: false, follow: true },
    ...(photo && !isVector(photo) ? { openGraph: { title, description, images: [photo] } } : {}),
  };
}

type SearchT = Awaited<ReturnType<typeof getTranslations<'search'>>>;

/**
 * Own title, description and short intro for a page with only a destination or only a category
 * (e.g. /pretraga?category=pool). Undefined for other searches.
 */
function seoTexts(
  t: SearchT,
  destination: { name: string } | undefined,
  category: { id: string } | undefined,
  count: number
) {
  if (destination && !category) {
    const values = { name: destination.name, count };
    return {
      title: t('seo.destination.title', values),
      description: t('seo.destination.description', values),
      text: t('seo.destination.text'),
    };
  }
  if (category && !destination && t.has(`seo.${category.id}.title` as 'seo.pool.title')) {
    const key = category.id as 'pool';
    return { title: t(`seo.${key}.title`), description: t(`seo.${key}.description`), text: t(`seo.${key}.text`) };
  }
  return undefined;
}

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
  const tCountry = await getTranslations('destinations.countries');

  const [houses, destinations, categories, houseCounts] = await Promise.all([
    getHouses(),
    getDestinations(),
    getCategories(),
    getHouseCountsByDestination(),
  ]);
  const destinationOf = (id: string) => destinations.find((d) => d.id === id);
  const destination = sp.destination ? destinations.find((d) => d.slug === sp.destination) : undefined;
  const category = sp.category ? await getCategoryBySlug(sp.category) : undefined;
  const guests = sp.guests ? parseInt(sp.guests, 10) || undefined : undefined;
  const budget = sp.budget ? parseInt(sp.budget, 10) || undefined : undefined;
  const checkIn = parseDateParam(sp.checkIn);
  const checkOut = parseDateParam(sp.checkOut);
  const invalidDates = Boolean(checkIn && checkOut && checkOut <= checkIn);
  const canQuote = Boolean(checkIn && checkOut && !invalidDates);
  const onlyVerified = sp.verified === '1';
  // Name search ignores case and Serbian letters ("cicin" finds "Čičin"); every word has to match
  const query = sp.q?.trim().slice(0, 80) ?? '';
  const queryWords = slugify(query).split('-').filter(Boolean);
  const matchesQuery = (...texts: (string | undefined)[]) => {
    const haystack = texts.map((text) => slugify(text ?? '').replace(/-/g, ' ')).join(' ');
    return queryWords.every((word) => haystack.includes(word));
  };

  const results = houses
    .filter((house) => {
      if (destination && house.destinationId !== destination.id) return false;
      if (category && !house.categoryIds.includes(category.id)) return false;
      // Venues (no beds) count the people their party space takes
      if (guests && maxGuestsOf(house) < guests) return false;
      if (onlyVerified && !house.verifiedAt) return false;
      if (queryWords.length && !matchesQuery(house.name, destinationOf(house.destinationId)?.name)) return false;
      return true;
    })
    .map((house) => ({
      house,
      quote: canQuote && checkIn && checkOut ? quoteStay(house, checkIn, checkOut, guests ?? 1) : undefined,
    }))
    // Budget is for the whole stay, so it only applies once dates are known
    .filter(({ quote }) => !(budget && quote && quote.total > budget));

  // Sorting: price uses the stay total when dates are known, otherwise the lowest nightly price.
  // "Recommended" puts houses we visited in person first, then keeps the alphabetical order.
  const sort = (SORTS as readonly string[]).includes(sp.sort ?? '') ? sp.sort : undefined;
  const priceOf = (r: (typeof results)[number]) => r.quote?.total ?? getLowestNightlyPrice(r.house);
  results.sort((a, b) =>
    sort === 'price-asc'
      ? priceOf(a) - priceOf(b)
      : sort === 'price-desc'
        ? priceOf(b) - priceOf(a)
        : sort === 'capacity'
          ? maxGuestsOf(b.house) - maxGuestsOf(a.house)
          : Number(!!b.house.verifiedAt) - Number(!!a.house.verifiedAt)
  );

  // Empty results: suggest dropping one filter at a time, and show a few other houses
  const removable = (['checkIn', 'budget', 'guests', 'destination', 'category', 'q', 'verified'] as const).filter(
    (key) => sp[key]
  );
  const without = (key: (typeof removable)[number]) =>
    Object.fromEntries(
      Object.entries(sp).filter(([k, v]) => v && k !== key && !(key === 'checkIn' && k === 'checkOut'))
    ) as Record<string, string>;
  const suggestions = results.length === 0 ? houses.slice(0, 3) : [];
  const listedDestinations = destinations.filter((d) => (houseCounts[d.id] ?? 0) > 0);
  const filterValues: SearchValues = Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as SearchValues;

  const intro = !query ? seoTexts(t, destination, category, results.length)?.text : undefined;

  const heading = [query ?`„${query}”` : undefined, destination?.name, category ? tCat(category.id as 'mountain') : undefined]
    .filter(Boolean)
    .join(' · ');

  // Destination or category search gets a photo banner. Its name matches the photo on the card
  // that was clicked, so the photo grows from the card into the banner (see globals.css).
  const banner = destination
    ? {
        name: `destination-${destination.id}`,
        image: destination.imageUrl ?? `/images/destination-${destination.slug}.svg`,
        eyebrow: tCountry(destination.country),
      }
    : category
      ? { name: `category-${category.id}`, image: `/images/categories/${category.id}.jpg`, eyebrow: undefined }
      : undefined;

  // Passed on to the house page so its calculator starts with the same stay
  const stayQuery: Record<string, string> = {};
  if (canQuote && sp.checkIn && sp.checkOut) {
    stayQuery.checkIn = sp.checkIn;
    stayQuery.checkOut = sp.checkOut;
  }
  if (guests) stayQuery.guests = String(guests);

  // Map view: houses with a map pin, with the same price the card shows
  const tCard = await getTranslations('houseCard');
  const euro = (n: number) => `€${Math.round(n)}`;
  const linkSuffix = Object.keys(stayQuery).length ? `?${new URLSearchParams(stayQuery)}` : '';
  const mapPoints: MapPoint[] = results.flatMap(({ house, quote }) => {
    const { lat, lng } = house.location;
    if (lat == null || lng == null) return [];
    const lowest = getLowestNightlyPrice(house);
    const photo = house.photos[0];
    return [
      {
        id: house.id,
        name: house.name,
        place: destinationOf(house.destinationId)?.name,
        lat,
        lng,
        href:
          getPathname({ locale: locale as Locale, href: { pathname: '/houses/[slug]', params: { slug: house.slug } } }) +
          linkSuffix,
        pin: euro(quote ? quote.total : lowest),
        price: quote
          ? `${euro(quote.total)} ${tCard('totalWord')}`
          : `${tCard('from', { price: euro(lowest) })}${isVenue(house) ? tCard('perParty') : tCard('perNight')}`,
        photo: photo ? (isVector(photo) ? photo : `/_next/image?url=${encodeURIComponent(photo)}&w=384&q=70`) : undefined,
      },
    ];
  });

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {banner && (
        <div className="relative mb-6 h-52 overflow-hidden rounded-2xl shadow-md md:h-80 md:rounded-3xl">
          <ViewTransition name={banner.name} share="vk-morph" default="none">
            <Image
              src={banner.image}
              alt=""
              fill
              priority
              unoptimized={isVector(banner.image)}
              quality={70}
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
            />
          </ViewTransition>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-8">
            {banner.eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80 md:text-sm">{banner.eyebrow}</p>
            )}
            <h1 className="font-serif text-3xl font-bold text-balance md:text-5xl">{heading}</h1>
            <p className="mt-1 text-white/85 md:text-lg">{t('found', { count: results.length })}</p>
          </div>
        </div>
      )}

      {!banner && (
        <div className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">{heading || t('title')}</h1>
          <p className="text-text/70 mt-2">{t('found', { count: results.length })}</p>
        </div>
      )}

      {/* Short intro on plain destination / category pages (also helps Google understand the page) */}
      {intro && <p className="-mt-2 mb-6 max-w-3xl text-text/75 md:text-lg">{intro}</p>}

      <SearchFilters values={filterValues} destinations={listedDestinations} categories={categories} />

      {budget && !canQuote && <p className="-mt-4 mb-6 text-sm text-text/60">{t('filters.budgetHint')}</p>}

      {invalidDates && (
        <p className="mb-6 rounded-lg bg-accent/10 text-accent-dark px-4 py-3">{t('invalidDates')}</p>
      )}

      {results.length === 0 ? (
        <div className="py-8 md:py-12">
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-primary/10 md:p-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sand text-primary">
              <SearchX className="size-7" aria-hidden />
            </span>
            <h2 className="mt-5 font-serif text-2xl font-bold text-primary md:text-3xl">{t('empty.title')}</h2>
            {removable.length > 0 && (
              <>
                <p className="mt-2 text-text/70">{t('empty.text')}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {removable.map((key) => (
                    <Link
                      key={key}
                      href={{ pathname: '/search', query: without(key) }}
                      className="rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white"
                    >
                      {t(`empty.without.${key}`)}
                    </Link>
                  ))}
                </div>
                <Link href="/search" className="mt-5 inline-block text-sm font-semibold text-accent-dark hover:underline">
                  {t('empty.clearAll')}
                </Link>
              </>
            )}
          </div>

          {suggestions.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-6 font-serif text-2xl font-bold text-primary">{t('empty.suggestions')}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((house) => (
                  <HouseCard key={house.id} house={house} destinationName={destinationOf(house.destinationId)?.name} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <ResultsView
          points={mapPoints}
          hiddenCount={results.length - mapPoints.length}
          openLabel={t('map.open')}
          noPinText={t('map.noPin', { count: results.length - mapPoints.length })}
        >
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
        </ResultsView>
      )}
    </div>
  );
}
