import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { PartyPopper, Moon, PawPrint, WavesLadder, Users, BedDouble } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { House, PriceCalculation } from '@/types';
import { getDestinationById } from '@/lib/data';
import { Link } from '@/i18n/navigation';

interface HouseCardProps {
  house: House;
  /** When dates are known, show the full price for the stay instead of the nightly "from" price. */
  quote?: PriceCalculation;
  /** Short text under the total, e.g. "for the weekend · 2 guests". Defaults to the number of nights. */
  quoteLabel?: string;
  /** Number of guests the quote is for; enables the per-person price. */
  guests?: number;
  /** Dates/guests to carry to the house page so its price calculator is prefilled */
  linkQuery?: Record<string, string | number>;
}

const eur = (n: number) => `€${Math.round(n)}`;

type Badge = { key: string; label: string; icon: LucideIcon; tone: 'accent' | 'primary' };

export default function HouseCard({ house, quote, quoteLabel, guests, linkQuery }: HouseCardProps) {
  const t = useTranslations('houseCard');
  const { pricing, capacity, bedrooms, name, rules } = house;
  const destination = getDestinationById(house.destinationId);

  // House rules are a core promise of Vikendly, so they're visible on every card
  const badges: Badge[] = [
    rules.partiesAllowed
      ? { key: 'party', label: t('badges.partiesAllowed'), icon: PartyPopper, tone: 'accent' }
      : { key: 'quiet', label: t('badges.quiet'), icon: Moon, tone: 'primary' },
  ];
  if (house.categoryIds.includes('pool')) {
    badges.push({ key: 'pool', label: t('badges.pool'), icon: WavesLadder, tone: 'primary' });
  }
  if (rules.petsAllowed) {
    badges.push({ key: 'pets', label: t('badges.pets'), icon: PawPrint, tone: 'primary' });
  }

  return (
    <article className="group relative flex flex-col bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow focus-within:ring-2 focus-within:ring-accent-dark">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={house.photos[0]}
          alt={name}
          fill
          unoptimized
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex flex-col flex-1 p-5">
        {destination && (
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark mb-1">
            {destination.name}
          </p>
        )}
        <h3 className="font-serif text-xl font-bold text-primary mb-2">
          {/* The link covers the whole card (after:inset-0), so anywhere on the card opens the house */}
          <Link
            href={{ pathname: '/houses/[slug]', params: { slug: house.slug }, query: linkQuery }}
            className="after:absolute after:inset-0 focus:outline-none group-hover:text-accent-dark transition-colors"
          >
            {name}
          </Link>
        </h3>
        <div className="flex items-center gap-4 text-sm text-text/70 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden />
            {t('guests', { count: capacity })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="size-4" aria-hidden />
            {t('bedrooms', { count: bedrooms })}
          </span>
        </div>

        <ul className="flex flex-wrap gap-2 mb-4">
          {badges.map(({ key, label, icon: Icon, tone }) => (
            <li
              key={key}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                tone === 'accent' ? 'bg-accent/15 text-accent-dark' : 'bg-primary/8 text-primary'
              }`}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4 border-t border-primary/10">
          {quote ? (
            <>
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span>
                  <span className="text-xl font-bold text-primary">{eur(quote.total)}</span>
                  <span className="text-sm text-text/70"> {t('totalWord')}</span>
                </span>
                {guests && guests > 1 && (
                  <span className="text-sm font-medium text-accent-dark">
                    {t('perPerson', { price: eur(quote.total / guests) })}
                  </span>
                )}
              </p>
              <p className="text-xs text-text/60 mt-1">
                {quoteLabel ?? t('nights', { count: quote.nights })} · {t('totalIncludes')}
              </p>
            </>
          ) : (
            <p>
              <span className="text-lg font-bold text-primary">
                {t('from', { price: eur(pricing.weekdayPrice) })}
              </span>
              <span className="text-sm text-text/70">{t('perNight')}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
