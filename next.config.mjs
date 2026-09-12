import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */

if (!process.env.IMAGE_PROXY_SECRET || process.env.IMAGE_PROXY_SECRET.length < 32) {
  throw new Error("IMAGE_PROXY_SECRET en az 32 karakter olmalı ve .env.local'de tanımlı olmalı");
}

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/webp'], // 'image/avif' KALDIRILDI - GHSA-2xp9-vwfh-vxw4 RCE açığı kapatıldı
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.ozlerav.com.tr',
      },
      {
        protocol: 'https',
        hostname: 'ozlerav.com.tr',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
                  ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
