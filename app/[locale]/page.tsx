import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { localizedAlternates } from '@/lib/seo';
import { siteStructuredData } from '@/lib/structured-data';
import { site } from '@/lib/site';
import { routing } from '@/i18n/routing';
import Hero from '@/components/sections/Hero';
import Categories from '@/components/sections/Categories';
import Destinations from '@/components/sections/Destinations';
import FreeThisWeekend from '@/components/sections/FreeThisWeekend';
import WhyVikendly from '@/components/sections/WhyVikendly';
import HowItWorks from '@/components/sections/HowItWorks';
import OwnerCTA from '@/components/sections/OwnerCTA';
import HolidayOffer from '@/components/sections/HolidayOffer';
import {
  getActiveHolidays,
  getHolidayHouses,
  getCategories,
  getDestinations,
  getFeaturedHouses,
  getHouseCountsByDestination,
} from '@/lib/data';

// The homepage is static and rebuilt every hour, which picks up new houses from Supabase
// and keeps the "this weekend" dates and prices current.
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localizedAlternates(locale, '/') };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [destinations, categories, featured, houseCounts, holidays] = await Promise.all([
    getDestinations(),
    getCategories(),
    getFeaturedHouses(),
    getHouseCountsByDestination(),
    getActiveHolidays(),
  ]);
  // Guests only see destinations that have at least one published house (the admin sees all)
  const listed = destinations.filter((d) => (houseCounts[d.id] ?? 0) > 0);
  // Holiday offer switched on in admin (the soonest one), shown only once it has free houses
  const holiday = holidays[0];
  const holidayHouses = holiday ? await getHolidayHouses(holiday) : [];

  // Site name, logo and Instagram for Google (lib/structured-data.ts)
  const home = site.url + (locale === routing.defaultLocale ? '/' : `/${locale}`);
  const structuredData = siteStructuredData(home, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <Hero destinations={listed} />
      <Categories categories={categories} />
      {/* Holiday offer, right under "Kakav vikend želite?" */}
      {holiday && holidayHouses.length > 0 && <HolidayOffer holiday={holiday} houses={holidayHouses} />}
      {listed.length > 0 && <Destinations destinations={listed} houseCounts={houseCounts} />}
      <FreeThisWeekend houses={featured} destinations={destinations} />
      <WhyVikendly />
      <HowItWorks />
      <OwnerCTA />
    </>
  );
}
