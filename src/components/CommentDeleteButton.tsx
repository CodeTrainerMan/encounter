"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { deleteCommentAction } from "@/actions/comments";

function DeleteSubmit() {
  const { pending } = useFormStatus();
  const t = useTranslations("comments");

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-muted transition-colors hover:text-red-600 disabled:opacity-50"
    >
      {pending ? t("deletePending") : t("delete")}
    </button>
  );
}

/**
 * 删除单条留言。
 * 只出现在自己能删的留言上（本人或管理员），真正的拦截在数据层。
 */
export default function CommentDeleteButton({ id }: { id: string }) {
  const t = useTranslations("comments");

  return (
    <form
      action={deleteCommentAction}
      onSubmit={(event) => {
        if (!window.confirm(t("deleteConfirm"))) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteSubmit />
    </form>
  );
}
