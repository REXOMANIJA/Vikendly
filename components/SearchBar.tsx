'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { groupByCountry } from '@/lib/destinations';
import DateRangePicker from '@/components/DateRangePicker';
import type { Destination } from '@/types';

const budgetOptions = [200, 300, 500, 800];

const fieldClass =
  'w-full h-11 px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
const labelClass = 'block text-sm font-medium mb-1.5';

export default function SearchBar({ destinations }: { destinations: Destination[] }) {
  const t = useTranslations('hero.search');
  const tCountry = useTranslations('destinations.countries');
  const locale = useLocale();
  const router = useRouter();

  // On phones the form starts as a compact bar and opens on tap; on tablet/desktop it's always open
  const [expanded, setExpanded] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  // Dates are kept as "yyyy-MM-dd" strings so they never shift because of timezones
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    if (expanded) nameRef.current?.focus();
  }, [expanded]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query: Record<string, string> = {};
    if (name.trim()) query.q = name.trim();
    if (destination) query.destination = destination;
    if (checkIn) query.checkIn = checkIn;
    if (checkOut) query.checkOut = checkOut;
    if (guests) query.guests = guests;
    if (budget) query.budget = budget;
    router.push({ pathname: '/search', query });
  };

  return (
    <div className="text-left text-text">
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-controls="search-form"
          className="md:hidden flex w-full items-center gap-3 rounded-full bg-white p-2 pl-5 shadow-xl text-left"
        >
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-primary">{t('compactTitle')}</span>
            <span className="block truncate text-sm text-text/60">{t('compactHint')}</span>
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-dark text-white">
            <Search className="size-5" aria-hidden />
          </span>
        </button>
      )}

      <form
        id="search-form"
        onSubmit={handleSearch}
        className={`${expanded ? 'block' : 'hidden'} md:block bg-white rounded-2xl shadow-xl p-4 md:p-6 space-y-4`}
      >
        <div className="md:hidden flex items-center justify-between -mb-1">
          <span className="font-semibold text-primary">{t('compactTitle')}</span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label={t('close')}
            className="-mr-1 flex size-9 items-center justify-center rounded-full text-text/60 hover:bg-background"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Phones: name, destination and dates full width; guests + budget side by side */}
        <div className="grid grid-cols-2 lg:grid-cols-[1.1fr_1fr_1.25fr_0.7fr_0.8fr] gap-3 md:gap-4">
          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="house-name" className={labelClass}>
              {t('name')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text/40" aria-hidden />
              <input
                id="house-name"
                ref={nameRef}
                type="search"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                maxLength={80}
                className={`${fieldClass} pl-9`}
              />
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="destination" className={labelClass}>
              {t('destination')}
            </label>
            <select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={fieldClass}
            >
              <option value="">{t('anyDestination')}</option>
              {/* Grouped by country and alphabetical, so a long list stays easy to scan */}
              {groupByCountry([...destinations].sort((a, b) => a.name.localeCompare(b.name, locale))).map((group) => (
                <optgroup key={group.country} label={tCountry(group.country)}>
                  {group.destinations.map((dest) => (
                    <option key={dest.id} value={dest.slug}>
                      {dest.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <DateRangePicker
            id="dates"
            label={t('dates')}
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(nextIn, nextOut) => {
              setCheckIn(nextIn);
              setCheckOut(nextOut);
            }}
            className="col-span-2 lg:col-span-1"
          />

          <div>
            <label htmlFor="guests" className={labelClass}>
              {t('guests')}
            </label>
            <input
              id="guests"
              type="number"
              min="1"
              max="30"
              inputMode="numeric"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="2"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="budget" className={labelClass}>
              {t('budget')}
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              step="10"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="500"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {budgetOptions.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setBudget(budget === String(amount) ? '' : String(amount))}
              aria-pressed={budget === String(amount)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                budget === String(amount)
                  ? 'bg-accent-dark text-white'
                  : 'bg-background text-text hover:bg-accent/20'
              }`}
            >
              ≤ {amount}€
            </button>
          ))}
          <span className="w-full sm:w-auto text-xs text-text/60">{t('budgetHint')}</span>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-medium hover:bg-accent-dark transition-colors"
        >
          <Search className="size-4" aria-hidden />
          {t('searchButton')}
        </button>
      </form>
    </div>
  );
}
