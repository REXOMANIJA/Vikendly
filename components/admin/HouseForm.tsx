'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, X, Check } from 'lucide-react';
import sr from '@/locales/sr/common.json';
import { slugify } from '@/lib/slug';
import { createBrowserAdminClient } from '@/lib/supabase/browser';
import { deleteHouse, saveHouse, type HouseInput } from '@/app/admin/actions';
import type { AdminHouse } from '@/lib/admin-data';

type Options = {
  destinations: { id: string; name: string }[];
  categoryIds: string[];
  amenityIds: string[];
};

// Numbers are edited as text so a field can be empty while typing
type FormState = Omit<
  HouseInput,
  'capacity' | 'bedrooms' | 'bathrooms' | 'weekday_price' | 'weekend_price' | 'cleaning_fee' | 'min_nights' | 'featured_rank'
> & {
  capacity: string;
  bedrooms: string;
  bathrooms: string;
  weekday_price: string;
  weekend_price: string;
  cleaning_fee: string;
  min_nights: string;
  featured_rank: string;
};

const empty: FormState = {
  slug: '', name: '', destination_id: '',
  capacity: '', bedrooms: '', bathrooms: '',
  weekday_price: '', weekend_price: '', cleaning_fee: '0', min_nights: '2',
  description_sr: '', description_en: '',
  parties_allowed: false, pets_allowed: false, smoking_allowed: false,
  check_in_time: '15:00', check_out_time: '11:00',
  address: '', contact_viber: '', contact_whatsapp: '', contact_phone: '',
  is_published: false, featured_rank: '',
  category_ids: [], amenity_ids: [], photos: [],
};

function fromHouse(h: AdminHouse): FormState {
  return {
    ...h,
    capacity: String(h.capacity),
    bedrooms: String(h.bedrooms),
    bathrooms: String(h.bathrooms),
    weekday_price: String(h.weekday_price),
    weekend_price: String(h.weekend_price),
    cleaning_fee: String(h.cleaning_fee),
    min_nights: String(h.min_nights),
    featured_rank: h.featured_rank === null ? '' : String(h.featured_rank),
    contact_viber: h.contact_viber ?? '',
    contact_whatsapp: h.contact_whatsapp ?? '',
    contact_phone: h.contact_phone ?? '',
  };
}

const num = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

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
      bedrooms: num(form.bedrooms),
      bathrooms: num(form.bathrooms),
      weekday_price: num(form.weekday_price),
      weekend_price: num(form.weekend_price),
      cleaning_fee: num(form.cleaning_fee),
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

      {/* ── Kapacitet i cene ── */}
      <section className={box}>
        <h2 className={h2}>Kapacitet i cene</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {([
            ['capacity', 'Broj gostiju'],
            ['bedrooms', 'Spavaće sobe'],
            ['bathrooms', 'Kupatila'],
            ['min_nights', 'Najmanje noći'],
            ['weekday_price', 'Cena radnim danima (€/noć)'],
            ['weekend_price', 'Cena petak i subota (€/noć)'],
            ['cleaning_fee', 'Čišćenje (€)'],
          ] as const).map(([key, text]) => (
            <div key={key} id={`field-${key}`}>
              <label htmlFor={key} className={label}>{text}</label>
              <input id={key} className={input} inputMode="decimal" value={form[key]}
                onChange={(e) => set(key, e.target.value)} required />
              {fieldError(key)}
            </div>
          ))}
        </div>
        <p className="text-sm text-text/60">Boravišna taksa se računa automatski po destinaciji.</p>
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
        <div className="grid gap-4 md:grid-cols-3" id="field-contact_phone">
          {([
            ['contact_viber', 'Viber'],
            ['contact_whatsapp', 'WhatsApp'],
            ['contact_phone', 'Telefon'],
          ] as const).map(([key, text]) => (
            <div key={key}>
              <label htmlFor={key} className={label}>{text}</label>
              <input id={key} type="tel" className={input} placeholder="+381 6x xxx xxxx" value={form[key]}
                onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
        </div>
        {fieldError('contact_phone')}
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
