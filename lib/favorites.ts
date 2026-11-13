'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Saved houses ("favourites"), kept only in this browser (localStorage), no account needed.
 * Stored as a list of house slugs. All hearts on the page stay in sync through an event.
 */

const KEY = 'vikendly:favorites';
const EVENT = 'vikendly:favorites-changed';
const EMPTY: string[] = [];

let cachedRaw: string | null = null;
let cachedList: string[] = EMPTY;

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedList;
    cachedRaw = raw;
    const parsed = raw ? JSON.parse(raw) : [];
    cachedList = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : EMPTY;
  } catch {
    cachedList = EMPTY;
  }
  return cachedList;
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private mode or storage blocked: the heart just doesn't stick
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // Another tab changed the list
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** The saved slugs (empty on the server and before the page is ready) */
export function useFavorites() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((slug: string) => {
    const current = read();
    write(current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current]);
  }, []);
  return { list, has: (slug: string) => list.includes(slug), toggle };
}
