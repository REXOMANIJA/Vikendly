/**
 * Meta (Facebook/Instagram) Pixel – measures which ads bring visitors and requests.
 *
 * Off until NEXT_PUBLIC_META_PIXEL_ID is set (in .env.local and in Vercel). Even then it only
 * loads after the visitor taps "Prihvatam" in the cookie notice (components/layout/CookieConsent.tsx):
 * the pixel sets advertising cookies, which Serbian law (ZZPL) allows only with consent.
 * We never send names, phones or emails to Meta – only "a page was opened" and "a form was sent".
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';

/** The visitor's choice, kept in their browser */
export const CONSENT_KEY = 'vikendly-cookie-consent';
export type ConsentChoice = 'yes' | 'no';

/** Fired by the footer "Podešavanja kolačića" link to show the notice again */
export const OPEN_CONSENT_EVENT = 'vikendly:cookie-settings';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: unknown;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function readConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'yes' || v === 'no' ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Private mode etc.: the notice simply shows again next visit
  }
}

/** Meta's standard loader (same as their copy-paste snippet), run only after consent */
export function loadPixel() {
  if (!META_PIXEL_ID || typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('consent', 'grant');
    return;
  }
  const fbq = function (this: unknown) {
    // eslint-disable-next-line prefer-rest-params
    if (fbq.callMethod) fbq.callMethod.apply(this, arguments as unknown as unknown[]);
    // eslint-disable-next-line prefer-rest-params
    else fbq.queue.push(arguments);
  } as unknown as Fbq;
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

/** Visitor changed their mind: the pixel stops sending anything */
export function revokePixel() {
  window.fbq?.('consent', 'revoke');
}

/** Sends a standard event (e.g. 'Lead') – does nothing without consent or without a pixel ID */
export function trackPixel(event: string, params?: Record<string, string | number>) {
  if (typeof window === 'undefined' || !window.fbq || readConsent() !== 'yes') return;
  // Measuring must never break the form that called it
  try {
    if (params) window.fbq('track', event, params);
    else window.fbq('track', event);
  } catch {
    // ignore
  }
}
