import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, CalendarDays, Sparkles } from 'lucide-react';
import { Link, getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getDestinations, getHolidayBySlug, getHolidayHouses } from '@/lib/data';
import { countNights } from '@/lib/pricing';
import { formatDateRange, parseDateParam } from '@/lib/dates';
import { isVector } from '@/lib/images';
import { HOLIDAY_FALLBACK_IMAGE, HolidayHouseCards } from '@/components/sections/HolidayOffer';

type Params = Promise<{ locale: string; slug: string }>;

// Refreshed from Supabase at most once an hour (and right away when the admin saves a holiday)
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const holiday = await getHolidayBySlug(slug);
  if (!holiday) return { title: (await getTranslations({ locale, namespace: 'notFound' }))('metaTitle') };
  const t = await getTranslations({ locale, namespace: 'holiday' });
  const name = holiday.name[locale as Locale] || holiday.name.sr;
  const url = (l: Locale) => getPathname({ locale: l, href: { pathname: '/holidays/[slug]', params: { slug } } });
  const image = holiday.imageUrl && !isVector(holiday.imageUrl) ? holiday.imageUrl : undefined;
  return {
    title: t('metaTitle', { name }),
    description: holiday.text[locale as Locale] || holiday.text.sr || undefined,
    alternates: {
      canonical: url(locale as Locale),
      languages: { sr: url('sr'), en: url('en'), 'x-default': url(routing.defaultLocale) },
    },
    ...(image ? { openGraph: { title: name, images: [image] } } : {}),
  };
}

/** Holiday page: all houses the team ticked as free, priced for the holiday stay */
export default async function HolidayPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const holiday = await getHolidayBySlug(slug);
  if (!holiday) notFound();

  const t = await getTranslations('holiday');
  const [houses, destinations] = await Promise.all([getHolidayHouses(holiday), getDestinations()]);
  const name = holiday.name[locale as Locale] || holiday.name.sr;
  const text = holiday.text[locale as Locale] || holiday.text.sr;
  const checkIn = parseDateParam(holiday.checkIn)!;
  const checkOut = parseDateParam(holiday.checkOut)!;
  const image = holiday.imageUrl || HOLIDAY_FALLBACK_IMAGE;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-medium text-text/70 hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        {t('back')}
      </Link>

      <div className="relative mt-4 mb-8 h-64 overflow-hidden rounded-2xl shadow-md md:h-96 md:rounded-3xl">
        <Image
          src={image}
          alt=""
          fill
          priority
          unoptimized={isVector(image)}
          quality={70}
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent md:text-sm">
            <Sparkles className="size-4" aria-hidden /> {t('eyebrow')}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-balance md:text-5xl">{name}</h1>
          <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 text-white/90 md:text-lg">
            <CalendarDays className="size-4 text-accent" aria-hidden />
            {t('nights', { count: countNights(checkIn, checkOut), dates: formatDateRange(checkIn, checkOut, locale) })}
            <span className="text-white/50" aria-hidden>·</span>
            {t('freeCount', { count: houses.length })}
          </p>
        </div>
      </div>

      {text && <p className="mb-3 max-w-3xl text-lg leading-relaxed text-text/85">{text}</p>}
      <p className="mb-8 max-w-3xl text-sm text-text/70">{t('howItWorks')}</p>

      {houses.length > 0 ? (
        <HolidayHouseCards holiday={holiday} houses={houses} destinations={destinations} />
      ) : (
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-primary/10">
          <p className="text-text/80">{t('empty')}</p>
          <Link href="/contact" className="mt-4 inline-block font-semibold text-accent-dark hover:underline">
            {t('contact')}
          </Link>
        </div>
      )}
    </div>
  );
}
