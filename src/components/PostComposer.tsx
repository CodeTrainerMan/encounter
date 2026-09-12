"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signInWithDiscordAction } from "@/actions/auth";
import { postEncounterAction } from "@/actions/encounters";
import { usePathname } from "@/i18n/navigation";
import { localeHref } from "@/i18n/paths";
import { initialFormState, type FormState } from "@/lib/form-state";
import {
  DEFAULT_LOCALE,
  ENCOUNTER_TYPES,
  ENCOUNTER_TYPE_COLORS,
  isLocale,
  type Author,
  type EncounterType,
} from "@/lib/types";
import { todayISO } from "@/lib/utils";
import Avatar from "./Avatar";

const fieldClass =
  "w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

const labelClass = "mb-1.5 block text-xs font-medium tracking-wide text-muted";

/**
 * 首页发帖框。
 * ------------------------------------------------------------
 * 默认只有一行输入 + 发布按钮：打开站点就能发一条，不必先填一整张表。
 * 「更多选项」里才露出类型、日期、地点、标签——它们都有默认值，
 * 不展开也能正常发布。
 *
 * 未登录时这里变成登录入口，而不是给一个点了必然失败的按钮。
 */
export default function PostComposer({
  author,
  authEnabled,
}: {
  author: Author | null;
  authEnabled: boolean;
}) {
  const t = useTranslations("composer");
  const tErrors = useTranslations("errors");
  const tTypes = useTranslations("types");
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const pathname = usePathname();

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    postEncounterAction,
    initialFormState,
  );
  const [body, setBody] = useState("");
  const [type, setType] = useState<EncounterType>("moment");
  const [expanded, setExpanded] = useState(false);

  // 没配置 Discord 登录：谁都发不了，直接说明，不画一个点了会报错的按钮
  if (!authEnabled) {
    return (
      <p className="border-b border-line px-4 py-4 text-sm leading-relaxed text-muted sm:px-5">
        {t("disabled")}
      </p>
    );
  }

  if (!author) {
    return (
      <form
        action={signInWithDiscordAction}
        className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-5"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="returnTo" value={localeHref(locale, pathname)} />
        <Avatar author={null} />
        <span className="min-w-0 flex-1 text-sm text-muted">{t("signInHint")}</span>
        <button
          type="submit"
          className="shrink-0 whitespace-nowrap rounded bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent"
        >
          {t("signIn")}
        </button>
      </form>
    );
  }

  return (
    <form action={formAction} className="border-b border-line px-4 py-4 sm:px-5">
      <input type="hidden" name="locale" value={locale} />

      <div className="flex gap-3">
        <Avatar author={author} />

        <div className="min-w-0 flex-1">
          <textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={expanded ? 5 : 2}
            placeholder={t("placeholder")}
            className="w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted/70"
          />

          {expanded ? (
            <div className="mt-3 space-y-4 border-t border-line pt-4">
              <div>
                <span className={labelClass}>{t("typeLabel")}</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ENCOUNTER_TYPES.map((value) => {
                    const color = ENCOUNTER_TYPE_COLORS[value];
                    return (
                      <label key={value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value={value}
                          checked={type === value}
                          onChange={() => setType(value)}
                          className="peer sr-only"
                        />
                        <span className="flex items-center gap-1.5 rounded border border-line px-3 py-2 text-sm text-ink-soft transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/20">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {tTypes(`${value}.label`)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="post-happenedAt">
                    {t("date")}
                  </label>
                  <input
                    id="post-happenedAt"
                    name="happenedAt"
                    type="date"
                    defaultValue={todayISO()}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="post-location">
                    {t("location")}
                  </label>
                  <input
                    id="post-location"
                    name="location"
                    placeholder={t("locationPlaceholder")}
                    autoComplete="off"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="post-tags">
                  {t("tags")}
                </label>
                <input
                  id="post-tags"
                  name="tags"
                  placeholder={t("tagsPlaceholder")}
                  autoComplete="off"
                  className={fieldClass}
                />
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="favorite" className="h-4 w-4 accent-[#b45309]" />
                {t("favorite")}
              </label>
            </div>
          ) : null}

          {state.messageKey ? (
            <p className="mt-2 text-xs text-red-600">{tErrors(state.messageKey)}</p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className="text-xs text-muted transition-colors hover:text-accent"
            >
              {expanded ? t("less") : t("more")}
            </button>

            <button
              type="submit"
              disabled={pending || body.trim().length === 0}
              className="rounded bg-ink px-5 py-2 text-sm text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? t("posting") : t("post")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
