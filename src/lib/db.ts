import { neon } from "@neondatabase/serverless";
import { DatabaseNotConfiguredError } from "./errors";

/**
 * 数据层入口
 * ------------------------------------------------------------
 * 生产环境（Vercel）通过 DATABASE_URL 连接 Vercel Postgres / Neon；
 * 本地开发可以用 `docker compose up -d` 起一个普通 PostgreSQL。
 *
 * 这两者需要不同的驱动，原因见 `isLocalDatabase` 的注释：
 *   - Neon / Vercel Postgres → `neon()` 的 HTTP 驱动（无连接数压力）
 *   - 本地 Docker Postgres   → node-postgres（标准 TCP）
 * 对外统一成 `sql(text, params)` 一个函数签名，数据访问层不必关心差异。
 *
 * 未配置 DATABASE_URL 时站点没有任何可读可写的数据：读取返回空、写入报错，
 * 页面因此渲染空状态，而不是白屏。
 */

/** 统一查询签名：`sql(text, params)` 返回结果行数组 */
export type Sql = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

const connectionString = process.env.DATABASE_URL?.trim();

export const isDatabaseConfigured = Boolean(connectionString);

/**
 * 是否为本地 / 容器内的普通 PostgreSQL。
 *
 * `neon()` 走的是 Neon 自己的 HTTP 协议（发请求到 `https://<host>/sql`），
 * 连不上只认 TCP 的普通 Postgres —— 会直接 `fetch failed`；
 * 反过来 node-postgres 也可以连 Neon（TCP），但会失去 HTTP 驱动的连接复用，
 * 所以只有本地地址才切到 node-postgres，线上架构保持不变。
 */
function isLocalDatabase(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "db" || // docker compose 内部的服务名
    hostname === "host.docker.internal"
  );
}

/** 让 `pg` 的连接池在 next dev 热更新时不被反复创建（否则会耗尽连接数） */
const globalForDb = globalThis as unknown as {
  encounterPgPool?: Promise<import("pg").Pool>;
};

function createLocalSql(url: string): Sql {
  let pool = globalForDb.encounterPgPool;

  // 延迟 import：线上走 Neon 时不会把 node-postgres 打进服务端产物
  const getPool = (): Promise<import("pg").Pool> => {
    pool ??= import("pg").then(({ Pool }) => new Pool({ connectionString: url, max: 5 }));
    globalForDb.encounterPgPool = pool;
    return pool;
  };

  return async (text, params = []) => {
    const client = await getPool();
    const { rows } = await client.query(text, params as unknown[]);
    return rows as Record<string, unknown>[];
  };
}

export const sql: Sql | null = connectionString
  ? isLocalDatabase(connectionString)
    ? createLocalSql(connectionString)
    : (neon(connectionString) as unknown as Sql)
  : null;

export function requireDatabase(): Sql {
  if (!sql) throw new DatabaseNotConfiguredError();
  return sql;
}
