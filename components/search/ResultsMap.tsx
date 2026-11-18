'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapPoint } from '@/lib/search';
import { MAP_STYLE_URL, applyVikendlyLook, mapTexts } from '@/lib/map-style';

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Search results on a map (same look as the house page, lib/map-style.ts). Each house is a price
 * pin; tapping it shows the photo, name, price and a link to the house. Loaded only when the guest
 * switches to "Mapa".
 */
export default function ResultsMap({ points, openLabel }: { points: MapPoint[]; openLabel: string }) {
  const box = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  useEffect(() => {
    if (!box.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: MAP_STYLE_URL,
      center: points.length ? [points[0].lng, points[0].lat] : [20.4, 44.0],
      zoom: 7,
      minZoom: 4,
      maxZoom: 16,
      cooperativeGestures: true,
      locale: mapTexts(locale),
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.on('load', () => applyVikendlyLook(map, locale));

    for (const p of points) {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'vk-pin';
      pin.textContent = p.pin;
      pin.setAttribute('aria-label', p.name);
      const photo = p.photo ? `<img src="${escape(p.photo)}" alt="" class="vk-pop-photo" loading="lazy" />` : '';
      const popup = new maplibregl.Popup({ offset: 18, maxWidth: '240px', closeButton: true }).setHTML(
        `<a href="${escape(p.href)}" class="vk-pop">${photo}<span class="vk-pop-body">` +
          (p.place ? `<span class="vk-pop-place">${escape(p.place)}</span>` : '') +
          `<strong class="vk-pop-name">${escape(p.name)}</strong>` +
          `<span class="vk-pop-price">${escape(p.price)}</span>` +
          `<span class="vk-pop-link">${escape(openLabel)} →</span></span></a>`
      );
      new maplibregl.Marker({ element: pin, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
    }

    if (points.length === 1) map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 11 });
    else if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      for (const p of points) bounds.extend([p.lng, p.lat]);
      map.fitBounds(bounds, { padding: 50, maxZoom: 11, animate: false });
    }

    return () => map.remove();
  }, [points, openLabel, locale]);

  // "isolate" keeps the map's layers under the sticky header
  return <div ref={box} className="isolate h-[65vh] min-h-80 w-full overflow-hidden rounded-2xl ring-1 ring-primary/10 md:h-[70vh]" />;
}
