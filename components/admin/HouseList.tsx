'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, ExternalLink, Star, Search, X } from 'lucide-react';
import { slugify } from '@/lib/slug';
import PublishToggle from '@/components/admin/PublishToggle';
import type { AdminHouseListItem } from '@/lib/admin-data';

type Filter = 'all' | 'published' | 'hidden' | 'featured';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Sve' },
  { value: 'published', label: 'Objavljene' },
  { value: 'hidden', label: 'Skrivene' },
  { value: 'featured', label: 'Izdvojene' },
];

/** "Kuća Čađavica" → "kuca cadjavica", so searching works with or without č/ć/š/ž/đ */
const normalize = (text: string) => slugify(text).replace(/-/g, ' ');

export default function HouseList({
  houses,
  destinations,
}: {
  houses: AdminHouseListItem[];
  destinations: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const destinationName = (id: string) => destinations.find((d) => d.id === id)?.name ?? id;

  const visible = useMemo(() => {
    const words = normalize(query).split(' ').filter(Boolean);
    return houses.filter((h) => {
      if (filter === 'published' && !h.is_published) return false;
      if (filter === 'hidden' && h.is_published) return false;
      if (filter === 'featured' && h.featured_rank === null) return false;
      if (words.length === 0) return true;
      // Every word must appear in the name, destination or address
      const haystack = normalize(`${h.name} ${destinationName(h.destination_id)} ${h.address}`);
      return words.every((w) => haystack.includes(w));
    });
    // destinationName only depends on destinations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houses, destinations, query, filter]);

  const counts: Record<Filter, number> = {
    all: houses.length,
    published: houses.filter((h) => h.is_published).length,
    hidden: houses.filter((h) => !h.is_published).length,
    featured: houses.filter((h) => h.featured_rank !== null).length,
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text/50" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretražite po nazivu, destinaciji ili adresi…"
            aria-label="Pretraga kuća"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text/60 hover:bg-background"
              aria-label="Obrišite pretragu"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value ? 'bg-primary text-white' : 'bg-white text-text/80 hover:bg-primary/10'
              }`}
            >
              {f.label} <span className="opacity-70">{counts[f.value]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mb-2 text-sm text-text/60" aria-live="polite">
        Prikazano {visible.length} od {houses.length}
      </p>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul className="divide-y divide-primary/10">
          {visible.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-background">
                {h.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.cover} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-primary">
                  {h.name}
                  {h.featured_rank !== null && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-dark"
                      title="Prikazuje se u „Izdvojeno za ovaj vikend“"
                    >
                      <Star className="size-3" aria-hidden /> Izdvojena #{h.featured_rank}
                    </span>
                  )}
                </p>
                <p className="text-sm text-text/70">
                  {destinationName(h.destination_id)} · noćenje {h.capacity}
                  {h.day_capacity ? ` · druženje ${h.day_capacity}` : ''} · od €{h.weekday_price}/noć
                </p>
              </div>
              <PublishToggle id={h.id} published={h.is_published} />
              <div className="flex gap-2">
                {h.is_published && (
                  <a
                    href={`/sr/kuce/${h.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm hover:bg-primary/10"
                  >
                    <ExternalLink className="size-4" aria-hidden /> Pogledaj
                  </a>
                )}
                <Link
                  href={`/admin/kuce/${h.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white"
                >
                  <Pencil className="size-4" aria-hidden /> Izmeni
                </Link>
              </div>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="p-8 text-center text-text/70">
              {houses.length === 0 ? 'Još nema kuća.' : 'Nijedna kuća ne odgovara pretrazi.'}
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
