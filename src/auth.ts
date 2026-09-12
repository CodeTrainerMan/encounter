import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { upsertAuthor } from "./lib/authors";
import { isDatabaseConfigured } from "./lib/db";

/**
 * 登录：Discord OAuth
 * ------------------------------------------------------------
 * 为什么是 Discord 而不是邮箱/密码：这个站点的作者全部来自
 * 一个学英语的 Discord 服务器，用 Discord 登录对他们是零成本，
 * 同时顺便解决了「记录归属」「防刷」「显示头像昵称」三件事。
 *
 * 会话用 JWT（不额外建 sessions 表）：站点只有一种身份来源，
 * 没必要为了会话多维护一张表。首次登录时把 Discord 资料落进
 * authors 表，token 里只放内部的 author id。
 */

const DISCORD_CLIENT_ID = process.env.AUTH_DISCORD_ID;
const DISCORD_CLIENT_SECRET = process.env.AUTH_DISCORD_SECRET;

/**
 * 是否配置好了 Discord 登录。
 *
 * 没配置也能跑：站点退化成「只读 + 不能贴表情」，
 * 这样本地开发、演示模式不必先去 Discord 开发者后台建应用。
 */
export const isAuthConfigured = Boolean(
  process.env.AUTH_SECRET && DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && isDatabaseConfigured,
);

/**
 * Discord `/users/@me` 里我们真正用到的字段。
 * 不继承 Auth.js 的 `Profile`：那个类型的索引签名会把字段解析成 `{}`，
 * 反而让这里的取值拿不到准确类型。
 */
interface DiscordProfile {
  id: string;
  username?: string;
  global_name?: string | null;
  avatar?: string | null;
}

/**
 * 头像地址。动图头像以 `a_` 开头，必须请求 gif，
 * 否则 Discord 会返回一张静止的第一帧。
 */
function discordAvatarUrl(discordId: string, avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  const format = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.${format}?size=64`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * 信任请求的 Host。
   *
   * Auth.js 在 `next dev` 下默认信任 Host，但在生产模式（`next start`、
   * Docker 自托管）下默认**不信任**，会直接抛 `UntrustedHost` 并且
   * `auth()` 读不到会话——表现就是「登录成功但页面始终显示未登录」。
   * Vercel 上会自动信任，只有自托管才会踩到；这里统一打开，
   * 让 `npm run dev` / `npm run start` / Vercel 三种跑法行为一致。
   */
  trustHost: true,
  providers: [
    Discord({
      clientId: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
      // 只申请 identify：这个站点不收集也不使用邮箱
      authorization: { params: { scope: "identify" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    /**
     * 首次登录时落库并记住内部 author id；
     * 后续请求直接读 token，不再查库。
     */
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && isDatabaseConfigured) {
        // callbacks 拿到的是**原始** OAuth 资料（@auth/core 里是
        // `{ ...profileResult, profile }`），所以 username / global_name 都在
        const raw = (profile ?? {}) as DiscordProfile;
        const discordId = raw.id || account.providerAccountId;

        if (discordId) {
          const author = await upsertAuthor({
            discordId,
            // username 是唯一的 @handle，global_name 是展示名，优先用后者
            username: raw.username || raw.global_name || discordId,
            displayName: raw.global_name ?? null,
            avatarUrl: discordAvatarUrl(discordId, raw.avatar),
          });
          token.authorId = author.id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.authorId = token.authorId ?? null;
      return session;
    },
  },
});
