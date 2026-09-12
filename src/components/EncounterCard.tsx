import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AuthorByline from "./AuthorByline";
import TypeBadge from "./TypeBadge";
import Rating from "./Rating";
import { excerpt, formatDate } from "@/lib/utils";
import type { Encounter } from "@/lib/types";

export default async function EncounterCard({ item }: { item: Encounter }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const href = `/encounters/${encodeURIComponent(item.slug)}`;

  return (
    <article className="group card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_-12px_rgba(70,50,25,0.35)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
        <TypeBadge type={item.type} />
        <time dateTime={item.happenedAt}>{formatDate(item.happenedAt, locale)}</time>
        {item.location ? <span className="truncate">· {item.location}</span> : null}
        {item.favorite ? <span className="text-accent">{t("detail.favorite")}</span> : null}
        <AuthorByline author={item.author} className="ml-auto" />
      </div>

      <h3 className="mt-3 font-serif text-lg leading-snug text-ink">
        <Link href={href} className="transition-colors group-hover:text-accent">
          {item.title}
        </Link>
      </h3>

      {item.summary ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{excerpt(item.summary, 90)}</p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{excerpt(item.content, 90)}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[11px] text-muted"
          >
            {tag}
          </span>
        ))}
        {item.rating ? <Rating value={item.rating} className="ml-auto" /> : null}
      </div>
    </article>
  );
}
