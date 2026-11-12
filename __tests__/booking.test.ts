import { submitBookingRequest, type BookingRequestInput } from '@/lib/actions';
import { WHOLE_HOUSE } from '@/lib/pricing';

// Record what would be written to Supabase instead of calling it
const inserted: Record<string, unknown>[] = [];
jest.mock('@/lib/supabase/public', () => ({
  getSupabase: () => ({
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        inserted.push(row);
        return { error: null };
      },
    }),
  }),
}));

// Telegram alert and per-visitor limit: recorded instead of calling Telegram / Supabase
const alerts: string[] = [];
let limitReached = false;
jest.mock('@/lib/notify', () => ({
  esc: (text: string) => text,
  notifyTeam: async (html: string) => {
    alerts.push(html);
  },
  withinRateLimit: async () => !limitReached,
}));
// `after()` only works inside a Next.js request; here it just runs the callback
jest.mock('next/server', () => ({ after: (callback: () => unknown) => callback() }));

// Fixed "today" so the tests don't depend on when they run: Thu 5 Nov 2026
beforeAll(() => jest.useFakeTimers({ now: new Date('2026-11-05T10:00:00Z'), doNotFake: ['nextTick', 'setImmediate'] }));
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  inserted.length = 0;
  alerts.length = 0;
  limitReached = false;
});

// Vila Ribnica (sample data): sleeps 8, €80 weekday / €120 weekend, min 2 nights
const valid: BookingRequestInput = {
  slug: 'vila-ribnica',
  checkIn: '2026-11-13', // Friday
  checkOut: '2026-11-15', // Sunday
  selections: [{ id: WHOLE_HOUSE, guests: 4, partyGuests: 0 }],
  name: 'Marko Marković',
  phone: '+381 64 123 4567',
  email: '',
  message: '',
  locale: 'sr',
  website: '',
};

describe('submitBookingRequest', () => {
  it('saves a valid request with the price calculated on the server', async () => {
    expect(await submitBookingRequest(valid)).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      house_name: 'Vila Ribnica',
      check_in: '2026-11-13',
      check_out: '2026-11-15',
      guests: 4,
      quoted_total: 240, // 2 weekend nights × €120, no extra fees
      email: null,
      message: null,
    });
  });

  it('rejects stays shorter than the house minimum', async () => {
    const r = await submitBookingRequest({ ...valid, checkOut: '2026-11-14' });
    expect(r).toEqual({ ok: false, error: 'minNights', minNights: 2 });
    expect(inserted).toHaveLength(0);
  });

  it('rejects dates in the past and reversed dates', async () => {
    expect(await submitBookingRequest({ ...valid, checkIn: '2026-11-01', checkOut: '2026-11-03' })).toMatchObject({ error: 'past' });
    expect(await submitBookingRequest({ ...valid, checkIn: '2026-11-15', checkOut: '2026-11-13' })).toMatchObject({ error: 'dates' });
  });

  it('rejects more guests than the house sleeps', async () => {
    expect(
      await submitBookingRequest({ ...valid, selections: [{ id: WHOLE_HOUSE, guests: 9, partyGuests: 0 }] })
    ).toMatchObject({ error: 'guests' });
  });

  it('requires a name and a real phone number; email is optional but must look valid', async () => {
    expect(await submitBookingRequest({ ...valid, name: 'M' })).toMatchObject({ error: 'contact' });
    expect(await submitBookingRequest({ ...valid, phone: 'call me' })).toMatchObject({ error: 'contact' });
    expect(await submitBookingRequest({ ...valid, email: 'not-an-email' })).toMatchObject({ error: 'contact' });
    expect(await submitBookingRequest({ ...valid, email: 'marko@example.com' })).toEqual({ ok: true });
  });

  it('rejects unknown houses', async () => {
    expect(await submitBookingRequest({ ...valid, slug: 'does-not-exist' })).toMatchObject({ error: 'house' });
  });

  it('silently ignores spam bots that fill the hidden field', async () => {
    expect(await submitBookingRequest({ ...valid, website: 'http://spam' })).toEqual({ ok: true });
    expect(inserted).toHaveLength(0);
  });

  it('refuses a visitor who already sent too many requests', async () => {
    limitReached = true;
    expect(await submitBookingRequest(valid)).toEqual({ ok: false, error: 'tooMany' });
    expect(inserted).toHaveLength(0);
    expect(alerts).toHaveLength(0);
  });

  it('sends the team a Telegram alert with the stay, total and guest contact', async () => {
    await submitBookingRequest({ ...valid, email: 'marko@example.com' });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain('Vila Ribnica');
    expect(alerts[0]).toContain('13.11. – 15.11.2026.');
    expect(alerts[0]).toContain('€240');
    expect(alerts[0]).toContain('+381 64 123 4567');
    expect(alerts[0]).toContain('marko@example.com');
  });

  it('rejects a party where parties are not allowed, and unknown units', async () => {
    // Vila Ribnica: no parties
    expect(
      await submitBookingRequest({ ...valid, selections: [{ id: WHOLE_HOUSE, guests: 4, partyGuests: 10 }] })
    ).toMatchObject({ error: 'party' });
    expect(
      await submitBookingRequest({ ...valid, selections: [{ id: 'no-such-unit', guests: 2, partyGuests: 0 }] })
    ).toMatchObject({ error: 'units' });
    expect(await submitBookingRequest({ ...valid, selections: [] })).toMatchObject({ error: 'units' });
    expect(inserted).toHaveLength(0);
  });

  it('saves how many sleep over and the price breakdown', async () => {
    await submitBookingRequest(valid);
    expect(inserted[0]).toMatchObject({
      guests: 4,
      party_guests: null,
      details: { units: [{ id: WHOLE_HOUSE, guests: 4, stay: 240, party: 0, total: 240 }] },
    });
  });
});
