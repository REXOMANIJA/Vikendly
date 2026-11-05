import { setRequestLocale } from 'next-intl/server';
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [destinations, categories, featured, houseCounts] = await Promise.all([
    getDestinations(),
    getCategories(),
    getFeaturedHouses(),
    getHouseCountsByDestination(),
  ]);

  return (
    <>
      <Hero destinations={destinations} />
      <Categories categories={categories} />
      <Destinations destinations={destinations} houseCounts={houseCounts} />
      <FreeThisWeekend houses={featured} destinations={destinations} />
      <WhyVikendly />
      <HowItWorks />
      <OwnerCTA />
    </>
  );
}
