import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getAdminOptions, getHouseForAdmin } from '@/lib/admin-data';
import HouseForm from '@/components/admin/HouseForm';

export default async function EditHousePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sacuvano?: string }>;
}) {
  const { id } = await params;
  const { sacuvano } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [house, options] = await Promise.all([getHouseForAdmin(id), getAdminOptions()]);
  if (!house) notFound();

  return (
    <>
      <Link href="/admin/kuce" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text/70 hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Sve kuće
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-bold text-primary">{house.name}</h1>
        {house.is_published && (
          <a href={`/sr/kuce/${house.slug}`} target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm hover:bg-primary/10">
            <ExternalLink className="size-4" aria-hidden /> Pogledajte na sajtu
          </a>
        )}
      </div>
      {sacuvano && (
        <p role="status" className="mb-6 rounded-lg bg-primary/10 px-4 py-3 text-primary">
          Kuća je sačuvana.{house.is_published ? ' Vidljiva je na sajtu.' : ' Skrivena je dok je ne objavite.'}
        </p>
      )}
      {/* key: reset the form when switching houses */}
      <HouseForm key={house.id} house={house} options={options} />
    </>
  );
}
