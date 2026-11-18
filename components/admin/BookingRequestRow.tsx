'use client';

import { useState, useTransition } from 'react';
import {
  PartyPopper, CalendarDays, Users, Mail, Home, Trash2, ExternalLink, Clock, Send, Copy, Check, MapPin, MessageSquareText,
} from 'lucide-react';
import PhoneLinks from '@/components/admin/PhoneLinks';
import ReviewInvite from '@/components/admin/ReviewInvite';
import { deleteBookingRequest, setBookingStatus, type BookingStatus } from '@/app/admin/actions';
import type { BookingRequest } from '@/lib/admin-data';
import { ago, hoursSince } from '@/lib/admin-format';
import { mapOpenUrl } from '@/lib/maps';
import { whatsappUrl } from '@/lib/phone';

/** The steps of a request, in order. `className` = colour when it is the current step. */
export const bookingStatuses: { value: BookingStatus; label: string; className: string }[] = [
  { value: 'new', label: 'Novi', className: 'bg-accent-dark text-white' },
  { value: 'contacted', label: 'Kontaktiran vlasnik', className: 'bg-amber-400 text-amber-950' },
  { value: 'confirmed', label: 'Potvrđeno', className: 'bg-primary text-white' },
  { value: 'declined', label: 'Odbijeno', className: 'bg-gray-500 text-white' },
];

const dateFmt = new Intl.DateTimeFormat('sr-Latn', { day: 'numeric', month: 'short', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('sr-Latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
const shortFmtEn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const sentFmt = new Intl.DateTimeFormat('sr-Latn', { dateStyle: 'medium', timeStyle: 'short' });
const day = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const nightsWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'noć' : 'noći');

/** Message with the address for a confirmed guest, in the language they wrote in */
function addressMessage(r: BookingRequest): string | null {
  if (!r.house_address) return null;
  const first = r.name.trim().split(/\s+/)[0];
  const map = r.house_pin ? mapOpenUrl({ ...r.house_pin, address: r.house_address }) : '';
  if (r.locale === 'en') {
    const dates = `${shortFmtEn.format(day(r.check_in))} – ${shortFmtEn.format(day(r.check_out))}`;
    return (
      `Hi ${first}, this is Vikendly. Your stay at ${r.house_name} (${dates}) is confirmed.\n` +
      `Address: ${r.house_address}` +
      (map ? `\nMap: ${map}` : '') +
      (r.owner_phone ? `\nHost's phone: ${r.owner_phone}` : '') +
      `\nHave a great weekend!`
    );
  }
  const dates = `${shortFmt.format(day(r.check_in))} – ${shortFmt.format(day(r.check_out))}`;
  return (
    `Zdravo ${first}, ovde Vikendly. Vaš boravak u kući ${r.house_name} (${dates}) je potvrđen.\n` +
    `Adresa: ${r.house_address}` +
    (map ? `\nMapa: ${map}` : '') +
    (r.owner_phone ? `\nTelefon domaćina: ${r.owner_phone}` : '') +
    `\nŽelimo vam lep vikend!`
  );
}

export default function BookingRequestRow({ request, now }: { request: BookingRequest; now: Date }) {
  const [status, setStatus] = useState(request.status);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const change = (next: BookingStatus) => {
    if (next === status) return;
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
  const lines = request.details?.units ?? [];
  const waiting = hoursSince(request.created_at, now);
  const message = status === 'confirmed' ? addressMessage(request) : null;
  const wa = message ? whatsappUrl(request.phone) : null;

  const copy = async () => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Kopiranje nije uspelo. Označite tekst i kopirajte ga ručno.');
    }
  };

  return (
    <li
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition-colors ${
        status === 'new' ? 'ring-accent/40' : 'ring-primary/5'
      }`}
    >
      {/* Top: house, when it came, status steps */}
      <div className={`flex flex-wrap items-start justify-between gap-3 p-4 md:px-5 ${status === 'new' ? 'bg-accent/8' : ''}`}>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-serif text-lg font-bold text-primary">
            <Home className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{request.house_name}</span>
            {request.house_slug && (
              <a href={`/kuce/${request.house_slug}`} target="_blank" className="text-text/40 hover:text-primary" aria-label="Otvorite kuću na sajtu">
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text/60">
            <span title={sentFmt.format(new Date(request.created_at))}>Stigao {ago(request.created_at, now)}</span>
            {request.locale === 'en' && <span className="rounded bg-primary/10 px-1.5 text-xs font-semibold text-primary">EN</span>}
            {status === 'new' && waiting > 3 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-dark px-2 py-0.5 text-xs font-semibold text-white">
                <Clock className="size-3" aria-hidden /> čeka odgovor
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex flex-wrap gap-1 rounded-xl bg-background p-1" role="group" aria-label="Status upita">
            {bookingStatuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => change(s.value)}
                disabled={pending}
                aria-pressed={status === s.value}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  status === s.value ? s.className : 'text-text/60 hover:bg-white hover:text-primary'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={remove} disabled={pending} aria-label="Obrišite upit"
            className="rounded-lg p-2 text-text/40 hover:bg-accent/10 hover:text-accent-dark">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 md:px-5">
        {/* The stay */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5">
            <CalendarDays className="size-4 text-accent-dark" aria-hidden />
            {dateFmt.format(checkIn)} – {dateFmt.format(checkOut)} · {nights} {nightsWord(nights)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5">
            <Users className="size-4 text-accent-dark" aria-hidden /> {request.guests} os.
          </span>
          {request.party_guests ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 font-medium text-accent-dark">
              <PartyPopper className="size-4" aria-hidden /> žurka, {request.party_guests} os.
            </span>
          ) : null}
          <span className="ml-auto font-serif text-2xl font-bold text-primary lining-nums">€{request.quoted_total}</span>
        </div>

        {/* Units and party: one line per part, shown when there is more than a plain stay */}
        {lines.length > 0 && (lines.length > 1 || lines.some((l) => l.name || l.party_guests)) && (
          <ul className="space-y-1 rounded-xl border border-primary/10 p-3 text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-x-4">
                <span>
                  <strong className="text-primary">{l.name || 'Cela kuća'}</strong>:{' '}
                  {/* Party-only space: nobody sleeps there, only the party */}
                  {l.guests > 0 ? `${l.guests} os. za noćenje (€${l.stay})` : ''}
                  {l.party_guests
                    ? `${l.guests > 0 ? ' + ' : ''}žurka ${l.party_guests} os. (${l.party === null ? 'cena po dogovoru' : `€${l.party}`})`
                    : ''}
                </span>
                <span className="font-medium">€{l.total}</span>
              </li>
            ))}
          </ul>
        )}

        {request.message && (
          <p className="flex gap-2 whitespace-pre-line rounded-xl bg-sand/40 p-3 text-sm text-text/85">
            <MessageSquareText className="mt-0.5 size-4 shrink-0 text-accent-dark" aria-hidden />
            {request.message}
          </p>
        )}

        {/* Who to call */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-primary/10 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-text/50">Gost</p>
            <p className="mb-1 font-medium">{request.name}</p>
            <PhoneLinks phone={request.phone} />
            {request.email && (
              <a href={`mailto:${request.email}`} className="mt-1.5 block truncate text-text/80 hover:underline">
                <Mail className="mr-1.5 inline size-3.5" aria-hidden />{request.email}
              </a>
            )}
          </div>
          <div className="rounded-xl border border-primary/10 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-text/50">Vlasnik</p>
            {request.owner_phone ? (
              <PhoneLinks phone={request.owner_phone} className="mt-1" />
            ) : (
              <p className="mt-1 text-text/60">{request.house_id ? 'Telefon vlasnika nije unet.' : 'Kuća je obrisana.'}</p>
            )}
            {request.house_address && (
              <p className="mt-2 flex items-start gap-1.5 text-text/70">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {request.house_address}
              </p>
            )}
          </div>
        </div>

        {/* Confirmed: send the guest the address (it is never on the site) */}
        {status === 'confirmed' && (
          <div className="rounded-xl bg-primary/5 p-3 text-sm">
            <p className="mb-2 flex items-center gap-1.5 font-semibold text-primary">
              <Send className="size-4" aria-hidden /> Pošaljite gostu adresu
            </p>
            {message ? (
              <>
                <pre className="mb-2 whitespace-pre-wrap rounded-lg bg-white p-2.5 font-sans text-xs text-text/80">{message}</pre>
                <div className="flex flex-wrap gap-2">
                  {wa && (
                    <a href={`${wa}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-accent-dark">
                      <Send className="size-3.5" aria-hidden /> Pošaljite na WhatsApp
                    </a>
                  )}
                  <button type="button" onClick={copy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-primary ring-1 ring-primary/20 hover:bg-primary hover:text-white">
                    {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    {copied ? 'Kopirano' : 'Kopirajte poruku (za Viber/SMS)'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-text/70">Adresa kuće nije uneta. Dodajte je u admin → Kuće → izmena kuće.</p>
            )}
          </div>
        )}

        {/* After a confirmed stay: private link for the guest's review */}
        {status === 'confirmed' && request.house_id && (
          <ReviewInvite
            bookingId={request.id}
            guestName={request.name}
            guestPhone={request.phone}
            houseName={request.house_name}
            locale={request.locale}
            initial={request.review ?? null}
          />
        )}
        {error && <p className="text-sm text-accent-dark">{error}</p>}
      </div>
    </li>
  );
}
