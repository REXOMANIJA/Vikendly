import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Reads for the admin panel. Uses the admin's own session, so it also sees
 * unpublished houses and owner applications (allowed by the rules in 0002_admin.sql).
 */

export type AdminHouseListItem = {
  id: string;
  slug: string;
  name: string;
  destination_id: string;
  capacity: number;
  day_capacity: number | null;
  address: string;
  weekday_price: number;
  is_published: boolean;
  featured_rank: number | null;
  updated_at: string;
  cover: string | null;
};

export type AdminHouse = {
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
  /** Private: only admins can read it (table house_owner_contacts) */
  owner_phone: string;
  is_published: boolean;
  featured_rank: number | null;
  category_ids: string[];
  amenity_ids: string[];
  photos: string[];
  price_tiers: { max_guests: number; weekday_price: number; weekend_price: number }[];
};

export type OwnerApplication = {
  id: string;
  name: string;
  phone: string;
  location: string;
  description: string;
  locale: string;
  status: 'new' | 'contacted' | 'visited' | 'published' | 'rejected';
  created_at: string;
};

export type BookingRequest = {
  id: string;
  house_id: string | null;
  house_name: string;
  house_slug: string | null;
  owner_phone: string | null;
  check_in: string; // yyyy-MM-dd
  check_out: string;
  guests: number;
  quoted_total: number;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  locale: string;
  status: 'new' | 'contacted' | 'confirmed' | 'declined';
  created_at: string;
};

/** All booking requests, newest first, with the house's owner phone for calling */
export async function listBookingRequests(): Promise<BookingRequest[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('booking_requests')
    .select('*, houses(slug, house_owner_contacts(phone))')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  type Row = Omit<BookingRequest, 'house_slug' | 'owner_phone'> & {
    houses: { slug: string; house_owner_contacts: { phone: string } | { phone: string }[] | null } | null;
  };
  return (data as Row[]).map(({ houses, ...r }) => {
    const contact = houses?.house_owner_contacts;
    return {
      ...r,
      quoted_total: Number(r.quoted_total),
      house_slug: houses?.slug ?? null,
      owner_phone: (Array.isArray(contact) ? contact[0]?.phone : contact?.phone) ?? null,
    };
  });
}

/** Number of requests nobody has handled yet (shown in the admin menu) */
export async function countNewBookingRequests(): Promise<number> {
  const supabase = await createAdminClient();
  const { count } = await supabase
    .from('booking_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new');
  return count ?? 0;
}

export async function listHousesForAdmin(): Promise<AdminHouseListItem[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('houses')
    .select('id, slug, name, destination_id, address, capacity, day_capacity, weekday_price, is_published, featured_rank, updated_at, house_photos(url, sort_order)')
    .order('name');
  if (error) throw new Error(error.message);
  return data.map(({ house_photos, ...h }) => ({
    ...h,
    weekday_price: Number(h.weekday_price),
    cover: [...house_photos].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }));
}

export async function getHouseForAdmin(id: string): Promise<AdminHouse | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('houses')
    .select('*, house_photos(url, sort_order), house_categories(category_id), house_amenities(amenity_id), house_price_tiers(max_guests, weekday_price, weekend_price), house_owner_contacts(phone)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { house_photos, house_categories, house_amenities, house_price_tiers, house_owner_contacts, ...h } = data;
  // One-to-one relation: PostgREST returns an object (or an array in older versions)
  const ownerContact = Array.isArray(house_owner_contacts) ? house_owner_contacts[0] : house_owner_contacts;
  return {
    ...h,
    price_tiers: (house_price_tiers as AdminHouse['price_tiers'])
      .map((t) => ({ ...t, weekday_price: Number(t.weekday_price), weekend_price: Number(t.weekend_price) }))
      .sort((a, b) => a.max_guests - b.max_guests),
    weekday_price: Number(h.weekday_price),
    weekend_price: Number(h.weekend_price),
    owner_phone: ownerContact?.phone ?? '',
    category_ids: house_categories.map((c: { category_id: string }) => c.category_id),
    amenity_ids: house_amenities.map((a: { amenity_id: string }) => a.amenity_id),
    photos: [...house_photos]
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((p: { url: string }) => p.url),
  };
}

/** Destinations, categories and amenities for the dropdowns and checkboxes */
export type AdminDestination = {
  id: string;
  name: string;
  country: 'SR' | 'HR' | 'BA' | 'ME';
  image_url: string | null;
  sort_order: number;
  /** All houses there, published or not */
  house_count: number;
};

export async function listDestinationsForAdmin(): Promise<AdminDestination[]> {
  const supabase = await createAdminClient();
  const [destinations, houses] = await Promise.all([
    supabase.from('destinations').select('id, name, country, image_url, sort_order').order('sort_order').order('name'),
    supabase.from('houses').select('destination_id'),
  ]);
  if (destinations.error) throw new Error(destinations.error.message);
  const counts: Record<string, number> = {};
  for (const h of houses.data ?? []) counts[h.destination_id] = (counts[h.destination_id] ?? 0) + 1;
  return (destinations.data as Omit<AdminDestination, 'house_count'>[]).map((d) => ({ ...d, house_count: counts[d.id] ?? 0 }));
}

export async function getAdminOptions() {
  const supabase = await createAdminClient();
  const [destinations, categories, amenities] = await Promise.all([
    supabase.from('destinations').select('id, name').order('sort_order'),
    supabase.from('categories').select('id').order('sort_order'),
    supabase.from('amenities').select('id').order('sort_order'),
  ]);
  for (const r of [destinations, categories, amenities]) if (r.error) throw new Error(r.error.message);
  return {
    destinations: destinations.data as { id: string; name: string }[],
    categoryIds: (categories.data as { id: string }[]).map((c) => c.id),
    amenityIds: (amenities.data as { id: string }[]).map((a) => a.id),
  };
}

export async function listOwnerApplications(): Promise<OwnerApplication[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('owner_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as OwnerApplication[];
}
