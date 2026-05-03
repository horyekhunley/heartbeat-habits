import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/heartbeat-habits',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
