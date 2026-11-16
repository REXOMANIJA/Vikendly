'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, EyeOff, ExternalLink, ImagePlus, Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { deleteHoliday, saveHoliday, type HolidayInput } from '@/app/admin/actions';
import type { AdminHoliday } from '@/lib/admin-data';
import { createBrowserAdminClient } from '@/lib/supabase/browser';
import { shrinkPhoto } from '@/lib/shrink-photo';
import { slugify } from '@/lib/slug';

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';
const label = 'mb-1.5 block text-sm font-medium';

type HouseOption = { id: string; name: string; is_published: boolean; destination: string };
type Range = { house_id: string; first_night: string; last_night: string };

/** "2026-12-30" → "30.12.2026." */
const sr = (date: string) => {
  const [y, m, d] = date.split('-');
  return `${Number(d)}.${Number(m)}.${y}.`;
};

/**
 * Admin → Praznici: holiday offers (Nova godina, Srpska Nova godina…). While one is switched on
 * and not over, the homepage shows it and it has its own page with the ticked houses.
 */
export default function HolidayManager({
  holidays,
  houses,
  specialRanges,
}: {
  holidays: AdminHoliday[];
  houses: HouseOption[];
  specialRanges: Range[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<HolidayInput | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const startNew = () => {
    setError('');
    const year = new Date().getFullYear();
    setEditing({
      name_sr: `Nova godina ${year + 1}`,
      name_en: `New Year ${year + 1}`,
      text_sr: 'Dočekajte Novu godinu u prirodi, sa svojim društvom. Ove kuće su slobodne za praznike.',
      text_en: 'Welcome the New Year in nature, with your own crowd. These houses are free for the holidays.',
      check_in: `${year}-12-30`,
      check_out: `${year + 1}-01-02`,
      image_url: '',
      is_active: false,
      house_ids: [],
    });
  };
  const startEdit = (h: AdminHoliday) => {
    setError('');
    setEditing({ ...h, image_url: h.image_url ?? '' });
  };

  /** Does this house have a holiday price for any night of the stay? */
  const hasSpecial = (houseId: string, h: Pick<HolidayInput, 'check_in' | 'check_out'>) =>
    specialRanges.some((r) => r.house_id === houseId && r.first_night < h.check_out && r.last_night >= h.check_in);

  const upload = async (original: File | undefined) => {
    if (!original || !editing) return;
    setError('');
    if (original.size > 40 * 1024 * 1024) return setError('Slika je veća od 40 MB.');
    setUploading(true);
    try {
      const file = await shrinkPhoto(original);
      const supabase = createBrowserAdminClient();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `praznici/${slugify(editing.name_sr) || 'praznik'}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('house-photos').upload(path, file, { cacheControl: '31536000', contentType: file.type });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('house-photos').getPublicUrl(path);
      setEditing((d) => (d ? { ...d, image_url: data.publicUrl } : d));
    } catch (e) {
      setError(`Otpremanje nije uspelo: ${(e as Error).message}`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      const result = await saveHoliday(editing);
      if (!result.ok) return setError(result.error);
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (h: AdminHoliday) => {
    if (!confirm(`Obrisati praznik „${h.name_sr}“? Kuće i njihove posebne cene ostaju.`)) return;
    startTransition(async () => {
      const result = await deleteHoliday(h.id);
      if (!result.ok) return alert(result.error);
      router.refresh();
    });
  };

  const toggleHouse = (id: string) =>
    setEditing((d) =>
      d ? { ...d, house_ids: d.house_ids.includes(id) ? d.house_ids.filter((x) => x !== id) : [...d.house_ids, id] } : d
    );

  return (
    <>
      {!editing && (
        <button type="button" onClick={startNew}
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-accent-dark px-4 py-2.5 font-medium text-white hover:bg-primary">
          <Plus className="size-4" aria-hidden /> Novi praznik
        </button>
      )}

      {editing && (
        <form onSubmit={save} className="mb-8 space-y-6 rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <h2 className="font-serif text-xl font-bold text-primary">{editing.id ? `Izmena: ${editing.name_sr}` : 'Novi praznik'}</h2>

          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            {/* Picture */}
            <div>
              <p className={label}>Slika</p>
              <button type="button" onClick={() => fileInput.current?.click()}
                className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-background text-primary hover:bg-primary/5">
                {editing.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.image_url} alt="" className="absolute inset-0 size-full object-cover" />
                ) : null}
                <span className={`relative z-10 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${editing.image_url ? 'bg-white/90 opacity-0 group-hover:opacity-100' : ''}`}>
                  {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
                  {editing.image_url ? 'Promenite sliku' : 'Dodajte sliku'}
                </span>
              </button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
                onChange={(e) => upload(e.target.files?.[0])} />
              <p className="mt-1 text-xs text-text/60">Bez slike se prikazuje zimski crtež.</p>
            </div>

            {/* Texts and dates */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="hol-name-sr" className={label}>Naziv (srpski)</label>
                  <input id="hol-name-sr" className={input} required maxLength={80} value={editing.name_sr}
                    onChange={(e) => setEditing({ ...editing, name_sr: e.target.value })} />
                  <p className="mt-1 text-xs text-text/60">
                    Adresa: …/praznici/<strong>{editing.id ? holidays.find((h) => h.id === editing.id)?.slug : slugify(editing.name_sr)}</strong>
                    {editing.id ? ' (ne menja se)' : ''}
                  </p>
                </div>
                <div>
                  <label htmlFor="hol-name-en" className={label}>Naziv (engleski)</label>
                  <input id="hol-name-en" className={input} maxLength={80} value={editing.name_en}
                    onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="hol-text-sr" className={label}>Kratak tekst (srpski)</label>
                  <textarea id="hol-text-sr" rows={3} maxLength={600} className={`${input} h-auto py-2`} value={editing.text_sr}
                    onChange={(e) => setEditing({ ...editing, text_sr: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="hol-text-en" className={label}>Kratak tekst (engleski)</label>
                  <textarea id="hol-text-en" rows={3} maxLength={600} className={`${input} h-auto py-2`} value={editing.text_en}
                    onChange={(e) => setEditing({ ...editing, text_en: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="hol-in" className={label}>Dolazak</label>
                  <input id="hol-in" type="date" required className={input} value={editing.check_in}
                    onChange={(e) => setEditing({ ...editing, check_in: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="hol-out" className={label}>Odlazak</label>
                  <input id="hol-out" type="date" required min={editing.check_in} className={input} value={editing.check_out}
                    onChange={(e) => setEditing({ ...editing, check_out: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-text/60">
                Gosti vide cenu za ove datume, a u upitu ih mogu promeniti. Ponuda nestaje sa sajta posle dana odlaska.
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-background p-3">
                <input type="checkbox" className="size-5 accent-primary" checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                <span>
                  <span className="block font-semibold text-primary">Prikazano na sajtu</span>
                  <span className="block text-sm text-text/70">Na početnoj strani i na stranici praznika.</span>
                </span>
              </label>
            </div>
          </div>

          {/* Houses */}
          <fieldset>
            <legend className="font-semibold text-primary">Slobodne kuće ({editing.house_ids.length})</legend>
            <p className="text-sm text-text/70">
              Označite kuće za koje ste sa vlasnikom potvrdili da su slobodne. Kada se neka popuni, skinite oznaku.
              Oznaka „posebna cena“ znači da kuća ima unetu prazničnu cenu za ove dane (Kuće → Posebne cene).
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {houses.map((h) => {
                const checked = editing.house_ids.includes(h.id);
                return (
                  <li key={h.id}>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 ${checked ? 'bg-primary/5 ring-2 ring-primary' : 'ring-primary/15'}`}>
                      <input type="checkbox" className="mt-0.5 size-5 accent-primary" checked={checked} onChange={() => toggleHouse(h.id)} />
                      <span className="min-w-0">
                        <span className="block font-medium text-primary">{h.name}</span>
                        <span className="flex flex-wrap gap-x-2 text-xs text-text/60">
                          {h.destination}
                          {!h.is_published && <span className="inline-flex items-center gap-1 text-accent-dark"><EyeOff className="size-3" aria-hidden /> skrivena</span>}
                          {hasSpecial(h.id, editing) && <span className="inline-flex items-center gap-1 text-primary"><Tag className="size-3" aria-hidden /> posebna cena</span>}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {error && <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-dark">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-white hover:bg-accent-dark disabled:opacity-60">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Sačuvajte
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2.5 font-medium text-text/70 hover:bg-background">
              Otkažite
            </button>
          </div>
        </form>
      )}

      {holidays.length === 0 && !editing && (
        <p className="rounded-2xl bg-white p-6 text-text/70 shadow-sm">Još nema praznika. Dodajte prvi, npr. „Nova godina“.</p>
      )}
      <ul className="grid gap-4 md:grid-cols-2">
        {holidays.map((h) => {
          const over = h.check_out < new Date().toISOString().slice(0, 10);
          return (
            <li key={h.id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-primary/10">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                {h.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.image_url} alt="" className="absolute inset-0 size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary">{h.name_sr}</p>
                <p className="inline-flex items-center gap-1 text-sm text-text/70">
                  <CalendarDays className="size-3.5" aria-hidden /> {sr(h.check_in)} – {sr(h.check_out)}
                </p>
                <p className="text-sm text-text/70">Kuća: {h.house_ids.length}</p>
                <p className="mt-1">
                  {over ? (
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text/60">Završeno</span>
                  ) : h.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                      <Check className="size-3" aria-hidden /> Na sajtu
                    </span>
                  ) : (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-dark">Isključeno</span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => startEdit(h)} aria-label={`Izmenite ${h.name_sr}`}
                  className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="size-4" /></button>
                {h.is_active && !over && (
                  <a href={`/praznici/${h.slug}`} target="_blank" aria-label="Otvorite na sajtu"
                    className="rounded-lg p-2 text-primary hover:bg-primary/10"><ExternalLink className="size-4" /></a>
                )}
                <button type="button" onClick={() => remove(h)} disabled={pending} aria-label={`Obrišite ${h.name_sr}`}
                  className="rounded-lg p-2 text-accent-dark hover:bg-accent/10 disabled:opacity-40"><Trash2 className="size-4" /></button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
