import type { Instrumentation } from 'next';

/**
 * Called by Next.js for every error on the server (pages, server actions, API routes).
 * Sends a short alert to the team's Telegram (lib/error-alert.ts) so problems on the live site
 * are noticed right away. "Not found" pages and redirects are normal and never reported.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const err = error as Error & { digest?: string };
  // notFound() and redirect() work by throwing; they are not errors
  if (/NEXT_(NOT_FOUND|REDIRECT|HTTP_ERROR_FALLBACK)/.test(err.digest ?? err.message ?? '')) return;
  const { alertError } = await import('@/lib/error-alert');
  await alertError({
    kind: 'server',
    message: err.message || String(error),
    where: `${request.method} ${request.path}`,
    digest: err.digest,
  });
};
