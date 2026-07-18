import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Лабы 20+ — прокси к FastAPI на хосте (dev)
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
