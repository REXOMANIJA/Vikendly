'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import BookingRequestRow, { bookingStatuses } from '@/components/admin/BookingRequestRow';
import type { BookingRequest } from '@/lib/admin-data';
import type { BookingStatus } from '@/app/admin/actions';
import { slugify } from '@/lib/slug';

/** "Čačak" → "cacak", so search works with or without č/ć/š/ž/đ */
const normalize = (text: string) => slugify(text).replace(/-/g, ' ');

/** Booking requests, newest first (sorted by the server), with search and a status filter */
export default function BookingRequestList({ requests, nowIso }: { requests: BookingRequest[]; nowIso: string }) {
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  // One "now" from the server, so all "stigao pre…" labels agree (and match after loading)
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const count = (s: BookingStatus) => requests.filter((r) => r.status === s).length;

  const visible = useMemo(() => {
    const words = normalize(query).split(' ').filter(Boolean);
    const digits = query.replace(/\D/g, '');
    return requests.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!words.length) return true;
      // Name, house, e-mail, or a phone number typed with or without spaces
      if (digits.length >= 4 && r.phone.replace(/\D/g, '').includes(digits)) return true;
      const haystack = normalize(`${r.name} ${r.house_name} ${r.email ?? ''}`);
      return words.every((w) => haystack.includes(w));
    });
  }, [requests, filter, query]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text/50" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretražite po gostu, kući ili telefonu…"
            aria-label="Pretraga upita"
            className="h-11 w-full rounded-xl border border-primary/15 bg-white pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Obrišite pretragu"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text/60 hover:bg-background">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
          {[{ value: 'all' as const, label: 'Svi', n: requests.length }, ...bookingStatuses.map((s) => ({ ...s, n: count(s.value) }))].map(
            (f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.value ? 'bg-primary text-white' : 'bg-white text-text/80 ring-1 ring-primary/10 hover:bg-primary/10'
                }`}
              >
                {f.label} <span className="opacity-70">{f.n}</span>
              </button>
            )
          )}
        </div>
      </div>
      <ul className="space-y-4">
        {visible.map((r) => <BookingRequestRow key={r.id} request={r} now={now} />)}
        {visible.length === 0 && (
          <li className="rounded-2xl bg-white p-10 text-center text-text/70 shadow-sm">
            {requests.length === 0 ? 'Još nema upita.' : query ? 'Nijedan upit ne odgovara pretrazi.' : 'Nema upita sa ovim statusom.'}
          </li>
        )}
      </ul>
    </>
  );
}
