import { calculateTotalPrice, countNights, getLowestNightlyPrice, getNightlyRates } from '@/lib/pricing';
import { House } from '@/types';

const baseHouse: House = {
  id: 'test-house',
  slug: 'test-house',
  name: 'Test House',
  destinationId: 'test-dest',
  categoryIds: [],
  capacity: 4,
  pricing: { weekdayPrice: 80, weekendPrice: 120, minNights: 2 },
  amenities: [],
  photos: [],
  description: { sr: '', en: '' },
  rules: { partiesAllowed: false, petsAllowed: false, smokingAllowed: false, checkInTime: '15:00', checkOutTime: '11:00' },
  location: { address: '' },
};

// Dates as local calendar days (month is 0-based): 9 Nov 2026 is a Monday
const day = (d: number, m = 10) => new Date(2026, m, d);

describe('calculateTotalPrice', () => {
  it('weekday nights only: nights × weekday price, nothing else', () => {
    const r = calculateTotalPrice(baseHouse, day(10), day(13), 4); // Tue → Fri: Tue, Wed, Thu
    expect(r.nights).toBe(3);
    expect(r.weekdayNights).toBe(3);
    expect(r.weekendNights).toBe(0);
    expect(r.total).toBe(240);
  });

  it('weekend nights only: Friday and Saturday at the weekend price', () => {
    const r = calculateTotalPrice(baseHouse, day(13), day(15), 4); // Fri → Sun
    expect(r.weekendNights).toBe(2);
    expect(r.total).toBe(240);
  });

  it('mixed stay', () => {
    const r = calculateTotalPrice(baseHouse, day(11), day(15), 4); // Wed → Sun
    expect([r.weekdayNights, r.weekendNights]).toEqual([2, 2]);
    expect(r.total).toBe(2 * 80 + 2 * 120);
  });

  it('returns zero for an invalid date range', () => {
    const r = calculateTotalPrice(baseHouse, day(15), day(10), 4);
    expect(r.total).toBe(0);
    expect(r.nights).toBe(0);
  });

  it('counts nights correctly across the clock change at the end of October', () => {
    // Clocks go back on Sun 25 Oct 2026: Fri 23 → Sun 25 is 49 hours, still 2 nights
    expect(countNights(day(23, 9), day(25, 9))).toBe(2);
    expect(calculateTotalPrice(baseHouse, day(23, 9), day(25, 9), 2).weekendNights).toBe(2);
  });
});

describe('prices by group size', () => {
  // Whole house (up to 10): €150 / €200. Smaller groups are cheaper.
  const house: House = {
    ...baseHouse,
    capacity: 10,
    pricing: {
      weekdayPrice: 150,
      weekendPrice: 200,
      minNights: 1,
      tiers: [
        { maxGuests: 6, weekdayPrice: 110, weekendPrice: 150 },
        { maxGuests: 2, weekdayPrice: 60, weekendPrice: 80 },
      ],
    },
  };

  it('picks the smallest group price that fits', () => {
    expect(getNightlyRates(house, 1).weekdayPrice).toBe(60);
    expect(getNightlyRates(house, 2).weekdayPrice).toBe(60);
    expect(getNightlyRates(house, 3).weekdayPrice).toBe(110);
    expect(getNightlyRates(house, 6).weekendPrice).toBe(150);
  });

  it('uses the whole-house price above the largest group price', () => {
    expect(getNightlyRates(house, 7).weekdayPrice).toBe(150);
    expect(getNightlyRates(house, 10).weekendPrice).toBe(200);
    expect(getNightlyRates(house, 7).tier).toBeUndefined();
  });

  it('applies the group price to the whole stay', () => {
    const r = calculateTotalPrice(house, day(13), day(15), 4); // Fri + Sat for 4 people
    expect(r.total).toBe(300);
    expect(r.tierMaxGuests).toBe(6);
  });

  it('shows the lowest price of any group as the "from" price', () => {
    expect(getLowestNightlyPrice(house)).toBe(60);
    expect(getLowestNightlyPrice({ ...house, pricing: { ...house.pricing, tiers: [] } })).toBe(150);
  });
});
