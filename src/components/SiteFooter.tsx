import { getTranslations } from "next-intl/server";

export default async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-10 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>{t("tagline")}</p>
        <p>{t("builtWith")}</p>
      </div>
    </footer>
  );
}
