import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@jufap-one/core", "@jufap-one/ui"],
  output: "standalone",
};

export default nextConfig;
