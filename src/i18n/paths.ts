import { DEFAULT_LOCALE, type Locale } from "@/lib/types";

/**
 * 语言前缀工具
 * ------------------------------------------------------------
 * 与 `localePrefix: "as-needed"` 保持一致：默认语言（英语）不加前缀，
 * 中文是 `/zh`。服务端跳转与客户端拼回跳地址都用这两个函数，
 * 避免两边规则写得不一致。
 */

/** 给站内路径补上语言前缀 */
export function localeHref(locale: Locale, path: string): string {
  const normalized =
    path === "" || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

  if (locale === DEFAULT_LOCALE) return normalized || "/";
  return `/${locale}${normalized}`;
}

/**
 * 校验回跳地址。
 * 只接受站内绝对路径：`//evil.com` 会被浏览器当成协议相对地址跳出去，
 * 这是经典的开放重定向，必须挡住。
 */
export function safeReturnTo(raw: unknown, locale: Locale): string {
  const value = String(raw ?? "");
  if (!value.startsWith("/") || value.startsWith("//")) return localeHref(locale, "/");
  return value;
}
