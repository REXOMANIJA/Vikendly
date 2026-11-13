'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '@/lib/search';

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Search results on a map (OpenStreetMap). Each house is a price pin; tapping it shows the
 * photo, name, price and a link to the house. Loaded only when the guest switches to "Mapa".
 */
export default function ResultsMap({ points, openLabel }: { points: MapPoint[]; openLabel: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!box.current) return;
    const map = L.map(box.current, {
      // Scrolling the page shouldn't zoom the map; zoom with the buttons or two fingers
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    for (const p of points) {
      const icon = L.divIcon({
        className: 'vk-pin-wrap',
        html: `<span class="vk-pin">${escape(p.pin)}</span>`,
        iconSize: undefined,
      });
      const photo = p.photo ? `<img src="${escape(p.photo)}" alt="" class="vk-pop-photo" loading="lazy" />` : '';
      L.marker([p.lat, p.lng], { icon, title: p.name, riseOnHover: true })
        .addTo(map)
        .bindPopup(
          `<a href="${escape(p.href)}" class="vk-pop">${photo}<span class="vk-pop-body">` +
            (p.place ? `<span class="vk-pop-place">${escape(p.place)}</span>` : '') +
            `<strong class="vk-pop-name">${escape(p.name)}</strong>` +
            `<span class="vk-pop-price">${escape(p.price)}</span>` +
            `<span class="vk-pop-link">${escape(openLabel)} →</span></span></a>`,
          { maxWidth: 240, minWidth: 220 }
        );
    }

    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 11);
    else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 11 });

    return () => {
      map.remove();
    };
  }, [points, openLabel]);

  // "isolate" keeps the map's layers under the sticky header
  return <div ref={box} className="isolate h-[65vh] min-h-80 w-full overflow-hidden rounded-2xl ring-1 ring-primary/10 md:h-[70vh]" />;
}
