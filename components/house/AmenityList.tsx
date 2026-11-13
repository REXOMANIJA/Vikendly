'use client';

import { Children, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Amenities on the house page. Phones show the first few in a compact list with a
 * "Prikaži sve (10)" button; tablets and desktops always show all of them.
 * Texts come from the server as props, so no translations are sent to the browser.
 */
export default function AmenityList({
  children,
  visible = 6,
  moreLabel,
  lessLabel,
}: {
  children: ReactNode;
  visible?: number;
  moreLabel: string;
  lessLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const extra = items.length > visible;

  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {items.map((item, i) => (
          <li
            key={i}
            className={`${!open && i >= visible ? 'hidden sm:flex' : 'flex'} items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-sm sm:gap-3 sm:p-3 sm:text-base`}
          >
            {item}
          </li>
        ))}
      </ul>
      {extra && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline sm:hidden"
        >
          {open ? lessLabel : moreLabel}
          <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      )}
    </>
  );
}
