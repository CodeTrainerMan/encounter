import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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
        {/* 客户端组件（语言切换、表单、筛选等）需要 Provider 才能调用 useTranslations/useLocale；
            在 Server Component 中挂载时自动继承服务端语言与消息。 */}
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 pt-8 sm:px-8">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
