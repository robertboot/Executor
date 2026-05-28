import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the tracing root to /web so Next doesn't get confused by the
  // Expo app's package.json one directory up.
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default nextConfig;
