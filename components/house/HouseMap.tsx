import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { mapDirectionsUrl, mapEmbedUrl, mapOpenUrl } from '@/lib/maps';

/**
 * Google map with a pin on the house, plus "open in Google Maps" and "directions" buttons.
 * Uses exact coordinates when the admin set them, otherwise the address (which is never shown as text).
 */
export default function HouseMap({
  name,
  address,
  lat,
  lng,
  placeLabel,
}: {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  /** e.g. "Zlatibor, Srbija" */
  placeLabel?: string;
}) {
  const t = useTranslations('house.map');
  const locale = useLocale();
  const place = { lat, lng, address };
  const exact = lat != null && lng != null;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-background sm:aspect-[16/9]">
        <iframe
          src={mapEmbedUrl(place, locale, exact ? 14 : 12)}
          title={t('iframeTitle', { name })}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          // Searching by address, Google adds a box at the top with "Отвори у Мапама" in Cyrillic
          // (Google has no Latin Serbian for it). It's pushed out of view: our own "Google mape"
          // button below does the same. Exact coordinates show no such box.
          className={`absolute inset-x-0 w-full border-0 ${exact ? 'inset-y-0 h-full' : '-top-18 h-[calc(100%+4.5rem)]'}`}
        />
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
            <MapPin className="size-5" aria-hidden />
          </span>
          <div>
            {/* The address itself is not shown (only used to place the pin when there are no
                coordinates); guests see the area, the team gives the exact address after booking */}
            {placeLabel && <p className="font-medium text-text">{placeLabel}</p>}
            {!exact && <p className="mt-1 text-xs text-text/60">{t('approximate')}</p>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={mapDirectionsUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark sm:flex-none"
          >
            <Navigation className="size-4" aria-hidden /> {t('directions')}
          </a>
          <a
            href={mapOpenUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 sm:flex-none"
          >
            <ExternalLink className="size-4" aria-hidden /> {t('open')}
          </a>
        </div>
      </div>
    </div>
  );
}
