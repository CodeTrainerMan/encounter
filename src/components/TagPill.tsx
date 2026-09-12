import { Link } from "@/i18n/navigation";

export default function TagPill({ tag, active = false }: { tag: string; active?: boolean }) {
  return (
    <Link
      href={{ pathname: "/encounters", query: { tag } }}
      className={
        active
          ? "inline-flex items-center rounded-full border border-accent bg-accent-soft px-2.5 py-0.5 text-xs text-accent"
          : "inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-ink-soft"
      }
    >
      {tag}
    </Link>
  );
}
