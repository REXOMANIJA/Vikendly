'use client';

import { Plus, X } from 'lucide-react';

export type PartyPriceRow = { key: string; max_guests: string; weekday_price: string; weekend_price: string };

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';

/**
 * Party price levels: "do 15 osoba: €80 radnim danima / €100 vikendom". The site picks the
 * smallest level that fits the number of people at the party; charged once per stay. The
 * weekend price applies when the stay includes a Friday or Saturday night.
 */
export default function PartyPricesEditor({
  rows,
  onChange,
  idPrefix,
  limit,
}: {
  rows: PartyPriceRow[];
  onChange: (rows: PartyPriceRow[]) => void;
  idPrefix: string;
  /** Most people allowed at a party, shown as a hint */
  limit?: number;
}) {
  const field = (i: number, key: 'max_guests' | 'weekday_price' | 'weekend_price', value: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <div className="space-y-3 rounded-xl bg-background p-4">
      <div>
        <h3 className="font-semibold text-primary">
          Cena žurke <span className="font-normal text-text/60">(opciono)</span>
        </h3>
        <p className="text-sm text-text/70">
          Naplaćuje se jednom po boravku, pored cene noćenja. Npr. „do 15 osoba: €80 radnim danima, €100 vikendom“.
          Vikend cena važi kada boravak uključuje petak ili subotu.
          {limit ? ` Najviše ${limit} osoba.` : ''} Bez unete cene gost vidi „cena žurke po dogovoru“.
        </p>
      </div>
      {rows.map((row, i) => (
        <div key={row.key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
          {([
            ['max_guests', 'Do koliko osoba ukupno', 'numeric'],
            ['weekday_price', 'Radnim danima €', 'decimal'],
            ['weekend_price', 'Vikendom €', 'decimal'],
          ] as const).map(([key, text, mode]) => (
            <div key={key}>
              <label htmlFor={`${idPrefix}-party-${row.key}-${key}`} className="mb-1 block text-xs font-medium">
                {text}
              </label>
              <input
                id={`${idPrefix}-party-${row.key}-${key}`}
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
            aria-label="Uklonite ovu cenu žurke"
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
        <Plus className="size-4" aria-hidden /> Dodajte cenu žurke
      </button>
    </div>
  );
}
