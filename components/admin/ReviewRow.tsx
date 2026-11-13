'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, ExternalLink, Star, Trash2 } from 'lucide-react';
import { deleteReview, setReviewStatus } from '@/app/admin/actions';
import type { AdminReview } from '@/lib/admin-data';

const labels: Record<AdminReview['status'], { text: string; className: string }> = {
  submitted: { text: 'Čeka odobrenje', className: 'bg-accent-dark text-white' },
  approved: { text: 'Objavljena', className: 'bg-primary text-white' },
  hidden: { text: 'Sakrivena', className: 'bg-gray-200 text-text/70' },
};

const fmt = new Intl.DateTimeFormat('sr-Latn', { dateStyle: 'medium', timeStyle: 'short' });

export default function ReviewRow({ review }: { review: AdminReview }) {
  const [status, setStatus] = useState(review.status);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const change = (next: 'approved' | 'hidden') =>
    startTransition(async () => {
      setError('');
      const result = await setReviewStatus(review.id, next);
      if (result.ok) setStatus(next);
      else setError(result.error);
    });

  const remove = () => {
    if (!confirm(`Obrisati ocenu od ${review.guest_name ?? 'gosta'}? Ovo se ne može poništiti.`)) return;
    startTransition(async () => {
      const result = await deleteReview(review.id);
      if (result.ok) setGone(true);
      else setError(result.error);
    });
  };

  if (gone) return null;
  const label = labels[status];
  const button = 'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50';

  return (
    <li className={`space-y-3 p-5 ${status === 'submitted' ? 'bg-accent/5' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-primary">
            {review.house_name}
            {review.house_slug && (
              <a href={`/sr/kuce/${review.house_slug}#ocene`} target="_blank" className="text-text/50 hover:text-primary" aria-label="Otvorite kuću na sajtu">
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </p>
          <p className="text-sm text-text/60">
            {review.guest_name ?? 'Gost'} · {fmt.format(new Date(review.submitted_at))}
            {review.locale === 'en' ? ' · na engleskom' : ''}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${label.className}`}>{label.text}</span>
      </div>
      <p className="flex gap-0.5" aria-label={`${review.rating} od 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`size-5 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-text/25'}`} aria-hidden />
        ))}
      </p>
      {review.comment ? (
        <p className="whitespace-pre-line rounded-lg bg-background p-3 text-sm text-text/85">{review.comment}</p>
      ) : (
        <p className="text-sm text-text/60">Bez komentara, samo zvezdice.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {status !== 'approved' && (
          <button type="button" onClick={() => change('approved')} disabled={pending} className={`${button} border-primary bg-primary text-white`}>
            <Eye className="size-4" aria-hidden /> Objavite
          </button>
        )}
        {status !== 'hidden' && (
          <button type="button" onClick={() => change('hidden')} disabled={pending} className={`${button} border-primary/20 text-primary`}>
            <EyeOff className="size-4" aria-hidden /> Sakrijte
          </button>
        )}
        <button type="button" onClick={remove} disabled={pending} className={`${button} border-transparent text-accent-dark hover:bg-accent/10`}>
          <Trash2 className="size-4" aria-hidden /> Obrišite
        </button>
      </div>
      {error && <p className="text-sm text-accent-dark">{error}</p>}
    </li>
  );
}
