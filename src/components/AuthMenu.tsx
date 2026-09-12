"use client";

import { useLocale, useTranslations } from "next-intl";
import { signInWithDiscordAction, signOutAction } from "@/actions/auth";
import { usePathname } from "@/i18n/navigation";
import { localeHref } from "@/i18n/paths";
import { DEFAULT_LOCALE, authorName, isLocale, type Author } from "@/lib/types";

/**
 * 登录 / 退出控件。
 *
 * 做成客户端组件只有一个原因：需要知道**当前页面的完整路径**，
 * 登录后才能回到原地。`usePathname` 给的是去掉语言前缀的路径，
 * 所以要用 localeHref 把前缀拼回来。
 *
 * 只在登录已启用时渲染（由 SiteHeader 判断）——演示模式下这里
 * 若画出「用 Discord 登录」按钮，点了会因为缺少密钥而报错。
 */
export default function AuthMenu({ author }: { author: Author | null }) {
  const t = useTranslations("auth");
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const pathname = usePathname();
  const returnTo = localeHref(locale, pathname);

  if (!author) {
    return (
      <form action={signInWithDiscordAction}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="whitespace-nowrap rounded border border-line-strong px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          {t("signIn")}
        </button>
      </form>
    );
  }

  const name = authorName(author);

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5" title={name}>
        {author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatarUrl}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 rounded-full border border-line"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[11px] text-accent">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[7rem] truncate text-sm text-ink-soft sm:inline">{name}</span>
      </span>
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="whitespace-nowrap text-xs text-muted transition-colors hover:text-accent"
        >
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}
