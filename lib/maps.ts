/**
 * Google Maps helpers. No API key needed: the embed uses Google's public "output=embed" map.
 */

export type LatLng = { lat: number; lng: number };

const valid = (lat: number, lng: number): LatLng | null =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
    ? { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 }
    : null;

/**
 * Reads coordinates from a Google Maps link or plain "lat, lng" text. Understands:
 * - place links: ".../place/Name/@43.72,19.70,15z/data=...!3d43.7213!4d19.7064" (uses the pin, !3d/!4d)
 * - "?q=43.72,19.70", "query=", "ll=", "destination=", "center="
 * - "@43.72,19.70" (map centre) as a last resort
 * - "43.7213, 19.7064" typed or pasted directly
 * Short links (maps.app.goo.gl/…) must be resolved first, see resolveMapsLink in app/admin/actions.ts.
 */
export function parseCoordinates(input: string): LatLng | null {
  const text = decodeURIComponentSafe(input.trim());

  // Exact pin of a place
  const pin = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) return valid(Number(pin[1]), Number(pin[2]));

  const param = text.match(/[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (param) return valid(Number(param[1]), Number(param[2]));

  const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return valid(Number(at[1]), Number(at[2]));

  const plain = text.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (plain) return valid(Number(plain[1]), Number(plain[2]));

  return null;
}

function decodeURIComponentSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Where the pin goes: exact coordinates if we have them, otherwise the address */
const target = (place: { lat?: number; lng?: number; address: string }) =>
  place.lat != null && place.lng != null ? `${place.lat},${place.lng}` : place.address;

/** URL for the embedded map (iframe) with a pin */
export function mapEmbedUrl(place: { lat?: number; lng?: number; address: string }, locale: string, zoom = 13) {
  // For Google, "sr" means Serbian in Cyrillic; the site is in Latin script
  const hl = locale === 'sr' ? 'sr-Latn' : locale;
  return `https://maps.google.com/maps?q=${encodeURIComponent(target(place))}&z=${zoom}&hl=${hl}&output=embed`;
}

/** Opens the place in Google Maps (app on phones) */
export function mapOpenUrl(place: { lat?: number; lng?: number; address: string }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target(place))}`;
}

/** Directions to the place from wherever the visitor is */
export function mapDirectionsUrl(place: { lat?: number; lng?: number; address: string }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target(place))}`;
}
