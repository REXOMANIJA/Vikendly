import Link from 'next/link';
import { Plus, Pencil, ExternalLink, Star } from 'lucide-react';
import { getAdminOptions, listHousesForAdmin } from '@/lib/admin-data';
import PublishToggle from '@/components/admin/PublishToggle';

export default async function AdminHousesPage() {
  const [houses, { destinations }] = await Promise.all([listHousesForAdmin(), getAdminOptions()]);
  const destinationName = (id: string) => destinations.find((d) => d.id === id)?.name ?? id;
  const published = houses.filter((h) => h.is_published).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Kuće</h1>
          <p className="text-text/70">
            {houses.length} ukupno · {published} objavljeno · {houses.length - published} skriveno
          </p>
        </div>
        <Link
          href="/admin/kuce/nova"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-dark px-4 py-2.5 font-medium text-white hover:bg-primary"
        >
          <Plus className="size-4" aria-hidden /> Nova kuća
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul className="divide-y divide-primary/10">
          {houses.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-background">
                {h.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.cover} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold text-primary">
                  {h.name}
                  {h.featured_rank !== null && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-dark"
                      title="Prikazuje se u 'Izdvojeno za ovaj vikend'"
                    >
                      <Star className="size-3" aria-hidden /> Izdvojena #{h.featured_rank}
                    </span>
                  )}
                </p>
                <p className="text-sm text-text/70">
                  {destinationName(h.destination_id)} · {h.capacity} gostiju · od €{h.weekday_price}/noć
                </p>
              </div>
              <PublishToggle id={h.id} published={h.is_published} />
              <div className="flex gap-2">
                {h.is_published && (
                  <a
                    href={`/sr/kuce/${h.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm hover:bg-primary/10"
                  >
                    <ExternalLink className="size-4" aria-hidden /> Pogledaj
                  </a>
                )}
                <Link
                  href={`/admin/kuce/${h.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white"
                >
                  <Pencil className="size-4" aria-hidden /> Izmeni
                </Link>
              </div>
            </li>
          ))}
          {houses.length === 0 && <li className="p-8 text-center text-text/70">Još nema kuća.</li>}
        </ul>
      </div>
    </>
  );
}
