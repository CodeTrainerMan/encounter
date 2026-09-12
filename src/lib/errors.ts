/**
 * 领域内可预期的错误类型。
 * 放在独立模块里，避免客户端组件为了拿一个错误类型而把数据层打进 bundle。
 */

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured; entries cannot be read or written.");
    this.name = "DatabaseNotConfiguredError";
  }
}

export class EncounterNotFoundError extends Error {
  constructor() {
    super("Encounter not found.");
    this.name = "EncounterNotFoundError";
  }
}

export class CommentNotFoundError extends Error {
  constructor() {
    super("Comment not found.");
    this.name = "CommentNotFoundError";
  }
}

/** 没有登录：需要先通过 Discord 登录 */
export class UnauthenticatedError extends Error {
  constructor() {
    super("Sign in required.");
    this.name = "UnauthenticatedError";
  }
}

/** 已登录但不是这条记录的作者（也不是管理员） */
export class ForbiddenError extends Error {
  constructor() {
    super("You can only change your own entries.");
    this.name = "ForbiddenError";
  }
}
