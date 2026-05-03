import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/heartbeat-habits',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
