import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
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
