'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import DestinationCard from '@/components/cards/DestinationCard';
import { slugify } from '@/lib/slug';

export type DestinationItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  countryLabel: string;
  houseCountLabel: string;
  houses: number;
};

export type CountryGroup = { country: string; label: string; items: DestinationItem[] };

/** "Divčibare" → "divcibare": search works with or without č/ć/š/ž/đ */
const normalize = (text: string) => slugify(text).replace(/-/g, ' ');

/** Every destination, grouped by country, with a quick filter so long lists stay usable */
export default function AllDestinations({ groups }: { groups: CountryGroup[] }) {
  const t = useTranslations('destinations');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = normalize(query);
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((d) => normalize(`${d.name} ${g.label}`).includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  return (
    <>
      <div className="relative mb-8 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text/50" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('filterLabel')}
          placeholder={t('filterPlaceholder')}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text/60 hover:bg-background"
            aria-label="×"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {visible.length === 0 && <p className="py-12 text-center text-text/70">{t('noMatch')}</p>}

      <div className="space-y-12">
        {visible.map((group) => (
          <section key={group.country} aria-labelledby={`country-${group.country}`}>
            <h2 id={`country-${group.country}`} className="mb-4 font-serif text-2xl font-bold text-primary">
              {group.label} <span className="font-sans text-base font-normal text-text/50">{group.items.length}</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {group.items.map((d) => (
                <DestinationCard
                  key={d.id}
                  name={d.name}
                  slug={d.slug}
                  image={d.image}
                  country={d.countryLabel}
                  houseCount={d.houses > 0 ? d.houseCountLabel : t('comingSoon')}
                  className="aspect-[4/3]"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
