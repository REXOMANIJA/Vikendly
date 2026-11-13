import 'server-only';
import { esc, notifyTeam } from '@/lib/telegram';
import { site } from '@/lib/site';

/**
 * Sends an error from the live site to the team's Telegram. The same error is sent at most
 * once every 30 minutes per server instance, so a broken page can't flood the chat.
 * Nothing is sent while developing (only on the live site).
 */
const lastSent = new Map<string, number>();
const QUIET_MS = 30 * 60 * 1000;

export async function alertError(info: { message: string; where: string; digest?: string; kind: 'server' | 'browser' }) {
  if (process.env.NODE_ENV !== 'production') return;
  const key = `${info.kind}:${info.where}:${info.message}`.slice(0, 300);
  const now = Date.now();
  if ((lastSent.get(key) ?? 0) > now - QUIET_MS) return;
  lastSent.set(key, now);
  if (lastSent.size > 200) lastSent.clear();

  await notifyTeam(
    [
      `⚠️ <b>Greška na sajtu</b> (${info.kind === 'server' ? 'server' : 'u pregledaču posetioca'})`,
      `📄 ${esc(info.where.slice(0, 200))}`,
      `💬 ${esc(info.message.slice(0, 500))}`,
      ...(info.digest ? [`🔎 Kod: ${esc(info.digest)} (Vercel → Logs)`] : []),
      `🌐 ${site.url}`,
    ].join('\n')
  );
}
