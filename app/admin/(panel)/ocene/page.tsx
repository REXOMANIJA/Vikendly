import { listReviews } from '@/lib/admin-data';
import ReviewRow from '@/components/admin/ReviewRow';

export default async function ReviewsPage() {
  const reviews = await listReviews();

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-primary">Ocene gostiju</h1>
      {reviews === null ? (
        <p className="mt-4 rounded-lg bg-accent/10 px-4 py-3 text-accent-dark">
          Ocene još nisu uključene: pokrenite migraciju <code>0013_venues_and_reviews.sql</code> u Supabase → SQL Editor.
        </p>
      ) : (
        <>
          <p className="mb-6 text-text/70">
            Na sajtu se vide samo objavljene. Link za ocenu pravite kod potvrđenog upita (Upiti → status „Potvrđeno“).
            · {reviews.filter((r) => r.status === 'submitted').length} čeka odobrenje
          </p>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <ul className="divide-y divide-primary/10">
              {reviews.map((r) => <ReviewRow key={r.id} review={r} />)}
              {reviews.length === 0 && <li className="p-8 text-center text-text/70">Još nema ocena.</li>}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
