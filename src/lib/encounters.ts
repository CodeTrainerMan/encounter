import { isDatabaseConfigured, requireDatabase } from "./db";
import { EncounterNotFoundError, ForbiddenError, UnauthenticatedError } from "./errors";
import { canManage } from "./permissions";
import {
  isEncounterType,
  type Author,
  type Encounter,
  type EncounterFilters,
  type EncounterInput,
} from "./types";
import { shortId, slugify, toTimestamp } from "./utils";

/**
 * 数据访问层
 * ------------------------------------------------------------
 * 条目是用户自己写下的内容，不随界面语言变化，所以读写都不需要 locale。
 *
 * 未配置 DATABASE_URL 时：读取一律返回空（让页面渲染空状态而不是报错），
 * 写入则抛出 DatabaseNotConfiguredError。
 *
 * 权限在**这一层**强制，而不是只靠界面隐藏按钮：Server Action 的
 * endpoint 是可以被直接构造请求调用的，按钮藏起来不等于改不了。
 */

interface EncounterRow {
  id: string;
  slug: string;
  title: string;
  type: string;
  happened_at: unknown;
  location: string | null;
  summary: string | null;
  content: string | null;
  tags: string[] | null;
  cover_image: string | null;
  rating: number | null;
  favorite: boolean;
  author_id: string | null;
  created_at: unknown;
  updated_at: unknown;
  /** 以下来自 left join authors，用前缀区分，映射时不必猜哪列属于哪张表 */
  author__id: string | null;
  author__discord_id: string | null;
  author__username: string | null;
  author__display_name: string | null;
  author__avatar_url: string | null;
}

/**
 * 条目 + 作者的统一查询前缀。
 * 用 left join：接入登录之前写入的历史记录没有作者。
 */
const SELECT_ENCOUNTERS = `
  select e.*,
         a.id           as author__id,
         a.discord_id   as author__discord_id,
         a.username     as author__username,
         a.display_name as author__display_name,
         a.avatar_url   as author__avatar_url
  from encounters e
  left join authors a on a.id = e.author_id
`;

function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function mapAuthor(row: EncounterRow): Author | null {
  if (!row.author__id || !row.author__username) return null;
  return {
    id: row.author__id,
    discordId: row.author__discord_id ?? "",
    username: row.author__username,
    displayName: row.author__display_name,
    avatarUrl: row.author__avatar_url,
  };
}

function mapRow(row: EncounterRow): Encounter {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: isEncounterType(row.type) ? row.type : "moment",
    happenedAt: toDateString(row.happened_at),
    location: row.location,
    summary: row.summary,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    coverImage: row.cover_image,
    rating: row.rating ?? null,
    favorite: Boolean(row.favorite),
    authorId: row.author_id,
    author: mapAuthor(row),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  };
}

export async function listEncounters(filters: EncounterFilters = {}): Promise<Encounter[]> {
  // 没配数据库就当作「还没有任何记录」：页面渲染空状态，而不是直接报错
  if (!isDatabaseConfigured) return [];

  const db = requireDatabase();
  const values: unknown[] = [];
  const conditions: string[] = ["true"];

  if (filters.type) {
    values.push(filters.type);
    conditions.push(`e.type = $${values.length}`);
  }
  if (filters.favoriteOnly) {
    conditions.push("e.favorite = true");
  }
  if (filters.tag) {
    values.push(filters.tag);
    conditions.push(`$${values.length} = any(e.tags)`);
  }
  if (filters.query) {
    values.push(`%${filters.query}%`);
    const placeholder = `$${values.length}`;
    conditions.push(
      `(e.title ilike ${placeholder} or coalesce(e.summary, '') ilike ${placeholder}` +
        ` or coalesce(e.content, '') ilike ${placeholder} or coalesce(e.location, '') ilike ${placeholder})`,
    );
  }

  const rows = (await db(
    `${SELECT_ENCOUNTERS} where ${conditions.join(" and ")}
     order by e.happened_at desc, e.created_at desc`,
    values,
  )) as unknown as EncounterRow[];

  return rows.map(mapRow);
}

export async function getEncounterBySlug(slug: string): Promise<Encounter | null> {
  if (!isDatabaseConfigured) return null;

  const db = requireDatabase();
  const rows = (await db(`${SELECT_ENCOUNTERS} where e.slug = $1 limit 1`, [
    decodeURIComponent(slug),
  ])) as unknown as EncounterRow[];

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getEncounterById(id: string): Promise<Encounter | null> {
  if (!isDatabaseConfigured) return null;

  const db = requireDatabase();
  const rows = (await db(`${SELECT_ENCOUNTERS} where e.id = $1 limit 1`, [
    id,
  ])) as unknown as EncounterRow[];

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getAllTags(): Promise<string[]> {
  if (!isDatabaseConfigured) return [];

  const db = requireDatabase();
  const rows = (await db(
    `select tag from (select distinct unnest(tags) as tag from encounters) t order by tag`,
  )) as unknown as Array<{ tag: string }>;

  return rows.map((row) => row.tag);
}

async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const db = requireDatabase();
  let candidate = base;
  let suffix = 0;

  for (;;) {
    const rows = (await db(`select id from encounters where slug = $1 limit 1`, [
      candidate,
    ])) as unknown as Array<{ id: string }>;

    const clash = rows[0];
    if (!clash || clash.id === ignoreId) return candidate;

    suffix += 1;
    candidate = suffix <= 3 ? `${base}-${shortId(3)}` : `${base}-${suffix}`;
  }
}

/** 写入之后按统一前缀重新读一次，拿到带作者的行 */
async function fetchEncounterById(id: string): Promise<Encounter> {
  const db = requireDatabase();
  const rows = (await db(`${SELECT_ENCOUNTERS} where e.id = $1 limit 1`, [
    id,
  ])) as unknown as EncounterRow[];

  if (!rows[0]) throw new EncounterNotFoundError();
  return mapRow(rows[0]);
}

/**
 * 校验「这条记录存在 + 已登录 + 是作者（或管理员）」。
 *
 * 先查库再判断登录，是为了让没配数据库时先抛 DatabaseNotConfiguredError：
 * 否则在没接数据库时会显示「请先登录」，那是个误导人的提示。
 */
async function assertCanManage(id: string, actor: Author | null): Promise<void> {
  const db = requireDatabase();

  const rows = (await db(`select author_id from encounters where id = $1 limit 1`, [
    id,
  ])) as unknown as Array<{ author_id: string | null }>;

  if (!rows[0]) throw new EncounterNotFoundError();
  if (!actor) throw new UnauthenticatedError();
  if (!canManage({ authorId: rows[0].author_id }, actor)) throw new ForbiddenError();
}

export async function createEncounter(input: EncounterInput, authorId: string): Promise<Encounter> {
  const db = requireDatabase();
  const slug = await ensureUniqueSlug(slugify(input.title));

  // 不用 `returning *`：作者来自 join，这里只取 id 再统一读一次
  const inserted = (await db(
    `insert into encounters
      (slug, title, type, happened_at, location, summary, content, tags, cover_image, rating, favorite, author_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning id`,
    [
      slug,
      input.title,
      input.type,
      input.happenedAt,
      input.location || null,
      input.summary || null,
      input.content || null,
      input.tags ?? [],
      input.coverImage || null,
      input.rating ?? null,
      input.favorite ?? false,
      authorId,
    ],
  )) as unknown as Array<{ id: string }>;

  return fetchEncounterById(inserted[0].id);
}

export async function updateEncounter(
  id: string,
  input: EncounterInput,
  actor: Author | null,
): Promise<Encounter> {
  await assertCanManage(id, actor);

  const db = requireDatabase();
  const slug = await ensureUniqueSlug(slugify(input.title), id);

  const rows = (await db(
    `update encounters set
        slug = $2,
        title = $3,
        type = $4,
        happened_at = $5,
        location = $6,
        summary = $7,
        content = $8,
        tags = $9,
        cover_image = $10,
        rating = $11,
        favorite = $12,
        updated_at = now()
      where id = $1
      returning id`,
    [
      id,
      slug,
      input.title,
      input.type,
      input.happenedAt,
      input.location || null,
      input.summary || null,
      input.content || null,
      input.tags ?? [],
      input.coverImage || null,
      input.rating ?? null,
      input.favorite ?? false,
    ],
  )) as unknown as Array<{ id: string }>;

  if (!rows[0]) throw new EncounterNotFoundError();
  return fetchEncounterById(rows[0].id);
}

export async function deleteEncounter(id: string, actor: Author | null): Promise<void> {
  await assertCanManage(id, actor);

  const db = requireDatabase();
  await db(`delete from encounters where id = $1`, [id]);
}

export interface EncounterStats {
  total: number;
  favorites: number;
  byType: Record<string, number>;
  tags: number;
}

export function computeStats(all: Encounter[]): EncounterStats {
  const byType: Record<string, number> = { person: 0, place: 0, work: 0, moment: 0 };

  for (const item of all) {
    byType[item.type] = (byType[item.type] ?? 0) + 1;
  }

  return {
    total: all.length,
    favorites: all.filter((item) => item.favorite).length,
    byType,
    tags: new Set(all.flatMap((item) => item.tags)).size,
  };
}

export async function getStats(): Promise<EncounterStats> {
  return computeStats(await listEncounters());
}
