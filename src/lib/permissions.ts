import type { Author } from "./types";

/**
 * 权限判定（纯函数，无数据库依赖）
 * ------------------------------------------------------------
 * 规则只有一条：**谁写的谁能改**。
 *
 * 另外有一个管理员概念，用途有两个：
 *   1. 删掉别人贴进来的垃圾内容；
 *   2. 接管接入登录之前就已经存在的历史记录——那些记录
 *      `author_id` 为空，按「只有作者能改」的规则谁也动不了。
 *
 * 管理员通过环境变量 `ADMIN_DISCORD_IDS` 配置，而不是在代码或数据库里
 * 写死一个用户名，避免「谁是管理员」这件事散落在多处。
 */

function adminDiscordIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(/[,，\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminAuthor(author: Author | null | undefined): boolean {
  if (!author) return false;
  return adminDiscordIds().includes(author.discordId);
}

/** 能否编辑 / 删除这条记录 */
export function canManage(item: { authorId: string | null }, actor: Author | null): boolean {
  if (!actor) return false;
  return item.authorId === actor.id || isAdminAuthor(actor);
}
