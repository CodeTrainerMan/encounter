import { useTranslations } from "next-intl";
import { ENCOUNTER_TYPE_COLORS, type EncounterType } from "@/lib/types";

export default function TypeBadge({ type }: { type: EncounterType }) {
  const t = useTranslations("types");
  const color = ENCOUNTER_TYPE_COLORS[type];

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5 text-[11px] leading-none"
      style={{
        color,
        backgroundColor: `${color}12`,
        borderColor: `${color}33`,
      }}
      title={t(`${type}.description`)}
    >
      {t(`${type}.label`)}
    </span>
  );
}
