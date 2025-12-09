import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components - opt-in caching model (Next.js 16.0.8)
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
