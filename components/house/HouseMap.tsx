import { useTranslations } from 'next-intl';
import { MapPin, ShieldCheck } from 'lucide-react';
import AreaMapLazy from '@/components/house/AreaMapLazy';

/**
 * "Lokacija" on a house page: our own map with the house pin. Guests never get the written
 * address or a Google Maps link; the team sends the address after confirming a booking.
 */
export default function HouseMap({
  name,
  lat,
  lng,
  placeLabel,
}: {
  name: string;
  lat?: number;
  lng?: number;
  /** e.g. "Zlatibor, Srbija" */
  placeLabel?: string;
}) {
  const t = useTranslations('house.map');
  const hasPin = lat != null && lng != null;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/10">
      {hasPin && (
        <div className="relative aspect-[4/3] overflow-hidden bg-sand sm:aspect-[16/9]">
          <AreaMapLazy lat={lat} lng={lng} label={t('label', { name })} />
        </div>
      )}
      <div className="flex items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
          <MapPin className="size-5" aria-hidden />
        </span>
        <div>
          {placeLabel && <p className="font-medium text-text">{placeLabel}</p>}
          <p className="mt-1 flex items-start gap-1.5 text-sm text-text/70">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {t('addressLater')}
          </p>
        </div>
      </div>
    </div>
  );
}
