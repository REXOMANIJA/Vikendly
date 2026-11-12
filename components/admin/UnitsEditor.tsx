'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import PartyPricesEditor, { type PartyPriceRow } from './PartyPricesEditor';
import GroupPricesEditor, { type GroupPriceRow } from './GroupPricesEditor';

/** One unit as edited in the form (numbers kept as text while typing) */
export type UnitFormRow = {
  key: string;
  /** Existing unit id (kept so old booking requests still point to it) */
  id?: string;
  name: string;
  capacity: string;
  day_capacity: string;
  weekday_price: string;
  weekend_price: string;
  parties_allowed: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  check_in_time: string;
  check_out_time: string;
  party_prices: PartyPriceRow[];
  /** Cheaper prices for smaller groups */
  price_tiers: GroupPriceRow[];
  /** Rented only for parties: no beds, priced by number of people (party_prices) */
  party_only: boolean;
};

export const emptyUnit = (): UnitFormRow => ({
  key: crypto.randomUUID(),
  name: '',
  capacity: '',
  day_capacity: '',
  weekday_price: '',
  weekend_price: '',
  parties_allowed: false,
  pets_allowed: false,
  smoking_allowed: false,
  check_in_time: '15:00',
  check_out_time: '11:00',
  party_prices: [],
  price_tiers: [],
  party_only: false,
});

const input =
  'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';
const label = 'mb-1.5 block text-sm font-medium';

/**
 * "Delovi objekta": a listing rented in separate parts (e.g. Kuća, Kuća sa balkonom, Apartman).
 * Each unit has its own name, beds, prices, house rules and party limit/prices; photos,
 * description and location stay shared. Guests can request one or more units together.
 */
export default function UnitsEditor({ units, onChange }: { units: UnitFormRow[]; onChange: (units: UnitFormRow[]) => void }) {
  const update = (i: number, changes: Partial<UnitFormRow>) => onChange(units.map((u, j) => (j === i ? { ...u, ...changes } : u)));
  const move = (i: number, by: -1 | 1) => {
    const target = i + by;
    if (target < 0 || target >= units.length) return;
    const next = [...units];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {units.map((u, i) => {
        const id = (field: string) => `unit-${u.key}-${field}`;
        return (
          <div key={u.key} className="space-y-4 rounded-xl border border-primary/15 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-primary">
                Jedinica {i + 1}
                {u.name && <span className="font-normal text-text/60"> · {u.name}</span>}
              </h3>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Pomerite gore"
                  className="rounded-lg p-2 text-text/60 hover:bg-background disabled:opacity-30">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === units.length - 1} aria-label="Pomerite dole"
                  className="rounded-lg p-2 text-text/60 hover:bg-background disabled:opacity-30">
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => confirm(`Ukloniti jedinicu „${u.name || i + 1}“?`) && onChange(units.filter((_, j) => j !== i))}
                  aria-label="Uklonite jedinicu"
                  className="rounded-lg p-2 text-accent-dark hover:bg-accent/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div role="radiogroup" aria-label="Vrsta jedinice" className="grid gap-2 sm:grid-cols-2">
              {([
                [false, 'Sa noćenjem', 'Gosti spavaju ovde; cena po noći.'],
                [true, 'Samo za žurke (bez noćenja)', 'Npr. letnjikovac; cena po broju ljudi na žurci.'],
              ] as const).map(([value, title, hint]) => (
                <label
                  key={title}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${u.party_only === value ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <input
                    type="radio"
                    name={id('type')}
                    className="mt-1 size-4 accent-primary"
                    checked={u.party_only === value}
                    onChange={() => update(i, { party_only: value, parties_allowed: value ? true : u.parties_allowed })}
                  />
                  <span>
                    <span className="block font-medium">{title}</span>
                    <span className="block text-xs text-text/60">{hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label htmlFor={id('name')} className={label}>Naziv</label>
              <input id={id('name')} className={input} maxLength={80}
                placeholder={u.party_only ? 'npr. Letnjikovac' : 'npr. Kuća sa balkonom'} value={u.name}
                onChange={(e) => update(i, { name: e.target.value })} required />
            </div>

            {u.party_only ? (
              <>
                <div className="max-w-xs">
                  <label htmlFor={id('day')} className={label}>Najviše osoba na žurci</label>
                  <input id={id('day')} className={input} inputMode="numeric" value={u.day_capacity}
                    onChange={(e) => update(i, { day_capacity: e.target.value.replace(/\D/g, '') })} required />
                </div>
                <PartyPricesEditor
                  idPrefix={`unit-${u.key}`}
                  rows={u.party_prices}
                  onChange={(party_prices) => update(i, { party_prices })}
                  limit={Number(u.day_capacity) || undefined}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    ['pets_allowed', 'Ljubimci su dozvoljeni'],
                    ['smoking_allowed', 'Pušenje je dozvoljeno'],
                  ] as const).map(([key, text]) => (
                    <label key={key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                      <input type="checkbox" className="size-5 accent-primary" checked={u[key]}
                        onChange={(e) => update(i, { [key]: e.target.checked })} />
                      {text}
                    </label>
                  ))}
                </div>
              </>
            ) : (
            <>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor={id('capacity')} className={label}>Broj osoba za noćenje</label>
                <input id={id('capacity')} className={input} inputMode="numeric" value={u.capacity}
                  onChange={(e) => update(i, { capacity: e.target.value.replace(/\D/g, '') })} required />
              </div>
              <div>
                <label htmlFor={id('weekday')} className={label}>Radnim danima (€/noć)</label>
                <input id={id('weekday')} className={input} inputMode="decimal" value={u.weekday_price}
                  onChange={(e) => update(i, { weekday_price: e.target.value })} required />
              </div>
              <div>
                <label htmlFor={id('weekend')} className={label}>Petak i subota (€/noć)</label>
                <input id={id('weekend')} className={input} inputMode="decimal" value={u.weekend_price}
                  onChange={(e) => update(i, { weekend_price: e.target.value })} required />
              </div>
            </div>

            <GroupPricesEditor
              idPrefix={`unit-${u.key}`}
              rows={u.price_tiers}
              onChange={(price_tiers) => update(i, { price_tiers })}
              capacity={Number(u.capacity) || undefined}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ['parties_allowed', 'Žurke su dozvoljene'],
                ['pets_allowed', 'Ljubimci su dozvoljeni'],
                ['smoking_allowed', 'Pušenje je dozvoljeno'],
              ] as const).map(([key, text]) => (
                <label key={key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                  <input type="checkbox" className="size-5 accent-primary" checked={u[key]}
                    onChange={(e) => update(i, { [key]: e.target.checked })} />
                  {text}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <label htmlFor={id('in')} className={label}>Dolazak od</label>
                <input id={id('in')} type="time" className={input} value={u.check_in_time}
                  onChange={(e) => update(i, { check_in_time: e.target.value })} required />
              </div>
              <div>
                <label htmlFor={id('out')} className={label}>Odlazak do</label>
                <input id={id('out')} type="time" className={input} value={u.check_out_time}
                  onChange={(e) => update(i, { check_out_time: e.target.value })} required />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label htmlFor={id('day')} className={label}>Tokom dana najviše osoba</label>
                <input id={id('day')} className={input} inputMode="numeric" placeholder="—" value={u.day_capacity}
                  onChange={(e) => update(i, { day_capacity: e.target.value.replace(/\D/g, '') })} />
                <p className="mt-1 text-xs text-text/60">Opciono, npr. 15 kada spava 6. Prazno = koliko i za noćenje.</p>
              </div>
            </div>
            </>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...units, emptyUnit()])}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
      >
        <Plus className="size-4" aria-hidden /> Dodajte jedinicu
      </button>
    </div>
  );
}
