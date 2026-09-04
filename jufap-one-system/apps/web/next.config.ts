import type { NextConfig } from "next";

const deploymentBasePath = process.env.DEPLOY_BASE_PATH ?? "";
const deploymentAssetPrefix = process.env.DEPLOY_ASSET_PREFIX ?? deploymentBasePath;
const isStaticDeployment = process.env.STATIC_DEPLOYMENT === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@jufap-one/core", "@jufap-one/ui"],
  output: isStaticDeployment ? "export" : "standalone",
  basePath: deploymentBasePath,
  assetPrefix: deploymentAssetPrefix,
  trailingSlash: isStaticDeployment,
  images: {
    unoptimized: isStaticDeployment,
  },
};

export default nextConfig;
