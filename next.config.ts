import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.app.github.dev",
    "127.0.0.1",
    "localhost",
  ],

  // Only for the Windows desktop app build (npm run build:desktop).
  // Normal dev / Vercel builds are unchanged.
  ...(process.env.ELECTRON_BUILD
    ? { output: "standalone" as const, outputFileTracingRoot: process.cwd() }
    : {}),
};

export default nextConfig;
