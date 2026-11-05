'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Phone } from 'lucide-react';
import type { Destination, House } from '@/types';
import { calculateTotalPrice } from '@/lib/pricing';
import { intlLocale, parseDateParam } from '@/lib/dates';

interface PriceCalculatorProps {
  house: House;
  destination?: Destination;
  /** Prefilled from the search the visitor came from ("yyyy-MM-dd") */
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

const eur = (n: number) => `€${Math.round(n * 100) / 100}`;
const today = () => new Date().toLocaleDateString('sv-SE'); // yyyy-MM-dd local
const digits = (phone: string) => phone.replace(/\D/g, '');

const fieldClass =
  'w-full h-11 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

export default function PriceCalculator({
  house,
  destination,
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests,
}: PriceCalculatorProps) {
  const t = useTranslations('house.calculator');
  const tc = useTranslations('house.contact');
  const locale = useLocale();
  const { pricing, capacity, contact } = house;

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(
    initialGuests ? String(Math.min(initialGuests, capacity)) : ''
  );

  const guestCount = parseInt(guests, 10) || 0;
  const inDate = parseDateParam(checkIn);
  const outDate = parseDateParam(checkOut);

  const problem = useMemo(() => {
    if (inDate && outDate && outDate <= inDate) return t('invalidDates');
    if (guestCount > capacity) return t('tooManyGuests', { count: capacity });
    return null;
  }, [inDate, outDate, guestCount, capacity, t]);

  const quote =
    inDate && outDate && guestCount > 0 && !problem
      ? calculateTotalPrice(house, inDate, outDate, guestCount, destination)
      : undefined;
  const tooShort = quote && quote.nights < pricing.minNights;

  // Prefilled message so the owner immediately knows dates and group size
  const formatDay = (d: Date) =>
    new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'numeric', year: 'numeric' }).format(d);
  const message =
    inDate && outDate && guestCount > 0 && !problem
      ? tc('messageWithDates', {
          house: house.name,
          checkIn: formatDay(inDate),
          checkOut: formatDay(outDate),
          guests: guestCount,
        })
      : tc('messageNoDates', { house: house.name });

  const onCheckInChange = (value: string) => {
    setCheckIn(value);
    if (checkOut && value && checkOut <= value) setCheckOut('');
  };

  return (
    <div id="cena" className="rounded-2xl border border-primary/10 bg-white p-5 md:p-6 shadow-lg scroll-mt-24">
      <h2 className="font-serif text-2xl font-bold text-primary">{t('title')}</h2>

      {/* Nightly rates */}
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-background p-3">
          <dt className="text-xs text-text/70">{t('weekdayRate')}</dt>
          <dd className="font-semibold text-primary">{t('perNight', { price: eur(pricing.weekdayPrice) })}</dd>
        </div>
        <div className="rounded-xl bg-background p-3">
          <dt className="text-xs text-text/70">{t('weekendRate')}</dt>
          <dd className="font-semibold text-primary">{t('perNight', { price: eur(pricing.weekendPrice) })}</dd>
        </div>
      </dl>

      {/* Inputs */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="calc-checkin" className="block text-sm font-medium mb-1.5">
            {/* reuse the search labels so wording stays identical */}
            <SearchLabel name="checkIn" />
          </label>
          <input
            id="calc-checkin"
            type="date"
            min={today()}
            value={checkIn}
            onChange={(e) => onCheckInChange(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="calc-checkout" className="block text-sm font-medium mb-1.5">
            <SearchLabel name="checkOut" />
          </label>
          <input
            id="calc-checkout"
            type="date"
            min={checkIn || today()}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="calc-guests" className="block text-sm font-medium mb-1.5">
            <SearchLabel name="guests" />
          </label>
          <input
            id="calc-guests"
            type="number"
            min="1"
            max={capacity}
            inputMode="numeric"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder={`1–${capacity}`}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Result */}
      <div className="mt-5" aria-live="polite">
        {problem ? (
          <p className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">{problem}</p>
        ) : quote ? (
          <>
            <dl className="space-y-2 text-sm">
              {quote.weekdayNights > 0 && (
                <Row
                  label={t('weekdayLine', { count: quote.weekdayNights, price: eur(pricing.weekdayPrice) })}
                  value={eur(quote.weekdayNights * pricing.weekdayPrice)}
                />
              )}
              {quote.weekendNights > 0 && (
                <Row
                  label={t('weekendLine', { count: quote.weekendNights, price: eur(pricing.weekendPrice) })}
                  value={eur(quote.weekendNights * pricing.weekendPrice)}
                />
              )}
              <Row label={t('cleaning')} value={eur(quote.cleaningFee)} />
              <Row
                label={t('touristTax')}
                hint={t('touristTaxDetail', { price: eur(quote.touristTax / (guestCount * quote.nights)) })}
                value={eur(quote.touristTax)}
              />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-primary/10 pt-4">
              <span className="font-semibold text-primary">{t('total')}</span>
              <span className="text-2xl font-bold text-primary">{eur(quote.total)}</span>
            </div>
            {guestCount > 1 && (
              <p className="mt-1 text-right text-sm font-medium text-accent-dark">
                {t('perPerson', { price: eur(Math.round(quote.total / guestCount)) })}
              </p>
            )}
            {tooShort && (
              <p className="mt-3 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">
                {t('tooFewNights', { count: pricing.minNights })}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-text/70">{t('pickDates')}</p>
        )}
      </div>

      {/* Contact the owner directly */}
      <div className="mt-6 border-t border-primary/10 pt-5">
        <h3 className="font-semibold text-primary">{tc('title')}</h3>
        <p className="mt-1 text-sm text-text/70">{tc('note')}</p>
        <div className="mt-4 grid gap-2">
          {contact.viber && (
            <a
              href={`viber://chat?number=%2B${digits(contact.viber)}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#7360f2] py-3 font-medium text-white hover:opacity-90"
            >
              <MessageCircle className="size-4" aria-hidden />
              {tc('viber')}
            </a>
          )}
          {contact.whatsapp && (
            <a
              href={`https://wa.me/${digits(contact.whatsapp)}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#1a7f4b] py-3 font-medium text-white hover:opacity-90"
            >
              <MessageCircle className="size-4" aria-hidden />
              {tc('whatsapp')}
            </a>
          )}
          {(contact.phone ?? contact.viber ?? contact.whatsapp) && (
            <a
              href={`tel:+${digits((contact.phone ?? contact.viber ?? contact.whatsapp)!)}`}
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-primary py-2.5 font-medium text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Phone className="size-4" aria-hidden />
              {tc('call')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Prefills dates and guests from the URL (?checkIn=…&checkOut=…&guests=…) when the visitor
 * comes from search. Reading the URL on the client keeps the house page itself static.
 */
function WithSearchParams(props: Omit<PriceCalculatorProps, 'initialCheckIn' | 'initialCheckOut' | 'initialGuests'>) {
  const sp = useSearchParams();
  const guests = parseInt(sp.get('guests') ?? '', 10);
  return (
    <PriceCalculator
      {...props}
      initialCheckIn={parseDateParam(sp.get('checkIn') ?? undefined) ? sp.get('checkIn')! : ''}
      initialCheckOut={parseDateParam(sp.get('checkOut') ?? undefined) ? sp.get('checkOut')! : ''}
      initialGuests={Number.isFinite(guests) && guests > 0 ? guests : undefined}
    />
  );
}

export function PriceCalculatorFromUrl(
  props: Omit<PriceCalculatorProps, 'initialCheckIn' | 'initialCheckOut' | 'initialGuests'>
) {
  return (
    <Suspense fallback={<PriceCalculator {...props} />}>
      <WithSearchParams {...props} />
    </Suspense>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text/80">
        {label}
        {hint && <span className="block text-xs text-text/60">{hint}</span>}
      </dt>
      <dd className="font-medium text-text">{value}</dd>
    </div>
  );
}

function SearchLabel({ name }: { name: 'checkIn' | 'checkOut' | 'guests' }) {
  const t = useTranslations('hero.search');
  return <>{t(name)}</>;
}
