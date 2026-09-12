import { authorName, type Author } from "@/lib/types";

/**
 * 头像。
 *
 * 没有作者时（接入登录之前写下的历史记录）给一个中性占位圆：
 * 那条记录不属于任何账号，不该借用谁的昵称或头像。
 */
export default function Avatar({ author, size = 40 }: { author: Author | null; size?: number }) {
  const box = { width: size, height: size };

  if (!author) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full border border-line bg-paper text-muted"
        style={box}
        aria-hidden
      >
        ·
      </span>
    );
  }

  const name = authorName(author);

  if (author.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-line"
        style={box}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
      style={{ ...box, fontSize: Math.round(size * 0.42) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
