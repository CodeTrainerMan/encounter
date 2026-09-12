import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAuthConfigured } from "@/auth";
import EncounterForm from "@/components/EncounterForm";
import SignInPrompt from "@/components/SignInPrompt";
import { Link } from "@/i18n/navigation";
import { getCurrentAuthor } from "@/lib/session";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/types";

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("new.title"), description: t("new.description") };
}

export default async function NewEncounterPage({ params }: PageParams) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "new" });

  // 写记录必须登录——记录要有归属。演示模式下不拦，
  // 保留原来「能看见表单、提交时提示去配置数据库」的体验。
  const needsSignIn = isAuthConfigured && !(await getCurrentAuthor());

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-xs text-muted transition-colors hover:text-accent">
        {t("back")}
      </Link>
      <h1 className="mt-5 font-serif text-2xl text-ink">{t("title")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("description")}</p>
      <div className="mt-9">
        {needsSignIn ? <SignInPrompt locale={locale} /> : <EncounterForm submitLabel={t("submit")} />}
      </div>
    </div>
  );
}
