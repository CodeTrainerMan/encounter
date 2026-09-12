import { isDatabaseConfigured, requireDatabase } from "./db";
import type { Author, ReactionSummary } from "./types";

/**
 * 表情反应数据访问
 * ------------------------------------------------------------
 * 一条记录下面可以贴一组固定 emoji，类似 Discord 的 reaction。
 */

interface ReactionRow {
  encounter_id: string;
  emoji: string;
  count: number;
  reacted: boolean;
  authors: Author[] | null;
}

/**
 * 批量取多条记录的反应汇总。
 * 列表页一屏可能有几十条记录，所以按 id 数组一次查完，避免 N+1。
 * `viewerId` 为 null（未登录）时 `reacted` 一律为 false。
 */
export async function getReactionsFor(
  encounterIds: string[],
  viewerId: string | null = null,
): Promise<Map<string, ReactionSummary[]>> {
  const result = new Map<string, ReactionSummary[]>();
  if (!isDatabaseConfigured || encounterIds.length === 0) return result;

  const db = requireDatabase();

  // json_agg 里直接带上贴表情的人，省掉第二次查询与手工合并
  const rows = (await db(
    `select
       r.encounter_id,
       r.emoji,
       count(*)::int                                as count,
       coalesce(bool_or(r.author_id = $2::uuid), false) as reacted,
       json_agg(
         json_build_object(
           'id',          a.id,
           'discordId',   a.discord_id,
           'username',    a.username,
           'displayName', a.display_name,
           'avatarUrl',   a.avatar_url
         ) order by r.created_at
       ) as authors
     from encounter_reactions r
     join authors a on a.id = r.author_id
     where r.encounter_id = any($1::uuid[])
     group by r.encounter_id, r.emoji
     order by count(*) desc, r.emoji`,
    [encounterIds, viewerId],
  )) as unknown as ReactionRow[];

  for (const row of rows) {
    const list = result.get(row.encounter_id) ?? [];
    list.push({
      emoji: row.emoji,
      count: Number(row.count),
      reacted: Boolean(row.reacted),
      authors: Array.isArray(row.authors) ? row.authors : [],
    });
    result.set(row.encounter_id, list);
  }

  return result;
}

/** 取一条记录的反应汇总 */
export async function getReactions(
  encounterId: string,
  viewerId: string | null = null,
): Promise<ReactionSummary[]> {
  return (await getReactionsFor([encounterId], viewerId)).get(encounterId) ?? [];
}

/**
 * 贴 / 取消一个 emoji。
 *
 * 用「先删，删掉了就结束；没删掉才插入」而不是先查再判断，
 * 这样并发下也不会因为竞态产生重复行；
 * 唯一索引同时兜底（`on conflict do nothing`）。
 */
export async function toggleReaction(
  encounterId: string,
  authorId: string,
  emoji: string,
): Promise<void> {
  const db = requireDatabase();

  const removed = await db(
    `delete from encounter_reactions
     where encounter_id = $1 and author_id = $2 and emoji = $3
     returning id`,
    [encounterId, authorId, emoji],
  );

  if (removed.length > 0) return;

  await db(
    `insert into encounter_reactions (encounter_id, author_id, emoji)
     values ($1, $2, $3)
     on conflict do nothing`,
    [encounterId, authorId, emoji],
  );
}
