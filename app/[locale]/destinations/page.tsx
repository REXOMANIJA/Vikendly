import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getDestinations, getHouseCountsByDestination } from '@/lib/data';
import { groupByCountry } from '@/lib/destinations';
import AllDestinations, { type CountryGroup } from '@/components/destinations/AllDestinations';

// Refreshed at least hourly; saving in the admin refreshes it immediately
export const revalidate = 3600;

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'destinations' });
  return { title: `${t('allTitle')} | Vikendly` };
}

export default async function DestinationsPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('destinations');

  const [destinations, counts] = await Promise.all([getDestinations(), getHouseCountsByDestination()]);

  // Within each country: most houses first, then alphabetically
  const sorted = [...destinations].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || a.name.localeCompare(b.name, locale)
  );

  const groups: CountryGroup[] = groupByCountry(sorted).map((g) => ({
    country: g.country,
    label: t(`countries.${g.country}`),
    items: g.destinations.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      image: d.imageUrl ?? `/images/destination-${d.slug}.svg`,
      countryLabel: t(`countries.${d.country}`),
      houseCountLabel: t('houseCount', { count: counts[d.id] ?? 0 }),
      houses: counts[d.id] ?? 0,
    })),
  }));

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">{t('allTitle')}</h1>
      <p className="mt-2 mb-8 text-text/70">{t('allSubtitle', { count: destinations.length })}</p>
      <AllDestinations groups={groups} />
    </div>
  );
}
