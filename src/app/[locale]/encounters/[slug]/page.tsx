import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isAuthConfigured } from "@/auth";
import AuthorByline from "@/components/AuthorByline";
import CommentSection from "@/components/CommentSection";
import DeleteButton from "@/components/DeleteButton";
import Rating from "@/components/Rating";
import ReactionBar from "@/components/ReactionBar";
import TypeBadge from "@/components/TypeBadge";
import { Link } from "@/i18n/navigation";
import { listComments } from "@/lib/comments";
import { getEncounterBySlug, listEncounters } from "@/lib/encounters";
import { canManage } from "@/lib/permissions";
import { getReactions } from "@/lib/reactions";
import { getCurrentAuthor } from "@/lib/session";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/types";
import { formatDate, isTitleOnlyBody, toParagraphs } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageParams {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const item = await getEncounterBySlug(slug);
  const t = await getTranslations({ locale, namespace: "meta" });

  if (!item) return { title: t("missing") };
  return { title: item.title, description: item.summary ?? undefined };
}

export default async function EncounterDetailPage({ params }: PageParams) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const item = await getEncounterBySlug(slug);
  if (!item) notFound();

  const t = await getTranslations("detail");
  const tTypes = await getTranslations("types");

  // 当前查看者：决定「编辑 / 删除」是否出现，以及表情按钮是否算「已贴」
  const viewer = await getCurrentAuthor();
  const [reactions, comments] = await Promise.all([
    getReactions(item.id, viewer?.id ?? null),
    listComments(item.id),
  ]);
  const editable = canManage(item, viewer);

  // 相邻条目：列表按时间倒序，index - 1 更新，index + 1 更早
  const all = await listEncounters();
  const index = all.findIndex((row) => row.id === item.id);
  const newer = index > 0 ? all[index - 1] : null;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const paragraphs = toParagraphs(item.content);
  // 快速发帖的标题就是从正文首行推导出来的，两者相同时不再把同一句话渲染两遍
  const showBody = paragraphs.length > 0 && !isTitleOnlyBody(item.content, item.title);
  const selfHref = `/encounters/${encodeURIComponent(item.slug)}`;

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/encounters" className="text-xs text-muted transition-colors hover:text-accent">
        {t("back")}
      </Link>

      <header className="mt-5 space-y-4 border-b border-line pb-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
          <TypeBadge type={item.type} />
          <time dateTime={item.happenedAt}>{formatDate(item.happenedAt, locale)}</time>
          {item.location ? <span>· {item.location}</span> : null}
          {item.favorite ? <span className="text-accent">{t("favorite")}</span> : null}
        </div>

        <h1 className="font-serif text-3xl leading-snug text-ink">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
          <AuthorByline author={item.author} />
          <span>{tTypes(`${item.type}.description`)}</span>
        </div>
        {item.rating ? <Rating value={item.rating} /> : null}
      </header>

      {item.summary ? (
        <blockquote className="mt-8 border-l-2 border-accent/40 pl-4 font-serif text-base leading-loose text-ink-soft">
          {item.summary}
        </blockquote>
      ) : null}

      {item.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.coverImage}
          alt={item.title}
          className="mt-8 w-full rounded border border-line object-cover"
        />
      ) : null}

      {showBody ? (
        <div className="encounter-body mt-9">
          {paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      ) : paragraphs.length === 0 ? (
        <p className="mt-9 text-sm text-muted">{t("noBody")}</p>
      ) : null}

      {item.tags.length > 0 ? (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
          {item.tags.map((tag) => (
            <Link
              key={tag}
              href={{ pathname: "/encounters", query: { tag } }}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
            >
              # {tag}
            </Link>
          ))}
        </div>
      ) : null}

      {/* 表情：任何登录的人都能贴，不要求是作者本人 */}
      <ReactionBar
        encounterId={item.id}
        slug={item.slug}
        locale={locale}
        reactions={reactions}
        interactive={isAuthConfigured}
      />

      {/* 留言：同样不要求是作者本人，登录了就能说话 */}
      <CommentSection
        encounterId={item.id}
        slug={item.slug}
        locale={locale}
        viewer={viewer}
        comments={comments}
        authEnabled={isAuthConfigured}
      />

      <div className="mt-8 flex items-center gap-3">
        {/* 按钮按权限显隐；真正的拦截在数据层——藏起来不等于改不了 */}
        {editable ? (
          <>
            <Link
              href={`${selfHref}/edit`}
              className="rounded border border-line-strong px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              {t("edit")}
            </Link>
            <DeleteButton id={item.id} />
          </>
        ) : null}
        <span className="ml-auto text-xs text-muted">
          {t("created", { date: formatDate(item.createdAt.slice(0, 10), locale) })}
        </span>
      </div>

      <nav className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {older ? (
          <Link
            href={`/encounters/${encodeURIComponent(older.slug)}`}
            className="group rounded border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong"
          >
            <span className="text-[11px] text-muted">{t("older")}</span>
            <span className="mt-1 block truncate font-serif text-sm text-ink group-hover:text-accent">
              {older.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link
            href={`/encounters/${encodeURIComponent(newer.slug)}`}
            className="group rounded border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong sm:text-right"
          >
            <span className="text-[11px] text-muted">{t("newer")}</span>
            <span className="mt-1 block truncate font-serif text-sm text-ink group-hover:text-accent">
              {newer.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
