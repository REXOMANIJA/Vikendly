import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAdminOptions, listHousesForAdmin } from '@/lib/admin-data';
import HouseList from '@/components/admin/HouseList';

export default async function AdminHousesPage() {
  const [houses, { destinations }] = await Promise.all([listHousesForAdmin(), getAdminOptions()]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold text-primary">Kuće</h1>
        <Link
          href="/admin/kuce/nova"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-dark px-4 py-2.5 font-medium text-white hover:bg-primary"
        >
          <Plus className="size-4" aria-hidden /> Nova kuća
        </Link>
      </div>
      <HouseList houses={houses} destinations={destinations} />
    </>
  );
}
