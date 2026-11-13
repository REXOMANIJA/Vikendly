import 'server-only';

/**
 * Sends a message to the team's Telegram (bot → your chat).
 * Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the environment (.env.local and Vercel).
 * Without them nothing is sent, and a failure never breaks what the visitor was doing.
 * Kept free of request-only APIs so it also works for error alerts (instrumentation.ts).
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
