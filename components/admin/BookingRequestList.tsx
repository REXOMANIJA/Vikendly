'use client';

import { useState } from 'react';
import BookingRequestRow, { bookingStatuses } from '@/components/admin/BookingRequestRow';
import type { BookingRequest } from '@/lib/admin-data';
import type { BookingStatus } from '@/app/admin/actions';

/** Booking requests, newest first (sorted by the server), with a status filter */
export default function BookingRequestList({ requests }: { requests: BookingRequest[] }) {
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const count = (s: BookingStatus) => requests.filter((r) => r.status === s).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter">
        {[{ value: 'all' as const, label: 'Svi', n: requests.length }, ...bookingStatuses.map((s) => ({ ...s, n: count(s.value) }))].map(
          (f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value ? 'bg-primary text-white' : 'bg-white text-text/80 hover:bg-primary/10'
              }`}
            >
              {f.label} <span className="opacity-70">{f.n}</span>
            </button>
          )
        )}
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul className="divide-y divide-primary/10">
          {visible.map((r) => <BookingRequestRow key={r.id} request={r} />)}
          {visible.length === 0 && (
            <li className="p-8 text-center text-text/70">
              {requests.length === 0 ? 'Još nema upita.' : 'Nema upita sa ovim statusom.'}
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
