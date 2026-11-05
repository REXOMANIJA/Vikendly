import { setRequestLocale } from 'next-intl/server';
import Hero from '@/components/sections/Hero';
import Categories from '@/components/sections/Categories';
import Destinations from '@/components/sections/Destinations';
import FreeThisWeekend from '@/components/sections/FreeThisWeekend';
import WhyVikendly from '@/components/sections/WhyVikendly';
import HowItWorks from '@/components/sections/HowItWorks';
import OwnerCTA from '@/components/sections/OwnerCTA';

// The homepage is static, but "Free this weekend" shows dates and prices for the upcoming
// weekend, so rebuild it every hour to keep those current.
export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Categories />
      <Destinations />
      <FreeThisWeekend />
      <WhyVikendly />
      <HowItWorks />
      <OwnerCTA />
    </>
  );
}
