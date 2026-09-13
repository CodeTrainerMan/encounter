import type { MetadataRoute } from "next";
import { localeHref } from "@/i18n/paths";
import { routing } from "@/i18n/routing";

/** 表单页只对登录用户有意义：新建与编辑都不该被收录 */
const PRIVATE_PATHS = ["/encounters/new", "/encounters/*/edit"];

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 每种语言都有自己的路径前缀（英文无前缀、中文是 /zh）。只写无前缀那一条，
        // 会漏掉 /zh/encounters/new 这类页面，所以按配置的语言逐个铺开。
        disallow: routing.locales.flatMap((locale) =>
          PRIVATE_PATHS.map((path) => localeHref(locale, path)),
        ),
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
