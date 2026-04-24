import type { NextConfig } from "next";

// When running locally without R2, uploaded images are served from
// public/uploads/ as plain static files. Next.js image optimization tries to
// fetch them from the running server internally and fails. Since client-side
// canvas already produces optimised JPEGs, skip optimisation in local mode.
const isLocalDev = !process.env.R2_ACCESS_KEY_ID;

const nextConfig: NextConfig = {
  images: {
    unoptimized: isLocalDev,
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
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.vitalis.allanweber.dev',
      },
    ],
  },
};

export default nextConfig;
