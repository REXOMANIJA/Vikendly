import type { Destination } from '@/types';

/** How many destinations the homepage shows: 1 large tile + 8 smaller ones fill the layout exactly */
export const HOMEPAGE_DESTINATIONS = 9;

/**
 * Destinations for the homepage: the ones with the most published houses.
 * Destinations without houses are never promoted. Ties keep the admin's order
 * (the order the list arrives in, i.e. sort_order).
 */
export function pickHomepageDestinations(
  destinations: Destination[],
  houseCounts: Record<string, number>,
  limit = HOMEPAGE_DESTINATIONS
): Destination[] {
  return destinations
    .map((destination, position) => ({ destination, position, houses: houseCounts[destination.id] ?? 0 }))
    .filter((d) => d.houses > 0)
    .sort((a, b) => b.houses - a.houses || a.position - b.position)
    .slice(0, limit)
    .map((d) => d.destination);
}

/** Countries in the order they're shown (most destinations are in Serbia) */
export const COUNTRY_ORDER: Destination['country'][] = ['SR', 'BA', 'ME', 'HR'];

/** Groups destinations by country, keeping each group in the given order */
export function groupByCountry(destinations: Destination[]) {
  return COUNTRY_ORDER.map((country) => ({
    country,
    destinations: destinations.filter((d) => d.country === country),
  })).filter((group) => group.destinations.length > 0);
}
