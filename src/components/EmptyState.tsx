import { Link } from "@/i18n/navigation";

export default function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-lg text-muted">
        ◦
      </span>
      <h3 className="font-serif text-lg text-ink">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-2 rounded bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-accent"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
