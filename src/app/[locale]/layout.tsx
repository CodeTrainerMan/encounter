import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import { routing } from "@/i18n/routing";
import { isLocale } from "@/lib/types";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

/**
 * 站点外壳 = 一条顶栏 + 一列内容
 * ------------------------------------------------------------
 * 时间流是唯一的页面，所以这里按时间流的宽度收窄成 640px 一列：
 * 页面不再是「一张大画布」，而是一条贴合的纵列。
 * 横向留白交给各页面自己控制（时间流要贴边，表单页要留白），
 * 外壳只负责居中与宽度。
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body className="flex min-h-screen flex-col antialiased">
        {/* 客户端组件（语言切换、表单、表情等）需要 Provider 才能调用 useTranslations/useLocale；
            在 Server Component 中挂载时自动继承服务端语言与消息。 */}
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-[640px] flex-1 pb-24">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
