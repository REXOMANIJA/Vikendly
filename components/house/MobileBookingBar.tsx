'use client';

import { useEffect, useState } from 'react';

/**
 * Phones: bar at the bottom with the "from" price and a shortcut to the booking box.
 * It slides away while the booking box itself is on screen (it would only cover the form),
 * and comes back when the visitor scrolls past it again.
 */
export default function MobileBookingBar({
  targetId,
  price,
  cta,
}: {
  /** id of the element that holds the booking box */
  targetId: string;
  price: string;
  cta: string;
}) {
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    // "On screen" = any part of the box is in the view, above the area the bar covers
    const observer = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), {
      rootMargin: '0px 0px -80px 0px',
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={formVisible}
      className={`sticky bottom-0 z-40 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur transition-[translate,opacity] duration-300 lg:hidden ${
        formVisible ? 'pointer-events-none translate-y-full opacity-0' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-primary">{price}</span>
        <a href="#cena" tabIndex={formVisible ? -1 : undefined} className="rounded-lg bg-accent-dark px-4 py-2.5 font-medium text-white">
          {cta}
        </a>
      </div>
    </div>
  );
}
