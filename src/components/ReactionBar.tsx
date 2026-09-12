import { getTranslations } from "next-intl/server";
import { toggleReactionAction } from "@/actions/reactions";
import { localeHref } from "@/i18n/paths";
import { REACTION_EMOJIS, authorName, type Locale, type ReactionSummary } from "@/lib/types";

/**
 * 表情反应条
 * ------------------------------------------------------------
 * 服务端组件 + 普通表单：每个 emoji 就是一个 submit 按钮，
 * 点一下直接走 Server Action，不需要任何客户端状态或水合。
 *
 * `interactive` 为 false 时（演示模式，没启用登录）只展示已有的表情，
 * 不提供提交入口——否则点了会因为没有密钥而报错。
 */
export default async function ReactionBar({
  encounterId,
  slug,
  locale,
  reactions,
  interactive,
}: {
  encounterId: string;
  slug: string;
  locale: Locale;
  reactions: ReactionSummary[];
  interactive: boolean;
}) {
  const t = await getTranslations("reactions");

  if (!interactive) {
    if (reactions.length === 0) return null;

    return (
      <div className="mt-8 border-t border-line pt-6">
        <p className="text-xs text-muted">{t("label")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {reactions.map((reaction) => (
            <span
              key={reaction.emoji}
              className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-sm"
              title={t("whoReacted", { names: reaction.authors.map(authorName).join(", ") })}
            >
              <span aria-hidden>{reaction.emoji}</span>
              <span className="text-xs tabular-nums">{reaction.count}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  const byEmoji = new Map(reactions.map((reaction) => [reaction.emoji, reaction]));

  return (
    <div className="mt-8 border-t border-line pt-6">
      <p className="text-xs text-muted">{t("label")}</p>

      <form action={toggleReactionAction} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="encounterId" value={encounterId} />
        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="returnTo"
          value={localeHref(locale, `/encounters/${encodeURIComponent(slug)}`)}
        />

        {REACTION_EMOJIS.map((emoji) => {
          const summary = byEmoji.get(emoji);
          const count = summary?.count ?? 0;
          const reacted = summary?.reacted ?? false;
          const names = summary?.authors.map(authorName).join(", ");

          return (
            <button
              key={emoji}
              type="submit"
              name="emoji"
              value={emoji}
              aria-pressed={reacted}
              title={names ? t("whoReacted", { names }) : t("add")}
              className={[
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors",
                reacted
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-soft hover:border-line-strong hover:bg-accent-soft/60",
              ].join(" ")}
            >
              <span aria-hidden>{emoji}</span>
              {count > 0 ? <span className="text-xs tabular-nums">{count}</span> : null}
            </button>
          );
        })}
      </form>
    </div>
  );
}
