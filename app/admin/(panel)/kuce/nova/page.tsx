import Link from 'next/link';
import { ArrowLeft, Inbox } from 'lucide-react';
import { getAdminOptions, getOwnerApplication } from '@/lib/admin-data';
import HouseForm, { type HousePrefill } from '@/components/admin/HouseForm';

/** "Zlatibor, Ribničko jezero" → finds the destination "Zlatibor" (ignores case and č/ć/š/ž/đ) */
const plain = (s: string) =>
  s.toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '');

export default async function NewHousePage({ searchParams }: { searchParams: Promise<{ prijava?: string }> }) {
  const { prijava } = await searchParams;
  const [options, application] = await Promise.all([
    getAdminOptions(),
    prijava ? getOwnerApplication(prijava) : Promise.resolve(null),
  ]);

  let prefill: HousePrefill | undefined;
  if (application) {
    const location = plain(application.location);
    const destination = options.destinations.find((d) => location.includes(plain(d.name)));
    prefill = {
      owner_phone: application.phone,
      address: application.location,
      destination_id: destination?.id ?? '',
    };
  }

  return (
    <>
      <Link href="/admin/kuce" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text/70 hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Sve kuće
      </Link>
      <h1 className="mb-6 font-serif text-3xl font-bold text-primary">Nova kuća</h1>

      {application && (
        <div className="mb-6 space-y-2 rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <Inbox className="size-4" aria-hidden /> Iz prijave vlasnika: {application.name}
          </p>
          <p className="text-text/80">
            Popunjeni su telefon vlasnika, adresa{prefill?.destination_id ? ' i destinacija' : ''} – proverite ih.
            Naziv, cene, opis i fotografije unesite posle obilaska.
          </p>
          <p className="whitespace-pre-line rounded-lg bg-white p-3 text-text/85">{application.description}</p>
          <p className="text-text/60">
            Kada objavite kuću, promenite status prijave u „Objavljena“ na strani{' '}
            <Link href="/admin/prijave" className="underline">Prijave vlasnika</Link>.
          </p>
        </div>
      )}
      {prijava && !application && (
        <p className="mb-6 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">
          Prijava nije pronađena (možda je obrisana). Forma je prazna.
        </p>
      )}

      <HouseForm options={options} prefill={prefill} />
    </>
  );
}
