import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // 记录正文里可能引用外部图片，放开常见图源
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
