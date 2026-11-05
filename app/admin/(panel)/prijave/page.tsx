import { listOwnerApplications } from '@/lib/admin-data';
import ApplicationRow from '@/components/admin/ApplicationRow';

export default async function OwnerApplicationsPage() {
  const applications = await listOwnerApplications();
  const newCount = applications.filter((a) => a.status === 'new').length;

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-primary">Prijave vlasnika</h1>
      <p className="mb-6 text-text/70">
        Iz forme „Izdajte svoju kuću“ · {applications.length} ukupno · {newCount} novih
      </p>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul className="divide-y divide-primary/10">
          {applications.map((a) => <ApplicationRow key={a.id} application={a} />)}
          {applications.length === 0 && <li className="p-8 text-center text-text/70">Još nema prijava.</li>}
        </ul>
      </div>
    </>
  );
}
