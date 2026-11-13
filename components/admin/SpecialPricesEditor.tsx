'use client';

import { Plus, Trash2 } from 'lucide-react';

/** One holiday price in the form: dates, optional label and minimum stay, and a price per place */
export type SpecialRow = {
  key: string;
  label: string;
  /** "yyyy-MM-dd": first and last night at this price */
  first_night: string;
  last_night: string;
  /** '' = the house's normal minimum stay */
  min_nights: string;
  /** Price per night by unit key, or by WHOLE for a house rented as one; '' = normal price */
  prices: Record<string, string>;
};

export const WHOLE = 'whole';

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';
const label = 'mb-1.5 block text-sm font-medium';

/** Ready-made holidays, so the team only fills in the price */
function presets(): { label: string; first: string; last: string }[] {
  const now = new Date();
  // Until 14 January the current holiday season is still on; after that, suggest next season's
  const year = now.getMonth() === 0 && now.getDate() <= 14 ? now.getFullYear() - 1 : now.getFullYear();
  return [
    { label: 'Nova godina', first: `${year}-12-31`, last: `${year + 1}-01-01` },
    { label: 'Božić', first: `${year + 1}-01-06`, last: `${year + 1}-01-07` },
    { label: 'Srpska Nova godina', first: `${year + 1}-01-13`, last: `${year + 1}-01-14` },
  ];
}

/**
 * "Posebne cene" in the house form: a price per night for chosen nights (Nova godina, Srpska
 * Nova godina, Uskrs…). For a house split into units, each place with beds gets its own price;
 * an empty price keeps that place's normal price.
 */
export default function SpecialPricesEditor({
  rows,
  places,
  onChange,
}: {
  rows: SpecialRow[];
  /**
   * Places with beds (units, or one WHOLE entry for a house rented as one), and party sizes of
   * party-only spaces (`party`: the price is for the whole party that day)
   */
  places: { key: string; name: string; party?: boolean }[];
  onChange: (rows: SpecialRow[]) => void;
}) {
  const update = (key: string, changes: Partial<SpecialRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...changes } : r)));
  const add = (preset?: { label: string; first: string; last: string }) =>
    onChange([
      ...rows,
      {
        key: crypto.randomUUID(),
        label: preset?.label ?? '',
        first_night: preset?.first ?? '',
        last_night: preset?.last ?? '',
        min_nights: '',
        prices: {},
      },
    ]);

  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="text-sm text-text/60">Nema posebnih cena. Važe obične cene.</p>}
      {rows.map((r) => (
        <div key={r.key} className="space-y-3 rounded-xl bg-background p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor={`sp-label-${r.key}`} className={label}>Naziv</label>
              <input id={`sp-label-${r.key}`} className={input} maxLength={60} placeholder="Nova godina" value={r.label}
                onChange={(e) => update(r.key, { label: e.target.value })} />
            </div>
            <div>
              <label htmlFor={`sp-first-${r.key}`} className={label}>Prva noć</label>
              <input id={`sp-first-${r.key}`} type="date" className={input} value={r.first_night} required
                onChange={(e) => update(r.key, { first_night: e.target.value, last_night: r.last_night || e.target.value })} />
            </div>
            <div>
              <label htmlFor={`sp-last-${r.key}`} className={label}>Poslednja noć</label>
              <input id={`sp-last-${r.key}`} type="date" className={input} value={r.last_night} min={r.first_night} required
                onChange={(e) => update(r.key, { last_night: e.target.value })} />
            </div>
            <div>
              <label htmlFor={`sp-min-${r.key}`} className={label}>
                Najkraći boravak <span className="font-normal text-text/60">(opciono)</span>
              </label>
              <input id={`sp-min-${r.key}`} type="number" min={1} max={30} inputMode="numeric" className={input}
                placeholder="npr. 3" value={r.min_nights} onChange={(e) => update(r.key, { min_nights: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {places.map((p) => (
              <div key={p.key}>
                <label htmlFor={`sp-price-${r.key}-${p.key}`} className={label}>
                  {p.key === WHOLE ? 'Cena po noći (€)' : p.party ? `${p.name}: cena žurke (€)` : `${p.name}: cena po noći (€)`}
                </label>
                <input id={`sp-price-${r.key}-${p.key}`} type="number" min={0} step="1" inputMode="decimal" className={input}
                  placeholder={p.key === WHOLE ? '' : 'obična cena'}
                  required={p.key === WHOLE}
                  value={r.prices[p.key] ?? ''}
                  onChange={(e) => update(r.key, { prices: { ...r.prices, [p.key]: e.target.value } })} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-text/60">
              Cena važi za noći od prve do poslednje, uključujući obe. Primer: 31.12 – 1.1 su dve noći (dolazak 31.12, odlazak 2.1).
              Cena žurke važi za žurku bilo kog dana od prvog do poslednjeg; najkraći boravak se na žurke ne odnosi.
            </p>
            <button type="button" onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark hover:underline">
              <Trash2 className="size-4" aria-hidden /> Uklonite
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {presets().map((p) => (
          <button key={p.label} type="button" onClick={() => add(p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white px-3.5 py-1.5 text-sm font-medium text-primary hover:border-primary">
            <Plus className="size-4" aria-hidden /> {p.label}
          </button>
        ))}
        <button type="button" onClick={() => add()}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white px-3.5 py-1.5 text-sm font-medium text-primary hover:border-primary">
          <Plus className="size-4" aria-hidden /> Drugi datumi
        </button>
      </div>
    </div>
  );
}
