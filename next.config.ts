import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ftscrt.com',
      },
      {
        protocol: 'https',
        hostname: '**.fatsecret.com',
      },
      {
        protocol: 'https',
        hostname: 'www.foodimagedb.com',
      },
    ],
  },
};

export default nextConfig;
