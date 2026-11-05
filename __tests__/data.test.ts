import {
  getHouses,
  getHouseBySlug,
  getDestinationById,
  getSimilarHouses,
  getFeaturedHouses,
  getHouseCountsByDestination,
} from '@/lib/data';
import { getUpcomingWeekend, parseDateParam, toDateParam } from '@/lib/dates';

// In tests lib/data.ts reads the sample data in /data (the same data as supabase/seed.sql)
describe('house data', () => {
  it('has a unique URL slug for every house', async () => {
    const slugs = (await getHouses()).map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has a description in both languages and a known destination', async () => {
    for (const house of await getHouses()) {
      expect(house.description.sr.length).toBeGreaterThan(20);
      expect(house.description.en.length).toBeGreaterThan(20);
      expect(await getDestinationById(house.destinationId)).toBeDefined();
    }
  });

  it('finds houses by slug', async () => {
    expect((await getHouseBySlug('vila-ribnica'))?.name).toBe('Vila Ribnica');
    expect(await getHouseBySlug('does-not-exist')).toBeUndefined();
  });

  it('suggests similar houses, never the house itself', async () => {
    const house = (await getHouseBySlug('vila-ribnica'))!;
    const similar = await getSimilarHouses(house);
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.find((h) => h.id === house.id)).toBeUndefined();
  });

  it('returns up to six featured houses and counts houses per destination', async () => {
    expect(await getFeaturedHouses()).toHaveLength(6);
    const counts = await getHouseCountsByDestination();
    expect(counts.zlatibor).toBe(2);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe((await getHouses()).length);
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
