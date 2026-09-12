import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import EncounterCard from "@/components/EncounterCard";
import EmptyState from "@/components/EmptyState";
import FilterBar, { type FilterQuery } from "@/components/FilterBar";
import { getAllTags, listEncounters } from "@/lib/encounters";
import {
  DEFAULT_LOCALE,
  isEncounterType,
  isLocale,
  type EncounterType,
  type Locale,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageSearchParams {
  type?: string;
  tag?: string;
  q?: string;
  favorite?: string;
  deleted?: string;
  error?: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PageSearchParams>;
}

const HEADING_KEYS: Record<EncounterType, string> = {
  person: "headingPerson",
  place: "headingPlace",
  work: "headingWork",
  moment: "headingMoment",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("encounters.title"), description: t("encounters.description") };
}

export default async function EncountersPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const query = await searchParams;

  const t = await getTranslations("list");
  const tCount = await getTranslations("count");
  const tErrors = await getTranslations("errors");

  const activeType = isEncounterType(query.type) ? query.type : undefined;

  const current: FilterQuery = {
    type: query.type,
    tag: query.tag,
    q: query.q,
    favorite: query.favorite,
  };

  const [items, tags] = await Promise.all([
    listEncounters({
      type: activeType,
      tag: query.tag?.trim() || undefined,
      query: query.q?.trim() || undefined,
      favoriteOnly: query.favorite === "1",
    }),
    getAllTags(),
  ]);

  const heading = activeType ? t(HEADING_KEYS[activeType]) : t("headingAll");

  const summary = [
    tCount("entries", { count: items.length }),
    query.tag ? t("summaryTag", { tag: query.tag }) : "",
    query.q ? t("summaryQuery", { query: query.q }) : "",
    query.favorite === "1" ? t("summaryFavorite") : "",
  ].join("");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-serif text-2xl text-ink">{heading}</h1>
        <p className="text-sm text-muted">{summary}</p>
      </header>

      {query.deleted ? (
        <p className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
          {t("deleted")}
        </p>
      ) : null}

      {query.error && tErrors.has(query.error) ? (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {tErrors(query.error)}
        </p>
      ) : null}

      <FilterBar current={current} tags={tags} total={items.length} />

      {items.length === 0 ? (
        <EmptyState
          title={t("filterEmptyTitle")}
          description={t("filterEmptyDescription")}
          actionHref="/encounters"
          actionLabel={t("filterEmptyAction")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <EncounterCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
