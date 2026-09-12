"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES } from "@/lib/types";

/**
 * 语言切换。
 * 切换时保留当前路径（`usePathname` 返回的路径不含语言前缀），
 * 由 next-intl 负责补上目标语言的前缀。
 */
export default function LanguageSwitcher() {
  const t = useTranslations("language");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="ml-1 flex items-center gap-0.5 rounded border border-line p-0.5"
    >
      {LOCALES.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => router.replace(pathname, { locale })}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "rounded-sm bg-accent-soft px-2 py-1 text-xs font-medium text-accent"
                : "rounded-sm px-2 py-1 text-xs text-muted transition-colors hover:text-ink-soft"
            }
          >
            {t(locale)}
          </button>
        );
      })}
    </div>
  );
}
