import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getSupabase } from '@/lib/supabase/public';

/**
 * Sends a message to the team's Telegram (bot → your chat).
 * Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the environment (.env.local and Vercel).
 * Without them nothing is sent, and a failure never breaks the form the guest submitted.
 */
export async function notifyTeam(html: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('Telegram notification failed:', res.status, await res.text());
  } catch (e) {
    console.error('Telegram notification failed:', e);
  }
}

/** Makes text safe inside a Telegram HTML message */
export const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
