import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable these in dev mode to speed up hot reload
  reactCompiler: process.env.NODE_ENV === 'production',
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 500,  // Faster rebuild for dev
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
