import { mapDirectionsUrl, mapEmbedUrl, parseCoordinates } from '@/lib/maps';

describe('parseCoordinates', () => {
  it('prefers the exact pin (!3d/!4d) over the map centre (@)', () => {
    const url =
      'https://www.google.com/maps/place/Ribni%C4%8Dko+jezero/@43.7180,19.6990,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d43.7213!4d19.7064';
    expect(parseCoordinates(url)).toEqual({ lat: 43.7213, lng: 19.7064 });
  });

  it('reads q=, query= and the map centre', () => {
    expect(parseCoordinates('https://maps.google.com/?q=43.2850,20.8140')).toEqual({ lat: 43.285, lng: 20.814 });
    expect(parseCoordinates('https://www.google.com/maps/search/?api=1&query=43.97,19.56')).toEqual({ lat: 43.97, lng: 19.56 });
    expect(parseCoordinates('https://www.google.com/maps/@44.1036,20.0047,14z')).toEqual({ lat: 44.1036, lng: 20.0047 });
  });

  it('accepts coordinates typed by hand', () => {
    expect(parseCoordinates('43.7213, 19.7064')).toEqual({ lat: 43.7213, lng: 19.7064 });
    expect(parseCoordinates(' 45.2027,19.9342 ')).toEqual({ lat: 45.2027, lng: 19.9342 });
  });

  it('rejects things that are not coordinates', () => {
    expect(parseCoordinates('Zlatibor')).toBeNull();
    expect(parseCoordinates('https://maps.app.goo.gl/AbCdEf123')).toBeNull(); // short link: resolve first
    expect(parseCoordinates('95.0, 19.0')).toBeNull(); // latitude out of range
    expect(parseCoordinates('0, 0')).toBeNull();
  });
});

describe('map URLs', () => {
  it('pins exact coordinates when known, otherwise the address', () => {
    expect(mapEmbedUrl({ lat: 43.72, lng: 19.7, address: 'x' }, 'sr')).toContain('q=43.72%2C19.7');
    expect(mapEmbedUrl({ address: 'Ribničko jezero 12, Zlatibor' }, 'en')).toContain('q=Ribni%C4%8Dko%20jezero');
    expect(mapDirectionsUrl({ lat: 43.72, lng: 19.7, address: 'x' })).toContain('destination=43.72%2C19.7');
  });
});
