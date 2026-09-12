/**
 * Encounter 领域模型
 * ------------------------------------------------------------
 * 一条 Encounter（遇见）记录一次「我遇见了某个对象」这件事。
 * 对象被归纳为四种类型，便于在首页时间线上快速区分。
 *
 * 注意：类型的显示名称与说明属于界面文案，放在 `messages/*.json`
 * 的 `types.<type>.label` / `types.<type>.description`，此处只保留与
 * 视觉相关的强调色。
 */

export const LOCALES = ["en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

/** 英文为首选语言 */
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export const ENCOUNTER_TYPES = ["person", "place", "work", "moment"] as const;

export type EncounterType = (typeof ENCOUNTER_TYPES)[number];

/** 各类型在徽标、筛选器与时间线节点上的强调色 */
export const ENCOUNTER_TYPE_COLORS: Record<EncounterType, string> = {
  person: "#c2410c",
  place: "#0f766e",
  work: "#6d28d9",
  moment: "#b45309",
};

/**
 * 作者 = 一个 Discord 账号。
 * 只保留展示所需的最小信息，刻意不存邮箱等隐私字段。
 */
export interface Author {
  id: string;
  discordId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

/** 展示用昵称：优先 Discord 的全局昵称，回退到用户名 */
export function authorName(author: Author): string {
  return author.displayName?.trim() || author.username;
}

/**
 * 可贴的表情。
 * 刻意用固定小集合而不是完整 emoji 选择器：这是一个「遇见」的记录站，
 * 一排熟悉的反应比让人翻面板更容易用。
 */
export const REACTION_EMOJIS = ["👋", "❤️", "😂", "👍", "🎉", "🔥"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function isReactionEmoji(value: unknown): value is ReactionEmoji {
  return typeof value === "string" && (REACTION_EMOJIS as readonly string[]).includes(value);
}

/**
 * 时间流里那个「点赞」按钮用的表情。
 *
 * 刻意复用表情反应里已有的 ❤️，而不是另建一张点赞表：
 * 两个入口看到的是同一个数，同一个人也只能算一次。
 */
export const LIKE_EMOJI: ReactionEmoji = "❤️";

/** 一条留言的正文上限，表单与数据层共用同一个值 */
export const MAX_COMMENT_LENGTH = 1000;

/** 一条记录上某个 emoji 的汇总 */
export interface ReactionSummary {
  emoji: string;
  count: number;
  /** 当前查看者是否已经贴过这个 emoji */
  reacted: boolean;
  /** 贴过这个 emoji 的人，用于悬浮显示 */
  authors: Author[];
}

/** 一条留言。留言者一定有账号——没登录就发不出来，所以作者不为空 */
export interface Comment {
  id: string;
  encounterId: string;
  content: string;
  authorId: string;
  author: Author;
  createdAt: string;
}

export interface Encounter {
  id: string;
  /** URL 中使用的唯一短标识 */
  slug: string;
  title: string;
  type: EncounterType;
  /** 遇见发生的日期，格式 YYYY-MM-DD */
  happenedAt: string;
  location: string | null;
  /** 一句话摘要，显示在列表中 */
  summary: string | null;
  /** 正文，纯文本，段落用空行分隔 */
  content: string | null;
  tags: string[];
  coverImage: string | null;
  /** 印象分 1-5，可为空 */
  rating: number | null;
  favorite: boolean;
  /** 作者，为 null 表示是接入登录之前的历史记录（只读） */
  authorId: string | null;
  author: Author | null;
  createdAt: string;
  updatedAt: string;
}

/** 新建 / 编辑表单的输入结构 */
export interface EncounterInput {
  title: string;
  type: EncounterType;
  happenedAt: string;
  location?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  coverImage?: string;
  rating?: number | null;
  favorite?: boolean;
}

export interface EncounterFilters {
  type?: EncounterType;
  tag?: string;
  query?: string;
  favoriteOnly?: boolean;
}

export function isEncounterType(value: unknown): value is EncounterType {
  return typeof value === "string" && (ENCOUNTER_TYPES as readonly string[]).includes(value);
}
