import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

// Public site: redirects "/" to /sr or /en and translates localized URLs (/sr/kuce/… → houses/[slug]).
const handleI18n = createMiddleware(routing);

/**
 * Admin panel (/admin): keeps the Supabase login session fresh and sends visitors
 * who are not logged in to /admin/login. Whether the user is an admin is checked
 * again on the server and in the database itself.
 */
async function handleAdmin(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return handleAdmin(request);
  return handleI18n(request);
}

export const config = {
  // Run on every page, but skip API routes, Next internals and files with an extension
  // (e.g. /images/hero.svg). Note the double backslash: it must reach the regex as "\." (a dot).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
