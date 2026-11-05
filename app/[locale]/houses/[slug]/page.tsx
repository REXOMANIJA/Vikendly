import type { Metadata } from 'next';
import Gallery from '@/components/house/Gallery';
import HouseMap from '@/components/house/HouseMap';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ArrowLeft,
  Wifi,
  Car,
  CookingPot,
  Flame,
  Beef,
  Armchair,
  Tv,
  AirVent,
  Heater,
  WashingMachine,
  Check,
  X,
  Clock,
  Users,
  BedDouble,
  Bath,
  DoorOpen,
  CalendarDays,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import {
  getDestinationById,
  getDestinations,
  getHouseBySlug,
  getHouses,
  getSimilarHouses,
} from '@/lib/data';
import { PriceCalculatorFromUrl } from '@/components/house/PriceCalculator';
import { getLowestNightlyPrice } from '@/lib/pricing';
import HouseCard from '@/components/cards/HouseCard';

type Params = Promise<{ locale: string; slug: string }>;

const amenityIcons: Record<string, LucideIcon> = {
  wifi: Wifi,
  parking: Car,
  kitchen: CookingPot,
  fireplace: Flame,
  bbq: Beef,
  terrace: Armchair,
  tv: Tv,
  ac: AirVent,
  heating: Heater,
  washer: WashingMachine,
};

const eur = (n: number) => `€${n}`;

// Pages are built ahead of time and refreshed from Supabase at most once an hour.
// Houses added later are built on their first visit.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getHouses()).map((house) => ({ slug: house.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const house = await getHouseBySlug(slug);
  if (!house) return {};
  const t = await getTranslations({ locale, namespace: 'house' });
  const destination = await getDestinationById(house.destinationId);
  const description = house.description[locale as Locale];

  // Each language has its own URL (/sr/kuce/… and /en/houses/…), so tell Google about both
  const url = (l: Locale) => getPathname({ locale: l, href: { pathname: '/houses/[slug]', params: { slug } } });

  return {
    title: t('metaTitle', { name: house.name, destination: destination?.name ?? '' }),
    description,
    openGraph: { title: house.name, description, images: house.photos.slice(0, 1) },
    alternates: {
      canonical: url(locale as Locale),
      languages: { sr: url('sr'), en: url('en'), 'x-default': url(routing.defaultLocale) },
    },
  };
}

export default async function HousePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const house = await getHouseBySlug(slug);
  if (!house) notFound();

  const t = await getTranslations('house');
  const tAmenity = await getTranslations('amenities');
  const tCountry = await getTranslations('destinations.countries');
  const [destinations, similar] = await Promise.all([getDestinations(), getSimilarHouses(house)]);
  const destinationOf = (id: string) => destinations.find((d) => d.id === id);
  const destination = destinationOf(house.destinationId);
  const { rules } = house;
  const hasDayCapacity = house.dayCapacity != null && house.dayCapacity > house.capacity;

  const ruleItems = [
    { ok: rules.partiesAllowed, label: rules.partiesAllowed ? t('partiesAllowed') : t('partiesNotAllowed') },
    { ok: rules.petsAllowed, label: rules.petsAllowed ? t('petsAllowed') : t('petsNotAllowed') },
    { ok: rules.smokingAllowed, label: rules.smokingAllowed ? t('smokingAllowed') : t('smokingNotAllowed') },
  ];

  return (
    <>
      <div className="container mx-auto px-4 pt-6 pb-16">
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text/70 hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>

        {/* Title */}
        <header className="mt-4 mb-6">
          {destination && (
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-dark">
              {destination.name} · {tCountry(destination.country)}
            </p>
          )}
          <h1 className="mt-1 font-serif text-3xl md:text-5xl font-bold text-primary text-balance">
            {house.name}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-text/80">
            <li className="inline-flex items-center gap-1.5">
              <BedDouble className="size-4" aria-hidden /> {t('sleeps', { count: house.capacity })}
            </li>
            {hasDayCapacity && (
              <li className="inline-flex items-center gap-1.5">
                <Users className="size-4" aria-hidden /> {t('dayCapacity', { count: house.dayCapacity! })}
              </li>
            )}
            {house.bedrooms != null && (
              <li className="inline-flex items-center gap-1.5">
                <DoorOpen className="size-4" aria-hidden /> {t('bedrooms', { count: house.bedrooms })}
              </li>
            )}
            {house.bathrooms != null && (
              <li className="inline-flex items-center gap-1.5">
                <Bath className="size-4" aria-hidden /> {t('bathrooms', { count: house.bathrooms })}
              </li>
            )}
          </ul>
        </header>

        <Gallery photos={house.photos} name={house.name} />

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          {/* Details */}
          <div className="space-y-10 lg:col-span-7">
            <section>
              <h2 className="font-serif text-2xl font-bold text-primary">{t('aboutTitle')}</h2>
              <p className="mt-3 text-lg leading-relaxed text-text/85">
                {house.description[locale as Locale]}
              </p>
            </section>

            {house.amenities.length > 0 && (
              <section>
                <h2 className="font-serif text-2xl font-bold text-primary">{t('amenitiesTitle')}</h2>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {house.amenities.map((id) => {
                    const Icon = amenityIcons[id] ?? Check;
                    return (
                      <li key={id} className="flex items-center gap-3 rounded-xl bg-white p-3">
                        <Icon className="size-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                        <span>{tAmenity(id as 'wifi')}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section>
              <h2 className="font-serif text-2xl font-bold text-primary">{t('rulesTitle')}</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3">
                  <Clock className="size-5 text-primary" aria-hidden />
                  {t('checkInTime', { time: rules.checkInTime })} · {t('checkOutTime', { time: rules.checkOutTime })}
                </li>
                <li className="flex items-center gap-3">
                  <CalendarDays className="size-5 text-primary" aria-hidden />
                  {t('minNights', { count: house.pricing.minNights })}
                </li>
                {hasDayCapacity && (
                  <li className="flex items-start gap-3">
                    <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    {t('capacityNote', {
                      sleeps: t('upTo', { count: house.capacity }),
                      day: t('upTo', { count: house.dayCapacity! }),
                    })}
                  </li>
                )}
                {ruleItems.map(({ ok, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    {ok ? (
                      <Check className="size-5 text-primary" aria-hidden />
                    ) : (
                      <X className="size-5 text-accent-dark" aria-hidden />
                    )}
                    {label}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl font-bold text-primary">{t('locationTitle')}</h2>
              <HouseMap
                name={house.name}
                address={house.location.address}
                lat={house.location.lat}
                lng={house.location.lng}
                placeLabel={destination ? `${destination.name}, ${tCountry(destination.country)}` : undefined}
              />
            </section>
          </div>

          {/* Price + contact, sticks while scrolling on desktop */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <PriceCalculatorFromUrl house={house} />
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-6">{t('similarTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((h) => (
                <HouseCard key={h.id} house={h} destinationName={destinationOf(h.destinationId)?.name} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Phones: price and a shortcut to the calculator always at hand */}
      <div className="sticky bottom-0 z-40 border-t border-primary/10 bg-white/95 backdrop-blur px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-primary">
            {t('mobilePrice', { price: eur(getLowestNightlyPrice(house)) })}
          </span>
          <a href="#cena" className="rounded-lg bg-accent-dark px-4 py-2.5 font-medium text-white">
            {t('mobileCta')}
          </a>
        </div>
      </div>
    </>
  );
}
