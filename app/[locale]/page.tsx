import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { localizedAlternates } from '@/lib/seo';
import Hero from '@/components/sections/Hero';
import Categories from '@/components/sections/Categories';
import Destinations from '@/components/sections/Destinations';
import FreeThisWeekend from '@/components/sections/FreeThisWeekend';
import WhyVikendly from '@/components/sections/WhyVikendly';
import HowItWorks from '@/components/sections/HowItWorks';
import OwnerCTA from '@/components/sections/OwnerCTA';
import {
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

  const [destinations, categories, featured, houseCounts] = await Promise.all([
    getDestinations(),
    getCategories(),
    getFeaturedHouses(),
    getHouseCountsByDestination(),
  ]);
  // Guests only see destinations that have at least one published house (the admin sees all)
  const listed = destinations.filter((d) => (houseCounts[d.id] ?? 0) > 0);

  return (
    <>
      <Hero destinations={listed} />
      <Categories categories={categories} />
      {listed.length > 0 && <Destinations destinations={listed} houseCounts={houseCounts} />}
      <FreeThisWeekend houses={featured} destinations={destinations} />
      <WhyVikendly />
      <HowItWorks />
      <OwnerCTA />
    </>
  );
}
