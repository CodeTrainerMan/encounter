import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { listEncounters } from "@/lib/encounters";

export const dynamic = "force-dynamic";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** 默认语言（英文）不带前缀，其余语言带 /<locale> 前缀，与 next-intl 的 as-needed 策略一致 */
function localeUrl(base: string, locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${base}${prefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBase();
  const items = await listEncounters();

  const paths = [
    "",
    "/encounters",
    "/about",
    ...items.map((item) => `/encounters/${encodeURIComponent(item.slug)}`),
  ];

  return paths.map((path) => {
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = localeUrl(base, locale, path);
    }

    return {
      url: localeUrl(base, routing.defaultLocale, path),
      alternates: { languages },
    };
  });
}
