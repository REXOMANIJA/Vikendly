import { groupByCountry, pickHomepageDestinations } from '@/lib/destinations';
import type { Destination } from '@/types';

const dest = (id: string, country: Destination['country'] = 'SR'): Destination => ({ id, slug: id, name: id, country });

describe('pickHomepageDestinations', () => {
  // Admin order: a, b, c, d, e
  const all = ['a', 'b', 'c', 'd', 'e'].map((id) => dest(id));

  it('shows the destinations with the most houses first', () => {
    const picked = pickHomepageDestinations(all, { a: 1, b: 5, c: 3, d: 2, e: 4 }, 3);
    expect(picked.map((d) => d.id)).toEqual(['b', 'e', 'c']);
  });

  it('never shows destinations without houses', () => {
    const picked = pickHomepageDestinations(all, { a: 2, c: 1 }, 9);
    expect(picked.map((d) => d.id)).toEqual(['a', 'c']);
  });

  it('keeps the admin order when the number of houses is equal', () => {
    const picked = pickHomepageDestinations(all, { a: 2, b: 2, c: 2, d: 2, e: 2 }, 3);
    expect(picked.map((d) => d.id)).toEqual(['a', 'b', 'c']);
  });

  it('shows at most 9 by default, even with 30+ destinations', () => {
    const many = Array.from({ length: 35 }, (_, i) => dest(`d${i}`));
    const counts = Object.fromEntries(many.map((d, i) => [d.id, (i % 7) + 1]));
    expect(pickHomepageDestinations(many, counts)).toHaveLength(9);
  });
});

describe('groupByCountry', () => {
  it('groups by country in a fixed order and skips empty countries', () => {
    const groups = groupByCountry([dest('jahorina', 'BA'), dest('zlatibor'), dest('durmitor', 'ME'), dest('tara')]);
    expect(groups.map((g) => [g.country, g.destinations.map((d) => d.id)])).toEqual([
      ['SR', ['zlatibor', 'tara']],
      ['BA', ['jahorina']],
      ['ME', ['durmitor']],
    ]);
  });
});
