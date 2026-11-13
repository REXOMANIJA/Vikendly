import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getSupabase } from '@/lib/supabase/public';

// Telegram messages live in lib/telegram.ts (also used for error alerts)
export { notifyTeam, esc } from '@/lib/telegram';

/**
 * Per-visitor limit: false once this visitor has sent `max` forms of this kind within
 * `windowSeconds`. The visitor's internet address is only kept as a one-way hash.
 * If the check itself fails (e.g. migration 0009 not run yet), the form is let through.
 */
export async function withinRateLimit(kind: string, max: number, windowSeconds: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const visitor = createHash('sha256').update(`vikendly:${ip}`).digest('hex').slice(0, 32);
  const { data, error } = await getSupabase().rpc('hit_rate_limit', {
    p_key: `${kind}:${visitor}`,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('Rate limit check failed:', error.message);
    return true;
  }
  return data !== false;
}
