/**
 * Phone links for calling and messaging (admin: guest and owner phones).
 * Guests type numbers in many ways ("064 123 4567", "+381 64…", "00381 64…"), but WhatsApp and
 * Viber need the full international number, so local Serbian numbers get +381.
 */

/** "064 123 4567" → "+381641234567"; "+387 65 …" stays; null if there are too few digits */
export function toInternational(phone: string): string | null {
  let digits = phone.trim().replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  digits = digits.replace(/(?!^)\+/g, '');
  if (!digits.startsWith('+')) {
    if (digits.startsWith('381')) digits = '+' + digits;
    else if (digits.startsWith('0')) digits = '+381' + digits.slice(1);
    else digits = '+381' + digits;
  }
  return digits.replace(/\D/g, '').length >= 8 ? digits : null;
}

export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Opens a WhatsApp chat (app on phones, web on computers) */
export function whatsappUrl(phone: string): string | null {
  const intl = toInternational(phone);
  return intl ? `https://wa.me/${intl.slice(1)}` : null;
}

/** Opens a Viber chat (needs the Viber app) */
export function viberUrl(phone: string): string | null {
  const intl = toInternational(phone);
  return intl ? `viber://chat?number=${encodeURIComponent(intl)}` : null;
}
