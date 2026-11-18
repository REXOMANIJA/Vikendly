import { completenessPoints, dailyShuffle, groupFit, newPoints, recommendHouses, reviewPoints } from '@/lib/ranking';
import { groupOption } from '@/lib/pricing';
import type { House } from '@/types';

const rules = { partiesAllowed: false, petsAllowed: true, smokingAllowed: false, checkInTime: '15:00', checkOutTime: '11:00' };
const today = new Date('2026-11-18T12:00:00Z');

function house(id: string, extra: Partial<House> = {}): House {
  return {
    id,
    slug: id,
    name: id,
    destinationId: 'tara',
    categoryIds: [],
    capacity: 6,
    pricing: { weekdayPrice: 80, weekendPrice: 100, minNights: 2 },
    amenities: [],
    photos: [],
    description: { sr: '', en: '' },
    rules,
    location: { address: '' },
    ...extra,
  };
}

const complete: Partial<House> = {
  photos: Array.from({ length: 12 }, (_, i) => `/p${i}.jpg`),
  description: { sr: 'x'.repeat(500), en: 'x'.repeat(500) },
  location: { address: '', lat: 43, lng: 19 },
  nearby: { sr: 'Jezero 2 km', en: '' },
  rulesText: { sr: 'Bez žurki', en: '' },
};

describe('recommended order', () => {
  it('keeps houses we visited in person first', () => {
    const order = recommendHouses(
      [house('a', { ...complete, rating: { average: 5, count: 20 } }), house('b', { verifiedAt: '2026-10-01' })],
      { today }
    );
    expect(order.map((h) => h.id)).toEqual(['b', 'a']);
  });

  it('puts a complete, well reviewed listing above an empty one', () => {
    const order = recommendHouses([house('empty'), house('good', { ...complete, rating: { average: 4.9, count: 8 } })], {
      today,
    });
    expect(order[0].id).toBe('good');
  });

  it('a single 5-star review does not beat many 4.9-star reviews', () => {
    expect(reviewPoints({ rating: { average: 4.9, count: 10 } })).toBeGreaterThan(
      reviewPoints({ rating: { average: 5, count: 1 } })
    );
    // No reviews sits in the middle, below good reviews, above bad ones
    expect(reviewPoints({})).toBeLessThan(reviewPoints({ rating: { average: 4.9, count: 10 } }));
    expect(reviewPoints({})).toBeGreaterThan(reviewPoints({ rating: { average: 3, count: 5 } }));
  });

  it('gives points for a complete listing', () => {
    expect(completenessPoints(house('x', complete))).toBe(25);
    expect(completenessPoints(house('y'))).toBe(0);
  });

  it('boosts new houses for 30 days', () => {
    expect(newPoints({ createdAt: '2026-11-18T00:00:00Z' }, today)).toBeCloseTo(10, 0);
    expect(newPoints({ createdAt: '2026-11-03T12:00:00Z' }, today)).toBeCloseTo(5, 1);
    expect(newPoints({ createdAt: '2026-09-01T00:00:00Z' }, today)).toBe(0);
    expect(newPoints({}, today)).toBe(0);
  });

  it('prefers a house that fits the group size', () => {
    expect(groupFit(house('six', { capacity: 6 }), 5)).toBeCloseTo(5 / 6);
    expect(groupFit(house('big', { capacity: 20 }), 5)).toBeCloseTo(0.25);
    expect(groupFit(house('small', { capacity: 4 }), 5)).toBe(0);
    const order = recommendHouses([house('big', { capacity: 20 }), house('six', { capacity: 6 })], { guests: 5, today });
    expect(order[0].id).toBe('six');
  });

  it('daily shuffle is the same all day and changes between days', () => {
    expect(dailyShuffle('a', today)).toBe(dailyShuffle('a', new Date('2026-11-18T23:00:00Z')));
    const days = ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'].map((d) => dailyShuffle('a', new Date(d)));
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it('does not change the list it gets', () => {
    const list = [house('b'), house('a')];
    recommendHouses(list, { today });
    expect(list.map((h) => h.id)).toEqual(['b', 'a']);
  });
});

describe('group option (listing with several units)', () => {
  // Like Etno selo Komarnica: a chalet for 5 with a pool (€65) and four chalets for 6 (€55)
  const unit = (id: string, capacity: number, price: number) => ({
    id,
    name: id,
    capacity,
    weekdayPrice: price,
    weekendPrice: price,
    rules,
    partyPrices: [],
  });
  const village = house('village', {
    capacity: 29,
    units: [unit('Šale sa bazenom', 5, 65), unit('Šale 1', 6, 55), unit('Šale 2', 6, 55), unit('Šale 3', 6, 55), unit('Šale 4', 6, 55)],
  });

  it('4 people get one chalet, the cheapest that fits', () => {
    expect(groupOption(village, 4)).toEqual({ capacity: 6, weekdayPrice: 55, units: ['Šale 1'] });
  });

  it('9 people get two chalets', () => {
    expect(groupOption(village, 9)).toEqual({ capacity: 12, weekdayPrice: 110, units: ['Šale 1', 'Šale 2'] });
  });

  it('a whole house is all or nothing', () => {
    expect(groupOption(house('h', { capacity: 6 }), 4)).toMatchObject({ capacity: 6, units: [] });
    expect(groupOption(house('h', { capacity: 6 }), 8)).toBeUndefined();
  });

  it('the village fits 4 people about as well as a house for 6, not like a place for 29', () => {
    expect(groupFit(village, 4)).toBeCloseTo(4 / 6);
  });
});
