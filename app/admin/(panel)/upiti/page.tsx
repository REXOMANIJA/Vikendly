import { listBookingRequests } from '@/lib/admin-data';
import BookingRequestList from '@/components/admin/BookingRequestList';
import TestErrorButton from '@/components/admin/TestErrorButton';

export default async function BookingRequestsPage() {
  const requests = await listBookingRequests();
  const newCount = requests.filter((r) => r.status === 'new').length;

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">Upiti za rezervaciju</h1>
      <p className="mb-6 mt-1 text-text/70">
        Najnoviji prvi · {requests.length} ukupno
        {newCount > 0 && (
          <span className="ml-2 rounded-full bg-accent-dark px-2 py-0.5 text-sm font-semibold text-white">
            {newCount} {newCount === 1 ? 'novi' : 'novih'}
          </span>
        )}
      </p>
      <BookingRequestList requests={requests} nowIso={new Date().toISOString()} />
      <TestErrorButton />
    </>
  );
}
