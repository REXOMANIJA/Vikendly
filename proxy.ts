import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Redirects "/" to the right locale (/sr or /en) and keeps the locale in the URL.
export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\..*).*)',
};
