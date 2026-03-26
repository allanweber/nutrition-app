import type { NextConfig } from "next";

// When running locally without Vercel Blob, uploaded images are served from
// public/uploads/ as plain static files. Next.js image optimization tries to
// fetch them from the running server internally and fails. Since client-side
// canvas already produces optimised JPEGs, skip optimisation in local mode.
const isLocalDev = !process.env.BLOB_READ_WRITE_TOKEN;

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
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
