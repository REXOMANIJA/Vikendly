import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Redirects "/" to the right locale (/sr or /en) and keeps the locale in the URL.
export default createMiddleware(routing);

export const config = {
  // Run on every page, but skip API routes, Next internals and files with an extension
  // (e.g. /images/hero.svg). Note the double backslash: it must reach the regex as "\." (a dot).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
