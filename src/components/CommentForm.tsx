"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { addCommentAction } from "@/actions/comments";
import { initialFormState, type FormState } from "@/lib/form-state";
import { MAX_COMMENT_LENGTH } from "@/lib/types";

/**
 * 留言框。
 *
 * 只在已登录时渲染（未登录由 CommentSection 换成登录入口），
 * 所以这里不需要处理「没登录」的引导。
 */
export default function CommentForm({ encounterId }: { encounterId: string }) {
  const t = useTranslations("comments");
  const tErrors = useTranslations("errors");

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    addCommentAction,
    initialFormState,
  );
  const [content, setContent] = useState("");

  // 发送成功后清空输入框。state 每次都是新对象，所以连发两条也都能触发。
  useEffect(() => {
    if (state.ok) setContent("");
  }, [state]);

  return (
    <form action={formAction} className="mt-5">
      <input type="hidden" name="encounterId" value={encounterId} />

      <textarea
        name="content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={2}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={t("placeholder")}
        className="w-full resize-none rounded border border-line bg-paper px-3 py-2 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
      />

      {state.messageKey ? (
        <p className="mt-2 text-xs text-red-600">{tErrors(state.messageKey)}</p>
      ) : null}

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending || content.trim().length === 0}
          className="rounded bg-ink px-4 py-1.5 text-sm text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t("posting") : t("post")}
        </button>
      </div>
    </form>
  );
}
