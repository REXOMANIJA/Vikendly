import type { House } from '@/types';
import { getBookables, getLowestNightlyPrice, getPartyPrice, partyLimit, quoteStay, WHOLE_HOUSE } from '@/lib/pricing';

const d = (day: number) => new Date(2026, 10, day); // November 2026; 13th is a Friday

const rules = { partiesAllowed: false, petsAllowed: false, smokingAllowed: false, checkInTime: '15:00', checkOutTime: '11:00' };

const base: House = {
  id: 'h1',
  slug: 'imanje',
  name: 'Imanje',
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

const withUnits: House = {
  ...base,
  units: [
    { id: 'a', name: 'Kuća', capacity: 4, weekdayPrice: 50, weekendPrice: 70, rules, partyPrices: [] },
    { id: 'b', name: 'Kuća sa balkonom', capacity: 6, weekdayPrice: 80, weekendPrice: 100, rules, partyPrices: [] },
    { id: 'c', name: 'Apartman', capacity: 2, weekdayPrice: 30, weekendPrice: 40, rules, partyPrices: [] },
  ],
};

describe('listings with units', () => {
  it('treats a listing without units as one bookable whole', () => {
    const [whole] = getBookables(base);
    expect(whole.id).toBe(WHOLE_HOUSE);
    expect(whole.capacity).toBe(10);
  });

  it('quotes the cheapest combination of units that fits the group', () => {
    // Fri–Sun, 2 weekend nights. 2 people: the apartment alone (2 × €40)
    expect(quoteStay(withUnits, d(13), d(15), 2)).toMatchObject({ total: 80, units: ['Apartman'] });
    // 5 people: Kuća sa balkonom alone (€200) beats Kuća + Apartman (€220)
    expect(quoteStay(withUnits, d(13), d(15), 5)).toMatchObject({ total: 200, units: ['Kuća sa balkonom'] });
    // 11 people: all three units
    expect(quoteStay(withUnits, d(13), d(15), 11).units).toEqual(['Kuća', 'Kuća sa balkonom', 'Apartman']);
  });

  it('shows the cheapest unit as the "from" price', () => {
    expect(getLowestNightlyPrice(withUnits)).toBe(30);
  });
});

describe('smaller-group prices in a unit', () => {
  const tiered: House = {
    ...withUnits,
    units: [
      {
        ...withUnits.units![1], // Kuća sa balkonom: sleeps 6, €80 / €100
        tiers: [{ maxGuests: 2, weekdayPrice: 50, weekendPrice: 60 }],
      },
    ],
  };

  it('uses the group price when the unit is not full', () => {
    expect(quoteStay(tiered, d(13), d(15), 2).total).toBe(120); // 2 weekend nights × €60
    expect(quoteStay(tiered, d(13), d(15), 5).total).toBe(200); // full price
  });

  it('counts group prices in the "from" price', () => {
    expect(getLowestNightlyPrice(tiered)).toBe(50);
  });
});

describe('party prices', () => {
  const party = {
    ...getBookables(base)[0],
    dayCapacity: 25,
    partyPrices: [
      { maxGuests: 15, weekdayPrice: 80, weekendPrice: 100 },
      { maxGuests: 25, weekdayPrice: 120, weekendPrice: 150 },
    ],
  };

  it('uses the smallest price level that fits the party', () => {
    expect(getPartyPrice(party, 10, true)).toBe(100);
    expect(getPartyPrice(party, 15, true)).toBe(100);
    expect(getPartyPrice(party, 16, true)).toBe(150);
  });

  it('uses the weekday price when the stay has no Friday or Saturday night', () => {
    expect(getPartyPrice(party, 10, false)).toBe(80);
    expect(getPartyPrice(party, 20, false)).toBe(120);
  });

  it('returns null when no level fits (price agreed in person)', () => {
    expect(getPartyPrice(party, 30, true)).toBeNull();
    expect(getPartyPrice({ ...party, partyPrices: [] }, 10, true)).toBeNull();
  });

  it('never allows fewer party guests than people sleeping there', () => {
    expect(partyLimit(party)).toBe(25);
    expect(partyLimit({ ...party, dayCapacity: undefined })).toBe(10);
  });
});

describe('party-only spaces (e.g. Letnjikovac)', () => {
  const venue: House = {
    ...withUnits,
    units: [
      withUnits.units![0], // Kuća: sleeps 4, €50 / €70
      {
        id: 'l',
        name: 'Letnjikovac',
        capacity: 0,
        dayCapacity: 70,
        weekdayPrice: 0,
        weekendPrice: 0,
        partyOnly: true,
        rules: { ...rules, partiesAllowed: true },
        partyPrices: [
          { maxGuests: 30, weekdayPrice: 190, weekendPrice: 315 },
          { maxGuests: 50, weekdayPrice: 250, weekendPrice: 375 },
          { maxGuests: 70, weekdayPrice: 315, weekendPrice: 440 },
        ],
      },
    ],
  };
  const { checkSelection, quoteSelection } = jest.requireActual('@/lib/booking') as typeof import('@/lib/booking');

  it('prices a party by the number of people and the day (Friday/Saturday = weekend)', () => {
    const saturday = quoteSelection(venue, d(14), d(15), [{ id: 'l', guests: 0, partyGuests: 45 }]);
    expect(saturday).toMatchObject({ partyOnly: true, total: 375 });
    const wednesday = quoteSelection(venue, d(18), d(19), [{ id: 'l', guests: 0, partyGuests: 70 }]);
    expect(wednesday.total).toBe(315);
  });

  it('adds the party to an overnight stay in another unit', () => {
    const q = quoteSelection(venue, d(13), d(15), [
      { id: 'a', guests: 4, partyGuests: 0 },
      { id: 'l', guests: 0, partyGuests: 25 },
    ]);
    expect(q.total).toBe(140 + 315); // Kuća 2 × €70, party on Friday (weekend) for up to 30
    expect(q.partyOnly).toBe(false);
  });

  it('checks party size, and refuses a party in a place with beds', () => {
    expect(checkSelection(venue, [{ id: 'l', guests: 0, partyGuests: 0 }])).toMatchObject({ code: 'partyTooFew' });
    expect(checkSelection(venue, [{ id: 'l', guests: 0, partyGuests: 80 }])).toMatchObject({ code: 'partyTooMany', max: 70 });
    expect(checkSelection(venue, [{ id: 'a', guests: 2, partyGuests: 10 }])).toMatchObject({ code: 'partyNotAllowed' });
    expect(checkSelection(venue, [{ id: 'l', guests: 0, partyGuests: 50 }])).toBeNull();
  });

  it('leaves the party space out of overnight prices in search', () => {
    expect(quoteStay(venue, d(13), d(15), 3).units).toEqual(['Kuća']);
    expect(getLowestNightlyPrice(venue)).toBe(50);
  });
});
