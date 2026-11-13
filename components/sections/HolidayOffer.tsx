import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, Hourglass, House as HouseIcon, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import HouseCard from '@/components/cards/HouseCard';
import { isVenue, quoteStay, countNights } from '@/lib/pricing';
import { formatDateRange, parseDateParam } from '@/lib/dates';
import { isVector } from '@/lib/images';
import type { Destination, Holiday, House } from '@/types';

/** Picture used when the admin didn't upload one */
export const HOLIDAY_FALLBACK_IMAGE = '/images/holiday-winter.svg';

/** Cheapest whole-stay price for the holiday among these houses (smallest group, cheapest unit) */
function cheapestStay(holiday: Holiday, houses: House[]): number | undefined {
  const checkIn = parseDateParam(holiday.checkIn)!;
  const checkOut = parseDateParam(holiday.checkOut)!;
  const totals = houses
    .filter((h) => !isVenue(h))
    .map((h) => quoteStay(h, checkIn, checkOut, 1)?.total)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  return totals.length ? Math.min(...totals) : undefined;
}

/**
 * Cards for a holiday's houses with the price for the holiday stay ("Od €450", the cheapest way:
 * smallest group / cheapest unit). Links open the house with the holiday dates filled in.
 */
export function HolidayHouseCards({
  holiday,
  houses,
  destinations,
}: {
  holiday: Holiday;
  houses: House[];
  destinations: Destination[];
}) {
  const t = useTranslations('holiday');
  const locale = useLocale();
  const checkIn = parseDateParam(holiday.checkIn)!;
  const checkOut = parseDateParam(holiday.checkOut)!;
  const label = t('nights', { count: countNights(checkIn, checkOut), dates: formatDateRange(checkIn, checkOut, locale) });
  const linkQuery = { checkIn: holiday.checkIn, checkOut: holiday.checkOut };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {houses.map((house) => (
        <HouseCard
          key={house.id}
          house={house}
          destinationName={destinations.find((d) => d.id === house.destinationId)?.name}
          quote={isVenue(house) ? undefined : quoteStay(house, checkIn, checkOut, 1)}
          fromPrice
          quoteLabel={label}
          linkQuery={linkQuery}
        />
      ))}
    </div>
  );
}

// Little lights scattered over the picture (positions in %, size in px, delay in s)
const lights = [
  { top: 12, right: 8, size: 6, delay: 0 },
  { top: 22, right: 22, size: 4, delay: 0.8 },
  { top: 8, right: 38, size: 5, delay: 1.6 },
  { top: 30, right: 12, size: 3, delay: 2.2 },
  { top: 18, right: 52, size: 3, delay: 1.1 },
  { top: 40, right: 30, size: 4, delay: 2.8 },
];

/**
 * Homepage banner for the holiday offer that is on (admin → Praznici): a large picture with the
 * name, dates, a countdown, the lowest price and a button to the holiday page with all free houses.
 */
export default function HolidayOffer({ holiday, houses }: { holiday: Holiday; houses: House[] }) {
  const t = useTranslations('holiday');
  const locale = useLocale() as 'sr' | 'en';
  const name = holiday.name[locale] || holiday.name.sr;
  const text = holiday.text[locale] || holiday.text.sr;
  const checkIn = parseDateParam(holiday.checkIn)!;
  const checkOut = parseDateParam(holiday.checkOut)!;
  const image = holiday.imageUrl || HOLIDAY_FALLBACK_IMAGE;
  const from = cheapestStay(holiday, houses);
  // Days until arrival (the page is refreshed at least hourly)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = countNights(today, checkIn);

  const chip = 'inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm';

  return (
    <section id="praznici" className="pb-6 pt-2 md:pb-10">
      <div className="container mx-auto px-4">
        <Link
          href={{ pathname: '/holidays/[slug]', params: { slug: holiday.slug } }}
          className="group relative isolate block min-h-[30rem] overflow-hidden rounded-3xl bg-primary text-white shadow-xl md:min-h-[26rem]"
        >
          <Image
            src={image}
            alt=""
            fill
            unoptimized={isVector(image)}
            quality={70}
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="-z-20 object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
          />
          {/* Dark green from the text side, so the words stay readable on any photo */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/80 to-primary/10 md:bg-gradient-to-r md:from-primary md:via-primary/75 md:to-transparent" />
          {/* Thin inner frame and twinkling lights: festive, but quiet */}
          <div className="pointer-events-none absolute inset-3 rounded-[1.25rem] border border-white/15 md:inset-4" aria-hidden />
          {lights.map((l, i) => (
            <span
              key={i}
              aria-hidden
              className="vk-twinkle pointer-events-none absolute rounded-full bg-[#f4c27a] shadow-[0_0_12px_4px_rgba(244,194,122,0.6)]"
              style={{ top: `${l.top}%`, right: `${l.right}%`, width: l.size, height: l.size, animationDelay: `${l.delay}s` }}
            />
          ))}

          <div className="relative flex min-h-[30rem] max-w-2xl flex-col justify-end gap-4 p-7 md:min-h-[26rem] md:justify-center md:p-14">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-dark px-3.5 py-1 text-xs font-bold uppercase tracking-[0.15em]">
              <Sparkles className="size-3.5" aria-hidden /> {t('eyebrow')}
            </p>
            <h2 className="font-serif text-4xl font-bold leading-tight text-balance drop-shadow-sm md:text-6xl">{name}</h2>
            <ul className="flex flex-wrap gap-2">
              <li className={chip}>
                <CalendarDays className="size-4 text-[#f4c27a]" aria-hidden />
                {t('nights', { count: countNights(checkIn, checkOut), dates: formatDateRange(checkIn, checkOut, locale) })}
              </li>
              <li className={chip}>
                <HouseIcon className="size-4 text-[#f4c27a]" aria-hidden />
                {t('freeCount', { count: houses.length })}
              </li>
              <li className={chip}>
                <Hourglass className="size-4 text-[#f4c27a]" aria-hidden />
                {daysLeft > 0 ? t('countdown', { count: daysLeft }) : t('started')}
              </li>
            </ul>
            {text && <p className="max-w-xl leading-relaxed text-white/85 md:text-lg">{text}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-primary shadow-lg transition-colors group-hover:bg-accent-dark group-hover:text-white">
                {t('cta')}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
              {from !== undefined && (
                <span className="font-serif text-xl font-semibold text-[#f4c27a]">{t('fromTotal', { price: `€${Math.round(from)}` })}</span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
