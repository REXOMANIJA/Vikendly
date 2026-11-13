/**
 * Business details shown on the site (contact page, footer, legal pages).
 * Leave a value empty ('') to hide it.
 */
export const site = {
  /** Public address of the site, used in links sent to Telegram, sitemap, etc. */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vikendly.com',
  /** Who runs the site, as named in the privacy policy and terms */
  operator: 'Vikendly tim',
  email: 'info@vikendly.com',
  /** Shown as written; also used for call / WhatsApp / Viber links */
  phone: '+381 64 477 3663',
  instagram: 'vikendly_', // without @
  /** Date the privacy policy and terms were last changed */
  legalUpdated: '2026-11-13',
};

/** "+381 64 123 4567" → "+381641234567" for tel:, WhatsApp and Viber links */
export const phoneDigits = (phone: string) => phone.replace(/[^\d+]/g, '');
