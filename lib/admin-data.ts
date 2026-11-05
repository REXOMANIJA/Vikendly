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
  bedrooms: number;
  bathrooms: number;
  weekday_price: number;
  weekend_price: number;
  cleaning_fee: number;
  min_nights: number;
  description_sr: string;
  description_en: string;
  parties_allowed: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  check_in_time: string;
  check_out_time: string;
  address: string;
  contact_viber: string | null;
  contact_whatsapp: string | null;
  contact_phone: string | null;
  is_published: boolean;
  featured_rank: number | null;
  category_ids: string[];
  amenity_ids: string[];
  photos: string[];
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

export async function listHousesForAdmin(): Promise<AdminHouseListItem[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('houses')
    .select('id, slug, name, destination_id, capacity, weekday_price, is_published, featured_rank, updated_at, house_photos(url, sort_order)')
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
    .select('*, house_photos(url, sort_order), house_categories(category_id), house_amenities(amenity_id)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { house_photos, house_categories, house_amenities, ...h } = data;
  return {
    ...h,
    weekday_price: Number(h.weekday_price),
    weekend_price: Number(h.weekend_price),
    cleaning_fee: Number(h.cleaning_fee),
    category_ids: house_categories.map((c: { category_id: string }) => c.category_id),
    amenity_ids: house_amenities.map((a: { amenity_id: string }) => a.amenity_id),
    photos: [...house_photos]
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((p: { url: string }) => p.url),
  };
}

/** Destinations, categories and amenities for the dropdowns and checkboxes */
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
