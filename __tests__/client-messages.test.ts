import { CLIENT_MESSAGE_PATHS, pickMessages } from '@/lib/client-messages';
import sr from '@/locales/sr/common.json';
import en from '@/locales/en/common.json';

describe('texts sent to the browser', () => {
  it.each([
    ['sr', sr],
    ['en', en],
  ])('every listed path exists in %s', (_, messages) => {
    for (const path of CLIENT_MESSAGE_PATHS) {
      const value = path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], messages);
      expect([path, value !== undefined]).toEqual([path, true]);
    }
  });

  it('keeps only the listed parts and is much smaller than all texts', () => {
    const picked = pickMessages(sr);
    expect(picked).toHaveProperty('house.gallery');
    expect(picked).toHaveProperty('house.photoAlt');
    expect(picked).not.toHaveProperty('house.aboutTitle');
    expect(picked).not.toHaveProperty('faq');
    expect(JSON.stringify(picked).length).toBeLessThan(JSON.stringify(sr).length * 0.6);
  });
});
