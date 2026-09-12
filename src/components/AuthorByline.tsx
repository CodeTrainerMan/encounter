import { authorName, type Author } from "@/lib/types";

/**
 * 作者署名：头像 + 昵称。
 * 没有作者（接入登录之前的历史记录）时不渲染任何东西。
 */
export default function AuthorByline({
  author,
  className,
}: {
  author: Author | null;
  className?: string;
}) {
  if (!author) return null;

  const name = authorName(author);

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className ?? ""}`}>
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatarUrl}
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] shrink-0 rounded-full border border-line"
        />
      ) : (
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] text-accent">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="truncate">{name}</span>
    </span>
  );
}
