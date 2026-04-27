import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const internalUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${internalUrl}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${internalUrl}/auth/:path*`,
      }
    ]
  }
};

export default nextConfig;
