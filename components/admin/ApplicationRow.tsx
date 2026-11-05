'use client';

import { useState, useTransition } from 'react';
import { Phone, MapPin, Trash2 } from 'lucide-react';
import { deleteApplication, setApplicationStatus } from '@/app/admin/actions';
import type { OwnerApplication } from '@/lib/admin-data';

const statuses: { value: OwnerApplication['status']; label: string; className: string }[] = [
  { value: 'new', label: 'Nova', className: 'bg-accent-dark text-white' },
  { value: 'contacted', label: 'Kontaktiran', className: 'bg-amber-100 text-amber-900' },
  { value: 'visited', label: 'Obiđena kuća', className: 'bg-sky-100 text-sky-900' },
  { value: 'published', label: 'Objavljena', className: 'bg-primary text-white' },
  { value: 'rejected', label: 'Odbijena', className: 'bg-gray-200 text-text/70' },
];

export default function ApplicationRow({ application }: { application: OwnerApplication }) {
  const [status, setStatus] = useState(application.status);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const current = statuses.find((s) => s.value === status)!;

  const change = (next: OwnerApplication['status']) => {
    const previous = status;
    setStatus(next);
    setError('');
    startTransition(async () => {
      const result = await setApplicationStatus(application.id, next);
      if (!result.ok) {
        setStatus(previous);
        setError(result.error);
      }
    });
  };

  const remove = () => {
    if (!confirm(`Obrisati prijavu od ${application.name}?`)) return;
    startTransition(async () => {
      const result = await deleteApplication(application.id);
      if (result.ok) setHidden(true);
      else setError(result.error);
    });
  };

  if (hidden) return null;

  const date = new Intl.DateTimeFormat('sr-Latn', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(application.created_at)
  );
  const tel = application.phone.replace(/[^\d+]/g, '');

  return (
    <li className="space-y-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-primary">{application.name}</p>
          <p className="text-sm text-text/60">{date}{application.locale === 'en' ? ' · engleski' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${current.className}`}>{current.label}</span>
          <select
            aria-label="Promenite status"
            value={status}
            disabled={pending}
            onChange={(e) => change(e.target.value as OwnerApplication['status'])}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
          >
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="button" onClick={remove} disabled={pending} aria-label="Obrišite prijavu"
            className="rounded-lg p-2 text-accent-dark hover:bg-accent/10">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <a href={`tel:${tel}`} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          <Phone className="size-4" aria-hidden /> {application.phone}
        </a>
        <span className="inline-flex items-center gap-1.5 text-text/80">
          <MapPin className="size-4" aria-hidden /> {application.location}
        </span>
      </div>
      <p className="whitespace-pre-line rounded-lg bg-background p-3 text-sm text-text/85">{application.description}</p>
      {error && <p className="text-sm text-accent-dark">{error}</p>}
    </li>
  );
}
