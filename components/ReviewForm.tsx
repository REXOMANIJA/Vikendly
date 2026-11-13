'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CircleCheck, Loader2, Send, Star } from 'lucide-react';
import { submitReview, type ReviewResult } from '@/lib/actions';

const fieldClass =
  'w-full px-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

/** Stars + short comment from a guest's private review link */
export default function ReviewForm({ token, initialName }: { token: string; initialName: string }) {
  const t = useTranslations('review');
  const locale = useLocale();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(initialName);
  const [comment, setComment] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (result?.ok) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-primary/10" role="status">
        <CircleCheck className="mx-auto size-10 text-primary" aria-hidden />
        <p className="mt-3 font-serif text-xl font-bold text-primary">{t('thanksTitle')}</p>
        <p className="mt-1 text-text/75">{t('thanksText')}</p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    startTransition(async () => {
      try {
        setResult(await submitReview({ token, rating, comment, name, locale: locale === 'en' ? 'en' : 'sr' }));
      } catch {
        setResult({ ok: false, error: 'server' });
      }
    });
  };

  const shown = hover || rating;

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary/10">
      <fieldset>
        <legend className="mb-2 font-semibold text-primary">{t('ratingLabel')}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <label key={i} className="cursor-pointer" onMouseEnter={() => setHover(i)}>
              <input
                type="radio"
                name="rating"
                value={i}
                checked={rating === i}
                onChange={() => setRating(i)}
                className="peer sr-only"
                required
              />
              <span className="sr-only">{t('stars', { count: i })}</span>
              <Star
                aria-hidden
                className={`size-10 rounded transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-accent-dark ${
                  i <= shown ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-text/30'
                }`}
              />
            </label>
          ))}
        </div>
        {shown > 0 && <p className="mt-1 text-sm text-text/70">{t(`ratingWords.${shown}` as 'ratingWords.5')}</p>}
      </fieldset>

      <div>
        <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium">
          {t('commentLabel')} <span className="font-normal text-text/60">({t('optional')})</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          maxLength={1500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          className={`${fieldClass} py-2`}
        />
      </div>

      <div>
        <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium">{t('nameLabel')}</label>
        <input
          id="review-name"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
          className={`${fieldClass} h-11`}
        />
        <p className="mt-1 text-xs text-text/60">{t('nameHint')}</p>
      </div>

      {result && !result.ok && <p className="text-sm text-accent-dark">{t(`errors.${result.error}`)}</p>}

      <button
        type="submit"
        disabled={!rating || pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-dark py-3 font-medium text-white transition-colors hover:bg-primary disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {t('submit')}
      </button>
      <p className="text-center text-xs text-text/60">{t('moderationNote')}</p>
    </form>
  );
}
