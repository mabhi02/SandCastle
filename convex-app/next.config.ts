import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Keep dev warnings but don't fail builds on eslint issues
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
