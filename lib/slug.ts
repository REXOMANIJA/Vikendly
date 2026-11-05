const serbianLatin: Record<string, string> = {
  č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'dj', dž: 'dz',
  Č: 'c', Ć: 'c', Š: 's', Ž: 'z', Đ: 'dj',
};

/** "Kuća na Drini" → "kuca-na-drini" (used for house URLs) */
export function slugify(text: string): string {
  return text
    .replace(/dž|[čćšžđČĆŠŽĐ]/g, (ch) => serbianLatin[ch] ?? ch)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // other accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
