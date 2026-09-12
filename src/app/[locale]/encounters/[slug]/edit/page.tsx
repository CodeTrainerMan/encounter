import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isAuthConfigured } from "@/auth";
import EncounterForm from "@/components/EncounterForm";
import SignInPrompt from "@/components/SignInPrompt";
import { Link } from "@/i18n/navigation";
import { localeHref } from "@/i18n/paths";
import { getEncounterBySlug } from "@/lib/encounters";
import { canManage } from "@/lib/permissions";
import { getCurrentAuthor } from "@/lib/session";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageParams {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const item = await getEncounterBySlug(slug);
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: item ? t("editOf", { title: item.title }) : t("missing"),
  };
}

export default async function EditEncounterPage({ params }: PageParams) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const item = await getEncounterBySlug(slug);
  if (!item) notFound();

  const t = await getTranslations({ locale, namespace: "edit" });
  const selfHref = `/encounters/${encodeURIComponent(item.slug)}`;

  // 只有作者本人（或管理员）能进编辑页。
  // 没登录先给登录入口；已登录但不是作者就直接当作不存在——
  // 没必要告诉对方「记录在，但不归你」。
  if (isAuthConfigured) {
    const viewer = await getCurrentAuthor();
    if (!viewer) {
      return <SignInPrompt locale={locale} returnTo={localeHref(locale, `${selfHref}/edit`)} />;
    }
    if (!canManage(item, viewer)) notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={selfHref} className="text-xs text-muted transition-colors hover:text-accent">
        {t("back")}
      </Link>
      <h1 className="mt-5 font-serif text-2xl text-ink">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("created", { date: formatDate(item.createdAt.slice(0, 10), locale) })}
      </p>
      <div className="mt-9">
        <EncounterForm encounter={item} submitLabel={t("submit")} />
      </div>
    </div>
  );
}
