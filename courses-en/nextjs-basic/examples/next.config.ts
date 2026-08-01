import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Labs 20+ — proxy to FastAPI on the host (dev)
  async rewrites() {
    const apiUrl = process.env.FASTAPI_URL ?? "http://localhost:8090";
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
