import { getTranslations } from "next-intl/server";
import { isAuthConfigured } from "@/auth";
import { Link } from "@/i18n/navigation";
import { getCurrentAuthor } from "@/lib/session";
import AuthMenu from "./AuthMenu";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function SiteHeader() {
  const t = await getTranslations();
  const author = await getCurrentAuthor();

  const nav = [
    { href: "/", label: t("nav.timeline") },
    { href: "/encounters", label: t("nav.entries") },
    { href: "/about", label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-tight text-ink">{t("brand.name")}</span>
          <span className="hidden text-xs tracking-widest text-muted sm:inline">
            {t("brand.subtitle")}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-accent-soft hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/encounters/new"
            className="ml-1 rounded bg-ink px-3 py-1.5 text-sm text-paper transition-colors hover:bg-accent"
          >
            {t("nav.write")}
          </Link>
          {/* 没启用登录（演示模式）时不渲染登录入口，否则点了会报错 */}
          {isAuthConfigured ? <AuthMenu author={author} /> : null}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
