import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { isAuthConfigured } from "@/auth";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import { countCommentsFor } from "@/lib/comments";
import { listEncounters } from "@/lib/encounters";
import { getReactionsFor } from "@/lib/reactions";
import { getCurrentAuthor } from "@/lib/session";

export const dynamic = "force-dynamic";

interface PageParams {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deleted?: string; error?: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("home.title"), description: t("home.description") };
}

/**
 * 时间流（首页）
 * ------------------------------------------------------------
 * 版式照 X 走：一列 640px、左右各一条 1px 分隔线的纵列，
 * 顶端是发帖框，下面就是帖子本身——帖子之间也只有一条分隔线，
 * 没有卡片、没有阴影、没有导语区块。
 *
 * 站点只剩这一处内容，所以这里不做任何「导航到别处」的事：
 * 发帖框负责写，帖子负责看，回应（点赞 / 留言）就地完成。
 */
export default async function HomePage({ searchParams }: PageParams) {
  const t = await getTranslations("home");
  const tFeed = await getTranslations("feed");
  const tErrors = await getTranslations("errors");
  const query = await searchParams;

  const [items, viewer] = await Promise.all([listEncounters(), getCurrentAuthor()]);

  const ids = items.map((item) => item.id);
  const [reactions, commentCounts] = await Promise.all([
    getReactionsFor(ids, viewer?.id ?? null),
    countCommentsFor(ids),
  ]);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] sm:border-x sm:border-line">
      {/* 删除记录后会带着 ?deleted=1 回到这里；失败则带 ?error=<errors 下的 key> */}
      {query.deleted ? (
        <p className="border-b border-line bg-hover px-4 py-2.5 text-[13px] text-ink-soft">
          {tFeed("deleted")}
        </p>
      ) : null}

      {query.error && tErrors.has(query.error) ? (
        <p className="border-b border-line bg-hover px-4 py-2.5 text-[13px] text-red-500">
          {tErrors(query.error)}
        </p>
      ) : null}

      <PostComposer author={viewer} authEnabled={isAuthConfigured} />

      {items.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <p className="text-lg font-bold text-ink">{t("emptyTitle")}</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        items.map((item) => (
          <PostCard
            key={item.id}
            item={item}
            reactions={reactions.get(item.id) ?? []}
            commentCount={commentCounts.get(item.id) ?? 0}
          />
        ))
      )}
    </div>
  );
}
