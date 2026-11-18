import { cache } from 'react';
import { getSupabase } from '@/lib/supabase/public';
import { recommendHouses } from '@/lib/ranking';
import type { Category, Destination, Holiday, House, HouseUnit, PartyPrice, PriceTier, RatingSummary, Review, SpecialPrice } from '@/types';

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
  /** Map pin (the written address is never read by the public site) */
  lat: number | null;
  lng: number | null;
  featured_rank: number | null;
  created_at?: string;
  /** Missing until migration 0008 is run */
  verified_at?: string | null;
  house_photos: { url: string; sort_order: number }[];
  house_categories: { category_id: string }[];
  house_amenities: { amenity_id: string }[];
  house_price_tiers: { max_guests: number; weekday_price: number; weekend_price: number }[];
  /** Missing until migration 0010 is run */
  party_prices?: unknown;
  /** House rules text; missing until migration 0014 is run */
  rules_sr?: string | null;
  rules_en?: string | null;
  /** Distances / nearby places; missing until migration 0015 is run */
  nearby_sr?: string | null;
  nearby_en?: string | null;
  house_units?: UnitRow[];
};

type UnitRow = {
  id: string;
  sort_order: number;
  name: string;
  capacity: number;
  day_capacity: number | null;
  weekday_price: number;
  weekend_price: number;
  parties_allowed: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  check_in_time: string;
  check_out_time: string;
  party_prices: unknown;
  price_tiers?: unknown;
  party_only?: boolean;
};

/**
 * [{max_guests, weekday_price, weekend_price}] from the database → sorted PartyPrice[].
 * An older single "price" counts for both days; anything malformed is skipped.
 */
export function toPartyPrices(value: unknown): PartyPrice[] {
  if (!Array.isArray(value)) return [];
  const ok = (n: number) => Number.isFinite(n) && n >= 0;
  return value
    .map((p) => ({
      maxGuests: Number(p?.max_guests),
      weekdayPrice: Number(p?.weekday_price ?? p?.price),
      weekendPrice: Number(p?.weekend_price ?? p?.price),
    }))
    .filter((p) => Number.isFinite(p.maxGuests) && p.maxGuests > 0 && ok(p.weekdayPrice) && ok(p.weekendPrice))
    .sort((a, b) => a.maxGuests - b.maxGuests);
}

/** Group prices stored as JSON on a unit → sorted PriceTier[] */
function toTiers(value: unknown): PriceTier[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((t) => ({ maxGuests: Number(t?.max_guests), weekdayPrice: Number(t?.weekday_price), weekendPrice: Number(t?.weekend_price) }))
    .filter((t) => [t.maxGuests, t.weekdayPrice, t.weekendPrice].every(Number.isFinite) && t.maxGuests > 0)
    .sort((a, b) => a.maxGuests - b.maxGuests);
}

function toUnit(row: UnitRow): HouseUnit {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    dayCapacity: row.day_capacity ?? undefined,
    weekdayPrice: Number(row.weekday_price),
    weekendPrice: Number(row.weekend_price),
    tiers: toTiers(row.price_tiers),
    partyOnly: row.party_only === true,
    rules: {
      partiesAllowed: row.parties_allowed,
      petsAllowed: row.pets_allowed,
      smokingAllowed: row.smoking_allowed,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
    },
    partyPrices: toPartyPrices(row.party_prices),
  };
}

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
    rulesText:
      row.rules_sr?.trim() || row.rules_en?.trim()
        ? { sr: row.rules_sr?.trim() ?? '', en: row.rules_en?.trim() ?? '' }
        : undefined,
    nearby:
      row.nearby_sr?.trim() || row.nearby_en?.trim()
        ? { sr: row.nearby_sr?.trim() ?? '', en: row.nearby_en?.trim() ?? '' }
        : undefined,
    // Guests get the pin for the map, never the written address (it isn't read at all here,
    // and after migration 0023 the public key can't read it)
    location: {
      address: '',
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
    },
    verifiedAt: row.verified_at ?? undefined,
    partyPrices: toPartyPrices(row.party_prices),
    units: [...(row.house_units ?? [])].sort((a, b) => a.sort_order - b.sort_order).map(toUnit),
    createdAt: row.created_at ?? undefined,
    featured: row.featured_rank !== null,
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

/** House columns guests may see (everything but the written address). Keep in step with migration 0023's grant. */
const PUBLIC_HOUSE_COLUMNS =
  'id, slug, name, destination_id, capacity, day_capacity, bedrooms, bathrooms, weekday_price, weekend_price, ' +
  'min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, ' +
  'check_out_time, lat, lng, featured_rank, created_at, verified_at, party_prices, rules_sr, rules_en, nearby_sr, nearby_en';

const loadHouses = cache(async (): Promise<(House & { featuredRank: number | null })[]> => {
  if (useSampleData) {
    const { houses } = await import('@/data/houses');
    return houses.map((h, i) => ({ ...h, featured: i < 6, featuredRank: i < 6 ? i + 1 : null }));
  }
  const related =
    'house_photos(url, sort_order), house_categories(category_id), house_amenities(amenity_id), house_price_tiers(max_guests, weekday_price, weekend_price)';
  // Named columns, never "*": the written address is not read by the public site
  // (and after migration 0023 the public key may not read it at all)
  const query = (withUnits: boolean) =>
    getSupabase()
      .from('houses')
      .select(`${PUBLIC_HOUSE_COLUMNS}, ${related}${withUnits ? ', house_units(*)' : ''}`)
      .eq('is_published', true)
      .order('name');
  const [first, reviews, specials] = await Promise.all([query(true), loadReviews(), loadSpecialPrices()]);
  let { data, error } = first;
  // Before migration 0010 the units table doesn't exist yet: load the houses without units
  if (error && /house_units/.test(error.message)) ({ data, error } = await query(false));
  if (error) throw new Error(`Could not load houses: ${error.message}`);
  return (data as unknown as HouseRow[]).map((row) => {
    const house = withSpecialPrices(toHouse(row), specials);
    const rating = summarize(reviews.filter((r) => r.houseId === house.id));
    return rating ? { ...house, rating } : house;
  });
});

type SpecialPriceRow = {
  house_id: string;
  unit_id: string | null;
  label: string | null;
  first_night: string;
  last_night: string;
  price: number | string;
  min_nights: number | null;
  /** Party size for a party-only space (migration 0017) */
  max_guests?: number | null;
};

/** Holiday prices of all houses. Empty before migration 0016 (no table yet). */
const loadSpecialPrices = cache(async (): Promise<SpecialPriceRow[]> => {
  if (useSampleData) return [];
  const { data, error } = await getSupabase()
    .from('house_special_prices')
    // All columns, so this keeps working before and after migration 0017 (max_guests)
    .select('*')
    .order('first_night');
  if (error) console.error('Could not load special prices:', error.message);
  return error ? [] : (data as SpecialPriceRow[]);
});

export const toSpecialPrice = (r: SpecialPriceRow): SpecialPrice => ({
  label: r.label?.trim() || undefined,
  firstNight: r.first_night,
  lastNight: r.last_night,
  price: Number(r.price),
  minNights: r.min_nights ?? undefined,
  maxGuests: r.max_guests ?? undefined,
});

/** Puts each special price on its house (no unit) or on its unit */
function withSpecialPrices<T extends House>(house: T, rows: SpecialPriceRow[]): T {
  const mine = rows.filter((r) => r.house_id === house.id);
  if (!mine.length) return house;
  return {
    ...house,
    pricing: { ...house.pricing, specials: mine.filter((r) => !r.unit_id).map(toSpecialPrice) },
    units: house.units?.map((u) => ({ ...u, specials: mine.filter((r) => r.unit_id === u.id).map(toSpecialPrice) })),
  };
}

type HolidayRow = {
  id: string;
  slug: string;
  name_sr: string;
  name_en: string;
  text_sr: string;
  text_en: string;
  check_in: string;
  check_out: string;
  image_url: string | null;
  holiday_houses: { house_id: string }[];
};

/**
 * Holiday offers that are switched on and not over yet, soonest first.
 * Empty before migration 0016 (no table yet).
 */
const loadHolidays = cache(async (): Promise<Holiday[]> => {
  if (useSampleData) return [];
  // Keep an offer up until its departure day
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await getSupabase()
    .from('holidays')
    .select('id, slug, name_sr, name_en, text_sr, text_en, check_in, check_out, image_url, holiday_houses(house_id)')
    .eq('is_active', true)
    .gte('check_out', today)
    .order('check_in');
  if (error) {
    // Shown in the server log, so a database problem doesn't just quietly hide the offer
    console.error('Could not load holidays:', error.message);
    return [];
  }
  return (data as HolidayRow[]).map((h) => ({
    id: h.id,
    slug: h.slug,
    name: { sr: h.name_sr, en: h.name_en },
    text: { sr: h.text_sr, en: h.text_en },
    checkIn: h.check_in,
    checkOut: h.check_out,
    imageUrl: h.image_url ?? undefined,
    houseIds: h.holiday_houses.map((x) => x.house_id),
  }));
});

/** Approved guest reviews, newest first. Empty before migration 0013 (no table yet). */
const loadReviews = cache(async (): Promise<Review[]> => {
  if (useSampleData) return [];
  const { data, error } = await getSupabase()
    .from('reviews')
    .select('id, house_id, guest_name, rating, comment, locale, submitted_at')
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false });
  if (error) return [];
  type Row = { id: string; house_id: string; guest_name: string | null; rating: number; comment: string | null; locale: string; submitted_at: string | null };
  return (data as Row[]).map((r) => ({
    id: r.id,
    houseId: r.house_id,
    guestName: r.guest_name?.trim() || 'Gost',
    rating: r.rating,
    comment: r.comment ?? undefined,
    locale: r.locale === 'en' ? 'en' : 'sr',
    date: (r.submitted_at ?? '').slice(0, 10),
  }));
});

/** Average stars (one decimal) and count; undefined when there are no reviews */
export function summarize(reviews: Pick<Review, 'rating'>[]): RatingSummary | undefined {
  if (reviews.length === 0) return undefined;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length };
}

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
  // Same place first, then same kind of house; each part in recommended order (lib/ranking.ts)
  return [...recommendHouses(sameDestination), ...recommendHouses(sameCategory)].slice(0, limit);
}

/** Approved reviews of one house, newest first */
export async function getHouseReviews(houseId: string): Promise<Review[]> {
  return (await loadReviews()).filter((r) => r.houseId === houseId);
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

/** What a guest's review link is for (page /ocena/[token]); undefined = unknown link */
export type ReviewInvite = {
  houseName: string;
  houseSlug: string;
  guestName: string;
  checkIn?: string;
  checkOut?: string;
  /** 'invited' = can still be used; anything else = already reviewed */
  status: string;
};

export async function getReviewInvite(token: string): Promise<ReviewInvite | undefined> {
  if (useSampleData || !/^[0-9a-f-]{36}$/i.test(token)) return undefined;
  const { data, error } = await getSupabase().rpc('get_review_invite', { p_token: token });
  if (error || !Array.isArray(data) || data.length === 0) return undefined;
  const r = data[0] as { house_name: string; house_slug: string; guest_name: string | null; check_in: string | null; check_out: string | null; status: string };
  return {
    houseName: r.house_name,
    houseSlug: r.house_slug,
    guestName: r.guest_name ?? '',
    checkIn: r.check_in ?? undefined,
    checkOut: r.check_out ?? undefined,
    status: r.status,
  };
}

// ───────────── Holidays ─────────────

/** Holiday offers switched on in admin and not over yet, soonest first */
export async function getActiveHolidays(): Promise<Holiday[]> {
  return loadHolidays();
}

export async function getHolidayBySlug(slug: string): Promise<Holiday | undefined> {
  return (await loadHolidays()).find((h) => h.slug === slug);
}

/** Published houses ticked for a holiday, in the order of the house list */
export async function getHolidayHouses(holiday: Holiday): Promise<House[]> {
  return recommendHouses((await loadHouses()).filter((h) => holiday.houseIds.includes(h.id)));
}
