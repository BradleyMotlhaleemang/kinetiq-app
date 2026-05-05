import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['axios'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
