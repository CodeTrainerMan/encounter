import { getLocale, getTranslations } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_COLORS } from "@/lib/types";

export interface FilterQuery {
  type?: string;
  tag?: string;
  q?: string;
  favorite?: string;
}

type FilterHref = { pathname: string; query?: Record<string, string> };

/** 生成带筛选条件的链接，供语言感知的 Link 使用 */
export function buildQuery(current: FilterQuery, patch: FilterQuery): FilterHref {
  const merged: FilterQuery = { ...current, ...patch };
  const query: Record<string, string> = {};

  for (const [key, value] of Object.entries(merged)) {
    if (value) query[key] = value;
  }

  return Object.keys(query).length > 0
    ? { pathname: "/encounters", query }
    : { pathname: "/encounters" };
}

export default async function FilterBar({
  current,
  tags,
  total,
}: {
  current: FilterQuery;
  tags: string[];
  total: number;
}) {
  const t = await getTranslations("list");
  const locale = await getLocale();
  // 原生 GET 表单不经过 next-intl 的 Link，需要手动带上语言前缀
  const searchAction = getPathname({ href: "/encounters", locale });
  const isAll = !current.type;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildQuery(current, { type: undefined })}
          className={
            isAll
              ? "rounded border border-accent bg-accent-soft px-3 py-1.5 text-sm text-accent"
              : "rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong"
          }
        >
          {t("filterAll")}
          <span className="ml-1.5 text-xs text-muted">{total}</span>
        </Link>

        {ENCOUNTER_TYPES.map((type) => {
          const color = ENCOUNTER_TYPE_COLORS[type];
          const active = current.type === type;
          return (
            <Link
              key={type}
              href={buildQuery(current, { type })}
              className={
                active
                  ? "flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm"
                  : "flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong"
              }
              style={
                active
                  ? { borderColor: color, color, backgroundColor: `${color}10` }
                  : undefined
              }
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {t(`heading${type[0].toUpperCase()}${type.slice(1)}`)}
            </Link>
          );
        })}

        <Link
          href={buildQuery(current, { favorite: current.favorite ? undefined : "1" })}
          className={
            current.favorite
              ? "rounded border border-accent bg-accent-soft px-3 py-1.5 text-sm text-accent"
              : "rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong"
          }
        >
          {t("filterFavorite")}
        </Link>

        <form action={searchAction} method="get" className="ml-auto flex items-center gap-2">
          {current.type ? <input type="hidden" name="type" value={current.type} /> : null}
          {current.tag ? <input type="hidden" name="tag" value={current.tag} /> : null}
          {current.favorite ? <input type="hidden" name="favorite" value={current.favorite} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={current.q ?? ""}
            placeholder={t("searchPlaceholder")}
            className="w-44 rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15 sm:w-56"
          />
          <button
            type="submit"
            className="rounded border border-line-strong px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            {t("search")}
          </button>
        </form>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="text-xs text-muted">{t("tagsLabel")}</span>
          {tags.map((tag) => {
            const active = current.tag === tag;
            return (
              <Link
                key={tag}
                href={buildQuery(current, { tag: active ? undefined : tag })}
                className={
                  active
                    ? "rounded-full border border-accent bg-accent-soft px-2.5 py-0.5 text-xs text-accent"
                    : "rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-ink-soft"
                }
              >
                {tag}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
