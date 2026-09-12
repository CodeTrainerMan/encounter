/**
 * 建表 / 导入脚本共用的数据库客户端
 * ------------------------------------------------------------
 * 脚本都在本机手动执行，统一用 node-postgres 走标准 TCP：
 * 本地 Docker Postgres 与 Neon / Vercel Postgres 都能连。
 * （Neon 的 HTTP 驱动反而连不上本地库，所以这里不用它。）
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** 读取 .env.local（不存在则退回进程环境变量），缺少连接串时给出可操作的报错 */
export function loadConnectionString() {
  try {
    process.loadEnvFile(resolve(root, ".env.local"));
  } catch {
    // .env.local 不存在时忽略
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("✗ 未找到 DATABASE_URL。");
    console.error("  本地开发：先执行 `docker compose up -d` 启动 Postgres，");
    console.error("  再复制 .env.example 为 .env.local（本地连接串见文件内说明）。");
    process.exit(1);
  }
  return connectionString;
}

/** 返回 `{ sql, close }`；`sql(text, params)` 与 src/lib/db.ts 的签名一致 */
export function createClient(connectionString) {
  const pool = new pg.Pool({ connectionString, max: 1 });

  return {
    sql: async (text, params) => (await pool.query(text, params)).rows,
    close: () => pool.end(),
  };
}
