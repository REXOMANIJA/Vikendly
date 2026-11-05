'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, X, Check, Plus, MapPin } from 'lucide-react';
import sr from '@/locales/sr/common.json';
import { slugify } from '@/lib/slug';
import { createBrowserAdminClient } from '@/lib/supabase/browser';
import { deleteHouse, resolveMapsLink, saveHouse, type HouseInput } from '@/app/admin/actions';
import { mapEmbedUrl } from '@/lib/maps';
import type { AdminHouse } from '@/lib/admin-data';

type Options = {
  destinations: { id: string; name: string }[];
  categoryIds: string[];
  amenityIds: string[];
};

// Numbers are edited as text so a field can be empty while typing
type FormState = Omit<
  HouseInput,
  | 'capacity' | 'day_capacity' | 'bedrooms' | 'bathrooms' | 'weekday_price' | 'weekend_price'
  | 'min_nights' | 'featured_rank' | 'price_tiers' | 'lat' | 'lng'
> & {
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
};

type TierRow = { key: string; max_guests: string; weekday_price: string; weekend_price: string };

const empty: FormState = {
  slug: '', name: '', destination_id: '',
  capacity: '', day_capacity: '', bedrooms: '', bathrooms: '', price_tiers: [],
  weekday_price: '', weekend_price: '', min_nights: '2',
  description_sr: '', description_en: '',
  parties_allowed: false, pets_allowed: false, smoking_allowed: false,
  check_in_time: '15:00', check_out_time: '11:00',
  address: '', lat: '', lng: '', owner_phone: '',
  is_published: false, featured_rank: '',
  category_ids: [], amenity_ids: [], photos: [],
};

function fromHouse(h: AdminHouse): FormState {
  return {
    ...h,
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
  };
}

const num = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));
/** Empty optional field → null, otherwise a number (NaN if not a number, caught by validation) */
const optionalNum = (v: string) => (v.trim() === '' ? null : num(v));

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';
const label = 'mb-1.5 block text-sm font-medium';

export default function HouseForm({ house, options }: { house?: AdminHouse; options: Options }) {
  const router = useRouter();
  const isNew = !house;
  const [form, setForm] = useState<FormState>(house ? fromHouse(house) : empty);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
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
  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const supabase = createBrowserAdminClient();
    const folder = form.slug || 'nova-kuca';
    setUploading((n) => n + files.length);
    for (const file of Array.from(files)) {
      try {
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} je veći od 8 MB.`);
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
    if (fileInput.current) fileInput.current.value = '';
  };

  const movePhoto = (index: number, by: -1 | 1) => {
    const photos = [...form.photos];
    const target = index + by;
    if (target < 0 || target >= photos.length) return;
    [photos[index], photos[target]] = [photos[target], photos[index]];
    set('photos', photos);
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
  const box = 'rounded-2xl bg-white p-5 md:p-6 shadow-sm space-y-4';
  const h2 = 'font-serif text-xl font-bold text-primary';

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-28">
      {/* ── Osnovno ── */}
      <section className={box}>
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
              <span className="pl-3 text-sm text-text/60 whitespace-nowrap">vikendly.com/sr/kuce/</span>
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
      <section className={box}>
        <h2 className={h2}>Kapacitet</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {([
            ['capacity', 'Broj osoba za noćenje', true, 'Koliko ljudi može da prespava.'],
            ['day_capacity', 'Za žurku / druženje', false, 'Opciono. Koliko ljudi sme da dođe tokom dana.'],
            ['bedrooms', 'Spavaće sobe', false, 'Opciono.'],
            ['bathrooms', 'Kupatila', false, 'Opciono.'],
          ] as const).map(([key, text, required, hint]) => (
            <div key={key} id={`field-${key}`}>
              <label htmlFor={key} className={label}>{text}</label>
              <input id={key} className={input} inputMode="numeric" value={form[key]}
                placeholder={required ? '' : '—'}
                onChange={(e) => set(key, e.target.value.replace(/\D/g, ''))} required={required} />
              <p className="mt-1 text-xs text-text/60">{hint}</p>
              {fieldError(key)}
            </div>
          ))}
        </div>
      </section>

      {/* ── Cene ── */}
      <section className={box}>
        <h2 className={h2}>Cene</h2>
        <p className="text-sm text-text/70">
          Cena cele kuće važi za grupu do {form.capacity || '…'} osoba.
        </p>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {([
            ['weekday_price', 'Radnim danima (€/noć)'],
            ['weekend_price', 'Petak i subota (€/noć)'],
            ['min_nights', 'Najmanje noći'],
          ] as const).map(([key, text]) => (
            <div key={key} id={`field-${key}`}>
              <label htmlFor={key} className={label}>{text}</label>
              <input id={key} className={input} inputMode="decimal" value={form[key]}
                onChange={(e) => set(key, e.target.value)} required />
              {fieldError(key)}
            </div>
          ))}
        </div>

        {/* Optional cheaper prices for smaller groups */}
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
        <p className="text-sm text-text/60">Boravišna taksa se računa automatski po destinaciji i broju osoba.</p>
      </section>

      {/* ── Opis ── */}
      <section className={box}>
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

      {/* ── Fotografije ── */}
      <section className={box} id="field-photos">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={h2}>Fotografije</h2>
          <p className="text-sm text-text/60">Prva fotografija je naslovna. JPG, PNG ili WebP, do 8 MB.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {form.photos.map((url, i) => (
            <li key={url} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">Naslovna</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="flex gap-1">
                  <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0}
                    className="rounded-md bg-white/90 p-1.5 disabled:opacity-30" aria-label="Pomeri levo">
                    <ArrowLeft className="size-4" />
                  </button>
                  <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === form.photos.length - 1}
                    className="rounded-md bg-white/90 p-1.5 disabled:opacity-30" aria-label="Pomeri desno">
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                <button type="button" onClick={() => set('photos', form.photos.filter((p) => p !== url))}
                  className="rounded-md bg-white/90 p-1.5 text-accent-dark" aria-label="Ukloni fotografiju">
                  <X className="size-4" />
                </button>
              </div>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <li key={`up-${i}`} className="flex aspect-[4/3] items-center justify-center rounded-xl bg-background">
              <Loader2 className="size-6 animate-spin text-primary" aria-label="Otpremanje…" />
            </li>
          ))}
          <li>
            <button type="button" onClick={() => fileInput.current?.click()}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5">
              <ImagePlus className="size-6" aria-hidden />
              <span className="text-sm font-medium">Dodajte fotografije</span>
            </button>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple
              className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
          </li>
        </ul>
        {fieldError('photos')}
      </section>

      {/* ── Vrsta kuće i sadržaji ── */}
      <section className={box}>
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
      <section className={box}>
        <h2 className={h2}>Pravila kuće</h2>
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
      </section>

      {/* ── Lokacija i kontakt ── */}
      <section className={box}>
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
        <div id="field-owner_phone" className="md:max-w-sm">
          <label htmlFor="owner_phone" className={label}>Telefon vlasnika</label>
          <input id="owner_phone" type="tel" className={input} placeholder="+381 6x xxx xxxx" required
            value={form.owner_phone} onChange={(e) => set('owner_phone', e.target.value)} />
          <p className="mt-1 text-xs text-text/60">Ne prikazuje se na sajtu. Vidite ga samo vi, i u upitima za rezervaciju.</p>
          {fieldError('owner_phone')}
        </div>
      </section>

      {/* ── Objava ── */}
      <section className={box}>
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
      </section>

      {/* ── Sticky save bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-white/95 backdrop-blur">
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
