import { useTranslations } from "next-intl";

export default function Rating({ value, className }: { value: number; className?: string }) {
  const t = useTranslations("form");
  const filled = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span
      className={`inline-flex items-center gap-px text-xs leading-none ${className ?? ""}`}
      aria-label={`${t("rating")} ${filled}/5`}
    >
      <span className="text-accent">{"★".repeat(filled)}</span>
      <span className="text-line-strong">{"★".repeat(5 - filled)}</span>
    </span>
  );
}
