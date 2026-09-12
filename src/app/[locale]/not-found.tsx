import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <p className="font-serif text-4xl text-ink">{t("code")}</p>
      <h1 className="font-serif text-lg text-ink">{t("title")}</h1>
      <p className="text-sm leading-relaxed text-muted">{t("description")}</p>
      <Link
        href="/"
        className="mt-3 rounded bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent"
      >
        {t("action")}
      </Link>
    </div>
  );
}
