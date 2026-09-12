"use client";

import { useTranslations } from "next-intl";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <h1 className="font-serif text-lg text-ink">{t("title")}</h1>
      <p className="text-sm leading-relaxed text-muted">{error.message || t("fallback")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent"
      >
        {t("retry")}
      </button>
    </div>
  );
}
