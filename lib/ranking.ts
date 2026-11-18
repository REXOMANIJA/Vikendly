import { groupOption, maxGuestsOf } from '@/lib/pricing';
import type { House } from '@/types';

/**
 * "Recommended" order for house lists (search, holiday offers, similar houses).
 *
 * 1. Houses the team visited in person always come first, then the rest.
 * 2. Inside each group houses are ordered by points (higher first):
 *    - Guest reviews (up to 30): a "careful" average, so one 5★ review doesn't beat
 *      ten 4.9★ reviews; a house without reviews sits in the middle.
 *    - Complete listing (up to 25): many photos, a real description, map pin,
 *      "nearby" text and house rules. Guests book what they can see.
 *    - Picked by the team for the homepage (10).
 *    - New on Vikendly (up to 10, fading over 30 days), so new houses get seen.
 *    - Fits the group (up to 15, only when the guest chose a number of people): a house
 *      for 6 comes before a venue for 70 when 5 people search. Listings with units count
 *      only the units the group would book.
 *    - Daily shuffle (up to 6): houses with similar points swap places from day to day,
 *      so the same one isn't always first. The order stays the same all day.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Careful average: as if every house already had 3 reviews of 4.3 */
const PRIOR_COUNT = 3;
const PRIOR_AVERAGE = 4.3;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function reviewPoints(house: Pick<House, 'rating'>): number {
  const count = house.rating?.count ?? 0;
  const sum = (house.rating?.average ?? 0) * count;
  const careful = (PRIOR_AVERAGE * PRIOR_COUNT + sum) / (PRIOR_COUNT + count);
  // 3.5★ or less = 0 points, 5★ = 30 points
  return clamp01((careful - 3.5) / 1.5) * 30;
}

export function completenessPoints(house: House): number {
  const description = Math.max(house.description.sr?.length ?? 0, house.description.en?.length ?? 0);
  return (
    clamp01(house.photos.length / 10) * 10 +
    clamp01(description / 400) * 5 +
    (house.location.lat != null && house.location.lng != null ? 4 : 0) +
    (house.nearby?.sr || house.nearby?.en ? 3 : 0) +
    (house.rulesText?.sr || house.rulesText?.en ? 3 : 0)
  );
}

export function newPoints(house: Pick<House, 'createdAt'>, today: Date): number {
  if (!house.createdAt) return 0;
  const days = (today.getTime() - new Date(house.createdAt).getTime()) / DAY_MS;
  if (!(days >= 0)) return 0;
  return clamp01(1 - days / 30) * 10;
}

/**
 * 1 = the house fits the group exactly, less when it is much bigger; 0 = too small.
 * A listing with units counts only the units the group would take (4 people in a village of
 * chalets for 29 → one chalet for 6).
 */
export function groupFit(house: House, guests: number): number {
  const beds = groupOption(house, guests)?.capacity ?? maxGuestsOf(house);
  if (beds < guests) return 0;
  return guests / beds;
}

/** Same number for a house all day, a different one tomorrow (0 – 1) */
export function dailyShuffle(id: string, today: Date): number {
  const text = `${id}|${today.toISOString().slice(0, 10)}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function recommendationScore(house: House, options: { guests?: number; today?: Date } = {}): number {
  const today = options.today ?? new Date();
  return (
    reviewPoints(house) +
    completenessPoints(house) +
    (house.featured ? 10 : 0) +
    newPoints(house, today) +
    (options.guests ? groupFit(house, options.guests) * 15 : 0) +
    dailyShuffle(house.id, today) * 6
  );
}

/** Houses in recommended order (a new list; the given one is not changed) */
export function recommendHouses<T extends House>(houses: T[], options: { guests?: number; today?: Date } = {}): T[] {
  const today = options.today ?? new Date();
  const score = new Map(houses.map((h) => [h.id, recommendationScore(h, { ...options, today })]));
  return [...houses].sort(
    (a, b) =>
      Number(!!b.verifiedAt) - Number(!!a.verifiedAt) ||
      score.get(b.id)! - score.get(a.id)! ||
      a.name.localeCompare(b.name)
  );
}
