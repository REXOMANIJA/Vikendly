import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Basic browser protections sent with every page
const securityHeaders = [
  // Only load the site over HTTPS (for 2 years, including subdomains)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Other sites can't show Vikendly inside a frame (stops click-jacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Browsers must trust the file types we send instead of guessing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Other sites only see "came from vikendly.com", never the full page address
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // The site never needs camera, microphone, location or ad-interest tracking
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    // Allowed compression levels for next/image (70 for large photos, 75 is the default)
    qualities: [70, 75],
    // House photos uploaded in the admin panel live in Supabase Storage
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
};

export default withNextIntl(nextConfig);
