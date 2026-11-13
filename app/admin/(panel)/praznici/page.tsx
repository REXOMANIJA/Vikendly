import { listDestinationsForAdmin, listHolidaysForAdmin, listHousesForAdmin, listSpecialPriceRanges } from '@/lib/admin-data';
import HolidayManager from '@/components/admin/HolidayManager';

export default async function AdminHolidaysPage() {
  const [holidays, houses, destinations, specialRanges] = await Promise.all([
    listHolidaysForAdmin(),
    listHousesForAdmin(),
    listDestinationsForAdmin(),
    listSpecialPriceRanges(),
  ]);
  const destinationName = (id: string) => destinations.find((d) => d.id === id)?.name ?? id;

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-primary">Praznici</h1>
      <p className="mb-6 max-w-3xl text-text/70">
        Praznična ponuda (Nova godina, Božić, Srpska Nova godina, Uskrs…). Dok je uključena, prikazuje se na
        početnoj strani i na svojoj stranici, sa kućama koje označite kao slobodne. Cene za praznične noći unosite
        u svakoj kući, u delu „Posebne cene za praznike“.
      </p>
      {holidays === null ? (
        <p className="rounded-2xl bg-accent/10 p-6 text-accent-dark">
          Praznici još nisu uključeni u bazi: pokrenite migraciju <strong>0016_holidays_and_special_prices.sql</strong> u
          Supabase-u (SQL Editor), pa osvežite ovu stranicu.
        </p>
      ) : (
        <HolidayManager
          holidays={holidays}
          houses={houses.map((h) => ({ id: h.id, name: h.name, is_published: h.is_published, destination: destinationName(h.destination_id) }))}
          specialRanges={specialRanges}
        />
      )}
    </>
  );
}
