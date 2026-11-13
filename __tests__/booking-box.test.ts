import type { House } from '@/types';
import { quoteStay, stayMinNights } from '@/lib/pricing';
import { checkSelection, quoteSelection, suggestForStay, suggestSelection } from '@/lib/booking';
import { summarizeRules } from '@/lib/rules';

const d = (day: number) => new Date(2026, 10, day); // November 2026; 13th is a Friday
const rules = { partiesAllowed: false, petsAllowed: false, smokingAllowed: false, checkInTime: '15:00', checkOutTime: '11:00' };

const base: House = {
  id: 'h1',
  slug: 'kutak',
  name: 'Kutak',
  destinationId: 'beograd',
  categoryIds: [],
  capacity: 10,
  pricing: { weekdayPrice: 50, weekendPrice: 70, minNights: 1 },
  amenities: [],
  photos: [],
  description: { sr: '', en: '' },
  rules,
  location: { address: '' },
};

// Like Kutak u Vraniću: two places with beds and a party-only summer house
const kutak: House = {
  ...base,
  units: [
    { id: 'brv', name: 'Brvnara', capacity: 4, weekdayPrice: 63, weekendPrice: 63, rules: { ...rules, petsAllowed: true, checkInTime: '14:00' }, partyPrices: [] },
    { id: 'bal', name: 'Kuća sa balkonom', capacity: 6, weekdayPrice: 80, weekendPrice: 100, rules, partyPrices: [] },
    {
      id: 'let',
      name: 'Letnjikovac',
      capacity: 0,
      weekdayPrice: 0,
      weekendPrice: 0,
      partyOnly: true,
      dayCapacity: 70,
      rules: { ...rules, partiesAllowed: true },
      partyPrices: [{ maxGuests: 30, weekdayPrice: 190, weekendPrice: 315 }],
    },
  ],
};

describe('booking box: units suggested from dates and group size (U2)', () => {
  it('ticks the cheapest units that fit, with the same total as the cards', () => {
    const suggestion = suggestForStay(kutak, d(13), d(15), 3);
    expect(suggestion).toEqual([{ id: 'brv', guests: 3, partyGuests: 0 }]);
    const quote = quoteSelection(kutak, d(13), d(15), suggestion);
    expect(quote.total).toBe(quoteStay(kutak, d(13), d(15), 3)!.total);
  });

  it('fills the biggest unit first when the group needs several', () => {
    const suggestion = suggestForStay(kutak, d(13), d(15), 8);
    // Listed in page order, but the bigger house takes 6 and the cabin the other 2
    expect(suggestion).toEqual([
      { id: 'brv', guests: 2, partyGuests: 0 },
      { id: 'bal', guests: 6, partyGuests: 0 },
    ]);
    expect(checkSelection(kutak, suggestion)).toBeNull();
    expect(quoteSelection(kutak, d(13), d(15), suggestion).total).toBe(quoteStay(kutak, d(13), d(15), 8)!.total);
  });

  it('suggests nothing until both dates and the group size are known', () => {
    expect(suggestForStay(kutak, undefined, d(15), 3)).toEqual([]);
    expect(suggestForStay(kutak, d(13), d(15), 0)).toEqual([]);
    expect(suggestForStay(kutak, d(15), d(13), 3)).toEqual([]);
  });

  it('keeps the old behaviour for a single picked unit', () => {
    expect(suggestSelection(kutak, 3, ['Kuća sa balkonom'])).toEqual([{ id: 'bal', guests: 3, partyGuests: 0 }]);
  });
});

describe('house rules for the whole listing (U8)', () => {
  it('shows yes / no for a house rented as one', () => {
    const summary = summarizeRules({ ...base, rules: { ...rules, petsAllowed: true } });
    expect(summary.times).toEqual([{ checkIn: '15:00', checkOut: '11:00' }]);
    expect(summary.pets).toEqual({ state: 'yes', units: [] });
    expect(summary.parties.state).toBe('no');
  });

  it('combines the units: some allow, times per unit when they differ', () => {
    const summary = summarizeRules(kutak);
    // Party-only space counts as allowing parties
    expect(summary.parties).toEqual({ state: 'some', units: ['Letnjikovac'] });
    expect(summary.pets).toEqual({ state: 'some', units: ['Brvnara'] });
    expect(summary.smoking).toEqual({ state: 'no', units: [] });
    // Only places with beds have arrival times
    expect(summary.times).toEqual([
      { unit: 'Brvnara', checkIn: '14:00', checkOut: '11:00' },
      { unit: 'Kuća sa balkonom', checkIn: '15:00', checkOut: '11:00' },
    ]);
  });

  it('shows one time line when all units share it', () => {
    const same = { ...kutak, units: kutak.units!.map((u) => ({ ...u, rules: { ...u.rules, checkInTime: '15:00' } })) };
    expect(summarizeRules(same).times).toEqual([{ checkIn: '15:00', checkOut: '11:00' }]);
  });
});

describe('holiday (special) prices', () => {
  // 30 Dec 2026 – 2 Jan 2027: nights of 30.12 (Wed), 31.12 (Thu), 1.1 (Fri)
  const nye = new Date(2026, 11, 30);
  const out = new Date(2027, 0, 2);
  const special = { label: 'Nova godina', firstNight: '2026-12-31', lastNight: '2027-01-01', price: 150, minNights: 3 };
  const house: House = { ...base, pricing: { ...base.pricing, specials: [special] } };

  it('uses the holiday price for those nights and the normal price for the rest', () => {
    const quote = quoteStay(house, nye, out, 4)!;
    // 30.12 weekday €50 + 31.12 and 1.1 at €150
    expect(quote.total).toBe(50 + 150 + 150);
    expect(quote).toMatchObject({ weekdayNights: 1, weekendNights: 0, specialNights: 2, specialTotal: 300 });
  });

  it('replaces smaller-group prices too', () => {
    const tiered: House = {
      ...house,
      pricing: { ...house.pricing, tiers: [{ maxGuests: 2, weekdayPrice: 30, weekendPrice: 40 }] },
    };
    expect(quoteStay(tiered, nye, out, 2)!.total).toBe(30 + 150 + 150);
  });

  it('asks for the longer stay only when a holiday night is included', () => {
    expect(stayMinNights(house, nye, out)).toBe(3);
    expect(stayMinNights(house, new Date(2026, 11, 20), new Date(2026, 11, 22))).toBe(1);
  });

  it('prices each unit with its own holiday price', () => {
    const units: House = {
      ...kutak,
      units: kutak.units!.map((u) => (u.id === 'brv' ? { ...u, specials: [{ ...special, price: 120 }] } : u)),
    };
    const quote = quoteSelection(units, nye, out, [{ id: 'brv', guests: 2, partyGuests: 0 }]);
    // 30.12 at €63, then two holiday nights at €120
    expect(quote.total).toBe(63 + 120 + 120);
    expect(stayMinNights(units, nye, out)).toBe(3);
  });
});

describe('holiday prices for a party space', () => {
  const withParty: House = {
    ...kutak,
    units: kutak.units!.map((u) =>
      u.id === 'let'
        ? { ...u, specials: [{ label: 'Nova godina', firstNight: '2026-12-31', lastNight: '2026-12-31', price: 500, maxGuests: 30, minNights: 3 }] }
        : u
    ),
  };
  const party = (day: Date, people: number) =>
    quoteSelection(withParty, day, new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1), [
      { id: 'let', guests: 0, partyGuests: people },
    ]);

  it('uses the holiday party price on that day for that party size', () => {
    expect(party(new Date(2026, 11, 31), 25).total).toBe(500);
  });

  it('keeps the normal party price on other days', () => {
    // 1 Jan 2027 is a Friday: normal weekend price
    expect(party(new Date(2027, 0, 1), 25).total).toBe(315);
  });

  it('does not change nightly prices or the minimum stay', () => {
    const nye = new Date(2026, 11, 31);
    const out = new Date(2027, 0, 1);
    expect(quoteSelection(withParty, nye, out, [{ id: 'brv', guests: 2, partyGuests: 0 }]).total).toBe(63);
    expect(stayMinNights(withParty, nye, out)).toBe(1);
  });
});
