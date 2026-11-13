import { toInternational, viberUrl, whatsappUrl } from '@/lib/phone';

describe('toInternational', () => {
  it.each([
    ['064 123 4567', '+381641234567'],
    ['064/123-45-67', '+381641234567'],
    ['+381 64 123 4567', '+381641234567'],
    ['00381641234567', '+381641234567'],
    ['381641234567', '+381641234567'],
    ['+387 65 123 456', '+38765123456'],
    ['0038765123456', '+38765123456'],
  ])('%s → %s', (input, expected) => {
    expect(toInternational(input)).toBe(expected);
  });

  it('refuses numbers that are too short', () => {
    expect(toInternational('123')).toBeNull();
    expect(toInternational('')).toBeNull();
  });
});

describe('messaging links', () => {
  it('WhatsApp uses the number without +', () => {
    expect(whatsappUrl('064 123 4567')).toBe('https://wa.me/381641234567');
  });
  it('Viber keeps the + (encoded)', () => {
    expect(viberUrl('064 123 4567')).toBe('viber://chat?number=%2B381641234567');
  });
  it('no link for a broken number', () => {
    expect(whatsappUrl('12')).toBeNull();
    expect(viberUrl('12')).toBeNull();
  });
});
