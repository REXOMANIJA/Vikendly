import { getVersion, setWorkerUrl, type ExpressionSpecification, type Map as MapLibreMap } from 'maplibre-gl';

// MapLibre's background helper is served from public/maplibre/ (scripts/copy-map-worker.cjs)
if (typeof window !== 'undefined') setWorkerUrl(`/maplibre/worker-${getVersion()}.mjs`);

/**
 * Look of every map on the site: OpenFreeMap's simple light "Positron" map (free, no key, allowed
 * for commercial sites), recoloured to Vikendly's colours and with place names in Latin only.
 * Data © OpenMapTiles, © OpenStreetMap contributors (shown in the map corner).
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

const COLOURS: Record<string, Record<string, string>> = {
  background: { 'background-color': '#f5f1e8' },
  landuse_residential: { 'fill-color': '#efe8da' },
  park: { 'fill-color': '#e2ead6' },
  landcover_wood: { 'fill-color': '#dce7d2' },
  water: { 'fill-color': '#c4dde6' },
  waterway: { 'line-color': '#b5d4df' },
  building: { 'fill-color': '#e9e1d2', 'fill-outline-color': '#ddd2bf' },
  highway_minor: { 'line-color': '#ffffff' },
  highway_major_casing: { 'line-color': '#e2d7c3' },
  highway_major_inner: { 'line-color': '#ffffff' },
  highway_motorway_casing: { 'line-color': '#e0c9b5' },
  highway_motorway_inner: { 'line-color': '#fbeee4' },
};

/** Map control texts in Serbian (English uses MapLibre's own) */
export function mapTexts(locale: string): Record<string, string> | undefined {
  if (locale === 'en') return undefined;
  return {
    'CooperativeGesturesHandler.WindowsHelpText': 'Držite Ctrl i okrećite točkić miša da uvećate mapu',
    'CooperativeGesturesHandler.MacHelpText': 'Držite ⌘ i okrećite točkić miša da uvećate mapu',
    'CooperativeGesturesHandler.MobileHelpText': 'Pomerajte mapu sa dva prsta',
    'NavigationControl.ZoomIn': 'Uvećaj',
    'NavigationControl.ZoomOut': 'Umanji',
    'Popup.Close': 'Zatvori',
  };
}

/** Call once the style has loaded ("load" event). Place names follow the site language. */
export function applyVikendlyLook(map: MapLibreMap, locale: string) {
  // Small maps (phones): map credits fold into the "i" button, one tap shows them
  if (map.getContainer().clientWidth < 500) {
    map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
  }
  // Serbian: Latin-script Serbian names ("Srbija", "Beograd"); English: English names
  const name: ExpressionSpecification =
    locale === 'en'
      ? ['coalesce', ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']]
      : ['coalesce', ['get', 'name:sr-Latn'], ['get', 'name:latin'], ['get', 'name']];
  for (const [layer, paint] of Object.entries(COLOURS)) {
    if (!map.getLayer(layer)) continue;
    for (const [property, value] of Object.entries(paint)) {
      map.setPaintProperty(layer, property as Parameters<MapLibreMap['setPaintProperty']>[1], value);
    }
  }
  for (const layer of map.getStyle().layers ?? []) {
    // Road number signs: just empty boxes at this scale
    if (layer.id.includes('shield')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
      continue;
    }
    if (layer.type !== 'symbol' || !map.getLayoutProperty(layer.id, 'text-field')) continue;
    // Serbian places are in OpenStreetMap in Cyrillic; the site is in Latin script
    map.setLayoutProperty(layer.id, 'text-field', name);
    if (layer.id.startsWith('label_')) {
      map.setPaintProperty(layer.id, 'text-color', '#3d4a45');
      map.setPaintProperty(layer.id, 'text-halo-color', '#f5f1e8');
    }
  }
}
