'use client';

import { useState, useTransition } from 'react';
import { CalendarDays, Users, Phone, Mail, Home, Trash2, ExternalLink } from 'lucide-react';
import { deleteBookingRequest, setBookingStatus, type BookingStatus } from '@/app/admin/actions';
import type { BookingRequest } from '@/lib/admin-data';

export const bookingStatuses: { value: BookingStatus; label: string; className: string }[] = [
  { value: 'new', label: 'Novi', className: 'bg-accent-dark text-white' },
  { value: 'contacted', label: 'Kontaktiran vlasnik', className: 'bg-amber-100 text-amber-900' },
  { value: 'confirmed', label: 'Potvrđeno', className: 'bg-primary text-white' },
  { value: 'declined', label: 'Odbijeno', className: 'bg-gray-200 text-text/70' },
];

const dateFmt = new Intl.DateTimeFormat('sr-Latn', { day: 'numeric', month: 'short', year: 'numeric' });
const sentFmt = new Intl.DateTimeFormat('sr-Latn', { dateStyle: 'medium', timeStyle: 'short' });
const day = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const nightsWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'noć' : 'noći');
const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export default function BookingRequestRow({ request }: { request: BookingRequest }) {
  const [status, setStatus] = useState(request.status);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const current = bookingStatuses.find((s) => s.value === status)!;

  const change = (next: BookingStatus) => {
    const previous = status;
    setStatus(next);
    setError('');
    startTransition(async () => {
      const result = await setBookingStatus(request.id, next);
      if (!result.ok) {
        setStatus(previous);
        setError(result.error);
      }
    });
  };

  const remove = () => {
    if (!confirm(`Obrisati upit od ${request.name}?`)) return;
    startTransition(async () => {
      const result = await deleteBookingRequest(request.id);
      if (result.ok) setHidden(true);
      else setError(result.error);
    });
  };

  if (hidden) return null;

  const checkIn = day(request.check_in);
  const checkOut = day(request.check_out);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);

  return (
    <li className={`space-y-3 p-5 ${status === 'new' ? 'bg-accent/5' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-primary">
            <Home className="size-4" aria-hidden />
            {request.house_name}
            {request.house_slug && (
              <a href={`/sr/kuce/${request.house_slug}`} target="_blank" className="text-text/50 hover:text-primary" aria-label="Otvorite kuću na sajtu">
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </p>
          <p className="text-sm text-text/60">Poslato {sentFmt.format(new Date(request.created_at))}{request.locale === 'en' ? ' · na engleskom' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${current.className}`}>{current.label}</span>
          <select
            aria-label="Promenite status"
            value={status}
            disabled={pending}
            onChange={(e) => change(e.target.value as BookingStatus)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
          >
            {bookingStatuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="button" onClick={remove} disabled={pending} aria-label="Obrišite upit"
            className="rounded-lg p-2 text-accent-dark hover:bg-accent/10">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* The stay */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4 text-primary" aria-hidden />
          {dateFmt.format(checkIn)} – {dateFmt.format(checkOut)} · {nights} {nightsWord(nights)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4 text-primary" aria-hidden /> {request.guests} os.
        </span>
        <span className="font-semibold text-primary">€{request.quoted_total}</span>
      </div>

      {/* Who to call */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-background p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-text/60">Gost</p>
          <p className="font-medium">{request.name}</p>
          <a href={tel(request.phone)} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
            <Phone className="size-3.5" aria-hidden /> {request.phone}
          </a>
          {request.email && (
            <a href={`mailto:${request.email}`} className="block text-text/80 hover:underline">
              <Mail className="mr-1.5 inline size-3.5" aria-hidden />{request.email}
            </a>
          )}
        </div>
        <div className="rounded-lg bg-background p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-text/60">Vlasnik</p>
          {request.owner_phone ? (
            <a href={tel(request.owner_phone)} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
              <Phone className="size-3.5" aria-hidden /> {request.owner_phone}
            </a>
          ) : (
            <p className="text-text/60">{request.house_id ? 'Telefon vlasnika nije unet.' : 'Kuća je obrisana.'}</p>
          )}
        </div>
      </div>

      {request.message && (
        <p className="whitespace-pre-line rounded-lg border border-primary/10 p-3 text-sm text-text/85">{request.message}</p>
      )}
      {error && <p className="text-sm text-accent-dark">{error}</p>}
    </li>
  );
}
