import { listBookingRequests } from '@/lib/admin-data';
import BookingRequestList from '@/components/admin/BookingRequestList';

export default async function BookingRequestsPage() {
  const requests = await listBookingRequests();
  const newCount = requests.filter((r) => r.status === 'new').length;

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-primary">Upiti za rezervaciju</h1>
      <p className="mb-6 text-text/70">
        Najnoviji prvi · {requests.length} ukupno · {newCount} {newCount === 1 ? 'novi' : 'novih'}
      </p>
      <BookingRequestList requests={requests} />
    </>
  );
}
