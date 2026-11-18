'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, ExternalLink, Star, Search, X, BadgeCheck, CalendarCheck } from 'lucide-react';
import { slugify } from '@/lib/slug';
import PublishToggle from '@/components/admin/PublishToggle';
import type { AdminHouseListItem } from '@/lib/admin-data';

type Filter = 'all' | 'published' | 'hidden' | 'featured' | 'verified' | 'unverified' | 'incomplete';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Sve' },
  { value: 'published', label: 'Objavljene' },
  { value: 'hidden', label: 'Skrivene' },
  { value: 'featured', label: 'Izdvojene' },
  { value: 'verified', label: 'Proverene' },
  { value: 'unverified', label: 'Neproverene' },
  { value: 'incomplete', label: 'Za dopunu' },
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
    // Houses on the site first, hidden ones after (each part A–Z, as loaded)
    const ordered = [...houses].sort((a, b) => Number(b.is_published) - Number(a.is_published));
    return ordered.filter((h) => {
      if (filter === 'published' && !h.is_published) return false;
      if (filter === 'hidden' && h.is_published) return false;
      if (filter === 'featured' && h.featured_rank === null) return false;
      if (filter === 'verified' && !h.verified_at) return false;
      if (filter === 'unverified' && h.verified_at) return false;
      if (filter === 'incomplete' && h.health.percent === 100) return false;
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
    verified: houses.filter((h) => h.verified_at).length,
    unverified: houses.filter((h) => !h.verified_at).length,
    incomplete: houses.filter((h) => h.health.percent < 100).length,
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text/50" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretražite po nazivu, destinaciji ili adresi…"
            aria-label="Pretraga kuća"
            className="h-11 w-full rounded-xl border border-primary/15 bg-white pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
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
                filter === f.value ? 'bg-primary text-white' : 'bg-white text-text/80 ring-1 ring-primary/10 hover:bg-primary/10'
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

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((h) => {
          const health = h.health.percent;
          const barColour = health === 100 ? 'bg-primary' : health >= 70 ? 'bg-amber-400' : 'bg-accent-dark';
          return (
            <li key={h.id} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/5 transition-shadow hover:shadow-md">
              <Link href={`/admin/kuce/${h.id}`} className="relative block aspect-[16/10] overflow-hidden bg-sand">
                {h.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.cover} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <span className="flex size-full items-center justify-center text-sm text-text/50">Nema fotografija</span>
                )}
                <span className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                  {h.featured_rank !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-accent-dark shadow-sm"
                      title="Prikazuje se u „Izdvojeno za ovaj vikend“">
                      <Star className="size-3" aria-hidden /> Izdvojena #{h.featured_rank}
                    </span>
                  )}
                  {h.verified_at && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
                      title={`Posetili smo je ${h.verified_at.split('-').reverse().join('.')}.`}>
                      <BadgeCheck className="size-3" aria-hidden /> Proverena
                    </span>
                  )}
                </span>
                {!h.is_published && (
                  <span className="absolute inset-0 flex items-center justify-center bg-primary/45 text-sm font-semibold uppercase tracking-wider text-white">
                    Skrivena
                  </span>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">{destinationName(h.destination_id)}</p>
                <Link href={`/admin/kuce/${h.id}`} className="font-serif text-lg font-bold leading-snug text-primary hover:text-accent-dark">
                  {h.name}
                </Link>
                <p className="mt-1 text-sm text-text/65">
                  {h.capacity > 0 ? `noćenje ${h.capacity}` : 'samo žurke'}
                  {h.day_capacity ? ` · druženje ${h.day_capacity}` : ''} · od €{h.weekday_price}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-text/65">
                  <CalendarCheck className="size-3.5 text-accent-dark" aria-hidden />
                  {h.requests90} {h.requests90 === 1 ? 'upit' : 'upita'} za 90 dana
                </p>

                {/* How complete the listing is */}
                <div className="mt-3" title={h.health.missing.length ? `Nedostaje: ${h.health.missing.join(', ')}` : 'Oglas je kompletan'}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-text/70">Oglas</span>
                    <span className={`font-semibold ${health === 100 ? 'text-primary' : 'text-text/70'}`}>{health}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
                    <div className={`h-full rounded-full ${barColour}`} style={{ width: `${health}%` }} />
                  </div>
                  {h.health.missing.length > 0 && (
                    <p className="mt-1 text-xs text-text/55">Nedostaje: {h.health.missing.slice(0, 2).join(', ')}{h.health.missing.length > 2 ? ` +${h.health.missing.length - 2}` : ''}</p>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-2 pt-4">
                  <PublishToggle id={h.id} published={h.is_published} />
                  {h.is_published && (
                    <a href={`/kuce/${h.slug}`} target="_blank" aria-label={`Pogledajte ${h.name} na sajtu`}
                      className="ml-auto rounded-lg p-2 text-text/60 hover:bg-primary/10 hover:text-primary">
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  <Link href={`/admin/kuce/${h.id}`}
                    className={`${h.is_published ? '' : 'ml-auto '}inline-flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-white`}>
                    <Pencil className="size-3.5" aria-hidden /> Izmeni
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="col-span-full rounded-2xl bg-white p-10 text-center text-text/70 shadow-sm">
            {houses.length === 0 ? 'Još nema kuća.' : 'Nijedna kuća ne odgovara pretrazi.'}
          </li>
        )}
      </ul>
    </>
  );
}
