# Encounter · 遇见记录

[English](./README.md) · **中文**

记录每一次遇见：人、地方、作品，以及那些一闪而过的瞬间。

界面提供 **English（默认）** 与 **中文** 两套语言。

- 首页时间流：整站就是这一条时间流——X 风格的纵列，顶栏、发帖框，下面就是全部记录
- 快速发帖：只写正文就能发布，标题由正文首行推导，类型 / 日期 / 地点 / 标签收在「更多选项」里
- 时间流内互动：点赞、留言直接在帖子里完成，不必点进详情页
- 浏览量：每被真正打开一次就 +1，评论、点赞、浏览量排在同一条 X 式互动条上
- 详情页：正文、标签、印象分、上下一条导航、表情反应、编辑与删除
- 写记录：类型、日期、地点、摘要、正文、标签、评分、封面图、收藏
- 登录：Discord OAuth（Auth.js），记录带作者署名与头像，**谁写的谁能改**
- 表情反应：给任意一条记录贴一个 emoji（👋 ❤️ 😂 👍 🎉 🔥），类似 Discord reaction

整站基于 **Next.js（App Router + Server Components + Server Actions）**，
数据存在 **PostgreSQL**（Vercel Postgres / Neon），国际化使用 **next-intl**，
登录使用 **Auth.js（NextAuth v5）** 的 Discord Provider，
部署在 **Vercel**，没有额外的后端服务。

## 设计

版式照 X 走：640px 一列、56px 悬浮顶栏、一个内联发帖框，帖子之间用 1px 分隔线而不是卡片。
配色是 X 那样的纯白，另加一套跟随 `prefers-color-scheme` 的深色主题。

每条帖子下面都是 X 的那排互动：回复、点赞、浏览量、打开。图标外面一层圆在悬停时染上该动作自己的
颜色，旁边的数字跟着变色，点过赞的心是实心粉色。计数一万以下给准确值（`1,234`），再往上缩写成
`12.4K`（`src/lib/utils.ts` 的 `formatCount`）。

换肤靠 `src/app/globals.css` 里在这条媒体查询中覆盖设计令牌实现。Tailwind 的工具类在运行时读取
`var(--color-*)`，所以组件只写 `bg-paper` / `text-ink` / `border-line`，任何地方都不需要 `dark:`
变体。

---

## 快速开始

内容全部存在数据库里，所以先起一个库：

```bash
npm install
docker compose up -d            # 起一个本地 PostgreSQL（宿主机端口 5433）
cp .env.example .env.local      # 填入本地连接串，见下方「接入数据库」
npm run db:init                 # 建表
npm run dev
```

打开 http://localhost:3000 。时间流一开始是空的，在上面写下第一条即可。

> 没有配置数据库时站点仍能打开，只是时间流始终为空、也保存不了内容——不会白屏。

想启用登录与表情（写下自己的记录、给别人的记录贴 emoji），再按「登录与表情」一节
补上 Discord OAuth 的三个必填环境变量（外加可选的 `ADMIN_DISCORD_IDS`），然后重启 `npm run dev`。

## 国际化

英文为默认语言，中文走 `/zh` 前缀。全站只有时间流、单条记录的详情页与整表单页：

| 路径 | 语言 |
| --- | --- |
| `/`、`/encounters/<slug>`、`/encounters/<slug>/edit`、`/encounters/new` | English |
| `/zh`、`/zh/encounters/<slug>`、`/zh/encounters/<slug>/edit`、`/zh/encounters/new` | 中文 |

实现要点：

- 文案集中在 `messages/en.json` 与 `messages/zh.json`，按 `meta` / `brand` / `home` /
  `composer` / `feed` / `detail` / `form` / `errors` 等命名空间组织
- 语言清单在 `src/lib/types.ts` 的 `LOCALES`，路由策略在 `src/i18n/routing.ts`；
  `localePrefix: "as-needed"` 让默认语言（英文）不出现前缀
- `src/middleware.ts` 负责识别并重定向语言，`src/i18n/navigation.ts` 导出的
  `Link` / `redirect` / `useRouter` 会自动补上正确前缀，因此组件里不必手写 `/zh`
- 日期用 `Intl.DateTimeFormat` 按语言格式化：`April 12, 2026` / `2026年4月12日`
- 表单校验与写入错误在服务端**只返回消息 key**（如 `errors.titleRequired`、
  `errors.databaseMissing`），由客户端组件翻译，服务端不需要知道当前语言
- 写入跳转通过表单隐藏字段携带当前语言，保证提交后停留在同一语言
- `sitemap.xml` 为两种语言分别生成条目并带上 `hreflang` alternates

### 新增一种语言

1. 在 `src/lib/types.ts` 的 `LOCALES` 中加入语言代码，
   并在 `src/lib/utils.ts` 的 `INTL_TAGS` 补上对应的 BCP 47 标签（如 `ja` → `ja-JP`）
2. 复制 `messages/en.json` 为 `messages/<locale>.json` 并翻译

## 登录与表情（Discord OAuth）

记录要「归某个人所有」，才能做到只让作者改删自己的内容。这里的用户全部来自
同一个 Discord 服务器，所以直接用 Discord 登录：对他们零成本，同时顺便解决了
**记录归属、防刷、显示头像昵称** 三件事。

站点只申请 `identify` 权限，不读取邮箱；`authors` 表里也只存昵称与头像。

### 本地启用

1. 打开 https://discord.com/developers/applications → **New Application**。
2. 进入 **OAuth2 → Redirects**，添加 `http://localhost:3000/api/auth/callback/discord`
   （线上再补一条 `https://你的域名/api/auth/callback/discord`）。保存后复制
   **Client ID** 与 **Client Secret**。
3. 写入 `.env.local`：

   ```
   AUTH_SECRET=...                    # npx auth secret 或 openssl rand -base64 33 生成
   AUTH_DISCORD_ID=你的_Client_ID
   AUTH_DISCORD_SECRET=你的_Client_Secret
   ADMIN_DISCORD_IDS=你的_Discord_用户ID    # 可选，多个用逗号分隔
   ```

4. 重启 `npm run dev`，导航栏右上角会出现「用 Discord 登录」。

### 降级行为

`AUTH_SECRET` / `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` 缺任意一个（或没有数据库），
站点会自动退化成 **只读**：页面照常浏览，但导航栏不出现登录按钮，首页的发帖框与详情页的表情入口
都会换成登录提示——按钮不会因为缺密钥而变成点了报错的陷阱。

### 权限模型

规则只有一条：**谁写的谁能改**。另有一个管理员概念（`ADMIN_DISCORD_IDS`），用途有两个：

1. 清理别人贴进来的垃圾内容；
2. 接管接入登录之前就已存在、`author_id` 为空的历史记录——按上面那条规则谁也动不了。

权限在**数据层**（`src/lib/encounters.ts` 的 `assertCanManage`）强制，而不是只把按钮藏起来：
Server Action 的 endpoint 可以被直接构造请求调用，界面隐藏不等于改不了。
未登录也可以给任意记录贴表情，点一下会先被送去 Discord 登录、再回到原页面。

## 接入数据库

### 本地开发（Docker）

```bash
docker compose up -d      # 启动 PostgreSQL，映射到宿主机 5433
docker compose down       # 停止（数据保留在 named volume 中）
docker compose down -v    # 停止并清空数据
```

`.env.local` 写入本地连接串：

```
DATABASE_URL=postgresql://encounter:encounter@127.0.0.1:5433/encounter
```

> 用 `127.0.0.1` 而不是 `localhost`：Windows 下 `localhost` 可能解析到 IPv6 `::1`，
> 而 Docker 的端口映射只监听 IPv4，会报 `ETIMEDOUT`。

然后建表，再重启 `npm run dev` 就能发帖了：

```bash
npm run db:init          # 依据 db/schema.sql 建表与索引
```

> `db/schema.sql` 里全部是 `if not exists`，可以安全重复执行。**已经在跑的老库**再执行一次
> `npm run db:init` 即完成迁移：补上 `authors`、`encounter_reactions` 两张表，
> `encounters.views` 浏览量列，以及 `encounters.author_id` 列（旧记录的作者列为空，因此只读，
> 由管理员接管）。

### 线上（Vercel / Neon）

1. 推送到 GitHub，在 Vercel 中 **Import** 该仓库，框架会自动识别为 Next.js，无需额外构建配置。
2. 项目内进入 **Storage → Create Database → Postgres**，创建完成后连接串会自动注入为 `DATABASE_URL`
   （选带 `-pooler` 的 pooled 连接串；`channel_binding` / `sslmode` 参数保留即可）。
3. 在 **Settings → Environment Variables** 补上其余变量——缺失不会报错，只会静默降级：

   | 变量 | 缺失后果 |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | sitemap / robots / og:url 指向 localhost |
   | `AUTH_SECRET` | 导航栏没有登录按钮，站点退化为只读 |
   | `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | 同上 |
   | `ADMIN_DISCORD_IDS` | 无法清理他人内容，也接管不了历史记录 |

   `ADMIN_DISCORD_IDS` 要填 **Discord 用户 ID（一串数字）**，填 @用户名不报错但永远匹配不上。
4. 建表：临时把命令指向该库执行一次 `npm run db:init`，不必改动 `.env.local`：

   ```bash
   DATABASE_URL='线上连接串' npm run db:init
   ```

   Windows PowerShell 下是 `$env:DATABASE_URL='线上连接串'; npm run db:init`。
   跑完记得清掉这个临时变量（`Remove-Item Env:DATABASE_URL`），否则它会覆盖 `.env.local`
   里的本地连接串，之后本地开发就直接写线上库了。
5. 到 Discord 开发者后台 **OAuth2 → Redirects** 补一条
   `https://你的域名/api/auth/callback/discord`，否则线上点登录会报 `redirect_uri` 不合法。
6. 重新部署，线上即可写入记录。

### 关于两种驱动

`neon()` 的 HTTP 驱动只认 Neon 自己的 `/sql` 端点，连不上普通 PostgreSQL。因此
`src/lib/db.ts` 会按连接串判断：本机地址（`127.0.0.1` / `localhost` / `db`）走
node-postgres 标准 TCP，其余（线上）仍走 Neon HTTP 驱动，**线上架构保持不变**。
建表脚本用 node-postgres，本地库与 Neon 都能连。

> 数据库中的条目是用户自己的内容，不随界面语言变化；语言只影响界面文案与日期格式。
> 所以 `/encounters/x` 与 `/zh/encounters/x` 指向同一条记录，切换语言不会跳到不存在的页面。

---

## 目录结构

```
compose.yaml                 本地开发用的 PostgreSQL 容器
messages/en.json             英文文案（默认语言）
messages/zh.json             中文文案
db/schema.sql                建表语句
scripts/db-client.mjs        脚本共用数据库客户端与环境变量加载
scripts/db-init.mjs          建表脚本
src/i18n/                    routing / navigation / request 配置
src/middleware.ts            语言路由中间件
src/app/[locale]/            路由与页面（语言段）
  layout.tsx                 外壳：html lang、顶栏、640px 纵列
  page.tsx                   首页：时间流（发帖框 + 帖子流）
  encounters/[slug]/         详情、编辑
  encounters/new/            新建（整表单）
  not-found.tsx / error.tsx  404 与错误边界
  api/auth/[...nextauth]/    Auth.js 的 Discord 登录回调
src/app/sitemap.ts           双语言 sitemap（含 hreflang alternates）
src/app/robots.ts
src/auth.ts                  Auth.js 配置（Discord Provider、JWT 回调）
src/actions/encounters.ts    Server Actions（发帖 / 保存 / 删除）
src/actions/reactions.ts     Server Actions（贴 / 取消表情）
src/actions/auth.ts          Server Actions（登录 / 退出）
src/components/              UI 组件（含 PostComposer / PostCard / Avatar / LanguageSwitcher / AuthMenu）
src/lib/db.ts                数据库连接与「是否已配置」判定
src/lib/encounters.ts        数据访问层（查询、统计、增删改，含权限校验）
src/lib/reactions.ts         表情反应数据访问层
src/lib/authors.ts           作者（Discord 账号）读 / 写
src/lib/permissions.ts       权限判定纯函数（作者本人 / 管理员）
src/lib/session.ts           读取当前登录作者（React cache 包装）
src/lib/types.ts             领域模型与语言定义
src/lib/form-state.ts        表单状态与错误 key 映射
```

## 数据模型

`encounters` 表：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `slug` | text | URL 唯一标识，由标题生成，冲突时自动追加随机短码 |
| `title` | text | 标题 |
| `type` | text | `person` / `place` / `work` / `moment` |
| `happened_at` | date | 遇见日期 |
| `location` | text | 地点 |
| `summary` | text | 一句话摘要 |
| `content` | text | 正文，空行分段 |
| `tags` | text[] | 标签 |
| `cover_image` | text | 封面图链接 |
| `rating` | int | 印象分 1–5 |
| `favorite` | boolean | 是否标记为值得回看 |
| `views` | int | 浏览量，详情页每被真正打开一次 +1（路由预取不算） |
| `author_id` | uuid | 作者，外键指向 `authors`；为空表示接入登录之前的历史记录（只读） |
| `created_at` / `updated_at` | timestamptz | 时间戳 |

`authors` 表（一个作者 = 一个 Discord 账号，只存展示所需信息）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `discord_id` | text | Discord 用户 ID，唯一；登录时按它 upsert |
| `username` | text | Discord @handle |
| `display_name` | text | 全局昵称，展示时优先用它 |
| `avatar_url` | text | 头像地址（动图头像存 gif 地址） |
| `created_at` / `updated_at` | timestamptz | 时间戳 |

作者注销时记录**不会**被级联删除，而是把 `author_id` 置空（`on delete set null`）——
记录本身是回忆，不应该因为账号问题消失。

`encounter_reactions` 表（表情反应）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `encounter_id` | uuid | 目标记录，`on delete cascade` |
| `author_id` | uuid | 贴表情的人，`on delete cascade` |
| `emoji` | text | 取值限定为 `REACTION_EMOJIS` 中的固定集合 |
| `created_at` | timestamptz | 时间戳 |

唯一索引 `(encounter_id, author_id, emoji)` 保证同一人对同一条记录同一个 emoji 只算一次；
贴 / 取消用「先删，删掉了就结束；没删掉才插入」实现，并发下也不会产生重复行。

## 常用命令

```bash
npm run dev            # 本地开发
npm run build          # 生产构建
npm run start          # 运行生产构建
npm run typecheck      # TypeScript 类型检查
npm run db:init        # 初始化数据库结构
docker compose up -d   # 启动本地 PostgreSQL
docker compose down    # 停止本地 PostgreSQL
```

## 许可证

本项目基于 [MIT 许可证](./LICENSE) 开源。
