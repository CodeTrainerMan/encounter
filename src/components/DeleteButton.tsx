"use client";

import { useFormStatus } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { deleteEncounterAction } from "@/actions/encounters";

function DeleteSubmit() {
  const { pending } = useFormStatus();
  const t = useTranslations("delete");

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? t("pending") : t("label")}
    </button>
  );
}

export default function DeleteButton({ id }: { id: string }) {
  const t = useTranslations("delete");
  const locale = useLocale();

  return (
    <form
      action={deleteEncounterAction}
      onSubmit={(event) => {
        if (!window.confirm(t("confirm"))) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <DeleteSubmit />
    </form>
  );
}
