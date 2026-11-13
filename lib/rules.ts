import type { House, HouseRules } from '@/types';
import { hasUnits } from '@/lib/pricing';

/** Allowed everywhere, nowhere, or only in some units (listed by name) */
export type RuleAnswer = { state: 'yes' | 'no' | 'some'; units: string[] };

export type RuleSummary = {
  /** Arrival / departure times: one line when they are the same everywhere, else one per unit */
  times: { unit?: string; checkIn: string; checkOut: string }[];
  parties: RuleAnswer;
  pets: RuleAnswer;
  smoking: RuleAnswer;
};

/**
 * "Pravila kuće" for the whole listing. A listing with units has rules per unit, so they are
 * combined: "da" when every unit allows it, "ne" when none does, otherwise the units that do.
 * A party-only space always counts as allowing parties.
 */
export function summarizeRules(house: House): RuleSummary {
  if (!hasUnits(house)) {
    const r = house.rules;
    const yesNo = (ok: boolean): RuleAnswer => ({ state: ok ? 'yes' : 'no', units: [] });
    return {
      times: [{ checkIn: r.checkInTime, checkOut: r.checkOutTime }],
      parties: yesNo(r.partiesAllowed),
      pets: yesNo(r.petsAllowed),
      smoking: yesNo(r.smokingAllowed),
    };
  }

  const units = house.units!;
  const answer = (allows: (rules: HouseRules, partyOnly: boolean) => boolean): RuleAnswer => {
    const yes = units.filter((u) => allows(u.rules, u.partyOnly === true)).map((u) => u.name);
    return { state: yes.length === units.length ? 'yes' : yes.length === 0 ? 'no' : 'some', units: yes };
  };

  // Times only matter where people sleep
  const withBeds = units.filter((u) => !u.partyOnly);
  const sameTimes = withBeds.every(
    (u) => u.rules.checkInTime === withBeds[0].rules.checkInTime && u.rules.checkOutTime === withBeds[0].rules.checkOutTime
  );
  const times =
    withBeds.length === 0
      ? []
      : sameTimes
        ? [{ checkIn: withBeds[0].rules.checkInTime, checkOut: withBeds[0].rules.checkOutTime }]
        : withBeds.map((u) => ({ unit: u.name, checkIn: u.rules.checkInTime, checkOut: u.rules.checkOutTime }));

  return {
    times,
    parties: answer((r, partyOnly) => partyOnly || r.partiesAllowed),
    pets: answer((r) => r.petsAllowed),
    smoking: answer((r) => r.smokingAllowed),
  };
}
