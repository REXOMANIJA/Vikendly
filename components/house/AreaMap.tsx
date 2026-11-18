'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL, applyVikendlyLook, mapTexts } from '@/lib/map-style';

/** Our house pin (also used on the search map) */
export const HOUSE_PIN_HTML =
  '<span class="vk-house-pin-halo"></span>' +
  '<svg class="vk-house-pin" viewBox="0 0 44 56" aria-hidden="true">' +
  '<path d="M22 54s18-17.3 18-31A18 18 0 0 0 4 23c0 13.7 18 31 18 31Z" fill="#1a3c34" stroke="#fff" stroke-width="3"/>' +
  '<path d="M13.5 24.5 22 17l8.5 7.5V32a1 1 0 0 1-1 1h-5v-5.5h-5V33h-5a1 1 0 0 1-1-1Z" fill="#fff"/>' +
  '<circle cx="31" cy="15" r="4" fill="#e07a5f" stroke="#fff" stroke-width="2"/>' +
  '</svg>';

/**
 * House page map: a simple light map in the site's colours (lib/map-style.ts) with our pin on the
 * house. No address, no Google link, no directions: the team sends those after a booking.
 */
export default function AreaMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  useEffect(() => {
    if (!box.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: MAP_STYLE_URL,
      center: [lng, lat],
      zoom: 12.5,
      minZoom: 5,
      maxZoom: 16,
      // Scrolling the page doesn't move the map: two fingers on phones, Ctrl + wheel on computers
      cooperativeGestures: true,
      locale: mapTexts(locale),
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.on('load', () => applyVikendlyLook(map, locale));

    const pin = document.createElement('div');
    pin.className = 'vk-house-pin-wrap';
    pin.innerHTML = HOUSE_PIN_HTML;
    new maplibregl.Marker({ element: pin, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);

    return () => map.remove();
  }, [lat, lng, locale]);

  return <div ref={box} role="img" aria-label={label} className="isolate h-full w-full" />;
}
