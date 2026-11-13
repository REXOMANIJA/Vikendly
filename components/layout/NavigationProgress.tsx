'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Thin bar at the top of the screen while a new page is loading.
 * Starts when a link to another page is clicked (or startNavigationProgress() is called before
 * router.push), finishes when the address changes. Only shows if loading takes longer than a
 * moment, so fast page changes don't flash.
 */

const START_EVENT = 'vikendly:navigation-start';
const SHOW_AFTER_MS = 120;
const GIVE_UP_AFTER_MS = 15000;

/** Call right before router.push / router.replace to a different page */
export function startNavigationProgress() {
  window.dispatchEvent(new Event(START_EVENT));
}

type Phase = 'idle' | 'loading' | 'done';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  // Start on clicks on links to another page of this site
  useEffect(() => {
    const start = () => {
      clearTimers();
      timers.current.push(
        window.setTimeout(() => setPhase('loading'), SHOW_AFTER_MS),
        window.setTimeout(() => setPhase('idle'), GIVE_UP_AFTER_MS)
      );
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (only the #part differs, or exactly the same address): nothing loads
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(START_EVENT, start);
      clearTimers();
    };
  }, []);

  // The address changed: the new page is here
  useEffect(() => {
    clearTimers();
    setPhase((p) => (p === 'loading' ? 'done' : 'idle'));
  }, [pathname, searchParams]);

  // After "done", let the bar fill up and fade, then reset
  useEffect(() => {
    if (phase !== 'done') return;
    const id = window.setTimeout(() => setPhase('idle'), 400);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <div
      aria-hidden
      // Own name so page-change animations leave it alone (like the header)
      style={{ viewTransitionName: 'nav-progress' }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div
        className={`h-full origin-left bg-accent-dark shadow-[0_0_8px_rgb(224_122_95/0.7)] ${
          phase === 'idle'
            ? 'scale-x-0 opacity-0 transition-none'
            : phase === 'loading'
              ? 'vk-progress opacity-100'
              : 'scale-x-100 opacity-0 transition-[scale,opacity] duration-300 ease-out'
        }`}
      />
    </div>
  );
}
