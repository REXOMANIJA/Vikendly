import { getHouses, getHouseBySlug, getDestinationById, getSimilarHouses } from '@/lib/data';
import { getUpcomingWeekend, parseDateParam, toDateParam } from '@/lib/dates';

describe('house data', () => {
  const houses = getHouses();

  it('has a unique URL slug for every house', () => {
    const slugs = houses.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has a description in both languages and a known destination', () => {
    for (const house of houses) {
      expect(house.description.sr.length).toBeGreaterThan(20);
      expect(house.description.en.length).toBeGreaterThan(20);
      expect(getDestinationById(house.destinationId)).toBeDefined();
    }
  });

  it('finds houses by slug', () => {
    expect(getHouseBySlug('vila-ribnica')?.name).toBe('Vila Ribnica');
    expect(getHouseBySlug('does-not-exist')).toBeUndefined();
  });

  it('suggests similar houses, never the house itself', () => {
    const house = getHouseBySlug('vila-ribnica')!;
    const similar = getSimilarHouses(house);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.find((h) => h.id === house.id)).toBeUndefined();
  });
});

describe('dates', () => {
  it('finds the upcoming Friday–Sunday weekend', () => {
    // Thursday 5 Nov 2026 → Fri 6 to Sun 8
    const { checkIn, checkOut } = getUpcomingWeekend(new Date(2026, 10, 5));
    expect(toDateParam(checkIn)).toBe('2026-11-06');
    expect(toDateParam(checkOut)).toBe('2026-11-08');
  });

  it('uses today when today is Friday, next week from Saturday', () => {
    expect(toDateParam(getUpcomingWeekend(new Date(2026, 10, 6)).checkIn)).toBe('2026-11-06');
    expect(toDateParam(getUpcomingWeekend(new Date(2026, 10, 7)).checkIn)).toBe('2026-11-13');
  });

  it('parses yyyy-MM-dd as a local date and rejects junk', () => {
    const d = parseDateParam('2026-11-13')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getDay()]).toEqual([2026, 10, 13, 5]);
    expect(parseDateParam('banana')).toBeUndefined();
    expect(parseDateParam(undefined)).toBeUndefined();
  });
});
