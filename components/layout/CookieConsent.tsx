'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  META_PIXEL_ID,
  OPEN_CONSENT_EVENT,
  loadPixel,
  readConsent,
  revokePixel,
  saveConsent,
  type ConsentChoice,
} from '@/lib/meta-pixel';

/**
 * Cookie notice + Meta Pixel. Shows nothing at all while no pixel ID is set.
 * First visit: a small card at the bottom asks "Prihvatam / Odbijam"; the pixel loads only after
 * "Prihvatam". The choice is remembered; the footer link "Podešavanja kolačića" opens it again.
 */
export default function CookieConsent() {
  const t = useTranslations('cookies');
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [open, setOpen] = useState(false);
  const lastPath = useRef<string | null>(null);

  // Read the saved choice once the page is in the browser
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    const saved = readConsent();
    setChoice(saved);
    if (saved === 'yes') loadPixel();
    else if (saved === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  // Moving to another page inside the site counts as a new page view (the first is sent on load)
  useEffect(() => {
    const changed = lastPath.current !== null && lastPath.current !== pathname;
    lastPath.current = pathname;
    if (!changed || choice !== 'yes') return;
    // The address bar can update a moment after the page; wait so Meta records the new address
    let tries = 0;
    const timer = window.setInterval(() => {
      if (decodeURI(window.location.pathname) === pathname || ++tries >= 20) {
        window.clearInterval(timer);
        window.fbq?.('track', 'PageView');
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [pathname, choice]);

  if (!META_PIXEL_ID || !open) return null;

  const decide = (c: ConsentChoice) => {
    saveConsent(c);
    setChoice(c);
    setOpen(false);
    if (c === 'yes') loadPixel();
    else revokePixel();
  };

  return (
    <div
      role="region"
      aria-label={t('title')}
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-primary/10 bg-white p-4 shadow-xl sm:inset-x-auto sm:left-4 sm:bottom-4 sm:max-w-sm"
    >
      <p className="font-semibold text-primary">{t('title')}</p>
      <p className="mt-1 text-sm text-text/80">
        {t('text')}{' '}
        <Link href="/privacy" className="underline hover:text-primary">
          {t('more')}
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => decide('yes')}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          {t('accept')}
        </button>
        <button
          type="button"
          onClick={() => decide('no')}
          className="flex-1 rounded-lg border-2 border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white"
        >
          {t('decline')}
        </button>
      </div>
    </div>
  );
}

/** Footer link that shows the notice again */
export function CookieSettingsButton({ label }: { label: string }) {
  if (!META_PIXEL_ID) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className="text-white/80 transition-colors hover:text-white hover:underline"
    >
      {label}
    </button>
  );
}
