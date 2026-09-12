"use server";

import { signIn, signOut } from "@/auth";
import { localeHref, safeReturnTo } from "@/i18n/paths";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/types";

/**
 * 登录 / 退出
 * ------------------------------------------------------------
 * 都走 Server Action 而不是链到 Auth.js 的内置页面：
 * 内置页面是英文且不带语言前缀，自己包一层才能回到
 * 用户当前所在的语言与页面。
 */

function readLocale(formData: FormData): Locale {
  const raw = String(formData.get("locale") ?? "");
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** 登录后回到点击登录时所在的那一页，而不是一律回首页 */
export async function signInWithDiscordAction(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  await signIn("discord", { redirectTo: safeReturnTo(formData.get("returnTo"), locale) });
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  await signOut({ redirectTo: localeHref(locale, "/") });
}
