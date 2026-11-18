/**
 * How complete a house listing is (admin → Kuće and Pregled). The same things also move a house
 * up in the "Preporučeno" order on the site (lib/ranking.ts), so filling them in pays off twice.
 */

export type HouseHealthInput = {
  photos: number;
  description_sr: string | null;
  description_en: string | null;
  lat: number | null;
  nearby_sr: string | null;
  rules_sr: string | null;
  owner_phone: string | null;
};

export type HouseHealth = {
  /** 0–100 */
  percent: number;
  /** What is still missing, in plain Serbian, most important first */
  missing: string[];
};

const CHECKS: { ok: (h: HouseHealthInput) => boolean; missing: string }[] = [
  { ok: (h) => !!h.owner_phone?.trim(), missing: 'telefon vlasnika' },
  { ok: (h) => h.photos >= 10, missing: 'bar 10 fotografija' },
  { ok: (h) => (h.description_sr?.trim().length ?? 0) >= 400, missing: 'duži opis (400+ znakova)' },
  { ok: (h) => (h.description_en?.trim().length ?? 0) > 0, missing: 'opis na engleskom' },
  { ok: (h) => h.lat != null, missing: 'lokacija na mapi' },
  { ok: (h) => !!h.nearby_sr?.trim(), missing: 'udaljenosti i okolina' },
  { ok: (h) => !!h.rules_sr?.trim(), missing: 'pravila kuće' },
];

export function houseHealth(h: HouseHealthInput): HouseHealth {
  const missing = CHECKS.filter((c) => !c.ok(h)).map((c) => c.missing);
  return { percent: Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100), missing };
}
