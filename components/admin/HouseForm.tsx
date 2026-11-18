'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, X, Check, Plus, MapPin, BadgeCheck } from 'lucide-react';
import sr from '@/locales/sr/common.json';
import { slugify } from '@/lib/slug';
import { createBrowserAdminClient } from '@/lib/supabase/browser';
import { deleteHouse, resolveMapsLink, saveHouse, type HouseInput } from '@/app/admin/actions';
import { mapEmbedUrl } from '@/lib/maps';
import { toDateParam } from '@/lib/dates';
import { shrinkPhoto } from '@/lib/shrink-photo';
import type { AdminHouse } from '@/lib/admin-data';
import UnitsEditor, { type UnitFormRow } from '@/components/admin/UnitsEditor';
import PhotoManager from '@/components/admin/PhotoManager';
import { type PartyPriceRow } from '@/components/admin/PartyPricesEditor';
import SpecialPricesEditor, { WHOLE, type SpecialRow } from '@/components/admin/SpecialPricesEditor';

type Options = {
  destinations: { id: string; name: string }[];
  categoryIds: string[];
  amenityIds: string[];
};

// Numbers are edited as text so a field can be empty while typing
type FormState = Omit<
  HouseInput,
  | 'capacity' | 'day_capacity' | 'bedrooms' | 'bathrooms' | 'weekday_price' | 'weekend_price'
  | 'min_nights' | 'featured_rank' | 'price_tiers' | 'lat' | 'lng' | 'verified_at' | 'party_prices' | 'units'
  | 'special_prices'
> & {
  special_prices: SpecialRow[];
  capacity: string;
  day_capacity: string;
  bedrooms: string;
  bathrooms: string;
  weekday_price: string;
  weekend_price: string;
  min_nights: string;
  featured_rank: string;
  price_tiers: TierRow[];
  lat: string;
  lng: string;
  /** "yyyy-MM-dd" or '' = not verified */
  verified_at: string;
  party_prices: PartyPriceRow[];
  units: UnitFormRow[];
};

type TierRow = { key: string; max_guests: string; weekday_price: string; weekend_price: string };

const empty: FormState = {
  slug: '', name: '', destination_id: '',
  capacity: '', day_capacity: '', bedrooms: '', bathrooms: '', price_tiers: [],
  weekday_price: '', weekend_price: '', min_nights: '2',
  description_sr: '', description_en: '', rules_sr: '', rules_en: '', nearby_sr: '', nearby_en: '',
  parties_allowed: false, pets_allowed: false, smoking_allowed: false,
  check_in_time: '15:00', check_out_time: '11:00',
  address: '', lat: '', lng: '', owner_phone: '',
  is_published: false, featured_rank: '', verified_at: '', party_prices: [], units: [], special_prices: [],
  category_ids: [], amenity_ids: [], photos: [],
};

/** Form key of a party size in a party-only space ("unit@30") */
const partyPlace = (unitKey: string, maxGuests: number | string) => `${unitKey}@${maxGuests}`;

/**
 * Where a holiday price can go: the whole house, each place with beds (nightly price), and each
 * party size of a party-only space (price of the party)
 */
function specialPlaces(units: UnitFormRow[]) {
  if (units.length === 0) return [{ key: WHOLE, name: '', index: null as number | null, maxGuests: null as number | null }];
  return units.flatMap((u, i) =>
    u.party_only
      ? u.party_prices
          .filter((p) => Number(p.max_guests) > 0)
          .map((p) => ({ key: partyPlace(u.key, p.max_guests), name: `${u.name || 'Prostor'}, do ${p.max_guests} osoba`, index: i as number | null, maxGuests: Number(p.max_guests) as number | null }))
      : [{ key: u.key, name: u.name || 'Jedinica', index: i as number | null, maxGuests: null as number | null }]
  );
}

/**
 * Holiday prices from the database (one row per place) → one form row per date range,
 * with a price field for each place
 */
function specialRows(h: AdminHouse): SpecialRow[] {
  const rows = new Map<string, SpecialRow>();
  for (const s of h.special_prices) {
    const id = [s.label, s.first_night, s.last_night, s.min_nights ?? ''].join('|');
    const row = rows.get(id) ?? {
      key: crypto.randomUUID(),
      label: s.label,
      first_night: s.first_night,
      last_night: s.last_night,
      min_nights: s.min_nights === null ? '' : String(s.min_nights),
      prices: {},
    };
    const unit = s.unit_index === null ? undefined : h.units[s.unit_index];
    // Party-only space: one price per party size, kept under "unit@size"
    const place = !unit ? WHOLE : s.max_guests != null ? partyPlace(unit.id, s.max_guests) : unit.id;
    if (place) row.prices[place] = String(s.price);
    rows.set(id, row);
  }
  return [...rows.values()];
}

function fromHouse(h: AdminHouse): FormState {
  return {
    ...h,
    rules_sr: h.rules_sr ?? '',
    rules_en: h.rules_en ?? '',
    nearby_sr: h.nearby_sr ?? '',
    nearby_en: h.nearby_en ?? '',
    capacity: String(h.capacity),
    day_capacity: h.day_capacity === null ? '' : String(h.day_capacity),
    bedrooms: h.bedrooms === null ? '' : String(h.bedrooms),
    bathrooms: h.bathrooms === null ? '' : String(h.bathrooms),
    lat: h.lat === null ? '' : String(h.lat),
    lng: h.lng === null ? '' : String(h.lng),
    price_tiers: h.price_tiers.map((t) => ({
      key: String(t.max_guests),
      max_guests: String(t.max_guests),
      weekday_price: String(t.weekday_price),
      weekend_price: String(t.weekend_price),
    })),
    weekday_price: String(h.weekday_price),
    weekend_price: String(h.weekend_price),
    min_nights: String(h.min_nights),
    featured_rank: h.featured_rank === null ? '' : String(h.featured_rank),
    verified_at: h.verified_at ?? '',
    party_prices: h.party_prices.map(priceRow),
    special_prices: specialRows(h),
    units: h.units.map((u) => ({
      ...u,
      key: u.id,
      capacity: String(u.capacity),
      day_capacity: u.day_capacity === null ? '' : String(u.day_capacity),
      weekday_price: String(u.weekday_price),
      weekend_price: String(u.weekend_price),
      party_prices: u.party_prices.map(priceRow),
      price_tiers: u.price_tiers.map(priceRow),
    })),
  };
}

/** Party level or group price from the database → editable row */
const priceRow = (p: { max_guests: number; weekday_price: number; weekend_price: number }): PartyPriceRow => ({
  key: crypto.randomUUID(),
  max_guests: String(p.max_guests),
  weekday_price: String(p.weekday_price),
  weekend_price: String(p.weekend_price),
});
/** Editable row → numbers for saving */
const priceNumbers = (r: PartyPriceRow) => ({
  max_guests: num(r.max_guests),
  weekday_price: num(r.weekday_price),
  weekend_price: num(r.weekend_price),
});

const num = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
/** Empty optional field → null, otherwise a number (NaN if not a number, caught by validation) */
const optionalNum = (v: string) => (v.trim() === '' ? null : num(v));

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';
const label = 'mb-1.5 block text-sm font-medium';

/** Fields filled in from an owner application ("Napravite kuću iz prijave") */
export type HousePrefill = Partial<Pick<FormState, 'owner_phone' | 'address' | 'destination_id'>>;


/** Quick links at the top of the form: [section id, label] */
const SECTIONS: [string, string][] = [
  ['osnovno', 'Osnovno'],
  ['kapacitet', 'Kapacitet'],
  ['cene', 'Cene'],
  ['field-units', 'Delovi objekta'],
  ['field-special_prices', 'Praznične cene'],
  ['opis', 'Opis'],
  ['pravila', 'Pravila'],
  ['field-photos', 'Fotografije'],
  ['vrsta', 'Vrsta i oprema'],
  ['ulazak', 'Dozvoljeno i vreme'],
  ['lokacija', 'Lokacija i vlasnik'],
  ['objava', 'Objava'],
];

export default function HouseForm({
  house,
  options,
  prefill,
}: {
  house?: AdminHouse;
  options: Options;
  prefill?: HousePrefill;
}) {
  const router = useRouter();
  const isNew = !house;
  const [form, setForm] = useState<FormState>(house ? fromHouse(house) : { ...empty, ...prefill });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [pending, startTransition] = useTransition();
  const [mapLink, setMapLink] = useState('');
  const [mapError, setMapError] = useState('');
  const [findingOnMap, setFindingOnMap] = useState(false);

  const findOnMap = async () => {
    setFindingOnMap(true);
    setMapError('');
    try {
      const result = await resolveMapsLink(mapLink);
      if (!result.ok) return setMapError(result.error);
      setSaved(false);
      setForm((f) => ({ ...f, lat: String(result.data.lat), lng: String(result.data.lng) }));
      setMapLink('');
    } catch {
      setMapError('Lokacija nije pronađena. Pokušajte ponovo.');
    } finally {
      setFindingOnMap(false);
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const toggleIn = (key: 'category_ids' | 'amenity_ids', id: string) =>
    set(key, form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id]);

  const onNameChange = (name: string) => {
    setSaved(false);
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  // ───── Photos: uploaded straight to Supabase Storage (bucket house-photos) ─────
  const uploadPhotos = async (files: File[]) => {
    if (!files.length) return;
    setError(null);
    const supabase = createBrowserAdminClient();
    const folder = form.slug || 'nova-kuca';
    setUploading((n) => n + files.length);
    for (const original of files) {
      try {
        if (original.size > 40 * 1024 * 1024) throw new Error(`${original.name} je veći od 40 MB.`);
        // Phone photos are shrunk to web size first (max 2000px), so pages load fast
        const file = await shrinkPhoto(original);
        if (file.size > 8 * 1024 * 1024) throw new Error(`${original.name} je i posle smanjivanja veći od 8 MB.`);
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('house-photos').upload(path, file, {
          cacheControl: '31536000',
          contentType: file.type,
        });
        if (error) throw new Error(`${file.name}: ${error.message}`);
        const { data } = supabase.storage.from('house-photos').getPublicUrl(path);
        setSaved(false);
        setForm((f) => ({ ...f, photos: [...f.photos, data.publicUrl] }));
      } catch (e) {
        setError({ message: `Otpremanje nije uspelo. ${(e as Error).message}`, field: 'photos' });
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  // ───── Save / delete ─────
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: HouseInput = {
      ...form,
      id: house?.id,
      capacity: num(form.capacity),
      day_capacity: optionalNum(form.day_capacity),
      lat: optionalNum(form.lat),
      lng: optionalNum(form.lng),
      bedrooms: optionalNum(form.bedrooms),
      bathrooms: optionalNum(form.bathrooms),
      price_tiers: form.price_tiers.map((t) => ({
        max_guests: num(t.max_guests),
        weekday_price: num(t.weekday_price),
        weekend_price: num(t.weekend_price),
      })),
      weekday_price: num(form.weekday_price),
      weekend_price: num(form.weekend_price),
      min_nights: num(form.min_nights),
      featured_rank: form.featured_rank.trim() === '' ? null : num(form.featured_rank),
      verified_at: form.verified_at || null,
      party_prices: form.party_prices.map(priceNumbers),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      units: form.units.map(({ key, ...u }) => ({
        ...u,
        capacity: num(u.capacity),
        day_capacity: optionalNum(u.day_capacity),
        weekday_price: num(u.weekday_price),
        weekend_price: num(u.weekend_price),
        party_prices: u.party_prices.map(priceNumbers),
        price_tiers: u.price_tiers.map(priceNumbers),
      })),
      // One saved row per place that has a holiday price (units matched by position)
      special_prices: form.special_prices.flatMap((r) =>
        specialPlaces(form.units)
          .filter((p) => (r.prices[p.key] ?? '').trim() !== '')
          .map((p) => ({
            unit_index: p.index,
            label: r.label,
            first_night: r.first_night,
            last_night: r.last_night,
            price: num(r.prices[p.key]),
            // A party price is for one day, so no minimum stay
            min_nights: p.maxGuests === null ? optionalNum(r.min_nights) : null,
            max_guests: p.maxGuests,
          }))
      ),
    };
    startTransition(async () => {
      const result = await saveHouse(payload);
      if (!result.ok) {
        setError({ message: result.error, field: result.field });
        document.getElementById(`field-${result.field}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      setSaved(true);
      if (isNew && result.data) router.replace(`/admin/kuce/${result.data.id}?sacuvano=1`);
      else router.refresh();
    });
  };

  const onDelete = () => {
    if (!house) return;
    if (!confirm(`Obrisati kuću „${house.name}“? Ovo se ne može poništiti.`)) return;
    startTransition(async () => {
      const result = await deleteHouse(house.id);
      if (!result.ok) return setError({ message: result.error });
      router.replace('/admin/kuce');
      router.refresh();
    });
  };

  const fieldError = (field: string) =>
    error?.field === field ? <p className="mt-1 text-sm text-accent-dark">{error.message}</p> : null;
  const box = 'scroll-mt-36 rounded-2xl bg-white p-5 md:p-6 shadow-sm space-y-4 lg:scroll-mt-20';
  const hasUnits = form.units.length > 0;
  const unitBeds = form.units.reduce((sum, u) => sum + (Number(u.capacity) || 0), 0);
  const h2 = 'font-serif text-xl font-bold text-primary';

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-28">
      {/* Jump to a part of the form */}
      <nav aria-label="Delovi forme"
        className="-mx-4 flex gap-1.5 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur [scrollbar-width:none] md:-mx-8 md:px-8 lg:sticky lg:top-0 lg:z-30">
        {SECTIONS.map(([id, text]) => (
          <a key={id} href={`#${id}`}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-text/75 ring-1 ring-primary/10 hover:bg-primary hover:text-white">
            {text}
          </a>
        ))}
      </nav>
      {/* ── Osnovno ── */}
      <section className={box} id="osnovno">
        <h2 className={h2}>Osnovno</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div id="field-name">
            <label htmlFor="name" className={label}>Naziv kuće</label>
            <input id="name" className={input} value={form.name} onChange={(e) => onNameChange(e.target.value)} required />
            {fieldError('name')}
          </div>
          <div id="field-destination_id">
            <label htmlFor="destination" className={label}>Destinacija</label>
            <select id="destination" className={input} value={form.destination_id}
              onChange={(e) => set('destination_id', e.target.value)} required>
              <option value="">Izaberite…</option>
              {options.destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {fieldError('destination_id')}
          </div>
          <div id="field-slug" className="md:col-span-2">
            <label htmlFor="slug" className={label}>Adresa stranice</label>
            <div className="flex items-center rounded-lg border border-gray-300 bg-background focus-within:ring-2 focus-within:ring-primary">
              <span className="pl-3 text-sm text-text/60 whitespace-nowrap">vikendly.com/kuce/</span>
              <input id="slug" className="h-11 w-full bg-transparent px-1 focus:outline-none" value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} required />
            </div>
            {!isNew && house && form.slug !== house.slug && (
              <p className="mt-1 text-sm text-accent-dark">Pažnja: stari linkovi ka ovoj kući prestaće da rade.</p>
            )}
            {fieldError('slug')}
          </div>
        </div>
      </section>

      {/* ── Kapacitet ── */}
      <section className={box} id="kapacitet">
        <h2 className={h2}>Kapacitet</h2>
        {hasUnits && (
          <p className="rounded-lg bg-background px-4 py-3 text-sm text-text/80">
            Objekat ima {form.units.length} {form.units.length === 1 ? 'jedinicu' : 'jedinice'}:{' '}
            {form.units.every((u) => u.party_only) ? (
              <strong>samo prostor za žurke, bez noćenja</strong>
            ) : (
              <>ukupno <strong>{unitBeds} osoba za noćenje</strong></>
            )}
            . Broj osoba, cene i pravila se unose za svaku jedinicu posebno, u delu „Delovi objekta“.
          </p>
        )}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {([
            ['capacity', 'Broj osoba za noćenje', true, 'Koliko ljudi može da prespava.'],
            ['day_capacity', 'Tokom dana najviše', false, 'Opciono, npr. 15 kada spava 6.'],
            ['bedrooms', 'Spavaće sobe', false, 'Opciono.'],
            ['bathrooms', 'Kupatila', false, 'Opciono.'],
          ] as const).filter(([key]) => !hasUnits || (key !== 'capacity' && key !== 'day_capacity')).map(([key, text, required, hint]) => (
            <div key={key} id={`field-${key}`}>
              <label htmlFor={key} className={label}>{text}</label>
              <input id={key} className={input} inputMode="numeric" value={form[key]}
                placeholder={required ? '' : '—'}
                onChange={(e) => set(key, e.target.value.replace(/\D/g, ''))} required={required && !hasUnits} />
              <p className="mt-1 text-xs text-text/60">{hint}</p>
              {fieldError(key)}
            </div>
          ))}
        </div>
      </section>

      {/* ── Cene ── */}
      <section className={box} id="cene">
        <h2 className={h2}>Cene</h2>
        <p className="text-sm text-text/70">
          {hasUnits
            ? 'Cene se unose za svaku jedinicu posebno, u delu „Delovi objekta“. Ovde je samo najmanji broj noći, za ceo objekat.'
            : `Cena cele kuće važi za grupu do ${form.capacity || '…'} osoba.`}
        </p>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {([
            ['weekday_price', 'Radnim danima (€/noć)'],
            ['weekend_price', 'Petak i subota (€/noć)'],
            ['min_nights', 'Najmanje noći'],
          ] as const).filter(([key]) => !hasUnits || key === 'min_nights').map(([key, text]) => (
            <div key={key} id={`field-${key}`}>
              <label htmlFor={key} className={label}>{text}</label>
              <input id={key} className={input} inputMode="decimal" value={form[key]}
                onChange={(e) => set(key, e.target.value)} required />
              {fieldError(key)}
            </div>
          ))}
        </div>

        {/* Optional cheaper prices for smaller groups. With units it is left out completely (not just
            hidden): hidden required fields would block saving with a browser error nobody can see.
            The rows stay in memory and come back if the units are removed; the server ignores them
            while there are units. */}
        {!hasUnits && (
        <div id="field-price_tiers" className="space-y-3 rounded-xl bg-background p-4">
          <div>
            <h3 className="font-semibold text-primary">Cene za manje grupe <span className="font-normal text-text/60">(opciono)</span></h3>
            <p className="text-sm text-text/70">
              Npr. „do 4 osobe: €80 / €110“. Sajt automatski bira najmanju grupu u koju gosti staju,
              a za veće grupe važi cena cele kuće.
            </p>
          </div>
          {form.price_tiers.map((tier, i) => (
            <div key={tier.key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              {([
                ['max_guests', 'Do koliko osoba', 'numeric'],
                ['weekday_price', 'Radnim danima €', 'decimal'],
                ['weekend_price', 'Pet. i sub. €', 'decimal'],
              ] as const).map(([key, text, mode]) => (
                <div key={key}>
                  <label htmlFor={`tier-${tier.key}-${key}`} className="mb-1 block text-xs font-medium">{text}</label>
                  <input
                    id={`tier-${tier.key}-${key}`}
                    className={input}
                    inputMode={mode}
                    value={tier[key]}
                    onChange={(e) =>
                      set('price_tiers', form.price_tiers.map((t, j) => (j === i ? { ...t, [key]: e.target.value } : t)))
                    }
                    required
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('price_tiers', form.price_tiers.filter((_, j) => j !== i))}
                className="mb-1 rounded-lg p-2.5 text-accent-dark hover:bg-accent/10"
                aria-label="Uklonite ovu cenu"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set('price_tiers', [
                ...form.price_tiers,
                { key: crypto.randomUUID(), max_guests: '', weekday_price: '', weekend_price: '' },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            <Plus className="size-4" aria-hidden /> Dodajte cenu za manju grupu
          </button>
          {fieldError('price_tiers')}
        </div>
        )}
      </section>

      {/* ── Delovi objekta ── */}
      <section className={box} id="field-units">
        <div>
          <h2 className={h2}>
            Delovi objekta <span className="font-sans text-base font-normal text-text/60">(opciono)</span>
          </h2>
          <p className="mt-1 text-sm text-text/70">
            Ako se objekat izdaje u delovima (npr. „Kuća“, „Kuća sa balkonom“, „Apartman“), dodajte svaki deo kao
            jedinicu. Fotografije, opis i lokacija su zajednički; broj osoba, cene i pravila ima svaka jedinica.
            Gosti na stranici biraju jednu ili više jedinica u istom upitu.
          </p>
        </div>
        <UnitsEditor units={form.units} onChange={(units) => set('units', units)} />
        {fieldError('units')}
      </section>

      {/* ── Posebne cene (praznici) ── */}
      <section className={box} id="field-special_prices">
        <div>
          <h2 className={h2}>
            Posebne cene za praznike <span className="font-sans text-base font-normal text-text/60">(opciono)</span>
          </h2>
          <p className="mt-1 text-sm text-text/70">
            Cena po noći za određene noći (Nova godina, Božić, Srpska Nova godina, Uskrs…), kako ste se dogovorili
            sa vlasnikom. Za te noći zamenjuje običnu cenu i cene za manje grupe. Ako je upisan najkraći boravak,
            gost koji uzima neku od tih noći mora ostati bar toliko.
          </p>
        </div>
        <SpecialPricesEditor
          rows={form.special_prices}
          places={specialPlaces(form.units).map((p) => ({ key: p.key, name: p.name, party: p.maxGuests !== null }))}
          onChange={(rows) => set('special_prices', rows)}
        />
        {fieldError('special_prices')}
      </section>

      {/* ── Opis ── */}
      <section className={box} id="opis">
        <h2 className={h2}>Opis</h2>
        <div id="field-description_sr">
          <label htmlFor="description_sr" className={label}>Na srpskom</label>
          <textarea id="description_sr" rows={5} className={`${input} h-auto py-2`} value={form.description_sr}
            onChange={(e) => set('description_sr', e.target.value)} required />
          {fieldError('description_sr')}
        </div>
        <div id="field-description_en">
          <label htmlFor="description_en" className={label}>Na engleskom</label>
          <textarea id="description_en" rows={5} className={`${input} h-auto py-2`} value={form.description_en}
            onChange={(e) => set('description_en', e.target.value)} required />
          {fieldError('description_en')}
        </div>
      </section>

      {/* ── Pravila kuće (tekst) ── */}
      <section className={box} id="pravila">
        <div>
          <h2 className={h2}>
            Pravila kuće <span className="font-sans text-base font-normal text-text/60">(opciono)</span>
          </h2>
          <p className="mt-1 text-sm text-text/70">
            Sva pravila u jednom tekstu, prikazuju se na stranici kuće pod „Pravila kuće“. Svako pravilo u novom
            redu, npr. „Muzika napolju do 23h“, „Depozit 50 € vraća se po odlasku“, „Posteljina i peškiri su
            uključeni“. Kućice za žurke, ljubimce i pušenje i vreme dolaska/odlaska ostaju jer po njima
            gosti pretražuju.
          </p>
        </div>
        {([
          ['rules_sr', 'Na srpskom'],
          ['rules_en', 'Na engleskom'],
        ] as const).map(([key, text]) => (
          <div key={key} id={`field-${key}`}>
            <label htmlFor={key} className={label}>{text}</label>
            <textarea id={key} rows={6} maxLength={4000} className={`${input} h-auto py-2`} value={form[key]}
              placeholder={key === 'rules_sr' ? 'Mir posle 23h\nBez žurki u Brvnari\nDepozit …' : 'Quiet after 11 pm\n…'}
              onChange={(e) => set(key, e.target.value)} />
            {key === 'rules_en' && (
              <p className="mt-1 text-xs text-text/60">Ako ostavite prazno, na engleskoj stranici se prikazuje srpski tekst.</p>
            )}
            {fieldError(key)}
          </div>
        ))}
      </section>

      {/* ── Fotografije ── */}
      <section className={box} id="field-photos">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={h2}>Fotografije</h2>
          <p className="text-sm text-text/60">Prevucite fotografije ovde ili ih dodajte dugmetom. Redosled menjate prevlačenjem; prva je naslovna. Velike fotografije se same smanje.</p>
        </div>
        <PhotoManager photos={form.photos} uploading={uploading} onUpload={uploadPhotos}
          onChange={(photos) => set('photos', photos)} />
        {fieldError('photos')}
      </section>

      {/* ── Vrsta kuće i sadržaji ── */}
      <section className={box} id="vrsta">
        <h2 className={h2}>Vrsta kuće</h2>
        <div className="flex flex-wrap gap-2">
          {options.categoryIds.map((id) => (
            <Chip key={id} active={form.category_ids.includes(id)} onClick={() => toggleIn('category_ids', id)}>
              {(sr.categories as Record<string, string>)[id] ?? id}
            </Chip>
          ))}
        </div>
        <h2 className={`${h2} pt-2`}>Šta kuća ima</h2>
        <div className="flex flex-wrap gap-2">
          {options.amenityIds.map((id) => (
            <Chip key={id} active={form.amenity_ids.includes(id)} onClick={() => toggleIn('amenity_ids', id)}>
              {(sr.amenities as Record<string, string>)[id] ?? id}
            </Chip>
          ))}
        </div>
      </section>

      {/* ── Pravila ── */}
      <section className={box} id="ulazak">
        <h2 className={h2}>Dozvoljeno i vreme dolaska</h2>
        {hasUnits && (
          <p className="rounded-lg bg-background px-4 py-3 text-sm text-text/80">
            Svaka jedinica ima svoja pravila, vreme dolaska i odlaska i cenu žurke (u delu „Delovi objekta“).
          </p>
        )}
        <div className={hasUnits ? 'hidden' : 'space-y-4'}>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ['parties_allowed', 'Žurke su dozvoljene'],
            ['pets_allowed', 'Ljubimci su dozvoljeni'],
            ['smoking_allowed', 'Pušenje je dozvoljeno'],
          ] as const).map(([key, text]) => (
            <label key={key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input type="checkbox" className="size-5 accent-primary" checked={form[key]}
                onChange={(e) => set(key, e.target.checked)} />
              {text}
            </label>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-2 md:max-w-md">
          <div id="field-check_in_time">
            <label htmlFor="check_in" className={label}>Dolazak od</label>
            <input id="check_in" type="time" className={input} value={form.check_in_time}
              onChange={(e) => set('check_in_time', e.target.value)} required />
            {fieldError('check_in_time')}
          </div>
          <div id="field-check_out_time">
            <label htmlFor="check_out" className={label}>Odlazak do</label>
            <input id="check_out" type="time" className={input} value={form.check_out_time}
              onChange={(e) => set('check_out_time', e.target.value)} required />
            {fieldError('check_out_time')}
          </div>
        </div>
        </div>
      </section>

      {/* ── Lokacija i kontakt ── */}
      <section className={box} id="lokacija">
        <h2 className={h2}>Lokacija i kontakt vlasnika</h2>
        <div id="field-address">
          <label htmlFor="address" className={label}>Adresa</label>
          <input id="address" className={input} value={form.address} onChange={(e) => set('address', e.target.value)} required />
          {fieldError('address')}
        </div>

        {/* Map pin: paste a Google Maps link (or coordinates) and we read the location from it */}
        <div id="field-lat" className="space-y-3 rounded-xl bg-background p-4">
          <div>
            <h3 className="font-semibold text-primary">Lokacija na mapi</h3>
            <p className="text-sm text-text/70">
              Na Google mapama nađite kuću, dodirnite tačno mesto (pojaviće se crveni pin), pa
              <strong> Podeli → Kopiraj link</strong> i nalepite ga ovde. Mogu i koordinate, npr. 43.7213, 19.7064.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Link sa Google mapa ili koordinate"
              className={input}
              placeholder="https://maps.app.goo.gl/…"
              value={mapLink}
              onChange={(e) => { setMapLink(e.target.value); setMapError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); findOnMap(); } }}
            />
            <button type="button" onClick={findOnMap} disabled={!mapLink.trim() || findingOnMap}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-accent-dark disabled:opacity-50">
              {findingOnMap ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
              Pronađi
            </button>
          </div>
          {mapError && <p role="alert" className="text-sm text-accent-dark">{mapError}</p>}
          <div className="grid grid-cols-2 gap-3 md:max-w-sm">
            {(['lat', 'lng'] as const).map((key) => (
              <div key={key}>
                <label htmlFor={key} className="mb-1 block text-xs font-medium">
                  {key === 'lat' ? 'Geografska širina' : 'Geografska dužina'}
                </label>
                <input id={key} className={input} inputMode="decimal" placeholder="—" value={form[key]}
                  onChange={(e) => set(key, e.target.value.replace(',', '.'))} />
              </div>
            ))}
          </div>
          {fieldError('lat')}
          {form.lat && form.lng && Number.isFinite(Number(form.lat)) && Number.isFinite(Number(form.lng)) ? (
            <div className="overflow-hidden rounded-lg ring-1 ring-primary/10">
              <iframe
                title="Pregled lokacije"
                src={mapEmbedUrl({ lat: Number(form.lat), lng: Number(form.lng), address: form.address }, 'sr', 14)}
                loading="lazy"
                className="h-56 w-full border-0"
              />
            </div>
          ) : (
            <p className="text-sm text-text/60">Bez pina, mapa na sajtu prikazuje približnu lokaciju po adresi.</p>
          )}
          {(form.lat || form.lng) && (
            <button type="button" onClick={() => { set('lat', ''); setForm((f) => ({ ...f, lng: '' })); }}
              className="text-sm font-medium text-accent-dark hover:underline">
              Uklonite pin
            </button>
          )}
        </div>
        {/* Distances / nearby (migration 0015), shown under the map on the house page */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-primary">
              Udaljenosti i okolina <span className="font-normal text-text/60">(opciono)</span>
            </h3>
            <p className="text-sm text-text/70">
              Svaka stavka u novom redu, npr. „45 min od centra Beograda“, „Prodavnica 2 km“, „Jezero 500 m peške“.
              Prikazuje se ispod mape.
            </p>
          </div>
          {([
            ['nearby_sr', 'Na srpskom'],
            ['nearby_en', 'Na engleskom'],
          ] as const).map(([key, text]) => (
            <div key={key} id={`field-${key}`}>
              <label htmlFor={key} className={label}>{text}</label>
              <textarea id={key} rows={4} maxLength={1000} className={`${input} h-auto py-2`} value={form[key]}
                placeholder={key === 'nearby_sr' ? '45 min od centra Beograda\nProdavnica 2 km\nJezero 500 m' : '45 min from central Belgrade\n…'}
                onChange={(e) => set(key, e.target.value)} />
              {key === 'nearby_en' && (
                <p className="mt-1 text-xs text-text/60">Ako ostavite prazno, na engleskoj stranici se prikazuje srpski tekst.</p>
              )}
              {fieldError(key)}
            </div>
          ))}
        </div>

        <div id="field-owner_phone" className="md:max-w-sm">
          <label htmlFor="owner_phone" className={label}>Telefon vlasnika</label>
          <input id="owner_phone" type="tel" className={input} placeholder="+381 6x xxx xxxx" required
            value={form.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} />
          <p className="mt-1 text-xs text-text/60">Ne prikazuje se na sajtu. Vidite ga samo vi, i u upitima za rezervaciju.</p>
          {fieldError('owner_phone')}
        </div>
      </section>

      {/* ── Objava ── */}
      <section className={box} id="objava">
        <h2 className={h2}>Objava</h2>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="size-5 accent-primary" checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)} />
          <span>
            <span className="font-medium">Objavljena na sajtu</span>
            <span className="block text-sm text-text/60">Skrivene kuće vidite samo vi u administraciji.</span>
          </span>
        </label>
        <div id="field-featured_rank" className="max-w-xs">
          <label htmlFor="featured" className={label}>Mesto u „Izdvojeno za ovaj vikend“</label>
          <input id="featured" className={input} inputMode="numeric" placeholder="prazno = ne prikazuj"
            value={form.featured_rank} onChange={(e) => set('featured_rank', e.target.value.replace(/\D/g, ''))} />
          <p className="mt-1 text-sm text-text/60">1 = prva. Prikazuje se do 6 kuća.</p>
        </div>

        {/* Verified badge: only for houses someone from Vikendly has actually visited */}
        <div id="field-verified_at" className="space-y-3 rounded-xl bg-background p-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="size-5 accent-primary" checked={form.verified_at !== ''}
              onChange={(e) => set('verified_at', e.target.checked ? toDateParam(new Date()) : '')} />
            <span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <BadgeCheck className="size-4 text-primary" aria-hidden /> Lično smo proverili ovu kuću
              </span>
              <span className="block text-sm text-text/60">
                Štiklirajte samo ako je neko iz Vikendly tima bio u kući i proverio da je sve kao na oglasu.
                Gosti tada vide oznaku „Provereno uživo“.
              </span>
            </span>
          </label>
          {form.verified_at !== '' && (
            <div className="max-w-xs">
              <label htmlFor="verified-at" className={label}>Datum posete</label>
              <input id="verified-at" type="date" className={input} value={form.verified_at}
                max={toDateParam(new Date())}
                onChange={(e) => set('verified_at', e.target.value)} />
            </div>
          )}
        </div>
      </section>

      {/* ── Sticky save bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <button type="submit" disabled={pending || uploading > 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-accent-dark disabled:opacity-60">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isNew ? 'Sačuvajte kuću' : 'Sačuvajte izmene'}
          </button>
          {saved && !pending && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary" role="status">
              <Check className="size-4" aria-hidden /> Sačuvano. Sajt je osvežen.
            </span>
          )}
          {error && !error.field && <span role="alert" className="text-sm text-accent-dark">{error.message}</span>}
          {error?.field && <span role="alert" className="text-sm text-accent-dark">Proverite označeno polje.</span>}
          {!isNew && (
            <button type="button" onClick={onDelete} disabled={pending}
              className="ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-accent-dark hover:bg-accent/10">
              <Trash2 className="size-4" aria-hidden /> Obrišite kuću
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white hover:border-primary'
      }`}>
      {active && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}
