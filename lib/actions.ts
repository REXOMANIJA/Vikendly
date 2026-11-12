'use server';

import { getSupabase } from '@/lib/supabase/public';
import { getHouseBySlug } from '@/lib/data';
import { calculateTotalPrice } from '@/lib/pricing';
import { after } from 'next/server';
import { formatStay, parseDateParam } from '@/lib/dates';
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
  guests: number;
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
      error: 'dates' | 'past' | 'minNights' | 'guests' | 'contact' | 'house' | 'tooMany' | 'server';
      minNights?: number;
    };

const MAX_NIGHTS = 60;

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

  const guests = Math.floor(Number(input.guests));
  if (!Number.isFinite(guests) || guests < 1 || guests > house.capacity) return { ok: false, error: 'guests' };

  const quote = calculateTotalPrice(house, checkIn, checkOut, guests);
  if (quote.nights < house.pricing.minNights) {
    return { ok: false, error: 'minNights', minNights: house.pricing.minNights };
  }
  if (quote.nights > MAX_NIGHTS) return { ok: false, error: 'dates' };

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

  const { error } = await getSupabase()
    .from('booking_requests')
    .insert({
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
    });

  if (error) {
    if (isFloodGuard(error)) return { ok: false, error: 'tooMany' };
    console.error('Booking request insert failed:', error.message);
    return { ok: false, error: 'server' };
  }

  after(() =>
    notifyTeam(
      [
        `🏡 <b>Novi upit: ${esc(house.name)}</b>`,
        `📅 ${formatStay(checkIn, checkOut, 'sr')} (${quote.nights} ${quote.nights === 1 ? 'noć' : 'noći'})`,
        `👥 Broj osoba: ${guests} · ukupno €${Math.round(quote.total)}`,
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
