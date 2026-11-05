'use client';

import { createBrowserClient } from '@supabase/ssr';

/** Supabase client in the browser for the admin panel (login, photo uploads). */
export function createBrowserAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
