import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HouseCard from '@/components/cards/HouseCard';
import SavedHouses from '@/components/SavedHouses';
import { getDestinations, getHouses } from '@/lib/data';
import { localizedAlternates } from '@/lib/seo';

type Params = Promise<{ locale: string }>;

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'favorites' });
  // Different for every visitor, so not for Google
  return { title: t('metaTitle'), alternates: localizedAlternates(locale, '/saved'), robots: { index: false } };
}

export default async function SavedPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('favorites');
  const [houses, destinations] = await Promise.all([getHouses(), getDestinations()]);

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <h1 className="font-serif text-4xl font-bold text-primary md:text-5xl">{t('title')}</h1>
      <p className="mt-2 mb-8 text-text/70">{t('intro')}</p>
      <SavedHouses
        cards={houses.map((house) => ({
          slug: house.slug,
          card: (
            <HouseCard house={house} destinationName={destinations.find((d) => d.id === house.destinationId)?.name} />
          ),
        }))}
      />
    </div>
  );
}
