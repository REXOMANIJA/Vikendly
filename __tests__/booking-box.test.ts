import type { House } from '@/types';
import { quoteStay } from '@/lib/pricing';
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
