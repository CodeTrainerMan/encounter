import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/types";

/**
 * 路由级国际化配置
 * ------------------------------------------------------------
 * 英文为默认语言（首选），因此 `localePrefix: "as-needed"`：
 *   - `/`、`/encounters/<slug>`          → 英文
 *   - `/zh`、`/zh/encounters/<slug>`     → 中文
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
