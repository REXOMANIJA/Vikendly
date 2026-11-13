'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { LayoutGrid, Loader2, Map as MapIcon } from 'lucide-react';
import type { MapPoint } from '@/lib/search';

// The map library is only downloaded when someone opens the map
const ResultsMap = dynamic(() => import('@/components/search/ResultsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[65vh] min-h-80 items-center justify-center rounded-2xl bg-white ring-1 ring-primary/10 md:h-[70vh]">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
    </div>
  ),
});

/**
 * "Lista / Mapa" switch above the search results. The list (house cards) is rendered on the
 * server and passed in; the map shows the same houses as price pins.
 */
export default function ResultsView({
  children,
  points,
  hiddenCount,
  openLabel,
  noPinText,
}: {
  children: ReactNode;
  points: MapPoint[];
  /** Results without coordinates (not on the map) */
  hiddenCount: number;
  openLabel: string;
  noPinText: string;
}) {
  const t = useTranslations('search.filters');
  const [view, setView] = useState<'list' | 'map'>('list');
  const button = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
      active ? 'bg-primary text-white' : 'text-primary hover:bg-primary/8'
    }`;

  return (
    <>
      {points.length > 0 && (
        <div className="-mt-4 mb-5 flex justify-end">
          <div role="group" aria-label={t('viewLabel')} className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-primary/10">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={button(view === 'list')}>
              <LayoutGrid className="size-4" aria-hidden />
              {t('viewList')}
            </button>
            <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')} className={button(view === 'map')}>
              <MapIcon className="size-4" aria-hidden />
              {t('viewMap')}
            </button>
          </div>
        </div>
      )}
      {view === 'map' && points.length > 0 ? (
        <>
          <ResultsMap points={points} openLabel={openLabel} />
          {hiddenCount > 0 && <p className="mt-3 text-sm text-text/60">{noPinText}</p>}
        </>
      ) : (
        children
      )}
    </>
  );
}
