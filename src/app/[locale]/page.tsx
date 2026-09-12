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
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("home.title"), description: t("home.description") };
}

/**
 * 首页 = 一条时间流
 * ------------------------------------------------------------
 * 版面参考 X：没有导语式的 hero，也不按年份陈列，
 * 顶部只用一小段说明这个站点是从哪来的，下面直接就是
 * 「发一条 + 看所有」——打开站点就能用。
 *
 * 每条帖子下面可以直接点赞、留言，不必先点进详情页。
 */
export default async function HomePage() {
  const t = await getTranslations("home");

  const [items, viewer] = await Promise.all([listEncounters(), getCurrentAuthor()]);

  const ids = items.map((item) => item.id);
  const [reactions, commentCounts] = await Promise.all([
    getReactionsFor(ids, viewer?.id ?? null),
    countCommentsFor(ids),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <section className="border-b border-line pb-8">
        <p className="text-[11px] tracking-[0.32em] text-muted">{t("eyebrow")}</p>
        <h1 className="mt-4 font-serif text-2xl leading-snug text-ink">{t("headline")}</h1>
        <p className="mt-3 text-sm leading-loose text-ink-soft">{t("designNote")}</p>
      </section>

      <div className="card mt-8 overflow-hidden">
        <PostComposer author={viewer} authEnabled={isAuthConfigured} />

        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-serif text-base text-ink">{t("emptyTitle")}</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
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
    </div>
  );
}
