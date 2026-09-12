import { cache } from "react";
import { auth, isAuthConfigured } from "@/auth";
import { getAuthorById } from "./authors";
import type { Author } from "./types";

/**
 * 当前登录的作者，未登录返回 null。
 *
 * 用 React 的 `cache` 包一层：同一次请求里可能有好几个地方要判断权限
 * （页面、Server Action、组件），缓存后只查一次库。
 *
 * 未配置 Discord 登录时直接返回 null，避免在演示模式下调用 `auth()`
 * 抛出「缺少 AUTH_SECRET」这类噪音错误。
 */
export const getCurrentAuthor = cache(async (): Promise<Author | null> => {
  if (!isAuthConfigured) return null;

  const session = await auth();
  const authorId = session?.authorId;
  if (!authorId) return null;

  return getAuthorById(authorId);
});
