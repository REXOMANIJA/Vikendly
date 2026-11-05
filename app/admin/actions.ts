'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient, getAdminUser } from '@/lib/supabase/server';
import { SLUG_PATTERN } from '@/lib/slug';

export type HouseInput = {
  id?: string;
  slug: string;
  name: string;
  destination_id: string;
  /** Guests who can stay overnight */
  capacity: number;
  /** Guests allowed for a party / daytime gathering (optional) */
  day_capacity: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  /** Whole-house price */
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
  /** Private owner phone (not shown on the site) */
  owner_phone: string;
  is_published: boolean;
  featured_rank: number | null;
  category_ids: string[];
  amenity_ids: string[];
  photos: string[];
  /** Cheaper prices for smaller groups ("up to max_guests people") */
  price_tiers: { max_guests: number; weekday_price: number; weekend_price: number }[];
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: keyof HouseInput };

// Error texts are shown in the (Serbian) admin panel
const fail = (error: string, field?: keyof HouseInput): ActionResult<never> => ({ ok: false, error, field });

/** Public pages are cached; refresh them so changes show up immediately */
function refreshPublicSite() {
  revalidatePath('/', 'layout');
}

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error('Niste prijavljeni kao administrator.');
}

function validateHouse(h: HouseInput): ActionResult<never> | null {
  if (h.name.trim().length < 2) return fail('Unesite naziv kuće.', 'name');
  if (!SLUG_PATTERN.test(h.slug)) return fail('Adresa (slug) sme da sadrži samo mala slova, brojeve i crtice.', 'slug');
  if (!h.destination_id) return fail('Izaberite destinaciju.', 'destination_id');
  const ints: [keyof HouseInput, number, string, boolean][] = [
    ['capacity', 1, 'Broj osoba za noćenje', true],
    ['day_capacity', 1, 'Broj osoba za žurku/druženje', false],
    ['bedrooms', 0, 'Broj spavaćih soba', false],
    ['bathrooms', 0, 'Broj kupatila', false],
    ['min_nights', 1, 'Minimalan broj noći', true],
  ];
  for (const [field, min, label, required] of ints) {
    const v = h[field] as number | null;
    if (v === null && !required) continue;
    if (!Number.isInteger(v) || (v as number) < min) return fail(`${label} mora biti ceo broj, najmanje ${min}.`, field);
  }
  if (h.day_capacity !== null && h.day_capacity < h.capacity) {
    return fail('Za žurku/druženje unesite broj veći od broja osoba za noćenje, ili ostavite prazno.', 'day_capacity');
  }
  const prices: [keyof HouseInput, string][] = [
    ['weekday_price', 'Cena radnim danima'],
    ['weekend_price', 'Cena vikendom'],
  ];
  for (const [field, label] of prices) {
    const v = h[field] as number;
    if (!Number.isFinite(v) || v < 0) return fail(`${label}: unesite iznos u evrima.`, field);
  }
  const seen = new Set<number>();
  for (const tier of h.price_tiers) {
    if (!Number.isInteger(tier.max_guests) || tier.max_guests < 1 || tier.max_guests >= h.capacity) {
      return fail(`Cene za manje grupe: broj osoba mora biti između 1 i ${h.capacity - 1} (cena za ${h.capacity} je cena cele kuće).`, 'price_tiers');
    }
    if (seen.has(tier.max_guests)) return fail(`Cena za do ${tier.max_guests} osoba je uneta dva puta.`, 'price_tiers');
    seen.add(tier.max_guests);
    if (![tier.weekday_price, tier.weekend_price].every((p) => Number.isFinite(p) && p >= 0)) {
      return fail('Cene za manje grupe: unesite iznose u evrima.', 'price_tiers');
    }
  }
  if (h.description_sr.trim().length < 20) return fail('Opis na srpskom je prekratak (bar 20 znakova).', 'description_sr');
  if (h.description_en.trim().length < 20) return fail('Opis na engleskom je prekratak (bar 20 znakova).', 'description_en');
  if (h.address.trim().length < 3) return fail('Unesite adresu.', 'address');
  for (const field of ['check_in_time', 'check_out_time'] as const) {
    if (!/^\d{2}:\d{2}$/.test(h[field])) return fail('Vreme upišite kao 15:00.', field);
  }
  if (h.owner_phone.replace(/\D/g, '').length < 6 || h.owner_phone.trim().length > 40) {
    return fail('Unesite telefon vlasnika.', 'owner_phone');
  }
  if (h.is_published && h.photos.length === 0) return fail('Dodajte bar jednu fotografiju pre objavljivanja.', 'photos');
  return null;
}

export async function saveHouse(input: HouseInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const invalid = validateHouse(input);
  if (invalid) return invalid;

  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc('admin_save_house', {
    payload: {
      ...input,
      id: input.id ?? '',
      name: input.name.trim(),
      description_sr: input.description_sr.trim(),
      description_en: input.description_en.trim(),
      address: input.address.trim(),
      featured_rank: input.featured_rank ?? '',
    },
  });

  if (error) {
    if (error.code === '23505') return fail('Već postoji kuća sa ovom adresom (slug). Promenite je.', 'slug');
    console.error('admin_save_house failed:', error);
    return fail(`Čuvanje nije uspelo: ${error.message}`);
  }

  refreshPublicSite();
  return { ok: true, data: { id: data as string } };
}

export async function setHousePublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createAdminClient();
  if (published) {
    const { count } = await supabase
      .from('house_photos')
      .select('id', { count: 'exact', head: true })
      .eq('house_id', id);
    if (!count) return fail('Dodajte bar jednu fotografiju pre objavljivanja.');
  }
  const { error } = await supabase.from('houses').update({ is_published: published }).eq('id', id);
  if (error) return fail(error.message);
  refreshPublicSite();
  revalidatePath('/admin/kuce');
  return { ok: true };
}

export async function deleteHouse(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createAdminClient();

  // Remove uploaded photos from storage too (local /images/… files are left alone)
  const { data: photos } = await supabase.from('house_photos').select('url').eq('house_id', id);
  const marker = '/storage/v1/object/public/house-photos/';
  const paths = (photos ?? [])
    .map((p) => (p.url.includes(marker) ? p.url.split(marker)[1] : null))
    .filter((p): p is string => Boolean(p));

  const { error } = await supabase.from('houses').delete().eq('id', id);
  if (error) return fail(error.message);
  if (paths.length) {
    // The house is already gone, so don't fail the action; just make leftovers visible in the logs
    const { data: removed, error: storageError } = await supabase.storage.from('house-photos').remove(paths);
    if (storageError || (removed?.length ?? 0) < paths.length) {
      console.error(
        `Deleted house ${id}, but only ${removed?.length ?? 0} of ${paths.length} photo files were removed from Storage.`,
        storageError?.message ?? ''
      );
    }
  }

  refreshPublicSite();
  revalidatePath('/admin/kuce');
  return { ok: true };
}

export async function setApplicationStatus(
  id: string,
  status: 'new' | 'contacted' | 'visited' | 'published' | 'rejected'
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createAdminClient();
  const { error } = await supabase.from('owner_applications').update({ status }).eq('id', id);
  if (error) return fail(error.message);
  revalidatePath('/admin/prijave');
  return { ok: true };
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createAdminClient();
  const { error } = await supabase.from('owner_applications').delete().eq('id', id);
  if (error) return fail(error.message);
  revalidatePath('/admin/prijave');
  return { ok: true };
}

export type BookingStatus = 'new' | 'contacted' | 'confirmed' | 'declined';

export async function setBookingStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createAdminClient();
  const { error } = await supabase.from('booking_requests').update({ status }).eq('id', id);
  if (error) return fail(error.message);
  revalidatePath('/admin', 'layout'); // also updates the "new requests" count in the menu
  return { ok: true };
}

export async function deleteBookingRequest(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createAdminClient();
  const { error } = await supabase.from('booking_requests').delete().eq('id', id);
  if (error) return fail(error.message);
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function signOut() {
  const supabase = await createAdminClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
