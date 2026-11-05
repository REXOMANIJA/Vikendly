import { listDestinationsForAdmin } from '@/lib/admin-data';
import { getDestinations, getHouseCountsByDestination } from '@/lib/data';
import { HOMEPAGE_DESTINATIONS, pickHomepageDestinations } from '@/lib/destinations';
import DestinationManager from '@/components/admin/DestinationManager';

export default async function AdminDestinationsPage() {
  const [destinations, publicDestinations, publishedCounts] = await Promise.all([
    listDestinationsForAdmin(),
    getDestinations(),
    getHouseCountsByDestination(),
  ]);
  // Same rule as the homepage (published houses only), so the badge matches what visitors see
  const homepageIds = pickHomepageDestinations(publicDestinations, publishedCounts).map((d) => d.id);

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-primary">Destinacije</h1>
      <p className="mb-6 text-text/70">
        Mesta na kojima su kuće. Na početnoj strani se automatski prikazuje {HOMEPAGE_DESTINATIONS} destinacija
        sa najviše objavljenih kuća (oznaka „Na početnoj“); sve ostale su na stranici „Sve destinacije“.
      </p>
      <DestinationManager destinations={destinations} homepageIds={homepageIds} />
    </>
  );
}
