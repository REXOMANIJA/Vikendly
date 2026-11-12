/**
 * Drawings (.svg) are sent as they are; photos go through Next.js image resizing,
 * which serves each visitor a version sized for their screen (phones get small files).
 */
export const isVector = (src: string) => /\.svg($|\?)/i.test(src);
