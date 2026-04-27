import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow local access via 127.0.0.1 without blocking HMR/font dev resources.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
