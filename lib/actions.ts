'use server';

import { getSupabase } from '@/lib/supabase/public';
import { getHouseBySlug } from '@/lib/data';
import { checkSelection, quoteSelection, type Selection } from '@/lib/booking';
import { after } from 'next/server';
import { formatDate, formatStay, parseDateParam } from '@/lib/dates';
import { esc, notifyTeam, withinRateLimit } from '@/lib/notify';
import { site } from '@/lib/site';

export type OwnerApplicationResult = { ok: true } | { ok: false; error: 'invalid' | 'tooMany' | 'server' };

/** Postgres error raised by the flood guard in migration 0009 */
const isFloodGuard = (error: { code?: string }) => error.code === 'P0001';

const limits = {
  name: [2, 120],
  phone: [6, 40],
  location: [2, 200],
  description: [1, 2000],
} as const;

/**
 * Saves an "Izdajte svoju kuću" application to Supabase (table owner_applications).
 * Visitors can only insert rows; the team reads them in the Supabase dashboard.
 */
export async function submitOwnerApplication(formData: FormData): Promise<OwnerApplicationResult> {
  // Hidden field humans never see; bots that fill every input get a fake "success"
  if (String(formData.get('website') ?? '').trim() !== '') return { ok: true };

  const values = {
    name: String(formData.get('name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
  };
  const locale = formData.get('locale') === 'en' ? 'en' : 'sr';

  for (const [field, [min, max]] of Object.entries(limits)) {
    const length = values[field as keyof typeof values].length;
    if (length < min || length > max) return { ok: false, error: 'invalid' };
  }

  // At most 3 applications per hour from one visitor
  if (!(await withinRateLimit('owner', 3, 3600))) return { ok: false, error: 'tooMany' };

  const { error } = await getSupabase()
    .from('owner_applications')
    .insert({ ...values, locale });

  if (error) {
    if (isFloodGuard(error)) return { ok: false, error: 'tooMany' };
    console.error('Owner application insert failed:', error.message);
    return { ok: false, error: 'server' };
  }

  // Sent after the visitor already got the "thank you" answer, so it never slows the form down
  after(() =>
    notifyTeam(
      [
        '🏠 <b>Nova prijava vlasnika</b>',
        `👤 ${esc(values.name)}`,
        `📞 ${esc(values.phone)}`,
        `📍 ${esc(values.location)}`,
        `💬 ${esc(values.description.slice(0, 600))}`,
        '',
        `<a href="${site.url}/admin/prijave">Otvorite prijave u adminu</a>`,
      ].join('\n')
    )
  );
  return { ok: true };
}

export type BookingRequestInput = {
  slug: string;
  checkIn: string; // yyyy-MM-dd
  checkOut: string;
  /** Which units (or the whole house), how many sleep there, how many come to a party */
  selections: Selection[];
  name: string;
  phone: string;
  email: string;
  message: string;
  locale: 'sr' | 'en';
  /** Spam trap: must stay empty */
  website: string;
};

export type BookingRequestResult =
  | { ok: true }
  | {
      ok: false;
      error: 'dates' | 'past' | 'minNights' | 'guests' | 'units' | 'party' | 'contact' | 'house' | 'tooMany' | 'server';
      minNights?: number;
    };

const MAX_NIGHTS = 60;

/** Serbian plural for Telegram messages: 1 osoba, 2 osobe, 5 osoba, 21 osoba, 22 osobe */
const osobe = (n: number) => {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return `${n} osoba`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} osobe`;
  return `${n} osoba`;
};

/** Today's date in Serbia ("yyyy-MM-dd"), whatever timezone the server runs in */
const todayInSerbia = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Belgrade' });

/**
 * Saves a booking request (table booking_requests). The team then calls the owner and gets
 * back to the guest. Everything is checked again here, and the price is recalculated on the
 * server so the saved price always matches the house's real prices.
 */
export async function submitBookingRequest(input: BookingRequestInput): Promise<BookingRequestResult> {
  if (input.website.trim() !== '') return { ok: true }; // bot

  const house = await getHouseBySlug(input.slug);
  if (!house) return { ok: false, error: 'house' };

  const checkIn = parseDateParam(input.checkIn);
  const checkOut = parseDateParam(input.checkOut);
  if (!checkIn || !checkOut || checkOut <= checkIn) return { ok: false, error: 'dates' };
  if (input.checkIn < todayInSerbia()) return { ok: false, error: 'past' };

  const selections: Selection[] = (Array.isArray(input.selections) ? input.selections : []).slice(0, 20).map((x) => ({
    id: String(x?.id ?? ''),
    guests: Math.floor(Number(x?.guests)),
    partyGuests: Math.floor(Number(x?.partyGuests) || 0),
  }));
  const problem = checkSelection(house, selections);
  if (problem) {
    const code = problem.code === 'guests' ? 'guests' : problem.code.startsWith('party') ? 'party' : 'units';
    return { ok: false, error: code };
  }

  const quote = quoteSelection(house, checkIn, checkOut, selections);
  // A party-only booking is one day, so the minimum stay doesn't apply
  if (!quote.partyOnly && quote.nights < house.pricing.minNights) {
    return { ok: false, error: 'minNights', minNights: house.pricing.minNights };
  }
  if (quote.nights > MAX_NIGHTS) return { ok: false, error: 'dates' };
  // People sleeping over; for a party-only booking, the number of people at the party
  const guests = quote.guests || quote.partyGuests;

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  const phoneDigits = phone.replace(/\D/g, '');
  if (name.length < 2 || name.length > 120) return { ok: false, error: 'contact' };
  if (phoneDigits.length < 6 || phone.length > 40) return { ok: false, error: 'contact' };
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)) return { ok: false, error: 'contact' };

  // At most 5 requests per hour from one visitor
  if (!(await withinRateLimit('booking', 5, 3600))) return { ok: false, error: 'tooMany' };

  const row = {
    house_id: house.id,
    house_name: house.name,
    check_in: input.checkIn,
    check_out: input.checkOut,
    guests,
    quoted_total: quote.total,
    name,
    phone,
    email: email || null,
    message: message.slice(0, 2000) || null,
    locale: input.locale === 'en' ? 'en' : 'sr',
  };
  // Which units, party size and the price of each part (columns added in migration 0010)
  const extra = {
    party_guests: quote.partyGuests || null,
    details: {
      units: quote.lines.map((l) => ({
        id: l.bookable.id,
        name: l.bookable.name,
        guests: l.guests,
        party_guests: l.partyGuests || null,
        stay: l.stay.total,
        party: l.party,
        total: l.total,
      })),
    },
  };
  let { error } = await getSupabase().from('booking_requests').insert({ ...row, ...extra });
  // Before migration 0010: save without the new columns rather than losing the request
  if (error && /party_guests|details/.test(error.message)) {
    ({ error } = await getSupabase().from('booking_requests').insert(row));
  }

  if (error) {
    if (isFloodGuard(error)) return { ok: false, error: 'tooMany' };
    console.error('Booking request insert failed:', error.message);
    return { ok: false, error: 'server' };
  }

  after(() =>
    notifyTeam(
      [
        `🏡 <b>Novi upit: ${esc(house.name)}</b>`,
        quote.partyOnly
          ? `📅 Žurka: ${formatDate(checkIn, 'sr')}`
          : `📅 ${formatStay(checkIn, checkOut, 'sr')} (${quote.nights} ${quote.nights === 1 ? 'noć' : 'noći'})`,
        ...quote.lines.map((l) => {
          if (l.bookable.partyOnly) {
            const price = l.party === null ? 'cena po dogovoru' : `€${Math.round(l.party)}`;
            return `🎉 ${esc(l.bookable.name)}: žurka, ${osobe(l.partyGuests)} · ${price}`;
          }
          const what = l.bookable.name ? `🏠 ${esc(l.bookable.name)}: ` : '👥 ';
          return `${what}${osobe(l.guests)} za noćenje · €${Math.round(l.total)}`;
        }),
        `💶 Ukupno: €${Math.round(quote.total)}${quote.partyOnRequest ? ' + žurka po dogovoru' : ''}`,
        `👤 ${esc(name)}`,
        `📞 ${esc(phone)}`,
        ...(email ? [`✉️ ${esc(email)}`] : []),
        ...(message ? [`💬 ${esc(message.slice(0, 600))}`] : []),
        '',
        `<a href="${site.url}/admin/upiti">Otvorite upite u adminu</a>`,
      ].join('\n')
    )
  );
  return { ok: true };
}
