import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_COLORS } from "@/lib/types";

interface PageParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("about.title"), description: t("about.description") };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="font-serif text-lg text-ink">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-loose text-ink-soft">{children}</div>
    </section>
  );
}

export default async function AboutPage({ params }: PageParams) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const tTypes = await getTranslations({ locale, namespace: "types" });

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-4">
        <p className="text-[11px] tracking-[0.32em] text-muted">{t("eyebrow")}</p>
        <h1 className="font-serif text-3xl leading-snug text-ink">{t("title")}</h1>
        <p className="text-sm leading-loose text-ink-soft">{t("intro")}</p>
      </header>

      <Section title={t("typesTitle")}>
        <ul className="space-y-3">
          {ENCOUNTER_TYPES.map((type) => (
            <li key={type} className="flex gap-3">
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: ENCOUNTER_TYPE_COLORS[type] }}
              />
              <span>
                <strong className="font-medium text-ink">{tTypes(`${type}.label`)}</strong>
                <span className="mx-2 text-line-strong">|</span>
                {tTypes(`${type}.description`)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("dataTitle")}>
        <p>{t("dataIntro", { envVar: "DATABASE_URL" })}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-ink">{t("dataLiveTitle")}</strong>
            {t("dataLiveBody")}
          </li>
          <li>
            <strong className="font-medium text-ink">{t("dataEmptyTitle")}</strong>
            {t("dataEmptyBody")}
          </li>
        </ul>
      </Section>

      <Section title={t("deployTitle")}>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{t("deployStep1")}</li>
          <li>{t("deployStep2", { envVar: "DATABASE_URL" })}</li>
          <li>{t("deployStep3", { init: "npm run db:init" })}</li>
          <li>{t("deployStep4")}</li>
        </ol>
      </Section>

      <Section title={t("stackTitle")}>
        <p>{t("stackBody")}</p>
      </Section>

      <div className="border-t border-line pt-8">
        <Link
          href="/encounters/new"
          className="inline-block rounded bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent"
        >
          {t("cta")}
        </Link>
      </div>
    </div>
  );
}
