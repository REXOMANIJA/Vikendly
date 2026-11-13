'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCw, TriangleAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { reportClientError } from '@/lib/actions';

/**
 * Shown instead of a page that crashed (for example if the database can't be reached).
 * Header and footer stay, so visitors are never stuck on a blank or technical screen.
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations('errorPage');

  useEffect(() => {
    console.error(error);
    // Errors with a digest came from the server and were already reported (instrumentation.ts)
    if (!error.digest) {
      reportClientError({ message: error.message || String(error), path: window.location.pathname }).catch(() => {});
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark">
          <TriangleAlert className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-primary md:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-lg leading-relaxed text-text/75">{t('text')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            <RotateCw className="size-4" aria-hidden />
            {t('retry')}
          </button>
          <Link
            href="/"
            className="rounded-full bg-white px-6 py-3 font-semibold text-primary ring-1 ring-primary/15 transition-colors hover:bg-primary hover:text-white"
          >
            {t('home')}
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-text/40">#{error.digest}</p>}
      </div>
    </div>
  );
}
