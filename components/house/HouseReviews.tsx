import { getTranslations } from 'next-intl/server';
import { Quote } from 'lucide-react';
import Stars from '@/components/Stars';
import { intlLocale, parseDateParam } from '@/lib/dates';
import type { RatingSummary, Review } from '@/types';

/**
 * Approved guest reviews on the house page. Only guests with a confirmed stay get a review
 * link, and the team approves every review before it shows here.
 */
export default async function HouseReviews({
  reviews,
  summary,
  locale,
}: {
  reviews: Review[];
  summary: RatingSummary;
  locale: string;
}) {
  const t = await getTranslations('house.reviews');
  const average = summary.average.toLocaleString(locale === 'en' ? 'en' : 'sr-Latn', { minimumFractionDigits: 1 });

  return (
    <section id="ocene" className="scroll-mt-32">
      <h2 className="font-serif text-2xl font-bold text-primary">{t('title')}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="font-serif text-4xl font-bold text-primary">{average}</span>
        <div>
          <Stars value={summary.average} className="size-5" label={t('starsLabel', { average })} />
          <p className="text-sm text-text/70">{t('count', { count: summary.count })} · {t('verifiedOnly')}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-4">
        {reviews.slice(0, 20).map((r) => {
          const date = parseDateParam(r.date);
          return (
            <li key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-primary/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-primary">{r.guestName}</p>
                <Stars value={r.rating} label={t('starsLabel', { average: r.rating })} />
              </div>
              {date && <p className="text-xs text-text/60">{new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(date)}</p>}
              {r.comment && (
                <p className="mt-3 flex gap-2 leading-relaxed text-text/85">
                  <Quote className="mt-1 size-4 shrink-0 text-accent-dark" aria-hidden />
                  <span className="whitespace-pre-line">{r.comment}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
