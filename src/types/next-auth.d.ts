import type { DefaultSession } from "next-auth";

/**
 * 把内部 author id 挂到会话与 token 上。
 * Auth.js 默认的 `Session` 只有 user / expires，这里补一个 `authorId`
 * 指向 `authors` 表，权限判定全靠它。
 */
declare module "next-auth" {
  interface Session {
    authorId?: string | null;
    user?: DefaultSession["user"];
  }
}

/**
 * 注意增强的是 `@auth/core/jwt` 而不是 `next-auth/jwt`：
 * 后者的全部内容就是 `export * from "@auth/core/jwt"`，
 * 对「再导出」做模块增强不会合并到原来的 interface 上，
 * 只会凭空多出一个同名类型，看起来生效了其实读出来还是 unknown。
 */
declare module "@auth/core/jwt" {
  interface JWT {
    authorId?: string | null;
  }
}
