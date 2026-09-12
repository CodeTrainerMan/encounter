import { isDatabaseConfigured, requireDatabase } from "./db";
import type { Author } from "./types";

/**
 * 作者（Discord 身份）数据访问
 * ------------------------------------------------------------
 * 只保存展示需要的最小信息。头像不落盘：Discord 的 CDN 链接已经足够稳定，
 * 存 URL 比存文件省事，而且用户换头像后我们下次登录会自动更新链接。
 */

interface AuthorRow {
  id: string;
  discord_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

function mapAuthor(row: AuthorRow): Author {
  return {
    id: row.id,
    discordId: row.discord_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  };
}

/** 登录时把 Discord 资料写入 / 更新到 authors，返回库里的作者 */
export async function upsertAuthor(input: {
  discordId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}): Promise<Author> {
  const db = requireDatabase();

  const rows = (await db(
    `insert into authors (discord_id, username, display_name, avatar_url)
     values ($1, $2, $3, $4)
     on conflict (discord_id) do update set
       username     = excluded.username,
       display_name = excluded.display_name,
       avatar_url   = excluded.avatar_url,
       updated_at   = now()
     returning *`,
    [input.discordId, input.username, input.displayName, input.avatarUrl],
  )) as unknown as AuthorRow[];

  return mapAuthor(rows[0]);
}

export async function getAuthorById(id: string): Promise<Author | null> {
  if (!isDatabaseConfigured) return null;

  const db = requireDatabase();
  const rows = (await db(`select * from authors where id = $1 limit 1`, [
    id,
  ])) as unknown as AuthorRow[];

  return rows[0] ? mapAuthor(rows[0]) : null;
}
