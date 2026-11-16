'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, Loader2, MessageCircle, Star } from 'lucide-react';
import { createReviewInvite } from '@/app/admin/actions';
import type { BookingReview } from '@/lib/admin-data';
import { whatsappUrl } from '@/lib/phone';
import { site } from '@/lib/site';

const statusText: Record<BookingReview['status'], string> = {
  invited: 'Link napravljen, gost još nije ocenio',
  submitted: 'Gost je ocenio – čeka odobrenje (Ocene)',
  approved: 'Ocena je objavljena na sajtu',
  hidden: 'Ocena je sakrivena',
};

/**
 * Admin, confirmed booking: make the guest's private review link and send it over WhatsApp
 * (or copy it for Viber/SMS). Only guests with a confirmed stay ever get such a link.
 */
export default function ReviewInvite({
  bookingId,
  guestName,
  guestPhone,
  houseName,
  locale,
  initial,
}: {
  bookingId: string;
  guestName: string;
  guestPhone: string;
  houseName: string;
  locale: string;
  initial: BookingReview | null;
}) {
  const [review, setReview] = useState<Pick<BookingReview, 'token' | 'status'> & { rating?: number | null } | null>(initial);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const link = review
    ? `${site.url}${locale === 'en' ? `/en/review/${review.token}` : `/ocena/${review.token}`}`
    : '';
  const firstName = guestName.trim().split(/\s+/)[0];
  const message =
    locale === 'en'
      ? `Hi ${firstName}, thank you for staying at ${houseName} with Vikendly! We'd love a short review: ${link}`
      : `Zdravo ${firstName}, hvala što ste boravili u kući ${houseName} preko Vikendly-ja! Biće nam drago ako ostavite kratak utisak: ${link}`;
  const wa = whatsappUrl(guestPhone);

  const create = () => {
    setError('');
    startTransition(async () => {
      const result = await createReviewInvite(bookingId);
      if (result.ok && result.data) setReview(result.data);
      else if (!result.ok) setError(result.error);
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Kopirajte poruku:', message);
    }
  };

  const chip =
    'inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5';

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm">
      <p className="flex items-center gap-1.5 font-medium text-primary">
        <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden /> Ocena gosta
        {review && <span className="font-normal text-text/70">· {statusText[review.status]}{review.rating ? ` (${review.rating}★)` : ''}</span>}
      </p>
      {!review ? (
        <>
          <p className="mt-1 text-text/70">Posle boravka pošaljite gostu link da oceni kuću. Ocena se objavljuje tek kada je odobrite.</p>
          <button type="button" onClick={create} disabled={pending} className={`${chip} mt-2`}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Star className="size-4" aria-hidden />}
            Napravite link za ocenu
          </button>
        </>
      ) : (
        review.status === 'invited' && (
          <div className="mt-2 flex flex-wrap gap-2">
            {wa && (
              <a href={`${wa}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={chip}>
                <MessageCircle className="size-4" aria-hidden /> Pošaljite na WhatsApp
              </a>
            )}
            <button type="button" onClick={copy} className={chip}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? 'Kopirano' : 'Kopirajte poruku (Viber, SMS)'}
            </button>
          </div>
        )
      )}
      {error && <p className="mt-2 text-accent-dark">{error}</p>}
    </div>
  );
}
