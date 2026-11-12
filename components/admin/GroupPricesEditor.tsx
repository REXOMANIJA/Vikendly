'use client';

import { Plus, X } from 'lucide-react';

export type GroupPriceRow = { key: string; max_guests: string; weekday_price: string; weekend_price: string };

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';

/**
 * Cheaper nightly prices for smaller groups in a unit: "do 2 osobe: €50 / €60".
 * The site picks the smallest group the guests fit in; a full unit pays the unit price.
 */
export default function GroupPricesEditor({
  rows,
  onChange,
  idPrefix,
  capacity,
}: {
  rows: GroupPriceRow[];
  onChange: (rows: GroupPriceRow[]) => void;
  idPrefix: string;
  /** Beds in the unit; groups must be smaller than this */
  capacity?: number;
}) {
  const field = (i: number, key: 'max_guests' | 'weekday_price' | 'weekend_price', value: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <div className="space-y-3 rounded-xl bg-background p-4">
      <div>
        <h3 className="font-semibold text-primary">
          Cene za manje grupe <span className="font-normal text-text/60">(opciono)</span>
        </h3>
        <p className="text-sm text-text/70">
          Npr. „do 2 osobe: €50 / €60“. Za grupu koja popuni jedinicu
          {capacity ? ` (${capacity} osoba)` : ''} važi cena jedinice iznad.
        </p>
      </div>
      {rows.map((row, i) => (
        <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
          {([
            ['max_guests', 'Do koliko osoba', 'numeric'],
            ['weekday_price', 'Radnim danima €', 'decimal'],
            ['weekend_price', 'Pet. i sub. €', 'decimal'],
          ] as const).map(([key, text, mode]) => (
            <div key={key}>
              <label htmlFor={`${idPrefix}-tier-${row.key}-${key}`} className="mb-1 block text-xs font-medium">
                {text}
              </label>
              <input
                id={`${idPrefix}-tier-${row.key}-${key}`}
                className={input}
                inputMode={mode}
                value={row[key]}
                onChange={(e) => field(i, key, key === 'max_guests' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="mb-1 rounded-lg p-2.5 text-accent-dark hover:bg-accent/10"
            aria-label="Uklonite ovu cenu"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { key: crypto.randomUUID(), max_guests: '', weekday_price: '', weekend_price: '' }])}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
      >
        <Plus className="size-4" aria-hidden /> Dodajte cenu za manju grupu
      </button>
    </div>
  );
}
