import { getTranslations } from "next-intl/server";
import { isAuthConfigured } from "@/auth";
import { Link } from "@/i18n/navigation";
import { getCurrentAuthor } from "@/lib/session";
import AuthMenu from "./AuthMenu";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * 顶栏。
 *
 * 站点只剩时间流一条内容，所以导航列表整个去掉了：
 * 左边是站点名，右边是登录与语言——和 X 的顶栏一样，
 * 不提供「去哪」的选项，因为只有一处可去。
 *
 * 高度固定 56px：时间流的纵向分隔线要按这个高度扣掉一屏，
 * 换成别的高度记得同步 page.tsx 里的 min-h。
 */
export default async function SiteHeader() {
  const t = await getTranslations();
  const author = await getCurrentAuthor();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[640px] items-center justify-between gap-3 px-4">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
            {t("brand.name")}
          </span>
          <span className="hidden text-xs text-muted sm:inline">{t("brand.subtitle")}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* 没启用登录（演示模式）时不渲染登录入口，否则点了会报错 */}
          {isAuthConfigured ? <AuthMenu author={author} /> : null}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
