"use server";

import { revalidatePath } from "next/cache";
import { createComment, deleteComment } from "@/lib/comments";
import { UnauthenticatedError } from "@/lib/errors";
import { toErrorKey, type FormState } from "@/lib/form-state";
import { getCurrentAuthor } from "@/lib/session";
import { MAX_COMMENT_LENGTH } from "@/lib/types";

/**
 * 留言相关的 Server Actions
 * ------------------------------------------------------------
 * 身份一律从**会话**读，绝不从表单读：表单字段是客户端可以随便改的，
 * 用它判断「谁在说话」等于没有鉴权。
 */

/**
 * 发一条留言。
 *
 * 未登录不在这里跳登录：留言框只在登录后才渲染，
 * 真出现「未登录」说明是构造请求直接打进来的，按错误返回即可。
 */
export async function addCommentAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const encounterId = String(formData.get("encounterId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!encounterId) return { ok: false, messageKey: "notFound" };
  if (!content) return { ok: false, messageKey: "contentRequired" };
  if (content.length > MAX_COMMENT_LENGTH) return { ok: false, messageKey: "contentTooLong" };

  try {
    const author = await getCurrentAuthor();
    if (!author) throw new UnauthenticatedError();
    await createComment(encounterId, author.id, content);
  } catch (error) {
    return { ok: false, messageKey: toErrorKey(error) };
  }

  // 不 redirect：让 useActionState 收到 ok，客户端据此清空输入框，
  // 页面本身由下面的 revalidate 重新渲染，新留言就在列表末尾。
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * 删除留言。
 *
 * 失败不额外报错：留言还在列表里就说明没删掉，重新渲染一遍
 * 本身就是更直接的回执。
 */
export async function deleteCommentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await deleteComment(id, await getCurrentAuthor());
  } catch {
    // 忽略：下面的 revalidate 会把界面带回真实状态
  }

  revalidatePath("/", "layout");
}
