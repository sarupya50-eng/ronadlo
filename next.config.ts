import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.app.github.dev",
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;
