'use client';

import { Suspense, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CircleCheck, Loader2, Send } from 'lucide-react';
import type { House } from '@/types';
import { calculateTotalPrice, getNightlyRates } from '@/lib/pricing';
import { formatDateRange, parseDateParam } from '@/lib/dates';
import { submitBookingRequest, type BookingRequestResult } from '@/lib/actions';
import DateRangePicker from '@/components/DateRangePicker';

interface BookingBoxProps {
  house: House;
  /** Prefilled from the search the visitor came from ("yyyy-MM-dd") */
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

const eur = (n: number) => `€${Math.round(n * 100) / 100}`;

const fieldClass =
  'w-full h-11 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
const labelClass = 'block text-sm font-medium mb-1.5';

/**
 * Price + booking request. Guests don't contact owners directly: the request is saved
 * (table booking_requests), the Vikendly team checks the dates with the owner and calls back.
 */
export default function PriceCalculator({
  house,
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests,
}: BookingBoxProps) {
  const t = useTranslations('house.calculator');
  const tb = useTranslations('house.booking');
  const tDates = useTranslations('datePicker');
  const locale = useLocale();
  const { pricing, capacity } = house;

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests ? String(Math.min(initialGuests, capacity)) : '');
  const [contact, setContact] = useState({ name: '', phone: '', email: '', message: '', website: '' });
  const [result, setResult] = useState<BookingRequestResult | null>(null);
  const [pending, startTransition] = useTransition();

  const guestCount = parseInt(guests, 10) || 0;
  // Group prices below the whole-house price (prices for the full capacity are the house price)
  const tiers = (pricing.tiers ?? []).filter((tier) => tier.maxGuests < capacity);
  const activeTierMax = getNightlyRates(house, guestCount).tier?.maxGuests ?? capacity;
  const inDate = parseDateParam(checkIn);
  const outDate = parseDateParam(checkOut);

  const problem = useMemo(() => {
    if (inDate && outDate && outDate <= inDate) return t('invalidDates');
    if (guestCount > capacity) return t('tooManyGuests', { count: capacity });
    return null;
  }, [inDate, outDate, guestCount, capacity, t]);

  const quote =
    inDate && outDate && guestCount > 0 && !problem ? calculateTotalPrice(house, inDate, outDate, guestCount) : undefined;
  const tooShort = quote && quote.nights < pricing.minNights;
  const canSend = Boolean(quote && !tooShort);


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setResult(null);
    startTransition(async () => {
      try {
        setResult(
          await submitBookingRequest({
            slug: house.slug,
            checkIn,
            checkOut,
            guests: guestCount,
            ...contact,
            locale: locale === 'en' ? 'en' : 'sr',
          })
        );
      } catch {
        setResult({ ok: false, error: 'server' });
      }
    });
  };

  // ── After sending: confirmation instead of the form ──
  if (result?.ok && inDate && outDate) {
    return (
      <div id="cena" className="rounded-2xl border border-primary/10 bg-white p-6 shadow-lg scroll-mt-24 text-center" role="status">
        <CircleCheck className="mx-auto mb-3 size-12 text-primary" strokeWidth={1.5} aria-hidden />
        <h2 className="font-serif text-2xl font-bold text-primary">{tb('sentTitle', { name: contact.name.split(' ')[0] })}</h2>
        <p className="mt-3 text-text/80">
          {tb('sentSummary', {
            house: house.name,
            dates: formatDateRange(inDate, outDate, locale),
            guests: guestCount,
          })}
        </p>
        <p className="mt-2 text-text/80">{tb('sentNext', { phone: contact.phone })}</p>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setContact((c) => ({ ...c, message: '' }));
          }}
          className="mt-5 rounded-lg border-2 border-primary px-4 py-2 font-medium text-primary hover:bg-primary hover:text-white"
        >
          {tb('sendAnother')}
        </button>
      </div>
    );
  }

  const errorText =
    result && !result.ok
      ? result.error === 'minNights'
        ? t('tooFewNights', { count: result.minNights ?? pricing.minNights })
        : tb(`errors.${result.error}`)
      : null;

  return (
    <form
      id="cena"
      onSubmit={onSubmit}
      className="rounded-2xl border border-primary/10 bg-white p-5 md:p-6 shadow-lg scroll-mt-24"
    >
      <h2 className="font-serif text-2xl font-bold text-primary">{tb('title')}</h2>

      {/* Nightly rates: one price for the house, or a small table when price depends on group size */}
      {tiers.length === 0 ? (
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
      ) : (
        <table className="mt-4 w-full overflow-hidden rounded-xl bg-background text-sm">
          <caption className="mb-2 text-left text-sm font-medium text-text/80">{t('priceTableTitle')}</caption>
          <thead>
            <tr className="text-xs text-text/60">
              <th scope="col" className="px-3 pt-2 text-left font-normal"><span className="sr-only">{t('priceTableTitle')}</span></th>
              <th scope="col" className="px-3 pt-2 text-right font-normal">{t('columnWeekday')}</th>
              <th scope="col" className="px-3 pt-2 text-right font-normal">{t('columnWeekend')}</th>
            </tr>
          </thead>
          <tbody>
            {[...tiers.map((tier) => ({ key: tier.maxGuests, label: t('tierRow', { count: tier.maxGuests }), ...tier })),
              { key: capacity, label: t('wholeHouse', { count: capacity }), maxGuests: capacity,
                weekdayPrice: pricing.weekdayPrice, weekendPrice: pricing.weekendPrice }]
              .map((row) => {
                const active = guestCount > 0 && activeTierMax === row.maxGuests;
                return (
                  <tr key={row.key} className={active ? 'bg-primary text-white' : ''} aria-current={active || undefined}>
                    <th scope="row" className="px-3 py-2 text-left font-medium">{row.label}</th>
                    <td className="px-3 py-2 text-right">{eur(row.weekdayPrice)}</td>
                    <td className="px-3 py-2 text-right">{eur(row.weekendPrice)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}

      {/* Stay */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <DateRangePicker
          id="calc-dates"
          label={tDates('label')}
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={(nextIn, nextOut) => {
            setCheckIn(nextIn);
            setCheckOut(nextOut);
            setResult(null);
          }}
          className="col-span-2"
        />
        <div className="col-span-2">
          <label htmlFor="calc-guests" className={labelClass}>{t('guestsLabel')}</label>
          <input id="calc-guests" type="number" min="1" max={capacity} inputMode="numeric" value={guests} required
            onChange={(e) => { setGuests(e.target.value); setResult(null); }} placeholder={`1–${capacity}`} className={fieldClass} />
        </div>
      </div>

      {/* Price */}
      <div className="mt-5" aria-live="polite">
        {problem ? (
          <p className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">{problem}</p>
        ) : quote ? (
          <>
            <dl className="space-y-2 text-sm">
              {quote.weekdayNights > 0 && (
                <Row label={t('weekdayLine', { count: quote.weekdayNights, price: eur(quote.weekdayRate) })}
                  value={eur(quote.weekdayNights * quote.weekdayRate)} />
              )}
              {quote.weekendNights > 0 && (
                <Row label={t('weekendLine', { count: quote.weekendNights, price: eur(quote.weekendRate) })}
                  value={eur(quote.weekendNights * quote.weekendRate)} />
              )}
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

      {/* Guest contact */}
      <fieldset className="mt-6 space-y-3 border-t border-primary/10 pt-5">
        <legend className="sr-only">{tb('contactLegend')}</legend>
        <p className="text-sm text-text/70">{tb('howItWorks')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="req-name" className={labelClass}>{tb('name')}</label>
            <input id="req-name" required minLength={2} maxLength={120} autoComplete="name" value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="req-phone" className={labelClass}>{tb('phone')}</label>
            <input id="req-phone" type="tel" required minLength={6} maxLength={40} autoComplete="tel"
              placeholder="+381 6x xxx xxxx" value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={fieldClass} />
          </div>
        </div>
        <div>
          <label htmlFor="req-email" className={labelClass}>
            {tb('email')} <span className="font-normal text-text/60">({tb('optional')})</span>
          </label>
          <input id="req-email" type="email" maxLength={200} autoComplete="email" value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="req-message" className={labelClass}>
            {tb('message')} <span className="font-normal text-text/60">({tb('optional')})</span>
          </label>
          <textarea id="req-message" rows={3} maxLength={2000} value={contact.message}
            placeholder={tb('messagePlaceholder')}
            onChange={(e) => setContact({ ...contact, message: e.target.value })}
            className={`${fieldClass} h-auto resize-none py-2`} />
        </div>
        {/* Spam trap: hidden from people, bots fill it in */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
          <label htmlFor="req-website">Website</label>
          <input id="req-website" tabIndex={-1} autoComplete="off" value={contact.website}
            onChange={(e) => setContact({ ...contact, website: e.target.value })} />
        </div>
      </fieldset>

      {errorText && (
        <p role="alert" className="mt-4 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">{errorText}</p>
      )}

      <button
        type="submit"
        disabled={!canSend || pending}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-dark py-3 font-medium text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {pending ? tb('sending') : tb('submit')}
      </button>
      {!canSend && !pending && <p className="mt-2 text-center text-xs text-text/60">{tb('pickFirst')}</p>}
    </form>
  );
}

/**
 * Prefills dates and guests from the URL (?checkIn=…&checkOut=…&guests=…) when the visitor
 * comes from search. Reading the URL on the client keeps the house page itself static.
 */
function WithSearchParams(props: Omit<BookingBoxProps, 'initialCheckIn' | 'initialCheckOut' | 'initialGuests'>) {
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
  props: Omit<BookingBoxProps, 'initialCheckIn' | 'initialCheckOut' | 'initialGuests'>
) {
  return (
    <Suspense fallback={<PriceCalculator {...props} />}>
      <WithSearchParams {...props} />
    </Suspense>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text/80">{label}</dt>
      <dd className="font-medium text-text">{value}</dd>
    </div>
  );
}

