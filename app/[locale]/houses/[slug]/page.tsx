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
  BadgeCheck,
} from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { formatVisitMonth, parseDateParam } from '@/lib/dates';
import type { LucideIcon } from 'lucide-react';
import { Link, getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { site } from '@/lib/site';
import {
  getDestinationById,
  getDestinations,
  getHouseBySlug,
  getHouses,
  getHouseReviews,
  getSimilarHouses,
} from '@/lib/data';
import Stars from '@/components/Stars';
import FavoriteButton from '@/components/FavoriteButton';
import ShareButton from '@/components/ShareButton';
import HouseReviews from '@/components/house/HouseReviews';
import { houseStructuredData } from '@/lib/structured-data';
import { PriceCalculatorFromUrl } from '@/components/house/PriceCalculator';
import { getLowestNightlyPrice, hasUnits, isVenue } from '@/lib/pricing';
import HouseUnits from '@/components/house/HouseUnits';
import HouseCard from '@/components/cards/HouseCard';
import MobileBookingBar from '@/components/house/MobileBookingBar';

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
  if (!house) return { title: (await getTranslations({ locale, namespace: 'notFound' }))('metaTitle') };
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
  const [destinations, similar, reviews] = await Promise.all([
    getDestinations(),
    getSimilarHouses(house),
    getHouseReviews(house.id),
  ]);
  const destinationOf = (id: string) => destinations.find((d) => d.id === id);
  const destination = destinationOf(house.destinationId);
  const { rules } = house;
  const tVerified = await getTranslations('verified');
  const verifiedOn = parseDateParam(house.verifiedAt);
  const hasDayCapacity = house.dayCapacity != null && house.dayCapacity > house.capacity;
  // A listing with units shows each unit's rules in its own card instead of one list here
  const withUnits = hasUnits(house);
  // Event venue: nobody sleeps there, booked per party day
  const venue = isVenue(house);
  // Admin's rules text; the English page falls back to Serbian when no English text was written
  const rulesText = house.rulesText ? house.rulesText[locale as Locale] || house.rulesText.sr : '';

  const ruleItems = [
    { ok: rules.partiesAllowed, label: rules.partiesAllowed ? t('partiesAllowed') : t('partiesNotAllowed') },
    { ok: rules.petsAllowed, label: rules.petsAllowed ? t('petsAllowed') : t('petsNotAllowed') },
    { ok: rules.smokingAllowed, label: rules.smokingAllowed ? t('smokingAllowed') : t('smokingNotAllowed') },
  ];

  // Lets Google show the house with photo, place, price and stars in search results (G8)
  const structuredData = houseStructuredData({
    house,
    reviews,
    destinationName: destination?.name,
    country: destination?.country,
    url: site.url + getPathname({ locale: locale as Locale, href: { pathname: '/houses/[slug]', params: { slug } } }),
    description: house.description[locale as Locale],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <div className="container mx-auto px-4 pt-6 pb-16">
        <Link
          href="/search"
          transitionTypes={['nav-back']}
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {verifiedOn && <VerifiedBadge />}
            {house.rating && (
              <a href="#ocene" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-primary ring-1 ring-primary/15 hover:bg-primary/5">
                <Stars value={house.rating.average} label={t('reviews.starsLabel', { average: house.rating.average })} />
                {house.rating.average.toLocaleString(locale === 'en' ? 'en' : 'sr-Latn', { minimumFractionDigits: 1 })}
                <span className="font-normal text-text/60">({house.rating.count})</span>
              </a>
            )}
            <span className="ml-auto flex gap-2">
              <FavoriteButton slug={house.slug} name={house.name} variant="pill" />
              <ShareButton
                title={house.name}
                text={t('shareText', { name: house.name, destination: destination?.name ?? '' })}
              />
            </span>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-text/80">
            {!venue && (
              <li className="inline-flex items-center gap-1.5">
                <BedDouble className="size-4" aria-hidden /> {t('sleeps', { count: house.capacity })}
              </li>
            )}
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
            {verifiedOn && (
              <section className="flex gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-5">
                <BadgeCheck className="size-8 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                <div>
                  <h2 className="font-serif text-xl font-bold text-primary">{tVerified('title')}</h2>
                  <p className="mt-1 text-text/85">
                    {tVerified('text', { month: formatVisitMonth(verifiedOn, locale) })}
                  </p>
                </div>
              </section>
            )}
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

            {withUnits && <HouseUnits units={house.units!} />}

            {/* A venue's rules are all in its party space cards above, so this list would be empty */}
            <section hidden={venue && !rulesText}>
              <h2 className="font-serif text-2xl font-bold text-primary">{t('rulesTitle')}</h2>
              <ul className="mt-4 space-y-3">
                {!withUnits && (
                  <li className="flex items-center gap-3">
                    <Clock className="size-5 text-primary" aria-hidden />
                    {t('checkInTime', { time: rules.checkInTime })} · {t('checkOutTime', { time: rules.checkOutTime })}
                  </li>
                )}
                {/* A venue is booked for one day, so there is no minimum stay */}
                {!venue && (
                  <li className="flex items-center gap-3">
                    <CalendarDays className="size-5 text-primary" aria-hidden />
                    {t('minNights', { count: house.pricing.minNights })}
                  </li>
                )}
                {hasDayCapacity && !withUnits && (
                  <li className="flex items-start gap-3">
                    <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    {t('capacityNote', {
                      sleeps: t('upTo', { count: house.capacity }),
                      day: t('upTo', { count: house.dayCapacity! }),
                    })}
                  </li>
                )}
                {!withUnits && ruleItems.map(({ ok, label }) => (
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
              {/* Everything else, in the owner's words (admin → "Pravila kuće") */}
              {rulesText && (
                <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-primary/10">
                  <p className="whitespace-pre-line leading-relaxed text-text/85">{rulesText}</p>
                </div>
              )}
            </section>

            {house.rating && <HouseReviews reviews={reviews} summary={house.rating} locale={locale} />}

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
          <aside id="booking-box" className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <PriceCalculatorFromUrl house={house} />
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mb-6">{t('similarTitle')}</h2>
            {/* Phones: one row you swipe sideways, like "Izdvojeno za ovaj vikend"; wider screens: a grid */}
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
              {similar.map((h) => (
                <div key={h.id} className={`${similar.length > 1 ? 'w-[85%]' : 'w-full'} shrink-0 snap-start sm:w-auto`}>
                  <HouseCard house={h} destinationName={destinationOf(h.destinationId)?.name} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Phones: price and a shortcut to the calculator, hidden while the calculator is on screen */}
      <MobileBookingBar
        targetId="booking-box"
        price={t(venue ? 'mobilePriceParty' : 'mobilePrice', { price: eur(getLowestNightlyPrice(house)) })}
        cta={t('mobileCta')}
      />
    </>
  );
}
