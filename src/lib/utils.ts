import { DEFAULT_LOCALE, type Locale } from "./types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** 把内部语言标记映射到 Intl 使用的 BCP 47 标签 */
const INTL_TAGS: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

/**
 * 生成 URL slug。非 ASCII 字符（如中文）会被保留，
 * 现代浏览器与 Next.js 都能正常处理，链接因此保持可读。
 */
export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "encounter";
}

/** 生成 4 位短随机码，用于保证 slug 唯一 */
export function shortId(length = 4): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** 宽松解析语言标记，未知值回退到默认语言的格式 */
function intlTag(locale: string): string {
  return INTL_TAGS[locale as Locale] ?? INTL_TAGS[DEFAULT_LOCALE];
}

/** 按语言格式化完整日期：en → "April 12, 2024"，zh → "2024年4月12日" */
export function formatDate(value: string, locale: string = DEFAULT_LOCALE): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(intlTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** 按语言格式化月日，用于紧凑场景 */
export function formatMonthDay(value: string, locale: string = DEFAULT_LOCALE): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(intlTag(locale), { month: "long", day: "numeric" }).format(date);
}

export function yearOf(value: string): string {
  return value.slice(0, 4);
}

/**
 * 把驱动返回的时间值统一成 ISO 字符串。
 * node-postgres 给的是 Date，Neon 的 HTTP 驱动给的是字符串，两边都要兜住。
 */
export function toTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** 把纯文本正文拆成段落，保留空行分隔 */
export function toParagraphs(content: string | null): string[] {
  if (!content) return [];
  return content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * 从一条「只写了正文」的帖子里推导标题。
 * 取正文的第一行（超长则截断）：时间流与详情页的标题位需要一个短句。
 */
export function postTitle(body: string, maxLength = 48): string {
  const firstLine = body
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  const flat = (firstLine ?? body).replace(/\s+/g, " ").trim();
  return flat.length > maxLength ? `${flat.slice(0, maxLength)}…` : flat;
}

/**
 * 正文里第一段与标题完全相同时（快速发帖就是这样），
 * 详情页不必把同一句话再渲染一遍。
 */
export function isTitleOnlyBody(content: string | null, title: string): boolean {
  const paragraphs = toParagraphs(content);
  return paragraphs.length === 1 && paragraphs[0] === title.trim();
}

export function excerpt(text: string | null, length = 80): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > length ? `${flat.slice(0, length)}…` : flat;
}

/** 去掉小数点后多余的 0：12.0K → 12K，1.2K 保持原样 */
function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/**
 * 互动计数的显示格式，照 X 的数法：
 * 一万以下给准确数（1,234），再往上缩写成 1.2万 前的 12.3K / 1.2M。
 * 用 K / M 而不是中文的「万」，是因为两种语言下都能一眼读懂。
 */
export function formatCount(value: number): string {
  const count = Math.max(0, Math.trunc(value));

  if (count < 10_000) return count.toLocaleString("en-US");
  if (count < 1_000_000) return `${trimDecimal(count / 1_000)}K`;
  return `${trimDecimal(count / 1_000_000)}M`;
}
