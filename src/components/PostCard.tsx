import { getLocale, getTranslations } from "next-intl/server";
import { toggleReactionAction } from "@/actions/reactions";
import { Link } from "@/i18n/navigation";
import { localeHref } from "@/i18n/paths";
import {
  DEFAULT_LOCALE,
  LIKE_EMOJI,
  authorName,
  isLocale,
  type Encounter,
  type ReactionSummary,
} from "@/lib/types";
import { excerpt, formatMonthDay, toParagraphs } from "@/lib/utils";
import Avatar from "./Avatar";
import TypeBadge from "./TypeBadge";

/**
 * 时间流里的一条。
 *
 * 版式照着 X 的帖子走：头像在左，右边第一行是「谁 · 什么时候」，
 * 下面是内容，最后一行是灰掉的互动条——留言、点赞、其它表情、进详情。
 * 整条帖子只有下边一条 1px 分隔线，悬停时整行加一层极淡的底色。
 *
 * 点赞与留言都能在时间流里直接操作，不必先点进详情页：
 * 一个「遇见」的记录站，回应应该和记录本身一样轻。
 */
export default async function PostCard({
  item,
  reactions,
  commentCount,
}: {
  item: Encounter;
  reactions: ReactionSummary[];
  commentCount: number;
}) {
  const t = await getTranslations("feed");
  const tReactions = await getTranslations("reactions");
  const tComments = await getTranslations("comments");
  const rawLocale = await getLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const href = `/encounters/${encodeURIComponent(item.slug)}`;

  // 快速发帖的标题是从正文首行推导、且可能被截断的，同一句话不该在一条帖子里出现两次
  const paragraphs = toParagraphs(item.content);
  const rest = paragraphs.filter(
    (paragraph, index) =>
      !(index === 0 && paragraph.startsWith(item.title.replace(/…$/, "").trim())),
  );
  const body = excerpt(rest.join(" "), 160);

  const like = reactions.find((reaction) => reaction.emoji === LIKE_EMOJI);
  const likeCount = like?.count ?? 0;
  const liked = like?.reacted ?? false;
  const likedNames = like?.authors.map(authorName).join(", ");

  // ❤️ 已经由点赞按钮承担，这里只提示其它表情；要贴得进详情页的面板
  const otherTop = reactions.find((reaction) => reaction.emoji !== LIKE_EMOJI);

  return (
    <article className="flex gap-3 border-b border-line px-4 py-3 transition-colors hover:bg-hover">
      <Avatar author={item.author} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[15px] leading-5">
          {item.author ? (
            <>
              <span className="truncate font-bold text-ink">{authorName(item.author)}</span>
              <span className="truncate text-muted">@{item.author.username}</span>
            </>
          ) : null}
          <span className="text-muted">·</span>
          <time dateTime={item.happenedAt} className="shrink-0 text-muted">
            {formatMonthDay(item.happenedAt, locale)}
          </time>
          <span className="ml-auto pl-2">
            <TypeBadge type={item.type} />
          </span>
        </div>

        <Link href={href} className="group mt-0.5 block">
          <p className="text-[15px] leading-[1.45] text-ink">
            <span className="font-bold transition-colors group-hover:text-accent">{item.title}</span>
            {body ? <span className="font-normal"> {body}</span> : null}
          </p>
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {item.location ? <span>{t("at", { location: item.location })}</span> : null}

          {/* 标签只是标记：筛选页已经去掉，这里就不再做成入口 */}
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>

        <div className="mt-2.5 flex max-w-[26rem] items-center justify-between text-[13px] text-muted">
          <Link
            href={`${href}#comments`}
            title={tComments("count", { count: commentCount })}
            className="group -ml-2 inline-flex items-center gap-1 transition-colors hover:text-accent"
          >
            <span
              aria-hidden
              className="rounded-full p-1.5 transition-colors group-hover:bg-accent-soft"
            >
              💬
            </span>
            {commentCount > 0 ? <span className="tabular-nums">{commentCount}</span> : null}
          </Link>

          {/* 点赞复用表情反应里的 ❤️：和详情页看到的是同一个数 */}
          <form action={toggleReactionAction} className="group">
            <input type="hidden" name="encounterId" value={item.id} />
            <input type="hidden" name="emoji" value={LIKE_EMOJI} />
            <input type="hidden" name="locale" value={locale} />
            {/* 未登录点这里会先去 Discord 登录，登完再回到时间流 */}
            <input type="hidden" name="returnTo" value={localeHref(locale, "/")} />
            <button
              type="submit"
              aria-pressed={liked}
              title={likedNames ? tReactions("likedBy", { names: likedNames }) : tReactions("like")}
              className={[
                "inline-flex items-center gap-1 transition-colors",
                liked ? "text-accent" : "hover:text-accent",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="rounded-full p-1.5 transition-colors group-hover:bg-accent-soft"
              >
                {LIKE_EMOJI}
              </span>
              {likeCount > 0 ? <span className="tabular-nums">{likeCount}</span> : null}
            </button>
          </form>

          {otherTop ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5"
              title={tReactions("whoReacted", {
                names: otherTop.authors.map(authorName).join(", "),
              })}
            >
              <span aria-hidden>{otherTop.emoji}</span>
              <span className="tabular-nums">{otherTop.count}</span>
            </span>
          ) : null}

          <Link
            href={href}
            title={item.title}
            className="group -mr-2 inline-flex items-center gap-1 transition-colors hover:text-accent"
          >
            <span
              aria-hidden
              className="rounded-full p-1.5 transition-colors group-hover:bg-accent-soft"
            >
              ↗
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
