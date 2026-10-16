import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 内部后台：每个页面都是按登录用户动态渲染的，不使用 Cache Components。
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: { remotePatterns: [] },
};

export default nextConfig;
