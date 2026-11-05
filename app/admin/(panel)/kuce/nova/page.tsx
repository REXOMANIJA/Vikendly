import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminOptions } from '@/lib/admin-data';
import HouseForm from '@/components/admin/HouseForm';

export default async function NewHousePage() {
  const options = await getAdminOptions();
  return (
    <>
      <Link href="/admin/kuce" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text/70 hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Sve kuće
      </Link>
      <h1 className="mb-6 font-serif text-3xl font-bold text-primary">Nova kuća</h1>
      <HouseForm options={options} />
    </>
  );
}
