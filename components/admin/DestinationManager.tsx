'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ImagePlus, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { createBrowserAdminClient } from '@/lib/supabase/browser';
import { slugify } from '@/lib/slug';
import { deleteDestination, saveDestination, type DestinationInput } from '@/app/admin/actions';
import type { AdminDestination } from '@/lib/admin-data';

const countries: { value: DestinationInput['country']; label: string }[] = [
  { value: 'SR', label: 'Srbija' },
  { value: 'BA', label: 'Bosna i Hercegovina' },
  { value: 'ME', label: 'Crna Gora' },
  { value: 'HR', label: 'Hrvatska' },
];
const countryName = (c: string) => countries.find((x) => x.value === c)?.label ?? c;

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';
const label = 'mb-1.5 block text-sm font-medium';

type Draft = DestinationInput & { house_count?: number };

export default function DestinationManager({
  destinations,
  homepageIds,
}: {
  destinations: AdminDestination[];
  /** Destinations currently shown on the homepage */
  homepageIds: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const startNew = () => {
    setError('');
    setEditing({ name: '', country: 'SR', image_url: '', sort_order: destinations.length });
  };
  const startEdit = (d: AdminDestination) => {
    setError('');
    setEditing({ id: d.id, name: d.name, country: d.country, image_url: d.image_url ?? '', sort_order: d.sort_order, house_count: d.house_count });
  };

  const upload = async (file: File | undefined) => {
    if (!file || !editing) return;
    setError('');
    if (file.size > 8 * 1024 * 1024) return setError('Slika je veća od 8 MB.');
    setUploading(true);
    try {
      const supabase = createBrowserAdminClient();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `destinacije/${slugify(editing.name) || 'destinacija'}-${crypto.randomUUID()}.${ext}`;
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
      const result = await saveDestination(editing);
      if (!result.ok) return setError(result.error);
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (d: AdminDestination) => {
    if (!confirm(`Obrisati destinaciju „${d.name}“?`)) return;
    setRowError(null);
    startTransition(async () => {
      const result = await deleteDestination(d.id);
      if (!result.ok) return setRowError({ id: d.id, message: result.error });
      router.refresh();
    });
  };

  return (
    <>
      {!editing && (
        <button type="button" onClick={startNew}
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-accent-dark px-4 py-2.5 font-medium text-white hover:bg-primary">
          <Plus className="size-4" aria-hidden /> Nova destinacija
        </button>
      )}

      {editing && (
        <form onSubmit={save} className="mb-8 grid gap-6 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-[280px_1fr] md:p-6">
          {/* Picture */}
          <div>
            <p className={label}>Slika (za početnu stranu)</p>
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
            <p className="mt-1 text-xs text-text/60">Bez slike se prikazuje opšti pejzaž.</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-primary">{editing.id ? `Izmena: ${editing.name}` : 'Nova destinacija'}</h2>
            <div>
              <label htmlFor="dest-name" className={label}>Naziv</label>
              <input id="dest-name" className={input} required maxLength={60} placeholder="npr. Ozren" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              {!editing.id && editing.name && (
                <p className="mt-1 text-xs text-text/60">Adresa pretrage: …/search?destination=<strong>{slugify(editing.name)}</strong></p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dest-country" className={label}>Država</label>
                <select id="dest-country" className={input} value={editing.country}
                  onChange={(e) => setEditing({ ...editing, country: e.target.value as DestinationInput['country'] })}>
                  {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="dest-order" className={label}>Redosled</label>
                <input id="dest-order" className={input} inputMode="numeric" value={String(editing.sort_order)}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value.replace(/\D/g, '') || 0) })} />
                <p className="mt-1 text-xs text-text/60">Manji broj ide ispred kada dve destinacije imaju isti broj kuća.</p>
              </div>
            </div>
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
          </div>
        </form>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d) => (
          <li key={d.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/10">
            <div className="relative aspect-[16/9] bg-background">
              {d.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image_url} alt="" className="absolute inset-0 size-full object-cover" />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-primary">#{d.sort_order}</span>
              {homepageIds.includes(d.id) && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                  <Home className="size-3" aria-hidden /> Na početnoj
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-2 p-4">
              <div>
                <p className="font-semibold text-primary">{d.name}</p>
                <p className="inline-flex items-center gap-1 text-sm text-text/70">
                  <MapPin className="size-3.5" aria-hidden /> {countryName(d.country)} · {d.house_count} {d.house_count === 1 ? 'kuća' : d.house_count >= 2 && d.house_count <= 4 ? 'kuće' : 'kuća'}
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => startEdit(d)} aria-label={`Izmenite ${d.name}`}
                  className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="size-4" /></button>
                <button type="button" onClick={() => remove(d)} disabled={pending} aria-label={`Obrišite ${d.name}`}
                  title={d.house_count ? 'Destinacija ima kuće, ne može se obrisati' : undefined}
                  className="rounded-lg p-2 text-accent-dark hover:bg-accent/10 disabled:opacity-40"><Trash2 className="size-4" /></button>
              </div>
            </div>
            {rowError?.id === d.id && <p className="px-4 pb-4 text-sm text-accent-dark">{rowError.message}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
