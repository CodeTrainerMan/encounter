import { isDatabaseConfigured, requireDatabase } from "./db";
import {
  CommentNotFoundError,
  EncounterNotFoundError,
  ForbiddenError,
  UnauthenticatedError,
} from "./errors";
import { canManage } from "./permissions";
import type { Author, Comment } from "./types";
import { toTimestamp } from "./utils";

/**
 * 留言数据访问
 * ------------------------------------------------------------
 * 留言者一定有账号（没登录发不出来），所以这里用 join 而不是 left join。
 *
 * 删除权限在**这一层**强制，而不是只靠界面隐藏按钮：
 * Server Action 的 endpoint 可以被直接构造请求调用。
 */

interface CommentRow {
  id: string;
  encounter_id: string;
  content: string;
  created_at: unknown;
  author_id: string;
  /** 以下来自 join authors，用前缀区分，映射时不必猜哪列属于哪张表 */
  author__id: string;
  author__discord_id: string | null;
  author__username: string;
  author__display_name: string | null;
  author__avatar_url: string | null;
}

/** 留言 + 作者的统一查询前缀 */
const SELECT_COMMENTS = `
  select c.id,
         c.encounter_id,
         c.content,
         c.created_at,
         c.author_id,
         a.id           as author__id,
         a.discord_id   as author__discord_id,
         a.username     as author__username,
         a.display_name as author__display_name,
         a.avatar_url   as author__avatar_url
  from encounter_comments c
  join authors a on a.id = c.author_id
`;

function mapRow(row: CommentRow): Comment {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    content: row.content,
    authorId: row.author_id,
    author: {
      id: row.author__id,
      discordId: row.author__discord_id ?? "",
      username: row.author__username,
      displayName: row.author__display_name,
      avatarUrl: row.author__avatar_url,
    },
    createdAt: toTimestamp(row.created_at),
  };
}

/** 一条记录下的全部留言，按时间正序——读起来像一段对话 */
export async function listComments(encounterId: string): Promise<Comment[]> {
  if (!isDatabaseConfigured) return [];

  const db = requireDatabase();
  const rows = (await db(`${SELECT_COMMENTS} where c.encounter_id = $1 order by c.created_at`, [
    encounterId,
  ])) as unknown as CommentRow[];

  return rows.map(mapRow);
}

/**
 * 批量取多条记录的留言数。
 * 时间流一屏可能有几十条，按 id 数组一次查完，避免 N+1。
 * 一条留言都没有的记录不会出现在结果里，调用方用 `?? 0` 兜底。
 */
export async function countCommentsFor(encounterIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (!isDatabaseConfigured || encounterIds.length === 0) return result;

  const db = requireDatabase();
  const rows = (await db(
    `select encounter_id, count(*)::int as count
     from encounter_comments
     where encounter_id = any($1::uuid[])
     group by encounter_id`,
    [encounterIds],
  )) as unknown as Array<{ encounter_id: string; count: number }>;

  for (const row of rows) result.set(row.encounter_id, Number(row.count));

  return result;
}

export async function createComment(
  encounterId: string,
  authorId: string,
  content: string,
): Promise<Comment> {
  const db = requireDatabase();

  let inserted: Array<{ id: string }>;
  try {
    inserted = (await db(
      `insert into encounter_comments (encounter_id, author_id, content)
       values ($1, $2, $3)
       returning id`,
      [encounterId, authorId, content],
    )) as unknown as Array<{ id: string }>;
  } catch (error) {
    // 23503 = foreign_key_violation：这条记录在留言提交的一瞬间被删掉了
    if ((error as { code?: string }).code === "23503") throw new EncounterNotFoundError();
    throw error;
  }

  // 重新读一次拿到带作者的行，和记录那边保持同一种写法
  const rows = (await db(`${SELECT_COMMENTS} where c.id = $1 limit 1`, [
    inserted[0].id,
  ])) as unknown as CommentRow[];

  if (!rows[0]) throw new CommentNotFoundError();
  return mapRow(rows[0]);
}

/** 删除留言：只有留言本人或管理员可以删 */
export async function deleteComment(id: string, actor: Author | null): Promise<void> {
  const db = requireDatabase();

  const rows = (await db(`select author_id from encounter_comments where id = $1 limit 1`, [
    id,
  ])) as unknown as Array<{ author_id: string }>;

  if (!rows[0]) throw new CommentNotFoundError();
  if (!actor) throw new UnauthenticatedError();
  if (!canManage({ authorId: rows[0].author_id }, actor)) throw new ForbiddenError();

  await db(`delete from encounter_comments where id = $1`, [id]);
}
