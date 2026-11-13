'use client';

import { Suspense, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, CircleCheck, Loader2, PawPrint, Send, Users } from 'lucide-react';
import type { House } from '@/types';
import { getBookables, getNightlyRates, hasUnits, isVenue, partyLimit, quoteStay, type Bookable } from '@/lib/pricing';
import { checkSelection, quoteSelection, suggestSelection, type Selection, type SelectionProblem } from '@/lib/booking';
import { formatDateRange, parseDateParam } from '@/lib/dates';
import { submitBookingRequest, type BookingRequestResult } from '@/lib/actions';
import DateRangePicker from '@/components/DateRangePicker';
import PrivacyNote from '@/components/PrivacyNote';

interface BookingBoxProps {
  house: House;
  /** Prefilled from the search the visitor came from ("yyyy-MM-dd") */
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

/** What the visitor entered for one unit (or the whole house); numbers kept as typed */
/** People sleeping there, or (party-only space) people at the party */
type LineState = { selected: boolean; guests: string; partyGuests: string };

const eur = (n: number) => `€${Math.round(n * 100) / 100}`;

const fieldClass =
  'w-full h-11 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
const labelClass = 'block text-sm font-medium mb-1.5';

/**
 * Price + booking request. Guests don't contact owners directly: the request is saved
 * (table booking_requests), the Vikendly team checks the dates with the owner and calls back.
 * A listing split into units lets the guest pick one or more units in one request;
 * where parties are allowed, the guest can add a party with its own price.
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
  const tu = useTranslations('house.units');
  const locale = useLocale();
  const { pricing } = house;
  const multi = hasUnits(house);
  const bookables = useMemo(() => getBookables(house), [house]);

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [lines, setLines] = useState<Record<string, LineState>>(() => {
    // Coming from search with a group size: preselect what fits (for units, the cheapest combination)
    const inDate = parseDateParam(initialCheckIn);
    const outDate = parseDateParam(initialCheckOut);
    const unitNames =
      multi && initialGuests && inDate && outDate && outDate > inDate
        ? quoteStay(house, inDate, outDate, initialGuests)?.units
        : undefined;
    // A venue with a single party space: that space is always the one being booked
    const venueSingle = isVenue(house) && bookables.length === 1;
    const preset =
      (multi && !unitNames && !venueSingle) ? [] : suggestSelection(house, initialGuests ?? 1, unitNames);
    return Object.fromEntries(
      bookables.map((b) => {
        const p = preset.find((x) => x.id === b.id);
        return [
          b.id,
          {
            selected: !multi || !!p,
            guests: p && initialGuests && p.guests ? String(p.guests) : '',
            partyGuests: p && initialGuests && p.partyGuests ? String(p.partyGuests) : '',
          },
        ];
      })
    );
  });
  const [contact, setContact] = useState({ name: '', phone: '', email: '', message: '', website: '' });
  const [result, setResult] = useState<BookingRequestResult | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (id: string, changes: Partial<LineState>) => {
    setLines((all) => ({ ...all, [id]: { ...all[id], ...changes } }));
    setResult(null);
  };

  const inDate = parseDateParam(checkIn);
  const outDate = parseDateParam(checkOut);
  const selections: Selection[] = bookables
    .filter((b) => lines[b.id].selected)
    .map((b) =>
      b.partyOnly
        ? { id: b.id, guests: 0, partyGuests: parseInt(lines[b.id].partyGuests, 10) || 0 }
        : { id: b.id, guests: parseInt(lines[b.id].guests, 10) || 0, partyGuests: 0 }
    );
  const isPartyOnly = (id: string) => bookables.find((b) => b.id === id)?.partyOnly === true;
  // Only party-only spaces chosen: the guest picks one day instead of a stay
  const oneDay = selections.length > 0 && selections.every((s) => isPartyOnly(s.id));
  // Price only once every chosen unit has its numbers filled in
  const complete =
    selections.length > 0 && selections.every((s) => (isPartyOnly(s.id) ? s.partyGuests > 0 : s.guests > 0));

  const problemText = (p: SelectionProblem) => {
    const unit = 'unit' in p && p.unit ? p.unit : t('thisHouse');
    const count = 'max' in p ? p.max : 'min' in p ? p.min : 0;
    return t(`problems.${p.code}`, { unit, count });
  };
  const problem = useMemo(() => {
    if (inDate && outDate && outDate <= inDate) return t('invalidDates');
    // Check what has been typed so far (e.g. too many guests) without waiting for every field
    const typed = selections.filter((s) => s.guests > 0 || s.partyGuests > 0);
    const found = typed.length ? checkSelection(house, typed) : null;
    return found ? problemText(found) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inDate?.getTime(), outDate?.getTime(), JSON.stringify(selections), house]);

  const quote = inDate && outDate && complete && !problem ? quoteSelection(house, inDate, outDate, selections) : undefined;
  const tooShort = quote && !quote.partyOnly && quote.nights < pricing.minNights;
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
            selections,
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
            guests: quote ? quote.guests || quote.partyGuests : selections.reduce((sum, s) => sum + s.guests, 0),
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

  const whole = bookables[0];
  const wholeLine = lines[whole.id];
  const onlyStay = quote && !multi && quote.partyGuests === 0;

  return (
    <form
      id="cena"
      onSubmit={onSubmit}
      className="rounded-2xl border border-primary/10 bg-white p-5 md:p-6 shadow-lg scroll-mt-24"
    >
      <h2 className="font-serif text-2xl font-bold text-primary">{tb('title')}</h2>

      {multi ? (
        // ── Units: pick one or more ──
        <fieldset className="mt-4">
          <legend className="font-semibold text-primary">{t('unitsTitle')}</legend>
          <p className="text-sm text-text/60">{t('unitsHint')}</p>
          <div className="mt-3 space-y-3">
            {bookables.map((b) => {
              const line = lines[b.id];
              return (
                <div
                  key={b.id}
                  className={`rounded-xl p-3 ring-1 transition-colors ${line.selected ? 'bg-primary/5 ring-2 ring-primary' : 'ring-primary/15'}`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-5 accent-primary"
                      checked={line.selected}
                      onChange={(e) => update(b.id, { selected: e.target.checked })}
                    />
                    <span className="flex-1">
                      <span className="block font-semibold text-primary">{b.name}</span>
                      {b.partyOnly ? (
                        <span className="block text-xs text-text/70">
                          {t('partyOnlyCard', { count: partyLimit(b) })}
                          {b.partyPrices.length > 0 &&
                            ` · ${t('fromPrice', { price: eur(Math.min(...b.partyPrices.map((p) => p.weekdayPrice))) })}`}
                        </span>
                      ) : (
                      <span className="block text-xs text-text/70">
                        {t('unitSleeps', { count: b.capacity })} ·{' '}
                        {t('unitPrices', { weekday: eur(b.pricing.weekdayPrice), weekend: eur(b.pricing.weekendPrice) })}
                        {(b.pricing.tiers ?? []).length > 0 &&
                          ` · ${t('fromGroup', { price: eur(Math.min(...b.pricing.tiers!.map((x) => x.weekdayPrice))) })}`}
                      </span>
                      )}
                      <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-text/60">
                        {!b.partyOnly && partyLimit(b) > b.capacity && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5" aria-hidden /> {t('dayGuests', { count: partyLimit(b) })}
                          </span>
                        )}
                        {b.rules.petsAllowed && (
                          <span className="inline-flex items-center gap-1">
                            <PawPrint className="size-3.5" aria-hidden /> {tu('pets')}
                          </span>
                        )}
                      </span>
                    </span>
                  </label>
                  {line.selected && (
                    <div className="mt-3 space-y-3 border-t border-primary/10 pt-3">
                      {b.partyOnly ? (
                        <PartyOnlyFields bookable={b} value={line.partyGuests} onChange={(partyGuests) => update(b.id, { partyGuests })} />
                      ) : (
                      <div>
                        <label htmlFor={`guests-${b.id}`} className={labelClass}>{t('unitGuests')}</label>
                        <input
                          id={`guests-${b.id}`}
                          type="number"
                          min="1"
                          max={b.capacity}
                          inputMode="numeric"
                          value={line.guests}
                          required
                          placeholder={`1–${b.capacity}`}
                          onChange={(e) => update(b.id, { guests: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <WholeHouseRates house={house} guestCount={parseInt(wholeLine.guests, 10) || 0} />
      )}

      {/* Stay */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <DateRangePicker
          id="calc-dates"
          label={oneDay ? t('partyDate') : tDates('label')}
          single={oneDay}
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={(nextIn, nextOut) => {
            setCheckIn(nextIn);
            setCheckOut(nextOut);
            setResult(null);
          }}
          className="col-span-2"
        />
        {!multi && (
          <div className="col-span-2 space-y-3">
            <div>
              <label htmlFor="calc-guests" className={labelClass}>{t('guestsLabel')}</label>
              <input id="calc-guests" type="number" min="1" max={whole.capacity} inputMode="numeric" value={wholeLine.guests} required
                onChange={(e) => update(whole.id, { guests: e.target.value })} placeholder={`1–${whole.capacity}`} className={fieldClass} />
            </div>
            {partyLimit(whole) > whole.capacity && (
              <p className="flex items-start gap-2 rounded-lg bg-background px-3 py-2 text-sm text-text/80">
                <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {t('dayGuestsNote', { day: partyLimit(whole), sleeps: whole.capacity })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mt-5" aria-live="polite">
        {problem ? (
          <p className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">{problem}</p>
        ) : quote ? (
          <>
            <dl className="space-y-2 text-sm">
              {onlyStay ? (
                <>
                  {quote.lines[0].stay.weekdayNights > 0 && (
                    <Row
                      label={t('weekdayLine', { count: quote.lines[0].stay.weekdayNights, price: eur(quote.lines[0].stay.weekdayRate) })}
                      value={eur(quote.lines[0].stay.weekdayNights * quote.lines[0].stay.weekdayRate)}
                    />
                  )}
                  {quote.lines[0].stay.weekendNights > 0 && (
                    <Row
                      label={t('weekendLine', { count: quote.lines[0].stay.weekendNights, price: eur(quote.lines[0].stay.weekendRate) })}
                      value={eur(quote.lines[0].stay.weekendNights * quote.lines[0].stay.weekendRate)}
                    />
                  )}
                </>
              ) : (
                quote.lines.map((l) => (
                  <div key={l.bookable.id} className="space-y-1">
                    {l.bookable.partyOnly ? (
                      <Row
                        label={t('linePartyOnly', { name: l.bookable.name, count: l.partyGuests })}
                        value={l.party === null ? t('linePartyOnRequest') : eur(l.party)}
                      />
                    ) : (
                    <Row
                      label={
                        l.bookable.name
                          ? t('lineStay', { name: l.bookable.name, nights: l.stay.nights, guests: l.guests })
                          : t('lineStayWhole', { nights: l.stay.nights, guests: l.guests })
                      }
                      value={eur(l.stay.total)}
                    />
                    )}
                  </div>
                ))
              )}
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-primary/10 pt-4">
              <span className="font-semibold text-primary">{t('total')}</span>
              <span className="text-2xl font-bold text-primary">{eur(quote.total)}</span>
            </div>
            {quote.partyOnRequest && <p className="mt-1 text-right text-sm text-text/70">{t('totalPlusParty')}</p>}
            {onlyStay && quote.guests > 1 && (
              <p className="mt-1 text-right text-sm font-medium text-accent-dark">
                {t('perPerson', { price: eur(Math.round(quote.total / quote.guests)) })}
              </p>
            )}
            {tooShort && (
              <p className="mt-3 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">
                {t('tooFewNights', { count: pricing.minNights })}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-text/70">{multi && selections.length === 0 ? t('problems.none') : t('pickDates')}</p>
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
      <PrivacyNote kind="booking" className="mt-3 text-center" />
    </form>
  );
}

/** Nightly rates of a house rented as one: two prices, or a table when price depends on group size */
function WholeHouseRates({ house, guestCount }: { house: House; guestCount: number }) {
  const t = useTranslations('house.calculator');
  const { pricing, capacity } = house;
  // Group prices below the whole-house price (prices for the full capacity are the house price)
  const tiers = (pricing.tiers ?? []).filter((tier) => tier.maxGuests < capacity);
  const activeTierMax = getNightlyRates(house, guestCount).tier?.maxGuests ?? capacity;

  if (tiers.length === 0) {
    return (
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
    );
  }

  const rows = [
    ...tiers.map((tier) => ({ key: tier.maxGuests, label: t('tierRow', { count: tier.maxGuests }), ...tier })),
    {
      key: capacity,
      label: t('wholeHouse', { count: capacity }),
      maxGuests: capacity,
      weekdayPrice: pricing.weekdayPrice,
      weekendPrice: pricing.weekendPrice,
    },
  ];
  return (
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
        {rows.map((row) => {
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
  );
}

/** Party-only space: how many people come, and the price levels (weekday / weekend) */
function PartyOnlyFields({
  bookable,
  value,
  onChange,
}: {
  bookable: Bookable;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('house.calculator');
  const id = `party-${bookable.id}`;
  const limit = partyLimit(bookable);
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={id} className={labelClass}>{t('partyPeople')}</label>
        <input
          id={id}
          type="number"
          min={1}
          max={limit}
          inputMode="numeric"
          value={value}
          required
          placeholder={`1–${limit}`}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      </div>
      {bookable.partyPrices.length > 0 ? (
        <div className="rounded-xl bg-background p-3 text-sm">
          <p className="text-xs font-medium text-text/70">{t('partyLevels')}</p>
          <ul className="mt-1 space-y-0.5">
            {bookable.partyPrices.map((p) => (
              <li key={p.maxGuests} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-text/80">
                  <Check className="size-3.5 text-primary" aria-hidden />
                  {t('partyLevel', { count: p.maxGuests })}
                </span>
                <span className="font-medium text-primary">
                  {eur(p.weekdayPrice)} / {eur(p.weekendPrice)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-text/60">{t('partyWeekendHint')}</p>
        </div>
      ) : (
        <p className="text-sm text-text/70">{t('partyOnRequest')}</p>
      )}
    </div>
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
