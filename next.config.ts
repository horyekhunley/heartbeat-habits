import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/heartbeat-habits',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
