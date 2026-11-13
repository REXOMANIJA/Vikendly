'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useFavorites } from '@/lib/favorites';

/**
 * Shows only the cards of houses saved in this browser. The server renders a card for every
 * published house (a curated, small list); this keeps the saved ones, newest saved first.
 */
export default function SavedHouses({ cards }: { cards: { slug: string; card: React.ReactNode }[] }) {
  const t = useTranslations('favorites');
  const { list } = useFavorites();
  // Saved houses only exist in the browser: wait for it before saying "nothing saved"
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const saved = list.map((slug) => cards.find((c) => c.slug === slug)).filter((c): c is (typeof cards)[number] => !!c);

  if (!ready) return <div className="min-h-64" aria-busy />;

  if (saved.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-primary/10">
        <Heart className="mx-auto size-10 text-accent-dark" aria-hidden />
        <p className="mt-3 font-serif text-xl font-bold text-primary">{t('emptyTitle')}</p>
        <p className="mx-auto mt-1 max-w-md text-text/75">{t('emptyText')}</p>
        <Link
          href="/search"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-white hover:bg-accent-dark"
        >
          <Search className="size-4" aria-hidden /> {t('browse')}
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-text/70">{t('count', { count: saved.length })}</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((c) => (
          <div key={c.slug}>{c.card}</div>
        ))}
      </div>
    </>
  );
}
