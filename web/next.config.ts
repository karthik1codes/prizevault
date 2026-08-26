import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const repoRoot = path.resolve(process.cwd(), "..");
loadEnv({ path: path.resolve(repoRoot, ".env") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const clientSrc = path.resolve(process.cwd(), "src/client");
const backendSrc = path.resolve(repoRoot, "src");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  env: {
    NEXT_PUBLIC_SOROBAN_CONTRACT_ID: process.env.SOROBAN_CONTRACT_ID || "",
  },
  experimental: {
    externalDir: true,
  },
  serverExternalPackages: ["@stellar/stellar-sdk"],
  turbopack: {
    resolveAlias: {
      "@frontend": clientSrc,
      "@backend": backendSrc,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@frontend": clientSrc,
      "@backend": backendSrc,
      buffer: require.resolve("buffer/"),
      "ipfs-http-client": path.resolve(process.cwd(), "src/lib/ipfs-http-client-stub.js"),
    };
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    config.resolve.modules = [path.resolve(process.cwd(), "node_modules"), "node_modules"];
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      encoding: false,
    };
    const webpack = require("webpack");
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
    );
    return config;
  },
};

export default nextConfig;
