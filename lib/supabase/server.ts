import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for the admin panel on the server (pages and server actions).
 * Uses the logged-in admin's session from cookies, so database rules see them as an admin.
 * Create a new one per request; never share it.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
          } catch {
            // Called from a page render, where cookies are read-only.
            // Fine: proxy.ts refreshes the session on every /admin request.
          }
        },
      },
    }
  );
}

/** The logged-in user if they are an admin, otherwise null */
export async function getAdminUser() {
  const supabase = await createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc('is_admin');
  return isAdmin ? user : null;
}
