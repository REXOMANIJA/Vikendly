import { cache } from 'react';
import { getSupabase } from '@/lib/supabase/public';
import type { Category, Destination, House } from '@/types';

/**
 * All data access goes through this file. Components never talk to Supabase directly.
 *
 * Vikendly is curated (tens to a few hundred houses), so we load all published houses
 * once per request and filter in memory. `cache()` makes repeated calls in the same
 * request free. Switch to per-query filtering if the catalogue grows into the thousands.
 *
 * In tests (NODE_ENV=test) the sample data in /data is used instead of the database.
 */

const useSampleData = process.env.NODE_ENV === 'test';

// ───────────── Row types (snake_case, as stored in Postgres) ─────────────

type HouseRow = {
  id: string;
  slug: string;
  name: string;
  destination_id: string;
  capacity: number;
  day_capacity: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  weekday_price: number;
  weekend_price: number;
  min_nights: number;
  description_sr: string;
  description_en: string;
  parties_allowed: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  check_in_time: string;
  check_out_time: string;
  address: string;
  lat: number | null;
  lng: number | null;
  featured_rank: number | null;
  house_photos: { url: string; sort_order: number }[];
  house_categories: { category_id: string }[];
  house_amenities: { amenity_id: string }[];
  house_price_tiers: { max_guests: number; weekday_price: number; weekend_price: number }[];
};

type DestinationRow = {
  id: string;
  slug: string;
  name: string;
  country: Destination['country'];
  image_url: string | null;
};

function toHouse(row: HouseRow): House & { featuredRank: number | null } {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    destinationId: row.destination_id,
    categoryIds: row.house_categories.map((c) => c.category_id),
    capacity: row.capacity,
    dayCapacity: row.day_capacity ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    pricing: {
      // numeric columns come back as numbers or strings depending on size; normalise
      weekdayPrice: Number(row.weekday_price),
      weekendPrice: Number(row.weekend_price),
      minNights: row.min_nights,
      tiers: (row.house_price_tiers ?? [])
        .map((t) => ({
          maxGuests: t.max_guests,
          weekdayPrice: Number(t.weekday_price),
          weekendPrice: Number(t.weekend_price),
        }))
        .sort((a, b) => a.maxGuests - b.maxGuests),
    },
    amenities: row.house_amenities.map((a) => a.amenity_id),
    photos: [...row.house_photos].sort((a, b) => a.sort_order - b.sort_order).map((p) => p.url),
    description: { sr: row.description_sr, en: row.description_en },
    rules: {
      partiesAllowed: row.parties_allowed,
      petsAllowed: row.pets_allowed,
      smokingAllowed: row.smoking_allowed,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
    },
    location: {
      address: row.address,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
    },
    featuredRank: row.featured_rank,
  };
}

function toDestination(row: DestinationRow): Destination {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    imageUrl: row.image_url ?? undefined,
  };
}

// ───────────── Loaders (one query per table per request) ─────────────

const loadHouses = cache(async (): Promise<(House & { featuredRank: number | null })[]> => {
  if (useSampleData) {
    const { houses } = await import('@/data/houses');
    return houses.map((h, i) => ({ ...h, featuredRank: i < 6 ? i + 1 : null }));
  }
  const { data, error } = await getSupabase()
    .from('houses')
    .select(
      '*, house_photos(url, sort_order), house_categories(category_id), house_amenities(amenity_id), house_price_tiers(max_guests, weekday_price, weekend_price)'
    )
    .eq('is_published', true)
    .order('name');
  if (error) throw new Error(`Could not load houses: ${error.message}`);
  return (data as HouseRow[]).map(toHouse);
});

const loadDestinations = cache(async (): Promise<Destination[]> => {
  if (useSampleData) return (await import('@/data/destinations')).destinations;
  const { data, error } = await getSupabase()
    .from('destinations')
    .select('id, slug, name, country, image_url')
    .order('sort_order');
  if (error) throw new Error(`Could not load destinations: ${error.message}`);
  return (data as DestinationRow[]).map(toDestination);
});

const loadCategories = cache(async (): Promise<Category[]> => {
  if (useSampleData) return (await import('@/data/categories')).categories;
  const { data, error } = await getSupabase().from('categories').select('id, slug').order('sort_order');
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  // Display names come from the translation files (categories.<id>)
  return (data as { id: string; slug: string }[]).map((c) => ({ id: c.id, slug: c.slug, name: c.id }));
});

// ───────────── Public API ─────────────

export async function getHouses(): Promise<House[]> {
  return loadHouses();
}

export async function getHouseBySlug(slug: string): Promise<House | undefined> {
  return (await loadHouses()).find((house) => house.slug === slug);
}

/** Houses picked by the team for the homepage ("Izdvojeno za ovaj vikend") */
export async function getFeaturedHouses(limit = 6): Promise<House[]> {
  return (await loadHouses())
    .filter((h) => h.featuredRank !== null)
    .sort((a, b) => a.featuredRank! - b.featuredRank!)
    .slice(0, limit);
}

/** Other houses in the same destination first, then houses of the same kind */
export async function getSimilarHouses(house: House, limit = 3): Promise<House[]> {
  const houses = await loadHouses();
  const sameDestination = houses.filter((h) => h.id !== house.id && h.destinationId === house.destinationId);
  const sameCategory = houses.filter(
    (h) =>
      h.id !== house.id &&
      h.destinationId !== house.destinationId &&
      h.categoryIds.some((c) => house.categoryIds.includes(c))
  );
  return [...sameDestination, ...sameCategory].slice(0, limit);
}

export async function getHouseCountsByDestination(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const house of await loadHouses()) {
    counts[house.destinationId] = (counts[house.destinationId] ?? 0) + 1;
  }
  return counts;
}

export async function getDestinations(): Promise<Destination[]> {
  return loadDestinations();
}

export async function getDestinationById(id: string): Promise<Destination | undefined> {
  return (await loadDestinations()).find((d) => d.id === id);
}

export async function getDestinationBySlug(slug: string): Promise<Destination | undefined> {
  return (await loadDestinations()).find((d) => d.slug === slug);
}

export async function getCategories(): Promise<Category[]> {
  return loadCategories();
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return (await loadCategories()).find((c) => c.slug === slug);
}
