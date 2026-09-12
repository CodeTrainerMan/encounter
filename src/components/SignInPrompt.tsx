import { getTranslations } from "next-intl/server";
import { signInWithDiscordAction } from "@/actions/auth";
import { localeHref } from "@/i18n/paths";
import type { Locale } from "@/lib/types";

/**
 * 「请先登录」提示 + 登录入口。
 *
 * 用于要登录才能访问的页面（写记录、改记录）：与其让人填完整张表单
 * 才在提交时被告知要登录，不如一进来就说清楚。
 */
export default async function SignInPrompt({
  locale,
  returnTo,
}: {
  locale: Locale;
  returnTo?: string;
}) {
  const t = await getTranslations("auth");

  return (
    <div className="card p-6">
      <p className="text-sm leading-relaxed text-ink-soft">{t("required")}</p>
      <form action={signInWithDiscordAction} className="mt-5">
        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="returnTo"
          value={returnTo ?? localeHref(locale, "/encounters/new")}
        />
        <button
          type="submit"
          className="rounded bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent"
        >
          {t("signIn")}
        </button>
      </form>
    </div>
  );
}
