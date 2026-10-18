import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Permite una rendición con varios respaldos, limitados además por acción.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
