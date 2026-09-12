"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { saveEncounterAction } from "@/actions/encounters";
import { initialFormState, type FormState } from "@/lib/form-state";
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_COLORS, type Encounter } from "@/lib/types";
import { todayISO } from "@/lib/utils";

const fieldClass =
  "w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

const labelClass = "mb-1.5 block text-xs font-medium tracking-wide text-muted";

export default function EncounterForm({
  encounter,
  submitLabel,
}: {
  encounter?: Encounter;
  submitLabel: string;
}) {
  const t = useTranslations("form");
  const tErrors = useTranslations("errors");
  const tTypes = useTranslations("types");
  const locale = useLocale();

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveEncounterAction,
    initialFormState,
  );

  const currentType = encounter?.type ?? "moment";

  const fieldError = (code?: string) =>
    code ? <p className="mt-1.5 text-xs text-red-600">{tErrors(code)}</p> : null;

  return (
    <form action={formAction} className="space-y-7">
      {encounter ? <input type="hidden" name="id" value={encounter.id} /> : null}
      {/* 语言随表单提交，保证跳转后仍停留在当前语言 */}
      <input type="hidden" name="locale" value={locale} />

      {state.messageKey ? (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {tErrors(state.messageKey)}
        </p>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="title">
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          defaultValue={encounter?.title ?? ""}
          placeholder={t("titlePlaceholder")}
          autoComplete="off"
          className={`${fieldClass} font-serif text-base`}
        />
        {fieldError(state.errors?.title)}
      </div>

      <div>
        <span className={labelClass}>{t("typeLegend")}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ENCOUNTER_TYPES.map((type) => {
            const color = ENCOUNTER_TYPE_COLORS[type];
            return (
              <label key={type} className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  defaultChecked={currentType === type}
                  className="peer sr-only"
                />
                <span className="flex flex-col gap-1 rounded border border-line bg-surface px-3 py-2.5 transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-focus-visible:ring-2 peer-focus-visible:ring-accent/20">
                  <span className="flex items-center gap-1.5 text-sm text-ink-soft peer-checked:text-accent">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {tTypes(`${type}.label`)}
                  </span>
                  <span className="text-[11px] leading-tight text-muted">
                    {tTypes(`${type}.description`)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="happenedAt">
            {t("date")}
          </label>
          <input
            id="happenedAt"
            name="happenedAt"
            type="date"
            defaultValue={encounter?.happenedAt ?? todayISO()}
            className={fieldClass}
          />
          {fieldError(state.errors?.happenedAt)}
        </div>
        <div>
          <label className={labelClass} htmlFor="location">
            {t("location")}
          </label>
          <input
            id="location"
            name="location"
            defaultValue={encounter?.location ?? ""}
            placeholder={t("locationPlaceholder")}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="summary">
          {t("summary")}
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          defaultValue={encounter?.summary ?? ""}
          placeholder={t("summaryPlaceholder")}
          className={`${fieldClass} resize-y leading-relaxed`}
        />
        {fieldError(state.errors?.summary)}
      </div>

      <div>
        <label className={labelClass} htmlFor="content">
          {t("content")}
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          defaultValue={encounter?.content ?? ""}
          placeholder={t("contentPlaceholder")}
          className={`${fieldClass} resize-y leading-loose`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="tags">
            {t("tags")}
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={encounter?.tags.join(", ") ?? ""}
            placeholder={t("tagsPlaceholder")}
            autoComplete="off"
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="rating">
            {t("rating")}
          </label>
          <select
            id="rating"
            name="rating"
            defaultValue={encounter?.rating ? String(encounter.rating) : ""}
            className={fieldClass}
          >
            <option value="">{t("ratingNone")}</option>
            {[1, 2, 3, 4, 5].map((score) => (
              <option key={score} value={score}>
                {"★".repeat(score)}
                {"☆".repeat(5 - score)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="coverImage">
          {t("cover")}
        </label>
        <input
          id="coverImage"
          name="coverImage"
          defaultValue={encounter?.coverImage ?? ""}
          placeholder="https://..."
          autoComplete="off"
          className={fieldClass}
        />
        {fieldError(state.errors?.coverImage)}
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="favorite"
          defaultChecked={encounter?.favorite ?? false}
          className="h-4 w-4 accent-[#b45309]"
        />
        {t("favorite")}
      </label>

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-ink px-5 py-2 text-sm text-paper transition-colors hover:bg-accent disabled:opacity-60"
        >
          {pending ? t("submitPending") : submitLabel}
        </button>
        <span className="text-xs text-muted">{t("note")}</span>
      </div>
    </form>
  );
}
