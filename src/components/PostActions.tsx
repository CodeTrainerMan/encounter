import { getTranslations } from "next-intl/server";
import { toggleReactionAction } from "@/actions/reactions";
import { Link } from "@/i18n/navigation";
import { localeHref } from "@/i18n/paths";
import { LIKE_EMOJI, authorName, type Locale, type ReactionSummary } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import { HeartIcon, ICON_BOX, OpenIcon, ReplyIcon, ViewsIcon } from "./ActionIcons";

/**
 * 互动条
 * ------------------------------------------------------------
 * 版式照 X 的帖子底部走：一排等距的灰图标，数字跟在图标右边，
 * 悬停时图标和数字一起变成该动作的颜色，图标外面浮出一圈同色的浅底；
 * 点赞过的心是实心粉色——和 X 一样，看颜色就知道自己贴没贴过。
 *
 * 只负责「摆这一排」，不管外边距：留白与位置由调用方决定。
 */

/** 图标外面那层圆：8px 内边距 + 18.75px 图标，正好是 X 的 34.75px 悬停圆 */
const RING = "flex items-center justify-center rounded-full p-2 transition-colors";

/** 数字：等宽，跳数时不会左右抖 */
const COUNT = "text-[13px] leading-none tabular-nums";

/** 一项互动：图标在圆里，数字跟在右边；数字为 0 时只留图标 */
const ITEM = "group inline-flex items-center transition-colors";

export default async function PostActions({
  encounterId,
  slug,
  locale,
  commentCount,
  likeCount,
  liked,
  likedNames,
  otherTop,
  views,
}: {
  encounterId: string;
  slug: string;
  locale: Locale;
  commentCount: number;
  likeCount: number;
  liked: boolean;
  /** 点过赞的人，用于悬浮提示 */
  likedNames: string;
  /** 除 ❤️ 外被贴得最多的表情；没有就空出一个位置，不占位 */
  otherTop: ReactionSummary | null;
  views: number;
}) {
  const t = await getTranslations("feed");
  const tComments = await getTranslations("comments");
  const tReactions = await getTranslations("reactions");

  const href = `/encounters/${encodeURIComponent(slug)}`;

  return (
    <div className="mt-2.5 flex max-w-[26rem] items-center justify-between text-[13px] text-muted">
      {/* 留言：直接落到详情页的留言区 */}
      <Link
        href={`${href}#comments`}
        title={tComments("count", { count: commentCount })}
        className={`${ITEM} -ml-2 hover:text-accent`}
      >
        <span aria-hidden className={`${RING} group-hover:bg-accent-soft`}>
          <ReplyIcon />
        </span>
        {commentCount > 0 ? <span className={COUNT}>{formatCount(commentCount)}</span> : null}
      </Link>

      {/* 点赞：复用表情反应里的 ❤️，和详情页看到的是同一个数 */}
      <form
        action={toggleReactionAction}
        className={liked ? `${ITEM} text-like` : `${ITEM} hover:text-like`}
      >
        <input type="hidden" name="encounterId" value={encounterId} />
        <input type="hidden" name="emoji" value={LIKE_EMOJI} />
        <input type="hidden" name="locale" value={locale} />
        {/* 未登录点这里会先去 Discord 登录，登完再回到时间流 */}
        <input type="hidden" name="returnTo" value={localeHref(locale, "/")} />
        <button
          type="submit"
          aria-pressed={liked}
          title={likedNames ? tReactions("likedBy", { names: likedNames }) : tReactions("like")}
          className="inline-flex cursor-pointer items-center"
        >
          <span aria-hidden className={`${RING} group-hover:bg-like-soft`}>
            <HeartIcon filled={liked} />
          </span>
          {likeCount > 0 ? <span className={COUNT}>{formatCount(likeCount)}</span> : null}
        </button>
      </form>

      {/* 除点赞外贴得最多的那个表情：只是个提示，点它不如去详情页面板里挑 */}
      {otherTop ? (
        <span
          className="inline-flex items-center"
          title={tReactions("whoReacted", { names: otherTop.authors.map(authorName).join(", ") })}
        >
          <span aria-hidden className={RING}>
            <span className={`${ICON_BOX} text-[15px]`}>{otherTop.emoji}</span>
          </span>
          <span className={COUNT}>{formatCount(otherTop.count)}</span>
        </span>
      ) : null}

      {/* 浏览量：只读，不提供点击——这里没有可供钻取的数据 */}
      <span className="inline-flex items-center" title={t("views", { count: formatCount(views) })}>
        <span aria-hidden className={RING}>
          <ViewsIcon />
        </span>
        {views > 0 ? <span className={COUNT}>{formatCount(views)}</span> : null}
      </span>

      <Link href={href} title={t("open")} className={`${ITEM} -mr-2 hover:text-accent`}>
        <span aria-hidden className={`${RING} group-hover:bg-accent-soft`}>
          <OpenIcon />
        </span>
      </Link>
    </div>
  );
}
