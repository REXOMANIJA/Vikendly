import { useTranslations } from 'next-intl';
import { BedDouble, Clock, PartyPopper, PawPrint, Ban, Users } from 'lucide-react';
import type { HouseUnit } from '@/types';

const eur = (n: number) => `€${Math.round(n * 100) / 100}`;

/**
 * "Delovi objekta" on the house page: one card per separately rented unit, with its beds,
 * nightly prices, party limit and price, and house rules. Booking happens in the box beside it.
 */
export default function HouseUnits({ units }: { units: HouseUnit[] }) {
  const t = useTranslations('house.units');
  const tc = useTranslations('house.calculator');

  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-primary">{t('title')}</h2>
      <p className="mt-2 text-text/75">{t('intro')}</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {units.map((u) => {
          const partyMax = Math.max(u.dayCapacity ?? u.capacity, u.capacity);
          if (u.partyOnly) {
            // Party-only space: no beds, priced by the number of people
            const limit = u.dayCapacity ?? Math.max(0, ...u.partyPrices.map((p) => p.maxGuests));
            return (
              <li key={u.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-accent/30">
                <h3 className="font-serif text-xl font-bold text-primary">{u.name}</h3>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark">
                  <PartyPopper className="size-4" aria-hidden /> {t('partyOnly')}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-text/85">
                  <li className="flex items-center gap-2">
                    <Users className="size-4 shrink-0 text-primary" aria-hidden />
                    {t('partyUpTo', { count: limit })}
                  </li>
                  {u.rules.petsAllowed && (
                    <li className="flex items-center gap-2">
                      <PawPrint className="size-4 shrink-0 text-primary" aria-hidden />
                      {t('pets')}
                    </li>
                  )}
                </ul>
                {u.partyPrices.length > 0 ? (
                  <div className="mt-4 rounded-xl bg-background p-3 text-sm">
                    <p className="text-xs font-medium text-text/70">{tc('partyLevels')}</p>
                    <ul className="mt-1 space-y-0.5">
                      {u.partyPrices.map((p) => (
                        <li key={p.maxGuests} className="flex justify-between gap-3">
                          <span className="text-text/80">{tc('partyLevel', { count: p.maxGuests })}</span>
                          <span className="font-medium text-primary">
                            {eur(p.weekdayPrice)} / {eur(p.weekendPrice)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-text/70">{tc('partyOnRequest')}</p>
                )}
              </li>
            );
          }
          return (
            <li key={u.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-primary/10">
              <h3 className="font-serif text-xl font-bold text-primary">{u.name}</h3>
              <p className="mt-1">
                <span className="text-lg font-semibold text-primary">
                  {t('perNight', { weekday: eur(u.weekdayPrice), weekend: eur(u.weekendPrice) })}
                </span>
                <span className="block text-xs text-text/60">{t('perNightHint')}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-text/85">
                <li className="flex items-center gap-2">
                  <BedDouble className="size-4 shrink-0 text-primary" aria-hidden />
                  {t('sleeps', { count: u.capacity })}
                </li>
                {partyMax > u.capacity && (
                  <li className="flex items-center gap-2">
                    <Users className="size-4 shrink-0 text-primary" aria-hidden />
                    {t('dayGuests', { count: partyMax })}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  {u.rules.partiesAllowed ? (
                    <PartyPopper className="size-4 shrink-0 text-accent-dark" aria-hidden />
                  ) : (
                    <Ban className="size-4 shrink-0 text-text/50" aria-hidden />
                  )}
                  {u.rules.partiesAllowed ? t('partiesOk') : t('noParties')}
                </li>
                {u.rules.petsAllowed && (
                  <li className="flex items-center gap-2">
                    <PawPrint className="size-4 shrink-0 text-primary" aria-hidden />
                    {t('pets')}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-primary" aria-hidden />
                  {t('checkInOut', { in: u.rules.checkInTime, out: u.rules.checkOutTime })}
                </li>
              </ul>
              {(u.tiers ?? []).length > 0 && (
                <div className="mt-4 rounded-xl bg-background p-3 text-sm">
                  <p className="text-xs font-medium text-text/70">{t('groupPrices')}</p>
                  <ul className="mt-1 space-y-0.5">
                    {u.tiers!.map((tier) => (
                      <li key={tier.maxGuests} className="flex justify-between gap-3">
                        <span className="text-text/80">{tc('tierRow', { count: tier.maxGuests })}</span>
                        <span className="font-medium text-primary">
                          {eur(tier.weekdayPrice)} / {eur(tier.weekendPrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
