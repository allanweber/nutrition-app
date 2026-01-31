import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.ftscrt.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform.fatsecret.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
