import { handlers } from "@/auth";

/**
 * Auth.js 的回调入口。
 *
 * 放在 `[locale]` 之外：这是协议端点，不应该带语言前缀
 * （middleware 的 matcher 也已经排除 `api`，不会被语言路由拦截）。
 */
export const { GET, POST } = handlers;
