/**
 * 初始化数据库结构：node scripts/db-init.mjs （或 npm run db:init）
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, loadConnectionString, root } from "./db-client.mjs";

const connectionString = loadConnectionString();
const { sql, close } = createClient(connectionString);

const schema = readFileSync(resolve(root, "db/schema.sql"), "utf8");
const statements = schema
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

try {
  for (const statement of statements) {
    await sql(statement);
  }

  console.log(`✓ 数据库结构已就绪（执行 ${statements.length} 条语句）`);
} catch (error) {
  console.error(`✗ 建表失败：${error.message}`);
  process.exitCode = 1;
} finally {
  await close();
}
