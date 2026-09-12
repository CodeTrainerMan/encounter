import { getTranslations } from "next-intl/server";
import { signInWithDiscordAction } from "@/actions/auth";
import { localeHref } from "@/i18n/paths";
import { canManage } from "@/lib/permissions";
import { authorName, type Author, type Comment, type Locale } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Avatar from "./Avatar";
import CommentDeleteButton from "./CommentDeleteButton";
import CommentForm from "./CommentForm";

/**
 * 留言区
 * ------------------------------------------------------------
 * 按时间正序排，读起来像一段对话。
 *
 * 未登录时这里换成登录入口，而不是给一个点了必然失败的输入框——
 * 与首页发帖框保持一致。
 */
export default async function CommentSection({
  encounterId,
  slug,
  locale,
  viewer,
  comments,
  authEnabled,
}: {
  encounterId: string;
  slug: string;
  locale: Locale;
  viewer: Author | null;
  comments: Comment[];
  authEnabled: boolean;
}) {
  const t = await getTranslations("comments");

  return (
    <section id="comments" className="mt-10 scroll-mt-24 border-t border-line pt-6">
      <h2 className="text-xs text-muted">
        {comments.length > 0 ? t("count", { count: comments.length }) : t("label")}
      </h2>

      {comments.length > 0 ? (
        <ul className="mt-5 space-y-5">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar author={comment.author} size={32} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                  <span className="font-semibold text-ink">{authorName(comment.author)}</span>
                  <span className="text-muted">@{comment.author.username}</span>
                  <span className="text-muted">·</span>
                  <time dateTime={comment.createdAt} className="text-muted">
                    {formatDate(comment.createdAt.slice(0, 10), locale)}
                  </time>
                  {canManage(comment, viewer) ? (
                    <CommentDeleteButton id={comment.id} />
                  ) : null}
                </div>

                <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!authEnabled ? (
        <p className="mt-5 text-sm text-muted">{t("disabled")}</p>
      ) : viewer ? (
        <CommentForm encounterId={encounterId} />
      ) : (
        <form
          action={signInWithDiscordAction}
          className="mt-5 flex items-center gap-3 border-t border-line pt-5"
        >
          <input type="hidden" name="locale" value={locale} />
          <input
            type="hidden"
            name="returnTo"
            value={localeHref(locale, `/encounters/${encodeURIComponent(slug)}`)}
          />
          <span className="min-w-0 flex-1 text-sm text-muted">{t("signInHint")}</span>
          <button
            type="submit"
            className="shrink-0 whitespace-nowrap rounded bg-ink px-4 py-1.5 text-sm text-paper transition-colors hover:bg-accent"
          >
            {t("signIn")}
          </button>
        </form>
      )}
    </section>
  );
}
