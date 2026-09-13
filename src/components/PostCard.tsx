import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
import PostActions from "./PostActions";
import TypeBadge from "./TypeBadge";

/**
 * 时间流里的一条。
 *
 * 版式照着 X 的帖子走：头像在左，右边第一行是「谁 · 什么时候」，
 * 下面是内容，最后一行是灰掉的互动条（留言、点赞、浏览量、其它表情、进详情）。
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
  const likedNames = like?.authors.map(authorName).join(", ") ?? "";

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

        <PostActions
          encounterId={item.id}
          slug={item.slug}
          locale={locale}
          commentCount={commentCount}
          likeCount={likeCount}
          liked={liked}
          likedNames={likedNames}
          otherTop={otherTop ?? null}
          views={item.views}
        />
      </div>
    </article>
  );
}
