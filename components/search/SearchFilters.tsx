'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDownUp, BadgeCheck, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import DateRangePicker from '@/components/DateRangePicker';
import { groupByCountry } from '@/lib/destinations';
import type { Destination } from '@/types';
import type { SearchValues } from '@/lib/search';


const fieldClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary';
const labelClass = 'mb-1.5 block text-sm font-medium';

/**
 * Filters and sorting above the search results. Every change updates the address
 * (?destination=…&guests=…), so results can be shared and the back button works.
 * Desktop: always visible. Phones: behind a "Filteri" button to keep results in view.
 */
export default function SearchFilters({
  values,
  destinations,
  categories,
}: {
  values: SearchValues;
  destinations: Destination[];
  categories: { id: string; slug: string }[];
}) {
  const t = useTranslations('search.filters');
  const tCat = useTranslations('categories');
  const tCountry = useTranslations('destinations.countries');
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  // Typed fields only apply on Enter / leaving the field, so results don't jump while typing
  const [q, setQ] = useState(values.q ?? '');
  const [guests, setGuests] = useState(values.guests ?? '');
  const [budget, setBudget] = useState(values.budget ?? '');
  useEffect(() => setQ(values.q ?? ''), [values.q]);
  useEffect(() => setGuests(values.guests ?? ''), [values.guests]);
  useEffect(() => setBudget(values.budget ?? ''), [values.budget]);
  // Dates are kept here until both are picked, then searched
  const [dates, setDates] = useState({ checkIn: values.checkIn ?? '', checkOut: values.checkOut ?? '' });
  useEffect(() => setDates({ checkIn: values.checkIn ?? '', checkOut: values.checkOut ?? '' }), [values.checkIn, values.checkOut]);

  const apply = (changes: Partial<SearchValues>) => {
    const next = { ...values, ...changes };
    const query = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>;
    startTransition(() => router.replace({ pathname: '/search', query }, { scroll: false }));
  };

  const clean = (value: string, max: number) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? String(Math.min(n, max)) : '';
  };

  const activeCount = ['destination', 'category', 'checkIn', 'guests', 'budget', 'q', 'verified'].filter(
    (k) => values[k as keyof SearchValues]
  ).length;

  const fields = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1.3fr_0.6fr_0.7fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: q.trim() || undefined });
        }}
      >
        <label htmlFor="f-q" className={labelClass}>
          {t('name')}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text/40" aria-hidden />
          <input
            id="f-q"
            type="search"
            value={q}
            maxLength={80}
            placeholder={t('namePlaceholder')}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => q.trim() !== (values.q ?? '') && apply({ q: q.trim() || undefined })}
            className={`${fieldClass} pl-9`}
          />
        </div>
      </form>
      <div>
        <label htmlFor="f-destination" className={labelClass}>
          {t('destination')}
        </label>
        <select
          id="f-destination"
          value={values.destination ?? ''}
          onChange={(e) => apply({ destination: e.target.value || undefined })}
          className={fieldClass}
        >
          <option value="">{t('anyDestination')}</option>
          {groupByCountry([...destinations].sort((a, b) => a.name.localeCompare(b.name, locale))).map((group) => (
            <optgroup key={group.country} label={tCountry(group.country)}>
              {group.destinations.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <DateRangePicker
        id="f-dates"
        label={t('dates')}
        checkIn={dates.checkIn}
        checkOut={dates.checkOut}
        onChange={(checkIn, checkOut) => {
          setDates({ checkIn, checkOut });
          // Only search once both dates are picked (or both cleared)
          if ((checkIn && checkOut) || (!checkIn && !checkOut)) apply({ checkIn: checkIn || undefined, checkOut: checkOut || undefined });
        }}
      />
      <div>
        <label htmlFor="f-guests" className={labelClass}>
          {t('guests')}
        </label>
        <input
          id="f-guests"
          type="number"
          min={1}
          max={100}
          inputMode="numeric"
          placeholder="—"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          onBlur={() => clean(guests, 100) !== (values.guests ?? '') && apply({ guests: clean(guests, 100) || undefined })}
          onKeyDown={(e) => e.key === 'Enter' && apply({ guests: clean(guests, 100) || undefined })}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="f-budget" className={labelClass}>
          {t('budget')}
        </label>
        <input
          id="f-budget"
          type="number"
          min={0}
          step={50}
          inputMode="numeric"
          placeholder="—"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          onBlur={() => clean(budget, 100000) !== (values.budget ?? '') && apply({ budget: clean(budget, 100000) || undefined })}
          onKeyDown={(e) => e.key === 'Enter' && apply({ budget: clean(budget, 100000) || undefined })}
          className={fieldClass}
        />
      </div>
    </div>
  );

  const chips = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => apply({ category: undefined })}
        aria-pressed={!values.category}
        className={chipClass(!values.category)}
      >
        {t('allTypes')}
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => apply({ category: values.category === c.slug ? undefined : c.slug })}
          aria-pressed={values.category === c.slug}
          className={chipClass(values.category === c.slug)}
        >
          {tCat(c.id as 'mountain')}
        </button>
      ))}
      <span className="mx-1 hidden h-5 w-px bg-primary/15 sm:block" aria-hidden />
      <button
        type="button"
        onClick={() => apply({ verified: values.verified ? undefined : '1' })}
        aria-pressed={!!values.verified}
        className={chipClass(!!values.verified)}
      >
        <BadgeCheck className="size-4" aria-hidden />
        {t('verified')}
      </button>
    </div>
  );

  const sort = (
    <label className="flex items-center gap-2 text-sm">
      <ArrowDownUp className="size-4 text-text/50" aria-hidden />
      <span className="sr-only md:not-sr-only">{t('sort')}</span>
      <select
        value={values.sort ?? ''}
        onChange={(e) => apply({ sort: e.target.value || undefined })}
        className="h-10 rounded-lg border border-gray-300 bg-white px-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">{t('sortRecommended')}</option>
        <option value="price-asc">{t('sortPriceAsc')}</option>
        <option value="price-desc">{t('sortPriceDesc')}</option>
        <option value="capacity">{t('sortCapacity')}</option>
      </select>
    </label>
  );

  return (
    <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-primary/10 md:p-5">
      {/* Phones: button that opens the filters, sort always visible */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="search-filters"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          {open ? <X className="size-4" aria-hidden /> : <SlidersHorizontal className="size-4" aria-hidden />}
          {t('filters')}
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs text-primary">{activeCount}</span>
          )}
        </button>
        {sort}
      </div>

      <div id="search-filters" className={`${open ? 'mt-4 block' : 'hidden'} space-y-4 md:mt-0 md:block`}>
        {fields}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-4">
          {chips}
          <div className="flex items-center gap-4">
            {pending && <Loader2 className="size-4 animate-spin text-primary" aria-label={t('loading')} />}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => apply({ q: undefined, destination: undefined, category: undefined, checkIn: undefined, checkOut: undefined, guests: undefined, budget: undefined, verified: undefined })}
                className="text-sm font-medium text-accent-dark hover:underline"
              >
                {t('clear')}
              </button>
            )}
            <div className="hidden md:block">{sort}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function chipClass(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active ? 'border-primary bg-primary text-white' : 'border-primary/20 bg-white text-primary hover:border-primary'
  }`;
}
