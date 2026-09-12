import {
  CommentNotFoundError,
  DatabaseNotConfiguredError,
  EncounterNotFoundError,
  ForbiddenError,
  UnauthenticatedError,
} from "./errors";

/**
 * 表单状态。
 * ------------------------------------------------------------
 * 校验与写入失败都只返回 **消息 key**（对应 `messages/*.json` 的 `errors.*`），
 * 由客户端组件负责翻译，这样服务端不需要知道当前语言。
 *
 * 注意：`"use server"` 文件中只能导出 async 函数，所以这些内容放在普通模块里
 * 供 Server Actions 与客户端组件共同引用。
 */
export interface FormState {
  ok: boolean;
  /** errors.* 下的 key */
  messageKey?: string;
  /** 字段名 → errors.* 下的 key */
  errors?: Record<string, string>;
}

export const initialFormState: FormState = { ok: false };

export function toErrorKey(error: unknown): string {
  if (error instanceof DatabaseNotConfiguredError) return "databaseMissing";
  if (error instanceof EncounterNotFoundError) return "notFound";
  if (error instanceof CommentNotFoundError) return "commentNotFound";
  if (error instanceof UnauthenticatedError) return "signInRequired";
  if (error instanceof ForbiddenError) return "forbidden";
  return "unknown";
}
