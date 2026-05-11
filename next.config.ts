import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/agency/media-room',
        destination: '/agency',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
